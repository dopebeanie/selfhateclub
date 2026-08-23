/* ============================================================
   SELFHATE CLUB — интерактивный слой
   ============================================================ */
(() => {
'use strict';

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = matchMedia('(hover:hover) and (pointer:fine)').matches;
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* ================= TOASTS ================= */
const ICONS = {
  success: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  info:    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 11v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.6" r="1.15" fill="currentColor"/></svg>'
};
const toastBox = $('#toasts');
function toast(type, title, msg, dur = 3600) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.style.setProperty('--dur', dur + 'ms');
  el.innerHTML =
    `<span class="toast-ic">${ICONS[type] || ICONS.info}</span>` +
    `<div class="toast-body"><div class="toast-title">${title}</div><div class="toast-msg">${msg}</div></div>` +
    `<button class="toast-close" aria-label="Закрыть"><svg viewBox="0 0 24 24" width="12" height="12"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>` +
    `<i class="toast-progress"></i>`;
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 380); };
  el.querySelector('.toast-close').addEventListener('click', kill);
  toastBox.appendChild(el);
  setTimeout(kill, dur);
  return el;
}

/* ================= PRELOADER ================= */
const preloader = $('#preloader');
const preBarFill = $('#preBarFill'), prePercent = $('#prePercent'), preStatus = $('#preStatus');
const STATUSES = ['инициализация', 'загрузка ассетов', 'подключение к jp-серверу', 'синхронизация ладдера', 'готово'];
let prog = 0, winLoaded = false;

window.addEventListener('load', () => winLoaded = true);
setTimeout(() => winLoaded = true, 5000); // страховка

const preTimer = setInterval(() => {
  const step = winLoaded ? 100 : Math.min(92, prog + 6 + Math.random() * 13);
  prog += Math.max(0, (step - prog) * 0.55 + (winLoaded ? 4 : 0));
  if (!winLoaded && prog > 92) prog = 92;
  prog = Math.min(prog, winLoaded ? 100 : 92);
  preBarFill.style.width = prog.toFixed(0) + '%';
  prePercent.textContent = prog.toFixed(0) + '%';
  preStatus.textContent = STATUSES[Math.min(STATUSES.length - 1, Math.floor(prog / 25))];
  if (prog >= 100) {
    clearInterval(preTimer);
    setTimeout(finishPreload, 420);
  }
}, 120);

function finishPreload() {
  preloader.classList.add('done');
  document.body.classList.remove('loading');
  initReveals();
  startTyped();
  startGlitch();
  toast('info', 'Добро пожаловать в клуб', 'Ладдер синхронизирован. Топ-450 подтверждён.');
  setTimeout(() => preloader.remove(), 900);
}

