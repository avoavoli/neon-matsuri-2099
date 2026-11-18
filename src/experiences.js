import { FORTUNES, STALLS, STAGE, WISH_SEEDS } from './data.js';

/* ============================================================
   DOM helpers
   ============================================================ */

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function h(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

let serialCounter = 0;
const nextSerial = () => {
  serialCounter = (serialCounter + 1) % 9999;
  return String(2099 + serialCounter).padStart(6, '0');
};

const PATCH_LIBRARY = [
  { glyph: '鯉', label: 'KOI', color: '#63f7ff', glow: 'rgba(99,247,255,.55)' },
  { glyph: '桜', label: 'SAKURA', color: '#ff7ac0', glow: 'rgba(255,122,192,.55)' },
  { glyph: '祭', label: 'MATSURI', color: '#ffb96e', glow: 'rgba(255,185,110,.55)' },
  { glyph: '雷', label: 'THUNDER', color: '#c7ff63', glow: 'rgba(199,255,99,.5)' },
  { glyph: '目', label: 'EYE', color: '#9a7bff', glow: 'rgba(154,123,255,.5)' },
  { glyph: '光', label: 'LIGHT', color: '#ffcf7a', glow: 'rgba(255,207,122,.55)' },
  { glyph: '猫', label: 'CAT', color: '#ff5a5f', glow: 'rgba(255,90,95,.5)' },
  { glyph: '雨', label: 'RAIN', color: '#9de6ff', glow: 'rgba(157,230,255,.5)' },
];

const MODELS = {
  mira: { label: 'MIRA // 09', src: '/img/puffer-woman.webp', x: '50%', y: '22%' },
  kai: { label: 'KAI // 12', src: '/img/puffer-man.webp', x: '50%', y: '16%' },
};

const LEDS = ['#ff4fa3', '#63f7ff', '#c7ff63', '#ffcf7a', '#9a7bff', '#ff5a5f'];

const BROTHS = [
  { id: 'miso', label: 'BLACK MISO', color: '#3b2018', note: 'smoked, 27 years' },
  { id: 'tonkotsu', label: 'NEON TONKOTSU', color: '#d6a166', note: 'electric, milky' },
  { id: 'shio', label: 'YUZU SHIO', color: '#d8c67a', note: 'clear, bright' },
];
const NOODLES = [
  { id: 'thin', label: 'THIN STRAIGHT', width: 2.1 },
  { id: 'wavy', label: 'WAVY', width: 3.0 },
  { id: 'udon', label: 'THICK UDON', width: 4.4 },
];
const HEATS = [
  { id: 'mild', label: 'MILD / 00', color: '#c7ff63' },
  { id: 'warm', label: 'WARM / 03', color: '#ffb96e' },
  { id: 'melt', label: 'MELT / 09', color: '#ff2f92' },
];
const TOPPINGS = [
  { id: 'egg', label: 'AJITAMA EGG', color: '#ffcf7a' },
  { id: 'chashu', label: 'CHASHU', color: '#c47b55' },
  { id: 'naruto', label: 'NARUTOMAKI', color: '#ff9eb2' },
  { id: 'corn', label: 'CORN', color: '#ffd26e' },
  { id: 'greens', label: 'SCALLION', color: '#8ad07a' },
  { id: 'chili', label: 'CHILI THREAD', color: '#ff5a5f' },
];

const CHARM_GLYPHS = ['守', '鯉', '光', '祭', '雨'];
const CHARM_FABRICS = [
  { a: '#6d4bd8', b: '#251044', label: 'NEON VIOLET' },
  { a: '#b02345', b: '#3b0919', label: 'CRIMSON' },
  { a: '#147d8f', b: '#06232c', label: 'GHOST CYAN' },
  { a: '#b98b3e', b: '#3b2510', label: 'OLD GOLD' },
  { a: '#2a2a35', b: '#0b0b12', label: 'MIDNIGHT' },
];
const CHARM_INTENTS = ['PROTECT', 'RETURN', 'LUCK', 'COURAGE', 'FOCUS'];

const koiSvg = () => `
  <svg viewBox="0 0 420 320" role="img" aria-label="A golden koi drawn in light">
    <defs>
      <linearGradient id="koiGold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff3c9"/>
        <stop offset=".42" stop-color="#ffcf7a"/>
        <stop offset=".8" stop-color="#ff7a3d"/>
        <stop offset="1" stop-color="#ff2f92"/>
      </linearGradient>
      <linearGradient id="koiFin" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe8b0" stop-opacity=".8"/>
        <stop offset="1" stop-color="#ff2f92" stop-opacity=".08"/>
      </linearGradient>
    </defs>
    <path d="M64 165 C102 110 184 86 266 112 C320 130 354 158 348 181 C341 208 280 220 218 209 C158 199 104 188 64 165Z" fill="url(#koiGold)"/>
    <path d="M66 165 C40 151 21 158 10 178 C36 177 48 185 58 194 C52 168 53 162 66 165Z" fill="url(#koiFin)"/>
    <path d="M64 165 C36 160 20 147 14 129 C39 137 54 147 68 154Z" fill="url(#koiFin)"/>
    <path d="M262 111 C297 82 340 79 381 91 C351 106 332 128 320 141 C302 128 282 118 262 111Z" fill="url(#koiFin)"/>
    <path d="M257 206 C292 226 329 245 373 249 C338 261 300 255 273 239 C269 227 263 216 257 206Z" fill="url(#koiFin)"/>
    <path d="M172 109 C180 84 196 67 209 57 C208 82 214 100 226 115 C207 120 188 116 172 109Z" fill="url(#koiFin)"/>
    <path d="M166 198 C170 219 162 239 148 254 C160 232 153 216 145 205 C152 202 159 200 166 198Z" fill="url(#koiFin)"/>
    <g fill="none" stroke="#8f2f18" stroke-opacity=".35" stroke-width="2">
      <path d="M116 141 C126 129 144 124 156 132"/>
      <path d="M142 127 C153 115 172 112 185 120"/>
      <path d="M170 119 C184 108 204 107 216 116"/>
      <path d="M199 116 C214 108 232 111 241 121"/>
      <path d="M226 123 C240 117 257 121 264 132"/>
      <path d="M123 174 C139 167 155 171 164 181"/>
      <path d="M151 185 C167 178 185 183 193 193"/>
      <path d="M182 194 C199 189 217 194 225 202"/>
    </g>
    <circle cx="317" cy="156" r="7" fill="#1a0812"/>
    <circle cx="319" cy="153" r="2.2" fill="#fff3c9"/>
    <path d="M300 177 C312 182 327 182 338 175" stroke="#8f2f18" stroke-opacity=".45" stroke-width="2" fill="none"/>
  </svg>`;

/* ============================================================
   shared completion UI
   ============================================================ */

function finish(activity, stall, message, payload, ctx) {
  const result = ctx.complete(stall.id, payload);
  const box = activity.querySelector('.xp-complete');
  if (box) {
    box.innerHTML = `
      <div class="xp-stamp">${stall.glyph}</div>
      <div>
        <strong>STAMP ${String(result.count).padStart(2, '0')} / 07 RECORDED</strong>
        <p>${esc(message)}</p>
      </div>`;
    box.classList.add('is-visible');
  }
  const modal = activity.closest('.stall-modal');
  const foot = modal?.querySelector('.stamp-state');
  if (foot) {
    foot.classList.add('is-stamped');
    foot.innerHTML = `<span class="stamp-state-ring">${stall.glyph}</span><span>STAMP RECORDED / 記録済</span>`;
  }
  return result;
}

function completionBlock() {
  return `<div class="xp-complete" role="status"></div>`;
}

function stampFoot(stall, ctx) {
  const stamped = ctx.hasStamp(stall.id);
  return `
    <div class="stamp-state ${stamped ? 'is-stamped' : ''}">
      <span class="stamp-state-ring">${stall.glyph}</span>
      <span>${stamped ? 'STAMP RECORDED / 記録済' : 'NO STAMP YET / 未記録'}</span>
    </div>
    <span class="modal-hint">ESC TO CLOSE</span>`;
}

/* ============================================================
   stall shell
   ============================================================ */

export function renderStallModal(stall, ctx) {
  const index = STALLS.findIndex((s) => s.id === stall.id);
  const stamped = ctx.hasStamp(stall.id);
  const modal = h(`
    <article class="stall-modal" role="dialog" aria-modal="true" aria-labelledby="stall-title-${stall.id}" style="--accent:${stall.accent}; --seal-color:${stall.color}">
      <button class="modal-close" type="button" aria-label="Close stall" data-close>
        <svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>
      </button>
      <figure class="stall-visual" style="--accent:${stall.accent}">
        <img src="${stall.image}" alt="${esc(stall.name)} stall photography" />
        <div class="visual-top">
          <span><i class="live-dot"></i>STALL ${stall.no} / 08 — OPEN</span>
          <span>35.6938°N</span>
        </div>
        <div class="visual-vertical">${esc(stall.jp)}</div>
        <figcaption class="visual-caption">
          <span class="visual-kicker">${esc(stall.tagline)}</span>
          <blockquote>${esc(stall.quote)}</blockquote>
          <div class="visual-meta">${stall.meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
        </figcaption>
      </figure>
      <div class="stall-body">
        <header class="stall-head">
          <span class="stall-number">${stall.no}</span>
          <div class="stall-title-wrap">
            <div class="stall-kicker">SECTOR 09 / ${String(index + 1).padStart(2, '0')} OF 07</div>
            <h2 class="stall-title" id="stall-title-${stall.id}">${esc(stall.name)}</h2>
            <span class="stall-jp">${esc(stall.jp)}</span>
          </div>
        </header>
        <p class="stall-tagline">${esc(stall.tagline)}</p>
        <p class="stall-description">${esc(stall.description)}</p>
        <div class="stall-chips">${stall.meta.map((m) => `<span>${esc(m)}</span>`).join('')}</div>
        <div class="stall-task">
          <span class="stall-task-glyph">${stall.glyph}</span>
          <div>
            <strong>YOUR TASK AT THIS STALL</strong>
            <p>${esc(stall.prompt)}</p>
          </div>
        </div>
        <section class="experience" style="--accent:${stall.accent}">
          <div class="experience-head">
            <h3>INTERACTIVE / 体験</h3>
            <span>STALL ${stall.no} — ${esc(stall.short)}</span>
          </div>
          <div id="activity-${stall.id}"></div>
        </section>
        <footer class="stall-foot">${stampFoot(stall, ctx)}</footer>
      </div>
    </article>
  `);

  const activityHost = modal.querySelector(`#activity-${stall.id}`);
  let destroy = null;

  switch (stall.id) {
    case 'ramen': {
      const built = buildRamen(stall, ctx);
      activityHost.appendChild(built.el);
      destroy = built.destroy;
      break;
    }
    case 'puffer': {
      const built = buildPuffer(stall, ctx);
      activityHost.appendChild(built.el);
      destroy = built.destroy;
      break;
    }
    case 'lanterns': {
      const built = buildLanterns(stall, ctx);
      activityHost.appendChild(built.el);
      destroy = built.destroy;
      break;
    }
    case 'takoyaki': {
      const built = buildTakoyaki(stall, ctx);
      activityHost.appendChild(built.el);
      destroy = built.destroy;
      break;
    }
    case 'goldfish': {
      const built = buildGoldfish(stall, ctx);
      activityHost.appendChild(built.el);
      destroy = built.destroy;
      break;
    }
    case 'omikuji': {
      const built = buildOmikuji(stall, ctx);
      activityHost.appendChild(built.el);
      destroy = built.destroy;
      break;
    }
    case 'charm': {
      const built = buildCharm(stall, ctx);
      activityHost.appendChild(built.el);
      destroy = built.destroy;
      break;
    }
    default:
      activityHost.innerHTML = '<p class="xp-note">This stall is still waking up.</p>';
  }

  return { el: modal, destroy, stamped };
}

/* ============================================================
   ramen
   ============================================================ */

function ramenBowl(sel) {
  const broth = BROTHS.find((b) => b.id === sel.broth) || BROTHS[1];
  const noodle = NOODLES.find((n) => n.id === sel.noodle) || NOODLES[1];
  const heat = HEATS.find((x) => x.id === sel.heat) || HEATS[0];
  const chosen = new Set(sel.toppings);
  const toppingMarkup = {
    egg: `
      <g transform="translate(204 84)">
        <ellipse rx="26" ry="17" fill="#f5ead5"/>
        <ellipse rx="13" ry="9" fill="#ffb43e"/>
        <ellipse rx="5" ry="3.4" fill="#ffd97a"/>
      </g>`,
    chashu: `
      <g transform="translate(95 87) rotate(-8)">
        <ellipse rx="30" ry="16" fill="#9c4f32"/>
        <ellipse rx="24" ry="12" fill="#c17a55"/>
        <path d="M-18 -4 C-6 -13 12 -11 19 -2" stroke="#f0b48c" stroke-opacity=".6" stroke-width="2" fill="none"/>
      </g>`,
    naruto: `
      <g transform="translate(151 78)">
        <circle r="15" fill="#f5eee2"/>
        <path d="M-7 0 C-7 -7 2 -9 6 -3 C10 4 4 9 -2 6" stroke="#ff7a9c" stroke-width="3" fill="none"/>
      </g>`,
    corn: `
      <g fill="#ffd45e">
        <circle cx="122" cy="105" r="3.4"/><circle cx="131" cy="101" r="3.1"/><circle cx="139" cy="107" r="3.4"/>
        <circle cx="130" cy="113" r="3.1"/><circle cx="141" cy="116" r="2.8"/><circle cx="118" cy="114" r="2.8"/>
      </g>`,
    greens: `
      <g fill="#8ad07a">
        <circle cx="174" cy="110" r="4.5"/><circle cx="186" cy="107" r="3.8"/><circle cx="190" cy="118" r="4.2"/>
        <circle cx="166" cy="118" r="3.3"/><circle cx="178" cy="122" r="3.8"/><circle cx="201" cy="111" r="3.1"/>
      </g>`,
    chili: `
      <g stroke="#ff5a5f" stroke-width="3" stroke-linecap="round">
        <path d="M86 112 C98 119 112 117 124 110"/>
        <path d="M92 103 C101 108 112 106 120 102"/>
      </g>`,
  };
  return `
    <svg class="ramen-svg" viewBox="0 0 300 250" role="img" aria-label="Your ramen bowl">
      <defs>
        <radialGradient id="brothGlow" cx="50%" cy="40%" r="65%">
          <stop offset="0" stop-color="${broth.color}"/>
          <stop offset=".72" stop-color="${broth.color}"/>
          <stop offset="1" stop-color="#1a0c0c"/>
        </radialGradient>
        <linearGradient id="bowlBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2c1a22"/>
          <stop offset=".35" stop-color="#140b13"/>
          <stop offset="1" stop-color="#07040a"/>
        </linearGradient>
        <clipPath id="brothClip">
          <ellipse cx="150" cy="98" rx="108" ry="30"/>
        </clipPath>
      </defs>
      <ellipse cx="150" cy="99" rx="122" ry="38" fill="#1c101a" stroke="#4b3547" stroke-width="1.5"/>
      <ellipse cx="150" cy="96" rx="110" ry="31" fill="url(#brothGlow)"/>
      <g clip-path="url(#brothClip)">
        <g fill="none" stroke="#ecd28f" stroke-opacity=".7" stroke-width="${noodle.width}" stroke-linecap="round">
          <path d="M58 88 C90 76 116 100 148 88 C180 77 208 99 242 87"/>
          <path d="M54 99 C88 88 112 111 146 100 C181 88 210 111 246 99"/>
          <path d="M62 110 C92 100 118 121 151 110 C185 99 216 120 240 110"/>
        </g>
        ${[...chosen].map((id) => toppingMarkup[id] || '').join('')}
        <ellipse cx="150" cy="98" rx="108" ry="30" fill="none" stroke="${heat.color}" stroke-opacity=".22" stroke-width="2"/>
      </g>
      <path d="M28 99 C42 174 92 225 150 232 C208 225 258 174 272 99 C236 122 64 122 28 99Z" fill="url(#bowlBody)" stroke="#3a2a37" stroke-width="1.5"/>
      <path d="M43 136 C78 154 222 154 257 136" fill="none" stroke="${heat.color}" stroke-opacity=".5" stroke-width="2"/>
      <path d="M60 168 C98 184 202 184 240 168" fill="none" stroke="#f5eee2" stroke-opacity=".09" stroke-width="1"/>
      <g transform="translate(196 42) rotate(16)">
        <rect x="0" y="0" width="4" height="150" rx="2" fill="#8d5e3d"/>
        <rect x="18" y="0" width="4" height="150" rx="2" fill="#8d5e3d"/>
      </g>
      <text x="150" y="205" text-anchor="middle" font-family="Shippori Mincho, serif" font-size="17" fill="#f5eee2" fill-opacity=".36" letter-spacing="7">零時</text>
    </svg>`;
}

function buildRamen(stall, ctx) {
  const previous = ctx.state.stats.lastBowl;
  const el = h(`
    <div class="ramen-xp">
      <div class="ramen-display">
        <div class="ramen-steam"><span></span><span></span><span></span></div>
        <div class="ramen-bowl-slot"></div>
        <div class="ramen-ticket" aria-live="polite"></div>
      </div>
      <div class="ramen-controls">
        <div>
          <span class="xp-label">01 — BROTH / 出汁</span>
          <div class="option-group" data-group="broth">
            ${BROTHS.map((b) => `<button type="button" class="option-pill ${b.id === 'tonkotsu' ? 'is-selected' : ''}" data-value="${b.id}">${b.label}</button>`).join('')}
          </div>
        </div>
        <div>
          <span class="xp-label">02 — NOODLE / 麺</span>
          <div class="option-group" data-group="noodle">
            ${NOODLES.map((n) => `<button type="button" class="option-pill ${n.id === 'wavy' ? 'is-selected' : ''}" data-value="${n.id}">${n.label}</button>`).join('')}
          </div>
        </div>
        <div>
          <span class="xp-label">03 — HEAT / 辛さ</span>
          <div class="option-group" data-group="heat">
            ${HEATS.map((x) => `<button type="button" class="option-pill ${x.id === 'mild' ? 'is-selected' : ''}" data-value="${x.id}" style="--accent:${x.color}">${x.label}</button>`).join('')}
          </div>
        </div>
        <div>
          <span class="xp-label">04 — PICK THREE TOPPINGS / 具材</span>
          <div class="option-group" data-group="toppings">
            ${TOPPINGS.map((t) => `<button type="button" class="option-pill topping-pill" data-value="${t.id}" aria-pressed="false"><i class="topping-dot" style="--topping-color:${t.color}"></i>${t.label}</button>`).join('')}
          </div>
        </div>
        <div class="xp-row" style="justify-content:space-between">
          <span class="xp-note" data-count>0 / 3 toppings</span>
          <button type="button" class="xp-btn is-primary" data-serve disabled>Serve the bowl</button>
        </div>
        ${completionBlock()}
      </div>
    </div>
  `);

  const selection = {
    broth: 'tonkotsu',
    noodle: 'wavy',
    heat: 'mild',
    toppings: previous?.toppings?.slice(0, 3) || [],
  };
  const bowlSlot = el.querySelector('.ramen-bowl-slot');
  const ticket = el.querySelector('.ramen-ticket');
  const count = el.querySelector('[data-count]');
  const serve = el.querySelector('[data-serve]');
  const completeBox = el.querySelector('.xp-complete');

  const render = () => {
    bowlSlot.innerHTML = ramenBowl(selection);
    const b = BROTHS.find((x) => x.id === selection.broth);
    const n = NOODLES.find((x) => x.id === selection.noodle);
    const hot = HEATS.find((x) => x.id === selection.heat);
    count.textContent = `${selection.toppings.length} / 3 toppings`;
    serve.disabled = selection.toppings.length !== 3;
    ticket.innerHTML = `BOWL <b>NO. ${String(ctx.state.stats.bowls + 1).padStart(3, '0')}</b> · ${b.label} · ${n.label} · ${hot.label}<br />SECTOR 09 / SERVED AFTER MIDNIGHT`;
  };

  el.querySelectorAll('[data-group]').forEach((group) => {
    const key = group.dataset.group;
    group.querySelectorAll('.option-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        ctx.audio.click();
        if (key === 'toppings') {
          const id = btn.dataset.value;
          if (selection.toppings.includes(id)) {
            selection.toppings = selection.toppings.filter((x) => x !== id);
            btn.classList.remove('is-selected');
            btn.setAttribute('aria-pressed', 'false');
          } else if (selection.toppings.length < 3) {
            selection.toppings.push(id);
            btn.classList.add('is-selected');
            btn.setAttribute('aria-pressed', 'true');
          } else {
            ctx.toast('THE COOK SAYS: THREE TOPPINGS. THE BOWL IS A SMALL COUNTRY.');
            ctx.audio.error();
            return;
          }
        } else {
          selection[key] = btn.dataset.value;
          group.querySelectorAll('.option-pill').forEach((b) => b.classList.toggle('is-selected', b === btn));
        }
        render();
      });
    });
  });

  if (previous?.toppings) {
    el.querySelectorAll('[data-group="toppings"] .option-pill').forEach((b) => {
      if (selection.toppings.includes(b.dataset.value)) {
        b.classList.add('is-selected');
        b.setAttribute('aria-pressed', 'true');
      }
    });
  }

  serve.addEventListener('click', () => {
    if (selection.toppings.length !== 3) return;
    const b = BROTHS.find((x) => x.id === selection.broth);
    const n = NOODLES.find((x) => x.id === selection.noodle);
    const hot = HEATS.find((x) => x.id === selection.heat);
    const code = `M-${String(Math.floor(Math.random() * 900) + 100)}`;
    const bowlName = `THE ${hot.label.split(' / ')[0]} ${b.label.replace('NEON ', '')} NO. ${code}`;
    ctx.audio.success();
    ticket.innerHTML = `<b>${esc(bowlName)}</b><br />SERVED BY THE FOUR-HANDED COOK · ${esc(n.label)} · ${esc(hot.label)}`;
    finish(el, stall, `Your bowl is on the counter. The steam spells a name you almost recognise. Bowl no. ${code}.`, {
      bowls: (ctx.state.stats.bowls || 0) + 1,
      lastBowl: { broth: selection.broth, noodle: selection.noodle, heat: selection.heat, toppings: [...selection.toppings], name: bowlName },
    }, ctx);
    serve.disabled = true;
    serve.textContent = 'BOWL SERVED ✓';
    el.querySelector('.ramen-display').classList.add('is-served');
  });

  render();
  if (completeBox && ctx.hasStamp(stall.id)) {
    completeBox.innerHTML = `
      <div class="xp-stamp">${stall.glyph}</div>
      <div><strong>STAMP ALREADY RECORDED</strong><p>You can still make a second bowl. The cook will pretend not to notice.</p></div>`;
    completeBox.classList.add('is-visible');
  }

  return { el, destroy: null };
}

