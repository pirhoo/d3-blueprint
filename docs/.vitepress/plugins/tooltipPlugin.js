import { Tooltip } from '../components/charts/Tooltip.js';

/**
 * Factory returning a tooltip plugin object.
 *
 * @param {Object} options
 * @param {d3.Selection} options.parent  - The SVG group to append the tooltip to
 * @param {number}       [options.width] - Container width for edge-aware positioning
 * @param {number}       [options.height]- Container height for edge-aware positioning
 * @param {Function}     options.bind    - Called on every postDraw: bind(chart, tooltip, data)
 */
function tooltipPlugin({ parent, width, height, bind }) {
  return {
    name: 'tooltip',
    install(chart) {
      chart.tooltip = new Tooltip(parent, { width, height });
    },
    postDraw(chart, data) {
      bind(chart, chart.tooltip, data);
    },
    destroy(chart) {
      chart.tooltip = null;
    },
  };
}

export { tooltipPlugin };
