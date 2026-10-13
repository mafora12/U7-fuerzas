const { Engine, Bodies, Body, Composite, Constraint } = Matter;
const FONT = '"IM Fell DW Pica","IM Fell English",Georgia,serif';
const BONE = [233, 227, 207];
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEED = REDUCED ? 0.3 : 1;
const SALA = location.hash === '#sala'; // pantalla del museo

/* ---------- Parámetros del sistema (edítalos para la bitácora) ---------- */
const P = {
  ofelia: {
    strands: 4,        // pasadas del mouse para romper la cuerda
    passMinSpeed: 3,   // velocidad mínima del mouse para que una pasada cuente
    push: 0.25,        // cuánto empuja cada pasada
    buoyancy: 2.0,     // 2.0 = queda en reposo con la mitad hundida
    morphFrames: 240,  // frames bajo el agua para que el círculo se abra en O
    restFrames: 50,    // frames quieta para darla por formada
    holdAfter: 120,    // frames que se queda la O antes de que suba el agua
    idleWind: 20       // (solo sala) segundos sin nadie antes de que el viento la empuje
  },
  pia: {
    depth: 0.45,       // cuánto se clava la torre en el lodo (en alturas de letra)
    fallFrames: 75,    // frames que tarda Pía en caer con la torre
    fuseFrames: 55,    // frames en que torre y círculo se funden en la P
    holdAfter: 120,
    idleWind: 20       // (solo sala) segundos sin nadie antes de que el castillo caiga solo
  },
  flood: { accel: 0.12, max: 10 }, // el agua que sube entre escenas
  drain: 0.035                     // velocidad con que baja al empezar la escena
};

const ESTILOS = {
  rio: { char: 'o', tint: '169,194,162', veil: '7,14,10', veilA: 0.45, reed: 'li', reedTint: '127,154,121',
         sky: ['#080f0b', '#18291d'], bed: ['#13231a', '#060c09'] },
  pantano: { char: 'p', tint: '158,150,98', veil: '17,16,8', veilA: 0.8, reed: 'lft', reedTint: '111,106,69',
             sky: ['#0b0b07', '#1c1b11'], bed: ['#1f1d10', '#080804'] }
};

let engine, ctx, W, H, S, surfaceY = 0, reeds = [], rowPats = {}, glifos = {};
let ready = false, scene = null, sceneIndex = 0, phase = 'play', floodV = 0;
let showRules = false, t = 0, ripple = 0, fade = 1, shake = 0;
const pointer = { x: -999, y: -999, vx: 0, vy: 0, on: false };
const results = {}; // memoria de cada letra para la escena final
const $ = id => document.getElementById(id);

function setup(){
  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent('stage');
  pixelDensity(Math.min(2, displayDensity()));
  ctx = drawingContext;
  engine = Engine.create();
  const el = cnv.elt;
  el.addEventListener('pointermove', e => {
    const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (pointer.on){ pointer.vx = x - pointer.x; pointer.vy = y - pointer.y; }
    pointer.x = x; pointer.y = y; pointer.on = true;
  });
  el.addEventListener('click', () => { if (phase === 'play' && scene.click) scene.click(pointer.x, pointer.y); });
  el.addEventListener('dblclick', () => { if (phase === 'play' && scene.dblclick) scene.dblclick(pointer.x, pointer.y); });
  el.addEventListener('pointerleave', () => { pointer.on = false; pointer.x = pointer.y = -999; });
  const wait = new Promise(r => setTimeout(r, 2500));
  Promise.race([document.fonts.load('100px "IM Fell DW Pica"'), wait])
    .then(() => document.fonts.ready).catch(() => {})
    .finally(() => { layout(); startScene(0, false); ready = true; });
}

function layout(){
  W = width; H = height;
  S = Math.min(W * 0.5, H * 0.34);
  glifos = { O: Glifo.make('O', S, BONE), P: Glifo.make('P', S, BONE) };
  reeds = [];
  for (let x = -10, k = 0; x < W + 20; k++){
    reeds.push({ x, k, h: S * (0.3 + ((k * 37) % 11) / 11 * 0.45), ph: k * 1.7 });
    x += S * (0.05 + ((k * 13) % 7) / 7 * 0.09);
  }
  ctx.font = `${S * 0.05}px ${FONT}`;
  for (const st of Object.values(ESTILOS)){
    const unit = st.char + '   ', uw = ctx.measureText(unit).width;
    rowPats[st.char] = { w: uw, str: unit.repeat(Math.ceil((W * 2) / uw) + 2) };
  }
}

function buildWorld(){
  Composite.clear(engine.world, false);
  Composite.add(engine.world, [
    Bodies.rectangle(W / 2, H + 100, W * 3, 200, { isStatic: true }),
    Bodies.rectangle(-60, H / 2, 120, H * 3, { isStatic: true }),
    Bodies.rectangle(W + 60, H / 2, 120, H * 3, { isStatic: true })
  ]);
}

