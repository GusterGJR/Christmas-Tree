const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

const state = {
  width: window.innerWidth,
  height: window.innerHeight,
  particles: [],
  targets: [],
  hand: null,
  mode: "scatter",
  pointer: { x: 0.5, y: 0.5, active: false },
  time: 0,
  snow: [],
};

const SETTINGS = {
  count: 2200,
  gatherStrength: 0.015,
  scatterStrength: 0.018,
  friction: 0.70,
  camera: 800,
  scatterDepth: 1000,
  treeDepth: 140,
  driftStrength: 0.9,
  windStrength: 0.50,
  ornamentRatio: 1.20,
  accentCount: 140, // 140
  starCount: 300, // 260
  ringCount: 8, // 5
  wanderStrength: 0.60, // 0.18
  bellCount: 90,
  snowCount: 180,
};

const resize = () => {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  canvas.width = state.width * window.devicePixelRatio;
  canvas.height = state.height * window.devicePixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
};

const generateTreeTargets = (count) => {
  const targets = [];
  const centerX = state.width * 0.55;
  const baseY = state.height * 0.86;
  const height = state.height * 0.72;
  const treeRadius = state.width * 0.10; // 0.15
  const layers = 8;
  for (let i = 0; i < count; i += 1) {
    const t = Math.random();
    const eased = Math.pow(1 - t, 1.55);
    const y = baseY - t * height;
    const layer = Math.floor(t * layers);
    const layerT = (t * layers) % 1;
    const swirl = (layer * 1.1 + layerT * 2.2) * Math.PI;
    const radius =
      eased * treeRadius * (0.95 + Math.sin(t * 8) * 0.08) +
      Math.sin(t * 18) * 4;
    const angle = swirl + Math.random() * 0.5;
    const x = centerX + Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.35 + (Math.random() - 0.5) * 20;
    targets.push({ x, y, z, kind: "tree" });
  }
  return targets;
};

const buildStarPolygon = (cx, cy, outer, inner) => {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const radius = i % 2 === 0 ? outer : inner;
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }
  return points;
};

const pointInPolygon = (x, y, polygon) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;
    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi + 0.00001) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
};

const generateStarTargets = () => {
  const targets = [];
  const cx = state.width * 0.55;
  const cy = state.height * 0.18;
  const outer = 42;
  const inner = 18;
  const polygon = buildStarPolygon(cx, cy, outer, inner);
  const minX = cx - outer;
  const maxX = cx + outer;
  const minY = cy - outer;
  const maxY = cy + outer;
  let attempts = 0;
  while (targets.length < SETTINGS.starCount && attempts < SETTINGS.starCount * 20) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    attempts += 1;
    if (pointInPolygon(x, y, polygon)) {
      const z = (Math.random() - 0.5) * 22;
      targets.push({ x, y, z, kind: "star" });
    }
  }
  return targets;
};

const generateRingTargets = () => {
  const targets = [];
  const centerX = state.width * 0.55;
  const baseY = state.height * 0.96; // 0.86
  const height = state.height * 0.7;
  for (let r = 0; r < SETTINGS.ringCount; r += 1) {
    const t = 0.15 + (r / SETTINGS.ringCount) * 0.7;
    const ringY = baseY - t * height;
    const radius = (1 - t) * (state.width * 0.16);
    const ringPoints = 36;
    for (let i = 0; i < ringPoints; i += 1) {
      const angle = (i / ringPoints) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.3;
      targets.push({ x, y: ringY, z, kind: "ornament" });
    }
  }
  return targets;
};

const generateBellTargets = () => {
  const targets = [];
  const centerX = state.width * 0.55;
  const baseY = state.height * 0.86;
  const height = state.height * 0.76;
  const clusters = 4;
  for (let c = 0; c < clusters; c += 1) {
    const t = 0.25 + (c / clusters) * 0.5;
    const y = baseY - t * height;
    const radius = (1 - t) * (state.width * 0.13);
    const angle = Math.random() * Math.PI * 2;
    const cx = centerX + Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius * 0.35;
    const clusterSize = Math.floor(SETTINGS.bellCount / clusters);
    for (let i = 0; i < clusterSize; i += 1) {
      const spread = 12;
      targets.push({
        x: cx + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        z: cz + (Math.random() - 0.5) * spread * 0.5,
        kind: "bell",
      });
    }
  }
  return targets;
};

