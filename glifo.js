/* Glifos como campos de distancia (SDF).
   Cada letra se rasteriza una vez y se convierte en un mapa de distancias firmado
   (negativo dentro de la letra, positivo fuera). Para transformar una forma simple
   (círculo, rectángulo) en la letra se interpola la distancia de ambas formas y se
   dibuja el contorno 0. Así la forma se deforma de verdad, sin fundidos. */
const Glifo = (() => {
  const INF = 1e20;

  // Transformada de distancia exacta 1D (Felzenszwalb & Huttenlocher)
  function edt1d(f, n, d, v, z){
    let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++){
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]){ k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++){ while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
  }

  function edt2d(grid, N){
    const f = new Float64Array(N), d = new Float64Array(N), v = new Int32Array(N), z = new Float64Array(N + 1);
    for (let x = 0; x < N; x++){
      for (let y = 0; y < N; y++) f[y] = grid[y * N + x];
      edt1d(f, N, d, v, z);
      for (let y = 0; y < N; y++) grid[y * N + x] = d[y];
    }
    for (let y = 0; y < N; y++){
      for (let x = 0; x < N; x++) f[x] = grid[y * N + x];
      edt1d(f, N, d, v, z);
      for (let x = 0; x < N; x++) grid[y * N + x] = d[x];
    }
  }

  function make(ch, size, rgb, maxN = 460){
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = `${size}px ${FONT}`;
    const m0 = probe.measureText(ch);
    const gw = m0.actualBoundingBoxLeft + m0.actualBoundingBoxRight;
    const gh = m0.actualBoundingBoxAscent + m0.actualBoundingBoxDescent;
    const k = Math.max(0.5, Math.min(2, pixelDensity(), maxN / (Math.max(gw, gh) * 1.4)));
    const N = Math.ceil(Math.max(gw, gh) * 1.4 * k);

    const cv = document.createElement('canvas'); cv.width = cv.height = N;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.font = `${size * k}px ${FONT}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = '#fff';
    const m = c.measureText(ch);
    c.fillText(ch, N / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2,
                   N / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    const px = c.getImageData(0, 0, N, N).data;

    const toIn = new Float64Array(N * N), toOut = new Float64Array(N * N);
    const cols = new Int32Array(N), mask = new Uint8Array(N * N);
    let inkTop = N, inkBot = 0;
    for (let i = 0; i < N * N; i++){
      const inside = px[i * 4 + 3] >= 128;
      toIn[i] = inside ? 0 : INF;
      toOut[i] = inside ? INF : 0;
      mask[i] = inside ? 1 : 0;
      if (inside){ const y = (i / N) | 0; cols[i % N]++; if (y < inkTop) inkTop = y; if (y > inkBot) inkBot = y; }
    }
    edt2d(toIn, N); edt2d(toOut, N);
    const sdf = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++){
      sdf[i] = toIn[i] > 0 ? Math.sqrt(toIn[i]) - 0.5 : -(Math.sqrt(toOut[i]) - 0.5);
    }

    const img = c.createImageData(N, N);
    for (let i = 0; i < N * N; i++){ img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; }
    return { ch, k, N, gw, gh, sdf, cv, c, img, cols, mask, inkTop, inkBot, lastE: -1 };
  }

  // shape(x, y) devuelve la distancia en px de pantalla a la forma inicial (centro = 0,0).
  // lam < 1 hace que las partes lejanas de la letra crezcan antes (la forma "brota" desde la inicial).
  function render(g, shape, e, lam = 1){
    if (e >= 1){ if (g.lastE === 1) return; e = 1; }
    g.lastE = e;
    const { N, k, sdf } = g, d = g.img.data, h = N / 2, norm = 1 / ((1 - e) * lam + e);
    for (let j = 0; j < N; j++){
      const y = (j + 0.5 - h) / k;
      for (let i = 0; i < N; i++){
        const idx = j * N + i;
        let dd;
        if (e >= 1) dd = sdf[idx];
        else { const dA = shape((i + 0.5 - h) / k, y) * k * lam; dd = (dA + (sdf[idx] - dA) * e) * norm; }
        const a = 0.5 - dd;
        d[idx * 4 + 3] = a <= 0 ? 0 : a >= 1 ? 255 : a * 255;
      }
    }
    g.c.putImageData(g.img, 0, 0);
  }

  function draw(g, ctx, x, y, angle, alpha){
    const s = g.N / g.k;
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha = alpha;
    ctx.drawImage(g.cv, -s / 2, -s / 2, s, s);
    ctx.restore();
  }

  // Asta vertical de la letra (columnas que cubren casi toda la altura), en px de pantalla
  function stem(g){
    const h = g.inkBot - g.inkTop + 1;
    let i0 = -1, i1 = -1;
    for (let i = 0; i < g.N; i++){
      if (g.cols[i] >= 0.85 * h){ if (i0 < 0) i0 = i; i1 = i; }
      else if (i0 >= 0) break;
    }
    const c = g.N / 2;
    if (i0 < 0) return { x0: -g.gw / 2, x1: -g.gw / 2 + g.gw * 0.22, y0: -g.gh / 2, y1: g.gh / 2 };
    return { x0: (i0 - c) / g.k, x1: (i1 + 1 - c) / g.k, y0: (g.inkTop - c) / g.k, y1: (g.inkBot + 1 - c) / g.k };
  }

  // Todas las astas verticales de la letra (de izquierda a derecha)
  function stems(g){
    const h = g.inkBot - g.inkTop + 1, c = g.N / 2, out = [];
    let i0 = -1;
    for (let i = 0; i <= g.N; i++){
      const full = i < g.N && g.cols[i] >= 0.85 * h;
      if (full && i0 < 0) i0 = i;
      if (!full && i0 >= 0){
        out.push({ x0: (i0 - c) / g.k, x1: (i - c) / g.k, y0: (g.inkTop - c) / g.k, y1: (g.inkBot + 1 - c) / g.k });
        i0 = -1;
      }
    }
    return out;
  }

  // Travesaño horizontal entre dos x (px de pantalla): la franja más larga de tinta en la columna del medio
  function bar(g, xa, xb){
    const c = g.N / 2, col = Math.round(((xa + xb) / 2) * g.k + c);
    let best = null, j0 = -1;
    for (let j = 0; j <= g.N; j++){
      const ink = j < g.N && g.mask[j * g.N + col];
      if (ink && j0 < 0) j0 = j;
      if (!ink && j0 >= 0){ if (!best || j - j0 > best[1] - best[0]) best = [j0, j]; j0 = -1; }
    }
    if (!best) return { y0: -g.gh * 0.05, y1: g.gh * 0.05 };
    return { y0: (best[0] - c) / g.k, y1: (best[1] - c) / g.k };
  }

  // Brazos horizontales que salen a la derecha de un asta (E, F...): franjas de filas con tinta
  // justo a la derecha del asta; para cada una, hasta dónde llega la tinta. En px de pantalla.
  function arms(g, st){
    const c = g.N / 2, col = Math.round(st.x1 * g.k + c) + Math.max(2, Math.round(2 * g.k));
    const out = []; let j0 = -1;
    for (let j = 0; j <= g.N; j++){
      const ink = j < g.N && g.mask[j * g.N + col];
      if (ink && j0 < 0) j0 = j;
      if (!ink && j0 >= 0){
        let xEnd = col;
        for (let j2 = j0; j2 < j; j2++){
          let i = col; while (i < g.N && g.mask[j2 * g.N + i]) i++;
          xEnd = Math.max(xEnd, i);
        }
        out.push({ y0: (j0 - c) / g.k, y1: (j - c) / g.k, x1: (xEnd - c) / g.k });
        j0 = -1;
      }
    }
    return out;
  }

  // Franjas de tinta en una fila (px de pantalla): [{x0, x1}, ...] de izquierda a derecha
  function runsAt(g, yL){
    const c = g.N / 2, j = Math.round(yL * g.k + c), out = [];
    let i0 = -1;
    for (let i = 0; i <= g.N; i++){
      const ink = i < g.N && g.mask[j * g.N + i];
      if (ink && i0 < 0) i0 = i;
      if (!ink && i0 >= 0){ out.push({ x0: (i0 - c) / g.k, x1: (i - c) / g.k }); i0 = -1; }
    }
    return out;
  }

  // A: las dos astas diagonales como líneas (pie → vértice) con su grosor, y el travesaño
  function diagonals(g){
    const c = g.N / 2, top = (g.inkTop - c) / g.k, bot = (g.inkBot + 1 - c) / g.k, h = bot - top;
    const ya = top + h * 0.82, yb = top + h * 0.32;
    const ra = runsAt(g, ya), rb = runsAt(g, yb);
    const mid = r => (r.x0 + r.x1) / 2;
    const L1 = ra[0], R1 = ra[ra.length - 1], L2 = rb[0], R2 = rb[rb.length - 1];
    const line = (p1, p2, w) => {
      const dx = (p2.x - p1.x) / (p2.y - p1.y);
      return { x0: p1.x + dx * (bot - p1.y), y0: bot, x1: p1.x + dx * (top - p1.y), y1: top, w };
    };
    const left = line({ x: mid(L1), y: ya }, { x: mid(L2), y: yb }, (L1.x1 - L1.x0) * 0.8);
    const right = line({ x: mid(R1), y: ya }, { x: mid(R2), y: yb }, (R1.x1 - R1.x0) * 0.8);
    // travesaño: en la columna central, la franja de tinta entre 45% y 85% de la altura
    const col = Math.round(((left.x1 + right.x1) / 2) * g.k + c);
    let cross = null, j0 = -1;
    for (let j = 0; j <= g.N; j++){
      const ink = j < g.N && g.mask[j * g.N + col];
      if (ink && j0 < 0) j0 = j;
      if (!ink && j0 >= 0){
        const y0 = (j0 - c) / g.k, y1 = (j - c) / g.k, ym = (y0 + y1) / 2;
        if (ym > top + h * 0.45 && ym < top + h * 0.85) cross = { y0, y1 };
        j0 = -1;
      }
    }
    if (!cross) cross = { y0: top + h * 0.6, y1: top + h * 0.66 };
    return { left, right, cross, top, bot };
  }

  // distancia a un segmento grueso (x0,y0)-(x1,y1) de ancho w
  function seg(x, y, s){
    const vx = s.x1 - s.x0, vy = s.y1 - s.y0, u = Math.max(0, Math.min(1, ((x - s.x0) * vx + (y - s.y0) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(x - (s.x0 + vx * u), y - (s.y0 + vy * u)) - s.w / 2;
  }

  function box(x, y, b){
    const dx = Math.abs(x - b.cx) - b.hx, dy = Math.abs(y - b.cy) - b.hy;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  }

  return { make, render, draw, stem, stems, bar, arms, diagonals, seg, box };
})();

const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