/* ================= REVEAL + COUNTERS ================= */
function initReveals() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.style.transitionDelay = (en.target.dataset.delay || 0) + 'ms';
        en.target.classList.add('visible');
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
    });
  }, { threshold: 0.6 });
  $$('.counter').forEach(el => cio.observe(el));
}
function runCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const pad = parseInt(el.dataset.pad || 0, 10);
  const dur = 1500, t0 = performance.now();
  const tick = now => {
    let k = Math.min(1, (now - t0) / dur);
    k = 1 - Math.pow(1 - k, 3);
    let val = String(Math.round(target * k));
    if (pad) val = val.padStart(pad, '0');
    el.textContent = val;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ================= CUSTOM CURSOR ================= */
const dot = $('#cursorDot'), ring = $('#cursorRing');
let mx = innerWidth / 2, my = innerHeight / 2, rxp = mx, ryp = my;
let lastTrail = 0;

if (FINE) {
  document.documentElement.classList.add('cur-on');
  const place = (el, x, y) => { el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`; };
  place(dot, mx, my); place(ring, mx, my);
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    place(dot, mx, my);
    if (!REDUCED && performance.now() - lastTrail > 34) {
      lastTrail = performance.now();
      spawnTrail(mx, my);
    }
  }, { passive: true });
  document.addEventListener('mousedown', () => document.body.classList.add('cursor-down'));
  document.addEventListener('mouseup', () => document.body.classList.remove('cursor-down'));
  document.addEventListener('mouseover', e => {
    document.body.classList.toggle('cursor-hover',
      !!e.target.closest('a,button,input,textarea,[data-cursor],.dchip'));
  });
  (function loopRing() {
    rxp += (mx - rxp) * 0.16;
    ryp += (my - ryp) * 0.16;
    ring.style.transform = `translate(${rxp}px,${ryp}px) translate(-50%,-50%)`;
    requestAnimationFrame(loopRing);
  })();
}
function spawnTrail(x, y) {
  const p = document.createElement('i');
  p.className = 'trail-p';
  const s = 3 + Math.random() * 4;
  p.style.cssText = `left:${x}px;top:${y}px;width:${s}px;height:${s}px`;
  p.addEventListener('animationend', () => p.remove());
  document.body.appendChild(p);
}

/* ================= MAGNETIC ================= */
$$('.magnetic').forEach(el => {
  if (el.classList.contains('scroll-hint')) return; // не ломаем центрирование
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${dx * 0.22}px,${dy * 0.22}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transition = 'transform .45s cubic-bezier(.34,1.56,.64,1)';
    el.style.transform = '';
    setTimeout(() => el.style.transition = '', 480);
  });
});

/* ================= RIPPLE ================= */
$$('.ripple-host').forEach(host => host.addEventListener('click', e => {
  const r = host.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 1.1;
  const x = (e.clientX || r.left + r.width / 2) - r.left - size / 2;
  const y = (e.clientY || r.top + r.height / 2) - r.top - size / 2;
  const sp = document.createElement('span');
  sp.className = 'ripple';
  sp.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`;
  host.appendChild(sp);
  setTimeout(() => sp.remove(), 700);
  buzz(8);
}));

/* ================= 3D TILT + SPOTLIGHT ================= */
$$('[data-tilt-max]').forEach(el => {
  if (!FINE) return;
  const max = parseFloat(el.dataset.tiltMax || 8);
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', (nx * max).toFixed(2) + 'deg');
    el.style.setProperty('--rx', (-ny * max).toFixed(2) + 'deg');
    if (el.classList.contains('spotlight')) {
      el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }
  });
  el.addEventListener('mouseleave', () => {
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  });
});

/* ================= PARTICLE SYSTEM ================= */
(function initParticles() {
  const cv = $('#fxParticles');
  if (!cv || REDUCED) return;
  const ctx = cv.getContext('2d');
  let W, H, dpr, parts = [];
  const COLORS = ['#ff3348', '#e11d2e', '#ff8896'];
  const mouse = { x: -999, y: -999 };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr;
    H = cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px';
    cv.style.height = innerHeight + 'px';
    const n = Math.max(30, Math.min(90, Math.round(innerWidth * innerHeight / 24000)));
    parts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: (0.6 + Math.random() * 1.7) * dpr,
      vx: (Math.random() - 0.5) * 0.24 * dpr,
      vy: -(0.08 + Math.random() * 0.38) * dpr,
      tw: Math.random() * Math.PI * 2,
      a: 0.18 + Math.random() * 0.42,
      c: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  }
  resize();
  addEventListener('resize', resize);
  document.addEventListener('mousemove', e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });

  let paused = false;
  document.addEventListener('visibilitychange', () => paused = document.hidden);

  (function draw(t) {
    requestAnimationFrame(draw);
    if (paused) return;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy;
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 13000 * dpr && d2 > 1) {
        const f = 26 / Math.sqrt(d2);
        p.x += dx * f; p.y += dy * f;
      }
      if (p.y < -12) { p.y = H + 10; p.x = Math.random() * W; }
      if (p.x < -12) p.x = W + 10; else if (p.x > W + 12) p.x = -10;
      const alpha = p.a * (0.55 + 0.45 * Math.sin(t / 900 + p.tw));
      ctx.globalAlpha = Math.max(0.04, alpha);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  })(0);
})();

