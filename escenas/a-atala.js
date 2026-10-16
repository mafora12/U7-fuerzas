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
  const poison = 'rgb(70,255,60)';   // verde veneno: se dibuja fuera del filtro del olvido para que siempre se vea

  return {
    level, style: ESTILOS.gruta, center: { x: cx, y: surf }, R: g.gw, done: false,
    letter: 'A', dustChar: 'a',
    obra: { quien: 'Atala', obra: 'Atala au tombeau', autor: 'Anne-Louis Girodet · 1808 · Louvre', muerte: 'Se envenenó antes que romper un voto.' },
    state: 'apart', joinT: 0, dx: startDX, grabbed: false, grabOff: 0, vow: 0, venom: 0, drips: [], e: 0, endF: 0, idleF: 0, frozen: false,

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

    },
    release(){ this.grabbed = false; },
    click(){
      if (this.frozen || this.state !== 'joined' || t - this.joinT < 20) return;  // el clic al soltar el arrastre no cuenta
      this.state = 'vow'; this.idleF = 0;                                   // el voto aparece

    },
    freeze(){ this.frozen = true; this.grabbed = false; },

    update(interactive){
      for (const d of this.drips){ d.vy += 0.25; d.y += d.vy; if (d.y > surf) d.a -= 0.1; }
      this.drips = this.drips.filter(d => d.a > 0);
      if (this.frozen || !interactive) return;
      if (SALA && !this.grabbed && ++this.idleF > C.idleWind * 60){
        if (this.state === 'apart') this.dx = Math.max(0, this.dx - 2);
        if (this.state === 'joined') this.click();
      }

      if (this.state === 'apart'){
        if (this.grabbed){
          this.dx = constrain(pointer.x + this.grabOff, 0, startDX * 1.2);
        }
        // se buscan: cuando están cerca, se atraen un poco
        if (!this.grabbed && this.dx < C.attract) this.dx *= 0.9;
        if (this.dx < 2){ this.dx = 0; this.state = 'joined'; this.joinT = t; this.grabbed = false; }
      } else if (this.state === 'vow'){
        this.vow = Math.min(1, this.vow + 1 / 30);
        if (this.vow >= 1) this.venom = Math.min(1, this.venom + 1 / (C.poison * 60));
        if (this.venom >= 1) this.state = 'fuse';
        // gotas de veneno que caen del voto
        if (this.venom > 0 && this.venom < 1 && Math.random() < 0.25){
          this.drips.push({ x: cx + crossL.cx + random(-crossL.hx, crossL.hx), y: crossY + crossH / 2, vy: 0, a: 1 });
        }
      } else if (this.state === 'fuse'){
        this.e = Math.min(1, this.e + 1 / C.fuseFrames);
        if (this.e >= 1){ this.state = 'formed'; Cartela.show(this.obra); }
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
        // el voto: crece desde el centro
        const w = crossL.hx * 2 * smooth(this.vow), x0 = cx + crossL.cx - w / 2, y0 = crossY - crossH / 2;
        ctx.fillStyle = bone; ctx.fillRect(x0, y0, w, crossH);
      }
    },

    // el veneno va en su propia capa, a opacidad completa y sin el gris del olvido
    drawFx(f){
      if (this.state === 'formed') return;
      if (this.state === 'fuse'){
        // se funde como las demás letras: la forma verde se deforma hasta ser la A
        // de la tipografía y el verde se apaga mientras tanto
        const n = g.N, sz = n / g.k;
        if (!this.tint){ this.tint = document.createElement('canvas'); this.tint.width = this.tint.height = n; }
        const tc = this.tint.getContext('2d');
        tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, n, n);
        tc.drawImage(g.cv, 0, 0);
        tc.globalCompositeOperation = 'source-in'; tc.fillStyle = poison; tc.fillRect(0, 0, n, n);
        f.save();
        f.globalAlpha = 1 - smooth(this.e);
        f.shadowColor = poison; f.shadowBlur = 18 * (1 - this.e);
        f.drawImage(this.tint, cx - sz / 2, yF - sz / 2, sz, sz);
        f.restore();
        return;
      }
      if (this.venom <= 0 && !this.drips.length) return;
      const v = this.venom;
      f.save();
      f.shadowColor = poison; f.shadowBlur = 18;
      f.fillStyle = poison; f.strokeStyle = poison;
      // el voto se llena de abajo hacia arriba
      const x0 = cx + crossL.cx - crossL.hx, y0 = crossY - crossH / 2, ph = crossH * Math.min(1, v * 1.4);
      f.fillRect(x0, y0 + crossH - ph, crossL.hx * 2, ph);
      // y sube por las dos astas hasta la cima
      const up = smooth(v);
      for (const s0 of [world(L, 0), world(R, 0)]){
        const xAtY = y => s0.x0 + (s0.x1 - s0.x0) * (y - s0.y0) / (s0.y1 - s0.y0);
        const yy = crossY - (crossY - s0.y1) * up, yd = crossY + (s0.y0 - crossY) * up * 0.6;
        f.beginPath(); f.moveTo(xAtY(yd), yd); f.lineTo(xAtY(yy), yy); f.lineWidth = s0.w * 0.9; f.lineCap = 'butt'; f.stroke();
      }
      // gotas
      f.shadowBlur = 8;
      for (const d of this.drips){ f.globalAlpha = d.a; f.beginPath(); f.arc(d.x, d.y, Math.max(2, crossH * 0.25), 0, TAU); f.fill(); }
      f.restore();
    },

    rules(){
      return [['estado', { apart: this.grabbed ? 'lo acercas' : 'se buscan', joined: 'unidos en la cima', vow: this.venom > 0 ? 'el voto se envenena' : 'aparece el voto', fuse: 'se funden', formed: 'A formada' }[this.state]],
        ['acción', { apart: 'arrastrar a Chactas', joined: 'clic' }[this.state] || '—'],
        ['distancia', this.dx.toFixed(0) + ' px'],
        ['veneno', (this.venom * 100).toFixed(0) + ' %']];
    }
  };
}
