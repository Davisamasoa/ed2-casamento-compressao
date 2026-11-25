/* Página de compressão: árvore de Huffman passo a passo, Moffat-Katajainen e laboratório. */
document.addEventListener('DOMContentLoaded', () => {
  const { $, $$, esc } = UI;
  const vis = s => s.replace(/ /g, '␣');
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); p && p.appendChild(e); return e; };

  /* Desenha uma floresta (lista de árvores) num SVG */
  function drawForest(svg, forest) {
    svg.innerHTML = '';
    const LW = 70, LH = 62;
    let col = 0, maxD = 0;
    const lay = (t, d) => {
      t._d = d; maxD = Math.max(maxD, d);
      if (t.folha) { t._x = col++; return; }
      lay(t.esq, d + 1); lay(t.dir, d + 1);
      t._x = (t.esq._x + t.dir._x) / 2;
    };
    forest.forEach(t => { lay(t, 0); col += 0.4; });
    const W = Math.max(col * LW + 20, 200), H = (maxD + 1) * LH + 30;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W);
    const X = t => 20 + t._x * LW + LW / 2 - 10, Y = t => 28 + t._d * LH;
    const edges = t => {
      if (t.folha) return;
      [[t.esq, '0'], [t.dir, '1']].forEach(([c, b]) => {
        mk('line', { x1: X(t), y1: Y(t) + 16, x2: X(c), y2: Y(c) - 13, class: 'edge' }, svg);
        mk('text', { x: (X(t) + X(c)) / 2 + (b === '0' ? -9 : 9), y: (Y(t) + Y(c)) / 2 + 2, class: 'bitlbl' }, svg).textContent = b;
        edges(c);
      });
    };
    const nodes = t => {
      if (t.folha) {
        const w = Math.max(40, t.s.length * 9 + 14);
        mk('rect', { x: X(t) - w / 2, y: Y(t) - 13, width: w, height: 26, rx: 6, class: 'leaf' }, svg);
        mk('text', { x: X(t), y: Y(t), class: 'lbl', style: 'font-size:13px' }, svg).textContent = vis(t.s);
        mk('text', { x: X(t), y: Y(t) - 20, class: 'elbl', style: 'font-size:11px' }, svg).textContent = t.w;
      } else {
        mk('circle', { cx: X(t), cy: Y(t), r: 16, class: 'node' }, svg);
        mk('text', { x: X(t), y: Y(t), class: 'lbl' }, svg).textContent = t.w;
        nodes(t.esq); nodes(t.dir);
      }
    };
    forest.forEach(t => { edges(t); nodes(t); });
  }

  /* ---------- Árvore do exemplo, passo a passo ---------- */
  function treeStepper(root, texto) {
    const svg = $('svg', root), info = $('.status', root);
    const bPrev = $('[data-a=prev]', root), bNext = $('[data-a=next]', root);
    const lista = Algos.frequencias(Algos.tokenizar(texto));
    const passos = Algos.huffmanPassos(lista);
    let i = 0;
    function render() {
      drawForest(svg, passos[i]);
      const letra = 'abcdefghijklmnop'[i] || '';
      if (i === 0) info.innerHTML = `<b>${letra})</b> Começo: uma folha por símbolo, com sua frequência. Ainda não há árvore.`;
      else {
        const novo = passos[i].find(t => !t.folha && !passos[i - 1].includes(t));
        const nome = t => t.folha ? `"${vis(t.s)}" (${t.w})` : `a árvore de peso ${t.w}`;
        info.innerHTML = `<b>${letra})</b> As duas de menor frequência são ${nome(novo.esq)} e ${nome(novo.dir)}. Viram uma árvore só, com peso ${novo.esq.w} + ${novo.dir.w} = <b>${novo.w}</b>.` +
          (i === passos.length - 1 ? ' <span class="pill ok">Árvore pronta</span> Leia os bits da raiz até cada folha para obter o código.' : '');
      }
      bPrev.disabled = i === 0; bNext.disabled = i === passos.length - 1;
    }
    bPrev.onclick = () => { i--; render(); };
    bNext.onclick = () => { i++; render(); };
    render();
  }
  treeStepper($('#arvore-sim'), 'para cada rosa rosa, uma rosa é uma rosa');

  /* ---------- Traço da 1ª fase do Moffat-Katajainen ---------- */
  (function () {
    const r = Algos.moffatKatajainen([4, 2, 1, 1, 1, 1]);
    const box = $('#mk-trace');
    if (!box) return;
    box.innerHTML = '<table><tr><th></th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>Prox</th><th>Raiz</th><th>Folha</th></tr>' +
      r.trace.map((t, i) => `<tr><td>${'abcdefghijk'[i]})</td>${t.v.map((v, j) => `<td class="mono">${i === r.trace.length - 1 && j === 0 ? '/' : v}</td>`).join('')}<td class="mono">${t.rot.Prox}</td><td class="mono">${t.rot.Raiz}</td><td class="mono">${t.rot.Folha}</td></tr>`).join('') + '</table>';
  })();

  /* ---------- Laboratório ---------- */
  const lab = $('#lab');
  const inp = $('textarea', lab), out = $('.out', lab), svgLab = $('svg', lab);
  function run() {
    const texto = inp.value;
    const simb = Algos.tokenizar(texto);
    if (!simb.length) { out.innerHTML = '<p class="muted">Digite um texto.</p>'; svgLab.innerHTML = ''; return; }
    const lista = Algos.frequencias(simb);
    const ord = lista.slice().sort((a, b) => b.f - a.f || a.ordem - b.ordem);
    const res = Algos.moffatKatajainen(ord.map(x => x.f));
    const can = Algos.canonicos(res.comp);
    const cod = {}; ord.forEach((x, i) => (cod[x.s] = can.codigos[i]));
    const bits = simb.map(s => cod[s]).join('');
    const orig = new TextEncoder().encode(texto).length * 8;
    const razao = orig ? (bits.length / orig * 100) : 0;
    out.innerHTML =
      `<div class="grid2"><div class="card"><h4>Símbolos lidos</h4><p class="mono small" style="word-break:break-word">${simb.map(s => `<span class="pill">${esc(vis(s))}</span>`).join(' ')}</p><p class="small muted">Espaços simples entre palavras ficam implícitos e não viram símbolo.</p></div>` +
      `<div class="card"><h4>Tamanho</h4><p class="small">Original: <b>${orig}</b> bits (${orig / 8} bytes)<br>Comprimido: <b>${bits.length}</b> bits<br>Razão de compressão: <b>${razao.toFixed(1).replace(".", ",")}%</b></p><p class="small muted">Sem contar o vocabulário, Base e Offset, que também vão para o arquivo.</p></div></div>` +
      `<div class="tw"><table><tr><th>i</th><th>Símbolo</th><th>Frequência</th><th>Comprimento</th><th>Código canônico</th></tr>` +
      ord.map((x, i) => `<tr><td>${i + 1}</td><td class="mono">${esc(vis(x.s))}</td><td>${x.f}</td><td>${res.comp[i]}</td><td class="mono">${can.codigos[i]}</td></tr>`).join('') + '</table></div>' +
      `<div class="tw"><table><tr><th>c</th>${can.Base.map((_, c) => c ? `<th>${c}</th>` : '').join('')}</tr><tr><td>Base[c]</td>${can.Base.map((b, c) => c ? `<td class="mono">${b}</td>` : '').join('')}</tr><tr><td>Offset[c]</td>${can.Offset.map((o, c) => c ? `<td class="mono">${o}</td>` : '').join('')}</tr></table></div>` +
      `<h4>Texto comprimido</h4><p class="mono small" style="word-break:break-all;background:var(--surface-2);padding:10px 12px;border-radius:10px">${simb.map(s => `<span title="${esc(s)}">${cod[s]}</span>`).join('<span style="color:var(--text-3)">·</span>')}</p><p class="small muted">Os pontos só separam os códigos para facilitar a leitura. No arquivo, os bits ficam colados: como nenhum código é começo de outro, dá para separar sem ambiguidade.</p>`;
    drawForest(svgLab, Algos.huffmanPassos(lista).pop());
  }
  inp.oninput = run;
  run();
});
