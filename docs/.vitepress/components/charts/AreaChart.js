import { area } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

class AreaChart extends D3Blueprint {
  initialize() {
    this.configDefine('xScale', { defaultValue: null });
    this.configDefine('yScale', { defaultValue: null });
    this.configDefine('xValue', { defaultValue: (d) => d.x });
    this.configDefine('yValue', { defaultValue: (d) => d.value });
    this.configDefine('y0Value', { defaultValue: null });
    this.configDefine('innerHeight', { defaultValue: 0 });
    this.configDefine('curve', { defaultValue: null });
    this.configDefine('fill', { defaultValue: 'var(--vp-c-brand-1)' });
    this.configDefine('fillOpacity', { defaultValue: 0.15 });
    this.configDefine('duration', { defaultValue: 750 });

    this.areaFn = area();

    const areaGroup = this.base.append('g').attr('class', 'area');

    this.layer('area', areaGroup, {
      dataBind: (selection, data) => selection.selectAll('path').data([data]),
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', this.config('fill'))
            .attr('fill-opacity', this.config('fillOpacity'))
            .attr('d', (d) => this.areaFn(d));
        },
        'merge:transition': (transition) => {
          transition
            .duration(this.config('duration'))
            .attr('fill', this.config('fill'))
            .attr('fill-opacity', this.config('fillOpacity'))
            .attr('d', (d) => this.areaFn(d));
        },
      },
    });
  }

  preDraw() {
    const xScale = this.config('xScale');
    const yScale = this.config('yScale');
    if (!xScale || !yScale) return;

    const xValue = this.config('xValue');
    const yValue = this.config('yValue');
    const y0Value = this.config('y0Value');
    const innerHeight = this.config('innerHeight');
    const curve = this.config('curve');

    this.areaFn
      .x((d) => xScale(xValue(d)))
      .y1((d) => yScale(yValue(d)))
      .y0(y0Value ? (d) => yScale(y0Value(d)) : innerHeight);

    if (curve) {
      this.areaFn.curve(curve);
    }
  }
}

export { AreaChart };
