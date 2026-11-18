import * as THREE from 'three';
import './style.css';
import { createWorld } from './world.js';
import { FestivalAudio } from './audio.js';
import { STALLS, STAGE } from './data.js';
import {
  renderStallModal,
  renderMap,
  renderPassport,
  renderCredits,
  renderFinale,
  downloadPassportCanvas,
} from './experiences.js';

/* ============================================================
   boot constants + helpers
   ============================================================ */

const $ = (sel) => document.querySelector(sel);
const isCoarse = window.matchMedia('(pointer: coarse)').matches;
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STORAGE_KEY = 'neon-matsuri-state-v1';
const FX_KEY = 'neon-matsuri-fx';

const DEFAULT_STATE = {
  stamps: [],
  stats: {
    bowls: 0,
    lastBowl: null,
    looks: 0,
    lastLook: null,
    wishes: [],
    takoyaki: 0,
    bestFlips: 0,
    fish: 0,
    lastFortune: null,
    fortunesDrawn: 0,
    charms: 0,
    lastCharm: null,
  },
  passportId: null,
};

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return structuredClone(DEFAULT_STATE);
    return {
      ...structuredClone(DEFAULT_STATE),
      ...parsed,
      stats: { ...DEFAULT_STATE.stats, ...(parsed.stats || {}) },
      stamps: Array.isArray(parsed.stamps) ? parsed.stamps.filter((id) => STALLS.some((s) => s.id === id)) : [],
    };
  } catch (e) {
    return structuredClone(DEFAULT_STATE);
  }
}

