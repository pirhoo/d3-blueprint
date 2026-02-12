/**
 * Factory returning a responsive plugin that observes a container element
 * for size changes and redraws the chart automatically.
 *
 * @param {Object} options
 * @param {Element}  options.container - DOM element to observe for resize
 * @param {Function} options.getSize   - (container) => Record<string, unknown>. Returns config
 *                                       values to set before redraw (e.g. { width: 500 })
 */
function responsivePlugin({ container, getSize }) {
  let lastData;

  return {
    name: 'responsive',
    install(chart) {
      chart._resizeObserver = new ResizeObserver(() => {
        if (lastData === undefined) return;
        chart.config(getSize(container));
        chart.draw(lastData);
      });
      chart._resizeObserver.observe(container);
    },
    postDraw(chart, data) {
      lastData = data;
    },
    destroy(chart) {
      chart._resizeObserver?.disconnect();
      chart._resizeObserver = null;
      lastData = undefined;
    },
  };
}

export { responsivePlugin };
