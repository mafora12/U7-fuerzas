/* ---------- H · Haidée ----------
   En el Don Juan de Byron, Haidée encuentra a Don Juan náufrago en la playa y se enamoran.
   Su padre los separa y ella muere de pena.
   Parte de: un asta de pie (Haidée) y otra tirada en la arena (Don Juan).
   Arrastrar a Don Juan: se levanta y lo llevas hacia ella. Si queda cerca, nace entre los
   dos un travesaño que los une como un resorte.
   Arrastrarlo otra vez para separarlos: el travesaño se estira y se adelgaza. Si lo sueltas
   antes de tiempo, el resorte lo devuelve. Si lo estiras demasiado, el travesaño se quiebra,
   el golpe los junta y queda la H con el travesaño roto. */
function makeHaidee(){
  const C = P.haidee, g = glifos.H;
  g.lastE = -1;
  const [ls, rs] = Glifo.stems(g);
  const bar = Glifo.bar(g, ls.x1, rs.x0);
  const level = 0.84, surf = H * level;
  const cx = W * 0.5;
  const stemW = ls.x1 - ls.x0, stemH = ls.y1 - ls.y0;
  const yF = surf - ls.y1 + stemH * 0.04;               // la H se para sobre la arena
  const hX = cx + (ls.x0 + ls.x1) / 2;                   // Haidée (asta izquierda)
  const D0 = (rs.x0 + rs.x1) / 2 - (ls.x0 + ls.x1) / 2;  // distancia entre astas en la H
  const len = stemH * 0.96;                              // largo visible de cada asta
  const barY = yF + (bar.y0 + bar.y1) / 2, barH = bar.y1 - bar.y0;
  const minX = hX + stemW * 1.3, maxX = W - stemW;

  const box = (cxL, b) => ({ cx: cxL, cy: (b.y0 + b.y1) / 2, hx: stemW / 2, hy: (b.y1 - b.y0) / 2 });
  const shapes = {
    l: box((ls.x0 + ls.x1) / 2, ls), r: box((rs.x0 + rs.x1) / 2, rs),
    bar: { cx: (ls.x1 + rs.x0) / 2, cy: (bar.y0 + bar.y1) / 2, hx: (rs.x0 - ls.x1) / 2 + 1, hy: barH / 2 }
  };
  const united = (x, y) => Math.min(Glifo.box(x, y, shapes.l), Glifo.box(x, y, shapes.r), Glifo.box(x, y, shapes.bar));

  return {
    level, style: ESTILOS.playa, center: { x: cx, y: surf }, R: D0, done: false,
    letter: 'H', dustChar: 'h',
    obra: { quien: 'Haidée', obra: 'The Finding of Don Juan by Haidée', autor: 'Ford Madox Brown · 1869' },
    state: 'lying', jx: W * 0.86, vx: 0, angle: -Math.PI / 2, grabbed: false, grabDX: 0,
    grow: 0, crackF: 0, e: 0, endF: 0, idleF: 0, frozen: false, auto: null, crumbs: [],

    focus(){ return { x: (hX + this.jx) / 2, y: surf - len * 0.5 }; },
    edge(){
      if (Math.random() < 0.5) return { x: hX + (Math.random() < 0.5 ? -1 : 1) * stemW / 2, y: random(surf - len, surf) };
      const a = this.angle, s = random(0, len);
      return { x: this.jx + Math.sin(a) * s, y: surf - Math.cos(a) * s };
    },

    // Don Juan: la base está en la arena; el asta va de la base hacia arriba (o tumbada a la derecha)
    nearJuan(x, y){
      const a = this.angle, tx = this.jx + Math.sin(a) * len, ty = surf - Math.cos(a) * len;
      const vx = tx - this.jx, vy = ty - surf, l2 = vx * vx + vy * vy;
      const u = constrain(((x - this.jx) * vx + (y - surf) * vy) / l2, 0, 1);
      return Math.hypot(x - (this.jx + vx * u), y - (surf + vy * u)) < Math.max(stemW * 2.5, S * 0.12);
    },

    press(x, y){
      if (this.frozen || this.state === 'crack' || this.state === 'fuse' || this.state === 'formed') return;
      if (!this.nearJuan(x, y)) return;
      this.grabbed = true; this.grabDX = this.jx - x; this.idleF = 0;
      if (this.state === 'bound') this.state = 'stretch';
      Memoria.give(this, P.memoria.action * 0.5);
    },
    release(){
      if (!this.grabbed) return;
      this.grabbed = false;
      if (this.state === 'stretch') this.state = 'bound';   // el resorte lo devuelve
    },
    freeze(){ this.frozen = true; },

    update(interactive){
      for (const c of this.crumbs){ c.vy += 0.3; c.x += c.vx; c.y += c.vy; }
      this.crumbs = this.crumbs.filter(c => c.y < surf);
      if (this.frozen || !interactive) return;

      // modo sala: si nadie viene, el mar lo arrastra solo
      if (SALA && !this.grabbed && ++this.idleF > C.idleWind * 60){
        if (this.state === 'lying' || this.state === 'standing') this.auto = hX + D0;
        if (this.state === 'bound') this.auto = hX + D0 * (C.breakRatio + 0.2);
      }
      const target = this.grabbed ? constrain(pointer.x + this.grabDX, minX, maxX) : this.auto;
      if (this.grabbed) Memoria.give(this, 0.004);

      if (this.state === 'lying' || this.state === 'standing'){
        if (target != null){
          this.state = 'standing';
          this.jx += (target - this.jx) * (this.auto != null ? 0.03 : 0.35);
          if (Math.abs(this.jx - (hX + D0)) < D0 * C.bondRange){
            this.state = 'bonding'; this.grow = 0; this.auto = null;
            Memoria.give(this, P.memoria.action);
          }
        }
        if (this.state !== 'lying') this.angle *= 0.82;      // se levanta
      } else if (this.state === 'bonding'){
        this.angle *= 0.82;
        this.grow = Math.min(1, this.grow + 1 / 30);
        this.springTo(hX + D0, 1);
        if (this.grow >= 1) this.state = 'bound';
      } else if (this.state === 'bound'){
        if (this.auto != null && SALA){ this.state = 'stretch'; }
        else this.springTo(hX + D0, 1);
      } else if (this.state === 'stretch'){
        const tg = target != null ? target : hX + D0;
        this.jx += (constrain(tg, minX, maxX) - this.jx) * (this.auto != null ? 0.02 : 0.35);
        if (this.jx - hX > D0 * C.breakRatio) this.crack();
      } else if (this.state === 'crack'){
        this.springTo(hX + D0, 2.2);                          // el golpe los junta
        this.crackF++;
        if (this.crackF > 20 && Math.abs(this.jx - (hX + D0)) < 1.5 && Math.abs(this.vx) < 0.6){
          this.jx = hX + D0; this.state = 'fuse';
        }
      } else if (this.state === 'fuse'){
        this.e = Math.min(1, this.e + 1 / C.fuseFrames);
        if (this.e >= 1){ this.state = 'formed'; Memoria.lock(this); }
      } else if (this.state === 'formed' && ++this.endF > C.holdAfter){
        this.done = true;
      }
    },

    springTo(x, strength){
      this.vx += (x - this.jx) * C.spring * strength;
      this.vx *= C.damping;
      this.jx += this.vx;
    },

    crack(){
      this.state = 'crack'; this.grabbed = false; this.auto = null; this.crackF = 0; this.vx = 0;
      Memoria.give(this, P.memoria.action * 0.7);
      const mx = (hX + this.jx) / 2;
      for (let k = 0; k < 16; k++){
        this.crumbs.push({ x: mx + random(-6, 6), y: barY + random(-barH, barH), vx: random(-3, 3), vy: random(-4, 0), s: S * random(0.03, 0.05) });
      }
    },

    draw(){
      ctx.fillStyle = 'rgb(233,227,207)';
      if (this.state === 'fuse' || this.state === 'formed'){
        Glifo.render(g, united, smooth(this.e));
        Glifo.draw(g, ctx, cx, yF, 0, 1);
        this.drawCrack(cx + shapes.bar.cx, 1);
      } else {
        // Haidée
        ctx.fillRect(hX - stemW / 2, surf - len, stemW, len + 4);
        // Don Juan
        ctx.save(); ctx.translate(this.jx, surf); ctx.rotate(this.angle);
        ctx.fillRect(-stemW / 2, -len, stemW, len + 4);
        ctx.restore();
        // travesaño: nace de Haidée, se estira y se adelgaza
        if (this.state === 'bonding' || this.state === 'bound' || this.state === 'stretch' || this.state === 'crack'){
          const x0 = hX + stemW / 2, x1 = this.jx - stemW / 2;
          const span = Math.max(0, x1 - x0) * (this.state === 'bonding' ? smooth(this.grow) : 1);
          const thin = constrain((D0 - stemW) / Math.max(1, x1 - x0), 0.22, 1);
          if (this.state === 'crack'){
            const half = span / 2, gap = 6 * (1 - Math.min(1, this.crackF / 18));
            ctx.fillRect(x0, barY - barH / 2, half - gap, barH);
            ctx.fillRect(x0 + half + gap, barY - barH / 2, half - gap, barH);
            this.drawCrack(x0 + half, 1);
          } else {
            ctx.fillRect(x0, barY - barH * thin / 2, span, barH * thin);
          }
        }
      }
      ctx.fillStyle = 'rgb(233,227,207)'; ctx.textAlign = 'center';
      for (const c of this.crumbs){ ctx.globalAlpha = 0.8; ctx.font = `${c.s}px ${FONT}`; ctx.fillText('h', c.x, c.y); }
      ctx.globalAlpha = 1;
    },

    // grieta en zigzag atravesando el travesaño
    drawCrack(x, a){
      const h = barH * 1.15, n = 5;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = ESTILOS.playa.sky[1]; ctx.lineWidth = Math.max(1.5, barH * 0.12); ctx.lineJoin = 'miter';
      ctx.beginPath();
      for (let i = 0; i <= n; i++){
        const y = barY - h / 2 + (h * i) / n, dx = (i % 2 ? 1 : -1) * barH * 0.18;
        i ? ctx.lineTo(x + dx, y) : ctx.moveTo(x + dx, y);
      }
      ctx.stroke(); ctx.restore();
    },

    rules(){
      return [['estado', { lying: 'Don Juan en la arena', standing: 'de pie', bonding: 'nace el travesaño',
          bound: 'unidos', stretch: 'los separas', crack: 'se quiebra', fuse: 'se funden', formed: 'H formada' }[this.state]],
        ['acción siguiente', { lying: 'arrastrar a Don Juan', standing: 'acercarlo a Haidée', bound: 'arrastrarlo lejos', stretch: 'más lejos' }[this.state] || '—'],
        ['estiramiento', ((this.jx - hX) / D0).toFixed(2) + ' / ' + C.breakRatio],
        ['astas + travesaño → H', (this.e * 100).toFixed(0) + ' %']];
    }
  };
}
