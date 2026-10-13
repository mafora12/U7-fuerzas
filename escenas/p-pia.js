/* ---------- P · Pía de' Tolomei ----------
   Su esposo la encerró en un castillo del pantano de Maremma y, según la leyenda,
   la arrojó por la ventana.
   Parte de: una torre alta suspendida sobre el pantano.
   Clic: la torre cae y se clava en el lodo; en su ventana aparece un círculo (Pía).
   Doble clic: ella cae. La torre se hunde con ella y, al chocar, la torre y el círculo
   se funden en la P, que queda medio hundida. */
function makePia(){
  const C = P.pia, g = glifos.P, st = Glifo.stem(g);
  g.lastE = -1;
  const level = 0.62, surf = H * level;
  const cx = W * 0.5;
  const yF = surf - g.gh * 0.17;                       // centro final de la P (medio hundida)
  const stemW = st.x1 - st.x0, towerX = cx + (st.x0 + st.x1) / 2;
  const towerH = Math.max(H * 0.62, g.gh * 1.8);       // tamaño de torre
  const plantedTop = surf + g.gh * C.depth - towerH;   // torre ya clavada
  const stemTopF = yF + st.y0;                         // donde termina la cima de la torre

  // panza de la P: círculo pegado al asta
  const rx = (g.gw / 2 - st.x1) / 2, ry = g.gh * 0.27;
  const br = (rx + ry) / 2;
  const bowlL = { x: st.x1 + rx * 0.98, y: st.y0 + ry };            // relativo al centro de la P
  const bowlF = { x: cx + bowlL.x, y: yF + bowlL.y };
  const win = { x: towerX + stemW / 2 + br * 1.35, y: plantedTop + br * 1.2 }; // Pía asomada

  const stemBox = { cx: (st.x0 + st.x1) / 2, cy: (st.y0 + st.y1) / 2, hx: stemW / 2, hy: (st.y1 - st.y0) / 2 };
  const fused = (x, y) => Math.min(Glifo.box(x, y, stemBox), Math.hypot(x - bowlL.x, y - bowlL.y) - br);
  const mud = `rgb(${ESTILOS.pantano.tint})`;

  return {
    level, style: ESTILOS.pantano, center: { x: cx, y: surf }, R: g.gw * 0.6, done: false,
    state: 'hang', top: H * 0.3 - towerH, vy: 0, appear: 0, s: 0, e: 0, endF: 0, idleF: 0,
    circle: { x: win.x, y: win.y }, drops: [], frozen: false,

    click(){
      if (this.state === 'hang'){ this.state = 'drop'; this.idleF = 0; }
    },
    dblclick(){
      if (this.state === 'planted' && this.appear >= 1){ this.state = 'fall'; this.idleF = 0; }
    },
    freeze(){ this.frozen = true; },

    splash(x, n, force){
      for (let k = 0; k < n; k++){
        this.drops.push({ x: x + random(-stemW * 2, stemW * 2), y: surfaceY, vx: random(-4, 4),
          vy: -random(2, 9) * force, s: S * random(0.03, 0.07) });
      }
    },

    update(interactive){
      for (const d of this.drops){ d.vy += 0.3; d.x += d.vx; d.y += d.vy; }
      this.drops = this.drops.filter(d => !(d.y > surfaceY && d.vy > 0));
      if (this.frozen) return;

      if (SALA && interactive && (this.state === 'hang' || this.state === 'planted') && ++this.idleF > C.idleWind * 60){
        this.state === 'hang' ? this.click() : this.dblclick(); // nadie viene: el castillo cae solo
      }

      if (this.state === 'hang'){
        this.top = H * 0.3 - towerH + Math.sin(t * 0.03) * 4;
      } else if (this.state === 'drop'){
        this.vy += 1.4; this.top += this.vy;
        if (this.top >= plantedTop){
          this.top = plantedTop; this.state = 'planted';
          shake = 16; ripple = 16; this.splash(towerX, 40, 1.2);
        }
      } else if (this.state === 'planted'){
        this.appear = Math.min(1, this.appear + 1 / 40);
      } else if (this.state === 'fall'){
        this.s = Math.min(1, this.s + 1 / C.fallFrames);
        const s = this.s;
        this.top = plantedTop + (stemTopF - plantedTop) * smooth(s);       // la torre se hunde
        this.circle.x = win.x + (bowlF.x - win.x) * smooth(s);
        this.circle.y = win.y + (bowlF.y - win.y) * s * s;                 // ella cae, acelerando
        if (s >= 1){ this.state = 'fuse'; shake = 8; ripple = 12; this.splash(cx, 26, 0.8); }
      } else if (this.state === 'fuse'){
        this.e = Math.min(1, this.e + 1 / C.fuseFrames);
        if (this.e >= 1) this.state = 'formed';
      } else if (this.state === 'formed' && ++this.endF > C.holdAfter){
        this.done = true;
        results.P = { formed: true };
      }
    },

    draw(){
      ctx.fillStyle = 'rgb(233,227,207)';
      const bottom = this.top + towerH;
      const sway = this.state === 'hang' ? Math.sin(t * 0.02) * 6 : 0;

      if (this.state === 'fuse' || this.state === 'formed'){
        // el resto de la torre sigue bajo el lodo
        ctx.fillRect(towerX - stemW / 2, yF + st.y1 - 2, stemW, bottom - (yF + st.y1 - 2));
        Glifo.render(g, fused, smooth(this.e));
        Glifo.draw(g, ctx, cx, yF, 0, 1);
      } else {
        ctx.fillRect(towerX - stemW / 2 + sway, this.top, stemW, towerH);
        if (this.state === 'planted' || this.state === 'fall'){
          const a = this.appear, pop = a < 1 ? 1 + Math.sin(a * Math.PI) * 0.18 : 1;
          ctx.globalAlpha = Math.min(1, a * 1.5);
          ctx.beginPath(); ctx.arc(this.circle.x, this.circle.y, br * a * pop, 0, TAU); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      ctx.fillStyle = mud; ctx.textAlign = 'center';
      for (const d of this.drops){ ctx.globalAlpha = 0.8; ctx.font = `${d.s}px ${FONT}`; ctx.fillText('o', d.x, d.y); }
      ctx.globalAlpha = 1;
    },

    rules(){
      return [['estado', { hang: 'torre suspendida', drop: 'cayendo', planted: 'clavada · Pía en la ventana',
          fall: 'Pía cae', fuse: 'se funden', formed: 'P formada' }[this.state]],
        ['acción siguiente', { hang: 'clic', planted: 'doble clic' }[this.state] || '—'],
        ['caída', (this.s * 100).toFixed(0) + ' %'],
        ['torre + círculo → P', (this.e * 100).toFixed(0) + ' %']];
    }
  };
}
