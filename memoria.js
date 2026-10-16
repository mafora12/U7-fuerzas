/* ---------- Olvido: la palabra se va borrando ----------
   El atributo de Tate Britain: rescatar obras que se están olvidando.
   La sucesión de escenas es una línea de olvido:
   - Cada letra aparece más transparente que la anterior: la O es opaca y la A casi
     transparente.
   - Cada fondo es más apagado que el anterior: la primera escena es de color vívido
     y la última casi gris.
   - En la escena final, OPHELIA completa muestra ese degradado y se desintegra,
     empezando por las letras más olvidadas. */
const Olvido = {
  // 0 en la O, 1 en la A
  letra(i){ return constrain(i / 6, 0, 1); },
  // 0 en la O, 1 en la escena final
  fondo(i){ return constrain(i / 7, 0, 1); },

  alpha(i){ return lerp(1, P.olvido.minAlpha, this.letra(i)); },

  filter(i){
    const k = this.fondo(i), O = P.olvido;
    return `saturate(${lerp(O.satStart, O.satEnd, k).toFixed(2)}) brightness(${lerp(O.brightStart, O.brightEnd, k).toFixed(2)})`;
  }
};

// Cartela de museo: aparece cuando la letra se forma.
const Cartela = {
  show(o){
    if (!o) return;
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
