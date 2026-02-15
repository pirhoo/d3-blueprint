import { line } from 'd3-shape';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

class LineChart extends D3Blueprint {
  initialize() {
    this.configDefine('xScale', { defaultValue: null });
    this.configDefine('yScale', { defaultValue: null });
    this.configDefine('xValue', { defaultValue: (d) => d.x });
    this.configDefine('yValue', { defaultValue: (d) => d.value });
    this.configDefine('curve', { defaultValue: null });
    this.configDefine('stroke', { defaultValue: 'var(--vp-c-brand-1)' });
    this.configDefine('strokeWidth', { defaultValue: 2 });
    this.configDefine('strokeDasharray', { defaultValue: null });
    this.configDefine('strokeOpacity', { defaultValue: 1 });
    this.configDefine('showDots', { defaultValue: false });
    this.configDefine('dotRadius', { defaultValue: 3 });
    this.configDefine('defined', { defaultValue: null });
    this.configDefine('duration', { defaultValue: 750 });

    this.lineFn = line();

    const lineGroup = this.base.append('g').attr('class', 'line');

    this.layer('line', lineGroup, {
      dataBind: (selection, data) => selection.selectAll('path').data([data]),
      insert: (selection) => selection.append('path'),
      events: {
        enter: (selection) => {
          selection
            .attr('fill', 'none')
            .attr('stroke', this.config('stroke'))
            .attr('stroke-width', this.config('strokeWidth'))
            .attr('stroke-opacity', this.config('strokeOpacity'))
            .attr('d', (d) => this.lineFn(d));
          const dash = this.config('strokeDasharray');
          if (dash) selection.attr('stroke-dasharray', dash);
        },
        'merge:transition': (transition) => {
          transition
            .duration(this.config('duration'))
            .attr('stroke', this.config('stroke'))
            .attr('stroke-width', this.config('strokeWidth'))
            .attr('stroke-opacity', this.config('strokeOpacity'))
            .attr('d', (d) => this.lineFn(d));
          const dash = this.config('strokeDasharray');
          transition.attr('stroke-dasharray', dash);
        },
      },
    });

    const dotsGroup = this.base.append('g').attr('class', 'dots');

    this.layer('dots', dotsGroup, {
      dataBind: (selection, data) => {
        const dots = this.config('showDots') ? data : [];
        return selection.selectAll('circle').data(dots, (d, i) => i);
      },
      insert: (selection) => selection.append('circle'),
      events: {
        enter: (selection) => {
          const xScale = this.config('xScale');
          const yScale = this.config('yScale');
          const xValue = this.config('xValue');
          const yValue = this.config('yValue');
          selection
            .attr('cx', (d) => xScale(xValue(d)))
            .attr('cy', (d) => yScale(yValue(d)))
            .attr('r', 0)
            .attr('fill', this.config('stroke'));
        },
        'enter:transition': (transition) => {
          transition.duration(400).attr('r', this.config('dotRadius'));
        },
        'merge:transition': (transition) => {
          const xScale = this.config('xScale');
          const yScale = this.config('yScale');
          const xValue = this.config('xValue');
          const yValue = this.config('yValue');
          transition
            .duration(this.config('duration'))
            .attr('cx', (d) => xScale(xValue(d)))
            .attr('cy', (d) => yScale(yValue(d)))
            .attr('fill', this.config('stroke'));
        },
        'exit:transition': (transition) => {
          transition.duration(200).attr('r', 0).remove();
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
    const curve = this.config('curve');
    const definedFn = this.config('defined');

    this.lineFn.x((d) => xScale(xValue(d))).y((d) => yScale(yValue(d)));

    if (curve) {
      this.lineFn.curve(curve);
    }

    if (definedFn) {
      this.lineFn.defined(definedFn);
    }
  }
}

export { LineChart };