const state = loadState();
if (!state.passportId) {
  state.passportId = `NM-2099-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
const stamps = new Set(state.stamps);
const audio = new FestivalAudio();

const els = {
  loader: $('#loader'),
  loaderBar: $('#loaderBar'),
  loaderPct: $('#loaderPct'),
  loaderStatus: $('#loaderStatus'),
  intro: $('#intro'),
  introDate: $('#introDate'),
  introTime: $('#introTime'),
  enterBtn: $('#enterBtn'),
  introCreditsBtn: $('#introCreditsBtn'),
  hud: $('#hud'),
  hudLocationText: $('#hudLocationText'),
  soundBtn: $('#soundBtn'),
  mapBtn: $('#mapBtn'),
  passportBtn: $('#passportBtn'),
  fxBtn: $('#fxBtn'),
  fxLabel: $('#fxLabel'),
  stampCount: $('#stampCount'),
  stampRail: $('#stampRail'),
  hoverCard: $('#hoverCard'),
  walkPrompt: $('#walkPrompt'),
  strollBtn: $('#strollBtn'),
  toast: $('#toast'),
  modalRoot: $('#modalRoot'),
  joy: $('#joy'),
  joyKnob: $('.joy-knob'),
  mobileControls: $('#mobileControls'),
};

const modalRoot = els.modalRoot;
let world = null;
let entered = false;
let controlsEnabled = false;
let modalOpen = false;
let modalCleanup = null;
let lastFocus = null;
let highFx = false;
let stroll = false;
let toastTimer = 0;
let currentArea = 'street';
let hoveredId = null;
let pointer = { x: 0, y: 0, active: false };
let lastHoverCheck = 0;
let dragging = false;
let dragStart = { x: 0, y: 0, time: 0, moved: 0 };
let lastPointer = { x: 0, y: 0 };

const rig = {
  pos: new THREE.Vector3(0.7, 1.65, 14.6),
  yaw: 0.03,
  pitch: -0.04,
  roll: 0,
  bobPhase: 0,
  stepDistance: 0,
};

const travel = {
  active: false,
  start: 0,
  duration: 1.4,
  fromPos: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  fromYaw: 0,
  toYaw: 0,
  fromPitch: 0,
  toPitch: 0,
  onDone: null,
};

const move = {
  x: 0,
  y: 0,
  scroll: 0,
};

const keys = new Set();
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const projected = new THREE.Vector3();

/* ============================================================
   tiny UI helpers
   ============================================================ */

function toast(message, duration = 4400) {
  window.clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => els.toast.classList.remove('is-visible'), duration);
}

function pressFx() {
  highFx = !highFx;
  localStorage.setItem(FX_KEY, highFx ? 'high' : 'low');
  if (world) world.setFx(highFx);
  els.fxLabel.textContent = highFx ? 'FX+' : 'FX−';
  els.fxBtn.title = highFx ? 'High resolution effects on' : 'High resolution effects off';
  document.body.classList.toggle('low-fx', !highFx);
  audio.click();
  toast(highFx ? 'HIGH FX // THE RAIN GETS SHARPER.' : 'LOW FX // THE STREET SAVES ITS ENERGY.');
}

function updateStampUI() {
  els.stampCount.textContent = String(stamps.size);
  els.stampRail.innerHTML = STALLS.map((s) => {
    const isStamped = stamps.has(s.id);
    return `<button type="button" class="stamp-slot ${isStamped ? 'is-stamped' : ''} ${currentArea === s.id ? 'is-current' : ''}" style="--seal-color:${s.accent}" data-stamp-id="${s.id}" data-label="${s.no} · ${s.name}${isStamped ? ' — STAMPED' : ''}" aria-label="${s.name}${isStamped ? ', stamped' : ', not yet visited'}">${s.glyph}</button>`;
  }).join('');
  els.stampRail.querySelectorAll('[data-stamp-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!entered) return;
      travelTo(btn.dataset.stampId);
    });
  });
  els.passportBtn.setAttribute('aria-label', `Festival passport: ${stamps.size} of 7 stamps`);
}

function hasStamp(id) {
  return stamps.has(id);
}

function hasAllStamps() {
  return stamps.size === STALLS.length;
}

function stampCount() {
  return stamps.size;
}

function nearestStall(maxDistance = 6) {
  let best = null;
  let bestDist = Infinity;
  STALLS.forEach((s) => {
    const d = Math.abs(rig.pos.z - s.z);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  });
  if (bestDist <= maxDistance) return best;
  return null;
}

function getCurrentId() {
  if (!entered) return 'street';
  if (rig.pos.z < -95) return 'stage';
  const near = nearestStall(9);
  return near ? near.id : 'street';
}

function updateArea() {
  const id = getCurrentId();
  if (id === currentArea) return;
  currentArea = id;
  if (id === 'street') {
    els.hudLocationText.textContent = 'THE STREET / 電光祭';
  } else if (id === 'stage') {
    els.hudLocationText.textContent = '08 — AFTERGLOW STAGE';
  } else {
    const s = STALLS.find((x) => x.id === id);
    els.hudLocationText.textContent = s ? `${s.no} — ${s.name}` : 'THE STREET';
  }
  els.stampRail.querySelectorAll('[data-stamp-id]').forEach((b) => b.classList.toggle('is-current', b.dataset.stampId === currentArea));
}

/* ============================================================
   state completion
   ============================================================ */

function saveState() {
  state.stamps = [...stamps];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function complete(id, payload = {}) {
  const isNew = !stamps.has(id);
  const stall = STALLS.find((s) => s.id === id);
  if (!stall) return { count: stamps.size, isNew: false };
  if (isNew) {
    stamps.add(id);
    if (world) world.setStallVisited(id, true);
    audio.stamp();
  }
  state.stats = { ...state.stats, ...payload };
  saveState();
  updateStampUI();

  const count = stamps.size;
  if (isNew) {
    toast(`STAMP ${String(count).padStart(2, '0')} / 07 — ${stall.glyph} ${stall.name} RECORDED.`);
    if (count === STALLS.length) {
      window.setTimeout(() => {
        if (world) world.setFinaleUnlocked(true, true);
        audio.success();
        toast('ALL SEVEN LIGHTS LIT — THE GOLDEN KOI IS AWAKE. FIND THE AFTERGLOW STAGE.');
      }, 900);
    }
  } else if (payload && Object.keys(payload).length) {
    toast('YOUR RECORD HAS BEEN UPDATED.');
  }
  return { count, isNew };
}

/* ============================================================
   modal manager
   ============================================================ */

function openModal(node) {
  if (modalOpen) closeModal(true);
  lastFocus = document.activeElement;
  keys.clear();
  move.x = 0;
  move.y = 0;
  setStroll(false);
  modalRoot.innerHTML = '';
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.dataset.close = '';
  modalRoot.append(backdrop, node);
  modalRoot.classList.add('is-open');
  document.body.classList.add('modal-open');
  modalRoot.setAttribute('aria-hidden', 'false');
  modalOpen = true;
  clearHover();
  window.setTimeout(() => {
    const focusable = node.querySelector('.modal-close, button:not([disabled]), input, textarea, [href]');
    focusable?.focus({ preventScroll: true });
  }, 80);
}

function closeModal(silent = false) {
  if (!modalOpen) return;
  if (typeof modalCleanup === 'function') modalCleanup();
  modalCleanup = null;
  modalRoot.classList.remove('is-open');
  modalRoot.innerHTML = '';
  modalRoot.setAttribute('aria-hidden', 'true');
  modalOpen = false;
  document.body.classList.remove('modal-open');
  clearHover();
  if (!silent) lastFocus?.focus?.({ preventScroll: true });
}

modalRoot.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) {
    audio.click();
    closeModal();
  }
});

document.addEventListener('keydown', (e) => {
  if (!modalOpen) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal();
    return;
  }
  if (e.key !== 'Tab') return;
  const focusable = [...modalRoot.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* ============================================================
   modal openers
   ============================================================ */

function openStall(id) {
  if (!world) return;
  if (id === 'stage') {
    openFinale();
    return;
  }
  const stall = STALLS.find((s) => s.id === id);
  if (!stall) return;
  const { el, destroy } = renderStallModal(stall, ctx);
  modalCleanup = destroy || null;
  openModal(el);
  audio.click();
}

function openMap() {
  if (!world) return;
  const { el } = renderMap(ctx);
  modalCleanup = null;
  openModal(el);
  audio.click();
}

function openPassport() {
  if (!world) return;
  const { el } = renderPassport(ctx);
  modalCleanup = null;
  openModal(el);
  audio.click();
}

function openCredits() {
  const { el } = renderCredits(ctx);
  modalCleanup = null;
  openModal(el);
  audio.click();
}

function openFinale() {
  if (!world) return;
  const { el } = renderFinale(ctx);
  modalCleanup = null;
  openModal(el);
  audio.click();
}

function openNearby() {
  if (modalOpen) return;
  if (hoveredId) {
    selectTarget(hoveredId);
    return;
  }
  const near = nearestStall(5.8);
  if (near) {
    selectTarget(near.id);
    return;
  }
  if (rig.pos.z < -96) {
    selectTarget('stage');
    return;
  }
  toast('NO STALL WITHIN REACH. FOLLOW THE LANTERNS OR OPEN THE MAP (M).');
}

function selectTarget(id) {
  if (!world) return;
  if (id === 'stage') {
    if (Math.abs(rig.pos.z + 101) < 8) {
      openFinale();
    } else {
      travelTo('stage');
    }
    return;
  }
  const stall = STALLS.find((s) => s.id === id);
  if (!stall) return;
  if (Math.abs(rig.pos.z - stall.z) < 7) {
    openStall(id);
  } else {
    travelTo(id);
  }
}

function travelTo(id, { openAfter = true, duration = 1.35 } = {}) {
  if (!world) return;
  if (modalOpen) closeModal(true);
  clearHover();
  setStroll(false);
  const views = world.getStallViews();
  const view = views[id] || views.stage;
  const targetYaw = Math.atan2(-(view.target.x - view.position.x), -(view.target.z - view.position.z));
  const dx = view.target.x - view.position.x;
  const dz = view.target.z - view.position.z;
  const horizontal = Math.max(0.0001, Math.hypot(dx, dz));
  const targetPitch = Math.atan2(view.target.y - view.position.y, horizontal);
  startTravel({
    position: view.position,
    yaw: targetYaw,
    pitch: clampPitch(targetPitch),
    duration,
    onDone: () => {
      if (openAfter) {
        window.setTimeout(() => {
          if (!modalOpen) {
            if (id === 'stage') openFinale();
            else openStall(id);
          }
        }, 220);
      }
    },
  });
  audio.click();
}

function clampPitch(p) {
  return Math.max(-0.82, Math.min(0.78, p));
}

function startTravel({ position, yaw, pitch, duration = 1.4, onDone = null }) {
  travel.active = true;
  travel.start = performance.now();
  travel.duration = duration * 1000;
  travel.fromPos.copy(rig.pos);
  travel.toPos.copy(position);
  travel.fromYaw = rig.yaw;
  travel.toYaw = nearestAngle(rig.yaw, yaw);
  travel.fromPitch = rig.pitch;
  travel.toPitch = pitch;
  travel.onDone = onDone;
  controlsEnabled = false;
  move.scroll = 0;
}

function nearestAngle(from, to) {
  let d = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d;
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function updateTravel(now) {
  const t = Math.min(1, (now - travel.start) / travel.duration);
  const e = easeInOut(t);
  rig.pos.lerpVectors(travel.fromPos, travel.toPos, e);
  rig.yaw = travel.fromYaw + (travel.toYaw - travel.fromYaw) * e;
  rig.pitch = travel.fromPitch + (travel.toPitch - travel.fromPitch) * e;
  rig.roll = Math.sin(e * Math.PI) * 0.012;
  if (t >= 1) {
    travel.active = false;
    rig.roll = 0;
    controlsEnabled = true;
    travel.onDone?.();
    travel.onDone = null;
  }
}

/* ============================================================
   canvas pointer controls
   ============================================================ */

function pointerNdc(clientX, clientY) {
  const rect = world.renderer.domElement.getBoundingClientRect();
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  return ndc;
}

function pick(clientX, clientY) {
  if (!world) return null;
  raycaster.setFromCamera(pointerNdc(clientX, clientY), world.camera);
  const hits = raycaster.intersectObjects(world.hitboxes, false);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj && !obj.userData?.stallId) obj = obj.parent;
  if (!obj?.userData?.stallId) return null;
  return { id: obj.userData.stallId, point: hits[0].point, distance: hits[0].distance };
}

function stallLabel(id) {
  if (id === 'stage') return { no: '08', name: 'AFTERGLOW STAGE', glyph: '光', color: '#ffcf7a' };
  const s = STALLS.find((x) => x.id === id);
  return s ? { no: s.no, name: s.name, glyph: s.glyph, color: s.accent } : null;
}

function setHover(id, clientX, clientY) {
  if (hoveredId === id && id) {
    els.hoverCard.style.left = `${clientX}px`;
    els.hoverCard.style.top = `${clientY - 12}px`;
    return;
  }
  hoveredId = id;
  if (!id) {
    clearHover();
    return;
  }
  const info = stallLabel(id);
  if (!info) return clearHover();
  const no = els.hoverCard.querySelector('.hover-no');
  const name = els.hoverCard.querySelector('strong');
  const glyph = els.hoverCard.querySelector('.hover-glyph');
  no.textContent = info.no;
  name.textContent = info.name;
  glyph.textContent = info.glyph;
  glyph.style.color = info.color;
  els.hoverCard.style.left = `${Math.min(window.innerWidth - 120, Math.max(120, clientX))}px`;
  els.hoverCard.style.top = `${clientY - 12}px`;
  els.hoverCard.classList.add('is-visible');
  document.body.classList.add('can-enter');
  world.renderer.domElement.classList.add('is-over-stall');
}

function clearHover() {
  hoveredId = null;
  els.hoverCard.classList.remove('is-visible');
  document.body.classList.remove('can-enter');
  if (world) world.renderer.domElement.classList.remove('is-over-stall');
}

function onPointerDown(e) {
  if (!entered || modalOpen || travel.active) return;
  if (e.button !== undefined && e.button !== 0) return;
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY, time: performance.now(), moved: 0, last: { x: e.clientX, y: e.clientY } };
  lastPointer = { x: e.clientX, y: e.clientY };
  try {
    world.renderer.domElement.setPointerCapture(e.pointerId);
  } catch (err) { /* ignore */ }
  world.renderer.domElement.classList.add('is-dragging');
  clearHover();
}

function onPointerMove(e) {
  if (!entered || modalOpen) return;
  if (e.target.closest?.('.hud-btn, .stamp-rail, .stroll-btn, .near-prompt, .modal-root')) {
    clearHover();
    return;
  }
  lastPointer = { x: e.clientX, y: e.clientY };
  pointer = { x: e.clientX, y: e.clientY, active: true };
  if (dragging) {
    const prev = dragStart.last || { x: e.clientX, y: e.clientY };
    const deltaX = e.clientX - prev.x;
    const deltaY = e.clientY - prev.y;
    dragStart.last = { x: e.clientX, y: e.clientY };
    dragStart.moved += Math.abs(deltaX) + Math.abs(deltaY);
    const sensitivity = isCoarse ? 0.0032 : 0.0023;
    rig.yaw -= deltaX * sensitivity;
    rig.pitch = clampPitch(rig.pitch - deltaY * sensitivity);
    return;
  }
  // raycast for the hover label
  const hit = pick(e.clientX, e.clientY);
  if (hit) {
    setHover(hit.id, e.clientX, e.clientY);
  } else {
    clearHover();
  }
}

function onPointerUp(e) {
  if (!entered) return;
  world.renderer.domElement.classList.remove('is-dragging');
  if (!dragging) return;
  dragging = false;
  const dt = performance.now() - dragStart.time;
  const moved = dragStart.moved;
  dragStart.last = null;
  if (moved < 9 && dt < 420 && !modalOpen) {
    const hit = pick(e.clientX, e.clientY);
    if (hit) {
      selectTarget(hit.id);
    }
  }
}

function bindCanvas() {
  const canvas = world.renderer.domElement;
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', () => {
    dragging = false;
    dragStart.last = null;
    canvas.classList.remove('is-dragging');
  });
  canvas.addEventListener('pointerleave', () => {
    if (!dragging) {
      pointer.active = false;
      clearHover();
    }
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!entered || modalOpen) return;
      e.preventDefault();
      setStroll(false);
      move.scroll += Math.max(-14, Math.min(14, e.deltaY * 0.055));
    },
    { passive: false },
  );
}

/* ============================================================
   movement + camera
   ============================================================ */

function keyDown(e) {
  const tag = (e.target.tagName || '').toLowerCase();
  if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable) return;
  if (modalOpen) return;

  if (e.key === 'Escape') {
    closeModal();
    return;
  }
  if (!entered) {
    if (e.key === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      enterFestival();
    }
    return;
  }

  if (e.code === 'KeyE') {
    e.preventDefault();
    openNearby();
    return;
  }
  if (e.code === 'KeyM') {
    e.preventDefault();
    openMap();
    return;
  }
  if (e.code === 'KeyP') {
    e.preventDefault();
    openPassport();
    return;
  }
  if (e.code === 'Escape') {
    closeModal();
    return;
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    if (e.code !== 'Space') e.preventDefault();
  }
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
    setStroll(false);
    keys.add(e.code);
  }
}

function keyUp(e) {
  keys.delete(e.code);
}

function setStroll(on) {
  if (stroll === on) return;
  stroll = on;
  els.strollBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (on) {
    audio.click();
    toast('AUTO STROLL ON — LET THE STREET COME TO YOU.');
  }
}

els.strollBtn.addEventListener('click', () => {
  if (!entered) return;
  setStroll(!stroll);
  if (stroll) audio.click();
});

function updateMovement(dt) {
  if (!entered) {
    const t = performance.now() * 0.001;
    rig.pos.x = 0.7 + Math.sin(t * 0.14) * 0.12;
    rig.pos.z = 14.6 + Math.sin(t * 0.11) * 0.1;
    rig.yaw = 0.03 + Math.sin(t * 0.09) * 0.012;
    rig.pitch = -0.045 + Math.sin(t * 0.07) * 0.006;
    rig.pos.y = 1.65;
    rig.roll = Math.sin(t * 0.08) * 0.002;
    return;
  }

  const shift = keys.has('ShiftLeft') || keys.has('ShiftRight');
  const speed = shift ? 5.4 : 3.0;
  let forward =
    (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) -
    (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) -
    move.y;
  let strafe =
    (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
    (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) +
    move.x;

  if (stroll && !travel.active) {
    rig.pos.z -= 1.0 * dt;
    rig.pos.x += (0 - rig.pos.x) * Math.min(1, dt * 0.35);
    if (rig.pos.z <= -101) {
      rig.pos.z = -101;
      setStroll(false);
      toast('END OF THE STREET. THE STAGE IS LISTENING.');
    }
  }

  // clamp input vector
  const mag = Math.hypot(forward, strafe);
  if (mag > 1) {
    forward /= mag;
    strafe /= mag;
  }

  if ((forward !== 0 || strafe !== 0) && controlsEnabled) {
    const sin = Math.sin(rig.yaw);
    const cos = Math.cos(rig.yaw);
    // forward = (-sin, -cos), right = (cos, -sin)
    const dx = (-sin * forward + cos * strafe) * speed * dt;
    const dz = (-cos * forward - sin * strafe) * speed * dt;
    rig.pos.x += dx;
    rig.pos.z += dz;
    rig.bobPhase += dt * (shift ? 11 : 7.6);
    rig.stepDistance += Math.hypot(dx, dz);
    if (rig.stepDistance > (shift ? 2.5 : 1.9)) {
      rig.stepDistance = 0;
      audio.footstep(shift ? 1.2 : 0.85);
    }
  } else {
    rig.bobPhase += dt * 0.5;
  }

  // scroll drift
  if (Math.abs(move.scroll) > 0.001 && controlsEnabled) {
    rig.pos.z -= move.scroll * dt;
    move.scroll *= Math.exp(-dt * 3.3);
    rig.bobPhase += dt * 6 * Math.min(1, Math.abs(move.scroll) / 3);
  } else {
    move.scroll = 0;
  }

  rig.pos.x = Math.max(-3.15, Math.min(3.15, rig.pos.x));
  rig.pos.z = Math.max(-104, Math.min(15.2, rig.pos.z));
  const walking = Math.abs(forward) > 0.01 || Math.abs(strafe) > 0.01 || Math.abs(move.scroll) > 0.2 || stroll;
  const bob = walking && !prefersReduced ? Math.sin(rig.bobPhase) * 0.018 : Math.sin(performance.now() * 0.0012) * 0.003;
  rig.pos.y = 1.65 + bob;
  rig.roll = walking && !prefersReduced ? Math.sin(rig.bobPhase * 0.5) * 0.0035 : 0;
}

function applyCamera() {
  world.camera.position.copy(rig.pos);
  world.camera.rotation.set(rig.pitch, rig.yaw, rig.roll, 'YXZ');
}

/* ============================================================
   interactions / HUD
   ============================================================ */

function buildNearPrompt() {
  const near = document.createElement('button');
  near.type = 'button';
  near.className = 'near-prompt';
  near.id = 'nearPrompt';
  near.innerHTML = `<span class="near-key">E</span><span class="near-copy"><small>ENTER STALL</small><strong></strong></span><span class="near-glyph"></span>`;
  near.addEventListener('click', () => {
    if (near.dataset.id) selectTarget(near.dataset.id);
  });
  els.hud.appendChild(near);
}

function updateNearPrompt() {
  const near = document.getElementById('nearPrompt');
  if (!near) return;
  if (!entered || modalOpen || travel.active) {
    near.classList.remove('is-visible');
    return;
  }
  let target = null;
  if (hoveredId) {
    target = STALLS.find((s) => s.id === hoveredId) || (hoveredId === 'stage' ? { id: 'stage', name: 'AFTERGLOW STAGE', glyph: '光', no: '08', accent: '#ffcf7a' } : null);
  } else {
    const nearStall = nearestStall(5.8);
    if (nearStall) target = nearStall;
    else if (rig.pos.z < -96) target = { id: 'stage', name: 'AFTERGLOW STAGE', glyph: '光', no: '08', accent: '#ffcf7a' };
  }
  if (!target) {
    near.classList.remove('is-visible');
    return;
  }
  near.dataset.id = target.id;
  near.querySelector('strong').textContent = target.name;
  near.querySelector('.near-glyph').textContent = target.glyph;
  near.querySelector('.near-glyph').style.color = target.accent || '#ffcf7a';
  near.classList.add('is-visible');
}

function bindHud() {
  els.soundBtn.addEventListener('click', () => {
    const muted = !audio.muted;
    audio.setMuted(muted);
    els.soundBtn.setAttribute('aria-pressed', muted ? 'false' : 'true');
    toast(muted ? 'SOUND OFF. THE RAIN IS STILL FALLING.' : 'SOUND ON. LISTEN FOR THE DISTANT TAIKO.');
    if (!muted) audio.click();
  });
  els.mapBtn.addEventListener('click', () => openMap());
  els.passportBtn.addEventListener('click', () => openPassport());
  els.fxBtn.addEventListener('click', pressFx);
}

function updateHudThrottled(now) {
  if (now - lastHoverCheck < 160) return;
  lastHoverCheck = now;
  if (!entered) return;
  if (modalOpen || travel.active || dragging || !pointer.active) {
    if (!hoveredId && !modalOpen) {
      // keep the nearest prompt alive
    }
  } else {
    const hit = pick(pointer.x, pointer.y);
    if (hit) setHover(hit.id, pointer.x, pointer.y);
    else clearHover();
  }
  updateNearPrompt();
  updateArea();
}

/* ============================================================
   moments + downloads
   ============================================================ */

function watchKoi() {
  closeModal(true);
  if (world) {
    world.setFinaleUnlocked(true, true);
    world.triggerGoldenKoi(true);
  }
  audio.success();
  startTravel({
    position: new THREE.Vector3(0, 1.7, -94.5),
    yaw: Math.PI,
    pitch: 0.23,
    duration: 2.1,
    onDone: () => {
      controlsEnabled = true;
    },
  });
  const moment = document.createElement('div');
  moment.className = 'koi-moment';
  moment.innerHTML = `<span>LOOK UP</span><strong>金鯉</strong><em>THE GOLDEN KOI REMEMBERS YOU</em>`;
  document.body.appendChild(moment);
  window.setTimeout(() => moment.classList.add('is-leaving'), 4200);
  window.setTimeout(() => moment.remove(), 5600);
  toast('KEEP LOOKING UP. THE STREET IS SHOWING YOU SOMETHING.', 6000);
}

function downloadPassport() {
  if (!hasAllStamps()) {
    toast('COLLECT ALL SEVEN STAMPS BEFORE DOWNLOADING YOUR PASSPORT.');
    audio.error();
    return;
  }
  const canvas = downloadPassportCanvas(ctx);
  const link = document.createElement('a');
  link.download = `neon-matsuri-passport-${state.passportId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  audio.click();
  toast('PASSPORT SAVED. KEEP IT DRY.');
}

const ctx = {
  audio,
  state,
  get world() {
    return world;
  },
  hasStamp,
  hasAllStamps,
  stampCount,
  complete,
  toast,
  closeModal,
  openMap,
  openPassport,
  openCredits,
  openFinale,
  travelTo,
  getCurrentId,
  passportId: () => state.passportId,
  downloadPassport,
  watchKoi,
};

/* ============================================================
   intro / boot
   ============================================================ */

function setLoader(pct, status) {
  els.loaderBar.style.width = `${pct}%`;
  els.loaderPct.textContent = String(Math.round(pct)).padStart(2, '0');
  if (status) els.loaderStatus.textContent = status;
}

function updateClock() {
  try {
    const now = new Date();
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Tokyo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);
    els.introTime.textContent = time;
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    }).format(now);
    els.introDate.textContent = `TOKYO / ${date.replaceAll('-', '.')}`;
  } catch (e) {
    els.introTime.textContent = '02:47';
  }
}

