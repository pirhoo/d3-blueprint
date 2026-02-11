import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './custom.css';
import BarChartDemo from '../components/BarChartDemo.vue';
import ResponsiveBarChartDemo from '../components/ResponsiveBarChartDemo.vue';
import LineChartDemo from '../components/LineChartDemo.vue';
import MultilineChartDemo from '../components/MultilineChartDemo.vue';
import StackedColumnsDemo from '../components/StackedColumnsDemo.vue';
import AreaChartDemo from '../components/AreaChartDemo.vue';
import ScatterplotDemo from '../components/ScatterplotDemo.vue';
import HistogramDemo from '../components/HistogramDemo.vue';
import HorizontalBarChartDemo from '../components/HorizontalBarChartDemo.vue';
import DonutChartDemo from '../components/DonutChartDemo.vue';
import StackedAreaDemo from '../components/StackedAreaDemo.vue';
import LollipopDemo from '../components/LollipopDemo.vue';
import DivergingBarDemo from '../components/DivergingBarDemo.vue';
import SlopeChartDemo from '../components/SlopeChartDemo.vue';
import AlluvialDemo from '../components/AlluvialDemo.vue';
import ArcDiagramDemo from '../components/ArcDiagramDemo.vue';
import TransformingChartDemo from '../components/TransformingChartDemo.vue';
import GuideFirstChartDemo from '../components/GuideFirstChartDemo.vue';
import GuideLifecycleDemo from '../components/GuideLifecycleDemo.vue';
import GuideLayersDemo from '../components/GuideLayersDemo.vue';
import GuideConfigDemo from '../components/GuideConfigDemo.vue';
import GuideEventsDemo from '../components/GuideEventsDemo.vue';
import GuideAttachmentsDemo from '../components/GuideAttachmentsDemo.vue';
import HomeGallery from '../components/HomeGallery.vue';
import HomeWhySection from '../components/HomeWhySection.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('BarChartDemo', BarChartDemo);
    app.component('ResponsiveBarChartDemo', ResponsiveBarChartDemo);
    app.component('LineChartDemo', LineChartDemo);
    app.component('MultilineChartDemo', MultilineChartDemo);
    app.component('StackedColumnsDemo', StackedColumnsDemo);
    app.component('AreaChartDemo', AreaChartDemo);
    app.component('ScatterplotDemo', ScatterplotDemo);
    app.component('HistogramDemo', HistogramDemo);
    app.component('HorizontalBarChartDemo', HorizontalBarChartDemo);
    app.component('DonutChartDemo', DonutChartDemo);
    app.component('StackedAreaDemo', StackedAreaDemo);
    app.component('LollipopDemo', LollipopDemo);
    app.component('DivergingBarDemo', DivergingBarDemo);
    app.component('SlopeChartDemo', SlopeChartDemo);
    app.component('AlluvialDemo', AlluvialDemo);
    app.component('ArcDiagramDemo', ArcDiagramDemo);
    app.component('TransformingChartDemo', TransformingChartDemo);
    app.component('GuideFirstChartDemo', GuideFirstChartDemo);
    app.component('GuideLifecycleDemo', GuideLifecycleDemo);
    app.component('GuideLayersDemo', GuideLayersDemo);
    app.component('GuideConfigDemo', GuideConfigDemo);
    app.component('GuideEventsDemo', GuideEventsDemo);
    app.component('GuideAttachmentsDemo', GuideAttachmentsDemo);
    app.component('HomeGallery', HomeGallery);
    app.component('HomeWhySection', HomeWhySection);
  },
} satisfies Theme;
