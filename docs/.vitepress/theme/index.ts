import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import BarChartDemo from '../components/BarChartDemo.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BarChartDemo', BarChartDemo);
  },
} satisfies Theme;