async function waitForFonts() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('400 80px "Bebas Neue"'),
        document.fonts.load('500 32px "Shippori Mincho"'),
        document.fonts.load('400 20px "Space Grotesk"'),
        document.fonts.load('400 20px "Zen Kaku Gothic New"'),
        document.fonts.load('400 20px "DotGothic16"'),
      ]),
      new Promise((resolve) => setTimeout(resolve, 2200)),
    ]);
  } catch (e) {
    // fonts are an enhancement, not a requirement
  }
}

async function boot() {
  updateClock();
  window.setInterval(updateClock, 60000);
  const statuses = [
    [8, 'ESTABLISHING NEON LINK'],
    [22, 'OPENING THE STREET / 開通'],
    [38, 'LIGHTING LANTERNS / 点灯'],
    [54, 'WAKING THE CROWD / 人々'],
    [70, 'WARMING THE BROTH / 出汁'],
    [84, 'TUNING THE KOTO / 琴'],
  ];
  let pct = 0;
  const tick = window.setInterval(() => {
    if (pct >= 88) return;
    pct += Math.random() * 5 + 1;
    const status = statuses.filter((s) => s[0] <= pct).pop();
    setLoader(Math.min(pct, 88), status?.[1]);
  }, 420);
  setLoader(4, 'ESTABLISHING NEON LINK');

  try {
    await waitForFonts();
    setLoader(12, 'ASSEMBLING SECTOR 09 / 建設');
    const savedFx = localStorage.getItem(FX_KEY);
    highFx = savedFx ? savedFx === 'high' : !isCoarse;
    els.fxLabel.textContent = highFx ? 'FX+' : 'FX−';
    document.body.classList.toggle('low-fx', !highFx);

    world = await createWorld({
      container: $('#scene-layer'),
      quality: highFx ? 'high' : 'low',
    });
    setLoader(92, 'LIGHTING THE LAST LANTERN');
    world.onCarPass((dir) => audio.whoosh(dir));
    world.setFx(highFx);

    // restore stamps
    stamps.forEach((id) => world.setStallVisited(id, true));
    if (hasAllStamps()) {
      world.setFinaleUnlocked(true, false);
    }
    updateStampUI();
    updateArea();

    const canv = world.renderer.domElement;
    canv.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      toast('THE SIGNAL FLICKERED. PLEASE REFRESH THE STREET.');
    });

    bindCanvas();
    bindHud();
    buildNearPrompt();

    const clock = new THREE.Clock();
    world.renderer.setAnimationLoop(() => {
      const dt = Math.min(0.05, clock.getDelta());
      const now = performance.now();
      if (travel.active) {
        updateTravel(now);
      } else if (!modalOpen) {
        updateMovement(dt);
      } else {
        rig.pos.y = 1.65 + Math.sin(now * 0.0012) * 0.003;
      }
      applyCamera();
      world.update(dt, now * 0.001, { rig });
      world.render();
      updateHudThrottled(now);
    });

    window.clearInterval(tick);
    setLoader(100, 'DOORS OPEN / 開店');
    window.setTimeout(() => {
      els.loader.classList.add('is-done');
      els.intro.classList.add('is-ready');
    }, 330);
  } catch (err) {
    console.error('[NEON MATSURI] boot failed', err);
    window.clearInterval(tick);
    setLoader(100, 'THE STREET DID NOT OPEN');
    els.loaderStatus.textContent = 'WEBGL COULD NOT START — TRY A DIFFERENT BROWSER OR DISABLE EXTENSIONS.';
    els.loaderBar.style.background = '#ff2f92';
  }
}