/* ============================================================
   puffer atelier
   ============================================================ */

function buildPuffer(stall, ctx) {
  const savedLook = ctx.state.stats.lastLook;
  const el = h(`
    <div class="atelier-xp">
      <div>
        <div class="atelier-stage" aria-label="Drag patches onto the jacket photo">
          <img src="${MODELS.mira.src}" alt="Model wearing a black puffer jacket" />
          <div class="atelier-stage-grid"></div>
          <span class="atelier-tag">LIVE FIT / 24FPS</span>
          <div class="atelier-model" role="group" aria-label="Choose model">
            <button type="button" class="model-btn is-active" data-model="mira">MIRA</button>
            <button type="button" class="model-btn" data-model="kai">KAI</button>
          </div>
          <div class="patch-layer"></div>
          <div class="look-tag"><span>LOOK: <b data-look-name>${esc(savedLook?.name || 'UNTITLED')}</b></span><span>LED: <b data-led-label>${savedLook?.led || '#ff4fa3'}</b></span></div>
          <div class="atelier-hint">ADD A PATCH · DRAG TO PLACE · DOUBLE-CLICK TO REMOVE</div>
        </div>
        <div class="patch-tray" role="group" aria-label="Patch library">
          ${PATCH_LIBRARY.map((p) => `<button type="button" class="patch-btn" data-glyph="${p.glyph}" data-color="${p.color}" data-glow="${p.glow}" title="${p.label}" aria-label="Add ${p.label} patch" style="--patch-color:${p.color}">${p.glyph}</button>`).join('')}
        </div>
      </div>
      <div class="atelier-side">
        <div>
          <span class="xp-label">LOOK NAME / 名前</span>
          <input class="xp-input" data-look-input maxlength="18" value="${esc(savedLook?.name || 'MIDNIGHT MATSURI')}" placeholder="name this look" />
        </div>
        <div>
          <span class="xp-label">LED TRIM / 発光</span>
          <div class="swatch-row">
            ${LEDS.map((c, i) => `<button type="button" class="swatch ${(savedLook?.led || LEDS[0]) === c ? 'is-active' : ''}" style="--swatch:${c}" data-led="${c}" aria-label="LED color ${c}"></button>`).join('')}
          </div>
        </div>
        <div class="atelier-actions">
          <button type="button" class="xp-btn is-quiet" data-undo>Undo</button>
          <button type="button" class="xp-btn is-quiet" data-clear>Clear</button>
        </div>
        <div class="xp-row" style="justify-content:space-between">
          <span class="atelier-count" data-patch-count>0 / 7 patches</span>
          <button type="button" class="xp-btn is-primary" data-register disabled>Register look</button>
        </div>
        <p class="xp-note">Every patch is a rumour. Up to seven per jacket. The atelier keeps your look on file until the next rain.</p>
        ${completionBlock()}
      </div>
    </div>
  `);

  const stage = el.querySelector('.atelier-stage');
  const img = stage.querySelector('img');
  const layer = stage.querySelector('.patch-layer');
  const patchCount = el.querySelector('[data-patch-count]');
  const register = el.querySelector('[data-register]');
  const lookName = el.querySelector('[data-look-name]');
  const ledLabel = el.querySelector('[data-led-label]');
  const input = el.querySelector('[data-look-input]');
  const completeBox = el.querySelector('.xp-complete');
  const state = {
    model: savedLook?.model || 'mira',
    led: savedLook?.led || LEDS[0],
    patches: [],
    dragging: null,
  };
  const slots = [
    { x: 35, y: 55 },
    { x: 64, y: 51 },
    { x: 48, y: 68 },
    { x: 31, y: 39 },
    { x: 69, y: 68 },
    { x: 51, y: 44 },
    { x: 23, y: 71 },
  ];

  function applyLed() {
    stage.style.setProperty('--led', state.led);
    stage.style.boxShadow = `inset 0 0 0 1px ${state.led}55, inset 0 0 46px ${state.led}18`;
    ledLabel.textContent = state.led;
    el.querySelectorAll('[data-led]').forEach((b) => b.classList.toggle('is-active', b.dataset.led === state.led));
  }

  function updateCount() {
    patchCount.textContent = `${state.patches.length} / 7 patches`;
    register.disabled = state.patches.length < 3 || !input.value.trim();
    lookName.textContent = input.value.trim() || 'UNTITLED';
  }

  function addPatch(glyph, color, glow, pos = null) {
    if (state.patches.length >= 7) {
      ctx.toast('SEVEN PATCHES MAX. THE JACKET HAS BOUNDARIES.');
      ctx.audio.error();
      return;
    }
    const slot = pos || slots[state.patches.length % slots.length];
    const node = document.createElement('div');
    node.className = 'placed-patch';
    node.style.left = `${slot.x}%`;
    node.style.top = `${slot.y}%`;
    node.style.background = color;
    node.style.setProperty('--patch-glow', glow);
    node.style.setProperty('--rot', `${(Math.random() * 18 - 9).toFixed(1)}deg`);
    node.textContent = glyph;
    node.tabIndex = 0;
    node.setAttribute('role', 'button');
    node.setAttribute('aria-label', `${glyph} patch, drag to move, double-click to remove`);
    node.dataset.glyph = glyph;
    node.dataset.color = color;
    node.dataset.glow = glow;
    layer.appendChild(node);
    state.patches.push({ glyph, color, glow, x: slot.x, y: slot.y });
    ctx.audio.blip(880, 0.05, 0.02, 'triangle');
    updateCount();
  }

  el.querySelectorAll('.patch-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      addPatch(btn.dataset.glyph, btn.dataset.color, btn.dataset.glow);
    });
  });

  // drag + remove placed patches
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragNode = null;

  layer.addEventListener('pointerdown', (e) => {
    const node = e.target.closest('.placed-patch');
    if (!node) return;
    dragNode = node;
    node.setPointerCapture(e.pointerId);
    const rect = node.getBoundingClientRect();
    dragOffsetX = e.clientX - (rect.left + rect.width / 2);
    dragOffsetY = e.clientY - (rect.top + rect.height / 2);
    node.style.zIndex = 10;
    e.preventDefault();
  });

  layer.addEventListener('pointermove', (e) => {
    if (!dragNode) return;
    const rect = stage.getBoundingClientRect();
    const cx = e.clientX - dragOffsetX;
    const cy = e.clientY - dragOffsetY;
    const x = clamp(((cx - rect.left) / rect.width) * 100, 6, 94);
    const y = clamp(((cy - rect.top) / rect.height) * 100, 5, 95);
    dragNode.style.left = `${x}%`;
    dragNode.style.top = `${y}%`;
    const item = state.patches.find((p) => p.glyph === dragNode.dataset.glyph && p.x === undefined);
    // simply sync all by index in DOM order
    const idx = [...layer.children].indexOf(dragNode);
    if (state.patches[idx]) {
      state.patches[idx].x = x;
      state.patches[idx].y = y;
    }
  });

  const endDrag = () => {
    if (dragNode) {
      dragNode.style.zIndex = '';
      dragNode = null;
    }
  };
  layer.addEventListener('pointerup', endDrag);
  layer.addEventListener('pointercancel', endDrag);

  layer.addEventListener('dblclick', (e) => {
    const node = e.target.closest('.placed-patch');
    if (!node) return;
    const idx = [...layer.children].indexOf(node);
    node.remove();
    state.patches.splice(idx, 1);
    ctx.audio.click();
    updateCount();
  });

  layer.addEventListener('keydown', (e) => {
    const node = e.target.closest('.placed-patch');
    if (!node) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const idx = [...layer.children].indexOf(node);
      node.remove();
      state.patches.splice(idx, 1);
      updateCount();
      e.preventDefault();
    }
  });

  el.querySelector('[data-undo]').addEventListener('click', () => {
    const node = layer.lastElementChild;
    if (!node) return;
    node.remove();
    state.patches.pop();
    updateCount();
    ctx.audio.click();
  });

  el.querySelector('[data-clear]').addEventListener('click', () => {
    layer.innerHTML = '';
    state.patches = [];
    updateCount();
    ctx.audio.click();
  });

  el.querySelectorAll('[data-model]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const model = MODELS[btn.dataset.model];
      state.model = btn.dataset.model;
      img.src = model.src;
      img.style.objectPosition = `${model.x} ${model.y}`;
      el.querySelectorAll('[data-model]').forEach((b) => b.classList.toggle('is-active', b === btn));
      ctx.audio.click();
    });
  });

  el.querySelectorAll('[data-led]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.led = btn.dataset.led;
      applyLed();
      ctx.audio.click();
    });
  });

  input.addEventListener('input', updateCount);

  register.addEventListener('click', () => {
    if (state.patches.length < 3 || !input.value.trim()) return;
    const name = input.value.trim().slice(0, 18) || 'MIDNIGHT MATSURI';
    ctx.audio.success();
    const message = `Look “${name}” is on file — ${state.patches.length} patches, ${state.led} LED trim. The tailor nods once. That is enough.`;
    finish(el, stall, message, {
      looks: (ctx.state.stats.looks || 0) + 1,
      lastLook: {
        name,
        model: state.model,
        led: state.led,
        patches: state.patches.map((p) => ({ glyph: p.glyph, color: p.color, x: p.x, y: p.y })),
      },
    }, ctx);
    register.disabled = true;
    register.textContent = 'LOOK ON FILE ✓';
  });

  // restore saved look
  if (savedLook?.patches?.length) {
    savedLook.patches.forEach((p, i) => {
      const color = p.color || PATCH_LIBRARY[i % PATCH_LIBRARY.length].color;
      const glow = PATCH_LIBRARY.find((x) => x.color === color)?.glow || 'rgba(255,255,255,.3)';
      addPatch(p.glyph, color, glow, { x: p.x ?? slots[i % slots.length].x, y: p.y ?? slots[i % slots.length].y });
    });
    const model = MODELS[savedLook.model] || MODELS.mira;
    img.src = model.src;
    img.style.objectPosition = `${model.x} ${model.y}`;
    el.querySelectorAll('[data-model]').forEach((b) => b.classList.toggle('is-active', b.dataset.model === (savedLook.model || 'mira')));
  }
  applyLed();
  updateCount();
  if (completeBox && ctx.hasStamp(stall.id)) {
    completeBox.innerHTML = `
      <div class="xp-stamp">${stall.glyph}</div>
      <div><strong>STAMP ALREADY RECORDED</strong><p>Your look is already in the atelier archive. Remix it if you like.</p></div>`;
    completeBox.classList.add('is-visible');
    register.textContent = 'LOOK ON FILE ✓';
  }

  return { el, destroy: null };
}