/* ---------- Escenas: una por letra; la palabra solo aparece al final ---------- */
const SCENES = [makeOfelia, makePia,
  () => makeStub('H'), () => makeStub('E'), () => makeStub('L'), () => makeStub('I'), () => makeStub('A'), () => makeStub('final')];

// Entre escenas el agua sube hasta cubrir la pantalla y baja revelando la siguiente letra.
function startScene(i, fromFlood){
  sceneIndex = Math.min(i, SCENES.length - 1);
  buildWorld();
  scene = SCENES[sceneIndex]();
  if (fromFlood){ surfaceY = -S * 0.3; phase = 'drain'; }
  else { surfaceY = H * scene.level; phase = 'play'; }
}

function draw(){
  if (!ready || !scene) return;
  t++;
  pointer.vx *= 0.6; pointer.vy *= 0.6;

  if (phase === 'drain'){
    const target = H * scene.level;
    surfaceY += Math.max(1.2, (target - surfaceY) * P.drain);
    if (surfaceY >= target){ surfaceY = target; phase = 'play'; }
  } else if (phase === 'play' && scene.done){
    phase = 'flood'; floodV = 0; scene.freeze();
  } else if (phase === 'flood'){
    floodV = Math.min(P.flood.max, floodV + P.flood.accel);
    surfaceY -= floodV;
    ripple = Math.max(ripple, 5);
    if (surfaceY < -S * 0.3) startScene(sceneIndex + 1, true);
  }

  Engine.update(engine, 1000 / 60);
  scene.update(phase === 'play');
  ctx.save();
  if (shake > 0.3){ ctx.translate(random(-shake, shake), random(-shake, shake)); shake *= 0.85; }
  drawBack();
  scene.draw();
  drawFront();
  if (scene.drawTop) scene.drawTop();
  ctx.restore();

  if (fade > 0){ fade = Math.max(0, fade - 0.02); ctx.fillStyle = `rgba(11,21,16,${fade})`; ctx.fillRect(0, 0, W, H); }
  if (showRules && frameCount % 6 === 0){
    $('rules').innerHTML = scene.rules().map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('');
  }
}

/* ---------- Agua: hecha de letras ---------- */
function drawBack(){
  const st = scene.style;
  ctx.fillStyle = st.sky[1]; ctx.fillRect(0, 0, W, H);
  if (surfaceY > 0){
    const g = ctx.createLinearGradient(0, 0, 0, surfaceY);
    g.addColorStop(0, st.sky[0]); g.addColorStop(1, st.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, surfaceY);
    ctx.fillStyle = `rgb(${st.reedTint})`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const r of reeds){
      ctx.save(); ctx.translate(r.x, surfaceY + 6);
      ctx.rotate(Math.sin(t * 0.012 * SPEED + r.ph) * 0.05);
      ctx.globalAlpha = 0.18; ctx.font = `${r.h}px ${FONT}`; ctx.fillText(st.reed[r.k % st.reed.length], 0, 0);
      ctx.restore();
    }
  }
  const top = Math.max(surfaceY, 0);
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, st.bed[0]); g.addColorStop(1, st.bed[1]);
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, top, W, H - top);

  const rp = rowPats[st.char], lh = S * 0.08;
  ctx.font = `${S * 0.05}px ${FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = `rgb(${st.tint})`;
  for (let i = 1, y = surfaceY + lh; y < H + lh; i++, y += lh){
    if (y < 0) continue;
    ctx.globalAlpha = 0.18 * Math.max(0.15, 1 - (y - top) / (H - top + 1));
    const off = (t * (0.3 + (i % 9) * 0.07) * SPEED) % rp.w;
    ctx.fillText(rp.str, -off - (i % 2) * rp.w * 0.5, y);
  }
  ctx.globalAlpha = 1;
}

function drawFront(){
  const st = scene.style;
  ctx.fillStyle = `rgba(${st.veil},${st.veilA})`; ctx.fillRect(0, surfaceY, W, H - surfaceY + 10);
  if (surfaceY < -20) return;
  const cw = S * 0.04;
  ctx.font = `${S * 0.05}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgb(233,227,207)';
  const px = scene.center.x, R = scene.R;
  const shift = (t * 0.6 * SPEED) % cw;
  ripple *= 0.985;
  for (let x = -shift; x < W + cw; x += cw){
    const d = (x - px) / (R * 1.6);
    const bump = Math.exp(-d * d) * ripple * Math.sin(t * 0.18 - Math.abs(d) * 2);
    ctx.globalAlpha = 0.55;
    ctx.fillText(st.char, x, surfaceY + Math.sin(x * 0.018 + t * 0.05 * SPEED) * 3 + bump);
  }
  ctx.globalAlpha = 1;
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); layout(); startScene(sceneIndex, false); }

addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R'){ showRules = !showRules; $('rules').hidden = !showRules; }
  if (e.key === 'ArrowRight' && scene && phase === 'play') scene.done = true; // atajo para probar escenas
});
