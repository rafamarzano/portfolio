(function () {
'use strict';
/* ============================================================================
   EDIÇÃO DE NATAL · base compartilhada
   - Liga sozinha até 06/01/2027 (Dia de Reis) e desliga depois disso.
   - Para desligar antes: apague as duas linhas "natal/" do index.html.
   - Para comparar com o site normal: abra a página com ?natal=0
   ============================================================================ */
const NATAL_FIM = new Date(2027, 0, 7);          // desliga a partir daqui
const ATIVO = new Date() < NATAL_FIM && !/[?&]natal=0/.test(location.search);
const REDUZIR = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}
function deco(cls, html) {
  const n = el('div', 'natal-deco ' + cls, html);
  n.setAttribute('aria-hidden', 'true');
  return n;
}
function aleatorio(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
const f1 = v => Math.round(v * 10) / 10;

/* ---------- faixa com contagem regressiva ---------- */
function textosFaixa(lang) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const natal = new Date(2026, 11, 25);
  const d = Math.round((natal - hoje) / 864e5);
  const en = lang === 'en';
  let contagem;
  if (d > 1) contagem = en ? `${d} days until Christmas` : `faltam ${d} dias pro Natal`;
  else if (d === 1) contagem = en ? '1 day until Christmas' : 'falta 1 dia pro Natal';
  else if (d === 0) contagem = en ? "it's Christmas!" : 'é Natal!';
  else contagem = en ? 'happy holidays!' : 'boas festas!';
  return {
    selo: en ? 'XMAS' : 'NATAL',
    contagem,
    detalhe: d >= 0
      ? (en ? 'UGC content for holiday campaigns' : 'conteúdo UGC pra campanha de fim de ano')
      : (en ? "let's plan your next campaigns" : 'bora planejar as próximas campanhas'),
    cta: d >= 0 ? (en ? 'book a spot' : 'reservar agenda') : (en ? 'get in touch' : 'fale comigo'),
  };
}
function pintarFaixa(faixa, lang) {
  const t = textosFaixa(lang);
  faixa.querySelector('.nf-selo').textContent = t.selo;
  faixa.querySelector('.nf-contagem').textContent = t.contagem;
  faixa.querySelector('.nf-detalhe').textContent = t.detalhe;
  faixa.querySelector('.nf-cta').textContent = t.cta + ' →';
}
function criarFaixa(destino) {
  const a = el('a', 'natal-faixa',
    '<span class="nf-selo"></span><strong class="nf-contagem"></strong>' +
    '<span class="nf-detalhe"></span><span class="nf-cta"></span>');
  a.href = destino;
  return a;
}

/* ---------- neve ---------- */
function neve({ cores, zIndex, contorno }) {
  if (REDUZIR) return;
  const c = el('canvas', 'natal-neve');
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:${zIndex}`;
  document.body.appendChild(c);
  const g = c.getContext('2d');
  let W, H, flocos = [];
  function medir() {
    const r = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    c.width = W * r; c.height = H * r; g.setTransform(r, 0, 0, r, 0, 0);
    const n = W < 700 ? 22 : 48;
    flocos = Array.from({ length: n }, (_, i) => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 1.6 + Math.random() * 2.8, v: .25 + Math.random() * .6,
      f: Math.random() * 6.28, cor: cores[i % cores.length], estrela: i % 7 === 0,
    }));
  }
  function quadro() {
    g.clearRect(0, 0, W, H);
    for (const p of flocos) {
      p.y += p.v; p.f += .012; p.x += Math.sin(p.f) * .35;
      if (p.y > H + 8) { p.y = -8; p.x = Math.random() * W; }
      g.beginPath();
      if (p.estrela) {
        const R = p.r * 2.2;
        g.strokeStyle = p.cor; g.lineWidth = 1.2;
        for (let k = 0; k < 3; k++) {
          const a = k * Math.PI / 3 + p.f * .4;
          g.moveTo(p.x - Math.cos(a) * R, p.y - Math.sin(a) * R);
          g.lineTo(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R);
        }
        g.stroke();
      } else {
        g.fillStyle = p.cor; g.arc(p.x, p.y, p.r, 0, 6.2832); g.fill();
        if (contorno) { g.strokeStyle = contorno; g.lineWidth = .6; g.stroke(); }
      }
    }
    requestAnimationFrame(quadro);
  }
  medir(); quadro();
  addEventListener('resize', medir);
}

/* redesenha enfeites que dependem da largura */
function aoRedimensionar(fn) {
  let t, w = -1;
  const rodar = () => { if (innerWidth !== w) { w = innerWidth; fn(); } };
  rodar();
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(rodar, 150); });
}

/* ---------- fotos em duas fileiras que correm em sentidos opostos ---------- */
function carrossel(grade, inserir) {
  if (!grade) return;
  const caixa = el('div', 'natal-fotos');
  const VELOCIDADE = 45;                        // pixels por segundo (igual nas duas fileiras)
  const montarFileiras = () => {
    const fotos = $$('img', grade).map(i => ({ src: i.getAttribute('src'), alt: i.alt, pos: i.style.objectPosition || 'center' }));
    if (!fotos.length) return;                  // sem fotos, a grade original continua
    if (!caixa.isConnected) inserir(caixa);
    grade.classList.add('natal-oculta');
    const vw = document.documentElement.clientWidth;
    const w = Math.round(Math.min(250, Math.max(150, vw * .135))), vao = vw < 640 ? 8 : 12;
    caixa.style.setProperty('--nf-w', w + 'px');
    caixa.style.setProperty('--nf-vao', vao + 'px');
    const meio = Math.ceil(fotos.length / 2);
    const fileiras = [fotos.slice(0, meio), fotos.slice(meio)].filter(f => f.length);
    // mesma quantidade de voltas e mesma duração nas duas fileiras: andam juntas, em sentidos opostos
    const voltas = Math.max(1, ...fileiras.map(l => Math.ceil(vw / (l.length * (w + vao)))));
    const largura = Math.max(...fileiras.map(l => l.length)) * voltas * (w + vao);
    const tempo = Math.round(largura / VELOCIDADE);
    caixa.innerHTML = fileiras.map((lista, n) => {
      const grupo = Array.from({ length: voltas }, () => lista).flat();
      const html = [...grupo, ...grupo].map((f, i) => {
        const copia = i >= lista.length;
        const img = el('img');
        img.setAttribute('src', f.src); img.alt = copia ? '' : f.alt; img.style.objectPosition = f.pos;
        if (copia) img.setAttribute('aria-hidden', 'true');
        return img.outerHTML;
      }).join('');
      return `<div class="nf-fileira${n % 2 ? ' nf-volta' : ''}"><div class="nf-trilho" style="animation-duration:${tempo}s">${html}</div></div>`;
    }).join('');
  };
  aoRedimensionar(montarFileiras);
  new MutationObserver(montarFileiras).observe(grade, { childList: true });
}

/* ============================================================================
   TEMA: Natal Y2K rosa (portfólio principal)
   ============================================================================ */
const K = '#18130f', ROSA = '#ff2d87', ROSA2 = '#ff6fb0', ESC = '#d4006b',
      BR = '#fffaf6', AM = '#ffe066', AZ = '#c9f2ff', VM = '#ff3b3b', CLARO = '#ffd1e8';

const svg = (vb, corpo, extra = '') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" ${extra}>${corpo}</svg>`;

const laco = (cor = ROSA) => svg('0 0 100 74',
  `<g stroke="${K}" stroke-width="3" stroke-linejoin="round" fill="${cor}">
    <path d="M45 32 L26 70 L35 64 L42 72 L54 38Z"/><path d="M55 32 L74 70 L65 64 L58 72 L46 38Z"/>
    <path d="M47 30 C30 4 6 2 5 22 C4 42 28 46 47 36Z"/><path d="M53 30 C70 4 94 2 95 22 C96 42 72 46 53 36Z"/>
    <rect x="40" y="23" width="20" height="20" rx="7"/></g>
   <path d="M16 18c3-7 10-8 16-3M68 15c6-5 13-4 16 3" fill="none" stroke="${BR}" stroke-width="3" stroke-linecap="round"/>`);

const gorro = () => svg('0 0 120 96',
  `<g stroke="${K}" stroke-width="3" stroke-linejoin="round">
    <path d="M18 70 C22 28 52 6 76 14 C96 20 104 38 104 56 C96 42 86 40 82 40 C90 50 94 60 94 70Z" fill="${ROSA}"/>
    <circle cx="104" cy="60" r="12" fill="${BR}"/>
    <rect x="8" y="64" width="96" height="22" rx="11" fill="${BR}"/></g>
   <path d="M34 52c6-18 18-28 32-31" fill="none" stroke="${CLARO}" stroke-width="4" stroke-linecap="round"/>`);

const bola = (cor, brilho = BR) => svg('0 0 60 74',
  `<rect x="23" y="6" width="14" height="12" rx="2" fill="${AM}" stroke="${K}" stroke-width="2.5"/>
   <circle cx="30" cy="43" r="27" fill="${cor}" stroke="${K}" stroke-width="2.5"/>
   <path d="M5 40q12 9 25 0t25 0" fill="none" stroke="${brilho}" stroke-width="4"/>
   <path d="M14 32c3-8 9-12 15-13" fill="none" stroke="${brilho}" stroke-width="3.5" stroke-linecap="round"/>`);

const cereja = () => svg('0 0 70 80',
  `<path d="M36 2C34 22 24 34 19 48M36 2C42 22 50 32 51 52" fill="none" stroke="${K}" stroke-width="3" stroke-linecap="round"/>
   <path d="M37 12c10-10 24-8 28 0-9 8-21 8-28 0Z" fill="#7ed957" stroke="${K}" stroke-width="2.5"/>
   <g fill="${VM}" stroke="${K}" stroke-width="2.5"><circle cx="19" cy="58" r="15"/><circle cx="50" cy="62" r="15"/></g>
   <path d="M11 55c1-5 5-8 9-8M42 59c1-5 5-8 9-8" fill="none" stroke="${BR}" stroke-width="3" stroke-linecap="round"/>`);

let nBengala = 0;
const bengala = () => { const id = 'ngb' + (++nBengala); return svg('0 0 60 100',
  `<defs><pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
    <rect width="16" height="16" fill="${BR}"/><rect width="8" height="16" fill="${ROSA}"/></pattern></defs>
   <path d="M14 94 V30 C14 2 50 2 50 30 V38" fill="none" stroke="${K}" stroke-width="18" stroke-linecap="round"/>
   <path d="M14 94 V30 C14 2 50 2 50 30 V38" fill="none" stroke="url(#${id})" stroke-width="13" stroke-linecap="round"/>`); };

const presente = (c1, c2) => svg('0 0 80 78',
  `<g stroke="${K}" stroke-width="2.5" stroke-linejoin="round">
    <rect x="10" y="32" width="60" height="42" fill="${c1}"/><rect x="5" y="22" width="70" height="14" rx="2" fill="${c1}"/>
    <rect x="34" y="22" width="12" height="52" fill="${c2}"/>
    <path d="M40 22C30 2 12 6 20 17c4 5 13 5 20 5ZM40 22c10-20 28-16 20-5-4 5-13 5-20 5Z" fill="${c2}"/></g>`);

const biscoito = () => svg('0 0 80 96',
  `<path d="M40 4c13 0 20 9 20 19 0 6-2 10-6 13l19 4c8 2 7 15-2 15l-15-2 4 16 10 17c4 8-8 14-13 7L40 76 23 93c-5 7-17 1-13-7l10-17 4-16-15 2c-9 0-10-13-2-15l19-4c-4-3-6-7-6-13 0-10 7-19 20-19Z"
    fill="#d9985b" stroke="${K}" stroke-width="2.5" stroke-linejoin="round"/>
   <g fill="${K}"><circle cx="33" cy="20" r="2.8"/><circle cx="47" cy="20" r="2.8"/></g>
   <path d="M32 28q8 7 16 0M10 44l3 8M70 44l-3 8M17 80l8 5M63 80l-8 5" fill="none" stroke="${BR}" stroke-width="3" stroke-linecap="round"/>
   <g fill="${ROSA}" stroke="${K}" stroke-width="1.5"><circle cx="40" cy="47" r="4.5"/><circle cx="40" cy="61" r="4.5"/></g>`);

const meia = (cor, det, i) => svg('0 0 70 104',
  `<g stroke="${K}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M20 22H52V58C52 66 50 70 46 74L28 94C16 106 -2 88 9 76L20 63Z" fill="${cor}"/>
    <path d="M9 76c9-3 21 7 19 18C16 106-2 88 9 76Z" fill="${det}"/>
    <rect x="15" y="8" width="42" height="20" rx="8" fill="${BR}"/></g>
   ${i % 2 ? `<path d="M22 40h29M22 51h29" stroke="${det}" stroke-width="5"/>` :
     `<path d="M37 56s-10-6-10-12c0-6 8-7 10-2 2-5 10-4 10 2 0 6-10 12-10 12Z" fill="${det}" stroke="${K}" stroke-width="1.5"/>`}`);

/* pisca-pisca estilo adesivo */
function pisca(largura) {
  const vao = largura < 700 ? largura / 2 : largura / Math.round(largura / 300);
  const n = Math.ceil(largura / vao), H = 70, cores = [ROSA, AM, AZ, VM, BR, ROSA2];
  let fio = '', luzes = '', lacos = '', k = 0;
  for (let i = 0; i < n; i++) {
    const x0 = i * vao, x1 = x0 + vao, meio = x0 + vao / 2, y0 = 8, cy = 50;
    fio += `<path d="M${f1(x0)} ${y0} Q${f1(meio)} ${cy} ${f1(x1)} ${y0}"/>`;
    const q = Math.max(3, Math.floor(vao / 44));
    for (let j = 1; j <= q; j++) {
      const t = j / (q + 1), x = x0 + vao * t;
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y0;
      const ang = f1((t - .5) * -34), cor = cores[k++ % cores.length];
      luzes += `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${ang})">
        <rect x="-4.5" y="-1" width="9" height="8" rx="1.5" fill="${K}"/>
        <path class="n-luz" style="animation-delay:${(k % 5) * .35}s" d="M0 6C9 9 10 20 0 28C-10 20-9 9 0 6Z" fill="${cor}" stroke="${K}" stroke-width="2"/>
        <path d="M-4 12q-1 4 1 7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`;
    }
    if (i > 0) lacos += `<g transform="translate(${f1(x0 - 20)} -3) scale(.4)">${laco(i % 2 ? ROSA : VM).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
  }
  return svg(`0 0 ${largura} ${H}`, `<g fill="none" stroke="${K}" stroke-width="2.5">${fio}</g>${luzes}${lacos}`,
    `width="${largura}" height="${H}"`);
}

/* árvore de Natal rosa com presentes */
function arvore() {
  const camada = (y, w, h) => {
    const x0 = 130 - w / 2, passo = w / 5;
    let d = `M130 ${y} L${130 + w / 2} ${y + h}`;
    for (let i = 0; i < 5; i++) {
      const a = 130 + w / 2 - passo * i;
      d += ` Q${f1(a - passo / 2)} ${y + h + 18} ${f1(a - passo)} ${y + h}`;
    }
    return `<path d="${d}Z" fill="${ROSA2}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>`;
  };
  const bolinhas = [[130,75,AM],[108,110,AZ],[152,118,BR],[90,158,BR],[130,152,VM],[172,162,AM],[70,208,AM],[112,214,BR],[154,206,AZ],[192,212,VM]]
    .map(([x,y,c], i) => `<circle class="n-luz" style="animation-delay:${(i % 4) * .4}s" cx="${x}" cy="${y}" r="7.5" fill="${c}" stroke="${K}" stroke-width="2"/>`).join('');
  return svg('0 0 260 310',
    `<rect x="116" y="232" width="28" height="42" fill="#a8643a" stroke="${K}" stroke-width="3"/>
     ${camada(150,200,80)}${camada(95,160,72)}${camada(42,116,66)}
     <path d="M92 100q38 20 70 4M72 152q56 34 122 6M56 204q70 40 150 4" fill="none" stroke="${AM}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 10"/>
     ${bolinhas}
     <path d="M130 8l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3Z" fill="${AM}" stroke="${K}" stroke-width="3" stroke-linejoin="round"/>
     <g transform="translate(18 228) scale(1.05)">${presente(BR, ROSA).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
     <g transform="translate(162 234) scale(.98)">${presente(AM, VM).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>
     <g transform="translate(98 250) scale(.76)">${presente(ROSA, AZ).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`);
}

function solto(pai, cls, html, estilo) {
  if (!pai) return;
  const d = deco('n-solto ' + cls, html);
  d.style.cssText = estilo;
  pai.appendChild(d);
  return d;
}

function montar() {
  document.documentElement.classList.add('natal');

  /* faixa + tema */
  const faixa = criarFaixa('#contact');
  document.body.insertBefore(faixa, document.body.firstChild);
  const lingua = () => $('.lang-btn.active')?.dataset.lang || 'pt';
  pintarFaixa(faixa, lingua());
  $$('.lang-btn').forEach(b => b.addEventListener('click', () => pintarFaixa(faixa, b.dataset.lang)));
  $('meta[name="theme-color"]')?.setAttribute('content', ESC);

  /* frases de fim de ano no letreiro do topo */
  if (typeof TICKER_PHRASES !== 'undefined' && typeof renderTickerTrack === 'function') {
    TICKER_PHRASES.pt.splice(1, 0, 'holiday edit'); TICKER_PHRASES.pt.splice(4, 0, 'all i want is content');
    TICKER_PHRASES.en.splice(1, 0, 'holiday edit'); TICKER_PHRASES.en.splice(4, 0, 'all i want is content');
    renderTickerTrack();
  }

  /* hero */
  const hero = $('.hero');
  const luzes = deco('n-pisca'); hero.appendChild(luzes);
  aoRedimensionar(() => { luzes.innerHTML = pisca(document.documentElement.clientWidth); });

  const principal = $('.hp1');
  if (principal) { principal.appendChild(deco('n-moldura')); principal.appendChild(deco('n-gorro', gorro())); }
  solto($('.hp2'), 'n-laco-hp2', laco(VM), '');

  solto(hero, 'n-pc float-a', cereja(), 'left:2.5%;top:61%;width:64px;--r:-6deg');
  solto(hero, 'n-pc float-b', bengala(), 'left:50%;top:33%;width:44px');
  solto(hero, 'n-pc float-a', biscoito(), 'right:2.5%;top:73%;width:62px;--r:9deg');
  solto(hero, 'n-hero-mob n-esq', cereja(), '');
  solto(hero, 'n-hero-mob n-dir', bengala(), '');

  /* laço em cima de cada título de seção */
  $$('.sec-head').forEach((h, i) => h.insertBefore(deco('n-laco-titulo', laco(i % 2 ? VM : ROSA)), h.firstChild));

  /* neve escorrendo no topo das seções */
  $$('#about, #case, #videos, #photos, #feedbacks, #services, #processo, #duvidas, #contact')
    .forEach(s => s.insertBefore(deco('n-neve-borda'), s.firstChild));

  /* fotos em carrossel */
  const grade = $('#photoGrid');
  carrossel(grade, c => $('#photos').appendChild(c));

  /* fotos do "sobre mim": moldura de bengala doce, igual à da foto principal */
  $$('.photo-stack .polaroid').forEach(p => p.appendChild(deco('n-moldura')));

  /* diário */
  solto($('.diary'), 'n-diario-laco', laco(ROSA), '');
  solto($('#about'), 'n-pc float-b', bengala(), 'right:5%;top:42%;width:58px');
  solto($('#about'), 'n-pc float-a', presente(ROSA, AM), 'left:4%;top:55%;width:74px;--r:-8deg');

  /* bolas penduradas */
  [['#case', 'left:5%', 70, ROSA], ['#case', 'right:6%', 120, AM],
   ['#feedbacks', 'left:7%', 96, AZ], ['#feedbacks', 'right:5%', 60, VM],
   ['#processo', 'left:5%', 110, ROSA2], ['#processo', 'right:7%', 70, AM],
   ['#duvidas', 'left:6%', 80, VM], ['#duvidas', 'right:5%', 130, ROSA]]
    .forEach(([s, lado, fio, cor]) =>
      solto($(s), 'n-pendurada', `<i style="height:${fio}px"></i>${bola(cor)}`, `${lado};top:0`));

  solto($('#photos'), 'n-pc float-a', biscoito(), 'right:4%;top:12%;width:70px;--r:8deg');
  solto($('#photos'), 'n-pc float-b', cereja(), 'left:5%;top:14%;width:66px');
  solto($('#videos'), 'n-pc float-b', presente(AM, ROSA), 'right:5%;top:90px;width:76px');
  solto($('#videos'), 'n-pc float-a', bengala(), 'left:6%;top:90px;width:50px;--r:-12deg');

  /* varal de meias antes dos serviços */
  const serv = $('#services');
  if (serv) {
    const varal = deco('n-varal');
    serv.insertBefore(varal, $('.wrap', serv));
    aoRedimensionar(() => {
      const w = document.documentElement.clientWidth, n = w < 600 ? 4 : w < 1000 ? 6 : 9;
      const pares = [[ROSA, AM], [BR, ROSA], [VM, BR], [AZ, ROSA2]];
      let h = `<svg class="n-corda" viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 4Q50 52 100 4" fill="none" stroke="${K}" stroke-width="2.5" vector-effect="non-scaling-stroke"/></svg>`;
      for (let i = 0; i < n; i++) {
        const t = (i + .5) / n, y = (4 + 96 * t * (1 - t)) * 46 / 40;
        const [c, d] = pares[i % 4];
        h += `<span class="n-meia" style="left:${f1(t * 100)}%;top:${f1(y - 7)}px;--g:${f1((t - .5) * -14)}deg">${meia(c, d, i)}</span>`;
      }
      varal.innerHTML = h;
    });
  }

  /* árvore no contato */
  const coluna = $('.contact-grid > div:first-child');
  if (coluna) coluna.appendChild(deco('n-arvore', arvore()));

  neve({ cores: ['#ffffff', '#ffffff', '#ff9ecb'], zIndex: 70, contorno: 'rgba(255,45,135,.45)' });
}

if (ATIVO) montar();
})();