/* ============================================================
   wish lanterns
   ============================================================ */

function buildLanterns(stall, ctx) {
  const savedWish = ctx.state.stats.wishes?.[0]?.text || '';
  const el = h(`
    <div class="lantern-xp">
      <div class="lantern-sky">
        <div class="lantern-horizon"></div>
        <div class="wish-lantern" data-preview style="--lantern-color:#ffb15e;--lantern-light:#ffe6b0;--lantern-dark:#a83f2d">
          <span data-preview-text>${esc(savedWish || 'a wish for the rain')}</span>
        </div>
      </div>
      <div class="lantern-form">
        <div>
          <span class="xp-label">YOUR WISH / 願い</span>
          <textarea class="xp-input" data-wish maxlength="64" rows="3" placeholder="write it down. the paper remembers.">${esc(savedWish)}</textarea>
          <div class="xp-row" style="justify-content:space-between;margin-top:6px">
            <span class="xp-note">64 characters. no signal. no judgement.</span>
            <span class="xp-note" data-charcount>0 / 64</span>
          </div>
        </div>
        <div>
          <span class="xp-label">LANTERN COLOUR / 色</span>
          <div class="lantern-colors">
            ${[
              ['#ffb15e', '#ffe6b0', '#a83f2d'],
              ['#ff7ac0', '#ffe0ef', '#9b2b58'],
              ['#63f7ff', '#ddfdff', '#1c7d8d'],
              ['#c7ff63', '#f0ffd0', '#5f8f1f'],
              ['#9a7bff', '#ebe1ff', '#4d368f'],
              ['#ffcf7a', '#fff4d6', '#b0792b'],
            ].map(([c, l, d], i) => `<button type="button" class="lantern-swatch ${i === 0 ? 'is-active' : ''}" style="--swatch:${c}" data-color="${c}" data-light="${l}" data-dark="${d}" aria-label="Lantern color ${c}"></button>`).join('')}
          </div>
        </div>
        <button type="button" class="xp-btn is-primary" data-release>Release the lantern ↑</button>
        <div class="lantern-wishes" aria-label="Recent wishes">
          ${(ctx.state.stats.wishes || []).slice(0, 2).map((w) => `<p>${esc(w.text)}</p>`).join('')}
          ${WISH_SEEDS.slice(0, 3).map((w) => `<p>${esc(w)}</p>`).join('')}
        </div>
        ${completionBlock()}
      </div>
    </div>
  `);

  const preview = el.querySelector('[data-preview]');
  const previewText = el.querySelector('[data-preview-text]');
  const textarea = el.querySelector('[data-wish]');
  const charCount = el.querySelector('[data-charcount]');
  const release = el.querySelector('[data-release]');
  const completeBox = el.querySelector('.xp-complete');
  const state = { color: '#ffb15e', light: '#ffe6b0', dark: '#a83f2d' };

  const sync = () => {
    const value = textarea.value.trim();
    previewText.textContent = value || 'a wish for the rain';
    charCount.textContent = `${textarea.value.length} / 64`;
    release.disabled = !value;
  };

  textarea.addEventListener('input', sync);

  el.querySelectorAll('.lantern-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.color = btn.dataset.color;
      state.light = btn.dataset.light;
      state.dark = btn.dataset.dark;
      preview.style.setProperty('--lantern-color', state.color);
      preview.style.setProperty('--lantern-light', state.light);
      preview.style.setProperty('--lantern-dark', state.dark);
      el.querySelectorAll('.lantern-swatch').forEach((b) => b.classList.toggle('is-active', b === btn));
      ctx.audio.click();
    });
  });

  release.addEventListener('click', () => {
    const wish = textarea.value.trim().slice(0, 64);
    if (!wish) return;
    ctx.audio.paper();
    previewText.textContent = wish;
    preview.classList.add('is-floating');
    release.disabled = true;
    ctx.world.releaseLantern(wish, state.color);
    ctx.toast('THE SKY ACCEPTS YOUR MESSAGE.');
    const wishes = [{ text: wish, color: state.color, at: Date.now() }, ...(ctx.state.stats.wishes || [])].slice(0, 12);
    finish(el, stall, `“${wish}” is climbing past the billboards. Somewhere, a window opens.`, {
      wishes,
    }, ctx);
    window.setTimeout(() => {
      preview.classList.remove('is-floating');
      if (!ctx.hasStamp(stall.id) || true) {
        textarea.value = '';
        sync();
      }
    }, 3000);
  });

  sync();
  if (completeBox && ctx.hasStamp(stall.id)) {
    completeBox.innerHTML = `
      <div class="xp-stamp">${stall.glyph}</div>
      <div><strong>STAMP ALREADY RECORDED</strong><p>The sky still has room. Send another wish if you need to.</p></div>`;
    completeBox.classList.add('is-visible');
  }

  return { el, destroy: null };
}

