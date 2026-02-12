<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { select } from 'd3-selection';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

class SimpleList extends D3Blueprint {
  initialize() {
    const list = this.base.append('ul')
      .style('list-style', 'none')
      .style('padding', '0')
      .style('margin', '0');

    this.layer('items', list, {
      dataBind: (selection, data) => {
        return selection.selectAll('li').data(data, (d) => d.label);
      },
      insert: (selection) => selection.append('li'),
      events: {
        enter: (selection) => {
          selection
            .style('padding', '8px 14px')
            .style('margin', '4px 0')
            .style('border-radius', '6px')
            .style('background', 'var(--vp-c-brand-soft)')
            .style('color', 'var(--vp-c-text-1)')
            .style('font-size', '14px')
            .style('opacity', '0');
        },
        'enter:transition': (transition) => {
          transition.duration(400).style('opacity', '1');
        },
        merge: (selection) => {
          selection.text((d) => `${d.label}: ${d.value}`);
        },
        'merge:transition': (transition) => {
          transition.duration(400).style('opacity', '1');
        },
        'exit:transition': (transition) => {
          transition.duration(200).style('opacity', '0').remove();
        },
      },
    });
  }
}

const dataset = [
  { label: 'Apples', value: 10 },
  { label: 'Bananas', value: 7 },
  { label: 'Cherries', value: 15 },
];

const container = ref(null);
let chart = null;
let datasetIndex = 0;
let intervalId;

onMounted(() => {
  if (!container.value) return;
  chart = new SimpleList(select(container.value));
  chart.draw(dataset);
});

onUnmounted(() => {
  chart?.destroy();
});
</script>

<template>
  <div class="chart-demo">
    <div ref="container" class="chart-container list-container" />
    <p class="chart-caption">
      Live preview: data cycles every 3 s
    </p>
  </div>
</template>

<style scoped>
.chart-demo {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.chart-container {
  padding: 16px;
  background: var(--vp-c-bg-soft);
}

.chart-caption {
  margin: 0;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--vp-c-text-3);
  border-top: 1px solid var(--vp-c-divider);
  text-align: center;
}
</style>
