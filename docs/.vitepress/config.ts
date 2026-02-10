import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(import.meta.url), '../../..');

export default defineConfig({
  title: 'd3compose',
  description: 'A modern micro-framework for building reusable, composable D3 charts',

  vite: {
    resolve: {
      alias: {
        'd3compose': path.resolve(root, 'src/index.ts'),
      },
    },
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Examples', link: '/examples/bar-chart' },
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
          ],
        },
      ],

      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Bar Chart', link: '/examples/bar-chart' },
            { text: 'Multi-Layer Bar Chart', link: '/examples/multi-layer-bar-chart' },
          ],
        },
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'D3Compose', link: '/api/d3compose.d3compose' },
            { text: 'Layer', link: '/api/d3compose.layer' },
            { text: 'ConfigManager', link: '/api/d3compose.configmanager' },
            { text: 'ConfigDefineOptions', link: '/api/d3compose.configdefineoptions' },
            { text: 'LayerOptions', link: '/api/d3compose.layeroptions' },
            { text: 'LayerEventMap', link: '/api/d3compose.layereventmap' },
          ],
        },
        {
          text: 'Types',
          items: [
            { text: 'D3Selection', link: '/api/d3compose.d3selection' },
            { text: 'D3Transition', link: '/api/d3compose.d3transition' },
            { text: 'LifecycleHandler', link: '/api/d3compose.lifecyclehandler' },
            { text: 'TransitionHandler', link: '/api/d3compose.transitionhandler' },
            { text: 'LifecycleEventName', link: '/api/d3compose.lifecycleeventname' },
            { text: 'LifecycleEventKey', link: '/api/d3compose.lifecycleeventkey' },
            { text: 'LIFECYCLE_EVENT_NAMES', link: '/api/d3compose.lifecycle_event_names' },
          ],
        },
        {
          text: 'Functions',
          items: [
            { text: 'isValidLifecycleEvent', link: '/api/d3compose.isvalidlifecycleevent' },
            { text: 'assertLifecycleEvent', link: '/api/d3compose.assertlifecycleevent' },
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
      { icon: 'github', link: 'https://github.com/nicmosc/d3compose' },
    ],
  },
});
