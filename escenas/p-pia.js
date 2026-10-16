/* ---------- P · Pía de' Tolomei ----------
   Su esposo la encerró en un castillo del pantano de Maremma y, según la leyenda,
   la arrojó por la ventana.
   Parte de: un asta del tamaño de una torre, que sale desde abajo y se clava en el suelo.
   Clic (en cualquier parte): se forma un círculo donde hiciste clic. Es Pía.
   Segundo clic (cuando quieras, en cualquier parte): el círculo se tambalea y cae siempre a la punta del asta.
   Al caer, asta y círculo se funden en la P. */
function makePia(){
  const C = P.pia, g = glifos.P, st = Glifo.stem(g);
  g.lastE = -1;
  const level = 0.84, surf = H * level;
  const cx = W * 0.5;
  const stemW = st.x1 - st.x0, stemH = st.y1 - st.y0;
  const yF = surf - st.y0 - (1 - C.buried) * stemH;   // centro de la P: el asta queda clavada
  const towerX = cx + (st.x0 + st.x1) / 2;
  const topF = yF + st.y0;                            // punta del asta

  // panza de la P: círculo pegado a la punta del asta
  const rx = (g.gw / 2 - st.x1) / 2, ry = g.gh * 0.27;
  const br = (rx + ry) / 2;
  const bowlL = { x: st.x1 + rx * 0.98, y: st.y0 + ry };   // relativo al centro de la P
  const bowlF = { x: cx + bowlL.x, y: yF + bowlL.y };

  const stemBox = { cx: (st.x0 + st.x1) / 2, cy: (st.y0 + st.y1) / 2, hx: stemW / 2, hy: stemH / 2 };
  const fused = (x, y) => Math.min(Glifo.box(x, y, stemBox), Math.hypot(x - bowlL.x, y - bowlL.y) - br);
  const backOut = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

  return {
    level, style: ESTILOS.tierra, center: { x: cx, y: surf }, R: g.gw * 0.6, done: false,
    letter: 'P', dustChar: 'p',
    obra: { quien: "Pía de' Tolomei", obra: "La Pia de' Tolomei", autor: 'Dante Gabriel Rossetti · 1868–80' },
    focus(){ return this.circle || { x: towerX, y: this.top }; },
    edge(){
      if (this.state === 'wait') return null;
      if (this.circle && Math.random() < 0.4){
        const a = random(TAU); return { x: this.circle.x + Math.cos(a) * br, y: this.circle.y + Math.sin(a) * br };
      }
      const top = this.state === 'fuse' || this.state === 'formed' ? topF : this.top;
      return { x: towerX + (Math.random() < 0.5 ? -1 : 1) * stemW / 2, y: random(top, surf) };
    },
    state: 'wait', delay: 25, top: surf + 4, u: 0, jolt: 0,
    circle: null, grow: 0, from: null, ctrl: null, s: 0, e: 0, endF: 0, idleF: 0, frozen: false,

    click(x, y){
      if (this.state === 'ready'){
        this.circle = { x: constrain(x, br, W - br), y: constrain(y, br, bowlF.y - br * 2) }; // siempre por encima de la punta
        this.state = 'circle'; this.grow = 0; this.idleF = 0;

      } else if (this.state === 'circle' && this.grow >= 1){
        // segundo clic, no tiene que ser seguido: Pía se tambalea y cae
        this.from = { ...this.circle };
        this.state = 'wobble'; this.w = 0; this.s = 0; this.idleF = 0;

      }
    },

    freeze(){ this.frozen = true; },

    update(interactive){
      this.jolt *= 0.86;
      if (this.frozen) return;

      if (SALA && interactive && ++this.idleF > C.idleWind * 60){
        if (this.state === 'ready') this.click(random(W * 0.2, W * 0.8), random(H * 0.15, H * 0.45));
        else if (this.state === 'circle' && this.grow >= 1) this.click();
      }

      if (this.state === 'wait'){
        if (interactive && --this.delay <= 0) this.state = 'rise';
      } else if (this.state === 'rise'){
        this.u = Math.min(1, this.u + 1 / C.rise);
        this.top = surf + 4 - (surf + 4 - topF) * this.u * this.u;   // acelera y se clava de golpe
        if (this.u >= 1){ this.top = topF; this.state = 'ready'; this.jolt = 1; }
      } else if (this.state === 'circle'){
        this.grow = Math.min(1, this.grow + 1 / C.growFrames);
      } else if (this.state === 'wobble'){
        // se tambalea cada vez más fuerte antes de soltarse
        this.w = Math.min(1, this.w + 1 / C.wobbleFrames);
        this.circle.x = this.from.x + Math.sin(this.w * Math.PI * 7) * br * 0.12 * this.w;
        this.circle.y = this.from.y + Math.abs(Math.sin(this.w * Math.PI * 7)) * br * 0.03 * this.w;
        if (this.w >= 1){ this.from = { ...this.circle }; this.state = 'fall'; }
      } else if (this.state === 'fall'){
        // cae por gravedad y se desliza hacia la punta del asta
        this.s = Math.min(1, this.s + 1 / C.fallFrames);
        const a = this.from, s = this.s;
        this.circle.x = a.x + (bowlF.x - a.x) * smooth(s);
        this.circle.y = a.y + (bowlF.y - a.y) * s * s;
        if (this.s >= 1){ this.state = 'fuse'; this.jolt = 0.7; }
      } else if (this.state === 'fuse'){
        this.e = Math.min(1, this.e + 1 / C.fuseFrames);
        if (this.e >= 1){ this.state = 'formed'; Cartela.show(this.obra); }
      } else if (this.state === 'formed' && ++this.endF > C.holdAfter){
        this.done = true;
      }
    },

    draw(){
      const jx = Math.sin(t * 2.7) * this.jolt * 5;   // vibración del asta al clavarse
      ctx.fillStyle = 'rgb(233,227,207)';

      if (this.state === 'fuse' || this.state === 'formed'){
        Glifo.render(g, fused, smooth(this.e));
        Glifo.draw(g, ctx, cx + jx, yF, 0, 1);
        return;
      }
      if (this.state !== 'wait') ctx.fillRect(towerX - stemW / 2 + jx, this.top, stemW, surf - this.top + 20);
      if (this.circle){
        const r = br * (this.state === 'circle' ? backOut(this.grow) : 1);
        ctx.beginPath(); ctx.arc(this.circle.x, this.circle.y, Math.max(0, r), 0, TAU); ctx.fill();
      }
    },

    rules(){
      return [['estado', { wait: 'suelo', rise: 'el asta sale y se clava', ready: 'asta clavada',
          circle: 'Pía (círculo)', wobble: 'se tambalea', fall: 'cae a la punta', fuse: 'se funden', formed: 'P formada' }[this.state]],
        ['acción siguiente', { ready: 'clic', circle: 'otro clic' }[this.state] || '—'],
        ['caída', (this.s * 100).toFixed(0) + ' %'],
        ['asta + círculo → P', (this.e * 100).toFixed(0) + ' %']];
    }
  };
}
