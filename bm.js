/* Boyer-Moore só com a heurística ocorrência (passo a passo) e utilidades da página de exercícios. */
(function (root) {
  const A = root.Algos || (typeof require !== 'undefined' ? require('./algos.js') : {});

  /* Na colisão entre T[k] e P[j], alinha T[k] com a ocorrência mais à direita
     desse caractere em P à esquerda de j. Sem ocorrência, o padrão passa inteiro
     por cima de T[k]. Depois de um casamento completo, anda 1 posição. */
  A.bmOcorrencia = function (T, P) {
    const n = T.length, m = P.length, steps = [];
    let pos = 0;
    while (pos + m <= n) {
      const comps = [];
      let j = m - 1;
      while (j >= 0) {
        const ok = T[pos + j] === P[j];
        comps.push({ t: pos + j, p: j, ok });
        if (!ok) break;
        j--;
      }
      let shift;
      if (j < 0) shift = 1;
      else {
        const c = T[pos + j];
        let q = j - 1;
        while (q >= 0 && P[q] !== c) q--;
        shift = j - q; // q = -1 quando não existe
      }
      steps.push({ pos, comps, found: j < 0, shift, colChar: j >= 0 ? T[pos + j] : null });
      pos += shift;
    }
    return steps;
  };

  if (typeof module !== 'undefined') module.exports = A; else root.Algos = A;
})(this);
