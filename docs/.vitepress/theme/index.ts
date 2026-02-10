import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import BarChartDemo from '../components/BarChartDemo.vue';
import MultiLayerBarChartDemo from '../components/MultiLayerBarChartDemo.vue';
import ResponsiveBarChartDemo from '../components/ResponsiveBarChartDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BarChartDemo', BarChartDemo);
    app.component('MultiLayerBarChartDemo', MultiLayerBarChartDemo);
    app.component('ResponsiveBarChartDemo', ResponsiveBarChartDemo);
  },
} satisfies Theme;
