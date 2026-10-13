/* ---------- O · Ofelia ----------
   Un círculo cuelga de una cuerda de varios hilos. Cada pasada del mouse rompe un hilo.
   Al caer al río se hunde, suelta burbujas y el agua le abre el centro: el círculo se
   deforma hasta ser la O, que queda flotando medio hundida. */
function makeOfelia(){
  const C = P.ofelia, g = glifos.O;
  g.lastE = -1;
  const level = 0.6;
  const R = Math.max(g.gw, g.gh) * 0.47;
  const ax = W * 0.5, L = Math.max(H * level - R * 2.4, R * 1.4);
  const body = Bodies.circle(ax, L, R, { frictionAir: 0.004, density: 0.001, restitution: 0.1 });
  const rope = Constraint.create({ pointA: { x: ax, y: -10 }, bodyB: body, length: L + 10, stiffness: 1, damping: 0.02 });
  Composite.add(engine.world, [body, rope]);

  // círculo inicial; tiembla un poco mientras el agua lo deforma
  const disk = (x, y) => Math.hypot(x, y) - R * (1 + 0.025 * Math.sin(t * 0.21 + x * 0.045 - y * 0.03));

  return {
    level, style: ESTILOS.rio, center: body.position, R, done: false,
    body, rope, ax, state: 'hang', strands: C.strands, inside: false, lastPass: -99, idleF: 0,
    frac: 0, morph: 0, still: 0, endF: 0, bubbles: [], drops: [],

    pass(dir, mag){
      const b = this.body;
      Body.setVelocity(b, { x: b.velocity.x + dir * mag * C.push, y: b.velocity.y });
      this.strands--; this.lastPass = t; this.idleF = 0;
      if (this.strands <= 0){ Composite.remove(engine.world, this.rope); this.state = 'fall'; }
    },

    splash(vy){
      ripple = Math.min(18, 6 + vy * 1.2);
      const p = this.body.position;
      for (let k = 0; k < 34; k++){
        this.drops.push({ x: p.x + random(-R, R), y: surfaceY, vx: random(-3.5, 3.5),
          vy: -random(3, 9) * Math.min(1.4, vy / 10 + 0.5), s: S * random(0.03, 0.07) });
      }
    },

    freeze(){ Body.setStatic(this.body, true); this.state = 'frozen'; },

    update(interactive){
      const b = this.body, p = b.position, m = b.mass;

      if (this.state === 'hang' && interactive){
        const inside = Math.hypot(pointer.x - p.x, pointer.y - p.y) < R * 1.05;
        const sp = Math.hypot(pointer.vx, pointer.vy);
        if (inside && !this.inside && sp > C.passMinSpeed && t - this.lastPass > 12){
          this.pass(Math.sign(pointer.vx || (p.x - pointer.x)), Math.min(Math.max(Math.abs(pointer.vx), 8), 40));
        }
        this.inside = inside;
        if (SALA && ++this.idleF > C.idleWind * 60 && (this.idleF - C.idleWind * 60) % 180 === 0){
          this.pass(Math.random() < 0.5 ? -1 : 1, 14); // el viento: lo que nadie mira se cae solo
        }
      }

      if (this.state === 'fall' && p.y + R * 0.3 > surfaceY){ this.state = 'sink'; this.splash(b.velocity.y); }

      if (this.state === 'sink' || this.state === 'formed'){
        this.frac = constrain(((p.y + R) - surfaceY) / (2 * R), 0, 1);
        Body.applyForce(b, p, {
          x: m * 0.00003 * this.frac * Math.sin(t * 0.011) + m * 0.000002 * (W * 0.5 - p.x),
          y: -m * 0.001 * this.frac * C.buoyancy
        });
        b.frictionAir = 0.01 + 0.09 * this.frac;
        if (this.frac > 0.25) this.morph = Math.min(1, this.morph + 1 / C.morphFrames);

        // el aire sale por el centro mientras el agua lo abre
        if (this.frac > 0.45 && this.morph > 0.1 && this.morph < 1 && frameCount % 3 === 0){
          const r = R * 0.35 * (1 - this.morph);
          this.bubbles.push({ x: p.x + random(-r, r), y: p.y + random(-r, r), vy: random(-1.6, -0.6),
            s: S * random(0.03, 0.075) * (1.2 - this.morph * 0.6), ph: random(TAU) });
        }

        if (this.state === 'sink'){
          if (this.morph >= 1 && b.speed < 0.15 && Math.abs(this.frac - 0.5) < 0.12){
            if (++this.still > C.restFrames){ this.state = 'formed'; results.O = { x: p.x / W, angle: b.angle }; }
          } else this.still = 0;
        } else if (++this.endF > C.holdAfter) this.done = true;
      }

      for (const o of this.bubbles){ o.vy -= 0.02; o.y += o.vy; o.x += Math.sin(t * 0.08 + o.ph) * 0.6; }
      this.bubbles = this.bubbles.filter(o => o.y > surfaceY + 4);
      for (const d of this.drops){ d.vy += 0.25; d.x += d.vx; d.y += d.vy; }
      this.drops = this.drops.filter(d => !(d.y > surfaceY && d.vy > 0));
    },

    draw(){
      const b = this.body, p = b.position;

      if (this.state === 'hang'){
        ctx.strokeStyle = 'rgb(233,227,207)'; ctx.lineWidth = 0.8;
        for (let k = 0; k < this.strands; k++){
          const off = (k - (this.strands - 1) / 2) * 1.6;
          ctx.globalAlpha = 0.25 + 0.12 * this.strands;
          ctx.beginPath(); ctx.moveTo(this.ax + off, -10); ctx.lineTo(p.x + off, p.y - R * 0.95); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      if (this.morph <= 0){
        ctx.fillStyle = 'rgb(233,227,207)';
        ctx.beginPath(); ctx.arc(p.x, p.y, R, 0, TAU); ctx.fill();
      } else {
        Glifo.render(g, disk, smooth(this.morph));
        Glifo.draw(g, ctx, p.x, p.y, b.angle, 1);
      }

      ctx.fillStyle = 'rgb(233,227,207)'; ctx.textAlign = 'center';
      for (const o of this.bubbles){ ctx.globalAlpha = 0.5; ctx.font = `${o.s}px ${FONT}`; ctx.fillText('o', o.x, o.y); }
      for (const d of this.drops){ ctx.globalAlpha = 0.7; ctx.font = `${d.s}px ${FONT}`; ctx.fillText('o', d.x, d.y); }
      ctx.globalAlpha = 1;
    },

    rules(){
      return [['estado', { hang: 'colgando', fall: 'cayendo', sink: 'hundiéndose', formed: 'formada', frozen: 'cubierta' }[this.state]],
        ['hilos de la cuerda', this.strands + ' / ' + C.strands],
        ['parte sumergida', (this.frac * 100).toFixed(0) + ' %'],
        ['círculo → O', (this.morph * 100).toFixed(0) + ' %']];
    }
  };
}
