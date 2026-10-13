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
    holdAfter: 120,    // frames que se queda la O antes de bajar a la siguiente escena
    idleWind: 20       // (solo sala) segundos sin nadie antes de que el viento la empuje
  },
  pia: {
    height: 0.62,      // alto de la P respecto a la pantalla (el asta es una torre)
    buried: 0.14,      // parte del asta que queda clavada bajo el suelo
    rise: 46,          // frames que tarda el asta en salir del suelo y clavarse
    growFrames: 24,    // frames en que se forma el círculo con el clic
    fallFrames: 58,    // frames que tarda el círculo en caer a la punta del asta
    fuseFrames: 45,    // frames en que asta y círculo se funden en la P
    holdAfter: 120,
    idleWind: 20       // (solo sala) segundos sin nadie antes de que pase solo
  },
  descend: 150         // frames que dura el descenso de una escena a la siguiente
};

const ESTILOS = {
  rio: { char: 'o', tint: '169,194,162', veil: '7,14,10', veilA: 0.45, reed: 'li', reedTint: '127,154,121',
         sky: ['#080f0b', '#18291d'], bed: ['#13231a', '#060c09'] },
  tierra: { rigid: true, char: 'p', tint: '150,140,104', reed: '',
            sky: ['#060c09', '#141710'], bed: ['#1b1a12', '#0b0a07'] }
};

let engine, ctx, W, H, S, surfaceY = 0, reeds = [], rowPats = {}, glifos = {};
let ready = false, scene = null, next = null, sceneIndex = 0, phase = 'play', camT = 0;
let showRules = false, t = 0, ripple = 0, fade = 1;
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
  const at = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  el.addEventListener('click', e => { if (phase === 'play' && scene.click) scene.click(...at(e)); });
  el.addEventListener('dblclick', e => { if (phase === 'play' && scene.dblclick) scene.dblclick(...at(e)); });
  el.addEventListener('pointerleave', () => { pointer.on = false; pointer.x = pointer.y = -999; });
  const wait = new Promise(r => setTimeout(r, 2500));
  Promise.race([document.fonts.load('100px "IM Fell DW Pica"'), wait])
    .then(() => document.fonts.ready).catch(() => {})
    .finally(() => { layout(); startScene(0); ready = true; });
}