/* ============================================================
   takoyaki timing
   ============================================================ */

function buildTakoyaki(stall, ctx) {
  const el = h(`
    <div class="tako-xp">
      <div class="tako-pan" aria-label="Takoyaki pan">
        ${Array.from({ length: 9 }).map(() => `<div class="tako-ball"></div>`).join('')}
      </div>
      <div class="tako-controls">
        <div class="tako-status">
          <strong>蛸</strong>
          <span data-round>ROUND 01 / 03</span>
        </div>
        <p class="xp-note">Wait for the needle to cross the golden band, then flip. Too early is raw. Too late is a rumour.</p>
        <div class="timing-wrap">
          <div class="timing-track">
            <div class="timing-zone" data-zone></div>
            <div class="timing-needle" data-needle></div>
          </div>
        </div>
        <div class="tako-result" data-result aria-live="polite">The grill is waiting. The octopus is patient.</div>
        <div class="xp-row">
          <button type="button" class="xp-btn is-primary" data-flip>Flip!</button>
          <button type="button" class="xp-btn is-quiet" data-reset hidden>Try again</button>
          <span class="xp-note">or press SPACE</span>
        </div>
        ${completionBlock()}
      </div>
    </div>
  `);

  const pan = el.querySelector('.tako-pan');
  const balls = [...pan.querySelectorAll('.tako-ball')];
  const needle = el.querySelector('[data-needle]');
  const zone = el.querySelector('[data-zone]');
  const roundLabel = el.querySelector('[data-round]');
  const result = el.querySelector('[data-result]');
  const flip = el.querySelector('[data-flip]');
  const reset = el.querySelector('[data-reset]');
  const completeBox = el.querySelector('.xp-complete');
  const game = { round: 1, hits: 0, active: true, zoneStart: 38, zoneWidth: 22, raf: 0, start: performance.now(), period: 1750, finished: false };

  function setZone() {
    game.zoneStart = 34 + Math.random() * 22;
    game.zoneWidth = 16 + Math.random() * 10;
    zone.style.setProperty('--zone-start', `${game.zoneStart}%`);
    zone.style.setProperty('--zone-width', `${game.zoneWidth}%`);
  }

  function animate(now) {
    if (!game.active) return;
    const p = ((now - game.start) / game.period) % 2;
    const x = (p <= 1 ? p : 2 - p) * 100;
    needle.style.left = `${x}%`;
    game.raf = requestAnimationFrame(animate);
  }

  function positionAt() {
    const p = ((performance.now() - game.start) / game.period) % 2;
    return (p <= 1 ? p : 2 - p) * 100;
  }

  function doFlip() {
    if (!game.active || game.finished) return;
    const x = positionAt();
    const inZone = x >= game.zoneStart && x <= game.zoneStart + game.zoneWidth;
    ctx.audio.sizzle();
    if (inZone) {
      game.hits++;
      const batch = balls.slice((game.round - 1) * 3, game.round * 3);
      batch.forEach((b) => b.classList.add('is-flipped'));
      result.innerHTML = `<b>PERFECT FLIP.</b> The octopus turns once and forgives you.`;
      ctx.audio.blip(920, 0.08, 0.03, 'sine');
    } else {
      result.innerHTML = `<span style="color:var(--red)">TOO ${x < game.zoneStart ? 'EARLY' : 'LATE'}.</span> A small burnt apology.`;
      result.classList.add('is-burnt');
      ctx.audio.error();
    }
    game.round++;
    if (game.round > 3) {
      endRound();
      return;
    }
    roundLabel.textContent = `ROUND 0${game.round} / 03`;
    setZone();
    game.start = performance.now();
    game.period = Math.max(1100, game.period - 190);
  }

  function endRound() {
    game.active = false;
    cancelAnimationFrame(game.raf);
    roundLabel.textContent = `SERVICE COMPLETE`;
    if (game.hits >= 2) {
      game.finished = true;
      flip.disabled = true;
      result.innerHTML = `<b>3-2-1 — SERVE.</b> ${game.hits} of 3 flips landed. The queue applauds without making a sound.`;
      finish(el, stall, `Takoyaki served: ${game.hits}/3 perfect flips. Battery-acid mayo applied. Bonito flakes still moving.`, {
        takoyaki: (ctx.state.stats.takoyaki || 0) + 1,
        bestFlips: Math.max(ctx.state.stats.bestFlips || 0, game.hits),
      }, ctx);
    } else {
      result.classList.add('is-burnt');
      result.innerHTML = `One clean flip. The cook sighs in a frequency only dogs hear. Try again?`;
      flip.hidden = true;
      reset.hidden = false;
      ctx.audio.error();
    }
  }

  function resetGame() {
    game.round = 1;
    game.hits = 0;
    game.active = true;
    game.finished = false;
    game.period = 1750;
    game.start = performance.now();
    balls.forEach((b) => b.classList.remove('is-flipped'));
    result.classList.remove('is-burnt');
    result.textContent = 'The grill is waiting. The octopus is patient.';
    roundLabel.textContent = 'ROUND 01 / 03';
    flip.hidden = false;
    flip.disabled = false;
    reset.hidden = true;
    setZone();
    game.raf = requestAnimationFrame(animate);
  }

  flip.addEventListener('click', doFlip);
  reset.addEventListener('click', resetGame);

  const onKey = (e) => {
    if (e.code === 'Space' && el.isConnected) {
      e.preventDefault();
      doFlip();
    }
  };
  document.addEventListener('keydown', onKey);

  setZone();
  game.start = performance.now();
  game.raf = requestAnimationFrame(animate);

  if (completeBox && ctx.hasStamp(stall.id)) {
    completeBox.innerHTML = `
      <div class="xp-stamp">${stall.glyph}</div>
      <div><strong>STAMP ALREADY RECORDED</strong><p>The grill remembers your hands. You may flip again.</p></div>`;
    completeBox.classList.add('is-visible');
  }

  return {
    el,
    destroy: () => {
      game.active = false;
      cancelAnimationFrame(game.raf);
      document.removeEventListener('keydown', onKey);
    },
  };
}