/* ================= TYPING ================= */
function startTyped() {
  const el = $('#typed');
  if (!el) return;
  const phrases = [
    'ТОП-450 ЛАДДЕРА ГИЛЬДИЙ ЯПОНИИ',
    'ПЯТЬ ИГРОКОВ · ОДНА ЦЕЛЬ',
    'БОЛЬ — В СЕБЕ. АГРЕССИЯ — В ИГРЕ.'
  ];
  let pi = 0, ci = 0, del = false;
  (function tick() {
    const word = phrases[pi];
    el.textContent = word.slice(0, ci);
    let wait = del ? 26 : 52;
    if (!del && ci === word.length) { wait = 2100; del = true; }
    else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 420; }
    else ci += del ? -1 : 1;
    setTimeout(tick, wait);
  })();
}

/* ================= GLITCH BURSTS ================= */
function startGlitch() {
  const title = $('.glitch');
  if (!title || REDUCED) return;
  setInterval(() => {
    if (Math.random() < 0.34) {
      title.classList.add('glitch-on');
      setTimeout(() => title.classList.remove('glitch-on'), 330);
    }
  }, 2300);
}

/* ================= SCROLL PROGRESS + HEADER ================= */
const headerEl = $('#header'), progressFill = $('#scrollProgressFill');
let scrollScheduled = false;
addEventListener('scroll', () => {
  if (scrollScheduled) return;
  scrollScheduled = true;
  requestAnimationFrame(() => {
    scrollScheduled = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progressFill.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + '%';
    headerEl.classList.toggle('scrolled', scrollY > 30);
  });
}, { passive: true });

/* ================= MARQUEE (seamless) ================= */
(function marquee() {
  const track = $('#marqueeTrack');
  if (!track) return;
  const html = track.innerHTML;
  track.innerHTML = html + html;
  if (track.scrollWidth < innerWidth * 2.2) track.innerHTML += html;
})();

/* ================= ACCORDION ================= */
$$('.acc-head').forEach(btn => btn.addEventListener('click', () => {
  const item = btn.parentElement;
  const body = item.querySelector('.acc-body');
  const open = item.classList.contains('open');
  $$('.acc-item.open').forEach(o => {
    o.classList.remove('open');
    o.querySelector('.acc-body').style.maxHeight = null;
    o.querySelector('.acc-head').setAttribute('aria-expanded', 'false');
  });
  if (!open) {
    item.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    btn.setAttribute('aria-expanded', 'true');
    buzz(6);
  }
}));

/* ================= FLIP на тач-устройствах ================= */
$$('.pcard').forEach(card => card.addEventListener('click', e => {
  if (FINE) return;
  if (e.target.closest('a,button')) return;
  card.classList.toggle('flipped');
}));

/* ================= MODAL: card-окна игроков ================= */
const CAL_SVG = '<svg viewBox="0 0 24 24" class="ic-xs" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
const PIN_SVG = '<svg viewBox="0 0 24 24" class="ic-xs" aria-hidden="true"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>';
const SWORD_SVG = '<svg viewBox="0 0 24 24" class="ic-xs" aria-hidden="true"><path d="M14.5 3.5L20.5 9.5 11 19l-4.5 1L4 17.5 5 13z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 6l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const QUOTE_SVG = '<svg viewBox="0 0 24 24" class="quote-ic" aria-hidden="true"><path d="M5 17c0-5 2.5-8.5 6-10l.8 1.4C9.5 9.8 8.4 11.4 8.2 13c.3-.1.7-.2 1.1-.2 1.6 0 2.9 1.3 2.9 3a3 3 0 0 1-3 3c-2.4 0-4.2-1.7-4.2-1.8zm9.8 0c0-5 2.5-8.5 6-10l.8 1.4c-2.3 1.4-3.4 3-3.6 4.6.3-.1.7-.2 1.1-.2 1.6 0 2.9 1.3 2.9 3a3 3 0 0 1-3 3c-2.4 0-4.2-1.7-4.2-1.8z" fill="currentColor"/></svg>';
const TG_SVG = '<svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><path d="M21 5L3.8 11.6c-.8.3-.75 1.4.05 1.65l4.35 1.35 1.6 4.9c.25.75 1.25.85 1.65.15l2.2-3.8 4.55 3.35c.65.5 1.6.15 1.75-.65L21.9 6.1c.15-.85-.7-1.5-1.45-1.1z" transform="scale(.92) translate(1 .6)" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

