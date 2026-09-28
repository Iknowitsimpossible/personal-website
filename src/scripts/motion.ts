/**
 * A small progressive-enhancement layer: content and navigation need no JS.
 * Wind gently displaces the illustration's foreground, instead of drawing
 * a separate scene. Pause, reduced motion, off-screen and hidden-tab states
 * all stop the animation loop.
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hero = document.querySelector<HTMLElement>('.hero');
const landscape = document.querySelector<HTMLElement>('.landscape');
const image = document.querySelector<HTMLImageElement>('.landscape img');
const canvas = document.querySelector<HTMLCanvasElement>('.wind-canvas');
const context = canvas?.getContext('2d');
// Decode a density-independent source: srcset changes an element's naturalWidth.
const texture = new Image();
function syncTexture() {
  const source = image?.currentSrc || image?.src;
  if (source && texture.src !== source) texture.src = source;
}
texture.addEventListener('load', () => {
  resize();
});
const toggle = document.querySelector<HTMLButtonElement>('.motion-toggle');
const cards = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
let userPaused = false;
try {
  userPaused = sessionStorage.getItem('portfolio-motion') === 'paused';
} catch {
  /* Storage is optional. */
}
let heroVisible = false;
let frame = 0;
let lastPaint = 0;
let elapsed = 0;
let width = 0;
let height = 0;
let scrollFrame = 0;
const motionAllowed = () => !reducedMotion.matches && !userPaused;
const canAnimate = () => motionAllowed() && heroVisible && !document.hidden;

function paint(time: number) {
  if (
    !context ||
    !canvas ||
    !texture.complete ||
    !texture.naturalWidth ||
    !width ||
    !height
  )
    return;
  context.clearRect(0, 0, width, height);
  const scale = Math.max(
    width / texture.naturalWidth,
    height / texture.naturalHeight,
  );
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  // Match the underlying image's object-position exactly at each breakpoint.
  const position = window.matchMedia('(max-width: 760px)').matches
    ? 0.82
    : 0.65;
  const sx = (texture.naturalWidth - sourceWidth) * position;
  const sy = (texture.naturalHeight - sourceHeight) * 0.5;
  const start = Math.floor(height * 0.77);
  for (let y = start; y < height; y += 3) {
    const depth = (y - start) / (height - start);
    const drift = Math.sin(time * 0.0012 + y * 0.027) * depth * 2.6;
    // Extra source width avoids transparent seams at the edges.
    const bandHeight = Math.min(4, height - y);
    context.drawImage(
      texture,
      sx,
      sy + y / scale,
      sourceWidth,
      bandHeight / scale,
      drift,
      y,
      width,
      bandHeight,
    );
  }
}
function animate(now: number) {
  if (!canAnimate()) {
    frame = 0;
    return;
  }
  if (now - lastPaint >= 42) {
    elapsed += Math.min(now - lastPaint, 80);
    paint(elapsed);
    lastPaint = now;
  }
  frame = requestAnimationFrame(animate);
}
function updateMotion() {
  const active = motionAllowed();
  document.documentElement.dataset.motion = active ? 'on' : 'off';
  if (toggle) {
    toggle.hidden = false;
    toggle.disabled = reducedMotion.matches;
    toggle.setAttribute('aria-pressed', String(active));
    const label = toggle.querySelector('[data-motion-label]');
    if (label)
      label.textContent = reducedMotion.matches
        ? 'Reduced motion'
        : active
          ? 'The breeze is on'
          : 'A quiet moment';
  }
  if (canAnimate() && !frame) {
    lastPaint = performance.now();
    frame = requestAnimationFrame(animate);
  }
  if (!canAnimate() && frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
  if (!active) {
    context?.clearRect(0, 0, width, height);
    if (landscape) landscape.style.transform = '';
    cards.forEach((card) => {
      card.style.setProperty('--reveal-y', '0px');
      card.style.setProperty('--reveal-turn', '0deg');
    });
  }
  updateScroll();
}
function resize() {
  if (!canvas || !landscape || !context) return;
  width = image?.clientWidth || landscape.clientWidth;
  height = image?.clientHeight || landscape.clientHeight;
  const pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  if (motionAllowed()) paint(elapsed);
}
function updateScroll() {
  if (!motionAllowed()) return;
  if (hero && landscape && heroVisible) {
    const displacement = Math.min(
      18,
      Math.max(0, -hero.getBoundingClientRect().top * 0.04),
    );
    landscape.style.transform = `translateY(${displacement}px)`;
  }
  cards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    const progress = Math.max(
      0,
      Math.min(
        1,
        (window.innerHeight - rect.top) / (window.innerHeight * 0.65),
      ),
    );
    card.style.setProperty('--reveal-y', `${(1 - progress) * 25}px`);
    card.style.setProperty(
      '--reveal-turn',
      `${(1 - progress) * (index % 2 ? -1.2 : 1.2)}deg`,
    );
  });
}
window.addEventListener(
  'scroll',
  () => {
    if (!scrollFrame && motionAllowed())
      scrollFrame = requestAnimationFrame(() => {
        updateScroll();
        scrollFrame = 0;
      });
  },
  { passive: true },
);
window.addEventListener(
  'resize',
  () => {
    resize();
    updateScroll();
  },
  { passive: true },
);
if (hero)
  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    updateMotion();
  }).observe(hero);
if (landscape) new ResizeObserver(resize).observe(landscape);
image?.addEventListener('load', syncTexture);
syncTexture();
toggle?.addEventListener('click', () => {
  userPaused = !userPaused;
  try {
    sessionStorage.setItem(
      'portfolio-motion',
      userPaused ? 'paused' : 'playing',
    );
  } catch {
    /* Storage is optional. */
  }
  updateMotion();
});
reducedMotion.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', updateMotion);
resize();
updateMotion();
