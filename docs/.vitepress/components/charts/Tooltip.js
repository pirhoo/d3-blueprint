import { computePosition, flip, shift, offset } from '@floating-ui/dom';

class Tooltip {
  constructor(parent, bind) {
    this.name = 'tooltip';
    this._parent = parent;
    this._bind = bind;
  }

  install() {
    this.context = this._parent.node ? this._parent.node() : this._parent;
    this.el = document.createElement('div');
    this.el.className = 'd3bp-tooltip';
    document.body.appendChild(this.el);
  }

  postDraw(chart, data) {
    this._bind(chart, this, data);
  }

  show(x, y, lines) {
    if (typeof lines === 'string') lines = [{ text: lines }];
    if (isNaN(x) || isNaN(y)) return this.hide();

    // Build content using safe DOM methods
    this.el.replaceChildren();
    lines.forEach((l) => {
      const div = document.createElement('div');
      div.textContent = l.text;
      if (l.color) div.style.color = l.color;
      this.el.appendChild(div);
    });

    // Convert SVG-local coords to screen coords
    const ctm = this.context.getScreenCTM();
    if (!ctm) return this.hide();

    const screenX = ctm.e + ctm.a * x;
    const screenY = ctm.f + ctm.d * y;

    const virtualRef = {
      getBoundingClientRect: () => ({
        x: screenX,
        y: screenY,
        width: 0,
        height: 0,
        top: screenY,
        right: screenX,
        bottom: screenY,
        left: screenX,
      }),
    };

    this.el.style.opacity = '1';

    computePosition(virtualRef, this.el, {
      strategy: 'fixed',
      placement: 'right',
      middleware: [offset(10), flip(), shift({ padding: 8 })],
    }).then(({ x: fx, y: fy }) => {
      this.el.style.left = `${fx}px`;
      this.el.style.top = `${fy}px`;
    });
  }

  hide() {
    this.el.style.opacity = '0';
  }

  destroy() {
    this.el?.remove();
  }
}

export { Tooltip };
