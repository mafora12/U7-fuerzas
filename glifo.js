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
    const cols = new Int32Array(N);
    let inkTop = N, inkBot = 0;
    for (let i = 0; i < N * N; i++){
      const inside = px[i * 4 + 3] >= 128;
      toIn[i] = inside ? 0 : INF;
      toOut[i] = inside ? INF : 0;
      if (inside){ const y = (i / N) | 0; cols[i % N]++; if (y < inkTop) inkTop = y; if (y > inkBot) inkBot = y; }
    }
    edt2d(toIn, N); edt2d(toOut, N);
    const sdf = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++){
      sdf[i] = toIn[i] > 0 ? Math.sqrt(toIn[i]) - 0.5 : -(Math.sqrt(toOut[i]) - 0.5);
    }

    const img = c.createImageData(N, N);
    for (let i = 0; i < N * N; i++){ img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; }
    return { ch, k, N, gw, gh, sdf, cv, c, img, cols, inkTop, inkBot, lastE: -1 };
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

  function box(x, y, b){
    const dx = Math.abs(x - b.cx) - b.hx, dy = Math.abs(y - b.cy) - b.hy;
    return Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0);
  }

  return { make, render, draw, stem, box };
})();

const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
