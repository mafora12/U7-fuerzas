/* Escenas pendientes */
function makeStub(letter){
  return {
    letter, level: 0.6, style: ESTILOS.rio, center: { x: -999, y: 0 }, R: 1, done: false,
    freeze(){},
    update(){},
    draw(){
      ctx.globalAlpha = 0.35; ctx.fillStyle = 'rgb(233,227,207)'; ctx.textAlign = 'center';
      ctx.font = `italic 15px ${FONT}`;
      ctx.fillText(letter === 'final' ? 'escena final · pendiente' : `escena ${letter} · pendiente`, W / 2, H * 0.3);
      ctx.globalAlpha = 1;
    },
    rules(){ return [['escena', letter]]; }
  };
}
