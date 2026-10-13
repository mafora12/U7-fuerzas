# OPHELIA · Unidad 7 Simulación

Sistema tipográfico jugable para **Tate Britain**: un intento de revivir obras que se están olvidando.
Cada letra de OPHELIA es una mujer que murió de forma trágica y romántica. Una escena por letra; la palabra completa solo aparece en la escena final.

| Letra | Mujer | Regla |
|---|---|---|
| O | Ofelia | Un círculo cuelga de una cuerda de 4 hilos. Cada pasada del mouse rompe un hilo; cae al río, se hunde y se forma la O, que queda medio hundida. |
| P | Pía de' Tolomei | Se hunde en el pantano mientras nadie la mire. *(pendiente)* |
| H | Haidée | Si la separas, su travesaño se quiebra. *(pendiente)* |
| E | Eco | Si la ignoras, se desvanece en contornos repetidos. *(pendiente)* |
| L | Laodamía | Se aferra a una copia rígida de sí misma y se apaga con ella. *(pendiente)* |
| I | Inés de Castro | Cae; si la persona insiste, su punto vuelve como corona. *(pendiente)* |
| A | Atala | Sus astas se buscan; el travesaño (el voto) las separa. Si las fuerzas, se envenena y colapsa. *(pendiente)* |

## Estructura

- `index.html`: carga librerías y scripts.
- `style.css`
- `sketch.js`: motor (p5.js + Matter.js), río tipográfico, cambio de escena, panel de reglas.
- `escenas/o-ofelia.js`: escena O.
- `escenas/pendiente.js`: marcador para escenas sin hacer.

## Uso

- Abre `index.html` con Live Server (VS Code) o cualquier servidor local.
- `index.html#sala`: modo pantalla del museo; si nadie interactúa en 20 s, el viento rompe la cuerda.
- Tecla **R**: panel de reglas con las variables en vivo (para la bitácora).
- Los parámetros editables están en el objeto `P` al inicio de `sketch.js`.
