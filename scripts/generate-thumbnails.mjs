#!/usr/bin/env node
/**
 * Generate PNG thumbnails for each chart example page (light + dark mode).
 *
 * Usage:
 *   node scripts/generate-thumbnails.mjs [slug]
 *
 * Prerequisites:
 *   - npx vitepress build docs   (build the docs site first)
 *   - npx playwright install chromium
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, join } from 'node:path';
import { existsSync } from 'node:fs';

const DIST_DIR = resolve(import.meta.dirname, '../docs/.vitepress/dist');
const OUT_DIR = resolve(import.meta.dirname, '../docs/public/thumbnails');

const PAGES = [
  'bar-chart',
  'responsive-bar-chart',
  'horizontal-bar-chart',
  'stacked-columns',
  'diverging-bar-chart',
  'lollipop-chart',
  'line-chart',
  'multiline-chart',
  'area-chart',
  'stacked-area-chart',
  'slope-chart',
  'transforming-chart',
  'scatterplot',
  'histogram',
  'donut-chart',
  'alluvial-diagram',
  'arc-diagram',
  'rounded-bar-chart',
  'step-line-chart',
  'bar-line-combo',
  'sorted-bar-chart',
  'grouped-bar-chart',
  'stacked-bar-line',
  'scatter-trend-line',
  'histogram-density',
  'lollipop-area-range',
  'diverging-lollipop',
  'dual-axis-chart',
  'area-bar-overlay',
  'sparkline-grid',
  'confidence-band-chart',
  'moving-average-chart',
  'gradient-area-chart',
  'bump-chart',
  'normalized-chart',
  'annotated-line-chart',
  'connected-scatterplot',
  'bubble-chart',
  'labeled-bubble-chart',
];

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};

/** Simple static file server for the built docs. */
function startServer(port) {
  return new Promise((resolvePromise) => {
    const server = createServer(async (req, res) => {
      let url = req.url.split('?')[0];
      if (url.endsWith('/')) url += 'index.html';
      if (!extname(url)) url += '.html';

      const filePath = join(DIST_DIR, url);
      try {
        const data = await readFile(filePath);
        const ext = extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => resolvePromise(server));
  });
}

async function capturePage(context, baseUrl, slug, scheme) {
  const suffix = scheme === 'dark' ? '-dark' : '';
  const page = await context.newPage();

  await page.emulateMedia({ colorScheme: scheme });
  await page.goto(`${baseUrl}/examples/${slug}`, { waitUntil: 'networkidle' });

  // VitePress uses prefers-color-scheme to set initial theme, but also
  // stores it in localStorage. Toggle the .dark class to be sure.
  if (scheme === 'dark') {
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(200);
  }

  try {
    await page.waitForSelector('.chart-demo__container svg', { timeout: 8000 });
  } catch {
    console.warn(`  ⚠ No .chart-container svg found on ${slug} (${scheme}), skipping`);
    await page.close();
    return;
  }

  await page.waitForTimeout(2000);

  const container = page.locator('.chart-demo__container').first();
  const outPath = resolve(OUT_DIR, `${slug}${suffix}.png`);
  await container.screenshot({ path: outPath, type: 'png' });
  console.log(`  ✓ ${slug}${suffix}.png`);
  await page.close();
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error('Built docs not found. Run: npx vitepress build docs');
    process.exit(1);
  }

  const PORT = 5199;
  const server = await startServer(PORT);
  const baseUrl = `http://localhost:${PORT}`;
  console.log(`Static server on ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 2,
  });

  const filterSlug = process.argv[2];
  const pages = filterSlug ? [filterSlug] : PAGES;

  if (filterSlug && !PAGES.includes(filterSlug)) {
    console.warn(`⚠ "${filterSlug}" is not in the PAGES list, capturing anyway`);
  }

  for (const slug of pages) {
    console.log(`Capturing ${slug}...`);
    await capturePage(context, baseUrl, slug, 'light');
    await capturePage(context, baseUrl, slug, 'dark');
  }

  await browser.close();
  server.close();
  console.log(`\nDone — ${pages.length * 2} thumbnails in ${OUT_DIR}`);
}

main();
