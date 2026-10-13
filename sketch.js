const { Engine, Bodies, Body, Composite, Constraint } = Matter;
const FONT = '"IM Fell DW Pica","IM Fell English",Georgia,serif';
const COL = { bone:'#e9e3cf', moss:'#7f9a79', water:'#a9c2a2', river:'11,21,16' };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPEED = REDUCED ? 0.3 : 1;
const SALA = location.hash === '#sala'; // pantalla del museo

/* ---------- Parámetros del sistema (edítalos para la bitácora) ---------- */
const P = {
  strands: 4,          // pasadas del mouse para romper la cuerda
  passMinSpeed: 3,     // velocidad mínima del mouse para que una pasada cuente
  push: 0.25,          // cuánto empuja cada pasada
  buoyancy: 2.0,       // 2.0 = queda en reposo con la mitad hundida
  morphFrames: 200,    // frames que tarda el círculo en volverse O
  restFrames: 60,      // frames quieta para darla por formada
  holdAfter: 150,      // frames que se queda la O antes de pasar a la siguiente letra
  idleWind: 20         // (solo sala) segundos sin nadie antes de que el viento la empuje
};

let engine, ctx, W, H, surfaceY, S, glyph = {}, reeds = [], rowPat = {};
let ready = false, scene = null, sceneIndex = 0, showRules = false, t = 0, ripple = 0, fade = 0;
const pointer = { x: -999, y: -999, vx: 0, vy: 0 };
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
    if (pointer.x > -900){ pointer.vx = x - pointer.x; pointer.vy = y - pointer.y; }
    pointer.x = x; pointer.y = y;
  });
  el.addEventListener('pointerleave', () => { pointer.x = pointer.y = -999; });
  const wait = new Promise(r => setTimeout(r, 2500));
  Promise.race([document.fonts.load('100px "IM Fell DW Pica"'), wait])
    .then(() => document.fonts.ready).catch(()=>{})
    .finally(() => { layout(); startScene(0); ready = true; });
}

function layout(){
  W = width; H = height;
  surfaceY = H * 0.6;
  S = Math.min(W * 0.5, H * 0.34);
  ctx.font = `${S}px ${FONT}`;
  const m = ctx.measureText('O');
  glyph = {
    gw: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
    gh: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
    dx: (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2,
    dy: (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2
  };
  reeds = [];
  for (let x = -10, k = 0; x < W + 20; k++){
    reeds.push({ x, ch: 'li'[k % 2], h: S * (0.3 + ((k * 37) % 11) / 11 * 0.45), ph: k * 1.7 });
    x += S * (0.05 + ((k * 13) % 7) / 7 * 0.09);
  }
  ctx.font = `${S * 0.05}px ${FONT}`;
  const unit = 'o   ', uw = ctx.measureText(unit).width;
  rowPat = { w: uw, str: unit.repeat(Math.ceil((W * 2) / uw) + 2) };
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
const SCENES = [makeOfelia, () => makeStub('P'), () => makeStub('H'), () => makeStub('E'), () => makeStub('L'), () => makeStub('I'), () => makeStub('A'), () => makeStub('final')];

function startScene(i){
  sceneIndex = Math.min(i, SCENES.length - 1);
  buildWorld();
  scene = SCENES[sceneIndex]();
  fade = 1; // entra desde negro
}

/* ---------- Río: hecho de letras ---------- */
function drawBack(){
  let g = ctx.createLinearGradient(0, 0, 0, surfaceY);
  g.addColorStop(0, '#080f0b'); g.addColorStop(1, '#18291d');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, surfaceY);
  ctx.fillStyle = COL.moss; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  for (const r of reeds){
    ctx.save(); ctx.translate(r.x, surfaceY + 6);
    ctx.rotate(Math.sin(t * 0.012 * SPEED + r.ph) * 0.05);
    ctx.globalAlpha = 0.18; ctx.font = `${r.h}px ${FONT}`; ctx.fillText(r.ch, 0, 0);
    ctx.restore();
  }
  g = ctx.createLinearGradient(0, surfaceY, 0, H);
  g.addColorStop(0, '#13231a'); g.addColorStop(1, '#060c09');
  ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, surfaceY, W, H - surfaceY);
  const lh = S * 0.08, n = Math.ceil((H - surfaceY) / lh);
  ctx.font = `${S * 0.05}px ${FONT}`; ctx.textAlign = 'left'; ctx.fillStyle = COL.water;
  for (let i = 1; i < n; i++){
    ctx.globalAlpha = 0.18 * (1 - i / n);
    const off = (t * (0.3 + i * 0.07) * SPEED) % rowPat.w;
    ctx.fillText(rowPat.str, -off - (i % 2) * rowPat.w * 0.5, surfaceY + i * lh);
  }
  ctx.globalAlpha = 1;
}

function drawFront(){
  ctx.fillStyle = 'rgba(7,14,10,0.45)'; ctx.fillRect(0, surfaceY, W, H - surfaceY);
  const cw = S * 0.04;
  ctx.font = `${S * 0.05}px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = COL.bone;
  const px = scene.body.position.x, R = scene.R;
  const shift = (t * 0.6 * SPEED) % cw;
  ripple *= 0.985;
  for (let x = -shift; x < W + cw; x += cw){
    const d = (x - px) / (R * 1.6);
    const bump = Math.exp(-d * d) * ripple * Math.sin(t * 0.18 - Math.abs(d) * 2);
    ctx.globalAlpha = 0.55;
    ctx.fillText('o', x, surfaceY + Math.sin(x * 0.018 + t * 0.05 * SPEED) * 3 + bump);
  }
  ctx.globalAlpha = 1;
}

function draw(){
  if (!ready || !scene) return;
  t++;
  pointer.vx *= 0.6; pointer.vy *= 0.6;
  Engine.update(engine, 1000 / 60);
  scene.update();
  drawBack();
  scene.draw();
  drawFront();
  if (fade > 0){
    if (scene.state !== 'formed') fade = Math.max(0, fade - 0.02);
    ctx.fillStyle = `rgba(${COL.river},${fade})`; ctx.fillRect(0, 0, W, H);
  }
  if (showRules && frameCount % 6 === 0){
    $('rules').innerHTML = scene.rules().map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('');
  }
}

function windowResized(){ resizeCanvas(windowWidth, windowHeight); layout(); startScene(sceneIndex); }

addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R'){ showRules = !showRules; $('rules').hidden = !showRules; }
});
