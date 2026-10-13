/* ---------- O · Ofelia ---------- */
function makeOfelia(){
  const R = Math.max(glyph.gw, glyph.gh) * 0.47;
  const ax = W * 0.5, L = Math.max(surfaceY - R * 2.4, R * 1.4);
  const body = Bodies.circle(ax, L, R, { frictionAir: 0.004, density: 0.001, restitution: 0.1 });
  const rope = Constraint.create({ pointA: { x: ax, y: -10 }, bodyB: body, length: L + 10, stiffness: 1, damping: 0.02 });
  Composite.add(engine.world, [body, rope]);

  return {
    letter: 'O', body, R, rope, ax,
    state: 'hang', strands: P.strands, inside: false, lastPass: -99, idleF: 0,
    frac: 0, morph: 0, still: 0, endF: 0, bubbles: [], drops: [],

    pass(dir, mag){
      const b = this.body;
      Body.setVelocity(b, { x: b.velocity.x + dir * mag * P.push, y: b.velocity.y });
      this.strands--; this.lastPass = t; this.idleF = 0;
      for (let k = 0; k < 4; k++) this.drops.push({ x: this.ax + random(-3, 3), y: random(0, 30), vx: random(-1, 1), vy: random(0, 1), s: S * 0.03, air: true });
      if (this.strands <= 0) this.cut();
    },

    cut(){
      Composite.remove(engine.world, this.rope);
      this.state = 'fall';
    },

    splash(vy){
      ripple = Math.min(18, 6 + vy * 1.2);
      const p = this.body.position;
      for (let k = 0; k < 34; k++){
        this.drops.push({ x: p.x + random(-this.R, this.R), y: surfaceY, vx: random(-3.5, 3.5), vy: -random(3, 9) * Math.min(1.4, vy / 10 + 0.5), s: S * random(0.03, 0.07) });
      }
    },

    update(){
      const b = this.body, p = b.position, m = b.mass;

      if (this.state === 'hang'){
        const inside = Math.hypot(pointer.x - p.x, pointer.y - p.y) < this.R * 1.05;
        const sp = Math.hypot(pointer.vx, pointer.vy);
        if (inside && !this.inside && sp > P.passMinSpeed && t - this.lastPass > 12){
          this.pass(Math.sign(pointer.vx || (p.x - pointer.x)), Math.min(Math.max(Math.abs(pointer.vx), 8), 40));
        }
        this.inside = inside;
        if (SALA && ++this.idleF > P.idleWind * 60 && (this.idleF - P.idleWind * 60) % 180 === 0){
          this.pass(Math.random() < 0.5 ? -1 : 1, 14); // el viento: lo que nadie mira se cae solo
        }
      }

      if (this.state === 'fall' && p.y + this.R * 0.3 > surfaceY){
        this.state = 'sink';
        this.splash(b.velocity.y);
      }

      if (this.state === 'sink' || this.state === 'formed'){
        this.frac = constrain(((p.y + this.R) - surfaceY) / (2 * this.R), 0, 1);
        Body.applyForce(b, p, {
          x: m * 0.00003 * this.frac * Math.sin(t * 0.011) + m * 0.000002 * (W * 0.5 - p.x),
          y: -m * 0.001 * this.frac * P.buoyancy
        });
        b.frictionAir = 0.01 + 0.09 * this.frac;
        this.morph = Math.min(1, this.morph + 1 / P.morphFrames);

        if (this.frac > 0.55 && this.morph < 1 && frameCount % 4 === 0){
          const a = b.angle - Math.PI / 2 + random(-0.6, 0.6), r = this.R * 0.35;
          this.bubbles.push({ x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r, vy: random(-1.4, -0.5), s: S * random(0.035, 0.08), ph: random(TAU) });
        }

        if (this.state === 'sink'){
          if (this.morph >= 1 && b.speed < 0.15 && Math.abs(this.frac - 0.5) < 0.12){
            if (++this.still > P.restFrames){
              this.state = 'formed';
              results.O = { passes: P.strands, x: p.x / W, angle: b.angle };
            }
          } else this.still = 0;
        } else if (++this.endF > P.holdAfter){
          fade = Math.min(1, fade + 0.02);
          if (fade >= 1) startScene(sceneIndex + 1);
        }
      }

      for (const o of this.bubbles){ o.vy -= 0.02; o.y += o.vy; o.x += Math.sin(t * 0.08 + o.ph) * 0.6; }
      this.bubbles = this.bubbles.filter(o => o.y > surfaceY + 4);
      for (const d of this.drops){ d.vy += 0.25; d.x += d.vx; d.y += d.vy; }
      this.drops = this.drops.filter(d => d.air ? d.y < surfaceY : !(d.y > surfaceY && d.vy > 0));
    },

    draw(){
      const b = this.body, p = b.position, R = this.R;

      if (this.state === 'hang'){
        ctx.strokeStyle = COL.bone; ctx.lineWidth = 0.8;
        for (let k = 0; k < this.strands; k++){
          const off = (k - (this.strands - 1) / 2) * 1.6;
          ctx.globalAlpha = 0.25 + 0.12 * this.strands;
          ctx.beginPath(); ctx.moveTo(this.ax + off, -10); ctx.lineTo(p.x + off, p.y - R * 0.95); ctx.stroke();
        }
      }

      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(b.angle); ctx.fillStyle = COL.bone;
      const mo = this.morph, ease = mo * mo * (3 - 2 * mo);
      if (mo < 1){
        ctx.globalAlpha = 1 - constrain((mo - 0.7) / 0.3, 0, 1);
        const rx = lerp(R, glyph.gw / 2, ease), ry = lerp(R, glyph.gh / 2, ease);
        const hx = glyph.gw * 0.29 * ease, hy = glyph.gh * 0.36 * ease;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
        if (hx > 0.5){ ctx.moveTo(hx, 0); ctx.ellipse(0, 0, hx, hy, 0, 0, TAU); }
        ctx.fill('evenodd');
      }
      if (mo > 0.6){
        ctx.globalAlpha = constrain((mo - 0.6) / 0.4, 0, 1);
        ctx.font = `${S}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('O', glyph.dx, glyph.dy);
      }
      ctx.restore();

      ctx.fillStyle = COL.bone; ctx.textAlign = 'center';
      for (const o of this.bubbles){ ctx.globalAlpha = 0.5; ctx.font = `${o.s}px ${FONT}`; ctx.fillText('o', o.x, o.y); }
      for (const d of this.drops){ ctx.globalAlpha = 0.7; ctx.font = `${d.s}px ${FONT}`; ctx.fillText('o', d.x, d.y); }
      ctx.globalAlpha = 1;
    },

    rules(){
      return [['estado', { hang: 'colgando', fall: 'cayendo', sink: 'hundiéndose', formed: 'formada' }[this.state]],
        ['hilos de la cuerda', this.strands + ' / ' + P.strands],
        ['parte sumergida', (this.frac * 100).toFixed(0) + ' %'],
        ['círculo → O', (this.morph * 100).toFixed(0) + ' %']];
    }
  };
}
