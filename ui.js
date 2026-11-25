/* Interface: sumário ativo, código anotado e simuladores. */
(function () {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const vis = c => (c === ' ' ? '␣' : c);
  window.UI = { $, $$, esc, vis };

  /* ---------- Sumário que acompanha a rolagem ---------- */
  function toc() {
    const links = $$('.toc a[href^="#"]');
    if (!links.length) return;
    const secs = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const marcar = id => links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
    // Ao clicar num item, marca só ele e ignora a rolagem até ela terminar
    let travado = false, timer;
    const destravar = () => { clearTimeout(timer); timer = setTimeout(() => { travado = false; }, 250); };
    links.forEach(a => a.addEventListener('click', () => {
      marcar(a.getAttribute('href').slice(1));
      travado = true; destravar();
    }));
    // Seção atual = a última cujo topo já passou de 30% da tela
    let pedido = false;
    const atual = () => {
      pedido = false;
      if (travado) return;
      const lim = window.innerHeight * 0.3;
      let id = secs[0].id;
      secs.forEach(s => { if (s.getBoundingClientRect().top <= lim) id = s.id; });
      marcar(id);
    };
    window.addEventListener('scroll', () => {
      if (travado) { destravar(); return; }
      if (!pedido) { pedido = true; requestAnimationFrame(atual); }
    }, { passive: true });
    atual();
    checklist(links, secs);
  }

  /* ---------- Checklist: tópicos já vistos (salvo neste navegador) ---------- */
  function checklist(links, secs) {
    const chave = 'ed2-vistos:' + (location.pathname.split('/').pop() || 'index');
    let vistos = {};
    try { vistos = JSON.parse(localStorage.getItem(chave)) || {}; } catch (e) {}
    const salvar = () => { try { localStorage.setItem(chave, JSON.stringify(vistos)); } catch (e) {} };
    const tocBox = $('.toc details');
    const prog = document.createElement('div');
    prog.className = 'progress';
    prog.innerHTML = '<div class="ptext"></div><div class="pbar"><span></span></div><button type="button" class="preset">Desmarcar tudo</button>';
    tocBox.insertBefore(prog, links[0]);
    const botoes = {};
    const atualizar = () => {
      const total = secs.length, feitos = secs.filter(s => vistos[s.id]).length;
      $('.ptext', prog).innerHTML = `<b>${feitos} de ${total}</b> tópicos vistos`;
      $('.pbar span', prog).style.width = (feitos / total * 100) + '%';
      $('.preset', prog).hidden = feitos === 0;
      links.forEach(a => a.classList.toggle('visto', !!vistos[a.getAttribute('href').slice(1)]));
      Object.entries(botoes).forEach(([id, b]) => {
        b.classList.toggle('on', !!vistos[id]);
        b.setAttribute('aria-pressed', !!vistos[id]);
        $('.txt', b).textContent = vistos[id] ? 'Visto' : 'Marcar como visto';
      });
    };
    const alternar = id => { if (vistos[id]) delete vistos[id]; else vistos[id] = true; salvar(); atualizar(); };
    links.forEach(a => {
      const id = a.getAttribute('href').slice(1);
      const tick = document.createElement('span');
      tick.className = 'tick'; tick.title = 'Marcar como visto';
      tick.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); alternar(id); });
      a.prepend(tick);
    });
    secs.forEach(sec => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'done-btn';
      b.innerHTML = '<span class="ic"></span><span class="txt"></span>';
      b.onclick = () => alternar(sec.id);
      const h2 = $('h2', sec);
      const wrap = document.createElement('div');
      wrap.className = 'h2row';
      h2.replaceWith(wrap); wrap.append(h2, b);
      botoes[sec.id] = b;
    });
    $('.preset', prog).onclick = () => { vistos = {}; salvar(); atualizar(); };
    atualizar();
  }

  /* ---------- Realce de sintaxe C simples ---------- */
  function hl(line) {
    const re = /(\/\*.*?\*\/|\/\/.*$)|("[^"]*")|\b(void|long|for|while|if|else|return|typedef|char|unsigned|int|define|include)\b|\b(TipoTexto|TipoPadrao|MAXCHAR|MAXTAMTEXTO|MAXTAMPADRAO|NUMMAXERROS)\b|\b(\d+)\b|([^]+?)/g;
    let out = '', m;
    while ((m = re.exec(line))) {
      if (m[1]) out += '<span class="cm">' + esc(m[1]) + '</span>';
      else if (m[2]) out += '<span class="st">' + esc(m[2]) + '</span>';
      else if (m[3]) out += '<span class="kw">' + m[3] + '</span>';
      else if (m[4]) out += '<span class="ty">' + m[4] + '</span>';
      else if (m[5]) out += '<span class="nu">' + m[5] + '</span>';
      else out += esc(m[6]);
    }
    return out || ' ';
  }

  /* Bloco de código: linhas clicáveis, cada uma ligada a uma explicação */
  function codeBlocks() {
    $$('.code[data-code]').forEach(box => {
      const data = window.CODES && window.CODES[box.dataset.code];
      if (!data) return;
      const pre = document.createElement('pre');
      data.lines.forEach(([txt, key]) => {
        const s = document.createElement('span');
        s.className = 'l'; s.dataset.k = key || '';
        s.innerHTML = hl(txt);
        pre.appendChild(s);
      });
      const notes = document.createElement('div');
      notes.className = 'notes';
      const show = key => {
        $$('.l', pre).forEach(l => l.classList.toggle('on', key && l.dataset.k === key));
        const n = data.notes[key];
        notes.innerHTML = n ? n : '<p class="hint">Clique em uma linha do código para ver o que ela faz.</p>' + (data.intro || '');
      };
      pre.addEventListener('click', e => { const l = e.target.closest('.l'); if (l && l.dataset.k) show(l.dataset.k); });
      box.append(pre, notes);
      show(null);
    });
  }

  /* ---------- Simulador de janela (força bruta, BMH, BMHS) ---------- */
  function alignSim(el) {
    const tipo = el.dataset.alg;
    const inT = $('input[name=t]', el), inP = $('input[name=p]', el);
    const strip = $('.strip', el), status = $('.status', el), dtab = $('.dtab', el);
    const bPrev = $('[data-a=prev]', el), bNext = $('[data-a=next]', el), bAll = $('[data-a=all]', el);
    let steps = [], cur = 0, sub = 0, T = '', P = '';

    function reset() {
      T = inT.value; P = inP.value;
      if (!P || P.length > T.length) { steps = []; render(); return; }
      steps = tipo === 'fb' ? Algos.forcaBruta(T, P) : tipo === 'bm' ? Algos.bmOcorrencia(T, P) : tipo === 'bmh' ? Algos.bmh(T, P) : Algos.bmhs(T, P);
      cur = 0; sub = steps.length ? steps[0].comps.length : 0;
      if (dtab) {
        const tab = tipo === 'bmh' ? Algos.tabelaBMH(P) : Algos.tabelaBMHS(P);
        dtab.innerHTML = Object.entries(tab.d).map(([c, v]) => `<span data-c="${esc(c)}">d[${vis(c)}] = ${v}</span>`).join('') +
          `<span data-c="__outro">outros = ${tab.padrao}</span>`;
      }
      render();
    }
    function render() {
      if (!steps.length) { strip.innerHTML = ''; status.textContent = 'O padrão precisa ser menor ou igual ao texto.'; return; }
      const st = steps[cur];
      const comps = st.comps.slice(0, sub);
      const cmap = {}; comps.forEach(c => (cmap[c.t] = c.ok ? 'ok' : 'bad'));
      let idx = '<div class="row">', tr = '<div class="row">', pr = '<div class="row">';
      for (let i = 0; i < T.length; i++) {
        idx += `<div class="cell idx">${i + 1}</div>`;
        let cls = 'cell';
        if (st.found && sub === st.comps.length && i >= st.pos && i < st.pos + P.length) cls += ' found';
        else if (cmap[i]) cls += ' ' + cmap[i];
        if (tipo !== 'fb' && i === st.shiftIdx && sub === st.comps.length) cls += ' key';
        tr += `<div class="${cls}">${esc(vis(T[i]))}</div>`;
      }
      for (let i = 0; i < Math.max(T.length, st.pos + P.length); i++) {
        if (i >= st.pos && i < st.pos + P.length) {
          const pc = comps.find(c => c.p === i - st.pos);
          pr += `<div class="cell pat ${pc ? (pc.ok ? 'ok' : 'bad') : ''}">${esc(vis(P[i - st.pos]))}</div>`;
        } else pr += '<div class="cell ghost"></div>';
      }
      strip.innerHTML = idx + '</div>' + tr + '</div>' + pr + '</div>';
      const done = sub === st.comps.length;
      let msg = `<b>Tentativa ${cur + 1} de ${steps.length}</b> · janela começa na posição ${st.pos + 1}. `;
      if (!done) msg += `Comparando ${sub} de ${st.comps.length} caracteres${tipo === 'fb' ? ' (da esquerda para a direita)' : ' (da direita para a esquerda)'}.`;
      else {
        msg += st.found ? '<span class="pill ok">Casamento encontrado</span> ' : '<span class="pill bad">Não casou</span> ';
        if (tipo === 'fb') msg += 'A janela anda 1 posição.';
        else if (tipo === 'bm') {
          if (st.found) msg += 'Depois de um casamento, a janela anda 1 posição.';
          else {
            const col = st.comps[st.comps.length - 1], c = T[col.t], q = P.lastIndexOf(c, col.p - 1);
            msg += q >= 0
              ? `Procurando <b>${esc(vis(c))}</b> no padrão à esquerda da colisão: está na posição ${q + 1}. A janela anda <b>${st.shift}</b> para alinhar os dois.`
              : `Não existe <b>${esc(vis(c))}</b> no padrão à esquerda da colisão: o padrão passa inteiro por cima dele e anda <b>${st.shift}</b>.`;
          }
        }
        else if (st.shift === null) msg += 'Não há mais caractere para consultar: a busca termina.';
        else msg += `O salto é decidido pelo caractere <b>${esc(vis(st.shiftChar))}</b> (posição ${st.shiftIdx + 1}, marcado em azul${tipo === 'bmh' ? ', alinhado ao último caractere do padrão' : ', logo depois da janela'}): a janela anda <b>${st.shift}</b>.`;
      }
      status.innerHTML = msg;
      if (dtab) $$('span', dtab).forEach(s => s.classList.toggle('on', done && st.shiftChar !== undefined && (s.dataset.c === st.shiftChar || (s.dataset.c === '__outro' && !(st.shiftChar in (tipo === 'bmh' ? Algos.tabelaBMH(P) : Algos.tabelaBMHS(P)).d)))));
      bPrev.disabled = cur === 0 && sub <= 1;
      bNext.disabled = cur === steps.length - 1 && done;
    }
    bNext.onclick = () => {
      const st = steps[cur];
      if (sub < st.comps.length) sub++;
      else if (cur < steps.length - 1) { cur++; sub = 1; }
      render();
    };
    bPrev.onclick = () => {
      if (sub > 1) sub--;
      else if (cur > 0) { cur--; sub = steps[cur].comps.length; }
      render();
    };
    bAll.onclick = () => {
      const achados = steps.filter(s => s.found).map(s => s.pos + 1);
      const comps = steps.reduce((a, s) => a + s.comps.length, 0);
      cur = steps.length - 1; sub = steps[cur].comps.length; render();
      status.innerHTML = `<b>Resumo:</b> ${steps.length} posições da janela, ${comps} comparações de caracteres. ` +
        (achados.length ? `${achados.length > 1 ? 'Casamentos nas posições' : 'Casamento na posição'} <b>${achados.join(', ')}</b>.` : 'Nenhum casamento.');
    };
    inT.oninput = inP.oninput = reset;
    reset();
  }

  /* ---------- Tabelas Shift-And ---------- */
  const bitsHtml = (x, m, destacarUltimo) => Algos.bits(x, m).split('').map((b, i) =>
    `<span class="${b === '1' ? (destacarUltimo && i === m - 1 ? 'lastbit' : 'bit1') : ''}">${b}</span>`).join(' ');

  function masksHtml(P) {
    const m = P.length, M = Algos.mascaras(P);
    return `<div class="tw"><table><tr><th></th>${[...P].map((_, i) => `<th>${i + 1}</th>`).join('')}</tr>` +
      Object.keys(M).map(c => `<tr><td class="mono">M[${esc(vis(c))}]</td>${Algos.bits(M[c], m).split('').map(b => `<td class="mono ${b === '1' ? 'bit1' : ''}">${b}</td>`).join('')}</tr>`).join('') +
      `<tr><td class="mono">outros</td>${[...P].map(() => '<td class="mono">0</td>').join('')}</tr></table></div>`;
  }

  function shiftAndSim(el) {
    const inT = $('input[name=t]', el), inP = $('input[name=p]', el), out = $('.out', el);
    const aprox = el.dataset.alg === 'aprox';
    const chk = n => { const c = $(`input[name=${n}]`, el); return c ? c.checked : false; };
    function run() {
      const T = inT.value, P = inP.value, m = P.length;
      if (!m || m > 30) { out.innerHTML = '<p class="muted">Use um padrão de 1 a 30 caracteres.</p>'; return; }
      let html = '<h4>Máscaras M (pré-processamento)</h4>' + masksHtml(P);
      if (!aprox) {
        const rows = Algos.shiftAndExato(T, P);
        html += `<h4>Pesquisa</h4><div class="tw"><table><tr><th>i</th><th>Texto</th><th>(R &gt;&gt; 1) | 10<sup>m-1</sup></th><th>M[T[i]]</th><th>R'</th><th></th></tr>` +
          rows.map((r, i) => `<tr class="${r.match ? 'hit' : ''}"><td>${i + 1}</td><td class="mono">${esc(vis(r.c))}</td><td class="mono">${bitsHtml(r.meio, m)}</td><td class="mono">${bitsHtml(Algos.mascaras(P)[r.c] || 0, m)}</td><td class="mono">${bitsHtml(r.R, m, true)}</td><td>${r.match ? `<span class="pill ok">casamento na posição ${r.pos}</span>` : ''}</td></tr>`).join('') + '</table></div>';
      } else {
        const ops = { ins: chk('ins'), sub: chk('sub'), ret: chk('ret') };
        const rows = Algos.shiftAndAprox1(T, P, ops);
        html += `<h4>Pesquisa com k = 1</h4><div class="tw"><table><tr><th>i</th><th>Texto</th><th>(R<sub>0</sub> &gt;&gt; 1) | 10<sup>m-1</sup></th><th>R'<sub>0</sub></th><th>R<sub>1</sub> &gt;&gt; 1</th><th>R'<sub>1</sub></th><th></th></tr>` +
          rows.map((r, i) => `<tr class="${r.exato ? 'hit' : r.aprox ? 'hit2' : ''}"><td>${i + 1}</td><td class="mono">${esc(vis(r.c))}</td><td class="mono">${bitsHtml(r.meio0, m)}</td><td class="mono">${bitsHtml(r.R0, m, true)}</td><td class="mono">${bitsHtml(r.r1s, m)}</td><td class="mono">${bitsHtml(r.R1, m, true)}</td><td>${r.exato ? '<span class="pill ok">exato</span>' : r.aprox ? '<span class="pill blue">aproximado</span>' : ''}</td></tr>`).join('') + '</table></div>' +
          '<p class="small muted">A coluna da direita aponta onde a ocorrência <b>termina</b> no texto (é o que o algoritmo informa).</p>';
      }
      out.innerHTML = html;
    }
    $$('input', el).forEach(i => (i.oninput = run));
    run();
  }

  document.addEventListener('DOMContentLoaded', () => {
    toc(); codeBlocks();
    const det = $('.toc details');
    if (det && window.innerWidth <= 900) det.removeAttribute('open');
    $$('.sim[data-alg=fb], .sim[data-alg=bm], .sim[data-alg=bmh], .sim[data-alg=bmhs]').forEach(alignSim);
    $$('.sim[data-alg=exato], .sim[data-alg=aprox]').forEach(shiftAndSim);
  });
})();
