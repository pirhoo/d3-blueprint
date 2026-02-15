import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

class LegendChart extends D3Blueprint {
  initialize() {
    this.configDefine('items', { defaultValue: [] });
    this.configDefine('itemWidth', { defaultValue: 90 });

    const legendGroup = this.base.append('g').attr('class', 'legend');

    this.layer('legend', legendGroup, {
      dataBind: (selection) => {
        const items = this.config('items');
        return selection.selectAll('.legend-item').data(items, (d) => d.key);
      },
      insert: (selection) => {
        const g = selection.append('g').attr('class', 'legend-item');
        g.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('rx', 2)
          .attr('y', -6);
        g.append('text')
          .attr('x', 16)
          .attr('dy', '0.35em')
          .attr('font-size', '12px');
        return g;
      },
      events: {
        enter: (selection) => {
          const itemWidth = this.config('itemWidth');
          selection.attr('transform', (d, i) => `translate(${i * itemWidth},0)`);
          selection.select('rect').attr('fill', (d) => d.color);
          selection.select('text')
            .text((d) => d.label)
            .attr('fill', 'var(--vp-c-text-2)');
        },
        merge: (selection) => {
          const itemWidth = this.config('itemWidth');
          selection.attr('transform', (d, i) => `translate(${i * itemWidth},0)`);
          selection.select('rect').attr('fill', (d) => d.color);
          selection.select('text').text((d) => d.label);
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('opacity', 0).remove();
        },
      },
    });
  }
}

export { LegendChart };
