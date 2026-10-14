/**
 * Draws the night sky behind the home page and the projects list.
 *
 * Everything lives on one fixed canvas. The stars stay put while the page
 * scrolls, but the hills are anchored to the bottom of the page, so they rise
 * into view under the last section instead of covering text along the way. Stars sit in three depth layers: nearer layers move more with the
 * mouse and scroll (parallax), which is what makes the sky feel deep.
 * Reduced motion draws a single still frame; hidden tabs stop the loop.
 */

import { CONSTELLATIONS, projectConstellation } from './constellations';

const INK = '41, 68, 95'; // --ink
const ACCENT = '66, 107, 145'; // --accent
const WARM = '201, 146, 52'; // the gold of the star in the header portrait
const SAGE = '104, 146, 112'; // muted green for the hills

const LAYER_DEPTH = [0.25, 0.55, 1];
const CURSOR_RADIUS = 150;
// How far the mouse can wander from a constellation before it fades away.
const CONSTELLATION_LINGER = 70;

interface Star {
  x: number; // 0..1 across the sky
  y: number; // 0..1 down the sky (above the hills)
  layer: number;
  radius: number;
  alpha: number;
  phase: number;
  speed: number;
}

interface BrightStar {
  x: number;
  y: number;
  size: number;
  warm: boolean;
  phase: number;
}

interface ShootingStar {
  x: number;
  y: number;
  dx: number;
  dy: number;
  life: number; // 1 → 0
}

