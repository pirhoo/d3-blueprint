import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../../..');

export default defineConfig({
  title: 'd3-blueprint',
  description: 'A modern micro-framework for building reusable D3 charts',

  vite: {
    resolve: {
      alias: {
        'd3-blueprint': path.resolve(root, 'src/index.ts'),
      },
    },
  },

  head: [
    ['link', { rel: 'shortcut icon', href: '/images/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/images/favicon.svg' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: 'd3-blueprint' }],
  ],

  themeConfig: {
    logo: '/images/favicon.svg',

    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/examples/reusable-components' },
      { text: 'API', link: '/api/' },
      { text: 'Contributing', link: '/contributing/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
            { text: 'Layers', link: '/guide/layers' },
            { text: 'Config', link: '/guide/config' },
            { text: 'Events', link: '/guide/events' },
            { text: 'Attachments', link: '/guide/attachments' },
            { text: 'Plugins', link: '/guide/plugins' },
          ],
        },
      ],

      '/examples/': [
        {
          text: 'Fundamentals',
          items: [
            { text: 'Reusable Components', link: '/examples/reusable-components' },
            { text: 'Plugins', link: '/examples/plugins' },
            { text: 'Bar Chart', link: '/examples/bar-chart' },
            { text: 'Responsive Bar Chart', link: '/examples/responsive-bar-chart' },
          ],
        },
        {
          text: 'Bar Charts',
          items: [
            { text: 'Horizontal Bar Chart', link: '/examples/horizontal-bar-chart' },
            { text: 'Stacked Columns', link: '/examples/stacked-columns' },
            { text: 'Diverging Bar Chart', link: '/examples/diverging-bar-chart' },
            { text: 'Lollipop Chart', link: '/examples/lollipop-chart' },
          ],
        },
        {
          text: 'Line & Area',
          items: [
            { text: 'Line Chart', link: '/examples/line-chart' },
            { text: 'Multiline Chart', link: '/examples/multiline-chart' },
            { text: 'Area Chart', link: '/examples/area-chart' },
            { text: 'Stacked Area Chart', link: '/examples/stacked-area-chart' },
            { text: 'Slope Chart', link: '/examples/slope-chart' },
            { text: 'Transforming Chart', link: '/examples/transforming-chart' },
          ],
        },
        {
          text: 'Distribution & Comparison',
          items: [
            { text: 'Scatterplot', link: '/examples/scatterplot' },
            { text: 'Histogram', link: '/examples/histogram' },
            { text: 'Donut Chart', link: '/examples/donut-chart' },
          ],
        },
        {
          text: 'Network & Flow',
          items: [
            { text: 'Alluvial Diagram', link: '/examples/alluvial-diagram' },
            { text: 'Arc Diagram', link: '/examples/arc-diagram' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'D3Blueprint', link: '/api/d3-blueprint.d3blueprint' },
            { text: 'Layer', link: '/api/d3-blueprint.layer' },
            { text: 'ConfigManager', link: '/api/d3-blueprint.configmanager' },
            { text: 'ConfigDefineOptions', link: '/api/d3-blueprint.configdefineoptions' },
            { text: 'LayerOptions', link: '/api/d3-blueprint.layeroptions' },
            { text: 'LayerEventMap', link: '/api/d3-blueprint.layereventmap' },
          ],
        },
        {
          text: 'Types',
          items: [
            { text: 'D3Selection', link: '/api/d3-blueprint.d3selection' },
            { text: 'D3Transition', link: '/api/d3-blueprint.d3transition' },
            { text: 'LifecycleHandler', link: '/api/d3-blueprint.lifecyclehandler' },
            { text: 'TransitionHandler', link: '/api/d3-blueprint.transitionhandler' },
            { text: 'LifecycleEventName', link: '/api/d3-blueprint.lifecycleeventname' },
            { text: 'LifecycleEventKey', link: '/api/d3-blueprint.lifecycleeventkey' },
            { text: 'LIFECYCLE_EVENT_NAMES', link: '/api/d3-blueprint.lifecycle_event_names' },
          ],
        },
        {
          text: 'Functions',
          items: [
            { text: 'isValidLifecycleEvent', link: '/api/d3-blueprint.isvalidlifecycleevent' },
            { text: 'assertLifecycleEvent', link: '/api/d3-blueprint.assertlifecycleevent' },
          ],
        },
      ],

      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Guide', link: '/contributing/' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/pirhoo/d3-blueprint' },
    ],
  },
});
