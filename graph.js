/* Desenho simples de autômatos em SVG. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function defs(svg) {
    const d = el('defs', {}, svg);
    [['arr', 'var(--text-2)'], ['arr-ins', 'var(--accent)'], ['arr-sub', 'var(--warn)'], ['arr-ret', 'var(--bad)']].forEach(([id, c]) => {
      const m = el('marker', { id: svg.id + id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, d);
      el('path', { d: 'M0,0 L10,5 L0,10 z', style: 'fill:' + c }, m);
    });
  }
  const R = 18;
  /* nodes: {id, x, y, label, final}; edges: {from, to, label, cls, bend, loop} */
  function draw(svg, nodes, edges) {
    svg.innerHTML = '';
    defs(svg);
    const pos = {}; nodes.forEach(n => (pos[n.id] = n));
    edges.forEach(e => {
      const a = pos[e.from], b = pos[e.to];
      const mk = `url(#${svg.id}${e.cls ? 'arr-' + e.cls : 'arr'})`;
      const cls = 'edge' + (e.cls ? ' e-' + e.cls : '');
      if (e.loop) {
        const p = `M${a.x - 10},${a.y - R + 2} C${a.x - 34},${a.y - 62} ${a.x + 34},${a.y - 62} ${a.x + 10},${a.y - R + 2}`;
        el('path', { d: p, class: cls, 'marker-end': mk }, svg);
        el('text', { x: a.x, y: a.y - 54, class: 'elbl' }, svg).textContent = e.label;
        return;
      }
      const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const x1 = a.x + ux * R, y1 = a.y + uy * R, x2 = b.x - ux * (R + 2), y2 = b.y - uy * (R + 2);
      let lx = (x1 + x2) / 2, ly = (y1 + y2) / 2;
      if (e.bend) {
        const cx = (x1 + x2) / 2 - uy * e.bend, cy = (y1 + y2) / 2 + ux * e.bend;
        el('path', { d: `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`, class: cls, 'marker-end': mk }, svg);
        lx = (x1 + 2 * cx + x2) / 4; ly = (y1 + 2 * cy + y2) / 4 + (e.bend > 0 ? 14 : -6);
      } else {
        el('line', { x1, y1, x2, y2, class: cls, 'marker-end': mk }, svg);
        const off = e.off || [0, -8];
        lx += off[0]; ly += off[1];
      }
      if (e.label) el('text', { x: lx, y: ly, class: 'elbl' }, svg).textContent = e.label;
    });
    nodes.forEach(n => {
      el('circle', { cx: n.x, cy: n.y, r: R, class: 'node' }, svg);
      if (n.final) el('circle', { cx: n.x, cy: n.y, r: R - 4, class: 'final' }, svg);
      el('text', { x: n.x, y: n.y, class: 'lbl' }, svg).textContent = n.label ?? n.id;
    });
  }
  window.Graph = { draw };
})();