/* ============================================================
   goldfish
   ============================================================ */

function fishSVG(colorA, colorB) {
  return `
    <svg viewBox="0 0 60 44" aria-hidden="true">
      <defs>
        <linearGradient id="fishg-${colorA.replace('#', '')}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${colorA}"/>
          <stop offset="1" stop-color="${colorB}"/>
        </linearGradient>
      </defs>
      <path d="M50 22 C43 12 29 9 20 15 C15 18 13 23 18 28 C27 37 42 32 50 22Z" fill="url(#fishg-${colorA.replace('#', '')})"/>
      <path d="M19 22 C11 14 7 13 2 15 C8 20 9 23 2 29 C9 30 14 28 19 23Z" fill="${colorB}" fill-opacity=".8"/>
      <path d="M31 14 C28 7 22 5 18 6 C24 10 26 14 27 17Z" fill="${colorB}" fill-opacity=".7"/>
      <path d="M30 30 C27 37 22 39 18 38 C24 34 26 30 27 27Z" fill="${colorB}" fill-opacity=".55"/>
      <circle cx="42" cy="19" r="2.2" fill="#170a12"/>
      <circle cx="42.7" cy="18.4" r=".7" fill="#fff"/>
    </svg>`;
}

function buildGoldfish(stall, ctx) {
  const colors = [
    ['#ff9a4a', '#ff4f6d'],
    ['#ffd36e', '#ff8a3d'],
    ['#ff7ac0', '#ff2f92'],
    ['#9de6ff', '#63c8ff'],
    ['#ffb15e', '#ff5a5f'],
    ['#ffe1a1', '#ff9a4a'],
    ['#c7ff63', '#7cd77a'],
    ['#ff8fb1', '#ff4f8a'],
  ];
  const fishes = Array.from({ length: 8 }).map((_, i) => {
    const c = colors[i];
    return `<button type="button" class="fish" data-fish aria-label="Scoop a ghost koi" style="left:${12 + Math.random() * 72}%;top:${18 + Math.random() * 60}%;--dur:${5 + Math.random() * 4}s;--x1:${rand(-16, 16)}px;--y1:${rand(-14, 14)}px;--x2:${rand(-18, 18)}px;--y2:${rand(-12, 12)}px;--x3:${rand(-16, 16)}px;--y3:${rand(-13, 13)}px">${fishSVG(c[0], c[1])}</button>`;
  });

  const el = h(`
    <div class="kingyo-xp">
      <div class="kingyo-hud">
        <div class="kingyo-score">
          <span>SCOOPED</span>
          <div class="kingyo-pips">${Array.from({ length: 3 }).map(() => '<i class="kingyo-pip"></i>').join('')}</div>
          <span data-catches>0 / 3</span>
        </div>
        <div class="kingyo-bowl"><span data-bowl-label>EMPTY BOWL</span></div>
      </div>
      <div class="pond" data-pond>
        <div class="pond-glow"></div>
        ${fishes.join('')}
        <div class="poi" data-poi></div>
      </div>
      <div class="xp-row" style="justify-content:space-between">
        <span class="xp-note">TAP / CLICK A FISH. REAL PAPER, PROJECTION FISH.</span>
        <button type="button" class="xp-btn is-quiet" data-reset-fish>Refresh pond</button>
      </div>
      ${completionBlock()}
    </div>
  `);

  const pond = el.querySelector('[data-pond]');
  const poi = el.querySelector('[data-poi]');
  const catchesEl = el.querySelector('[data-catches]');
  const pips = [...el.querySelectorAll('.kingyo-pip')];
  const bowlLabel = el.querySelector('[data-bowl-label]');
  const reset = el.querySelector('[data-reset-fish]');
  const completeBox = el.querySelector('.xp-complete');
  let catches = 0;
  let complete = false;

  function sync() {
    catchesEl.textContent = `${catches} / 3`;
    pips.forEach((p, i) => p.classList.toggle('is-full', i < catches));
    bowlLabel.textContent = catches === 0 ? 'EMPTY BOWL' : `${catches} GHOST KOI`;
  }

  pond.addEventListener('pointermove', (e) => {
    const rect = pond.getBoundingClientRect();
    poi.style.setProperty('--px', `${e.clientX - rect.left}px`);
    poi.style.setProperty('--py', `${e.clientY - rect.top}px`);
  });

  pond.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.fish')) return;
    const rect = pond.getBoundingClientRect();
    const splash = document.createElement('span');
    splash.style.cssText = `position:absolute;left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;width:8px;height:8px;border:1px solid rgba(99,247,255,.7);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;animation:pondSplash .7s ease-out forwards`;
    pond.appendChild(splash);
    window.setTimeout(() => splash.remove(), 720);
  });

  pond.addEventListener('click', (e) => {
    const fish = e.target.closest('.fish');
    if (!fish || fish.classList.contains('is-caught') || complete) return;
    fish.classList.add('is-caught');
    catches += 1;
    ctx.audio.plop();
    sync();
    if (catches >= 3) {
      complete = true;
      window.setTimeout(() => {
        ctx.audio.success();
        bowlLabel.textContent = '3 GHOST KOI — UNTIL DAWN';
        finish(el, stall, 'Three ghost koi, one paper poi. They will follow you until sunrise, then become ordinary reflections again.', {
          fish: (ctx.state.stats.fish || 0) + 3,
        }, ctx);
      }, 250);
    } else {
      ctx.toast('ONE GHOST KOI. THE PAPER HOLDS.');
    }
  });

  reset.addEventListener('click', () => {
    catches = 0;
    complete = false;
    pond.querySelectorAll('.fish').forEach((f) => f.classList.remove('is-caught'));
    sync();
    ctx.audio.click();
  });

  if (completeBox && ctx.hasStamp(stall.id)) {
    completeBox.innerHTML = `
      <div class="xp-stamp">${stall.glyph}</div>
      <div><strong>STAMP ALREADY RECORDED</strong><p>The paper remembers your hand. The fish remember nothing.</p></div>`;
    completeBox.classList.add('is-visible');
  }

  const style = document.createElement('style');
  style.textContent = '@keyframes pondSplash{to{width:54px;height:54px;opacity:0}}';
  el.appendChild(style);
  sync();

  return { el, destroy: null };
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

/* ============================================================
   omikuji
   ============================================================ */

