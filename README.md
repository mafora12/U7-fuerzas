# OPHELIA · Unidad 7 Simulación

Sistema tipográfico jugable para **Tate Britain**: un intento de revivir obras que se están olvidando.
Cada letra de OPHELIA es una mujer que murió de forma trágica y romántica. Una escena por letra; la palabra completa solo aparece en la escena final.

| Letra | Mujer | Regla |
|---|---|---|
| O | Ofelia | Un círculo cuelga de una cuerda de 4 hilos. Cada pasada del mouse rompe un hilo; cae al río, el agua le abre el centro y el círculo se deforma hasta ser la O, que queda medio hundida. |
| P | Pía de' Tolomei | Parte de un asta del tamaño de una torre que sale desde abajo y se clava en un suelo rígido de p. **Clic** (en cualquier parte): se forma un círculo ahí (Pía). **Doble clic** (en cualquier parte): el círculo se tambalea y cae siempre a la punta del asta y se funden en la P. |
| H | Haidée | Si la separas, su travesaño se quiebra. *(pendiente)* |
| E | Eco | Si la ignoras, se desvanece en contornos repetidos. *(pendiente)* |
| L | Laodamía | Se aferra a una copia rígida de sí misma y se apaga con ella. *(pendiente)* |
| I | Inés de Castro | Cae; si la persona insiste, su punto vuelve como corona. *(pendiente)* |
| A | Atala | Sus astas se buscan; el travesaño (el voto) las separa. Si las fuerzas, se envenena y colapsa. *(pendiente)* |

**Regla de todas las escenas:** cada letra parte de un objeto simple y se forma con acciones del mouse.

## Estructura

- `index.html`: carga librerías y scripts.
- `style.css`
- `sketch.js`: motor (p5.js + Matter.js), agua tipográfica, cambio de escena (la cámara baja: la escena anterior sale por arriba y la siguiente entra desde abajo), panel de reglas y parámetros `P`.
- `glifo.js`: convierte cada letra en un campo de distancias (SDF) para deformar una forma simple hasta volverla la letra.
- `escenas/o-ofelia.js`: escena O.
- `escenas/p-pia.js`: escena P.
- `escenas/pendiente.js`: marcador para escenas sin hacer.

## Uso

- Al subir cambios, sube el número `?v=` de los scripts en `index.html` para que el navegador no use la versión vieja en caché.

- En línea: https://mafora12.github.io/U7-fuerzas/ (se publica sola con cada push a `main`).

- Abre `index.html` con Live Server (VS Code) o cualquier servidor local.
- `index.html#sala`: modo pantalla del museo; si nadie interactúa en 20 s, el viento rompe la cuerda.
- Tecla **R**: panel de reglas con las variables en vivo (para la bitácora).
- Tecla **→**: salta a la siguiente escena (para probar).
- Los parámetros editables están en el objeto `P` al inicio de `sketch.js`.
