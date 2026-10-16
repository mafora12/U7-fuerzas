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
    height: 0.42,      // alto de la P respecto a la pantalla
    buried: 0.14,      // parte del asta que queda clavada bajo el suelo
    rise: 46,          // frames que tarda el asta en salir del suelo y clavarse
    growFrames: 24,    // frames en que se forma el círculo con el clic
    wobbleFrames: 70,  // frames que el círculo se tambalea antes de caer
    fallFrames: 50,    // frames que tarda el círculo en caer a la punta del asta
    fuseFrames: 45,    // frames en que asta y círculo se funden en la P
    holdAfter: 120,
    idleWind: 20       // (solo sala) segundos sin nadie antes de que pase solo
  },
  haidee: {
    height: 0.42,      // alto de la H respecto a la pantalla
    bondRange: 0.3,    // qué tan cerca (en distancias de la H) hay que acercarlo para que nazca el travesaño
    breakRatio: 2.3,   // cuánto se puede estirar el travesaño antes de quebrarse
    spring: 0.07,      // fuerza del resorte del travesaño
    damping: 0.86,     // amortiguación del resorte
    fuseFrames: 45,
    holdAfter: 150,
    idleWind: 20
  },
  eco: {
    height: 0.42,      // alto de la E respecto a la pantalla
    speed: 9,          // velocidad del eco (px por frame)
    growFrames: 22,    // frames en que un eco se vuelve brazo
    fuseFrames: 45,
    ghosts: 3,         // contornos repetidos de la E al final (el eco que queda)
    holdAfter: 170,
    idleWind: 20
  },
  laodamia: {
    height: 0.42,      // alto de la L respecto a la pantalla
    walk: 3.2,         // px por frame que avanza mientras mantienes presionado
    back: 0.6,         // qué tan rápido retrocede al soltar (fracción de walk)
    burn: 2.2,         // segundos de abrazo para que el fuego llegue al máximo
    fuseFrames: 45,
    holdAfter: 150,
    idleWind: 20
  },
  ines: {
    height: 0.42,      // alto de la I respecto a la pantalla
    lift: 0.045,       // cuánto la levanta cada clic de insistencia
    gravity: 0.0025,   // cuánto la tumba la gravedad (péndulo invertido)
    damping: 0.97,
    fuseFrames: 45,
    holdAfter: 150,
    idleWind: 20
  },
  atala: {
    height: 0.42,      // alto de la A respecto a la pantalla
    attract: 14,       // a esta distancia (px) las astas se atraen solas
    poison: 2.5,       // segundos que tarda el veneno en llenar el voto
    fuseFrames: 45,
    holdAfter: 150,
    idleWind: 20
  },
  memoria: {
    start: 0.55,       // memoria con la que empieza cada escena
    decay: 0.035,      // cuánto se olvida por segundo sin interacción
    action: 0.22,      // cuánto devuelve cada acción (clic, pasada, arrastre)
    look: 0.10,        // cuánto devuelve por segundo mover el mouse cerca de la forma
    lookRadius: 0.9,   // radio de "mirar" (en tamaños de letra)
    erosion: 0.55,     // probabilidad por frame de que se desprenda una letra con memoria 0
    wind: 0.012,       // viento que se lleva las letras desprendidas
    cartela: 0.4       // memoria mínima al formarse la letra para que aparezca su cartela
  },
  descend: 150         // frames que dura el descenso de una escena a la siguiente
};

