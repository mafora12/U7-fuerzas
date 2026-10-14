/* ---------- E · Eco ----------
   En las Metamorfosis de Ovidio, la ninfa Eco solo puede repetir lo que otros dicen.
   Se enamora de Narciso, él la rechaza y ella se consume hasta quedar solo en voz.
   Parte de: un asta sola en el bosque (Eco) frente a una pared de roca.
   Clic (en cualquier parte): Eco grita. La voz viaja hasta la pared, rebota y vuelve;
   al volver se pega al asta como un brazo, a la altura más cercana a donde hiciste clic.
   Tres gritos, tres brazos: la E. Al formarse, quedan contornos repetidos de la E:
   lo único que queda de ella es el eco. */
function makeEco(){
  const C = P.eco, g = glifos.E, st = Glifo.stem(g);
  g.lastE = -1;
  const armsL = Glifo.arms(g, st).sort((a, b) => a.y0 - b.y0).slice(0, 3);
  const level = 0.84, surf = H * level;
  const cx = W * 0.4;
  const stemW = st.x1 - st.x0, stemH = st.y1 - st.y0;
  const yF = surf - st.y1 + stemH * 0.04;
  const sX = cx + (st.x0 + st.x1) / 2;                 // asta (Eco)
  const sTop = yF + st.y0;
  const wallX = Math.min(W - S * 0.25, cx + g.gw * 2.4);
  const stemBox = { cx: (st.x0 + st.x1) / 2, cy: (st.y0 + st.y1) / 2, hx: stemW / 2, hy: stemH / 2 };
  const armBoxes = armsL.map(a => ({ cx: (st.x1 - 1 + a.x1) / 2, cy: (a.y0 + a.y1) / 2, hx: (a.x1 - st.x1 + 1) / 2, hy: (a.y1 - a.y0) / 2 }));
  const united = (x, y) => Math.min(Glifo.box(x, y, stemBox), ...armBoxes.map(b => Glifo.box(x, y, b)));
  const slots = armsL.map(a => ({ y: yF + (a.y0 + a.y1) / 2, h: a.y1 - a.y0, x1: cx + a.x1, claimed: false, grow: 0 }));
  const tint = `rgb(${ESTILOS.bosque.tint})`;

  return {
    level, style: ESTILOS.bosque, center: { x: sX, y: surf }, R: g.gw, done: false,
    letter: 'E', dustChar: 'e',
    obra: { quien: 'Eco', obra: 'Echo and Narcissus', autor: 'John William Waterhouse · 1903' },
    state: 'voice', voices: [], wallFlash: 0, e: 0, ghost: 0, endF: 0, idleF: 0, frozen: false,

    focus(){ return { x: sX, y: surf - stemH * 0.5 }; },
    edge(){
      const grown = slots.filter(s => s.grow > 0.5);
      if (grown.length && Math.random() < 0.4){
        const s = grown[(Math.random() * grown.length) | 0];
        return { x: random(sX, s.x1), y: s.y + (Math.random() < 0.5 ? -1 : 1) * s.h / 2 };
      }
      return { x: sX + (Math.random() < 0.5 ? -1 : 1) * stemW / 2, y: random(sTop, surf) };
    },

    // grito: la voz sale de donde hiciste clic, viaja a la pared y vuelve al brazo libre más cercano
    click(x, y){
      if (this.state !== 'voice') return;
      const free = slots.filter(s => !s.claimed);
      if (!free.length) return;
      const slot = free.reduce((a, b) => Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a);
      slot.claimed = true; this.idleF = 0;
      const x0 = constrain(x, sX + stemW, wallX - 20);
      this.voices.push({ x: x0, y: constrain(y, sTop - S * 0.3, surf - 10), y0: constrain(y, sTop - S * 0.3, surf - 10), x0, dir: 1, slot, trail: [] });
      Memoria.give(this, P.memoria.action);
    },
    freeze(){ this.frozen = true; },

    update(interactive){
      this.wallFlash *= 0.92;
      if (this.frozen) return;

      if (SALA && interactive && this.state === 'voice' && ++this.idleF > C.idleWind * 60){
        const free = slots.filter(s => !s.claimed);
        if (free.length && this.idleF % 90 === 0) this.click(random(sX + S * 0.5, wallX - 40), free[0].y);
      }

      for (const v of this.voices){
        v.trail.unshift({ x: v.x, y: v.y }); if (v.trail.length > 14) v.trail.pop();
        v.x += v.dir * C.speed;
        if (v.dir > 0 && v.x >= wallX){ v.x = wallX; v.dir = -1; this.wallFlash = 1; }
        if (v.dir < 0){
          // al volver, la voz se curva hacia la altura de su brazo
          const u = constrain((wallX - v.x) / (wallX - v.slot.x1), 0, 1);
          v.y = lerp(v.y0, v.slot.y, smooth(u));
          if (v.x <= v.slot.x1){ v.arrived = true; v.slot.growing = true; }
        }
      }
      this.voices = this.voices.filter(v => !v.arrived);
      for (const s of slots) if (s.growing) s.grow = Math.min(1, s.grow + 1 / C.growFrames);

      if (this.state === 'voice' && slots.every(s => s.grow >= 1)){ this.state = 'fuse'; }
      else if (this.state === 'fuse'){
        this.e = Math.min(1, this.e + 1 / C.fuseFrames);
        if (this.e >= 1){ this.state = 'formed'; Memoria.lock(this); }
      } else if (this.state === 'formed'){
        this.ghost = Math.min(1, this.ghost + 1 / 90);
        if (++this.endF > C.holdAfter) this.done = true;
      }
    },

    draw(){
      // pared de roca hecha de e
      ctx.fillStyle = tint; ctx.textAlign = 'center';
      ctx.font = `${S * 0.07}px ${FONT}`;
      for (let y = surf - S * 0.02, k = 0; y > sTop - S * 0.5; y -= S * 0.06, k++){
        ctx.globalAlpha = 0.22 + 0.5 * this.wallFlash;
        ctx.fillText('e', wallX + (k % 2) * S * 0.03, y);
      }
      ctx.globalAlpha = 1;

      if (this.state === 'fuse' || this.state === 'formed'){
        // contornos repetidos: lo que queda de Eco es su voz
        for (let i = C.ghosts; i >= 1; i--){
          Glifo.draw(g, ctx, cx + g.gw * 0.62 * i * this.ghost, yF, 0, 0.32 / i * this.ghost);
        }
        Glifo.render(g, united, smooth(this.e));
        Glifo.draw(g, ctx, cx, yF, 0, 1);
      } else {
        ctx.fillStyle = 'rgb(233,227,207)';
        ctx.fillRect(sX - stemW / 2, sTop, stemW, surf - sTop + 4);
        for (const s of slots){
          if (s.grow <= 0) continue;
          const x0 = sX + stemW / 2 - 1;
          ctx.fillRect(x0, s.y - s.h / 2, (s.x1 - x0) * smooth(s.grow), s.h);
        }
      }

      // la voz: una estela de e que se encoge
      ctx.fillStyle = 'rgb(233,227,207)'; ctx.textAlign = 'center';
      for (const v of this.voices){
        v.trail.forEach((p, i) => {
          if (i % 3) return;
          ctx.globalAlpha = 0.7 * (1 - i / v.trail.length);
          ctx.font = `${S * (0.09 - i * 0.004)}px ${FONT}`;
          ctx.fillText('e', p.x, p.y + S * 0.03);
        });
      }
      ctx.globalAlpha = 1;
    },

    rules(){
      return [['estado', { voice: 'Eco grita', fuse: 'se funden', formed: 'E formada' }[this.state]],
        ['brazos', slots.filter(s => s.grow >= 1).length + ' / ' + slots.length],
        ['voces en el aire', this.voices.length],
        ['asta + brazos → E', (this.e * 100).toFixed(0) + ' %']];
    }
  };
}