const generateAccentTargets = () => {
  const targets = [];
  const centerX = state.width * 0.55;
  const baseY = state.height * 0.86;
  const height = state.height * 0.7;
  const clusters = 6;
  for (let c = 0; c < clusters; c += 1) {
    const t = 0.2 + (c / clusters) * 0.6 + (Math.random() - 0.5) * 0.05;
    const y = baseY - t * height;
    const radius = (1 - t) * (state.width * 0.15);
    const angle = Math.random() * Math.PI * 2;
    const cx = centerX + Math.cos(angle) * radius;
    const cz = Math.sin(angle) * radius * 0.35;
    const clusterSize = Math.floor(SETTINGS.accentCount / clusters);
    for (let i = 0; i < clusterSize; i += 1) {
      const spread = 10 + Math.random() * 10;
      targets.push({
        x: cx + (Math.random() - 0.5) * spread,
        y: y + (Math.random() - 0.5) * spread,
        z: cz + (Math.random() - 0.5) * spread * 0.6,
        kind: "accent",
      });
    }
  }
  return targets;
};

const randomScatterTarget = () => {
  const spreadX = state.width * 0.9;
  const spreadY = state.height * 0.9;
  return {
    x: state.width * 0.5 + (Math.random() - 0.5) * spreadX,
    y: state.height * 0.5 + (Math.random() - 0.5) * spreadY,
    z: (Math.random() - 0.5) * SETTINGS.scatterDepth,
  };
};

const buildTargets = () => {
  const ringTargets = generateRingTargets();
  const starTargets = generateStarTargets();
  const bellTargets = generateBellTargets();
  const accentTargets = generateAccentTargets();
  const treeCount = Math.max(
    SETTINGS.count -
      ringTargets.length -
      starTargets.length -
      bellTargets.length -
      accentTargets.length,
    0
  );
  const treeTargets = generateTreeTargets(treeCount);
  state.targets = treeTargets.concat(
    ringTargets,
    bellTargets,
    accentTargets,
    starTargets
  );
};

const assignScatterTargets = () => {
  state.particles.forEach((particle) => {
    const target = randomScatterTarget();
    particle.tx = target.x;
    particle.ty = target.y;
    particle.tz = target.z;
  });
};

const createParticles = () => {
  state.particles = Array.from({ length: SETTINGS.count }, (_, index) => {
    const target = state.targets[index % state.targets.length] || {
      x: state.width * 0.5,
      y: state.height * 0.5,
      z: 0,
      kind: "tree",
    };
    const start = randomScatterTarget();
    const ornamentChance = Math.random();
    return {
      x: start.x,
      y: start.y,
      z: start.z,
      vx: 0,
      vy: 0,
      vz: 0,
      tx: target.x,
      ty: target.y,
      tz: target.z,
      hue:
        target.kind === "star"
          ? 48
          : target.kind === "bell"
          ? 44 + Math.random() * 8
          : target.kind === "accent"
          ? Math.random() > 0.5
            ? 2 + Math.random() * 8
            : 0
          : 118 + Math.random() * 40,
      kind:
        target.kind === "star"
          ? "star"
          : target.kind === "bell"
          ? "bell"
          : target.kind === "ornament" ||
            ornamentChance < SETTINGS.ornamentRatio
          ? "ornament"
          : target.kind === "accent"
          ? "accent"
          : "tree",
      seed: Math.random() * 1000,
      twinkle: Math.random() * Math.PI * 2,
    };
  });
};