// Paletas tomadas de cada cuadro; el filtro de memoria las apaga o las revive.
const ESTILOS = {
  rio: { char: 'o', tint: '140,196,168', veil: '6,18,12', veilA: 0.45, reed: 'li', reedTint: '112,160,88',
         sky: ['#07130b', '#1d3a22'], bed: ['#123326', '#04100b'] },             // Millais: verdes del río
  tierra: { rigid: true, char: 'p', tint: '196,150,92', reed: '',
            sky: ['#0d0906', '#2a1a0e'], bed: ['#3b2412', '#120a04'] },          // Rossetti: ocres y sombras
  playa: { rigid: true, char: 'h', tint: '214,180,120', reed: '',
           sky: ['#06121f', '#1d4560'], bed: ['#6b5232', '#2a1d0e'] },           // Madox Brown: mar y arena
  bosque: { rigid: true, char: 'e', tint: '160,186,112', reed: '',
            sky: ['#08120d', '#28472f'], bed: ['#33421f', '#0e1409'] },           // Waterhouse: bosque y estanque
  brasas: { rigid: true, char: 'l', tint: '196,120,74', reed: '',
            sky: ['#0b0604', '#2c140b'], bed: ['#3b1c0e', '#100602'] },           // Joy: interior a la luz del fuego
  palacio: { rigid: true, char: 'i', tint: '186,166,206', reed: '',
             sky: ['#0a0912', '#2b2442'], bed: ['#2d2338', '#0c0a12'] },          // Comte: corte, terciopelo y oro
  gruta: { rigid: true, char: 'a', tint: '196,186,150', reed: '',
           sky: ['#06080a', '#1e2b2c'], bed: ['#2e2a20', '#0b0a07'] }             // Girodet: gruta y luz fría
};

let engine, ctx, W, H, S, surfaceY = 0, reeds = [], rowPats = {}, glifos = {};
let ready = false, scene = null, next = null, sceneIndex = 0, phase = 'play', camT = 0;
let showRules = false, t = 0, ripple = 0, fade = 1, lastFilter = '';
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
  el.addEventListener('pointerdown', e => { if (phase === 'play' && scene.press) scene.press(...at(e)); });
  addEventListener('pointerup', () => { if (scene && scene.release) scene.release(); });
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
  glifos = { O: Glifo.make('O', S, BONE), P: Glifo.make('P', sizeP, BONE, 640),
             H: Glifo.make('H', sizeFor('H', P.haidee.height), BONE, 640),
             E: Glifo.make('E', sizeFor('E', P.eco.height), BONE, 640),
             L: Glifo.make('L', sizeFor('L', P.laodamia.height), BONE, 640),
             I: Glifo.make('I', sizeFor('I', P.ines.height), BONE, 640),
             A: Glifo.make('A', sizeFor('A', P.atala.height), BONE, 640) };
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

function sizeFor(ch, frac){
  ctx.font = `100px ${FONT}`;
  const m = ctx.measureText(ch), gh = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 100;
  return Math.min(H * frac, W * 0.8) / gh;
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
const SCENES = [makeOfelia, makePia, makeHaidee, makeEco, makeLaodamia, makeInes, makeAtala, () => makeStub('final')];

function createScene(i){
  buildWorld();
  const sc = SCENES[Math.min(i, SCENES.length - 1)]();
  sc.surf = H * sc.level;
  Memoria.init(sc);
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
    Cartela.hide();
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

  // el color de la pantalla responde a la memoria de la escena
  const mem = next ? lerp(scene.mem, next.mem, smooth(camT)) : scene.mem;
  const f = Memoria.filter(mem);
  if (f !== lastFilter){ drawingContext.canvas.style.filter = f; lastFilter = f; }

  if (fade > 0){ fade = Math.max(0, fade - 0.02); ctx.fillStyle = `rgba(11,21,16,${fade})`; ctx.fillRect(0, 0, W, H); }
  if (showRules && frameCount % 6 === 0){
    $('rules').innerHTML = [['memoria', (scene.mem * 100).toFixed(0) + ' %'], ...scene.rules()].map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('');
  }
}

function renderScene(sc, dy, interactive){
  surfaceY = sc.surf;
  sc.update(interactive);
  Memoria.tick(sc, interactive);
  ctx.save(); ctx.translate(0, dy);
  drawBack(sc);
  sc.draw();
  drawFront(sc);
  Memoria.draw(sc);
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
