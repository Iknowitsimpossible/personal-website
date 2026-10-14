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
const PAPER = '240, 245, 250'; // --paper

const LAYER_DEPTH = [0.25, 0.55, 1];
const CURSOR_RADIUS = 150;
const CONSTELLATION_DEPTH = 0.3;

// Where each constellation sits, as fractions of the screen. They live in the
// side margins so their lines stay clear of the text column on wide screens.
const PLACEMENTS: Record<string, { x: number; y: number }> = {
  Cassiopeia: { x: 0.1, y: 0.17 },
  Cygnus: { x: 0.1, y: 0.5 },
  Lyra: { x: 0.13, y: 0.8 },
  'Ursa Major': { x: 0.87, y: 0.17 },
  Leo: { x: 0.88, y: 0.5 },
  Orion: { x: 0.9, y: 0.8 },
};

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
    textBoxes = [...document.querySelectorAll('main :is(h1, h2, h3, p, li, a, img)')].map((element) => {
      const box = element.getBoundingClientRect();
      return {
        left: box.left - pad,
        right: box.right + pad,
        top: box.top + window.scrollY - pad,
        bottom: box.bottom + window.scrollY + pad,
      };
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

  // Each constellation's figure fades in (0 → 1) while the mouse is near it.
  const constellations = CONSTELLATIONS.map((constellation) => {
    const points = projectConstellation(constellation);
    return {
      ...constellation,
      points,
      extent: Math.max(...points.map((point) => Math.hypot(point.x, point.y))),
      reveal: 0,
    };
  });

  function rectCoversText(left: number, top: number, right: number, bottom: number) {
    return textBoxes.some(
      (box) =>
        left < box.right && right > box.left && top + window.scrollY < box.bottom && bottom + window.scrollY > box.top,
    );
  }

  function drawConstellations(time: number) {
    // Degrees to pixels: roomier on wide screens, never huge.
    const scale = Math.min(7.5, Math.max(4, width / 200));
    // Touch screens and reduced motion can't hover, so show the figures faintly.
    const resting = coarsePointer || reducedMotion.matches ? 0.35 : 0;

    for (const constellation of constellations) {
      const place = PLACEMENTS[constellation.name];
      const centerX = place.x * width + parallax.x * CONSTELLATION_DEPTH * 14;
      const centerY =
        ((place.y * height - window.scrollY * CONSTELLATION_DEPTH * 0.06 + parallax.y * CONSTELLATION_DEPTH * 10) %
          height +
          height) %
        height;
      const stars = constellation.points.map((point) => ({
        x: centerX + point.x * scale,
        y: centerY + point.y * scale,
        mag: point.mag,
      }));

      const radius = constellation.extent * scale;
      const hovered = mouse.active && Math.hypot(mouse.x - centerX, mouse.y - centerY) < radius + 40;
      const target = Math.max(resting, hovered ? 1 : 0);
      constellation.reveal += (target - constellation.reveal) * (reducedMotion.matches ? 1 : 0.07);
      const reveal = constellation.reveal;

      const xs = stars.map((star) => star.x);
      const ys = stars.map((star) => star.y);
      const left = Math.min(...xs);
      const right = Math.max(...xs);
      const top = Math.min(...ys);
      const bottom = Math.max(...ys);
      // On narrow screens a figure may land on text; keep its lines and name hidden then.
      const figureAllowed = !rectCoversText(left - 8, top - 8, right + 8, bottom + 24);

      if (figureAllowed && reveal > 0.01) {
        ctx.strokeStyle = `rgba(${ACCENT}, ${0.45 * reveal})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const [from, to] of constellation.lines) {
          ctx.moveTo(stars[from].x, stars[from].y);
          ctx.lineTo(stars[to].x, stars[to].y);
        }
        ctx.stroke();

        const label = constellation.name.toUpperCase();
        const labelX = (left + right) / 2;
        const labelY = bottom + 20;
        ctx.font = '500 10px "DM Sans", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '0.14em';
        // A patch of paper color behind the name, so stray stars can't land in it.
        const labelWidth = ctx.measureText(label).width + 10;
        ctx.fillStyle = `rgba(${PAPER}, ${reveal})`;
        ctx.fillRect(labelX - labelWidth / 2, labelY - 10, labelWidth, 14);
        ctx.fillStyle = `rgba(${INK}, ${0.6 * reveal})`;
        ctx.fillText(label, labelX, labelY);
        ctx.letterSpacing = '0px';
      }

      for (const [index, star] of stars.entries()) {
        if (star.y > frontRidge(star.x) - 4 || coversText(star.x, star.y)) continue;
        const twinkle = reducedMotion.matches ? 1 : 0.8 + 0.2 * Math.sin(time * 0.0012 + index * 1.7);
        const alpha = (0.42 + 0.4 * reveal) * twinkle;
        // Brighter catalog stars (smaller magnitude) draw larger.
        const size = Math.max(0.9, 2.5 - 0.4 * star.mag) + reveal * 0.4;
        ctx.fillStyle = `rgba(${INK}, ${alpha})`;
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
    ctx.fillStyle = `rgba(${ACCENT}, ${alpha})`;
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
    drawHill(backRidge, 0.08);
    drawHill(frontRidge, 0.14);
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
  });
  document.addEventListener('pointerleave', () => {
    mouse.active = false;
  });
  // Clicking empty sky sends a shooting star from that spot.
  window.addEventListener('click', (event) => {
    if (reducedMotion.matches) return;
    if ((event.target as Element).closest('a, button, input, textarea, select')) return;
    if (window.getSelection()?.toString()) return;
    launchShootingStar(event.clientX, event.clientY);
  });
  window.addEventListener('scroll', () => reducedMotion.matches && draw(0), { passive: true });
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
