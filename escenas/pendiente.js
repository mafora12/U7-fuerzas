/* Escenas pendientes */
function makeStub(letter){
  return {
    letter, R: 1, body: { position: { x: -999, y: 0 } },
    update(){},
    draw(){
      ctx.globalAlpha = 0.35; ctx.fillStyle = COL.bone; ctx.textAlign = 'center';
      ctx.font = `italic 15px ${FONT}`;
      ctx.fillText(letter === 'final' ? 'escena final · pendiente' : `escena ${letter} · pendiente`, W / 2, H * 0.3);
      ctx.globalAlpha = 1;
    },
    rules(){ return [['escena', letter]]; }
  };
}