export function startNightSky(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let brightStars: BrightStar[] = [];
  const shootingStars: ShootingStar[] = [];

  // The mouse position eases toward its target so parallax glides, not jumps.
  const mouse = { x: -9999, y: -9999, active: false };
  const parallax = { x: 0, y: 0, targetX: 0, targetY: 0 };

  // Text blocks in page coordinates; stars skip these so no dot ever lands
  // on a letter and reads like a typo.
  let textBoxes: { left: number; right: number; top: number; bottom: number }[] = [];
  function measureText() {
    const pad = 6;
    const range = document.createRange();
    textBoxes = [...document.querySelectorAll('main :is(h1, h2, h3, p, li, img, svg)')].flatMap((element) => {
      // A paragraph's own box spans the whole column even when a line is short,
      // so measure each rendered line of text instead.
      range.selectNodeContents(element);
      const rects = element.matches('img, svg') ? [element.getBoundingClientRect()] : [...range.getClientRects()];
      return rects
        .filter((box) => box.width > 0 && box.height > 0)
        .map((box) => ({
          left: box.left - pad,
          right: box.right + pad,
          top: box.top + window.scrollY - pad,
          bottom: box.bottom + window.scrollY + pad,
        }));
    });
  }
  function coversText(x: number, y: number) {
    const pageY = y + window.scrollY;
    return textBoxes.some((box) => x > box.left && x < box.right && pageY > box.top && pageY < box.bottom);
  }

  let frame = 0;
  let lastTime = 0;
  let drift = 0;
  let nextShootingStar = 4000;

  function hillHeight() {
    return Math.min(170, height * 0.17);
  }

  // The bottom of the page, in viewport coordinates. Measured once per
  // frame, because reading layout for every star would be slow.
  let groundY = 0;
  function measureGround() {
    groundY = document.documentElement.scrollHeight - window.scrollY;
  }
  function ground() {
    return groundY;
  }

  // Front ridge, peaking where the telescope and laptop sit (about 78% across).
  function frontRidge(x: number) {
    const h = hillHeight();
    const peak = Math.exp(-((x / width - 0.78) ** 2) / 0.07);
    return ground() - h * (0.42 + 0.48 * peak + 0.04 * Math.sin(x / 90));
  }

  function backRidge(x: number) {
    const h = hillHeight();
    const peak = Math.exp(-((x / width - 0.28) ** 2) / 0.09);
    return ground() - h * (0.62 + 0.45 * peak + 0.03 * Math.sin(x / 140 + 1));
  }

  function createStars() {
    const area = width * height;
    const count = Math.min(coarsePointer ? 110 : 240, Math.round(area / (coarsePointer ? 11000 : 7000)));
    stars = Array.from({ length: count }, () => {
      const layer = Math.random() < 0.55 ? 0 : Math.random() < 0.7 ? 1 : 2;
      return {
        x: Math.random(),
        y: Math.random(),
        layer,
        radius: 0.5 + layer * 0.45 + Math.random() * 0.6,
        alpha: 0.18 + layer * 0.12 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2,
        speed: 0.6 + Math.random() * 1.4,
      };
    });
    brightStars = Array.from({ length: coarsePointer ? 3 : 5 }, (_, index) => ({
      x: 0.08 + Math.random() * 0.84,
      y: 0.05 + Math.random() * 0.55,
      size: 5 + Math.random() * 4,
      warm: index === 0,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!stars.length) createStars();
    measureText();
    if (reducedMotion.matches) draw(0);
  }

  // Where a star appears on screen after drift, scroll and mouse parallax.
  function starPosition(star: { x: number; y: number }, depth: number) {
    const skyHeight = height;
    const scrollShift = window.scrollY * depth * 0.06;
    const x = ((star.x * width + drift * depth + parallax.x * depth * 14) % width + width) % width;
    const y = ((star.y * skyHeight - scrollShift + parallax.y * depth * 10) % skyHeight + skyHeight) % skyHeight;
    return { x, y };
  }

  function launchShootingStar(fromX?: number, fromY?: number) {
    const angle = Math.PI * (0.78 + Math.random() * 0.1); // heading down-left
    const speed = 0.9 + Math.random() * 0.5;
    shootingStars.push({
      x: fromX ?? width * (0.35 + Math.random() * 0.6),
      y: fromY ?? height * Math.random() * 0.35,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed, // canvas y grows downward
      life: 1,
    });
  }

  function drawStars(time: number) {
    for (const star of stars) {
      const { x, y } = starPosition(star, LAYER_DEPTH[star.layer]);
      if (y > frontRidge(x) - 4) continue; // stars never shine through the hill
      if (coversText(x, y)) continue;

      const twinkle = reducedMotion.matches ? 1 : 0.65 + 0.35 * Math.sin(time * 0.001 * star.speed + star.phase);
      let alpha = star.alpha * twinkle;
      let radius = star.radius;

      if (mouse.active) {
        const distance = Math.hypot(x - mouse.x, y - mouse.y);
        if (distance < CURSOR_RADIUS) {
          const closeness = 1 - distance / CURSOR_RADIUS;
          alpha += closeness * 0.5;
          radius += closeness * 0.9;
        }
      }

      ctx.fillStyle = `rgba(${INK}, ${Math.min(alpha, 0.9)})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Four-point glints, echoing the star in the header portrait.
  function drawBrightStars(time: number) {
    for (const star of brightStars) {
      const { x, y } = starPosition(star, 0.4);
      if (y > frontRidge(x) - 10 || coversText(x, y)) continue;
      const pulse = reducedMotion.matches ? 1 : 0.8 + 0.2 * Math.sin(time * 0.0008 + star.phase);
      const size = star.size * pulse;
      const color = star.warm ? WARM : INK;

      ctx.fillStyle = `rgba(${color}, ${star.warm ? 0.75 : 0.5})`;
      ctx.beginPath();
      ctx.moveTo(x, y - size);
      ctx.quadraticCurveTo(x, y, x + size * 0.7, y);
      ctx.quadraticCurveTo(x, y, x, y + size);
      ctx.quadraticCurveTo(x, y, x - size * 0.7, y);
      ctx.quadraticCurveTo(x, y, x, y - size);
      ctx.fill();
    }
  }

  // Real constellations, flattened once up front (in degrees around their centers).
  const catalog = CONSTELLATIONS.map((constellation) => {
    const points = projectConstellation(constellation);
    return { ...constellation, points, extent: Math.max(...points.map((p) => Math.hypot(p.x, p.y))) };
  });
  type CatalogEntry = (typeof catalog)[number];

  // Constellations currently drawn around the cursor. Each fades in (reveal
  // 0 → 1), then fades out once the mouse moves away.
  interface ShownConstellation {
    entry: CatalogEntry;
    x: number;
    y: number;
    anchorX: number; // where the mouse was when it formed
    anchorY: number;
    reach: number; // how far the mouse can roam before it fades
    scale: number;
    angle: number;
    reveal: number;
    fading: boolean;
  }
  let shown: ShownConstellation[] = [];
  let lastPick = -1;

  function rectCoversText(left: number, top: number, right: number, bottom: number) {
    return textBoxes.some(
      (box) =>
        left < box.right && right > box.left && top + window.scrollY < box.bottom && bottom + window.scrollY > box.top,
    );
  }

  // A constellation's stars in screen pixels, rotated and scaled into place.
  function placeStars(item: Pick<ShownConstellation, 'entry' | 'x' | 'y' | 'scale' | 'angle'>) {
    const cos = Math.cos(item.angle);
    const sin = Math.sin(item.angle);
    return item.entry.points.map((point) => ({
      x: item.x + (point.x * cos - point.y * sin) * item.scale,
      y: item.y + (point.x * sin + point.y * cos) * item.scale,
      mag: point.mag,
    }));
  }

  function bounds(stars: { x: number; y: number }[]) {
    const xs = stars.map((star) => star.x);
    const ys = stars.map((star) => star.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }

  // Forms a new constellation around (x, y), unless one is already there.
  function revealConstellationAt(x: number, y: number) {
    // Distances are measured from where each figure formed, not its center,
    // because a figure may have been nudged sideways to stay off the text.
    const awayFrom = (item: ShownConstellation) => Math.hypot(x - item.anchorX, y - item.anchorY) > item.reach;
    for (const item of shown) if (awayFrom(item)) item.fading = true;
    if (shown.some((item) => !item.fading)) return;

    // Pick a constellation that isn't on screen right now, never the same one twice in a row.
    const onScreen = new Set(shown.map((item) => item.entry.name));
    const choices = catalog.map((_, index) => index).filter((index) => index !== lastPick && !onScreen.has(catalog[index].name));
    if (!choices.length) return;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    const entry = catalog[pick];

    // Every figure spans about the same area around the cursor, whatever its real size.
    const scale = (95 + Math.random() * 30) / entry.extent;
    const angle = (Math.random() - 0.5) * 0.5; // a small tilt, like the sky turning
    const reach = entry.extent * scale * 0.6;
    // Try centering on the cursor first, then nudge sideways to stay off the text.
    const offsets = [[0, 0], [reach, 0], [-reach, 0], [0, -reach], [0, reach]];
    for (const [dx, dy] of offsets) {
      const candidate = { entry, x: x + dx, y: y + dy, scale, angle };
      const box = bounds(placeStars(candidate));
      const onScreenFully = box.left > 8 && box.right < width - 8 && box.top > 8 && box.bottom + 8 < height;
      if (!onScreenFully || rectCoversText(box.left - 8, box.top - 8, box.right + 8, box.bottom + 8)) continue;

      shown.push({
        ...candidate,
        anchorX: x,
        anchorY: y,
        reach: Math.max(90, entry.extent * scale) + CONSTELLATION_LINGER,
        reveal: 0,
        fading: false,
      });
      lastPick = pick;
      return;
    }
  }

  function fadeAllConstellations() {
    for (const item of shown) item.fading = true;
  }

  function drawConstellations(time: number) {
    for (const item of shown) {
      const target = item.fading ? 0 : 1;
      item.reveal += (target - item.reveal) * (reducedMotion.matches ? 1 : 0.08);
    }
    shown = shown.filter((item) => !(item.fading && item.reveal < 0.01));

    // Drawn in the same style as ordinary stars and the faint lines that join
    // them, so the figure reads as part of the sky rather than a diagram.
    for (const item of shown) {
      const reveal = item.reveal;
      const stars = placeStars(item);

      ctx.strokeStyle = `rgba(${ACCENT}, ${0.3 * reveal})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (const [from, to] of item.entry.lines) {
        ctx.moveTo(stars[from].x, stars[from].y);
        ctx.lineTo(stars[to].x, stars[to].y);
      }
      ctx.stroke();

      for (const [index, star] of stars.entries()) {
        const twinkle = reducedMotion.matches ? 1 : 0.85 + 0.15 * Math.sin(time * 0.0012 + index * 1.7);
        // Brighter catalog stars (smaller magnitude) are a touch larger.
        const size = Math.max(1.1, 2.1 - 0.3 * star.mag);
        ctx.fillStyle = `rgba(${INK}, ${0.75 * reveal * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawShootingStars(elapsed: number) {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];
      star.x += star.dx * elapsed;
      star.y += star.dy * elapsed;
      star.life -= elapsed / 1300;
      if (star.life <= 0 || star.y > frontRidge(star.x)) {
        shootingStars.splice(i, 1);
        continue;
      }
      const tail = 90 * star.life + 20;
      const length = Math.hypot(star.dx, star.dy);
      ctx.strokeStyle = `rgba(${ACCENT}, ${0.7 * star.life})`;
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(star.x, star.y);
      ctx.lineTo(star.x - (star.dx / length) * tail, star.y - (star.dy / length) * tail);
      ctx.stroke();
    }
  }

  function drawHill(ridge: (x: number) => number, alpha: number) {
    const bottom = Math.max(height, ground());
    if (ground() - hillHeight() > height) return; // still below the screen
    ctx.fillStyle = `rgba(${SAGE}, ${alpha})`;
    ctx.beginPath();
    ctx.moveTo(0, bottom);
    for (let x = 0; x <= width + 8; x += 8) ctx.lineTo(x, ridge(x));
    ctx.lineTo(width, bottom);
    ctx.closePath();
    ctx.fill();
  }

  // Places a drawing on the front ridge, tilted to match the slope there,
  // with its local origin on the ground and y pointing down as usual.
  function drawOnRidge(fraction: number, drawShape: () => void) {
    const x = width * fraction;
    const y = frontRidge(x) + 1;
    if (y - 40 > height) return;
    const slope = Math.atan2(frontRidge(x + 10) - frontRidge(x - 10), 20);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(slope);
    ctx.scale(coarsePointer ? 0.95 : 1.2, coarsePointer ? 0.95 : 1.2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    drawShape();
    ctx.restore();
  }

  // A telescope on a tripod, aimed up and to the left at the sky.
  function drawTelescope() {
    ctx.strokeStyle = `rgba(${INK}, 0.55)`;
    ctx.fillStyle = `rgba(${INK}, 0.55)`;

    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -17); // tripod head
    ctx.lineTo(-9, 0);
    ctx.moveTo(0, -17);
    ctx.lineTo(8, 0);
    ctx.moveTo(0, -17);
    ctx.lineTo(2, 0);
    ctx.stroke();

    ctx.save();
    ctx.translate(0, -19);
    ctx.rotate(Math.PI + 0.62); // +x now points up-left, about 35° above the horizon
    ctx.beginPath(); // tube, slightly wider toward the lens
    ctx.moveTo(-9, -2.2);
    ctx.lineTo(21, -3.2);
    ctx.lineTo(21, 3.2);
    ctx.lineTo(-9, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(20, -4, 4, 8); // lens hood
    ctx.fillRect(-13, -1.2, 4, 2.4); // eyepiece
    ctx.lineWidth = 1.2;
    ctx.beginPath(); // finder scope
    ctx.moveTo(3, -4.8);
    ctx.lineTo(11, -5.2);
    ctx.stroke();
    ctx.restore();
  }

  // An open laptop with a small rising chart on its screen.
  function drawLaptop() {
    ctx.fillStyle = `rgba(${INK}, 0.5)`;
    ctx.beginPath(); // keyboard base
    ctx.moveTo(-11, 0);
    ctx.lineTo(11, 0);
    ctx.lineTo(10, -2);
    ctx.lineTo(-10, -2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(${WARM}, 0.16)`; // the screen's glow
    ctx.fillRect(-9, -15, 18, 13);
    ctx.strokeStyle = `rgba(${INK}, 0.55)`;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-9, -15, 18, 13);

    ctx.strokeStyle = `rgba(${ACCENT}, 0.8)`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-6.5, -4.5);
    ctx.lineTo(-3, -7);
    ctx.lineTo(0, -6);
    ctx.lineTo(3, -9.5);
    ctx.lineTo(6.5, -12);
    ctx.stroke();
    ctx.fillStyle = `rgba(${WARM}, 0.9)`;
    ctx.beginPath();
    ctx.arc(6.5, -12, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw(time: number) {
    measureGround();
    ctx.clearRect(0, 0, width, height);
    drawStars(time);
    drawBrightStars(time);
    drawConstellations(time);
    drawHill(backRidge, 0.12);
    drawHill(frontRidge, 0.2);
    drawOnRidge(0.765, drawTelescope);
    drawOnRidge(0.815, drawLaptop);
  }

  function tick(time: number) {
    const elapsed = Math.min(time - (lastTime || time), 50);
    lastTime = time;

    drift += elapsed * 0.004; // the sky turns very slowly
    parallax.x += (parallax.targetX - parallax.x) * 0.05;
    parallax.y += (parallax.targetY - parallax.y) * 0.05;

    nextShootingStar -= elapsed;
    if (nextShootingStar <= 0) {
      launchShootingStar();
      nextShootingStar = 7000 + Math.random() * 9000;
    }

    draw(time);
    drawShootingStars(elapsed);
    frame = requestAnimationFrame(tick);
  }

  function start() {
    cancelAnimationFrame(frame);
    if (reducedMotion.matches || document.hidden) {
      draw(0);
      return;
    }
    lastTime = 0;
    frame = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.active = true;
    parallax.targetX = event.clientX / width - 0.5;
    parallax.targetY = event.clientY / height - 0.5;
    revealConstellationAt(event.clientX, event.clientY);
    if (reducedMotion.matches) draw(0); // no animation loop runs, so draw now
  });
  document.addEventListener('pointerleave', () => {
    mouse.active = false;
    fadeAllConstellations();
  });
  // Clicking empty sky sends a shooting star from that spot. Touch screens
  // can't hover, so a tap there also draws a constellation.
  window.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a, button, input, textarea, select')) return;
    if (window.getSelection()?.toString()) return;
    if (coarsePointer) revealConstellationAt(event.clientX, event.clientY);
    if (reducedMotion.matches) draw(0);
    else launchShootingStar(event.clientX, event.clientY);
  });
  // Scrolling slides text under a figure that was placed to avoid it, so let it go.
  window.addEventListener(
    'scroll',
    () => {
      fadeAllConstellations();
      if (reducedMotion.matches) draw(0);
    },
    { passive: true },
  );
  document.addEventListener('visibilitychange', start);
  reducedMotion.addEventListener('change', start);

  resize();
  start();
  // Web fonts change line wrapping once they load, which moves the text.
  document.fonts?.ready.then(() => {
    measureText();
    if (reducedMotion.matches) draw(0);
  });
}