const PLAYERS = {
  tak1ra: {
    nick: 'Tak1ra', name: 'Манин Артём Витальевич', file: 'PLAYER FILE // 01',
    img: 'assets/artem.jpg',
    age: '19 лет | 08.08.2007', city: 'Ульяновск, Российская Федерация',
    roleTag: 'POS 1 · CORE', role: 'Core',
    heroes: ['Slark', 'Invoker', 'Shadow Fiend'],
    quote: 'Имеются качества лидера: добрый, понимающий, амбициозный, преданный.',
    tg: 'sxulcanseeyou'
  },
  lunar: {
    nick: 'Lunar', name: 'Баязитов Радмир', file: 'PLAYER FILE // 02',
    img: null,
    age: '14 лет | 22.09.2011', city: 'Уфа, Россия',
    roleTag: 'POS 2 · MID / CARRY', role: 'Mid-lane, Carry',
    heroes: ['Ember Spirit', 'Queen of Pain'],
    quote: '«67 бож, я бог».',
    tg: null
  },
  coldstly: {
    nick: 'coldstly', name: 'Карпенко Иван Александрович', file: 'PLAYER FILE // 03',
    img: 'assets/ivan_coldstly.jpg',
    age: '16 лет | 12.04.2010', city: 'Уфа, Российская Федерация',
    roleTag: 'POS 4 · SOFT SUP', role: 'Soft-Support / Full-Support',
    heroes: ['Lion', 'Juggernaut'],
    quote: 'Хороший саппорт: ношу шмотки, ставлю варды.',
    tg: 'coldstly'
  },
  findouthoww: {
    nick: 'Findouthoww', name: 'Любятинский Денис Антонович', file: 'PLAYER FILE // 04',
    img: 'assets/denis_findouthoww.jpg',
    age: '16 лет | 24.12.2009', city: 'Ульяновск, Российская Федерация',
    roleTag: 'POS 5 · FULL SUP', role: 'Soft-Support / Full Support',
    heroes: ['Io', 'Hoodwink'],
    quote: 'Чилл паренёк, любит колу.',
    tg: 'Mayor2286'
  }
};

const MOON_AVATAR = `<svg viewBox="0 0 200 200" style="width:100%;height:100%;display:block">
  <defs><linearGradient id="moonGradM" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#ff3348"/><stop offset="1" stop-color="#5c0713"/></linearGradient></defs>
  <rect width="200" height="200" fill="#100b0f"/>
  <circle cx="100" cy="100" r="86" fill="none" stroke="rgba(255,51,72,.25)" stroke-width="2"/>
  <path d="M128 52a56 56 0 1 0 20 76 46 46 0 0 1-20-76z" fill="url(#moonGradM)" opacity=".92"/>
  <circle cx="58" cy="64" r="2.4" fill="#ff8896"/><circle cx="146" cy="150" r="1.8" fill="#ff8896"/>
  <circle cx="150" cy="58" r="1.4" fill="#ff8896"/></svg>`;

const modal = $('#playerModal'), modalContent = $('#modalContent');

