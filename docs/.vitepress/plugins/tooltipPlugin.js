import { Tooltip } from '../components/charts/Tooltip.js';

/**
 * Factory returning a tooltip plugin object.
 *
 * @param {Object} options
 * @param {d3.Selection} options.parent  - The SVG group for coordinate conversion
 * @param {Function}     options.bind    - Called on every postDraw: bind(chart, tooltip, data)
 */
function tooltipPlugin({ parent, bind }) {
  return {
    name: 'tooltip',
    install(chart) {
      chart.tooltip = new Tooltip(parent);
    },
    postDraw(chart, data) {
      bind(chart, chart.tooltip, data);
    },
    destroy(chart) {
      chart.tooltip?.destroy();
      chart.tooltip = null;
    },
  };
}

export { tooltipPlugin };
