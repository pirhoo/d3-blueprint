import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

class BarsChart extends D3Blueprint {
  initialize() {
    this.configDefine('xScale', { defaultValue: null });
    this.configDefine('yScale', { defaultValue: null });
    this.configDefine('innerHeight', { defaultValue: 0 });
    this.configDefine('fill', { defaultValue: 'steelblue' });
    this.configDefine('duration', { defaultValue: 750 });
    this.configDefine('rx', { defaultValue: 0 });

    this.layer('bars', this.base, {
      dataBind: (selection, data) => {
        return selection.selectAll('rect').data(data, (d) => d.label);
      },
      insert: (selection) => {
        return selection.append('rect');
      },
      events: {
        enter: (selection) => {
          const xScale = this.config('xScale');
          const innerHeight = this.config('innerHeight');
          selection
            .attr('x', (d) => xScale(d.label))
            .attr('width', xScale.bandwidth())
            .attr('y', innerHeight)
            .attr('height', 0)
            .attr('rx', this.config('rx'))
            .attr('fill', this.config('fill'));
        },
        'enter:transition': (transition) => {
          const yScale = this.config('yScale');
          const innerHeight = this.config('innerHeight');
          transition
            .duration(this.config('duration'))
            .attr('y', (d) => yScale(d.value))
            .attr('height', (d) => innerHeight - yScale(d.value));
        },
        'merge:transition': (transition) => {
          const xScale = this.config('xScale');
          const yScale = this.config('yScale');
          const innerHeight = this.config('innerHeight');
          transition
            .duration(this.config('duration'))
            .attr('x', (d) => xScale(d.label))
            .attr('width', xScale.bandwidth())
            .attr('y', (d) => yScale(d.value))
            .attr('height', (d) => innerHeight - yScale(d.value));
        },
        'exit:transition': (transition) => {
          transition
            .duration(Math.round(this.config('duration') * 0.4))
            .attr('opacity', 0)
            .remove();
        },
      },
    });
  }
}

export { BarsChart };