function enterFestival() {
  if (entered) return;
  entered = true;
  audio.start();
  audio.click();
  els.enterBtn.disabled = true;
  els.intro.classList.add('is-leaving');
  els.hud.classList.remove('is-hidden');
  updateArea();
  window.setTimeout(() => {
    els.intro.style.display = 'none';
  }, 1250);
  const startPos = new THREE.Vector3(0, 1.65, 12.5);
  const target = new THREE.Vector3(0, 1.9, -30);
  const yaw = Math.atan2(-(target.x - startPos.x), -(target.z - startPos.z));
  const pitch = Math.atan2(target.y - startPos.y, Math.hypot(target.x - startPos.x, target.z - startPos.z));
  startTravel({
    position: startPos,
    yaw,
    pitch,
    duration: 1.9,
    onDone: () => {
      controlsEnabled = true;
      toast('DRAG TO LOOK · SCROLL OR WASD TO WALK · CLICK THE FLOATING DIAMONDS.', 6500);
    },
  });
  try {
    audio.resume();
  } catch (e) { /* ignore */ }
}

/* ============================================================
   wiring
   ============================================================ */

els.enterBtn.addEventListener('click', enterFestival);
els.introCreditsBtn.addEventListener('click', openCredits);
els.soundBtn.setAttribute('aria-pressed', 'true');
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);
window.addEventListener('blur', () => {
  keys.clear();
  dragging = false;
});
window.addEventListener('resize', () => {
  clearHover();
});

