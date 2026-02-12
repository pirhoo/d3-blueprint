class Tooltip {
  constructor(parent, { width, height } = {}) {
    this.parent = parent;
    this.containerWidth = width ?? 0;
    this.containerHeight = height ?? 0;

    this.group = parent
      .append('g')
      .attr('class', 'tooltip')
      .style('pointer-events', 'none')
      .style('display', 'none');

    this.bg = this.group
      .append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'rgba(0,0,0,0.8)');

    this.textGroup = this.group.append('g');
  }

  show(x, y, lines) {
    if (typeof lines === 'string') lines = [{ text: lines }];
    if (isNaN(x) || isNaN(y)) return this.hide();

    const lineHeight = 18;
    const px = 10;
    const py = 8;
    const gap = 10;

    // Make group visible before measuring. getBBox() returns zeros on display:none elements
    this.group.style('display', null);

    this.textGroup.selectAll('text').remove();

    lines.forEach((l, i) => {
      this.textGroup
        .append('text')
        .attr('x', 0)
        .attr('y', i * lineHeight)
        .attr('dy', '1em')
        .attr('fill', l.color || '#fff')
        .attr('font-size', '12px')
        .attr('font-family', 'sans-serif')
        .text(l.text);
    });

    // Measure the actual rendered text, then build the background around it
    const bbox = this.textGroup.node().getBBox();
    const w = bbox.width + px * 2;
    const h = bbox.height + py * 2;

    // Shift text so it sits at (px, py) inside the background
    this.textGroup.attr('transform', `translate(${px - bbox.x},${py - bbox.y})`);
    this.bg.attr('width', w).attr('height', h);

    // Resolve container bounds
    let cw = this.containerWidth;
    let ch = this.containerHeight;
    if (!cw || !ch) {
      const pbox = this.parent.node().getBBox();
      cw = cw || pbox.width;
      ch = ch || pbox.height;
    }

    // Horizontal: prefer right of anchor, flip left if it overflows
    let tx = x + gap;
    if (tx + w > cw) tx = x - gap - w;
    if (tx < 0) tx = 0;

    // Vertical: center on anchor, clamp to container
    let ty = y - h / 2;
    if (ty + h > ch) ty = ch - h;
    if (ty < 0) ty = 0;

    this.group.attr('transform', `translate(${tx},${ty})`);
  }

  hide() {
    this.group.style('display', 'none');
  }
}

export { Tooltip };
