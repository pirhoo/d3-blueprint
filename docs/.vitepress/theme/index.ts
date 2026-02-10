import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import BarChartDemo from '../components/BarChartDemo.vue';
import MultiLayerBarChartDemo from '../components/MultiLayerBarChartDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BarChartDemo', BarChartDemo);
    app.component('MultiLayerBarChartDemo', MultiLayerBarChartDemo);
  },
} satisfies Theme;