function buildOmikuji(stall, ctx) {
  const el = h(`
    <div class="omikuji-xp">
      <div class="fortune-stage">
        <div class="omikuji-box" data-box>
          <div class="omikuji-sticks" aria-hidden="true">
            ${Array.from({ length: 7 }).map((_, i) => `<i style="--h:${28 + ((i * 13) % 34)}px"></i>`).join('')}
          </div>
          <span>御籤</span>
        </div>
        <div class="fortune-card" data-card>
          <div class="fortune-grade" data-grade>大吉</div>
          <div class="fortune-grade-en" data-grade-en>GREAT BLESSING</div>
          <p class="fortune-line" data-line></p>
          <div class="fortune-luck" data-luck></div>
        </div>
      </div>
      <div class="fortune-actions">
        <p class="fortune-note">The shrine server has been running for nine hundred years. It has seen your browser history and chosen to be kind.</p>
        <button type="button" class="xp-btn is-primary" data-draw>Shake the box / 引く</button>
        <button type="button" class="xp-btn is-quiet" data-tie hidden>Tie it to the rail / 結ぶ</button>
        <span class="xp-note" data-fortune-serial>SERIAL — AWAITING DRAW</span>
        ${completionBlock()}
      </div>
    </div>
  `);

  const box = el.querySelector('[data-box]');
  const card = el.querySelector('[data-card]');
  const draw = el.querySelector('[data-draw]');
  const tie = el.querySelector('[data-tie]');
  const serial = el.querySelector('[data-fortune-serial]');
  const completeBox = el.querySelector('.xp-complete');
  const previous = ctx.state.stats.lastFortune;
  let current = null;
  let drawing = false;

  function reveal(fortune) {
    el.querySelector('[data-grade]').textContent = fortune.grade;
    el.querySelector('[data-grade-en]').textContent = fortune.gradeEn;
    el.querySelector('[data-line]').textContent = fortune.line;
    el.querySelector('[data-luck]').innerHTML = fortune.luck.map((l) => `LUCKY THING — ${esc(l)}`).join('<br />');
    el.querySelector('[data-grade]').style.color = fortune.color;
    card.style.borderColor = `${fortune.color}55`;
    card.classList.add('is-visible');
    serial.textContent = `SERIAL — 2099-${nextSerial()}-${fortune.gradeEn.split(' ')[0]}`;
    tie.hidden = false;
    draw.textContent = 'Draw again / もう一度';
  }

  draw.addEventListener('click', () => {
    if (drawing) return;
    drawing = true;
    card.classList.remove('is-visible');
    box.classList.add('is-shaking');
    ctx.audio.paper();
    window.setTimeout(() => {
      box.classList.remove('is-shaking');
      current = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
      reveal(current);
      ctx.audio.blip(520, 0.14, 0.03, 'sine');
      drawing = false;
    }, 620);
  });

  tie.addEventListener('click', () => {
    if (!current) return;
    const serialValue = `2099-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    ctx.audio.success();
    finish(el, stall, `Fortune “${current.grade} / ${current.gradeEn}” tied to the rail. The server logs your visit and closes one tab somewhere far away.`, {
      lastFortune: { ...current, serial: serialValue },
      fortunesDrawn: (ctx.state.stats.fortunesDrawn || 0) + 1,
    }, ctx);
    tie.hidden = true;
    card.classList.remove('is-visible');
    serial.textContent = `TIED — ${serialValue}`;
    draw.textContent = 'Ask again / もう一度';
  });

  if (previous?.grade) {
    serial.textContent = `LAST VISIT — ${previous.serial || previous.gradeEn}`;
    if (ctx.hasStamp(stall.id)) {
      completeBox.innerHTML = `
        <div class="xp-stamp">${stall.glyph}</div>
        <div><strong>STAMP ALREADY RECORDED</strong><p>Your last fortune was “${esc(previous.grade)}”. The box is allowed to change its mind.</p></div>`;
      completeBox.classList.add('is-visible');
    }
  } else if (ctx.hasStamp(stall.id)) {
    completeBox.innerHTML = `
      <div class="xp-stamp">${stall.glyph}</div>
      <div><strong>STAMP ALREADY RECORDED</strong><p>The shrine remembers you even when you do not.</p></div>`;
    completeBox.classList.add('is-visible');
  }

  return { el, destroy: null };
}

/* ============================================================
   omamori forge
   ============================================================ */

function drawCharmPreview(container, state) {
  container.style.setProperty('--charm-a', state.fabric.a);
  container.style.setProperty('--charm-b', state.fabric.b);
  container.querySelector('.omamori-glyph').textContent = state.glyph;
  const nameEl = container.querySelector('.omamori-name');
  nameEl.textContent = `${state.name || 'FOR YOU'} · ${state.intent}`;
}

function drawCharmSvg(state) {
  // canvas souvenir, not AI art
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 900, 1200);
  bg.addColorStop(0, '#0c0717');
  bg.addColorStop(1, '#05020b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 900, 1200);
  ctx.strokeStyle = 'rgba(245,238,226,.18)';
  ctx.lineWidth = 2;
  ctx.strokeRect(48, 48, 804, 1104);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(245,238,226,.6)';
  ctx.font = '22px "Space Grotesk", sans-serif';
  ctx.fillText('NEON MATSURI 2099 / OMAMORI FORGE', 450, 110);
  ctx.font = '16px "DotGothic16", monospace';
  ctx.fillStyle = 'rgba(147,134,159,.9)';
  ctx.fillText('ONE OF ONE — LIGHT PRINTED', 450, 145);

  const cx = 450;
  const cy = 390;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.03);
  const pouch = ctx.createLinearGradient(-190, -240, 190, 300);
  pouch.addColorStop(0, state.fabric.a);
  pouch.addColorStop(1, state.fabric.b);
  ctx.fillStyle = pouch;
  ctx.strokeStyle = 'rgba(245,238,226,.65)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-170, -190);
  ctx.quadraticCurveTo(-170, -255, -90, -255);
  ctx.lineTo(90, -255);
  ctx.quadraticCurveTo(170, -255, 170, -190);
  ctx.lineTo(170, 300);
  ctx.lineTo(-170, 300);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // weave
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#ffffff';
  for (let i = -300; i < 300; i += 17) {
    ctx.beginPath();
    ctx.moveTo(-180, i);
    ctx.lineTo(180, i + 170);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // cord
  ctx.strokeStyle = '#e5d2b1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -255);
  ctx.quadraticCurveTo(-34, -300, 0, -315);
  ctx.quadraticCurveTo(34, -300, 0, -255);
  ctx.stroke();
  ctx.fillStyle = '#f5e9d0';
  ctx.font = '600 150px "Shippori Mincho", serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.glyph, 0, 10);
  ctx.font = '26px "DotGothic16", monospace';
  ctx.fillStyle = 'rgba(245,238,226,.85)';
  ctx.fillText(state.name || 'FOR YOU', 0, 200);
  ctx.font = '18px "DotGothic16", monospace';
  ctx.fillStyle = 'rgba(245,238,226,.58)';
  ctx.fillText(`INTENT — ${state.intent}`, 0, 238);
  ctx.restore();

  ctx.fillStyle = 'rgba(245,238,226,.8)';
  ctx.font = '34px "Shippori Mincho", serif';
  ctx.fillText('御守', 450, 810);
  ctx.font = '22px "DotGothic16", monospace';
  ctx.fillStyle = 'rgba(245,238,226,.55)';
  ctx.fillText(`FORGED ${new Date().toISOString().slice(0, 10)} · SERIAL ${state.serial}`, 450, 860);
  ctx.fillStyle = 'rgba(255,207,122,.9)';
  ctx.font = '16px "DotGothic16", monospace';
  ctx.fillText('CARRY IT CLOSE. IT KNOWS THE WAY.', 450, 1060);
  return canvas;
}

function buildCharm(stall, ctx) {
  const previous = ctx.state.stats.lastCharm;
  const defaultName = '';
  const savedFabric = CHARM_FABRICS.find((f) => f.a === previous?.fabricA) || CHARM_FABRICS[0];
  const el = h(`
    <div class="charm-xp">
      <div class="charm-stage" data-stage>
        <div class="charm-beam" style="left:38%"></div>
        <div class="charm-beam" style="left:50%"></div>
        <div class="charm-beam" style="left:62%"></div>
        <div class="omamori" data-charm>
          <span class="omamori-knot"></span>
          <div class="omamori-glyph">守</div>
          <div class="omamori-name">FOR YOU · PROTECT</div>
        </div>
      </div>
      <div class="charm-controls">
        <div>
          <span class="xp-label">FABRIC / 織物</span>
          <div class="charm-swatches">
            ${CHARM_FABRICS.map((f) => `<button type="button" class="charm-swatch ${f === savedFabric ? 'is-active' : ''}" style="--c1:${f.a};--c2:${f.b}" data-fabric="${f.a}" data-b="${f.b}" aria-label="${f.label}"></button>`).join('')}
          </div>
        </div>
        <div>
          <span class="xp-label">GLYPH / 文字</span>
          <div class="glyph-row">
            ${CHARM_GLYPHS.map((g, i) => `<button type="button" class="glyph-btn ${(previous?.glyph || '守') === g ? 'is-active' : ''}" data-glyph="${g}">${g}</button>`).join('')}
          </div>
        </div>
        <div>
          <span class="xp-label">INTENT / 願い</span>
          <div class="option-group">
            ${CHARM_INTENTS.map((intent, i) => `<button type="button" class="option-pill ${(previous?.intent || 'PROTECT') === intent ? 'is-selected' : ''}" data-intent="${intent}">${intent}</button>`).join('')}
          </div>
        </div>
        <div>
          <span class="xp-label">NAME ON THE CHARM / 名前</span>
          <input class="xp-input" data-charm-name maxlength="20" placeholder="for you, or someone in the rain" value="${esc(previous?.name === 'FOR YOU' ? '' : previous?.name || '')}" />
        </div>
        <div class="xp-row" style="justify-content:space-between">
          <span class="charm-serial">SERIAL <b data-serial>AWAITING FORGE</b></span>
          <button type="button" class="xp-btn is-primary" data-forge>Forge charm</button>
        </div>
        <p class="xp-note">One per soul. Printed in light. Download it and the charm will exist on your device too.</p>
        ${completionBlock()}
      </div>
    </div>
  `);

  const stage = el.querySelector('[data-stage]');
  const charm = el.querySelector('[data-charm]');
  const input = el.querySelector('[data-charm-name]');
  const serialEl = el.querySelector('[data-serial]');
  const forge = el.querySelector('[data-forge]');
  const completeBox = el.querySelector('.xp-complete');
  const state = {
    fabric: savedFabric,
    glyph: previous?.glyph || '守',
    intent: previous?.intent || 'PROTECT',
    name: defaultName,
    serial: previous?.serial || null,
    forged: false,
  };

  const update = () => {
    state.name = input.value.trim().toUpperCase().slice(0, 20) || 'FOR YOU';
    drawCharmPreview(charm, state);
  };

  el.querySelectorAll('[data-fabric]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.fabric = { a: btn.dataset.fabric, b: btn.dataset.b };
      el.querySelectorAll('[data-fabric]').forEach((b) => b.classList.toggle('is-active', b === btn));
      update();
      ctx.audio.click();
    });
  });

  el.querySelectorAll('[data-glyph]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.glyph = btn.dataset.glyph;
      el.querySelectorAll('[data-glyph]').forEach((b) => b.classList.toggle('is-active', b === btn));
      update();
      ctx.audio.click();
    });
  });

  el.querySelectorAll('[data-intent]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.intent = btn.dataset.intent;
      el.querySelectorAll('[data-intent]').forEach((b) => b.classList.toggle('is-selected', b === btn));
      update();
      ctx.audio.click();
    });
  });

  input.addEventListener('input', update);

  function download() {
    const canvas = drawCharmSvg(state);
    const link = document.createElement('a');
    link.download = `neon-matsuri-omamori-${state.serial || 'one'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    ctx.toast('CHARM SAVED TO YOUR DEVICE. ');
    ctx.audio.click();
  }

  forge.addEventListener('click', () => {
    if (state.forged) return;
    state.forged = true;
    update();
    forge.disabled = true;
    stage.classList.add('is-forging');
    ctx.audio.sizzle();
    window.setTimeout(() => {
      state.serial = nextSerial();
      serialEl.textContent = state.serial;
      stage.classList.remove('is-forging');
      ctx.audio.success();
      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'xp-btn is-quiet';
      downloadBtn.textContent = 'Download charm ↓';
      downloadBtn.addEventListener('click', download);
      forge.replaceWith(downloadBtn);
      finish(el, stall, `Omamori “${state.glyph}” forged for ${state.name}. Intent: ${state.intent}. Serial ${state.serial}. Keep it close.`, {
        charms: (ctx.state.stats.charms || 0) + 1,
        lastCharm: { name: state.name, glyph: state.glyph, intent: state.intent, fabricA: state.fabric.a, serial: state.serial },
      }, ctx);
    }, 1150);
  });

  update();

  if (previous?.serial) {
    serialEl.textContent = previous.serial;
    forge.textContent = 'Forge another';
    state.forged = false;
    if (ctx.hasStamp(stall.id)) {
      completeBox.innerHTML = `
        <div class="xp-stamp">${stall.glyph}</div>
        <div><strong>STAMP ALREADY RECORDED</strong><p>The forge is still warm. You may make one more.</p></div>`;
      completeBox.classList.add('is-visible');
      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'xp-btn is-quiet';
      downloadBtn.textContent = 'Download last charm ↓';
      downloadBtn.addEventListener('click', () => {
        state.serial = previous.serial;
        download();
      });
      forge.parentElement.insertBefore(downloadBtn, forge.nextSibling);
    }
  } else if (ctx.hasStamp(stall.id)) {
    completeBox.innerHTML = `
      <div class="xp-stamp">${stall.glyph}</div>
      <div><strong>STAMP ALREADY RECORDED</strong><p>The forge keeps a record, even when you forget.</p></div>`;
    completeBox.classList.add('is-visible');
  }

  return { el, destroy: null };
}

/* ============================================================
   map
   ============================================================ */

export function renderMap(ctx) {
  const current = ctx.getCurrentId();
  const el = h(`
    <div class="panel-modal" role="dialog" aria-modal="true" aria-labelledby="map-title">
      <button class="modal-close" type="button" aria-label="Close map" data-close>
        <svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>
      </button>
      <header class="panel-head">
        <div>
          <div class="panel-kicker">NEO KABUKI-CHO / SECTOR 09</div>
          <h2 class="panel-title" id="map-title">THE STREET</h2>
          <p class="panel-sub">電光祭の地図 · one line, seven lights</p>
        </div>
      </header>
      <div class="panel-body">
        <div class="map-layout">
          <div class="map-list">
            ${STALLS.map((s) => {
              const visited = ctx.hasStamp(s.id);
              return `
                <button type="button" class="map-stop ${visited ? 'is-visited' : ''} ${current === s.id ? 'is-current' : ''}" data-go="${s.id}" style="--accent:${s.accent}">
                  <span class="map-node">${s.glyph}</span>
                  <span>
                    <span class="map-stop-name">${s.no} — ${esc(s.name)}</span>
                    <span class="map-stop-jp">${esc(s.jp)}</span>
                  </span>
                  <span class="map-stop-go">${visited ? 'VISITED' : 'TRAVEL ↗'}</span>
                </button>`;
            }).join('')}
            <button type="button" class="map-stop ${ctx.hasAllStamps() ? 'is-visited' : ''} ${current === 'stage' ? 'is-current' : ''}" data-go="stage" style="--accent:#ffcf7a">
              <span class="map-node">${STAGE.glyph}</span>
              <span>
                <span class="map-stop-name">${STAGE.no} — ${esc(STAGE.name)}</span>
                <span class="map-stop-jp">${esc(STAGE.jp)}</span>
              </span>
              <span class="map-stop-go">${ctx.hasAllStamps() ? 'AWAKE' : 'THE END'}</span>
            </button>
          </div>
          <aside class="map-aside">
            <div class="map-card">
              <div class="map-card-label">CURRENT POSITION</div>
              <h4>${current === 'stage' ? 'AFTERGLOW STAGE' : current === 'street' ? 'THE STREET' : esc(STALLS.find((s) => s.id === current)?.jp || '入口')}</h4>
              <p>EVERY STALL IS A SMALL WORLD. CLICK A LIGHT TO WALK THERE. THE STREET DOES NOT MIND BEING INTERRUPTED.</p>
            </div>
            <div class="map-card">
              <div class="map-card-label">TONIGHT'S ROUTE</div>
              <p>01 麺 → 02 織 → 03 灯 → 04 蛸 → 05 魚 → 06 籤 → 07 守 → 08 光</p>
              <div class="map-legend">
                <span><i class="legend-dot"></i>YOUR POSITION</span>
                <span><i class="legend-dot is-empty"></i>UNVISITED</span>
              </div>
            </div>
            <div class="map-card">
              <div class="map-card-label">STAMP RALLY / 御朱印</div>
              <p>Collect all seven stamps to wake the golden koi at the Afterglow Stage. The stage is listening.</p>
              <div class="passport-count" style="margin-top:10px"><b>${ctx.stampCount()}</b>/7 <span>STAMPS</span></div>
            </div>
          </aside>
        </div>
        <div class="panel-foot">
          <span class="panel-foot-note">TIP — SCROLL TO WALK. DRAG TO LOOK. CLICK THE FLOATING DIAMONDS OR PRESS E NEAR A STALL.</span>
          <button type="button" class="xp-btn is-quiet" data-close>Return to the street</button>
        </div>
      </div>
    </div>
  `);

  el.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      ctx.audio.click();
      ctx.travelTo(btn.dataset.go);
    });
  });
  return { el };
}

