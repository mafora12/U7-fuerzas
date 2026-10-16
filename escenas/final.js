/* ---------- Escena final: OPHELIA ----------
   Por primera vez aparece la palabra completa. Cada letra conserva la transparencia
   de su escena, así que se lee el degradado del olvido: la O nítida, la A casi borrada.
   Después la palabra se desintegra en partículas que se lleva un campo de ruido,
   empezando por la A (la más olvidada) y terminando en la O.
   Cuando no queda nada, la pieza vuelve a empezar. */
function makeFinal(){
  const C = P.final, word = 'OPHELIA';
  ctx.font = `100px ${FONT}`;
  const m = ctx.measureText(word), cap = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 100;
  const size = Math.min((W * 0.84) / (m.width / 100), (H * 0.3) / cap);
  ctx.font = `${size}px ${FONT}`;
  const total = ctx.measureText(word).width;
  const x0 = (W - total) / 2, base = H * 0.5 + (size * cap) / 2;
  // posición de cada letra
  const letters = [...word].map((ch, i) => ({
    ch, x: x0 + ctx.measureText(word.slice(0, i)).width, a: Olvido.alpha(i)
  }));

  // partículas: cada pixel de tinta de la palabra, con la transparencia de su letra
  function sample(){
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d', { willReadFrequently: true });
    const ids = [];
    c.font = `${size}px ${FONT}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    letters.forEach((l, i) => { c.fillStyle = `rgb(${i + 1},0,0)`; c.fillText(l.ch, l.x, base); });
    const d = c.getImageData(0, 0, W, H).data, out = [], st = C.step;
    let xmin = W, xmax = 0;
    for (let y = 0; y < H; y += st) for (let x = 0; x < W; x += st){
      const k = (y * W + x) * 4;
      if (d[k + 3] > 140){
        const li = Math.min(6, Math.max(0, d[k] - 1));
        out.push({ x, y, vx: 0, vy: 0, a: 1, la: letters[li].a, delay: 0, on: false });
        xmin = Math.min(xmin, x); xmax = Math.max(xmax, x);
      }
    }
    // primero se va la A, al final la O
    for (const p of out) p.delay = ((xmax - p.x) / Math.max(1, xmax - xmin)) * C.spread * 60 + random(0, 25);
    return out;
  }

  return {
    level: 0.84, style: ESTILOS.final, center: { x: W / 2, y: H }, R: W, done: false, letter: 'final',
    state: 'show', f: 0, parts: null, endF: 0, frozen: false,
    freeze(){ this.frozen = true; },

    update(interactive){
      if (!interactive) return;
      this.f++;
      if (this.state === 'show' && this.f > C.hold * 60){ this.state = 'dissolve'; this.parts = sample(); this.f = 0; }
      else if (this.state === 'dissolve'){
        let alive = 0;
        for (const p of this.parts){
          if (!p.on){ if (this.f > p.delay) p.on = true; else { alive++; continue; } }
          const n1 = noise(p.x * 0.006, p.y * 0.006, t * 0.008) - 0.5, n2 = noise(p.x * 0.006 + 40, p.y * 0.006, t * 0.008) - 0.5;
          p.vx += n1 * 0.35 + C.wind; p.vy += n2 * 0.35 - 0.02;
          p.vx *= 0.97; p.vy *= 0.97; p.x += p.vx; p.y += p.vy; p.a -= C.fade;
          if (p.a > 0) alive++;
        }
        if (!alive){ this.state = 'empty'; this.f = 0; }
      } else if (this.state === 'empty' && this.f > C.restart * 60){
        this.restart = true;
      }
    },

    draw(){
      ctx.fillStyle = 'rgb(233,227,207)';
      if (this.state === 'show'){
        const k = Math.min(1, this.f / 60);
        ctx.font = `${size}px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        for (const l of letters){ ctx.globalAlpha = l.a * k; ctx.fillText(l.ch, l.x, base); }
      } else if (this.state === 'dissolve'){
        const s = C.step;
        for (const p of this.parts){
          if (p.a <= 0) continue;
          ctx.globalAlpha = p.la * Math.max(0, p.a);
          ctx.fillRect(p.x, p.y, s, s);
        }
      }
      ctx.globalAlpha = 1;
    },

    rules(){
      const n = this.parts ? this.parts.filter(p => p.on && p.a > 0).length : 0;
      return [['estado', { show: 'OPHELIA completa', dissolve: 'se desintegra', empty: 'vacío' }[this.state]],
        ['opacidad O → A', letters[0].a.toFixed(2) + ' → ' + letters[6].a.toFixed(2)],
        ['partículas en el aire', n]];
    }
  };
}
