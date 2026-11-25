/* Lógica dos algoritmos usada pelos simuladores. Índices seguem os slides (1-based) quando indicado. */
(function (root) {
  const A = {};

  /* ---------- Força bruta: lista de tentativas ---------- */
  A.forcaBruta = function (T, P) {
    const n = T.length, m = P.length, steps = [];
    for (let i = 1; i <= n - m + 1; i++) {
      const comps = [];
      let j = 1, k = i;
      while (j <= m) {
        const ok = T[k - 1] === P[j - 1];
        comps.push({ t: k - 1, p: j - 1, ok });
        if (!ok) break;
        j++; k++;
      }
      steps.push({ pos: i - 1, comps, found: j > m, shift: 1 });
    }
    return steps;
  };

  /* ---------- Tabelas de deslocamento ---------- */
  A.tabelaBMH = function (P) {
    const m = P.length, d = {};
    for (let j = 1; j < m; j++) d[P[j - 1]] = m - j;
    return { d, padrao: m };
  };
  A.tabelaBMHS = function (P) {
    const m = P.length, d = {};
    for (let j = 1; j <= m; j++) d[P[j - 1]] = m - j + 1;
    return { d, padrao: m + 1 };
  };

  /* ---------- BMH e BMHS: janela deslizante, comparação da direita para a esquerda ---------- */
  function janela(T, P, sunday) {
    const n = T.length, m = P.length, steps = [];
    const tab = sunday ? A.tabelaBMHS(P) : A.tabelaBMH(P);
    let i = m;
    while (i <= n) {
      let k = i, j = m;
      const comps = [];
      while (j > 0) {
        const ok = T[k - 1] === P[j - 1];
        comps.push({ t: k - 1, p: j - 1, ok });
        if (!ok) break;
        k--; j--;
      }
      const idx = sunday ? i : i - 1; // caractere que define o salto
      const c = T[idx];
      const shift = c === undefined ? null : (c in tab.d ? tab.d[c] : tab.padrao);
      steps.push({ pos: i - m, comps, found: j === 0, shiftChar: c, shiftIdx: idx, shift });
      if (shift === null) break;
      i += shift;
    }
    return steps;
  }
  A.bmh = (T, P) => janela(T, P, false);
  A.bmhs = (T, P) => janela(T, P, true);

  /* ---------- Shift-And: máscaras como strings de bits b1..bm ---------- */
  A.mascaras = function (P) {
    const m = P.length, M = {};
    for (let j = 1; j <= m; j++) {
      if (!M[P[j - 1]]) M[P[j - 1]] = 0;
      M[P[j - 1]] |= 1 << (m - j);
    }
    return M;
  };
  A.bits = (x, m) => x.toString(2).padStart(m, '0').slice(-m);

  A.shiftAndExato = function (T, P) {
    const m = P.length, M = A.mascaras(P), alto = 1 << (m - 1);
    let R = 0; const rows = [];
    for (let i = 0; i < T.length; i++) {
      const meio = (R >> 1) | alto;
      R = meio & (M[T[i]] || 0);
      rows.push({ c: T[i], meio, R, match: (R & 1) !== 0, pos: i - m + 2 });
    }
    return rows;
  };

  /* k = 1, com escolha das operações permitidas (como nos slides 50 a 53) */
  A.shiftAndAprox1 = function (T, P, ops) {
    const m = P.length, M = A.mascaras(P), alto = 1 << (m - 1);
    let R0 = 0, R1 = alto; const rows = [];
    for (let i = 0; i < T.length; i++) {
      const mk = M[T[i]] || 0;
      const meio0 = (R0 >> 1) | alto;
      const N0 = meio0 & mk;
      const r1s = R1 >> 1;
      let N1 = (r1s & mk) | alto;
      if (ops.ins) N1 |= R0;
      if (ops.sub) N1 |= R0 >> 1;
      if (ops.ret) N1 |= N0 >> 1;
      rows.push({ c: T[i], meio0, R0: N0, r1s, R1: N1, exato: (N0 & 1) !== 0, aprox: (N1 & 1) !== 0, pos: i + 1 });
      R0 = N0; R1 = N1;
    }
    return rows;
  };

  /* ---------- Huffman por palavras ---------- */
  A.tokenizar = function (texto) {
    const re = /[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu;
    const toks = texto.match(re) || [];
    const simbolos = [];
    toks.forEach((t, i) => {
      const ehPalavra = /[\p{L}\p{N}]/u.test(t);
      if (ehPalavra) simbolos.push(t);
      else if (t === ' ' && i > 0 && i < toks.length - 1) { /* espaço simples: implícito */ }
      else simbolos.push(t);
    });
    return simbolos;
  };

  A.frequencias = function (simbolos) {
    const mapa = new Map();
    simbolos.forEach(s => mapa.set(s, (mapa.get(s) || 0) + 1));
    const lista = [...mapa.entries()].map(([s, f], ordem) => ({ s, f, ordem }));
    return lista; // ordem de aparição
  };

  /* Construção da árvore com desempate igual ao dos slides: nó interno antes de folha */
  A.huffmanPassos = function (lista) {
    let floresta = lista.map((x, i) => ({ folha: true, s: x.s, w: x.f, id: 'f' + i, ordem: i }));
    const passos = [floresta.slice()];
    let criado = 0;
    while (floresta.length > 1) {
      const ordenar = (a, b) => a.w - b.w || (a.folha - b.folha) || (a.ordem - b.ordem);
      const cand = floresta.slice().sort(ordenar);
      const [x, y] = cand;
      const novo = { folha: false, w: x.w + y.w, esq: x, dir: y, id: 'n' + criado, ordem: criado++ };
      const pos = Math.min(floresta.indexOf(x), floresta.indexOf(y));
      floresta = floresta.filter(t => t !== x && t !== y);
      floresta.splice(pos, 0, novo);
      passos.push(floresta.slice());
    }
    return passos;
  };

  /* Moffat e Katajainen, exatamente como nos slides (vetor 1-based) */
  A.moffatKatajainen = function (freqs) {
    const n = freqs.length, A1 = [null, ...freqs], trace = [];
    const snap = (rot) => trace.push({ rot, v: A1.slice(1) });
    if (n === 1) return { comp: [1], trace, fase2: [], fase1: [] };
    let Raiz = n, Folha = n;
    snap({ Prox: n, Raiz, Folha });
    for (let Prox = n; Prox >= 2; Prox--) {
      if (Folha < 1 || (Raiz > Prox && A1[Raiz] <= A1[Folha])) { A1[Prox] = A1[Raiz]; A1[Raiz] = Prox; Raiz--; }
      else { A1[Prox] = A1[Folha]; Folha--; }
      snap({ Prox, Raiz, Folha });
      if (Folha < 1 || (Raiz > Prox && A1[Raiz] <= A1[Folha])) { A1[Prox] += A1[Raiz]; A1[Raiz] = Prox; Raiz--; }
      else { A1[Prox] += A1[Folha]; Folha--; }
      snap({ Prox: Prox - 1, Raiz, Folha });
    }
    const fase1 = A1.slice(1);
    A1[2] = 0;
    for (let Prox = 3; Prox <= n; Prox++) A1[Prox] = A1[A1[Prox]] + 1;
    const fase2 = A1.slice(1);
    let Disp = 1, u = 0, h = 0, Raiz2 = 2, Prox = 1;
    while (Disp > 0) {
      while (Raiz2 <= n && A1[Raiz2] === h) { u++; Raiz2++; }
      while (Disp > u) { A1[Prox] = h; Prox++; Disp--; }
      Disp = 2 * u; h++; u = 0;
    }
    return { comp: A1.slice(1), trace, fase1, fase2 };
  };

  A.canonicos = function (comp) {
    const max = Math.max(...comp), w = Array(max + 2).fill(0);
    comp.forEach(c => w[c]++);
    const Base = [], Offset = [];
    Base[1] = 0;
    for (let c = 2; c <= max; c++) Base[c] = 2 * (Base[c - 1] + w[c - 1]);
    let idx = 1;
    for (let c = 1; c <= max; c++) { Offset[c] = idx; idx += w[c]; }
    const codigos = comp.map((c, i) => (i + 1 - Offset[c] + Base[c]).toString(2).padStart(c, '0'));
    return { Base, Offset, codigos, max, w };
  };

  if (typeof module !== 'undefined') module.exports = A; else root.Algos = A;
})(this);