/* ============================================================
   passport
   ============================================================ */

export function renderPassport(ctx) {
  const count = ctx.stampCount();
  const el = h(`
    <div class="panel-modal" role="dialog" aria-modal="true" aria-labelledby="passport-title">
      <button class="modal-close" type="button" aria-label="Close passport" data-close>
        <svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>
      </button>
      <header class="panel-head">
        <div>
          <div class="panel-kicker">FESTIVAL PASSPORT / 御朱印帳</div>
          <h2 class="panel-title" id="passport-title">SEVEN STAMPS</h2>
          <p class="panel-sub">NO NAME REQUIRED · ONE NIGHT ONLY</p>
        </div>
      </header>
      <div class="panel-body">
        <div class="passport-grid">
          ${STALLS.map((s) => {
            const stamped = ctx.hasStamp(s.id);
            return `
              <div class="passport-stamp ${stamped ? 'is-stamped' : ''}" style="--accent:${s.accent}">
                <span class="ps-no">STALL ${s.no}</span>
                <span class="ps-status">${stamped ? 'RECORDED' : 'MISSING'}</span>
                <span class="ps-glyph">${s.glyph}</span>
                <span class="ps-name">${esc(s.name)}<br />${esc(s.jp)}</span>
              </div>`;
          }).join('')}
          <div class="passport-stamp ${ctx.hasAllStamps() ? 'is-stamped' : ''}" style="--accent:#ffcf7a">
            <span class="ps-no">STALL 08</span>
            <span class="ps-status">${ctx.hasAllStamps() ? 'AWAKE' : 'SEALED'}</span>
            <span class="ps-glyph">光</span>
            <span class="ps-name">AFTERGLOW STAGE<br />残光ステージ</span>
          </div>
        </div>
        <div class="passport-summary">
          <div class="passport-count"><b>${count}</b>/7 <span>STAMPS RECORDED</span></div>
          <p class="passport-note">${count === 7 ? 'All seven lights are lit. The golden koi is waiting at the end of the street.' : 'The street remembers everyone who walks it. It is still waiting to remember you.'}</p>
        </div>
        <div class="panel-foot">
          <span class="panel-foot-note">PASSPORT ID — ${ctx.passportId()}</span>
          <div class="xp-row">
            <button type="button" class="xp-btn is-quiet" data-close>Close</button>
            <button type="button" class="xp-btn is-primary" data-download-passport ${count === 7 ? '' : 'disabled'}>Download passport ↓</button>
          </div>
        </div>
      </div>
    </div>
  `);

  el.querySelector('[data-download-passport]').addEventListener('click', () => {
    ctx.downloadPassport();
  });

  return { el };
}

/* ============================================================
   credits
   ============================================================ */

