<script setup>
import HomeGalleryEntry from './HomeGalleryEntry.vue';

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
  <div class="gallery">
    <h2 class="gallery__title">Examples</h2>
    <p class="gallery__subtitle">Interactive demos built with d3-blueprint</p>
    <div class="gallery__grid">
      <HomeGalleryEntry
        v-for="t in thumbnails"
        :key="t.slug"
        :slug="t.slug"
        :label="t.label"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.gallery {
  position: relative;
  max-width: 1152px;
  margin: 0 auto;
  padding: 16px 0;
  overflow: hidden;

  &__title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    padding-bottom: 0;
    margin-bottom: 0;
    color: var(--vp-c-text-1);
  }

  &__subtitle {
    font-size: 16px;
    text-align: center;
    margin: 0;
    margin-bottom: 24px;
    color: var(--vp-c-text-2);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
}
</style>