function openPlayer(key) {
  const p = PLAYERS[key];
  if (!p) return;
  const chips = p.heroes.map(h => `<span class="chip">${h}</span>`).join('');
  const tgBlock = p.tg
    ? `<a class="btn btn-primary ripple-host" href="https://t.me/${p.tg}" target="_blank" rel="noopener">${TG_SVG}<span class="btn-label">Написать @${p.tg}</span></a>`
    : `<span class="mono" style="align-self:center;font-size:11px;color:var(--muted);letter-spacing:.18em">СВЯЗЬ ЧЕРЕЗ DISCORD ГИЛЬДИИ</span>`;
  modalContent.innerHTML =
    `<div class="m-grid">` +
      `<div class="m-media">${p.img ? `<img src="${p.img}" alt="${p.nick}" loading="lazy">` : MOON_AVATAR}</div>` +
      `<div class="m-info">` +
        `<div class="m-file mono">${p.file} · SELFHATE CLUB</div>` +
        `<h3 class="m-nick">${p.nick} <span class="role-tag mono" style="position:static">${p.roleTag}</span></h3>` +
        `<div class="m-name mono">${p.name}</div>` +
        `<div class="m-meta">` +
          `<span class="meta-item">${CAL_SVG}${p.age}</span>` +
          `<span class="meta-item">${PIN_SVG}${p.city}</span>` +
          `<span class="meta-item">${SWORD_SVG}${p.role}</span>` +
        `</div>` +
        `<div class="hero-chips">${chips}</div>` +
        `<blockquote class="pcard-quote">${QUOTE_SVG}<span>${p.quote}</span></blockquote>` +
        `<div class="m-actions">${tgBlock}</div>` +
      `</div>` +
    `</div>`;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  buzz(8);
}
function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
$$('[data-open-player]').forEach(b => b.addEventListener('click', () => openPlayer(b.dataset.openPlayer)));
$('#modalClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) closeModal(); });

/* ================= FORM ================= */
const form = $('#joinForm');
const fNick = $('#fNick'), fBirth = $('#fBirth'), fTg = $('#fTg'), fAbout = $('#fAbout');
const dropZone = $('#dropZone'), dzText = $('#dzText'), dropChips = $('#dropChips');
const submitBtn = $('#submitBtn');

// --- маски ---
fBirth.addEventListener('input', () => {
  let d = fBirth.value.replace(/\D/g, '').slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += '.' + d.slice(2, 4);
  if (d.length > 4) out += '.' + d.slice(4, 8);
  fBirth.value = out;
});
fTg.addEventListener('input', () => {
  let v = fTg.value.replace(/[^A-Za-z0-9_@]/g, '');
  if (v && !v.startsWith('@')) v = '@' + v;
  v = '@' + v.slice(1).replace(/@/g, '');
  fTg.value = v.slice(0, 32);
});

function markError(input, msg) {
  const field = input.closest('.field');
  field.classList.remove('error');
  void field.offsetWidth; // перезапуск shake-анимации
  field.classList.add('error');
  setTimeout(() => field.classList.remove('error'), 1600);
  return msg;
}
[fNick, fBirth, fTg, fAbout].forEach(i =>
  i.addEventListener('input', () => i.closest('.field').classList.remove('error')));

form.addEventListener('submit', e => {
  e.preventDefault();
  if (submitBtn.classList.contains('loading') || submitBtn.classList.contains('success')) return;

  const errors = [];
  if (fNick.value.trim().length < 3) errors.push(markError(fNick, 'Никнейм — минимум 3 символа'));
  if (!/^\d{2}\.\d{2}\.\d{4}$/.test(fBirth.value)) {
    errors.push(markError(fBirth, 'Дата рождения в формате ДД.ММ.ГГГГ'));
  } else {
    const [dd, mm, yyyy] = fBirth.value.split('.').map(Number);
    const dt = new Date(yyyy, mm - 1, dd);
    if (dt.getFullYear() !== yyyy || dt.getMonth() !== mm - 1 || dt.getDate() !== dd || yyyy < 1950 || yyyy > 2016)
      errors.push(markError(fBirth, 'Такой даты не существует'));
  }
  if (!/^@[A-Za-z0-9_]{4,31}$/.test(fTg.value)) errors.push(markError(fTg, 'Телеграм: @имя, латиницей'));
  const roleChip = dropZone.querySelector('.dchip.placed');
  if (!roleChip) errors.push(null);

  if (errors.length) {
    buzz([14, 60, 14]);
    toast('error', 'Заявка не отправлена',
      errors.find(Boolean) || 'Перетащи желаемую роль в слот', 4200);
    if (!roleChip) {
      dropZone.classList.add('over');
      setTimeout(() => dropZone.classList.remove('over'), 900);
    }
    return;
  }

  submitBtn.classList.add('loading');
  buzz(12);
  setTimeout(() => {
    submitBtn.classList.remove('loading');
    submitBtn.classList.add('success');
    buzz(20);
    toast('success', 'Заявка принята', `${fNick.value.trim()} · ${roleChip.dataset.role} — ждём в Discord`);
    setTimeout(() => {
      submitBtn.classList.remove('success');
      submitBtn.disabled = false;
      form.reset();
      returnChip(roleChip);
    }, 1700);
  }, 1400);
});

/* ================= DRAG & DROP РОЛЕЙ ================= */
let ghost = null;
document.addEventListener('dragover', e => {
  if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }
});
$$('.dchip').forEach(chip => {
  chip.addEventListener('dragstart', e => {
    if (chip.classList.contains('placed')) { e.preventDefault(); return; }
    e.dataTransfer.setData('text/plain', chip.dataset.role);
    e.dataTransfer.effectAllowed = 'copy';
    chip.classList.add('dragging');
    ghost = chip.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.style.left = '-999px'; ghost.style.top = '-999px';
    document.body.appendChild(ghost);
  });
  chip.addEventListener('dragend', () => {
    chip.classList.remove('dragging');
    if (ghost) { ghost.remove(); ghost = null; }
    dropZone.classList.remove('over');
  });
  // тач/клик фолбэк
  chip.addEventListener('click', () => {
    if (chip.classList.contains('placed')) returnChip(chip);
    else placeChip(chip);
  });
});
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  dropZone.classList.add('over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('over');
  const chip = $('.dchip.dragging');
  if (chip) placeChip(chip);
});
function placeChip(chip) {
  if (dropZone.querySelector('.dchip.placed')) return;
  dropZone.appendChild(chip);
  chip.classList.add('placed');
  chip.classList.remove('dragging');
  dropZone.classList.add('filled');
  dzText.textContent = 'РОЛЬ ВЫБРАНА — КЛИК, ЧТОБЫ СМЕНИТЬ';
  toast('info', 'Роль зафиксирована', chip.dataset.role + ' добавлена в заявку', 2600);
  buzz(10);
}
function returnChip(chip) {
  if (!chip) return;
  chip.classList.remove('placed');
  dropChips.appendChild(chip);
  dropZone.classList.remove('filled');
  dzText.textContent = 'ПЕРЕТАЩИ РОЛЬ СЮДА';
}

