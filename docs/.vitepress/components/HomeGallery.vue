<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import HomeGalleryEntry from './HomeGalleryEntry.vue';
import HomeGalleryArrow from './HomeGalleryArrow.vue';
import HomeGalleryDots from './HomeGalleryDots.vue';

const thumbnails = [
  // Fundamentals
  { slug: 'bar-chart', label: 'Bar Chart' },
  { slug: 'rounded-bar-chart', label: 'Rounded Bars' },
  { slug: 'sorted-bar-chart', label: 'Sorted Bars' },
  { slug: 'responsive-bar-chart', label: 'Responsive Bar' },
  // Bar Charts
  { slug: 'horizontal-bar-chart', label: 'Horizontal Bars' },
  { slug: 'stacked-columns', label: 'Stacked Columns' },
  { slug: 'grouped-bar-chart', label: 'Grouped Bars' },
  { slug: 'diverging-bar-chart', label: 'Diverging Bars' },
  { slug: 'lollipop-chart', label: 'Lollipop Chart' },
  { slug: 'lollipop-area-range', label: 'Lollipop + Range' },
  { slug: 'diverging-lollipop', label: 'Diverging Lollipop' },
  // Line & Area
  { slug: 'line-chart', label: 'Line Chart' },
  { slug: 'step-line-chart', label: 'Step Line' },
  { slug: 'bar-line-combo', label: 'Bar + Line Combo' },
  { slug: 'stacked-bar-line', label: 'Stacked + Line' },
  { slug: 'dual-axis-chart', label: 'Dual Axis' },
  { slug: 'area-bar-overlay', label: 'Area + Bar' },
  { slug: 'multiline-chart', label: 'Multiline Chart' },
  { slug: 'area-chart', label: 'Area Chart' },
  { slug: 'stacked-area-chart', label: 'Stacked Area' },
  { slug: 'slope-chart', label: 'Slope Chart' },
  { slug: 'transforming-chart', label: 'Transforming Chart' },
  { slug: 'sparkline-grid', label: 'Sparkline Grid' },
  { slug: 'confidence-band-chart', label: 'Confidence Band' },
  { slug: 'moving-average-chart', label: 'Moving Average' },
  { slug: 'gradient-area-chart', label: 'Gradient Area' },
  { slug: 'bump-chart', label: 'Bump Chart' },
  { slug: 'normalized-chart', label: 'Normalized Lines' },
  { slug: 'annotated-line-chart', label: 'Annotated Line' },
  { slug: 'connected-scatterplot', label: 'Connected Scatter' },
  // Distribution & Comparison
  { slug: 'scatterplot', label: 'Scatterplot' },
  { slug: 'scatter-trend-line', label: 'Scatter + Trend' },
  { slug: 'histogram', label: 'Histogram' },
  { slug: 'histogram-density', label: 'Histogram + KDE' },
  { slug: 'donut-chart', label: 'Donut Chart' },
  // Network & Flow
  { slug: 'alluvial-diagram', label: 'Alluvial Diagram' },
  { slug: 'arc-diagram', label: 'Arc Diagram' },
];

const gridRef = ref(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);
const activeIndex = ref(0);

const GAP = 16;

function itemStep(el) {
  return el.clientWidth + GAP;
}

function updateArrows() {
  const el = gridRef.value;
  if (!el) return;
  canScrollLeft.value = el.scrollLeft > 0;
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  if (el.clientWidth > 0) {
    activeIndex.value = Math.min(
      Math.round(el.scrollLeft / itemStep(el)),
      thumbnails.length - 1,
    );
  }
}

function scrollTo(index) {
  const el = gridRef.value;
  if (!el) return;
  el.scrollTo({ left: index * itemStep(el), behavior: 'smooth' });
}

function scroll(direction) {
  const el = gridRef.value;
  if (!el) return;
  el.scrollBy({ left: direction * itemStep(el), behavior: 'smooth' });
}

onMounted(() => {
  const el = gridRef.value;
  if (el) {
    el.addEventListener('scroll', updateArrows, { passive: true });
    updateArrows();
  }
});

onUnmounted(() => {
  const el = gridRef.value;
  if (el) el.removeEventListener('scroll', updateArrows);
});
</script>

<template>
  <div class="gallery">
    <h2 class="gallery__title">Examples</h2>
    <p class="gallery__subtitle">Interactive demos built with d3-blueprint</p>
    <div class="gallery__viewport">
      <HomeGalleryArrow
        v-if="canScrollLeft"
        direction="left"
        @click="scroll(-1)"
      />
      <div ref="gridRef" class="gallery__grid">
        <HomeGalleryEntry
          v-for="t in thumbnails"
          :key="t.slug"
          :slug="t.slug"
          :label="t.label"
        />
      </div>
      <HomeGalleryArrow
        v-if="canScrollRight"
        direction="right"
        @click="scroll(1)"
      />
    </div>
    <HomeGalleryDots
      :count="thumbnails.length"
      :active-index="activeIndex"
      :labels="thumbnails.map(t => t.label)"
    />
  </div>
</template>

<style scoped lang="scss">
.gallery {
  position: relative;
  max-width: 1152px;
  margin: 0 auto;
  padding: 16px 24px;

  @media (min-width: 768px) {
    padding: 16px 0;
  }
  overflow: visible;

  @media (min-width: 768px) {
    overflow: hidden;
  }

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

  &__viewport {
    position: relative;
  }

  &__grid {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding-bottom: 4px;

    &::-webkit-scrollbar {
      display: none;
    }

    > :deep(*) {
      flex: 0 0 100%;
      scroll-snap-align: start;
    }

    @media (min-width: 768px) {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      overflow-x: visible;
      scroll-snap-type: none;
    }
  }
}
</style>
