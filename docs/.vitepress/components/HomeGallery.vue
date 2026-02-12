<script setup>
import { useData } from 'vitepress';

const { isDark } = useData();

const thumbnails = [
  { slug: 'bar-chart', label: 'Bar Chart' },
  { slug: 'line-chart', label: 'Line Chart' },
  { slug: 'area-chart', label: 'Area Chart' },
  { slug: 'multiline-chart', label: 'Multiline Chart' },
  { slug: 'stacked-columns', label: 'Stacked Columns' },
  { slug: 'stacked-area-chart', label: 'Stacked Area' },
  { slug: 'horizontal-bar-chart', label: 'Horizontal Bars' },
  { slug: 'diverging-bar-chart', label: 'Diverging Bars' },
  { slug: 'donut-chart', label: 'Donut Chart' },
  { slug: 'scatterplot', label: 'Scatterplot' },
  { slug: 'histogram', label: 'Histogram' },
  { slug: 'lollipop-chart', label: 'Lollipop Chart' },
  { slug: 'slope-chart', label: 'Slope Chart' },
  { slug: 'transforming-chart', label: 'Transforming Chart' },
  { slug: 'alluvial-diagram', label: 'Alluvial Diagram' },
  { slug: 'arc-diagram', label: 'Arc Diagram' },
  { slug: 'responsive-bar-chart', label: 'Responsive Bar' },
];
</script>

<template>
  <div class="gallery-wrapper">
    <h2 class="gallery-title">Examples</h2>
    <p class="gallery-subtitle">Interactive demos built with d3-blueprint</p>
    <div class="gallery-grid">
      <a
        v-for="t in thumbnails"
        :key="t.slug"
        :href="`/examples/${t.slug}`"
        class="gallery-item"
      >
        <img
          :src="`/thumbnails/${t.slug}${isDark ? '-dark' : ''}.png`"
          :alt="t.label"
          loading="lazy"
        />
        <span class="gallery-label">{{ t.label }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.gallery-wrapper {
  position: relative;
  max-width: 1152px;
  margin: 0 auto;
  padding: 16px 0;
  overflow: hidden;
}

.gallery-title {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  padding-bottom: 0;
  margin-bottom: 0;
  color: var(--vp-c-text-1);
}

.gallery-subtitle {
  font-size: 16px;
  text-align: center;
  margin: 0;
  margin-bottom: 24px;
  color: var(--vp-c-text-2);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  display: block;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  transition: border-color 0.25s;
  border: 1px solid transparent;
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.gallery-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
}

.gallery-item:hover {
  border-color: var(--vp-c-brand-1);
}
</style>