export function renderCredits(ctx) {
  const el = h(`
    <div class="panel-modal" role="dialog" aria-modal="true" aria-labelledby="credits-title">
      <button class="modal-close" type="button" aria-label="Close credits" data-close>
        <svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>
      </button>
      <header class="panel-head">
        <div>
          <div class="panel-kicker">BEHIND THE NEON / 裏側</div>
          <h2 class="panel-title" id="credits-title">CREDITS</h2>
          <p class="panel-sub">A fictional festival, built with real light.</p>
        </div>
      </header>
      <div class="panel-body">
        <div class="credits-grid">
          <div class="credits-block">
            <h4>THE FESTIVAL</h4>
            <p>NEON MATSURI 2099 is a fictional cyberpunk Japanese street festival built as a walkable web experience. Seven stalls, one night, no map. Everything you see in the street was assembled procedurally in Three.js.</p>
            <p>Take your time. Click the floating diamonds. Press E near a stall. Look up when the car passes.</p>
          </div>
          <div class="credits-block">
            <h4>PHOTOGRAPHY</h4>
            <ul>
              <li><span>Puffer portraits</span><span>Danik Prihodko · Abdullahi Abdulquadri</span></li>
              <li><span>Ramen / takoyaki / taiyaki</span><span>Pexels contributors</span></li>
              <li><span>Lanterns / omikuji / ema</span><span>Pexels contributors</span></li>
              <li><span>Goldfish / arcade / yatai</span><span>Pexels contributors</span></li>
              <li><span>Photo source IDs</span><span>15963577 · 19441383 · 19714680 · 31393444 · 30874698 · 37275994 · 38541061 · 5472268 · 31365950 · 39065871 · 7107238 · 40704115 · 18997074</span></li>
            </ul>
            <p style="margin-top:10px">All photography is used under the <a href="https://www.pexels.com/license/" target="_blank" rel="noopener">Pexels free license</a> and the <a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash license</a>. No AI-generated imagery. Type, light and icons are handmade in CSS, SVG and canvas.</p>
          </div>
          <div class="credits-block">
            <h4>TOOLS</h4>
            <ul>
              <li><span>Realtime street</span><span>Three.js + Vite</span></li>
              <li><span>Type</span><span>Bebas Neue · Space Grotesk · Shippori Mincho · Zen Kaku Gothic New · DotGothic16</span></li>
              <li><span>Sound</span><span>Generative Web Audio — rain, taiko, koto</span></li>
              <li><span>Mood reference</span><span>threejs-punk by Anderson Mancini & Sunag</span></li>
            </ul>
          </div>
          <div class="credits-block">
            <h4>PLAY NOTES</h4>
            <p><strong>WASD / arrows</strong> walk · <strong>drag</strong> look · <strong>scroll</strong> drift forward · <strong>E / click</strong> enter a stall · <strong>M</strong> map · <strong>P</strong> passport · <strong>ESC</strong> close.</p>
            <p style="margin-top:8px">Sound starts after you enter. Use the SOUND button to mute. The street is best after midnight, wherever you are.</p>
            <p style="margin-top:8px">Stamps live in your browser's local storage. Clearing site data resets the night.</p>
          </div>
        </div>
        <div class="panel-foot">
          <span class="panel-foot-note">© 2099 NEON MATSURI — A FESTIVAL THAT NEVER EXISTED</span>
          <button type="button" class="xp-btn is-quiet" data-close>Close</button>
        </div>
      </div>
    </div>
  `);
  return { el };
}

/* ============================================================
   finale
   ============================================================ */

export function renderFinale(ctx) {
  const unlocked = ctx.hasAllStamps();
  const stats = ctx.state.stats;
  const lastLook = stats.lastLook?.name || '—';
  const lastFortune = stats.lastFortune?.grade || '—';
  const wish = stats.wishes?.[0]?.text || '—';
  const charm = stats.lastCharm?.name || '—';
  const missing = STALLS.filter((s) => !ctx.hasStamp(s.id));

  const el = h(`
    <div class="panel-modal finale-modal" role="dialog" aria-modal="true" aria-labelledby="finale-title">
      <button class="modal-close" type="button" aria-label="Close finale" data-close>
        <svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg>
      </button>
      <div class="finale-hero">
        <div class="koi">${koiSvg()}</div>
        <div class="finale-copy">
          <div class="finale-kicker">${unlocked ? 'THE SEAL IS BROKEN / 封印解除' : 'THE SEAL IS STILL WARM / 封印中'}</div>
          <h2 class="finale-title" id="finale-title">${unlocked ? 'THE GOLDEN <em>KOI REMEMBERS YOU</em>' : 'WAKE THE <em>GOLDEN KOI</em>'}</h2>
          <p class="finale-poem">${unlocked
            ? 'You walked the whole street. Seven lights, seven small acts of attention. The koi has been swimming under the city since before the rain. It lifts its head, once, and the neon bends toward you.'
            : 'The stage is a machine for remembering. It will not open until it has met all seven of your stamps. The koi is patient. It has been patient for a very long time.'}</p>
          ${unlocked ? `
            <div class="finale-stats">
              <div class="finale-stat"><span>YOUR LOOK</span><strong>${esc(lastLook)}</strong></div>
              <div class="finale-stat"><span>YOUR FORTUNE</span><strong>${esc(lastFortune)}</strong></div>
              <div class="finale-stat"><span>YOUR WISH</span><strong>${esc(wish.slice(0, 22))}</strong></div>
              <div class="finale-stat"><span>YOUR CHARM</span><strong>${esc(charm)}</strong></div>
            </div>
            <div class="finale-actions">
              <button type="button" class="xp-btn is-primary" data-watch>Watch the koi ↑</button>
              <button type="button" class="xp-btn is-quiet" data-download-passport>Download passport</button>
              <button type="button" class="xp-btn is-quiet" data-close>Stay a little longer</button>
            </div>
            <p class="finale-note">THANK YOU FOR WALKING. THE STREET WILL BE HERE AGAIN TOMORROW, SLIGHTLY DIFFERENT.</p>
          ` : `
            <div class="finale-locked">
              <div class="finale-checklist">
                ${STALLS.map((s) => `<span class="finale-check ${ctx.hasStamp(s.id) ? 'is-done' : ''}">${s.glyph} ${ctx.hasStamp(s.id) ? 'DONE' : 'MISSING'}</span>`).join('')}
              </div>
              <p class="xp-note">${missing.length} STALL${missing.length === 1 ? '' : 'S'} STILL WAITING — ${missing.map((s) => s.short).join(' · ')}</p>
              <div class="finale-actions">
                <button type="button" class="xp-btn is-primary" data-open-map>Open the map</button>
                <button type="button" class="xp-btn is-quiet" data-close>Keep walking</button>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `);

  el.querySelector('[data-watch]')?.addEventListener('click', () => {
    ctx.audio.success();
    ctx.watchKoi();
  });
  el.querySelector('[data-open-map]')?.addEventListener('click', () => ctx.openMap());
  el.querySelector('[data-download-passport]')?.addEventListener('click', () => ctx.downloadPassport());

  return { el };
}

/* ============================================================
   passport download
   ============================================================ */

export function downloadPassportCanvas(ctx) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1600;
  const c = canvas.getContext('2d');
  const bg = c.createLinearGradient(0, 0, 1200, 1600);
  bg.addColorStop(0, '#100819');
  bg.addColorStop(0.6, '#07030e');
  bg.addColorStop(1, '#150a1a');
  c.fillStyle = bg;
  c.fillRect(0, 0, 1200, 1600);
  // border
  c.strokeStyle = 'rgba(245,238,226,.22)';
  c.lineWidth = 2;
  c.strokeRect(46, 46, 1108, 1508);
  c.strokeStyle = 'rgba(255,47,146,.5)';
  c.strokeRect(62, 62, 1076, 1476);
  // header
  c.textAlign = 'center';
  c.fillStyle = '#ff2f92';
  c.font = '18px "DotGothic16", monospace';
  c.fillText('NEON MATSURI 2099 / FESTIVAL PASSPORT / 御朱印帳', 600, 150);
  c.fillStyle = '#f5eee2';
  c.font = '400 108px "Bebas Neue", Impact, sans-serif';
  c.fillText('SEVEN STAMPS', 600, 270);
  c.fillStyle = 'rgba(245,238,226,.55)';
  c.font = '20px "Space Grotesk", sans-serif';
  c.fillText('A FESTIVAL THAT NEVER EXISTED · ONE NIGHT ONLY', 600, 312);

  const cols = 4;
  const cw = 240;
  const ch = 240;
  const gap = 16;
  const startX = (1200 - (cols * cw + (cols - 1) * gap)) / 2;
  const startY = 390;
  const stamps = [...STALLS.map((s) => ({ ...s, visited: ctx.hasStamp(s.id) })), { glyph: '光', name: 'AFTERGLOW STAGE', jp: '残光ステージ', visited: ctx.hasAllStamps(), accent: '#ffcf7a' }];
  stamps.forEach((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cw + gap);
    const y = startY + row * (ch + gap);
    c.strokeStyle = s.visited ? `${s.accent}99` : 'rgba(245,238,226,.14)';
    c.lineWidth = s.visited ? 2 : 1;
    c.fillStyle = s.visited ? `${s.accent}10` : 'rgba(245,238,226,.02)';
    c.fillRect(x, y, cw, ch);
    c.strokeRect(x, y, cw, ch);
    c.fillStyle = s.visited ? s.accent : 'rgba(245,238,226,.2)';
    c.font = '600 76px "Shippori Mincho", serif';
    c.fillText(s.glyph, x + cw / 2, y + 120);
    c.fillStyle = s.visited ? 'rgba(245,238,226,.9)' : 'rgba(245,238,226,.35)';
    c.font = '16px "Space Grotesk", sans-serif';
    c.fillText(s.name, x + cw / 2, y + 182);
    c.fillStyle = 'rgba(245,238,226,.45)';
    c.font = '12px "DotGothic16", monospace';
    c.fillText(s.visited ? 'RECORDED / 記録済' : 'MISSING / 未記録', x + cw / 2, y + 210);
  });
  // stats
  const lastLook = ctx.state.stats.lastLook?.name || '—';
  const lastFortune = ctx.state.stats.lastFortune?.grade || '—';
  const wish = ctx.state.stats.wishes?.[0]?.text || '—';
  c.textAlign = 'left';
  c.fillStyle = 'rgba(245,238,226,.4)';
  c.font = '14px "DotGothic16", monospace';
  c.fillText('YOUR LOOK', 120, 1010);
  c.fillText('YOUR FORTUNE', 120, 1080);
  c.fillText('YOUR WISH', 120, 1150);
  c.fillStyle = '#f5eee2';
  c.font = '26px "Shippori Mincho", serif';
  c.fillText(lastLook.slice(0, 26), 380, 1012);
  c.fillText(lastFortune, 380, 1082);
  c.font = '20px "Shippori Mincho", serif';
  c.fillText(wish.slice(0, 34), 380, 1152);
  c.textAlign = 'center';
  c.fillStyle = 'rgba(255,207,122,.85)';
  c.font = '16px "DotGothic16", monospace';
  c.fillText(firstSeenLine(ctx), 600, 1320);
  c.fillStyle = 'rgba(245,238,226,.35)';
  c.font = '12px "DotGothic16", monospace';
  c.fillText(`PASSPORT ID ${ctx.passportId()} · GENERATED ${new Date().toISOString().slice(0, 10)}`, 600, 1510);
  c.fillStyle = 'rgba(255,47,146,.8)';
  c.font = '18px "DotGothic16", monospace';
  c.fillText('電 光 祭', 600, 1420);
  return canvas;
}

function firstSeenLine(ctx) {
  return ctx.hasAllStamps() ? 'ALL SEVEN LIGHTS LIT — THE GOLDEN KOI REMEMBERS YOU' : 'THE STREET REMEMBERS EVERYONE WHO WALKS IT';
}

export function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}
