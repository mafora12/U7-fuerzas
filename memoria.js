/* ---------- Memoria: el atributo de Tate Britain ----------
   Tate quiere rescatar obras que se están olvidando. En cada escena hay una memoria
   entre 0 y 1:
   - Sin interacción se olvida: la memoria baja con el tiempo.
   - Las acciones de la persona la devuelven: cada acción suma, y mover el mouse
     cerca de la forma (mirarla) también suma un poco.
   Respuestas del sistema:
   - Color: con memoria baja la escena se ve gris y apagada; con memoria alta recupera
     los colores del cuadro.
   - Desgaste: mientras menos memoria, más letras sueltas se desprenden de la forma
     y se las lleva el viento (un campo de ruido, como en los campos vectoriales).
   - Cartela: cuando la letra se forma, si la cuidaste aparece la cartela de su obra.
     Si la abandonaste, queda gastada y sin nombre. */
const Memoria = {
  init(sc){
    sc.mem = P.memoria.start; sc.dust = []; sc.memLocked = false;
  },

  give(sc, amount){
    if (!sc.memLocked) sc.mem = Math.min(1, sc.mem + amount);
  },

  tick(sc, interactive){
    const M = P.memoria;
    if (interactive && !sc.memLocked){
      sc.mem = Math.max(0, sc.mem - M.decay / 60);
      const f = sc.focus && sc.focus();
      if (f && pointer.on && Math.hypot(pointer.vx, pointer.vy) > 0.5 &&
          Math.hypot(pointer.x - f.x, pointer.y - f.y) < S * M.lookRadius){
        sc.mem = Math.min(1, sc.mem + M.look / 60);
      }
    }
    // desgaste: se desprenden letras de la forma
    const wear = Math.pow(1 - sc.mem, 2);
    if (sc.edge && Math.random() < wear * M.erosion){
      const p = sc.edge();
      if (p) sc.dust.push({ x: p.x, y: p.y, vx: random(-0.3, 0.3), vy: random(-0.6, -0.1),
        a: 0.9, s: S * random(0.03, 0.06), r: random(TAU), vr: random(-0.03, 0.03) });
    }
    for (const d of sc.dust){
      const n = noise(d.x * 0.004, d.y * 0.004, t * 0.004) - 0.5;
      d.vx += n * 0.12 + M.wind; d.vy += n * 0.05 - 0.012;
      d.vx *= 0.98; d.vy *= 0.98;
      d.x += d.vx; d.y += d.vy; d.r += d.vr; d.a -= 0.005;
    }
    sc.dust = sc.dust.filter(d => d.a > 0 && d.x > -50 && d.x < W + 50 && d.y > -50);
  },

  draw(sc){
    ctx.fillStyle = 'rgb(200,196,182)'; ctx.textAlign = 'center';
    for (const d of sc.dust){
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.r);
      ctx.globalAlpha = d.a; ctx.font = `${d.s}px ${FONT}`; ctx.fillText(sc.dustChar || '.', 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },

  // al formarse la letra la memoria queda fija; si alcanza, aparece la cartela
  lock(sc){
    if (sc.memLocked) return;
    sc.memLocked = true;
    results[sc.letter] = { mem: sc.mem };
    if (sc.obra && sc.mem >= P.memoria.cartela) Cartela.show(sc.obra);
  },

  // del gris apagado (olvido) al color del cuadro (memoria)
  filter(mem){
    return `saturate(${(0.05 + 1.45 * mem).toFixed(2)}) brightness(${(0.62 + 0.45 * mem).toFixed(2)})`;
  }
};

const Cartela = {
  show(o){
    const el = $('cartela');
    el.querySelector('.quien').textContent = o.quien;
    el.querySelector('.obra').textContent = o.obra;
    el.querySelector('.autor').textContent = o.autor;
    el.hidden = false;
    requestAnimationFrame(() => el.classList.add('on'));
  },
  hide(){
    const el = $('cartela');
    el.classList.remove('on');
    setTimeout(() => { if (!el.classList.contains('on')) el.hidden = true; }, 700);
  }
};
