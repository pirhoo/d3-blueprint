function crosshairPlugin(parent, height) {
  let line;

  function show(x) {
    line.attr('x1', x).attr('x2', x).style('display', null);
  }

  function hide() {
    line.style('display', 'none');
  }

  return {
    name: 'crosshair',
    show,
    hide,
    install() {
      line = parent
        .append('line')
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', '#999')
        .attr('stroke-dasharray', '4,3')
        .style('display', 'none');
    },
    destroy() {
      line?.remove();
      line = null;
    },
  };
}

export { crosshairPlugin };