const drawBackground = () => {
  ctx.clearRect(0, 0, state.width, state.height);
  const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
  gradient.addColorStop(0, "rgba(9, 18, 26, 0.9)");
  gradient.addColorStop(1, "rgba(5, 8, 12, 0.9)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
};

const updateParticles = () => {
  const windX = Math.sin(state.time * 0.00025) * SETTINGS.windStrength;
  const windY = Math.cos(state.time * 0.00035) * SETTINGS.windStrength * 0.5;
  state.particles.forEach((particle, index) => {
    const target = state.targets[index % state.targets.length];
    if (state.mode === "gather") {
      particle.tx = target.x;
      particle.ty = target.y;
      particle.tz = target.z;
    }

    const dx = particle.tx - particle.x;
    const dy = particle.ty - particle.y;
    const dz = particle.tz - particle.z;
    const strength =
      state.mode === "gather"
        ? SETTINGS.gatherStrength
        : SETTINGS.scatterStrength;
    particle.vx += dx * strength;
    particle.vy += dy * strength;
    particle.vz += dz * strength;

    if (state.mode === "scatter") {
      const drift =
        Math.sin(state.time * 0.00035 + particle.seed) *
        Math.cos(state.time * 0.00028 + particle.seed * 1.3);
      const swirl = Math.sin(state.time * 0.00042 + particle.seed * 0.7);
      particle.vx += (drift + windX) * SETTINGS.wanderStrength;
      particle.vy += (swirl + windY) * SETTINGS.wanderStrength * 0.6;
      particle.vz += Math.cos(state.time * 0.0003 + particle.seed) * 0.12;
    }

    particle.vx *= SETTINGS.friction;
    particle.vy *= SETTINGS.friction;
    particle.vz *= SETTINGS.friction;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.z += particle.vz;
  });
};

const project = (particle) => {
  const cx = state.width * 0.5;
  const cy = state.height * 0.5;
  const scale = SETTINGS.camera / (SETTINGS.camera + particle.z);
  return {
    x: (particle.x - cx) * scale + cx,
    y: (particle.y - cy) * scale + cy,
    scale,
  };
};

const drawParticles = () => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  state.particles.forEach((particle) => {
    const projected = project(particle);
    const depthAlpha = Math.min(1, projected.scale);
    const twinkle =
      0.85 +
      0.15 * Math.sin(state.time * 0.0012 + particle.twinkle + particle.seed);
    let alpha =
      (state.mode === "gather" ? 0.9 : 0.7) * depthAlpha * twinkle;
    let size = Math.max(0.7, 1.6 * projected.scale);
    if (particle.kind === "ornament") {
      alpha = Math.min(1, alpha + 0.2);
      size *= 1.4;
      ctx.fillStyle = `hsla(${particle.hue}, 80%, 68%, ${alpha})`;
    } else if (particle.kind === "accent") {
      alpha = Math.min(1, alpha + 0.2);
      size *= 1.3;
      const lightness = particle.hue === 0 ? 88 : 62;
      ctx.fillStyle = `hsla(${particle.hue}, 75%, ${lightness}%, ${alpha})`;
    } else if (particle.kind === "bell") {
      alpha = Math.min(1, alpha + 0.25);
      size *= 1.6;
      ctx.fillStyle = `hsla(45, 85%, 70%, ${alpha})`;
    } else if (particle.kind === "star") {
      alpha = Math.min(1, alpha + 0.3);
      size *= 1.8;
      ctx.fillStyle = `hsla(50, 90%, 75%, ${alpha})`;
    } else {
      ctx.fillStyle = `hsla(${particle.hue}, 65%, 62%, ${alpha})`;
    }
    ctx.beginPath();
    ctx.arc(
      projected.x,
      projected.y,
      size,
      0,
      Math.PI * 2
    );
    ctx.fill();

  });
  ctx.restore();
};

