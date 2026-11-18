import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { STALLS } from './data.js';

/* ============================================================
   small utilities
   ============================================================ */

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

const JP_FONT = '"Zen Kaku Gothic New", "Hiragino Sans", sans-serif';
const JP_SERIF = '"Shippori Mincho", serif';
const DISPLAY_FONT = '"Bebas Neue", Impact, sans-serif';

const NEON = ['#ff2f92', '#63f7ff', '#ffb96e', '#9a7bff', '#c7ff63', '#ff5a5f'];
const WARM = ['#ffcf8a', '#ffb15e', '#ff8b6a', '#ffe7b0'];

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

function toTexture(canvas, renderer, { srgb = true } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.needsUpdate = true;
  return tex;
}

function drawTracked(ctx, text, x, y, spacing) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, cx + widths[i] / 2, y);
    cx += widths[i] + spacing;
  });
}

function neonTexture(renderer, {
  text,
  sub,
  color = '#63f7ff',
  font = `700 120px ${DISPLAY_FONT}`,
  subFont = `400 26px ${JP_FONT}`,
  width = 1024,
  height = 256,
  letterSpacing = 4,
  vertical = false,
  align = 'center',
} = {}) {
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 34;

  if (vertical) {
    const chars = [...text];
    const step = height / (chars.length + 0.6);
    ctx.font = font;
    chars.forEach((c, i) => {
      ctx.fillText(c, width / 2, step * (i + 0.8));
      ctx.fillText(c, width / 2, step * (i + 0.8));
    });
    if (sub) {
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 0.8;
      ctx.font = subFont;
      ctx.fillStyle = '#f5eee2';
      ctx.save();
      ctx.translate(width * 0.16, height * 0.5);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(sub, 0, 0);
      ctx.restore();
    }
  } else {
    ctx.font = font;
    if (letterSpacing) {
      drawTracked(ctx, text, width / 2, sub ? height * 0.43 : height * 0.5, letterSpacing);
    } else {
      ctx.fillText(text, width / 2, sub ? height * 0.43 : height * 0.5);
    }
    if (sub) {
      ctx.font = subFont;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = 0.85;
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0, 'rgba(245,238,226,0)');
      grad.addColorStop(0.5, '#f5eee2');
      grad.addColorStop(1, 'rgba(245,238,226,0)');
      ctx.fillStyle = grad;
      ctx.fillText(sub, width / 2, height * 0.78);
    }
  }
  return toTexture(canvas, renderer);
}

function panelSignTexture(renderer, {
  title,
  jp,
  color = '#ff2f92',
  width = 1024,
  height = 220,
} = {}) {
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(6,3,13,0.92)';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.7;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${height * 0.48}px ${DISPLAY_FONT}`;
  ctx.fillStyle = '#f5eee2';
  ctx.fillText(title, width / 2, jp ? height * 0.44 : height * 0.52);
  if (jp) {
    ctx.font = `500 ${height * 0.2}px ${JP_SERIF}`;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillText(jp, width / 2, height * 0.78);
  }
  return toTexture(canvas, renderer);
}

function norenTexture(renderer, glyph, color) {
  const canvas = makeCanvas(256, 512);
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, color);
  grad.addColorStop(1, '#1a0c1e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);
  ctx.fillStyle = 'rgba(6,3,13,0.55)';
  ctx.fillRect(0, 0, 256, 26);
  ctx.fillStyle = 'rgba(245,238,226,0.9)';
  ctx.font = `600 150px ${JP_SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, 128, 285);
  ctx.globalAlpha = 0.25;
  for (let y = 0; y < 512; y += 7) {
    ctx.fillRect(0, y, 256, 1);
  }
  return toTexture(canvas, renderer);
}

function lanternTexture(renderer, glyph, color) {
  const canvas = makeCanvas(256, 384);
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 384);
  grad.addColorStop(0, '#fff2cb');
  grad.addColorStop(0.5, color);
  grad.addColorStop(1, '#b1402f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = 'rgba(120,40,30,0.35)';
  ctx.lineWidth = 2;
  for (let y = 14; y < 384; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(128, y + 8, 256, y);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(60,16,20,0.85)';
  ctx.font = `600 100px ${JP_SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(glyph, 128, 200);
  return toTexture(canvas, renderer);
}

function windowTexture(renderer, seed, tint = '#63f7ff') {
  const canvas = makeCanvas(512, 1024);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#080710';
  ctx.fillRect(0, 0, 512, 1024);
  const r = mulberry(seed);
  const cols = 8;
  const rows = 20;
  const cellW = 512 / cols;
  const cellH = 1024 / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (r() > 0.54) continue;
      const pad = 7;
      const w = cellW - pad * 2;
      const h = cellH - pad * 2;
      const lit = r();
      ctx.globalAlpha = lit > 0.82 ? 0.95 : 0.32 + lit * 0.4;
      ctx.fillStyle = lit > 0.9 ? '#ffe9b5' : lit > 0.72 ? tint : lit > 0.5 ? '#9a7bff' : '#4b3f68';
      ctx.fillRect(x * cellW + pad, y * cellH + pad, w, h * (lit > 0.7 ? 0.72 : 0.85));
      if (lit > 0.84) {
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x * cellW + pad + 3, y * cellH + pad + 3, w - 6, 2);
      }
    }
  }
  ctx.globalAlpha = 1;
  // vertical neon corner
  ctx.fillStyle = tint;
  ctx.shadowColor = tint;
  ctx.shadowBlur = 26;
  ctx.fillRect(0, 0, 5, 1024);
  return toTexture(canvas, renderer);
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function glowTexture(renderer) {
  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(canvas, renderer, { srgb: false });
}

