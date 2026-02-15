import { axisBottom, axisTop, axisLeft, axisRight } from 'd3-axis';
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
    this.configDefine('xAxis', { defaultValue: 'bottom' });
    this.configDefine('yAxis', { defaultValue: 'left' });
    this.configDefine('xTickFormat', { defaultValue: null });
    this.configDefine('yTickFormat', { defaultValue: null });
    this.configDefine('showDomain', { defaultValue: false });

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
    const xAxisPos = this.config('xAxis');
    const yAxisPos = this.config('yAxis');
    const xTickFormat = this.config('xTickFormat');
    const yTickFormat = this.config('yTickFormat');
    const showDomain = this.config('showDomain');
    this._firstDraw = false;

    // X axis
    if (xAxisPos !== 'none') {
      const xAxisFn = xAxisPos === 'top' ? axisTop(xScale) : axisBottom(xScale);
      xAxisFn
        .tickSize(gridAxis === 'x' || gridAxis === 'both' ? -innerHeight : 0)
        .tickPadding(10);
      if (xTickCount != null) xAxisFn.ticks(xTickCount);
      if (xTickFormat) xAxisFn.tickFormat(xTickFormat);

      const xTranslateY = xAxisPos === 'top' ? 0 : innerHeight;
      this.xAxisGroup
        .attr('transform', `translate(0,${xTranslateY})`)
        .transition()
        .duration(duration)
        .call(xAxisFn);

      if (!showDomain) this.xAxisGroup.select('.domain').remove();
      this.xAxisGroup.style('display', null);
    } else {
      this.xAxisGroup.style('display', 'none');
    }

    // Y axis
    if (yAxisPos !== 'none') {
      const yAxisFn = yAxisPos === 'right' ? axisRight(yScale) : axisLeft(yScale);
      yAxisFn
        .tickSize(gridAxis === 'y' || gridAxis === 'both' ? -innerWidth : 0)
        .tickPadding(10);
      if (yTickCount != null) yAxisFn.ticks(yTickCount);
      if (yTickFormat) yAxisFn.tickFormat(yTickFormat);

      const yTranslateX = yAxisPos === 'right' ? innerWidth : 0;
      this.yAxisGroup
        .attr('transform', yTranslateX ? `translate(${yTranslateX},0)` : null)
        .transition()
        .duration(duration)
        .call(yAxisFn);

      if (!showDomain) this.yAxisGroup.select('.domain').remove();
      this.yAxisGroup.style('display', null);
    } else {
      this.yAxisGroup.style('display', 'none');
    }
  }
}

export { AxisChart };
