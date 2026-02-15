import { computePosition, flip, shift, offset } from '@floating-ui/dom';

function tooltipPlugin(parent, bind) {
  let el;
  const context = parent.node ? parent.node() : parent;

  function show(x, y, lines) {
    if (typeof lines === 'string') lines = [{ text: lines }];
    if (isNaN(x) || isNaN(y)) return hide();

    // Build content using safe DOM methods
    el.replaceChildren();
    lines.forEach((l) => {
      const div = document.createElement('div');
      div.textContent = l.text;
      if (l.color) div.style.color = l.color;
      el.appendChild(div);
    });

    // Convert SVG-local coords to screen coords
    const ctm = context.getScreenCTM();
    if (!ctm) return hide();

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

    el.style.opacity = '1';

    computePosition(virtualRef, el, {
      strategy: 'fixed',
      placement: 'right',
      middleware: [offset(10), flip(), shift({ padding: 8 })],
    }).then(({ x: fx, y: fy }) => {
      el.style.left = `${fx}px`;
      el.style.top = `${fy}px`;
    });
  }

  function hide() {
    el.style.opacity = '0';
  }

  return {
    name: 'tooltip',
    install() {
      el = document.createElement('div');
      el.className = 'd3bp-tooltip';
      document.body.appendChild(el);
    },
    postDraw(chart, data) {
      bind(chart, { show, hide }, data);
    },
    destroy() {
      el?.remove();
    },
  };
}

export { tooltipPlugin };