const initSnow = () => {
  state.snow = Array.from({ length: SETTINGS.snowCount }, () => ({
    x: Math.random() * state.width,
    y: Math.random() * state.height,
    z: Math.random() * SETTINGS.scatterDepth * 0.6,
    speed: 0.4 + Math.random() * 0.6,
    drift: Math.random() * Math.PI * 2,
  }));
};

const updateSnow = () => {
  state.snow.forEach((flake) => {
    flake.y += flake.speed;
    flake.x += Math.sin(state.time * 0.0004 + flake.drift) * 0.4;
    if (flake.y > state.height + 20) {
      flake.y = -10;
      flake.x = Math.random() * state.width;
      flake.z = Math.random() * SETTINGS.scatterDepth * 0.6;
    }
  });
};

const drawSnow = () => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  state.snow.forEach((flake) => {
    const projected = project(flake);
    const alpha = 0.45 * Math.min(1, projected.scale);
    const size = Math.max(0.6, 1.3 * projected.scale);
    ctx.fillStyle = `hsla(0, 0%, 95%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
};

const drawFog = () => {
  const gradient = ctx.createRadialGradient(
    state.width * 0.2,
    state.height * 0.2,
    0,
    state.width * 0.2,
    state.height * 0.2,
    state.width * 0.8
  );
  gradient.addColorStop(0, "rgba(95, 160, 210, 0.12)");
  gradient.addColorStop(0.6, "rgba(12, 24, 36, 0)");
  gradient.addColorStop(1, "rgba(5, 8, 12, 0.25)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, state.width, state.height);
};

const tick = () => {
  state.time = performance.now();
  drawBackground();
  updateSnow();
  updateParticles();
  drawParticles();
  drawSnow();
  drawFog();
  requestAnimationFrame(tick);
};

const setMode = (nextMode) => {
  if (state.mode === nextMode) {
    return;
  }
  state.mode = nextMode;
  if (nextMode === "scatter") {
    assignScatterTargets();
  }
};

const isFist = (landmarks) => {
  const wrist = landmarks[0];
  const palm = landmarks[9];
  const palmSize = Math.hypot(palm.x - wrist.x, palm.y - wrist.y);
  const tips = [8, 12, 16, 20];
  const avgTipDistance =
    tips.reduce((sum, idx) => {
      const tip = landmarks[idx];
      return sum + Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    }, 0) / tips.length;
  return avgTipDistance < palmSize * 0.7;
};

const setModeFromGesture = (landmarks) => {
  if (!landmarks || landmarks.length === 0) {
    setMode("scatter");
    state.hand = null;
    return;
  }
  if (isFist(landmarks)) {
    setMode("gather");
  } else {
    setMode("scatter");
  }
  state.hand = { x: landmarks[9].x, y: landmarks[9].y };
};

const setupHandTracking = () => {
  const video = document.createElement("video");
  const hands = new Hands({
    locateFile: (file) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });
  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6,
  });
  hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
      setModeFromGesture(results.multiHandLandmarks[0]);
    } else {
      state.hand = null;
      setMode("scatter");
    }
  });

  const camera = new Camera(video, {
    onFrame: async () => {
      await hands.send({ image: video });
    },
    width: 640,
    height: 480,
  });
  camera.start();
};

const setupPointerFallback = () => {
  const updatePointer = (event) => {
    const x = event.clientX / state.width;
    const y = event.clientY / state.height;
    state.pointer = { x, y, active: true };
  };
  const resetPointer = () => {
    state.pointer.active = false;
  };
  window.addEventListener("pointermove", updatePointer);
  window.addEventListener("pointerdown", (event) => {
    updatePointer(event);
    setMode("gather");
  });
  window.addEventListener("pointerup", () => {
    setMode("scatter");
    resetPointer();
  });
  window.addEventListener("pointerleave", resetPointer);
};

resize();
buildTargets();
createParticles();
assignScatterTargets();
initSnow();
setupPointerFallback();
setupHandTracking();
tick();

window.addEventListener("resize", () => {
  resize();
  buildTargets();
  createParticles();
  assignScatterTargets();
  initSnow();
});