function layout(){
  W = width; H = height;
  S = Math.min(W * 0.5, H * 0.34);
  ctx.font = `100px ${FONT}`;
  const mp = ctx.measureText('P'), ghP = (mp.actualBoundingBoxAscent + mp.actualBoundingBoxDescent) / 100;
  const sizeP = Math.min(H * P.pia.height, W * 0.8) / ghP;
  glifos = { O: Glifo.make('O', S, BONE), P: Glifo.make('P', sizeP, BONE, 640) };
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

function createScene(i){
  buildWorld();
  const sc = SCENES[Math.min(i, SCENES.length - 1)]();
  sc.surf = H * sc.level;
  return sc;
}

function startScene(i){
  sceneIndex = Math.min(i, SCENES.length - 1);
  scene = createScene(sceneIndex);
  next = null; phase = 'play';
}

// Entre escenas la cámara baja: la escena anterior sube y sale, la siguiente entra desde abajo.
function draw(){
  if (!ready || !scene) return;
  t++;
  pointer.vx *= 0.6; pointer.vy *= 0.6;

  if (phase === 'play' && scene.done){
    scene.freeze();
    next = createScene(sceneIndex + 1);
    phase = 'descend'; camT = 0;
  }
  let off = 0;
  if (phase === 'descend'){
    camT = Math.min(1, camT + 1 / P.descend);
    off = smooth(camT) * H;
    if (camT >= 1){ scene = next; next = null; sceneIndex = Math.min(sceneIndex + 1, SCENES.length - 1); phase = 'play'; off = 0; }
  }

  Engine.update(engine, 1000 / 60);
  renderScene(scene, -off, phase === 'play');
  if (next) renderScene(next, H - off, false);

  if (fade > 0){ fade = Math.max(0, fade - 0.02); ctx.fillStyle = `rgba(11,21,16,${fade})`; ctx.fillRect(0, 0, W, H); }
  if (showRules && frameCount % 6 === 0){
    $('rules').innerHTML = scene.rules().map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('');
  }
}

function renderScene(sc, dy, interactive){
  surfaceY = sc.surf;
  sc.update(interactive);
  ctx.save(); ctx.translate(0, dy);
  drawBack(sc);
  sc.draw();
  drawFront(sc);
  ctx.restore();
}

/* ---------- Agua o tierra: hechas de letras ---------- */
function drawBack(sc){
  const st = sc.style;
  const g = ctx.createLinearGradient(0, 0, 0, surfaceY);
  g.addColorStop(0, st.sky[0]); g.addColorStop(1, st.sky[1]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (st.reed){
    ctx.fillStyle = `rgb(${st.reedTint})`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (const r of reeds){
      ctx.save(); ctx.translate(r.x, surfaceY + 6);
      ctx.rotate(Math.sin(t * 0.012 * SPEED + r.ph) * 0.05);
      ctx.globalAlpha = 0.18; ctx.font = `${r.h}px ${FONT}`; ctx.fillText(st.reed[r.k % st.reed.length], 0, 0);
      ctx.restore();
    }
  }
  if (st.rigid) return; // el suelo rígido se dibuja delante

  const gb = ctx.createLinearGradient(0, surfaceY, 0, H);
  gb.addColorStop(0, st.bed[0]); gb.addColorStop(1, st.bed[1]);
  ctx.globalAlpha = 1; ctx.fillStyle = gb; ctx.fillRect(0, surfaceY, W, H - surfaceY);
  const rp = rowPats[st.char], lh = S * 0.08;
  ctx.font = `${S * 0.05}px ${FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = `rgb(${st.tint})`;
  for (let i = 1, y = surfaceY + lh; y < H + lh; i++, y += lh){
    ctx.globalAlpha = 0.18 * Math.max(0.15, 1 - (y - surfaceY) / (H - surfaceY + 1));
    const off = (t * (0.3 + (i % 9) * 0.07) * SPEED) % rp.w;
    ctx.fillText(rp.str, -off - (i % 2) * rp.w * 0.5, y);
  }
  ctx.globalAlpha = 1;
}

function drawFront(sc){
  const st = sc.style;
  if (st.rigid){
    // suelo sólido de p: quieto, como mampostería
    const g = ctx.createLinearGradient(0, surfaceY, 0, H);
    g.addColorStop(0, st.bed[0]); g.addColorStop(1, st.bed[1]);
    ctx.fillStyle = g; ctx.fillRect(0, surfaceY, W, H - surfaceY);
    const rp = rowPats[st.char], lh = S * 0.075;
    ctx.font = `${S * 0.05}px ${FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = `rgb(${st.tint})`;
    for (let i = 1, y = surfaceY + lh; y < H + lh; i++, y += lh){
      ctx.globalAlpha = 0.28 * Math.max(0.2, 1 - (y - surfaceY) / (H - surfaceY + 1));
      ctx.fillText(rp.str, -(i % 2) * rp.w * 0.5, y);
    }
    ctx.globalAlpha = 0.7; ctx.fillStyle = 'rgb(233,227,207)';
    ctx.fillText(rp.str, 0, surfaceY + S * 0.012);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillStyle = `rgba(${st.veil},${st.veilA})`; ctx.fillRect(0, surfaceY, W, H - surfaceY + 10);
  const cw = S * 0.04;
  ctx.font = `${S * 0.05}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgb(233,227,207)';
  const px = sc.center.x, R = sc.R;
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

function windowResized(){ resizeCanvas(windowWidth, windowHeight); layout(); startScene(sceneIndex); }

addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R'){ showRules = !showRules; $('rules').hidden = !showRules; }
  if (e.key === 'ArrowRight' && scene && phase === 'play') scene.done = true; // atajo para probar escenas
});
