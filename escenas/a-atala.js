/* ---------- A · Atala ----------
   En la novela de Chateaubriand, Atala le prometió a su madre moribunda que nunca se casaría.
   Se enamora de Chactas y, antes que romper el voto, se envenena.
   Parte de: dos astas inclinadas que se buscan pero no se tocan (Atala y Chactas).
   Arrastrar a Chactas (el asta de la derecha) hacia Atala: si sus puntas se encuentran,
   quedan unidas en la cima.
   Clic (en cualquier parte): aparece el voto, el travesaño entre los dos. El voto se
   envenena de abajo hacia arriba y, cuando el veneno lo llena, se funden en la A. */
function makeAtala(){
  const C = P.atala, g = glifos.A, d = Glifo.diagonals(g);
  g.lastE = -1;
  const level = 0.84, surf = H * level;
  const cx = W * 0.5;
  const yF = surf - d.bot - 1;
  const L = d.left, R = d.right;
  const world = (s, dx) => ({ x0: cx + s.x0 + dx, y0: yF + s.y0, x1: cx + s.x1 + dx, y1: yF + s.y1, w: s.w });
  const crossY = yF + (d.cross.y0 + d.cross.y1) / 2, crossH = d.cross.y1 - d.cross.y0;
  // en la altura del travesaño, dónde está cada asta
  const xAt = (s, y) => s.x0 + (s.x1 - s.x0) * (y - s.y0) / (s.y1 - s.y0);
  const crossL = { cx: (xAt(L, (d.cross.y0 + d.cross.y1) / 2) + xAt(R, (d.cross.y0 + d.cross.y1) / 2)) / 2,
                   cy: (d.cross.y0 + d.cross.y1) / 2,
                   hx: (xAt(R, (d.cross.y0 + d.cross.y1) / 2) - xAt(L, (d.cross.y0 + d.cross.y1) / 2)) / 2, hy: crossH / 2 };
  const shape = (x, y) => Math.min(Glifo.seg(x, y, L), Glifo.seg(x, y, R), Glifo.box(x, y, crossL));
  const startDX = Math.min(W * 0.28, W - (cx + R.x0) - S * 0.2);
  const poison = [122, 168, 96];

  return {
    level, style: ESTILOS.gruta, center: { x: cx, y: surf }, R: g.gw, done: false,
    letter: 'A', dustChar: 'a',
    obra: { quien: 'Atala', obra: 'Atala au tombeau', autor: 'Anne-Louis Girodet · 1808 · Louvre' },
    state: 'apart', joinT: 0, dx: startDX, grabbed: false, grabOff: 0, vow: 0, venom: 0, e: 0, endF: 0, idleF: 0, frozen: false,

    focus(){ return { x: cx + this.dx / 2, y: yF }; },
    edge(){
      const s = Math.random() < 0.5 ? world(L, 0) : world(R, this.dx), u = Math.random();
      return { x: s.x0 + (s.x1 - s.x0) * u + random(-s.w / 2, s.w / 2), y: s.y0 + (s.y1 - s.y0) * u };
    },

    nearChactas(x, y){
      const s = world(R, this.dx);
      return Glifo.seg(x, y, s) < Math.max(S * 0.12, s.w * 2);
    },
    press(x, y){
      if (this.frozen || this.state !== 'apart' || !this.nearChactas(x, y)) return;
      this.grabbed = true; this.grabOff = this.dx - x; this.idleF = 0;
      Memoria.give(this, P.memoria.action * 0.4);
    },
    release(){ this.grabbed = false; },
    click(){
      if (this.frozen || this.state !== 'joined' || t - this.joinT < 20) return;  // el clic al soltar el arrastre no cuenta
      this.state = 'vow'; this.idleF = 0;                                   // el voto aparece
      Memoria.give(this, P.memoria.action);
    },
    freeze(){ this.frozen = true; this.grabbed = false; },

    update(interactive){
      if (this.frozen || !interactive) return;
      if (SALA && !this.grabbed && ++this.idleF > C.idleWind * 60){
        if (this.state === 'apart') this.dx = Math.max(0, this.dx - 2);
        if (this.state === 'joined') this.click();
      }

      if (this.state === 'apart'){
        if (this.grabbed){
          this.dx = constrain(pointer.x + this.grabOff, 0, startDX * 1.2);
          Memoria.give(this, 0.003);
        }
        // se buscan: cuando están cerca, se atraen un poco
        if (!this.grabbed && this.dx < C.attract) this.dx *= 0.9;
        if (this.dx < 2){ this.dx = 0; this.state = 'joined'; this.joinT = t; this.grabbed = false; Memoria.give(this, P.memoria.action); }
      } else if (this.state === 'vow'){
        this.vow = Math.min(1, this.vow + 1 / 30);
        if (this.vow >= 1) this.venom = Math.min(1, this.venom + 1 / (C.poison * 60));
        if (this.venom >= 1) this.state = 'fuse';
      } else if (this.state === 'fuse'){
        this.e = Math.min(1, this.e + 1 / C.fuseFrames);
        if (this.e >= 1){ this.state = 'formed'; Memoria.lock(this); }
      } else if (this.state === 'formed' && ++this.endF > C.holdAfter){
        this.done = true;
      }
    },

    rod(s){
      ctx.beginPath(); ctx.moveTo(s.x0, s.y0 + 2); ctx.lineTo(s.x1, s.y1); ctx.lineWidth = s.w; ctx.lineCap = 'butt'; ctx.stroke();
    },

    draw(){
      const bone = 'rgb(233,227,207)';
      if (this.state === 'fuse' || this.state === 'formed'){
        Glifo.render(g, shape, smooth(this.e));
        Glifo.draw(g, ctx, cx, yF, 0, 1);
        return;
      }
      ctx.strokeStyle = bone;
      this.rod(world(L, 0));
      this.rod(world(R, this.dx));
      if (this.state === 'vow'){
        // el voto: crece desde el centro; el veneno lo llena de abajo hacia arriba
        const w = crossL.hx * 2 * smooth(this.vow), x0 = cx + crossL.cx - w / 2, y0 = crossY - crossH / 2;
        ctx.fillStyle = bone; ctx.fillRect(x0, y0, w, crossH);
        const ph = crossH * this.venom;
        ctx.fillStyle = `rgb(${poison.join(',')})`; ctx.fillRect(x0, y0 + crossH - ph, w, ph);
        // el veneno también sube por las astas
        if (this.venom > 0){
          ctx.save(); ctx.globalAlpha = 0.55 * this.venom; ctx.strokeStyle = `rgb(${poison.join(',')})`;
          const up = this.venom;
          for (const s of [world(L, 0), world(R, 0)]){
            const yy = crossY - (crossY - s.y1) * up, xx = s.x0 + (s.x1 - s.x0) * (yy - s.y0) / (s.y1 - s.y0);
            const xc = s.x0 + (s.x1 - s.x0) * (crossY - s.y0) / (s.y1 - s.y0);
            ctx.beginPath(); ctx.moveTo(xc, crossY); ctx.lineTo(xx, yy); ctx.lineWidth = s.w; ctx.stroke();
          }
          ctx.restore();
        }
      }
    },

    rules(){
      return [['estado', { apart: this.grabbed ? 'lo acercas' : 'se buscan', joined: 'unidos en la cima', vow: this.venom > 0 ? 'el voto se envenena' : 'aparece el voto', fuse: 'se funden', formed: 'A formada' }[this.state]],
        ['acción', { apart: 'arrastrar a Chactas', joined: 'clic' }[this.state] || '—'],
        ['distancia', this.dx.toFixed(0) + ' px'],
        ['veneno', (this.venom * 100).toFixed(0) + ' %']];
    }
  };
}