/* ================= ПАСХАЛКА: логотип ================= */
(function egg() {
  const logo = $('#eggLogo');
  if (!logo) return;
  let clicks = 0, timer = null;
  logo.addEventListener('click', e => {
    e.preventDefault();
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(() => clicks = 0, 1600);
    if (clicks >= 5) {
      clicks = 0;
      confetti(e.clientX, e.clientY);
      toast('success', 'Достижение открыто', '«Истинный selfhater» — боль принята', 4200);
      buzz([10, 40, 10]);
    }
  });
})();
function confetti(x, y) {
  const colors = ['#ff3348', '#e11d2e', '#ff8896', '#f1f1f3', '#6d0f1c'];
  for (let i = 0; i < 30; i++) {
    const s = document.createElement('i');
    s.style.cssText = `position:fixed;z-index:9700;left:${x}px;top:${y}px;width:${5 + Math.random() * 6}px;height:${3 + Math.random() * 5}px;background:${colors[i % colors.length]};border-radius:2px;pointer-events:none`;
    document.body.appendChild(s);
    const ang = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 150;
    s.animate([
      { transform: 'translate(0,0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist}px,${Math.sin(ang) * dist + 110}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }
    ], { duration: 950 + Math.random() * 550, easing: 'cubic-bezier(.16,1,.3,1)' })
      .onfinish = () => s.remove();
  }
}

})();
