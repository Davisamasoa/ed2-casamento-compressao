/* Página de exercícios: grades de passo a passo, tabelas e abrir/fechar resoluções. */
document.addEventListener('DOMContentLoaded', () => {
  const { $$, esc } = UI;

  /* Grade no formato da prova: linha do texto e uma linha por tentativa */
  $$('[data-grid]').forEach(el => {
    const T = el.dataset.t, P = el.dataset.p, alg = el.dataset.grid;
    const steps = alg === 'bm' ? Algos.bmOcorrencia(T, P) : alg === 'bmh' ? Algos.bmh(T, P) : Algos.bmhs(T, P);
    let html = '<div class="tw"><table class="grade"><tr><th></th>' + [...T].map((_, i) => `<th>${i + 1}</th>`).join('') + '</tr>';
    html += '<tr class="txt"><td></td>' + [...T].map(c => `<td>${esc(c)}</td>`).join('') + '</tr>';
    steps.forEach((s, n) => {
      const cmp = {}; s.comps.forEach(c => (cmp[c.p] = c.ok));
      html += `<tr><td class="num">${n + 1}</td>`;
      for (let i = 0; i < T.length; i++) {
        const j = i - s.pos;
        if (j >= 0 && j < P.length) {
          const cls = s.found ? 'g-ok' : cmp[j] === true ? 'g-ok' : cmp[j] === false ? 'g-bad' : '';
          html += `<td class="${cls}">${esc(P[j])}</td>`;
        } else html += '<td></td>';
      }
      html += '</tr>';
    });
    html += '</table></div><ol class="passos">';
    steps.forEach(s => {
      let t = `Janela nas posições ${s.pos + 1} a ${s.pos + P.length}: `;
      if (s.found) t += `<b class="okt">casamento na posição ${s.pos + 1}</b>. `;
      else {
        const bad = s.comps[s.comps.length - 1];
        t += `${s.comps.length - 1 ? (s.comps.length - 1) + ' caractere(s) casaram de trás para frente; ' : ''}colisão entre <b>${esc(T[bad.t])}</b> do texto (posição ${bad.t + 1}) e <b>${esc(P[bad.p])}</b> do padrão. `;
      }
      if (alg === 'bm') {
        if (s.found) t += 'Depois do casamento, anda 1.';
        else {
          const q = P.lastIndexOf(s.colChar, s.comps[s.comps.length - 1].p - 1);
          t += q >= 0 ? `O ${esc(s.colChar)} mais próximo à esquerda da colisão está na posição ${q + 1} do padrão: anda <b>${s.shift}</b>.` : `Não há ${esc(s.colChar)} à esquerda da colisão no padrão: o padrão passa inteiro por cima dele, anda <b>${s.shift}</b>.`;
        }
      } else if (s.shift === null) t += 'Não há caractere depois da janela: a busca termina.';
      else t += `Salto pelo ${esc(s.shiftChar)} (posição ${s.shiftIdx + 1}${alg === 'bmh' ? ', fim da janela' : ', depois da janela'}): d[${esc(s.shiftChar)}] = <b>${s.shift}</b>.`;
      html += `<li>${t}</li>`;
    });
    el.innerHTML = html + '</ol>';
  });

  /* Tabela do Shift-And exato */
  $$('[data-shiftand]').forEach(el => {
    const T = el.dataset.t, P = el.dataset.p, m = P.length, M = Algos.mascaras(P);
    const b = x => Algos.bits(x, m).split(' ').join('').split('').join(' ');
    let h = '<div class="tw"><table><tr><th>Texto</th><th>(R &gt;&gt; 1) | 10<sup>m-1</sup></th><th>M[T[i]]</th><th>R\'</th><th></th></tr>';
    Algos.shiftAndExato(T, P).forEach(r => {
      h += `<tr class="${r.match ? 'hit' : ''}"><td class="mono">${esc(r.c)}</td><td class="mono">${b(r.meio)}</td><td class="mono">${b(M[r.c] || 0)}</td><td class="mono">${b(r.R)}</td><td>${r.match ? `<span class="pill ok">casamento na posição ${r.pos}</span>` : ''}</td></tr>`;
    });
    el.innerHTML = h + '</table></div>';
  });

  /* Abrir e fechar todas as resoluções */
  const tg = document.getElementById('toggle-all');
  if (tg) tg.onclick = () => {
    const ds = $$('details.sol');
    const abrir = ds.some(d => !d.open);
    ds.forEach(d => (d.open = abrir));
    tg.textContent = abrir ? 'Esconder todas as resoluções' : 'Mostrar todas as resoluções';
  };
});
