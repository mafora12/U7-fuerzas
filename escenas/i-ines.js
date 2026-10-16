/* ---------- I · Inés de Castro ----------
   Amante del príncipe Pedro de Portugal, fue asesinada por orden del rey. Según la leyenda,
   cuando Pedro llegó al trono la hizo coronar reina después de muerta.
   Parte de: un asta lisa de pie, sin remates.
   Primer clic: la asesinan y cae al suelo.
   Clics insistentes: cada clic la levanta un poco; si dejas de insistir, vuelve a caer.
   Si logras ponerla de pie, baja una corona y se funde con ella: la I con sus remates.
   Es la única que vuelve: rescatar a alguien del olvido exige insistir. */
function makeInes(){
  const C = P.ines, g = glifos.I, st = Glifo.stem(g);
  g.lastE = -1;
  const level = 0.84, surf = H * level;
  const cx = W * 0.5;
  const stemW = st.x1 - st.x0, stemH = st.y1 - st.y0;
  const yF = surf - st.y1 - 1;
  const baseX = cx + (st.x0 + st.x1) / 2;
  const len = stemH;
  // la corona: el remate de arriba de la I (ancho de la letra, alto de un remate)
  const crownH = Math.max(3, stemH * 0.07);
  const crownTarget = yF + st.y0 + crownH / 2;
  const stemBox = { cx: (st.x0 + st.x1) / 2, cy: (st.y0 + st.y1) / 2, hx: stemW / 2, hy: stemH / 2 };
  const crownBox = { cx: 0, cy: st.y0 + crownH / 2, hx: g.gw / 2, hy: crownH / 2 };
  const crowned = (x, y) => Math.min(Glifo.box(x, y, stemBox), Glifo.box(x, y, crownBox));
  const gold = 'rgb(226,190,110)';

  return {
    level, style: ESTILOS.palacio, center: { x: baseX, y: surf }, R: len, done: false,
    letter: 'I', dustChar: 'i',
    obra: { quien: 'Inés de Castro', obra: 'The Coronation of Inês de Castro in 1361', autor: 'Pierre-Charles Comte · 1849' },
    state: 'standing', a: 0, av: 0, clicks: 0, crownY: -S, still: 0, e: 0, endF: 0, idleF: 0, frozen: false, shards: [],

    focus(){ return { x: baseX + Math.sin(this.a) * len * 0.5, y: surf - Math.cos(this.a) * len * 0.5 }; },
    edge(){
      const s = random(0, len), side = (Math.random() < 0.5 ? -1 : 1) * stemW / 2;
      return { x: baseX + Math.sin(this.a) * s + Math.cos(this.a) * side, y: surf - Math.cos(this.a) * s + Math.sin(this.a) * side };
    },

    click(){
      if (this.frozen) return;
      this.idleF = 0;
      if (this.state === 'standing'){
        this.state = 'fallen'; this.av = -0.03; this.clicks = 0;            // la asesinan

        for (let k = 0; k < 10; k++) this.shards.push({ x: baseX, y: surf - len * random(0.3, 0.9), vx: random(-3, 1), vy: random(-3, 0), s: S * random(0.03, 0.05) });
      } else if (this.state === 'fallen'){
        this.av += C.lift; this.clicks++;                                  // insistir: levantarla

      }
    },
    freeze(){ this.frozen = true; },

    update(interactive){
      for (const s of this.shards){ s.vy += 0.25; s.x += s.vx; s.y += s.vy; }
      this.shards = this.shards.filter(s => s.y < surf);
      if (this.frozen) return;

      if (SALA && interactive && ++this.idleF > C.idleWind * 60 && (this.state === 'standing' || (this.state === 'fallen' && this.idleF % 9 === 0))){
        this.click(); this.idleF = C.idleWind * 60;
      }

      if (this.state === 'fallen'){
        // péndulo invertido: de pie es inestable, la gravedad la tumba
        this.av += C.gravity * Math.sin(this.a);
        this.av *= C.damping;
        this.a += this.av;
        if (this.a <= -Math.PI / 2){ this.a = -Math.PI / 2; this.av = Math.max(0, this.av) * 0.2; }
        if (this.a > 0.04) { this.a = 0.04; this.av = Math.min(0, this.av); }
        // de pie otra vez: la sostienes un instante y llega la corona
        if (Math.abs(this.a) < 0.05){ if (++this.still > 6){ this.state = 'crowning'; this.a = 0; this.av = 0; } }
        else this.still = 0;
      } else if (this.state === 'crowning'){
        this.crownY += (crownTarget - this.crownY) * 0.08 + 1;
        if (this.crownY >= crownTarget){ this.crownY = crownTarget; this.state = 'fuse'; }
      } else if (this.state === 'fuse'){
        this.e = Math.min(1, this.e + 1 / C.fuseFrames);
        if (this.e >= 1){ this.state = 'formed'; Cartela.show(this.obra); }
      } else if (this.state === 'formed' && ++this.endF > C.holdAfter){
        this.done = true;
      }
    },

    draw(){
      ctx.fillStyle = 'rgb(233,227,207)';
      if (this.state === 'fuse' || this.state === 'formed'){
        Glifo.render(g, crowned, smooth(this.e));
        Glifo.draw(g, ctx, cx, yF, 0, 1);
        if (this.e < 1){ ctx.globalAlpha = 1 - this.e; ctx.fillStyle = gold; ctx.fillRect(cx - g.gw / 2, this.crownY - crownH / 2, g.gw, crownH); ctx.globalAlpha = 1; }
      } else {
        ctx.save(); ctx.translate(baseX, surf); ctx.rotate(this.a);
        ctx.fillRect(-stemW / 2, -len, stemW, len + 2);
        ctx.restore();
        if (this.state === 'crowning'){ ctx.fillStyle = gold; ctx.fillRect(cx - g.gw / 2, this.crownY - crownH / 2, g.gw, crownH); }
      }
      ctx.fillStyle = 'rgb(233,227,207)'; ctx.textAlign = 'center';
      for (const s of this.shards){ ctx.globalAlpha = 0.8; ctx.font = `${s.s}px ${FONT}`; ctx.fillText('i', s.x, s.y); }
      ctx.globalAlpha = 1;
    },

    rules(){
      return [['estado', { standing: 'de pie', fallen: this.a < -1.4 ? 'caída' : 'la levantas', crowning: 'llega la corona', fuse: 'coronada', formed: 'I formada' }[this.state]],
        ['acción', { standing: 'clic', fallen: 'clics insistentes' }[this.state] || '—'],
        ['inclinación', (-this.a * 180 / Math.PI).toFixed(0) + '°'],
        ['clics de insistencia', this.clicks]];
    }
  };
}