// mobile joystick
if (els.joy) {
  let joyActive = false;
  let joyId = null;
  const setJoy = (e) => {
    const rect = els.joy.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = rect.width * 0.34;
    const mag = Math.hypot(dx, dy);
    if (mag > max) {
      dx = (dx / mag) * max;
      dy = (dy / mag) * max;
    }
    els.joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    move.x = dx / max;
    move.y = dy / max;
  };
  els.joy.addEventListener('pointerdown', (e) => {
    if (!entered || modalOpen) return;
    joyActive = true;
    joyId = e.pointerId;
    els.joy.setPointerCapture(e.pointerId);
    setStroll(false);
    setJoy(e);
    e.preventDefault();
  });
  els.joy.addEventListener('pointermove', (e) => {
    if (!joyActive) return;
    setJoy(e);
  });
  const endJoy = () => {
    joyActive = false;
    move.x = 0;
    move.y = 0;
    els.joyKnob.style.transform = 'translate(0,0)';
  };
  els.joy.addEventListener('pointerup', endJoy);
  els.joy.addEventListener('pointercancel', endJoy);
}

// public debug handle, helpful during development
window.NEON_MATSURI = {
  get world() { return world; },
  state,
  stamps,
  openStall,
  travelTo,
  openMap,
  openPassport,
  complete,
  reset() {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  },
};

boot();