function smokeTexture(renderer) {
  const canvas = makeCanvas(256, 256);
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
  g.addColorStop(0, 'rgba(220,210,235,0.5)');
  g.addColorStop(0.42, 'rgba(190,180,210,0.2)');
  g.addColorStop(1, 'rgba(190,180,210,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return toTexture(canvas, renderer, { srgb: false });
}

function ringTexture(renderer) {
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = 'rgba(170,235,255,0.9)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(64, 64, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(170,235,255,0.25)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(64, 64, 42, 0, Math.PI * 2);
  ctx.stroke();
  return toTexture(canvas, renderer, { srgb: false });
}

function asphaltTexture(renderer) {
  const size = 1024;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#15151c';
  ctx.fillRect(0, 0, size, size);
  const r = mulberry(7719);
  for (let i = 0; i < 22000; i++) {
    const g = 20 + r() * 50;
    ctx.fillStyle = `rgba(${g},${g},${g + 5},${0.08 + r() * 0.2})`;
    ctx.fillRect(r() * size, r() * size, 1 + r() * 2, 1 + r() * 2);
  }
  // cracks
  ctx.strokeStyle = 'rgba(5,5,9,0.5)';
  for (let i = 0; i < 10; i++) {
    ctx.lineWidth = 1 + r() * 2;
    ctx.beginPath();
    let x = r() * size;
    let y = r() * size;
    ctx.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (r() - 0.5) * 90;
      y += (r() - 0.5) * 90;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // faint lane paint
  ctx.fillStyle = 'rgba(180,190,205,0.05)';
  ctx.fillRect(size * 0.5 - 5, 0, 10, size);
  // puddles cut out so the mirror below shows through
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 26; i++) {
    const x = r() * size;
    const y = r() * size;
    const rx = 30 + r() * 130;
    const ry = 12 + r() * 60;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
    grad.addColorStop(0, 'rgba(0,0,0,0.9)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.72)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / Math.max(rx, ry));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
  const tex = toTexture(canvas, renderer);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 16);
  return tex;
}

function makeGlowSprite(renderer, glowMap, color, scale = 1, opacity = 0.8) {
  const mat = new THREE.SpriteMaterial({
    map: glowMap,
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

/* ============================================================
   main factory
   ============================================================ */

export async function createWorld({ container, quality = 'high' }) {
  const isLow = quality === 'low';
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05030d);
  scene.fog = new THREE.FogExp2(0x090615, isLow ? 0.028 : 0.0215);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.08, 240);
  camera.position.set(0, 1.65, 14.5);
  camera.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({ antialias: !isLow, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLow ? 1.15 : 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.domElement.setAttribute('aria-label', 'A walkable neon Japanese festival street');
  container.appendChild(renderer.domElement);

  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const GLOW = glowTexture(renderer);
  const SMOKE = smokeTexture(renderer);
  const RIPPLE = ringTexture(renderer);

  // ---- textures for photo props ----
  const loader = new THREE.TextureLoader();
  const load = (url) =>
    new Promise((resolve) => {
      loader.load(
        url,
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          t.anisotropy = maxAniso;
          resolve(t);
        },
        undefined,
        () => resolve(null),
      );
    });

  const photoUrls = {
    ramen: '/tex/ramen.webp',
    puffer: '/tex/puffer-woman.webp',
    pufferFabric: '/tex/puffer-fabric.webp',
    wish: '/tex/wish.webp',
    lanterns: '/tex/lanterns.webp',
    shrine: '/tex/shrine-lanterns.webp',
    goldfish: '/tex/goldfish.webp',
    goldfishTank: '/tex/goldfish-tank.webp',
    omikuji: '/tex/omikuji.webp',
    ema: '/tex/ema.webp',
    yatai: '/tex/yatai.webp',
    neonShop: '/tex/neon-shop.webp',
    arcade: '/tex/arcade.webp',
    taiyaki: '/tex/taiyaki.webp',
    yakitori: '/tex/yakitori.webp',
    gachapon: '/tex/gachapon.webp',
    crowd: '/tex/crowd.webp',
    festival: '/tex/festival-stall.webp',
    yukata: '/tex/yukata.webp',
    street: '/tex/street.webp',
    cranes: '/tex/cranes.webp',
    lanternHand: '/tex/lantern-hand.webp',
  };
  const entries = await Promise.all(Object.entries(photoUrls).map(async ([k, url]) => [k, await load(url)]));
  const photos = Object.fromEntries(entries);

  const world = new THREE.Group();
  scene.add(world);

  const shared = {
    dark: new THREE.MeshStandardMaterial({ color: 0x0c0914, roughness: 0.82, metalness: 0.18 }),
    darker: new THREE.MeshStandardMaterial({ color: 0x06040b, roughness: 0.9, metalness: 0.1 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x1a1822, roughness: 0.36, metalness: 0.8 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x2a2733, roughness: 0.5, metalness: 0.65 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x241318, roughness: 0.78, metalness: 0.08 }),
    counter: new THREE.MeshStandardMaterial({ color: 0x241a22, roughness: 0.56, metalness: 0.25 }),
    black: new THREE.MeshStandardMaterial({ color: 0x030208, roughness: 0.6, metalness: 0.4 }),
    paper: new THREE.MeshStandardMaterial({ color: 0xf0e2c8, roughness: 0.9, emissive: 0x3a250f, emissiveIntensity: 0.25 }),
  };

  const neonMaterial = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: opacity < 1, opacity });
  const additiveMaterial = (color, opacity = 1) =>
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

  const interactiveHitboxes = [];
  const stallRefs = new Map();
  const flickerMaterials = [];
  const swayingLanterns = [];
  const walkingPeople = [];
  const steamEmitters = [];
  const wishLanterns = [];

  const photoMaterial = (tex, { color = 0xffffff, emissive = 1.1 } = {}) => {
    if (!tex) return new THREE.MeshBasicMaterial({ color: 0x1a1420 });
    const mat = new THREE.MeshBasicMaterial({ map: tex, color });
    mat.toneMapped = true;
    // honor a soft luminance boost without blowing out already bright photos
    if (emissive !== 1) mat.color.multiplyScalar(Math.min(1.35, emissive));
    return mat;
  };

  const frame = (group, w, h, d, material, x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };

  /* ============================================================
     sky + distance
     ============================================================ */

  function buildSky() {
    const sky = new THREE.Group();

    // stars
    const starGeo = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < 480; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * 0.72;
      const r = 100;
      positions.push(Math.cos(theta) * Math.cos(phi) * r, 18 + Math.sin(phi) * 80, Math.sin(theta) * Math.cos(phi) * r - 30);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xcdd9ff, size: 0.55, transparent: true, opacity: 0.75, sizeAttenuation: true, depthWrite: false }),
    );
    sky.add(stars);

    // huge ringed moon
    const moon = new THREE.Mesh(
      new THREE.CircleGeometry(9, 64),
      new THREE.MeshBasicMaterial({ color: 0xffe6f4, transparent: true, opacity: 0.85, toneMapped: false, fog: false }),
    );
    moon.position.set(31, 30, -128);
    sky.add(moon);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: GLOW, color: 0xff9ecf, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
    );
    halo.scale.set(46, 46, 1);
    halo.position.copy(moon.position);
    sky.add(halo);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(12.2, 12.7, 80),
      new THREE.MeshBasicMaterial({ color: 0x63f7ff, transparent: true, opacity: 0.35, side: THREE.DoubleSide, toneMapped: false, fog: false }),
    );
    ring.position.copy(moon.position);
    ring.rotation.z = -0.22;
    sky.add(ring);

    // distant city silhouettes
    const city = new THREE.Group();
    const cityMat = new THREE.MeshBasicMaterial({ color: 0x080512, fog: true });
    for (let i = 0; i < 54; i++) {
      const w = rand(4, 14);
      const h = rand(10, 54);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, rand(5, 16)), cityMat);
      b.position.set(rand(-70, 70), h / 2 - 3, rand(-155, -120));
      city.add(b);
      if (Math.random() > 0.55) {
        const strip = new THREE.Mesh(
          new THREE.PlaneGeometry(0.25, h * rand(0.2, 0.6)),
          additiveMaterial(pick(NEON), rand(0.08, 0.28)),
        );
        strip.position.set(b.position.x + rand(-w / 2, w / 2), h * rand(0.45, 0.75), b.position.z + 8.1);
        city.add(strip);
      }
    }
    sky.add(city);

    // hologram glyphs in the sky
    const glyphTex = neonTexture(renderer, {
      text: '鯉',
      color: '#63f7ff',
      font: `600 260px ${JP_SERIF}`,
      width: 512,
      height: 512,
      letterSpacing: 0,
    });
    const glyphMat = new THREE.MeshBasicMaterial({
      map: glyphTex,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      fog: false,
    });
    const glyph = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), glyphMat);
    glyph.position.set(-12, 21, -92);
    glyph.rotation.y = 0.2;
    sky.add(glyph);
    sky.userData.glyph = glyph;

    const ringGlyph = new THREE.Mesh(new THREE.PlaneGeometry(17, 17), glyphMat.clone());
    ringGlyph.material.opacity = 0.1;
    ringGlyph.position.set(18, 24, -110);
    ringGlyph.rotation.y = -0.25;
    sky.add(ringGlyph);

    // a slow blimp / drone light far away
    const blimp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 8), new THREE.MeshBasicMaterial({ color: 0x1a1226 }));
    body.scale.set(1.8, 0.55, 0.55);
    blimp.add(body);
    const under = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.3), neonMaterial('#ff2f92'));
    under.position.y = -0.6;
    blimp.add(under);
    const blimpLight = makeGlowSprite(renderer, GLOW, 0xff2f92, 2, 0.55);
    blimpLight.position.y = -0.7;
    blimp.add(blimpLight);
    blimp.position.set(-18, 28, -110);
    sky.add(blimp);
    sky.userData.blimp = blimp;

    world.add(sky);
    return sky;
  }

  const sky = buildSky();

  /* ============================================================
     lighting
     ============================================================ */

  scene.add(new THREE.AmbientLight(0x65527d, 0.55));
  const hemi = new THREE.HemisphereLight(0x452d63, 0x160a11, 0.8);
  scene.add(hemi);
  const moonLight = new THREE.DirectionalLight(0xb8c6ff, 0.5);
  moonLight.position.set(20, 30, 10);
  scene.add(moonLight);

  const streetLights = [
    { x: 0, z: 4, color: 0xff3f9d, intensity: 40 },
    { x: 0, z: -37, color: 0x63f7ff, intensity: 38 },
    { x: 0, z: -72, color: 0xffb96e, intensity: 36 },
    { x: 0, z: -99, color: 0x9a7bff, intensity: 45 },
  ];
  streetLights.forEach((l) => {
    const light = new THREE.PointLight(l.color, l.intensity, 20, 2);
    light.position.set(l.x, 4.2, l.z);
    scene.add(light);
  });

  /* ============================================================
     ground
     ============================================================ */

  function buildGround() {
    const group = new THREE.Group();
    const length = 170;
    const width = 28;
    const centerZ = -60;

    if (!isLow) {
      const mirror = new Reflector(new THREE.PlaneGeometry(width, length), {
        clipBias: 0.003,
        textureWidth: 768,
        textureHeight: 768,
        color: 0x6e7488,
        multisample: 0,
      });
      mirror.rotation.x = -Math.PI / 2;
      mirror.position.set(0, 0, centerZ);
      group.add(mirror);
      group.userData.mirror = mirror;
    }

    const asphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(width, length),
      new THREE.MeshStandardMaterial({
        map: asphaltTexture(renderer),
        color: 0xadb0bf,
        roughness: 0.34,
        metalness: 0.4,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
      }),
    );
    asphalt.rotation.x = -Math.PI / 2;
    asphalt.position.set(0, 0.012, centerZ);
    group.add(asphalt);

    // glowing guide line down the middle, seen on many future streets
    const guideMat = additiveMaterial(0x63f7ff, 0.2);
    for (let z = 10; z > -116; z -= 6) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 2.4), guideMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(0, 0.03, z);
      group.add(dash);
    }

    // curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x15131c, roughness: 0.6, metalness: 0.3 });
    [-6.4, 6.4].forEach((x) => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, length), curbMat);
      curb.position.set(x, 0.08, centerZ);
      group.add(curb);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.012, length), neonMaterial(x < 0 ? 0xff2f92 : 0x63f7ff, 0.55));
      strip.position.set(x + (x < 0 ? 0.17 : -0.17), 0.165, centerZ);
      group.add(strip);
    });

    // manhole covers
    for (let i = 0; i < 7; i++) {
      const z = 6 - i * 17;
      const cover = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.02, 24), shared.metal);
      cover.position.set(rand(-2.4, 2.4), 0.026, z);
      group.add(cover);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.43, 24), additiveMaterial(pick(NEON), 0.4));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(cover.position.x, 0.035, z);
      group.add(ring);
    }

    // scattered puddle glow pools for extra neon
    for (let i = 0; i < 10; i++) {
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(rand(1.4, 4), rand(0.7, 2.2)),
        new THREE.MeshBasicMaterial({
          map: GLOW,
          color: pick(['#ff2f92', '#63f7ff', '#ffb96e']),
          transparent: true,
          opacity: rand(0.04, 0.11),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          toneMapped: false,
        }),
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(rand(-5.4, 5.4), 0.04, rand(8, -112));
      group.add(glow);
    }

    world.add(group);
    return group;
  }

  const ground = buildGround();

  /* ============================================================
     buildings, shops & signs
     ============================================================ */

  const shopWindows = [
    { side: 1, z: 8.5, w: 5.6, h: 3.5, tex: photos.yatai, title: 'IZAKAYA 灯', color: '#ffb96e', y: 3.3 },
    { side: -1, z: 11.5, w: 4.6, h: 3.5, tex: photos.neonShop, title: 'KARAOKE 24H', color: '#ff2f92', y: 3.2 },
    { side: 1, z: -6, w: 4.8, h: 3.5, tex: photos.arcade, title: 'GAME CENTER', color: '#9a7bff', y: 3.2 },
    { side: -1, z: -24, w: 4.4, h: 3.4, tex: photos.yakitori, title: 'YAKITORI 焼鳥', color: '#ff7a3d', y: 3.1 },
    { side: -1, z: -45, w: 4.8, h: 3.6, tex: photos.yukata, title: 'VINTAGE 古着', color: '#c7ff63', y: 3.2 },
    { side: 1, z: -55, w: 4.4, h: 3.4, tex: photos.gachapon, title: 'GACHAPON', color: '#63f7ff', y: 3.15 },
    { side: -1, z: -72, w: 4.8, h: 3.3, tex: photos.festival, title: 'ODEN おでん', color: '#ffcf7a', y: 3.2 },
    { side: 1, z: -82, w: 4.6, h: 3.5, tex: photos.taiyaki, title: 'TAIYAKI 鯛焼', color: '#ffb96e', y: 3.2 },
    { side: -1, z: -98, w: 4.6, h: 3.4, tex: photos.shrine, title: 'TEA 喫茶', color: '#63f7ff', y: 3.2 },
    { side: 1, z: -101, w: 4.2, h: 3.2, tex: photos.lanternHand, title: 'LANTERN 灯', color: '#ff2f92', y: 3.1 },
  ];

  function buildBuildings() {
    const group = new THREE.Group();
    const wallX = 7.4;
    const windowTints = ['#63f7ff', '#ff2f92', '#ffb96e', '#9a7bff'];
    const winTexA = windowTexture(renderer, 112, '#63f7ff');
    const winTexB = windowTexture(renderer, 229, '#ff7ac0');
    const winTexC = windowTexture(renderer, 471, '#ffcf7a');

    // continuous blocks
    for (const side of [-1, 1]) {
      let z = 22;
      let i = 0;
      while (z > -124) {
        const width = rand(8.4, 13.5);
        const depth = rand(4.6, 9);
        const height = rand(11, 30);
        const y = height / 2;
        const bz = z - width / 2;
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(depth, height, width),
          new THREE.MeshStandardMaterial({
            color: i % 3 === 0 ? 0x0a0812 : 0x0c0914,
            roughness: 0.88,
            metalness: 0.22,
          }),
        );
        body.position.set(side * (wallX + depth / 2), y, bz);
        group.add(body);

        const winTex = [winTexA, winTexB, winTexC][i % 3].clone();
        winTex.needsUpdate = true;
        winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
        winTex.repeat.set(Math.max(1, width / 7), Math.max(1, height / 12));
        winTex.offset.set(rand(0, 1), rand(0, 1));
        const face = new THREE.Mesh(
          new THREE.PlaneGeometry(width - 0.1, height - 0.12),
          new THREE.MeshBasicMaterial({ map: winTex, color: 0xcfc7d9 }),
        );
        face.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
        face.position.set(side * (wallX - 0.01), y, bz);
        group.add(face);

        // roof lip / neon edge
        if (i % 2 === 0) {
          const stripColor = pick(NEON);
          const lip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, width * 0.4), neonMaterial(stripColor, 0.7));
          lip.position.set(side * (wallX - 0.12), rand(6, height - 1), bz + rand(-width * 0.2, width * 0.2));
          group.add(lip);
          flickerMaterials.push({ mat: lip.material, phase: rand(0, 10), speed: rand(1.4, 5) });
        }

        // rooftop antennas / tanks
        if (i % 3 === 0) {
          const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, rand(2, 5), 5), shared.steel);
          mast.position.set(side * (wallX + depth / 2 + rand(-1, 1)), height + 2, bz + rand(-width / 3, width / 3));
          group.add(mast);
          const tip = makeGlowSprite(renderer, GLOW, 0xff3f9a, 0.9, 0.6);
          tip.position.copy(mast.position).setY(height + 4);
          group.add(tip);
        }

        // pipes and AC units
        if (i % 4 === 1) {
          const ac = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.9), shared.steel);
          ac.position.set(side * (wallX - 0.35), rand(4, height - 3), bz + rand(-width * 0.3, width * 0.3));
          group.add(ac);
        }

        z -= width + rand(0.15, 0.6);
        i++;
      }
    }

    // storefronts
    shopWindows.forEach((shop, idx) => {
      const side = shop.side;
      const x = side * (wallX - 0.06);
      const frontX = side * (wallX - 0.28);
      const s = new THREE.Group();
      const w = shop.w;
      const h = shop.h;
      const interior = new THREE.Mesh(new THREE.PlaneGeometry(w, h), photoMaterial(shop.tex, { color: 0xd7c7c0, emissive: 1.15 }));
      interior.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      interior.position.set(frontX, 0.2 + h / 2, shop.z);
      s.add(interior);

      // frame
      const frameMat = shared.dark;
      const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.26, h + 0.22, 0.12), frameMat);
      jambL.position.set(side * (wallX - 0.2), 0.2 + h / 2, shop.z - w / 2 - 0.06);
      s.add(jambL);
      const jambR = jambL.clone();
      jambR.position.z = shop.z + w / 2 + 0.06;
      s.add(jambR);
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, w + 0.24), frameMat);
      lintel.position.set(side * (wallX - 0.2), 0.2 + h + 0.06, shop.z);
      s.add(lintel);
      const sill = lintel.clone();
      sill.position.y = 0.14;
      s.add(sill);

      // awning
      const awning = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.14, w + 0.5), shared.dark);
      awning.position.set(side * (wallX - 0.85), 3.92, shop.z);
      s.add(awning);
      const awningLip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, w + 0.5), neonMaterial(shop.color, 0.85));
      awningLip.position.set(side * (wallX - 1.58), 3.86, shop.z);
      s.add(awningLip);
      flickerMaterials.push({ mat: awningLip.material, phase: idx * 1.3, speed: 2.7 });

      // shop sign
      const signTex = panelSignTexture(renderer, {
        title: shop.title.split(' ')[0],
        jp: shop.title.split(' ').slice(1).join(' '),
        color: shop.color,
        width: 1024,
        height: 256,
      });
      const signW = Math.min(4.4, w * 0.86);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(signW, 0.66), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, toneMapped: false }));
      sign.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
      sign.position.set(side * (wallX - 0.45), 4.55, shop.z);
      s.add(sign);
      const signFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.82, signW + 0.1), shared.dark);
      signFrame.position.set(side * (wallX - 0.36), 4.55, shop.z);
      s.add(signFrame);

      // noren strips
      const noren = [];
      for (let n = 0; n < 3; n++) {
        const strip = new THREE.Mesh(
          new THREE.PlaneGeometry((w - 0.6) / 3.2, 0.68),
          new THREE.MeshStandardMaterial({ color: new THREE.Color(shop.color).multiplyScalar(0.6), roughness: 0.9, side: THREE.DoubleSide }),
        );
        strip.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
        strip.position.set(side * (wallX - 1.05), 3.27, shop.z - (w - 1.2) / 2 + n * ((w - 1.2) / 2.6));
        s.add(strip);
        noren.push(strip);
      }
      group.add(s);

      // lanterns at shop door
      for (let n = 0; n < 2; n++) {
        const pivot = new THREE.Group();
        pivot.position.set(side * (wallX - 1.02), 3.28, shop.z + (n === 0 ? -w / 2 + 0.35 : w / 2 - 0.35));
        const l = makeLantern(0.26, 0.44, pick(WARM), Math.random() > 0.5 ? '祭' : '灯');
        l.position.y = -0.3;
        pivot.add(l);
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 4), shared.black);
        cord.position.y = -0.09;
        pivot.add(cord);
        group.add(pivot);
        swayingLanterns.push({ pivot, phase: rand(0, 7), amp: rand(0.02, 0.06) });
      }

      // crates / stools outside
      if (idx % 2 === 0) {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.7), shared.wood);
        crate.position.set(side * 6.25, 0.25, shop.z + w / 2 + 0.7);
        group.add(crate);
        const crateGlow = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.6), additiveMaterial(shop.color, 0.2));
        crateGlow.position.set(side * 6.25, 0.51, shop.z + w / 2 + 0.7);
        group.add(crateGlow);
      }
    });

    // vending machines
    const vendingDefs = [
      { side: -1, z: -14.5, color: '#63f7ff' },
      { side: 1, z: -38.5, color: '#ff2f92' },
      { side: -1, z: -75.5, color: '#ffb96e' },
      { side: 1, z: -94, color: '#9a7bff' },
    ];
    vendingDefs.forEach((v) => group.add(makeVendingMachine(v.side, v.z, v.color)));

    // large photo billboards high on walls
    const billboards = [
      { side: -1, z: -8, y: 9.8, w: 6, h: 3.4, tex: photos.neonShop, title: 'NEON', color: '#ff2f92' },
      { side: 1, z: -35, y: 11.2, w: 5.2, h: 3, tex: photos.arcade, title: 'PLAY', color: '#63f7ff' },
      { side: -1, z: -57, y: 10.2, w: 5.6, h: 3.2, tex: photos.festival, title: 'MATSURI', color: '#ffb96e' },
      { side: 1, z: -94, y: 10.6, w: 5.4, h: 3.1, tex: photos.cranes, title: 'WISH', color: '#ff7ac0' },
    ];
    billboards.forEach((b) => {
      const board = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h), photoMaterial(b.tex, { color: 0xe4ccd8, emissive: 1.2 }));
      board.rotation.y = b.side === 1 ? -Math.PI / 2 : Math.PI / 2;
      board.position.set(b.side * (wallX - 0.13), b.y, b.z);
      group.add(board);
      const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(0.24, b.h + 0.25, b.w + 0.25), shared.black);
      boardFrame.position.set(b.side * (wallX - 0.2), b.y, b.z);
      group.add(boardFrame);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, b.w + 0.3), neonMaterial(b.color, 0.8));
      strip.position.set(b.side * (wallX - 0.36), b.y - b.h / 2 - 0.15, b.z);
      group.add(strip);
      flickerMaterials.push({ mat: strip.material, phase: rand(0, 9), speed: 3 });
    });

    // tall vertical neon signs
    const verticals = [
      { text: '電脳', sub: 'CYBER', side: -1, z: 1.5, y: 7.6, color: '#63f7ff' },
      { text: 'カラオケ', sub: 'KARAOKE', side: 1, z: -12, y: 8.8, color: '#ff2f92' },
      { text: '居酒屋', sub: 'IZAKAYA', side: -1, z: -30, y: 8.3, color: '#ffb96e' },
      { text: '古着', sub: 'VINTAGE', side: 1, z: -43, y: 9.1, color: '#c7ff63' },
      { text: '喫茶', sub: 'KISSA', side: -1, z: -66, y: 8.8, color: '#ffcf7a' },
      { text: '夜行', sub: 'NIGHT', side: 1, z: -78, y: 9.4, color: '#ff2f92' },
      { text: '東京', sub: 'TOKYO', side: -1, z: -91, y: 7.9, color: '#63f7ff' },
    ];
    verticals.forEach((v, idx) => {
      const tex = neonTexture(renderer, {
        text: v.text,
        sub: v.sub,
        color: v.color,
        font: `600 120px ${JP_SERIF}`,
        subFont: `400 22px ${JP_FONT}`,
        width: 256,
        height: 1024,
        vertical: true,
      });
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(1.1, 4.4),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
      );
      sign.rotation.y = v.side === 1 ? -Math.PI / 2 : Math.PI / 2;
      sign.position.set(v.side * (wallX - 0.46), v.y, v.z);
      group.add(sign);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.65, 0.95), shared.black);
      back.position.set(v.side * (wallX - 0.31), v.y, v.z);
      group.add(back);
      flickerMaterials.push({ mat: sign.material, phase: idx * 1.7, speed: rand(2.2, 4.6) });
    });

    function frameBox(side, w, h, d, z, y, mat, kind = 'side') {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), mat);
      mesh.position.set(side * (wallX - 0.2), y, z);
      group.add(mesh);
      return mesh;
    }

    world.add(group);
    return group;
  }
  function makeLantern(r = 0.3, h = 0.5, color = '#ffb15e', glyph = '祭') {
    const tex = lanternTexture(renderer, glyph, color);
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: true });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r, h, 18, 1, false), mat);
    const capMat = shared.black;
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.035, 12), capMat);
    top.position.y = h / 2 + 0.018;
    lantern.add(top);
    const bottom = top.clone();
    bottom.position.y = -h / 2 - 0.018;
    lantern.add(bottom);
    const glow = makeGlowSprite(renderer, GLOW, color, r * 5.4, 0.36);
    lantern.add(glow);
    return lantern;
  }

  function makeVendingMachine(side, z, color) {
    const group = new THREE.Group();
    const canvas = makeCanvas(256, 512);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(10, 10, 236, 46);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f5eee2';
    ctx.font = `400 30px ${DISPLAY_FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('DRINKS 24H', 128, 42);
    const r = mulberry(Math.floor(z * 100 + side * 23));
    const cols = 4;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 22 + col * 55;
        const y = 80 + row * 74;
        ctx.fillStyle = `hsl(${Math.floor(r() * 360)}, 70%, ${50 + r() * 20}%)`;
        ctx.fillRect(x, y, 42, 56);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 4, y + 4, 8, 48);
        ctx.fillStyle = 'rgba(6,3,13,0.8)';
        ctx.fillRect(x + 4, y + 44, 34, 7);
      }
    }
    ctx.fillStyle = 'rgba(245,238,226,0.8)';
    ctx.fillRect(22, 394, 212, 20);
    ctx.fillStyle = '#0b0716';
    ctx.font = `400 11px ${JP_FONT}`;
    ctx.fillText('つめた〜い　/　COLD', 128, 408);
    const tex = toTexture(canvas, renderer);

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.95, 0.72), shared.dark);
    body.position.y = 0.98;
    group.add(body);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.8), new THREE.MeshBasicMaterial({ map: tex, toneMapped: true }));
    face.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    face.position.set(side === 1 ? -0.487 : 0.487, 1.0, 0);
    group.add(face);
    const glow = makeGlowSprite(renderer, GLOW, color, 2.2, 0.22);
    glow.position.set(side === 1 ? -0.7 : 0.7, 1.1, 0);
    group.add(glow);
    group.position.set(side * 6.38, 0, z);
    return group;
  }

  const buildings = buildBuildings();

  /* ============================================================
     torii gates
     ============================================================ */

  function buildTorii(z, scale = 1, color = '#ff2f92', sideColor = '#63f7ff', plaque = '電光祭') {
    const group = new THREE.Group();
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x1c0a15, roughness: 0.7, metalness: 0.35 });
    const px = 4.9 * scale;
    const topY = 7.2 * scale;
    const pillarGeo = new THREE.CylinderGeometry(0.22 * scale, 0.3 * scale, topY, 8);
    [-1, 1].forEach((s) => {
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(s * px, topY / 2, 0);
      group.add(p);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, topY * 0.86, 0.05), neonMaterial(color, 0.9));
      strip.position.set(s * (px - 0.24 * scale), topY * 0.48, 0.18 * scale);
      group.add(strip);
      // base
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * scale, 0.45 * scale, 0.45 * scale, 8), shared.black);
      base.position.set(s * px, 0.22 * scale, 0);
      group.add(base);
    });
    const topBeam = new THREE.Mesh(new THREE.BoxGeometry(px * 2 + 1.4 * scale, 0.28 * scale, 0.46 * scale), pillarMat);
    topBeam.position.y = topY;
    group.add(topBeam);
    const topNeon = new THREE.Mesh(new THREE.BoxGeometry(px * 2 + 1.5 * scale, 0.04 * scale, 0.05 * scale), neonMaterial(color, 0.95));
    topNeon.position.set(0, topY + 0.17 * scale, 0.25 * scale);
    group.add(topNeon);
    const secondBeam = new THREE.Mesh(new THREE.BoxGeometry(px * 2 - 0.4 * scale, 0.2 * scale, 0.34 * scale), pillarMat);
    secondBeam.position.y = topY - 0.95 * scale;
    group.add(secondBeam);
    const secondNeon = new THREE.Mesh(new THREE.BoxGeometry(px * 2 - 0.3 * scale, 0.025 * scale, 0.04 * scale), neonMaterial(sideColor, 0.7));
    secondNeon.position.set(0, topY - 0.82 * scale, 0.2 * scale);
    group.add(secondNeon);

    // plaque
    const plaqueTex = neonTexture(renderer, {
      text: plaque,
      color,
      font: `600 150px ${JP_SERIF}`,
      width: 512,
      height: 256,
      letterSpacing: 8,
    });
    const plaqueMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8 * scale, 1.15 * scale),
      new THREE.MeshBasicMaterial({ map: plaqueTex, transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    plaqueMesh.position.set(0, topY - 1.7 * scale, 0.26 * scale);
    group.add(plaqueMesh);

    // hanging lanterns
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      const l = makeLantern(0.22 * scale, 0.4 * scale, i % 2 === 0 ? '#ffcf8a' : '#ff8b6a', i % 2 === 0 ? '祭' : '光');
      l.position.set(i * 1.9 * scale, topY - 2.9 * scale, 0.2 * scale);
      group.add(l);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.4 * scale, 4), shared.black);
      cord.position.set(i * 1.9 * scale, topY - 2.1 * scale, 0.2 * scale);
      group.add(cord);
    }

    group.position.z = z;
    world.add(group);
    return group;
  }

  const entranceTorii = buildTorii(10.2, 1.02, '#ff2f92', '#63f7ff');
  const exitTorii = buildTorii(-103.4, 0.9, '#ffcf7a', '#ff2f92', '残光');

  /* ============================================================
     lantern strings & cables
     ============================================================ */

  function buildLanternStrings() {
    const group = new THREE.Group();
    const lanternZs = [2, -10, -24, -38, -52, -66, -80, -94];
    const meshCache = new Map();
    const glyphs = ['祭', '光', '願', '夢'];
    lanternZs.forEach((z, sIdx) => {
      const y = 5.4 + (sIdx % 2) * 0.55;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-7.2, y + 0.4, z),
        new THREE.Vector3(0, y - 0.35, z + 0.15),
        new THREE.Vector3(7.2, y + 0.4, z),
      );
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.014, 4, false), shared.black);
      group.add(tube);
      const count = 7;
      for (let i = 1; i < count; i++) {
        const t = i / count;
        const pos = curve.getPoint(t);
        const glyph = glyphs[(i + sIdx) % glyphs.length];
        const color = pick(WARM);
        const key = `${glyph}-${color}`;
        let proto = meshCache.get(key);
        if (!proto) {
          proto = makeLantern(0.19, 0.34, color, glyph);
          meshCache.set(key, proto);
        }
        const lantern = proto.clone();
        lantern.position.set(pos.x, pos.y - 0.32, pos.z);
        lantern.scale.setScalar(rand(0.9, 1.15));
        group.add(lantern);
        const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.24, 3), shared.black);
        cord.position.set(pos.x, pos.y - 0.08, pos.z);
        group.add(cord);
      }
    });

    // a few heavier power cables with cables and subtle glows
    for (let i = 0; i < 5; i++) {
      const z = -6 - i * 21;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-7.1, 8.6 + rand(-0.2, 0.5), z),
        new THREE.Vector3(0, 7.6 + rand(-0.3, 0.2), z + rand(-1, 1)),
        new THREE.Vector3(7.1, 8.7 + rand(-0.2, 0.5), z),
      );
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.022, 4, false), shared.black);
      group.add(tube);
    }

    world.add(group);
    return group;
  }

  const lanternStrings = buildLanternStrings();

  /* ============================================================
     stalls
     ============================================================ */

  function buildStall(stall) {
    const group = new THREE.Group();
    const color = stall.color;
    const accent = new THREE.Color(color);
    const x = stall.side * 4.55;
    const rotY = stall.side === -1 ? Math.PI / 2 : -Math.PI / 2;
    group.position.set(x, 0, stall.z);
    group.rotation.y = rotY;

    // platform + counter
    frame(group, 3.9, 0.1, 2.5, shared.darker, 0, 0.05, -0.1);
    frame(group, 3.6, 0.96, 0.78, shared.counter, 0, 0.55, 0.32);
    frame(group, 3.9, 0.07, 1.0, shared.wood, 0, 1.06, 0.36);
    // counter front panel
    const glyphTex = norenTexture(renderer, stall.glyph, color);
    const frontPanel = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 0.78), new THREE.MeshStandardMaterial({ map: glyphTex, roughness: 0.85, emissive: new THREE.Color(color), emissiveIntensity: 0.08 }));
    frontPanel.position.set(0, 0.56, 0.716);
    group.add(frontPanel);

    // back wall
    frame(group, 3.7, 2.5, 0.16, shared.dark, 0, 1.55, -0.85);
    // side posts
    [-1.78, 1.78].forEach((sx) => frame(group, 0.08, 3.0, 0.08, shared.steel, sx, 1.5, 0.52));

    // photo panel
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.38), photoMaterial(stall.hero ? photos[stall.heroKey] || photos.ramen : photos.ramen, { color: 0xf7e4d8, emissive: 1.2 }));
    photo.position.set(0, 2.05, -0.76);
    group.add(photo);
    const photoFrame = new THREE.Mesh(new THREE.BoxGeometry(2.42, 1.54, 0.06), shared.black);
    photoFrame.position.set(0, 2.05, -0.8);
    group.add(photoFrame);
    // neon frame around photo
    const photoNeon = new THREE.Group();
    const pnMat = neonMaterial(color, 0.85);
    const pnH = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.02, 0.02), pnMat);
    pnH.position.set(0, 2.84, -0.7);
    photoNeon.add(pnH);
    const pnH2 = pnH.clone();
    pnH2.position.y = 1.27;
    photoNeon.add(pnH2);
    const pnV = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.57, 0.02), pnMat);
    pnV.position.set(-1.19, 2.05, -0.7);
    photoNeon.add(pnV);
    const pnV2 = pnV.clone();
    pnV2.position.x = 1.19;
    photoNeon.add(pnV2);
    group.add(photoNeon);
    flickerMaterials.push({ mat: pnMat, phase: rand(0, 6), speed: 2.4 });

    // header sign
    const signTex = panelSignTexture(renderer, {
      title: stall.short,
      jp: stall.jp,
      color,
      width: 1024,
      height: 220,
    });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.56), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: true }));
    sign.position.set(0, 2.96, 0.58);
    group.add(sign);
    const signBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.64, 0.06), shared.black);
    signBack.position.set(0, 2.96, 0.54);
    group.add(signBack);
    const underSign = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.02, 0.02), neonMaterial(color, 0.9));
    underSign.position.set(0, 2.65, 0.63);
    group.add(underSign);

    // a tall vertical sign on the outer side, visible from up the street
    const vtex = neonTexture(renderer, {
      text: stall.short,
      color,
      font: `400 62px ${DISPLAY_FONT}`,
      width: 128,
      height: 768,
      vertical: true,
    });
    const vsign = new THREE.Mesh(
      new THREE.PlaneGeometry(0.46, 2.76),
      new THREE.MeshBasicMaterial({ map: vtex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }),
    );
    vsign.position.set(-1.95, 2.28, 0.45);
    vsign.rotation.y = Math.PI / 2.9;
    group.add(vsign);
    const vsignBack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.9, 0.56), shared.black);
    vsignBack.position.set(-1.98, 2.28, 0.4);
    vsignBack.rotation.y = Math.PI / 2.9;
    group.add(vsignBack);

    // roof
    frame(group, 4.05, 0.15, 2.6, shared.dark, 0, 3.32, -0.15);
    const roofStrip = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.035, 0.035), neonMaterial(accent, 0.85));
    roofStrip.position.set(0, 3.39, 1.12);
    group.add(roofStrip);
    const roofStrip2 = roofStrip.clone();
    roofStrip2.rotation.y = Math.PI / 2;
    roofStrip2.position.set(-2.0, 3.39, -0.15);
    group.add(roofStrip2);
    const roofStrip3 = roofStrip2.clone();
    roofStrip3.position.x = 2.0;
    group.add(roofStrip3);
    flickerMaterials.push({ mat: roofStrip.material, phase: rand(0, 8), speed: rand(1.8, 4) });

    // fabric awning
    const awningTex = norenTexture(renderer, stall.glyph, color);
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(3.85, 1.05), new THREE.MeshStandardMaterial({ map: awningTex, roughness: 0.95, side: THREE.DoubleSide }));
    awning.position.set(0, 2.79, 0.95);
    awning.rotation.x = -0.2;
    group.add(awning);

    // hanging lanterns at corners
    [-1.55, 1.55].forEach((lx, idx) => {
      const pivot = new THREE.Group();
      pivot.position.set(lx, 3.28, 0.72);
      const l = makeLantern(0.27, 0.44, idx === 0 ? '#ffcf8a' : color, stall.glyph);
      l.position.y = -0.5;
      pivot.add(l);
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.36, 4), shared.black);
      cord.position.y = -0.2;
      pivot.add(cord);
      group.add(pivot);
      swayingLanterns.push({ pivot, phase: rand(0, 8), amp: rand(0.02, 0.065), base: pivot.rotation.z });
    });

    // stools
    const stoolMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.28), roughness: 0.8 });
    for (let i = 0; i < 2; i++) {
      const stool = new THREE.Group();
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 12), stoolMat);
      seat.position.y = 0.58;
      stool.add(seat);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.58, 6), shared.steel);
      leg.position.y = 0.29;
      stool.add(leg);
      stool.position.set(-1.0 + i * 2.0, 0, 1.5);
      group.add(stool);
    }

    // counter details
    const details = buildCounterDetails(stall);
    group.add(details);

    // a small point light for warmth
    if (!isLow || stall.side === -1) {
      const light = new THREE.PointLight(new THREE.Color(color).lerp(new THREE.Color('#ffcf8a'), 0.5), 11, 6.5, 2);
      light.position.set(0, 1.8, 1.4);
      group.add(light);
    }

    // marker / hologram above
    const markerGroup = new THREE.Group();
    const markerMat = new THREE.MeshBasicMaterial({ color, toneMapped: false, wireframe: true, transparent: true, opacity: 0.9 });
    const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), markerMat);
    markerGroup.add(marker);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.006, 4, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, toneMapped: false }));
    ring.rotation.x = Math.PI / 2;
    markerGroup.add(ring);
    const glow = makeGlowSprite(renderer, GLOW, color, 1.5, 0.35);
    markerGroup.add(glow);
    group.position.set(0, 4.0, 0.55);
    group.add(markerGroup);
    group.userData.marker = markerGroup;
    group.userData.markerMesh = marker;
    group.userData.markerBaseY = 4.0;

    // stamp halo, hidden until visited
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.5, 0.56, 40),
      new THREE.MeshBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    halo.position.set(0, 3.62, 0.8);
    group.add(halo);
    group.userData.halo = halo;

    // click target
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(4.1, 3.6, 2.7),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    );
    hitbox.position.set(0, 1.75, 0);
    hitbox.userData.stallId = stall.id;
    group.add(hitbox);
    interactiveHitboxes.push(hitbox);

    group.traverse((child) => {
      child.userData.stallId = stall.id;
    });

    stallRefs.set(stall.id, {
      data: stall,
      group,
      light: null,
      markerGroup,
      halo,
      worldPos: new THREE.Vector3(x, 0, stall.z),
    });

    // vendors leaning over the counter
    const vendor = makePerson({
      coat: pick(['#38132a', '#0d2131', '#2b2411', '#1b1526']),
      skin: pick(['#8d6f60', '#b08a76', '#6d5248']),
      accent: color,
      umbrella: false,
      scale: rand(0.92, 1.02),
      still: true,
    });
    vendor.group.position.set(rand(-0.75, 0.75), 0, -0.18);
    vendor.group.rotation.y = Math.PI;
    group.add(vendor.group);

    world.add(group);
    return group;
  }

  function buildCounterDetails(stall) {
    const g = new THREE.Group();
    const topY = 1.1;
    switch (stall.id) {
      case 'ramen': {
        // pot & bowls
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.29, 0.3, 14), shared.steel);
        pot.position.set(-0.85, topY + 0.15, 0.15);
        g.add(pot);
        const broth = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.02, 14), new THREE.MeshBasicMaterial({ color: 0xffa95e, toneMapped: false }));
        broth.position.set(-0.85, topY + 0.3, 0.15);
        g.add(broth);
        for (let i = 0; i < 4; i++) {
          const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.12, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xefe6d8, roughness: 0.7, side: THREE.DoubleSide }));
          bowl.position.set(-0.15 + i * 0.25, topY + 0.06, 0.45);
          g.add(bowl);
          const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.015, 12), new THREE.MeshBasicMaterial({ color: 0xd68443 }));
          soup.position.copy(bowl.position).setY(topY + 0.12);
          g.add(soup);
        }
        steamEmitters.push({ pos: new THREE.Vector3(stall.side * 4.55 - 0.4, 2.0, stall.z + 0.4), rate: 0.5, color: 0xffd9ae });
        break;
      }
      case 'puffer': {
        // rack with tiny puffy jackets
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 6), shared.steel);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, topY + 1.32, -0.3);
        g.add(bar);
        [-0.95, 0.95].forEach((x) => {
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 1.3, 6), shared.steel);
          post.position.set(x, topY + 0.67, -0.3);
          g.add(post);
        });
        const jacketColors = [0xff2f92, 0x63f7ff, 0xffcf7a];
        jacketColors.forEach((jc, i) => {
          const jacket = new THREE.Group();
          const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.27, 4, 8), new THREE.MeshStandardMaterial({ color: jc, roughness: 0.62, metalness: 0.18 }));
          body.scale.set(1, 1.1, 0.72);
          jacket.add(body);
          const collar = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.045, 6, 12), new THREE.MeshStandardMaterial({ color: 0x1a1320, roughness: 0.9 }));
          collar.rotation.x = Math.PI / 2;
          collar.position.y = 0.26;
          jacket.add(collar);
          const hanger = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.006, 3, 3, Math.PI), new THREE.MeshBasicMaterial({ color: 0xb9b4c5 }));
          hanger.position.y = 0.38;
          jacket.add(hanger);
          jacket.position.set(-0.65 + i * 0.65, topY + 0.88, -0.3);
          g.add(jacket);
        });
        // glowing sewing machine
        const sm = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.28), shared.steel);
        sm.position.set(0.9, topY + 0.12, 0.22);
        g.add(sm);
        const smGlow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.015, 0.02), neonMaterial('#63f7ff', 0.9));
        smGlow.position.set(0.9, topY + 0.2, 0.37);
        g.add(smGlow);
        // patches pinned to the back wall
        const patchColors = ['#ff2f92', '#63f7ff', '#ffcf7a', '#c7ff63'];
        for (let i = 0; i < 4; i++) {
          const patch = new THREE.Mesh(new THREE.CircleGeometry(0.11, 12), neonMaterial(patchColors[i], 0.9));
          patch.position.set(-1.05 + i * 0.32, 2.55, -0.75);
          g.add(patch);
        }
        break;
      }
      case 'lanterns': {
        // tall wish lantern on the counter
        const big = makeLantern(0.18, 0.34, '#ffcf8a', '願');
        big.position.set(0, topY + 0.42, 0.1);
        g.add(big);
        // strips of wishes
        for (let i = 0; i < 7; i++) {
          const slip = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.34), new THREE.MeshStandardMaterial({ color: 0xf5eee2, roughness: 0.9, side: THREE.DoubleSide }));
          slip.position.set(-1.0 + i * 0.33, topY + 0.72 + (i % 2) * 0.08, 0.3);
          slip.rotation.y = rand(-0.3, 0.3);
          g.add(slip);
        }
        steamEmitters.push({ pos: new THREE.Vector3(stall.side * 4.55, 1.8, stall.z + 0.4), rate: 0.18, color: 0xffe1b0 });
        break;
      }
      case 'takoyaki': {
        // pan with balls
        const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.12, 20), shared.black);
        pan.position.set(0, topY + 0.08, 0.2);
        g.add(pan);
        for (let i = 0; i < 9; i++) {
          const ball = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), new THREE.MeshStandardMaterial({ color: 0xc8863f, roughness: 0.55, emissive: 0x3b1a06, emissiveIntensity: 0.4 }));
          const angle = (i / 9) * Math.PI * 2;
          const r = i === 0 ? 0 : 0.23;
          ball.position.set(Math.cos(angle) * r, topY + 0.16, 0.2 + Math.sin(angle) * r);
          g.add(ball);
        }
        const steamPuff = makeGlowSprite(renderer, GLOW, 0xffb15e, 1.4, 0.2);
        steamPuff.position.set(0, topY + 0.4, 0.2);
        g.add(steamPuff);
        steamEmitters.push({ pos: new THREE.Vector3(stall.side * 4.55, 2.0, stall.z + 0.4), rate: 0.5, color: 0xffc58c });
        break;
      }
      case 'goldfish': {
        // glowing tank
        const tank = new THREE.Group();
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x8de8ef,
          transparent: true,
          opacity: 0.18,
          roughness: 0.08,
          metalness: 0,
          transmission: 0.2,
          side: THREE.DoubleSide,
        });
        const shell = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.65), glassMat);
        shell.position.set(0, topY + 0.36, 0.08);
        tank.add(shell);
        const water = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.58), new THREE.MeshBasicMaterial({ color: 0x0a5e6e, transparent: true, opacity: 0.55 }));
        water.rotation.x = -Math.PI / 2;
        water.position.set(0, topY + 0.16, 0.08);
        tank.add(water);
        const glow = makeGlowSprite(renderer, GLOW, 0x63f7ff, 2.4, 0.3);
        glow.position.set(0, topY + 0.4, 0.08);
        tank.add(glow);
        // mini fish
        for (let i = 0; i < 4; i++) {
          const fish = makeFish(0xff8a4d, 0.38);
          fish.position.set(rand(-0.5, 0.5), topY + 0.28 + rand(-0.05, 0.12), 0.08 + rand(-0.15, 0.15));
          fish.rotation.y = rand(0, Math.PI * 2);
          fish.userData.phase = rand(0, 6);
          fish.userData.base = fish.position.clone();
          tank.add(fish);
        }
        g.add(tank);
        g.userData.tank = tank;
        // bucket
        const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.26, 14), new THREE.MeshStandardMaterial({ color: 0x1b2a52, roughness: 0.8 }));
        bucket.position.set(-1.1, topY + 0.13, 0.5);
        g.add(bucket);
        break;
      }
      case 'omikuji': {
        // fortune box with sticks
        const box = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.42), shared.wood);
        box.position.set(0, topY + 0.35, 0.12);
        g.add(box);
        for (let i = 0; i < 8; i++) {
          const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 4), new THREE.MeshBasicMaterial({ color: 0xd8b78e }));
          stick.position.set(-0.15 + (i % 4) * 0.1, topY + 0.62, 0.12 + (i > 3 ? 0.06 : -0.02));
          g.add(stick);
        }
        // mini torii
        const mini = new THREE.Group();
        const mm = neonMaterial('#ff5a5f', 0.9);
        [-0.22, 0.22].forEach((sx) => {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.5, 0.035), mm);
          post.position.set(sx, topY + 0.5, -0.35);
          mini.add(post);
        });
        const mt = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.08), mm);
        mt.position.set(0, topY + 0.75, -0.35);
        mini.add(mt);
        g.add(mini);
        // hanging paper fortunes
        for (let i = 0; i < 6; i++) {
          const slip = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.4), new THREE.MeshStandardMaterial({ color: 0xf0eadc, roughness: 0.95, side: THREE.DoubleSide }));
          slip.position.set(-1.1 + i * 0.42, topY + 1.05 + (i % 3) * 0.07, -0.5);
          slip.rotation.y = rand(-0.4, 0.4);
          g.add(slip);
        }
        break;
      }
      case 'charm': {
        // printed omamori hanging on a wire
        const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2.0, 4), shared.steel);
        wire.rotation.z = Math.PI / 2;
        wire.position.set(0, topY + 1.1, -0.55);
        g.add(wire);
        const charmColors = [0x9a7bff, 0xff2f92, 0x63f7ff, 0xffcf7a];
        for (let i = 0; i < 5; i++) {
          const charm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.035), new THREE.MeshStandardMaterial({ color: charmColors[i % 4], emissive: charmColors[i % 4], emissiveIntensity: 0.25, roughness: 0.6 }));
          charm.position.set(-0.8 + i * 0.4, topY + 0.94, -0.55);
          g.add(charm);
          const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.12, 3), new THREE.MeshBasicMaterial({ color: 0xe2d0b0 }));
          cord.position.set(-0.8 + i * 0.4, topY + 1.1, -0.55);
          g.add(cord);
        }
        // printer box
        const printer = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.38, 0.4), shared.steel);
        printer.position.set(0.9, topY + 0.19, 0.2);
        g.add(printer);
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), neonMaterial('#c7ff63', 0.95));
        slot.position.set(0.9, topY + 0.32, 0.42);
        g.add(slot);
        break;
      }
    }
    return g;
  }

  STALLS.forEach((stall, i) => {
    stall.heroKey = {
      ramen: 'ramen',
      puffer: 'puffer',
      lanterns: 'wish',
      takoyaki: 'taiyaki',
      goldfish: 'goldfish',
      omikuji: 'omikuji',
      charm: 'ema',
    }[stall.id];
    buildStall(stall);
  });

  /* two extra non-interactive snack carts to thicken the street */
  function buildSnackCart(side, z, photoKey, label, color) {
    const group = new THREE.Group();
    group.position.set(side * 4.45, 0, z);
    group.rotation.y = side === -1 ? Math.PI / 2 : -Math.PI / 2;
    frame(group, 2.1, 0.9, 1.0, shared.counter, 0, 0.5, 0);
    frame(group, 2.3, 0.06, 1.15, shared.wood, 0, 0.97, 0);
    const photo = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), photoMaterial(photos[photoKey], { color: 0xf0d8c8 }));
    photo.position.set(0, 1.9, -0.2);
    group.add(photo);
    frame(group, 1.7, 1.15, 0.06, shared.black, 0, 1.9, -0.24);
    const signTex = neonTexture(renderer, { text: label, color, font: `400 92px ${DISPLAY_FONT}`, width: 512, height: 128, letterSpacing: 3 });
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.42), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }));
    sign.position.set(0, 2.68, 0.2);
    group.add(sign);
    frame(group, 2.3, 0.08, 1.3, shared.dark, 0, 2.85, 0);
    const lantern = makeLantern(0.22, 0.38, color, side === 1 ? '団' : '鯛');
    lantern.position.set(-0.85, 2.55, 0.5);
    group.add(lantern);
    world.add(group);
    return group;
  }
  buildSnackCart(1, -27.5, 'taiyaki', 'TAIYAKI', '#ffb96e');
  buildSnackCart(-1, -80.5, 'yatai', 'DANGO', '#ff7ac0');

  /* ============================================================
     stage
     ============================================================ */

  const stageCanvas = makeCanvas(1024, 512);
  const stageTex = toTexture(stageCanvas, renderer);
  let stageUnlocked = false;

  function paintStage(unlocked) {
    stageUnlocked = unlocked;
    const ctx = stageCanvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 512);
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#0c0518');
    grad.addColorStop(1, '#180821');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);
    ctx.strokeStyle = unlocked ? '#ffcf7a' : '#63f7ff';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.6;
    ctx.strokeRect(10, 10, 1004, 492);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = unlocked ? '#ffcf7a' : '#f5eee2';
    ctx.shadowColor = unlocked ? '#ffcf7a' : '#63f7ff';
    ctx.shadowBlur = 30;
    ctx.font = `400 112px ${DISPLAY_FONT}`;
    ctx.fillText(unlocked ? 'THE GOLDEN KOI' : 'AFTERGLOW STAGE', 512, 190);
    ctx.font = `400 60px ${DISPLAY_FONT}`;
    ctx.fillStyle = unlocked ? '#ff2f92' : '#63f7ff';
    ctx.fillText(unlocked ? 'AWAKENS' : '残光ステージ', 512, 272);
    ctx.font = `400 24px ${JP_FONT}`;
    ctx.fillStyle = '#c8bdb2';
    ctx.shadowBlur = 0;
    ctx.fillText(unlocked ? '七つの印が揃った。金色の鯉が目を覚ます。' : '七つの印を集めよ。金の鯉が眠っている。', 512, 340);
    ctx.font = `400 18px ${DISPLAY_FONT}`;
    ctx.fillStyle = unlocked ? '#ffcf7a' : 'rgba(245,238,226,0.5)';
    ctx.fillText(unlocked ? 'PRESS E / CLICK THE STAGE' : 'COLLECT 7 / 7 STAMPS TO WAKE THE KOI', 512, 405);
    // little koi glyph
    ctx.font = `600 100px ${JP_SERIF}`;
    ctx.fillStyle = unlocked ? 'rgba(255,207,122,0.5)' : 'rgba(99,247,255,0.18)';
    ctx.fillText('鯉', 512, 480);
    stageTex.needsUpdate = true;
  }
  paintStage(false);

  function buildStage() {
    const group = new THREE.Group();
    group.position.set(0, 0, -111);

    const stageFloor = new THREE.Mesh(new THREE.BoxGeometry(13, 0.8, 5.6), shared.dark);
    stageFloor.position.set(0, 0.4, 0);
    group.add(stageFloor);
    const stageEdge = new THREE.Mesh(new THREE.BoxGeometry(13.1, 0.04, 5.7), neonMaterial('#ffcf7a', 0.5));
    stageEdge.position.set(0, 0.81, 0);
    group.add(stageEdge);

    // giant screen
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.3), new THREE.MeshBasicMaterial({ map: stageTex, toneMapped: true }));
    screen.position.set(0, 4.4, 1.8);
    group.add(screen);
    const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(9.0, 4.7, 0.2), shared.black);
    screenFrame.position.set(0, 4.4, 1.65);
    group.add(screenFrame);
    const stageGlow = new THREE.PointLight(0xffcf7a, 55, 26, 2);
    stageGlow.position.set(0, 4.3, 3.5);
    group.add(stageGlow);

    // light beams
    for (let i = 0; i < 4; i++) {
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(2.4, 15, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xff2f92 : 0x63f7ff, transparent: true, opacity: 0.025, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      beam.position.set(-5.4 + i * 3.6, 7, 1.4);
      beam.rotation.z = (i - 1.5) * 0.12;
      group.add(beam);
    }

    // speakers
    [-4.6, 4.6].forEach((sx) => {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.6, 0.7), shared.black);
      sp.position.set(sx, 2.1, 2.2);
      group.add(sp);
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 12), shared.steel);
      cone.rotation.x = Math.PI / 2;
      cone.position.set(sx, 2.4, 2.55);
      group.add(cone);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 4, 20), neonMaterial('#ffcf7a', 0.5));
      ring.position.set(sx, 2.4, 2.56);
      group.add(ring);
    });

    // taiko drums
    [-2.9, 2.9].forEach((sx) => {
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.6, 0.7, 18), shared.wood);
      drum.rotation.z = Math.PI / 2;
      drum.position.set(sx, 1.22, 0.6);
      group.add(drum);
      const head = new THREE.Mesh(new THREE.CircleGeometry(0.5, 18), new THREE.MeshStandardMaterial({ color: 0xe4d2b4, roughness: 0.9 }));
      head.position.set(sx + 0.36, 1.22, 0.6);
      head.rotation.y = Math.PI / 2;
      group.add(head);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.02, 5, 24), neonMaterial('#ff2f92', 0.7));
      rim.rotation.y = Math.PI / 2;
      rim.position.set(sx + 0.37, 1.22, 0.6);
      group.add(rim);
    });

    // crowd silhouettes facing the stage
    for (let i = 0; i < 24; i++) {
      const person = makePerson({
        coat: pick(['#0a0712', '#12101b', '#1a1120', '#0c111a']),
        skin: 0x2a1e1a,
        accent: pick(['#63f7ff', '#ff2f92', '#ffcf7a']),
        umbrella: false,
        scale: rand(0.85, 1.02),
        still: true,
      });
      person.group.position.set(rand(-6.1, 6.1), 0, 4.4 + rand(0, 3.2));
      person.group.rotation.y = Math.PI;
      group.add(person.group);
    }

    group.userData.screen = screen;
    group.userData.glow = stageGlow;
    world.add(group);

    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(12.5, 7, 6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
    );
    hitbox.position.set(0, 3.5, 0.4);
    hitbox.userData.stallId = 'stage';
    group.add(hitbox);
    interactiveHitboxes.push(hitbox);
    group.traverse((c) => (c.userData.stallId = c.userData.stallId || 'stage'));

    return group;
  }

  const stageGroup = buildStage();
  const stageRef = {
    group: stageGroup,
    worldPos: new THREE.Vector3(0, 0, -111),
    stageTex,
  };

  /* ============================================================
     golden koi (hidden until finale)
     ============================================================ */

  const goldenKoi = makeKoi('#ffcf7a', 2.8);
  goldenKoi.visible = false;
  world.add(goldenKoi);

  function triggerGoldenKoi(show = true) {
    goldenKoi.visible = show;
    if (show) {
      goldenKoi.userData.birth = performance.now();
    }
  }

  /* ============================================================
     crowd
     ============================================================ */

  function buildCrowd() {
    const group = new THREE.Group();
    const coats = ['#241028', '#12202c', '#2a1b10', '#171326', '#2a0f19', '#0f241f'];
    const accents = ['#63f7ff', '#ff2f92', '#ffcf7a', '#c7ff63', '#9a7bff'];

    // walkers
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const person = makePerson({
        coat: pick(coats),
        skin: pick(['#8d6f60', '#b08a76', '#6d5248', '#c9a58b']),
        accent: pick(accents),
        umbrella: Math.random() > 0.58,
        umbrellaColor: pick(['#ff2f92', '#63f7ff', '#ffcf7a', '#f5eee2']),
        scale: rand(0.86, 1.04),
      });
      const z = rand(8, -100);
      person.group.position.set(side * rand(2.45, 3.6), 0, z);
      person.group.rotation.y = Math.random() > 0.5 ? 0 : Math.PI;
      person.walk = {
        speed: rand(0.32, 0.8) * (Math.random() > 0.5 ? 1 : -1),
        dir: Math.sign(person.group.rotation.y) || 1,
        range: [rand(-102, -86), rand(10, 14)],
      };
      group.add(person.group);
      walkingPeople.push(person);
    }

    // people standing at stalls, backs to the street
    STALLS.forEach((stall, idx) => {
      const count = idx % 2 === 0 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const person = makePerson({
          coat: pick(coats),
          skin: pick(['#8d6f60', '#b08a76', '#6d5248', '#c9a58b']),
          accent: pick(accents),
          umbrella: Math.random() > 0.8,
          umbrellaColor: pick(['#ff2f92', '#63f7ff', '#ffcf7a']),
          scale: rand(0.86, 1.02),
          still: true,
        });
        person.group.position.set(stall.side * rand(3.9, 4.1), 0, stall.z + (i === 0 ? 0.9 : -0.9) + rand(-0.2, 0.2));
        person.group.rotation.y = stall.side === -1 ? -Math.PI / 2 : Math.PI / 2;
        group.add(person.group);
      }
    });

    // two friends sharing an umbrella
    const pair = [-1, 1];
    pair.forEach((s, i) => {
      const person = makePerson({
        coat: i === 0 ? '#29112e' : '#0e2330',
        skin: '#a98572',
        accent: i === 0 ? '#ff2f92' : '#63f7ff',
        umbrella: i === 0,
        umbrellaColor: '#ff2f92',
        scale: 0.98,
        still: true,
      });
      person.group.position.set(-0.4 + i * 0.7, 0, -14.5);
      person.group.rotation.y = Math.PI / 2;
      group.add(person.group);
    });

    // cat on a crate
    const cat = makeCat();
    cat.position.set(-3.0, 0.48, -37.4);
    cat.rotation.y = 0.8;
    group.add(cat);
    group.userData.cat = cat;

    // pigeons (just shapes) near the ground
    for (let i = 0; i < 3; i++) {
      const bird = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 5), new THREE.MeshStandardMaterial({ color: 0x2b2a33, roughness: 0.9 }));
      body.scale.set(1, 0.8, 1.35);
      bird.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 5), body.material);
      head.position.set(0, 0.05, 0.09);
      bird.add(head);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 4, 4), neonMaterial('#ffcf7a'));
      eye.position.set(0.025, 0.06, 0.12);
      bird.add(eye);
      bird.position.set(rand(-3, 3), 0.12, rand(-5, -80));
      group.add(bird);
    }

    world.add(group);
    return group;
  }

  function makePerson({ coat = '#241028', skin = '#a98572', accent = '#63f7ff', umbrella = false, umbrellaColor = '#ff2f92', scale = 1, still = false } = {}) {
    const group = new THREE.Group();
    const coatMat = new THREE.MeshStandardMaterial({ color: coat, roughness: 0.86, metalness: 0.12 });
    const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: 0.82 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x0a0810, roughness: 0.9 });
    const accentMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.8, toneMapped: false });
    const neonObjMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5, toneMapped: false, side: THREE.DoubleSide });

    // legs
    const legGeom = new THREE.CylinderGeometry(0.055, 0.06, 0.62, 6);
    const leftLeg = new THREE.Mesh(legGeom, darkMat);
    leftLeg.position.set(-0.1, 0.32, 0);
    group.add(leftLeg);
    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.1;
    group.add(rightLeg);

    // body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.44, 4, 8), coatMat);
    body.position.y = 1.0;
    group.add(body);

    // arms
    const armGeom = new THREE.CylinderGeometry(0.042, 0.045, 0.5, 6);
    const leftArm = new THREE.Mesh(armGeom, coatMat);
    leftArm.position.set(-0.235, 1.0, 0);
    leftArm.rotation.z = 0.13;
    group.add(leftArm);
    const rightArm = leftArm.clone();
    rightArm.position.x = 0.235;
    rightArm.rotation.z = -0.13;
    group.add(rightArm);

    // head + hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 10, 8), skinMat);
    head.position.y = 1.49;
    group.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), darkMat);
    hair.position.y = 1.51;
    hair.rotation.x = -0.14;
    group.add(hair);

    // tiny neon accessories
    if (Math.random() > 0.55) {
      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.025, 0.02), accentMat);
      visor.position.set(0, 1.49, 0.125);
      group.add(visor);
    } else if (Math.random() > 0.4) {
      const phone = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.01), new THREE.MeshBasicMaterial({ color: 0xd9f4ff, toneMapped: false }));
      phone.position.set(0.22, 1.03, 0.13);
      phone.rotation.z = -0.2;
      group.add(phone);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), skinMat);
      hand.position.set(0.22, 0.98, 0.1);
      group.add(hand);
    } else {
      const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 4, 10), neonObjMat);
      scarf.rotation.x = Math.PI / 2;
      scarf.position.y = 1.31;
      group.add(scarf);
    }

    // umbrella
    let umbrellaGroup = null;
    if (umbrella) {
      umbrellaGroup = new THREE.Group();
      const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.9, 4), shared.steel);
      staff.position.y = 0;
      umbrellaGroup.add(staff);
      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(0.52, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: umbrellaColor,
          transparent: true,
          opacity: 0.3,
          roughness: 0.35,
          metalness: 0.1,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      canopy.scale.y = 0.5;
      canopy.position.y = 0.4;
      umbrellaGroup.add(canopy);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.006, 4, 24), new THREE.MeshBasicMaterial({ color: umbrellaColor, transparent: true, opacity: 0.7, toneMapped: false }));
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.4;
      umbrellaGroup.add(rim);
      umbrellaGroup.position.set(0.16, 1.78, 0.04);
      group.add(umbrellaGroup);
    }

    group.scale.setScalar(scale);
    group.userData.leftLeg = leftLeg;
    group.userData.rightLeg = rightLeg;
    group.userData.leftArm = leftArm;
    group.userData.rightArm = rightArm;
    group.userData.body = body;
    group.userData.head = head;
    group.userData.umbrellaGroup = umbrellaGroup;
    group.userData.phase = rand(0, Math.PI * 2);
    group.userData.still = still;
    group.userData.accent = accent;
    return { group, walk: null };
  }

  function makeCat() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x15121a, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.24, 4, 8), mat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.2;
    g.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mat);
    head.position.set(0, 0.3, 0.2);
    g.add(head);
    [-0.045, 0.045].forEach((x) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), mat);
      ear.position.set(x, 0.38, 0.2);
      g.add(ear);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 5, 4), new THREE.MeshBasicMaterial({ color: 0xc7ff63, toneMapped: false }));
      eye.position.set(x * 0.8, 0.32, 0.29);
      g.add(eye);
    });
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.012, 0.4, 5), mat);
    tail.position.set(0, 0.33, -0.2);
    tail.rotation.x = -0.7;
    g.add(tail);
    g.userData.tail = tail;
    return g;
  }

  function makeFish(color, scale = 1) {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: 0.9 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), mat);
    body.scale.set(0.6, 0.45, 1.6);
    group.add(body);
    const tailMat = new THREE.MeshBasicMaterial({ color, toneMapped: false, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 3), tailMat);
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.23;
    group.add(tail);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.18, 3), tailMat);
    fin.rotation.z = Math.PI / 2;
    fin.position.set(0, 0.02, 0.02);
    group.add(fin);
    group.scale.setScalar(scale);
    return group;
  }

  const crowd = buildCrowd();

  /* ============================================================
     procedural koi
     ============================================================ */

  function makeKoi(color, scale = 1) {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });
    const wireMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, wireframe: true, toneMapped: false });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10), mat);
    body.scale.set(0.45, 0.28, 1.35);
    group.add(body);
    const wire = new THREE.Mesh(body.geometry, wireMat);
    wire.scale.copy(body.scale).multiplyScalar(1.015);
    group.add(wire);

    const tailMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.25, 3, 1, true), tailMat);
    tail.rotation.x = Math.PI / 2;
    tail.position.z = -1.35;
    tail.scale.set(0.85, 0.9, 0.35);
    group.add(tail);
    const finL = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.7, 3, 1, true), tailMat);
    finL.rotation.z = Math.PI / 2;
    finL.position.set(-0.55, 0.05, 0.1);
    finL.scale.set(0.45, 1, 0.85);
    group.add(finL);
    const finR = finL.clone();
    finR.rotation.z = -Math.PI / 2;
    finR.position.x = 0.55;
    group.add(finR);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4, toneMapped: false });
    [-0.19, 0.19].forEach((x) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), eyeMat);
      eye.position.set(x, 0.11, 0.9);
      group.add(eye);
    });
    const glow = makeGlowSprite(renderer, GLOW, color, 6.5, 0.16);
    glow.position.z = -0.4;
    group.add(glow);

    group.scale.setScalar(scale);
    group.userData.tail = tail;
    group.userData.finL = finL;
    group.userData.finR = finR;
    group.userData.body = body;
    group.userData.phase = rand(0, 10);
    return group;
  }

  const holoKoi = makeKoi('#63f7ff', 0.95);
  holoKoi.position.set(0, 9.4, -58);
  world.add(holoKoi);
  const holoKoi2 = makeKoi('#ff7ac0', 0.55);
  holoKoi2.position.set(4, 13, -84);
  world.add(holoKoi2);

  /* ============================================================
     car
     ============================================================ */

  function buildCar(color = '#15121e', accent = '#63f7ff') {
    const group = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.23, metalness: 0.95 });
    const trimMat = new THREE.MeshBasicMaterial({ color: accent, toneMapped: false });
    const redMat = new THREE.MeshBasicMaterial({ color: '#ff2f5e', toneMapped: false });

    // main body profile
    const shape = new THREE.Shape();
    shape.moveTo(-2.1, 0.38);
    shape.lineTo(-2.25, 0.72);
    shape.lineTo(-1.5, 0.95);
    shape.lineTo(-0.65, 1.42);
    shape.lineTo(0.6, 1.42);
    shape.lineTo(1.45, 0.92);
    shape.lineTo(2.15, 0.78);
    shape.lineTo(2.3, 0.45);
    shape.lineTo(2.1, 0.25);
    shape.lineTo(-2.0, 0.25);
    shape.closePath();
    const extrude = new THREE.ExtrudeGeometry(shape, { depth: 1.65, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
    extrude.translate(0, 0, -0.825);
    const body = new THREE.Mesh(extrude, bodyMat);
    body.rotation.y = -Math.PI / 2;
    group.add(body);

    // glass canopy
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x0b1a24, roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.82, transmission: 0.3 });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.34, 2.0), glassMat);
    canopy.position.set(0, 1.32, -0.25);
    group.add(canopy);
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 0.02), trimMat);
    windshield.position.set(0, 1.46, 0.72);
    group.add(windshield);

    // neon side trim
    [-1.08, 1.08].forEach((x) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 3.6), trimMat);
      strip.position.set(x, 0.68, 0);
      group.add(strip);
    });
    const under = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 3.6), new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    under.rotation.x = -Math.PI / 2;
    under.position.y = 0.06;
    group.add(under);
    const glow = makeGlowSprite(renderer, GLOW, accent, 4, 0.35);
    glow.position.set(0, 0.3, 0);
    glow.rotation.x = -Math.PI / 2;
    group.add(glow);

    // headlights / tail
    [-0.58, 0.58].forEach((x) => {
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: 0xfff4dc, toneMapped: false }));
      lamp.position.set(x, 0.62, 2.2);
      group.add(lamp);
    });
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.05, 0.04), redMat);
    tail.position.set(0, 0.72, -2.2);
    group.add(tail);

    // wheels
    const wheels = [];
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x060608, roughness: 0.92 });
    [-1.05, 1.05].forEach((x) => {
      [-1.35, 1.35].forEach((z) => {
        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(x, 0.38, z);
        wheelGroup.rotation.z = Math.PI / 2;
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18), tireMat);
        wheelGroup.add(tire);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.025, 6, 22), neonMaterial(accent, 0.85));
        rim.rotation.x = Math.PI / 2;
        rim.position.y = 0.13;
        wheelGroup.add(rim);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 12), shared.steel);
        cap.position.y = 0.14;
        wheelGroup.add(cap);
        group.add(wheelGroup);
        wheels.push(wheelGroup);
      });
    });

    // headlight beams
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0cf, transparent: true, opacity: 0.055, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    [-0.58, 0.58].forEach((x) => {
      const beam = new THREE.Mesh(new THREE.ConeGeometry(1.3, 12, 16, 1, true), beamMat);
      beam.rotation.x = -Math.PI / 2;
      beam.position.set(x, 0.58, 8);
      group.add(beam);
    });

    const spot = new THREE.SpotLight(0xffe3c0, 65, 26, 0.36, 0.65, 1.8);
    spot.position.set(0, 0.8, 1.9);
    spot.target.position.set(0, 0.1, 12);
    group.add(spot);
    group.add(spot.target);

    // roof taxi sign
    const taxiMat = new THREE.MeshBasicMaterial({ color: '#ffcf7a', toneMapped: false });
    const taxi = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.7), taxiMat);
    taxi.position.set(0, 1.6, -0.2);
    group.add(taxi);
    const taxiGlow = makeGlowSprite(renderer, GLOW, 0xffcf7a, 1.2, 0.5);
    taxiGlow.position.set(0, 1.62, -0.2);
    group.add(taxiGlow);

    group.userData.wheels = wheels;
    group.userData.beam = beamMat;
    group.userData.spot = spot;
    return group;
  }

  const carA = buildCar('#12111a', '#63f7ff');
  const carB = buildCar('#1b1120', '#ff2f92');
  carA.position.set(1.9, 0, -130);
  carB.position.set(-1.9, 0, 32);
  carB.rotation.y = Math.PI;
  carA.userData.dir = 1;
  carB.userData.dir = -1;
  carA.userData.speed = 11.5;
  carB.userData.speed = 8.5;
  carA.userData.z = -130;
  carB.userData.z = 32;
  carA.userData.carColor = '#63f7ff';
  carB.userData.carColor = '#ff2f92';
  world.add(carA, carB);

  /* ============================================================
     rain, steam, embers, ripples
     ============================================================ */

  function buildRain() {
    const count = isLow ? 750 : 1900;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 6);
    const drops = [];
    for (let i = 0; i < count; i++) {
      drops.push({
        x: rand(-14, 14),
        y: rand(0, 16),
        z: rand(-24, 16),
        len: rand(0.16, 0.6),
        speed: rand(12, 26),
        drift: rand(-0.6, 0.6),
      });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xa9dfff, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, fog: true });
    const mesh = new THREE.LineSegments(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 2;
    world.add(mesh);
    return { mesh, drops, positions, geo, count };
  }

  const rain = buildRain();

  function buildRipples() {
    if (isLow) return null;
    const group = new THREE.Group();
    const items = [];
    for (let i = 0; i < 28; i++) {
      const mat = new THREE.MeshBasicMaterial({ map: RIPPLE, color: 0x9de6ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(rand(-9, 9), 0.045, rand(-10, 10));
      group.add(m);
      items.push({ mesh: m, life: rand(0, 1), speed: rand(0.4, 0.9), x: m.position.x, z: m.position.z });
    }
    world.add(group);
    return { group, items };
  }

  const ripples = buildRipples();

  const steam = (() => {
    const group = new THREE.Group();
    const items = [];
    const count = isLow ? 18 : 34;
    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: SMOKE, color: 0xffd8b0, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      sprite.scale.setScalar(rand(0.7, 1.6));
      group.add(sprite);
      items.push({ sprite, life: rand(0, 1), speed: rand(0.18, 0.5), drift: rand(-0.2, 0.2), base: null });
    }
    world.add(group);
    return { group, items };
  })();

  const embers = (() => {
    const count = isLow ? 50 : 130;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const data = [];
    const palette = [new THREE.Color('#ffb96e'), new THREE.Color('#ff2f92'), new THREE.Color('#63f7ff')];
    for (let i = 0; i < count; i++) {
      const x = rand(-10, 10);
      const y = rand(0.5, 10);
      const z = rand(-110, 12);
      positions.set([x, y, z], i * 3);
      const c = pick(palette);
      colors.set([c.r, c.g, c.b], i * 3);
      data.push({ y, speed: rand(0.08, 0.32), drift: rand(-0.14, 0.14), phase: rand(0, 8) });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.075, map: GLOW, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    world.add(points);
    return { points, positions, geo, data, count };
  })();

  /* ============================================================
     floating lanterns above the street
     ============================================================ */

  const floatingLanterns = [];
  for (let i = 0; i < 9; i++) {
    const l = makeLantern(0.28, 0.48, pick(WARM), pick(['祭', '願', '光', '夢']));
    l.position.set(rand(-13, 13), rand(7, 14), rand(-100, -8));
    l.userData.phase = rand(0, 8);
    l.userData.baseY = l.position.y;
    world.add(l);
    floatingLanterns.push(l);
  }

  /* ============================================================
     interactive API
     ============================================================ */

  function setStallVisited(id, visited = true) {
    const ref = stallRefs.get(id);
    if (!ref) return;
    const halo = ref.halo;
    if (visited) {
      halo.material.opacity = 0.9;
      halo.material.color.set('#ffcf7a');
      const markerMesh = ref.group.userData.markerMesh;
      if (markerMesh) markerMesh.material.color.set('#ffcf7a');
    } else {
      halo.material.opacity = 0;
    }
  }

  function releaseLantern(text, color = '#ffb15e') {
    const canvas = makeCanvas(256, 384);
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 384);
    grad.addColorStop(0, '#fff6d9');
    grad.addColorStop(0.55, color);
    grad.addColorStop(1, '#9c3d2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 384);
    ctx.strokeStyle = 'rgba(120,45,30,0.35)';
    for (let y = 12; y < 384; y += 22) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(128, y + 7, 256, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(45,14,18,0.8)';
    ctx.font = `500 24px ${JP_SERIF}`;
    ctx.textAlign = 'center';
    const clean = (text || 'wish').slice(0, 32);
    const chars = [...clean];
    const step = Math.min(26, 300 / Math.max(1, chars.length));
    chars.forEach((c, i) => ctx.fillText(c, 128, 92 + i * step));
    const tex = toTexture(canvas, renderer);
    const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: true });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.6, 18), mat);
    const glow = makeGlowSprite(renderer, GLOW, color, 2.4, 0.4);
    lantern.add(glow);
    const start = new THREE.Vector3(-4.4, 1.6, -32);
    lantern.position.copy(start);
    world.add(lantern);
    wishLanterns.push({ mesh: lantern, life: 0, phase: rand(0, 6), speed: rand(0.22, 0.4), drift: rand(-0.14, 0.14) });
    return lantern;
  }

  function setFinaleUnlocked(unlocked, wakeKoi = true) {
    paintStage(unlocked);
    if (unlocked && wakeKoi) triggerGoldenKoi(true);
  }

  function getStallViews() {
    const views = {};
    STALLS.forEach((stall) => {
      const camX = stall.side * 1.7;
      const camZ = stall.z + 2.3;
      const target = new THREE.Vector3(stall.side * 4.4, 2.0, stall.z);
      views[stall.id] = { position: new THREE.Vector3(camX, 1.65, camZ), target };
    });
    views.stage = { position: new THREE.Vector3(0, 1.7, -101.2), target: new THREE.Vector3(0, 4.0, -111) };
    return views;
  }

  /* ============================================================
     animation
     ============================================================ */

  let elapsed = 0;
  let carHonkCooldown = 0;
  const onCarPass = { fn: null };
  const tmpVec = new THREE.Vector3();

  function update(dt, t, cameraState = {}) {
    elapsed = t;
    const cam = camera;

    // rain follows the camera
    {
      const arr = rain.positions;
      const drops = rain.drops;
      for (let i = 0; i < rain.count; i++) {
        const d = drops[i];
        d.y -= d.speed * dt;
        d.x += d.drift * dt;
        if (d.y < 0) {
          d.y = rand(10, 16);
          d.x = cam.position.x + rand(-13, 13);
          d.z = cam.position.z + rand(-15, 15);
        }
        if (Math.abs(d.x - cam.position.x) > 15) d.x = cam.position.x + rand(-14, 14);
        if (Math.abs(d.z - cam.position.z) > 17) d.z = cam.position.z + rand(-16, 16);
        const j = i * 6;
        arr[j] = d.x;
        arr[j + 1] = d.y;
        arr[j + 2] = d.z;
        arr[j + 3] = d.x + 0.02;
        arr[j + 4] = d.y - d.len;
        arr[j + 5] = d.z;
      }
      rain.geo.attributes.position.needsUpdate = true;
    }

    // ripples
    if (ripples) {
      ripples.items.forEach((r) => {
        r.life += dt * r.speed;
        if (r.life > 1) {
          r.life = 0;
          r.x = cam.position.x + rand(-8, 8);
          r.z = cam.position.z + rand(-10, 4);
        }
        const s = 0.35 + r.life * 2.4;
        r.mesh.scale.setScalar(s);
        r.mesh.material.opacity = (1 - r.life) * 0.28;
        r.mesh.position.set(r.x, 0.045, r.z);
      });
    }

    // steam
    steam.items.forEach((s, idx) => {
      s.life += dt * s.speed;
      if (s.life > 1) {
        s.life = 0;
        const emitter = steamEmitters[idx % Math.max(1, steamEmitters.length)];
        if (emitter) s.base = emitter;
      }
      if (!s.base && steamEmitters.length) s.base = steamEmitters[idx % steamEmitters.length];
      if (s.base) {
        const emitter = s.base;
        s.sprite.position.set(
          emitter.pos.x + Math.sin(t * 0.6 + idx) * 0.3 + s.life * s.drift,
          emitter.pos.y + s.life * 1.9,
          emitter.pos.z + Math.cos(t * 0.5 + idx) * 0.2,
        );
        s.sprite.material.opacity = Math.sin(s.life * Math.PI) * 0.16;
        s.sprite.scale.setScalar(0.7 + s.life * 2.2);
        s.sprite.material.color.set(emitter.color || 0xffd8b0);
      }
    });

    // embers
    {
      const arr = embers.positions;
      embers.data.forEach((e, i) => {
        e.y += e.speed * dt;
        if (e.y > 12) e.y = rand(0.4, 2);
        arr[i * 3] += Math.sin(t * 0.35 + e.phase) * dt * 0.08;
        arr[i * 3 + 1] = e.y;
        arr[i * 3 + 2] += e.drift * dt;
      });
      embers.geo.attributes.position.needsUpdate = true;
    }

    // lanterns sway
    swayingLanterns.forEach((l) => {
      l.pivot.rotation.z = (l.base || 0) + Math.sin(t * 0.7 + l.phase) * l.amp;
      l.pivot.rotation.x = Math.cos(t * 0.52 + l.phase) * l.amp * 0.4;
    });

    // floating lanterns
    floatingLanterns.forEach((l) => {
      l.position.y = l.userData.baseY + Math.sin(t * 0.32 + l.userData.phase) * 0.5;
      l.position.x += Math.sin(t * 0.11 + l.userData.phase) * dt * 0.12;
      l.rotation.y += dt * 0.08;
    });

    // released wish lanterns
    for (let i = wishLanterns.length - 1; i >= 0; i--) {
      const w = wishLanterns[i];
      w.life += dt;
      w.mesh.position.y += w.speed * dt;
      w.mesh.position.x += Math.sin(t * 0.5 + w.phase) * dt * 0.14 + w.drift * dt;
      w.mesh.rotation.y += dt * 0.15;
      const fade = clamp(1 - (w.life - 18) / 8, 0, 1);
      w.mesh.material.transparent = fade < 1;
      w.mesh.material.opacity = fade;
      if (w.life > 26) {
        world.remove(w.mesh);
        w.mesh.geometry.dispose();
        w.mesh.material.map?.dispose();
        w.mesh.material.dispose();
        wishLanterns.splice(i, 1);
      }
    }

    // flicker
    flickerMaterials.forEach((f) => {
      const base = 0.6 + 0.25 * Math.sin(t * f.speed + f.phase);
      const jitter = Math.random() > 0.994 ? 0.35 : 1;
      if (f.mat) f.mat.opacity = clamp(base * jitter, 0.18, 1);
    });

    // stall markers
    stallRefs.forEach((ref, id) => {
      const marker = ref.group.userData.marker;
      if (marker) {
        marker.rotation.y = t * 0.7;
        marker.position.y = ref.group.userData.markerBaseY + Math.sin(t * 1.2 + ref.data.z) * 0.09;
        const s = 1 + Math.sin(t * 2 + ref.data.z) * 0.06;
        marker.scale.setScalar(s);
      }
      if (id === 'goldfish') {
        const tank = ref.group.children;
        // mini fish inside tank, find tank group by userData
        const tg = ref.group.children.find((c) => c.userData.tank);
        if (tg?.userData.tank) {
          tg.userData.tank.children.forEach((fish) => {
            if (fish.userData.base) {
              fish.position.x = fish.userData.base.x + Math.sin(t * 0.6 + fish.userData.phase) * 0.2;
              fish.position.z = fish.userData.base.z + Math.cos(t * 0.5 + fish.userData.phase) * 0.12;
              fish.rotation.y = Math.atan2(Math.cos(t * 0.6 + fish.userData.phase), Math.sin(t * 0.5 + fish.userData.phase));
            }
          });
        }
      }
    });

    // stage/passive animation
    stageGroup.userData.glow.intensity = 45 + Math.sin(t * 0.8) * 8;
    stageGroup.userData.screen.material.opacity = 1;

    // walking people
    walkingPeople.forEach((p) => {
      const g = p.group;
      const walk = p.walk;
      if (!walk) return;
      g.position.z += walk.speed * dt;
      if (g.position.z > walk.range[1]) g.position.z = walk.range[0];
      if (g.position.z < walk.range[0]) g.position.z = walk.range[1];
      const side = g.position.x < 0 ? -1 : 1;
      if (walk.speed > 0) g.rotation.y = side === -1 ? Math.PI * 0.15 : -Math.PI * 0.15;
      else g.rotation.y = side === -1 ? Math.PI * 0.85 : -Math.PI * 0.85;
      const stride = Math.sin(t * 6.2 * Math.abs(walk.speed) * 2.2 + g.userData.phase);
      g.userData.leftLeg.rotation.x = stride * 0.5;
      g.userData.rightLeg.rotation.x = -stride * 0.5;
      g.userData.leftArm.rotation.x = -stride * 0.4;
      g.userData.rightArm.rotation.x = stride * 0.4;
      g.userData.body.position.y = 1.0 + Math.abs(stride) * 0.02;
      g.userData.head.position.y = 1.49 + Math.abs(stride) * 0.02;
      if (g.userData.umbrellaGroup) g.userData.umbrellaGroup.rotation.z = stride * 0.04;
    });

    // cat
    if (crowd.userData.cat) {
      const tail = crowd.userData.cat.userData.tail;
      tail.rotation.z = Math.sin(t * 1.3) * 0.25;
    }

    // holo koi swim
    [holoKoi, holoKoi2].forEach((koi, i) => {
      const phase = koi.userData.phase;
      const speed = i === 0 ? 0.16 : 0.24;
      koi.position.x = Math.sin(t * speed + phase) * (i === 0 ? 7 : 4);
      koi.position.y = (i === 0 ? 9.4 : 12.6) + Math.sin(t * 0.5 + phase) * 0.6;
      koi.position.z = (i === 0 ? -58 : -84) + Math.cos(t * speed * 0.7 + phase) * 2.5;
      koi.rotation.y = Math.sin(t * speed + phase + Math.PI / 2) * 0.5;
      koi.rotation.z = Math.sin(t * 0.5 + phase) * 0.06;
      koi.userData.tail.rotation.z = Math.sin(t * 1.8 + phase) * 0.22;
      koi.userData.finL.rotation.z = Math.PI / 2 + Math.sin(t * 1.4 + phase) * 0.14;
      koi.userData.finR.rotation.z = -Math.PI / 2 - Math.sin(t * 1.4 + phase) * 0.14;
    });

    // golden koi flight
    if (goldenKoi.visible) {
      const born = (performance.now() - (goldenKoi.userData.birth || performance.now())) / 1000;
      const t2 = t * 0.35 + 2;
      goldenKoi.position.x = Math.sin(t2) * 11;
      goldenKoi.position.y = 10 + Math.sin(t2 * 1.8) * 2.4;
      goldenKoi.position.z = -86 + Math.cos(t2 * 0.7) * 8 - clamp(born * 0.6, 0, 10);
      goldenKoi.rotation.y = Math.sin(t2 + Math.PI / 2) * 0.8;
      goldenKoi.rotation.z = Math.sin(t2 * 1.3) * 0.12;
      const s = 2.8 + Math.min(1.2, born * 0.4);
      goldenKoi.scale.setScalar(s);
      goldenKoi.userData.tail.rotation.z = Math.sin(t * 2.1) * 0.3;
      goldenKoi.userData.finL.rotation.z = Math.PI / 2 + Math.sin(t * 1.7) * 0.22;
      goldenKoi.userData.finR.rotation.z = -Math.PI / 2 - Math.sin(t * 1.7) * 0.22;
    }

    // sky glyphs
    sky.userData.glyph.rotation.y = 0.2 + Math.sin(t * 0.12) * 0.06;
    sky.userData.glyph.position.y = 21 + Math.sin(t * 0.25) * 0.4;
    sky.userData.blimp.position.x = -18 + Math.sin(t * 0.05) * 7;
    sky.userData.blimp.position.y = 28 + Math.sin(t * 0.2) * 0.5;

    // cars
    carHonkCooldown = Math.max(0, carHonkCooldown - dt);
    [carA, carB].forEach((car) => {
      const dir = car.userData.dir;
      car.userData.z += car.userData.speed * dir * dt;
      if (dir === 1 && car.userData.z > 34) {
        car.userData.z = -132;
        car.position.x = 1.9;
      }
      if (dir === -1 && car.userData.z < -132) {
        car.userData.z = 34;
        car.position.x = -1.9;
      }
      car.position.z = car.userData.z;
      const wheelSpin = (car.userData.speed * dt) / 0.36;
      car.userData.wheels.forEach((w) => {
        w.children[0].rotation.y += wheelSpin * dir;
        w.children[1].rotation.z += wheelSpin * dir;
      });
      const near = Math.abs(car.position.z - camera.position.z) < 16 && Math.abs(car.position.z - camera.position.z) > 4;
      if (near && carHonkCooldown <= 0) {
        carHonkCooldown = 3.5;
        onCarPass.fn?.(dir, car.position.z);
      }
      // headlight beam fades when far
      car.userData.beam.opacity = 0.04 + (isLow ? 0 : 0.015);
      // slight sway
      car.rotation.z = Math.sin(t * car.userData.speed * 0.16 + car.userData.z) * 0.004;
      car.position.y = 0.02 + Math.sin(t * 6 + car.userData.z) * 0.003;
    });

    // puddle reflection shimmer handled by neon pulses
    hemi.intensity = 0.72 + Math.sin(t * 0.18) * 0.06;
  }

  /* ============================================================
     composer + resize
     ============================================================ */

  let composer;
  function buildComposer() {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, {
      samples: isLow ? 0 : 4,
    });
    composer = new EffectComposer(renderer, target);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), isLow ? 0.65 : 0.95, isLow ? 0.45 : 0.62, isLow ? 0.7 : 0.58);
    composer.addPass(bloom);
    const output = new OutputPass();
    composer.addPass(output);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(window.innerWidth, window.innerHeight);
    return composer;
  }
  composer = buildComposer();

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLow ? 1.15 : 1.7));
    renderer.setSize(w, h);
    composer.setSize(w, h);
    composer.setPixelRatio(renderer.getPixelRatio());
  }

  function setFx(high) {
    const pr = Math.min(window.devicePixelRatio || 1, high ? 1.7 : 1.05);
    renderer.setPixelRatio(pr);
    composer.setPixelRatio(pr);
    composer.setSize(window.innerWidth, window.innerHeight);
    if (ripples) ripples.group.visible = high;
    carA.userData.beam.opacity = high ? 0.055 : 0.03;
    carB.userData.beam.opacity = high ? 0.055 : 0.03;
  }

  window.addEventListener('resize', resize);

  const carPassCallback = (fn) => {
    onCarPass.fn = fn;
  };

  function render() {
    composer.render();
  }

  return {
    scene,
    camera,
    renderer,
    composer,
    world,
    rain,
    stalls: stallRefs,
    stage: stageRef,
    hitboxes: interactiveHitboxes,
    update,
    render,
    resize,
    setFx,
    getStallViews,
    releaseLantern,
    setStallVisited,
    setFinaleUnlocked,
    triggerGoldenKoi,
    onCarPass: carPassCallback,
    entranceZ: 14.5,
    isLow,
    rendererInfo: () => ({
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    }),
  };
}
