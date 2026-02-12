import { axisBottom, axisLeft } from 'd3-axis';
import 'd3-transition';
import { D3Blueprint } from 'd3-blueprint';

class AxisChart extends D3Blueprint {
  initialize() {
    this.configDefine('xScale', { defaultValue: null });
    this.configDefine('yScale', { defaultValue: null });
    this.configDefine('innerWidth', { defaultValue: 0 });
    this.configDefine('innerHeight', { defaultValue: 0 });
    this.configDefine('duration', { defaultValue: 750 });
    this.configDefine('xTickCount', { defaultValue: undefined });
    this.configDefine('yTickCount', { defaultValue: undefined });
    this.configDefine('gridAxis', { defaultValue: 'y' });

    this.xAxisGroup = this.base.append('g').attr('class', 'x-axis');
    this.yAxisGroup = this.base.append('g').attr('class', 'y-axis');
    this._firstDraw = true;
  }

  preDraw() {
    const xScale = this.config('xScale');
    const yScale = this.config('yScale');
    if (!xScale || !yScale) return;

    const innerWidth = this.config('innerWidth');
    const innerHeight = this.config('innerHeight');
    const duration = this._firstDraw ? 0 : this.config('duration');
    const xTickCount = this.config('xTickCount');
    const yTickCount = this.config('yTickCount');
    const gridAxis = this.config('gridAxis');
    this._firstDraw = false;

    const xAxis = axisBottom(xScale)
      .tickSize(gridAxis === 'x' ? -innerHeight : 0)
      .tickPadding(10);
    if (xTickCount != null) xAxis.ticks(xTickCount);

    this.xAxisGroup
      .attr('transform', `translate(0,${innerHeight})`)
      .transition()
      .duration(duration)
      .call(xAxis);

    this.xAxisGroup.select('.domain').remove();

    const yAxis = axisLeft(yScale)
      .tickSize(gridAxis === 'y' ? -innerWidth : 0)
      .tickPadding(10);
    if (yTickCount != null) yAxis.ticks(yTickCount);

    this.yAxisGroup.transition().duration(duration).call(yAxis);

    this.yAxisGroup.select('.domain').remove();
  }
}

export { AxisChart };
