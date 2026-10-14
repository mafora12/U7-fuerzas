/* ---------- L · Laodamía ----------
   Su esposo Protesilao murió en Troya. Ella hizo una estatua de él y la abrazaba cada noche.
   Su padre mandó quemar la estatua y Laodamía se lanzó al fuego con ella.
   Parte de: un asta de pie (Laodamía) y, lejos, una barra rígida acostada (la estatua).
   Mantener presionado (en cualquier parte): ella camina hacia la estatua. Si sueltas, retrocede.
   Al tocarla y seguir presionando, la abraza: la estatua se enciende y suelta chispas.
   Cuando el fuego llega al máximo, se apaga sobre ella y quedan fundidas en la L. */
function makeLaodamia(){
  const C = P.laodamia, g = glifos.L, st = Glifo.stem(g);
  g.lastE = -1;
  const armsL = Glifo.arms(g, st).sort((a, b) => b.y1 - a.y1);
  const foot = armsL[0] || { y0: st.y1 - g.gh * 0.12, y1: st.y1, x1: g.gw / 2 };
  const level = 0.84, surf = H * level;
  const cx = W * 0.56;
  const stemW = st.x1 - st.x0, stemH = st.y1 - st.y0;
  const yF = surf - st.y1 - 1;                         // la L se apoya sobre el suelo
  const finalX = cx + (st.x0 + st.x1) / 2;           // donde queda el asta al abrazarla
  const startX = Math.max(stemW * 2, finalX - W * 0.38);
  const sTop = yF + st.y0;
  // la estatua: el pie de la L, acostada en el suelo
  const statue = { x0: cx + st.x1 - 1, x1: cx + foot.x1, y0: yF + foot.y0, y1: yF + foot.y1 };
  const stemBox = { cx: (st.x0 + st.x1) / 2, cy: (st.y0 + st.y1) / 2, hx: stemW / 2, hy: stemH / 2 };
  const footBox = { cx: (st.x1 - 1 + foot.x1) / 2, cy: (foot.y0 + foot.y1) / 2, hx: (foot.x1 - st.x1 + 1) / 2, hy: (foot.y1 - foot.y0) / 2 };
  const united = (x, y) => Math.min(Glifo.box(x, y, stemBox), Glifo.box(x, y, footBox));

  return {
    level, style: ESTILOS.brasas, center: { x: cx, y: surf }, R: g.gw, done: false,
    letter: 'L', dustChar: 'l',
    obra: { quien: 'Laodamía', obra: 'Laodamia', autor: 'George William Joy · 1878' },
    state: 'apart', x: startX, holding: false, heat: 0, sparks: [], e: 0, endF: 0, idleF: 0, frozen: false,

    focus(){ return { x: (this.x + statue.x1) / 2, y: surf - stemH * 0.4 }; },
    edge(){
      if (Math.random() < 0.4) return { x: random(statue.x0, statue.x1), y: statue.y0 };
      return { x: this.x + (Math.random() < 0.5 ? -1 : 1) * stemW / 2, y: random(sTop, surf) };
    },

    press(){ if (!this.frozen && (this.state === 'apart' || this.state === 'embrace')){ this.holding = true; this.idleF = 0; } },
    release(){ this.holding = false; },
    freeze(){ this.frozen = true; this.holding = false; },

    update(interactive){
      for (const s of this.sparks){ s.vy -= 0.03; s.x += s.vx + Math.sin(t * 0.1 + s.ph) * 0.4; s.y += s.vy; s.a -= 0.012; }
      this.sparks = this.sparks.filter(s => s.a > 0);
      if (this.frozen || !interactive) return;

      if (SALA && !this.holding && ++this.idleF > C.idleWind * 60) this.holding = true;  // nadie viene: ella va sola
      if (this.holding) Memoria.give(this, 0.003);

      if (this.state === 'apart'){
        if (this.holding){
          this.x = Math.min(finalX, this.x + C.walk);
          if (this.x >= finalX){ this.x = finalX; this.state = 'embrace'; Memoria.give(this, P.memoria.action); }
        } else {
          this.x = Math.max(startX, this.x - C.walk * C.back);   // la separan: retrocede
        }
      } else if (this.state === 'embrace'){
        if (this.holding) this.heat = Math.min(1, this.heat + 1 / (C.burn * 60));
        else this.heat = Math.max(0, this.heat - 1 / (C.burn * 120));          // el fuego baja si lo sueltas
        if (Math.random() < this.heat * 0.6){
          this.sparks.push({ x: random(statue.x0, statue.x1), y: statue.y0, vx: random(-0.4, 0.4), vy: random(-1.5, -0.4),
            a: 0.9, s: S * random(0.03, 0.06), ph: random(TAU) });
        }
        if (this.heat >= 1){ this.state = 'fuse'; this.holding = false; }
      } else if (this.state === 'fuse'){
        this.e = Math.min(1, this.e + 1 / C.fuseFrames);
        this.heat = Math.max(0, this.heat - 0.02);                               // se apaga sobre ella
        if (this.e >= 1){ this.state = 'formed'; Memoria.lock(this); }
      } else if (this.state === 'formed'){
        this.heat = Math.max(0, this.heat - 0.02);
        if (++this.endF > C.holdAfter) this.done = true;
      }
    },

    draw(){
      // color de la estatua: del hueso a la brasa
      const h = this.heat, col = `rgb(${lerp(233, 236, h) | 0},${lerp(227, 120, h) | 0},${lerp(207, 60, h) | 0})`;
      if (this.state === 'fuse' || this.state === 'formed'){
        Glifo.render(g, united, smooth(this.e));
        Glifo.draw(g, ctx, cx, yF, 0, 1);
        if (h > 0){ ctx.globalAlpha = h; ctx.fillStyle = col; ctx.fillRect(statue.x0, statue.y0, statue.x1 - statue.x0, statue.y1 - statue.y0); ctx.globalAlpha = 1; }
      } else {
        ctx.fillStyle = col;
        ctx.fillRect(statue.x0, statue.y0, statue.x1 - statue.x0, statue.y1 - statue.y0);
        // Laodamía se inclina hacia la estatua mientras camina
        const lean = this.holding && this.state === 'apart' ? 0.06 : 0;
        ctx.save(); ctx.translate(this.x, surf); ctx.rotate(lean);
        ctx.fillStyle = 'rgb(233,227,207)';
        ctx.fillRect(-stemW / 2, sTop - surf, stemW, surf - sTop + 4);
        ctx.restore();
      }
      ctx.textAlign = 'center';
      for (const s of this.sparks){
        ctx.globalAlpha = s.a; ctx.fillStyle = 'rgb(240,150,70)';
        ctx.font = `${s.s}px ${FONT}`; ctx.fillText('l', s.x, s.y);
      }
      ctx.globalAlpha = 1;
    },

    rules(){
      return [['estado', { apart: this.holding ? 'camina hacia él' : 'separada', embrace: 'la abraza', fuse: 'se apaga', formed: 'L formada' }[this.state]],
        ['acción', 'mantener presionado'],
        ['distancia', Math.max(0, finalX - this.x).toFixed(0) + ' px'],
        ['fuego', (this.heat * 100).toFixed(0) + ' %']];
    }
  };
}
