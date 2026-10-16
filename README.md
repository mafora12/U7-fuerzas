# OPHELIA · Unidad 7 Simulación

Sistema tipográfico jugable para **Tate Britain**: un intento de revivir obras que se están olvidando.
Cada letra de OPHELIA es una mujer que murió de forma trágica y romántica. Una escena por letra; la palabra completa solo aparece en la escena final.

| Letra | Mujer | Regla |
|---|---|---|
| O | Ofelia | Un círculo cuelga de una cuerda de 4 hilos. Cada pasada del mouse rompe un hilo; cae al río, el agua le abre el centro y el círculo se deforma hasta ser la O, que queda medio hundida. |
| P | Pía de' Tolomei | Parte de un asta del tamaño de una torre que sale desde abajo y se clava en un suelo rígido de p. **Clic** (en cualquier parte): se forma un círculo ahí (Pía). **Otro clic** (cuando quieras, en cualquier parte): el círculo se tambalea y cae siempre a la punta del asta y se funden en la P. |
| H | Haidée | Parte de un asta de pie (Haidée) y otra tirada en la arena (Don Juan). **Arrastrar** a Don Juan hacia ella: se levanta y, si queda cerca, nace entre los dos un travesaño que funciona como resorte. **Arrastrarlo lejos:** el travesaño se estira y se adelgaza; si lo sueltas, el resorte lo devuelve; si lo estiras demasiado, se quiebra, el golpe los junta y queda la H con el travesaño roto. |
| E | Eco | Parte de un asta sola en el bosque frente a una pared de roca de e. **Clic** (en cualquier parte): Eco grita; la voz viaja a la pared, rebota y vuelve, y al llegar se pega al asta como un brazo, a la altura más cercana a donde hiciste clic. Tres gritos forman la E, que queda con contornos repetidos: lo único que queda de ella es el eco. |
| L | Laodamía | Parte de un asta de pie (Laodamía) y, lejos, una barra acostada (la estatua de su esposo). **Mantener presionado** (en cualquier parte): ella camina hacia la estatua; si sueltas, retrocede. Al tocarla y seguir presionando, la abraza: la estatua se enciende y suelta chispas. Cuando el fuego llega al máximo se apaga y quedan fundidas en la L. |
| I | Inés de Castro | Parte de un asta lisa de pie. **Primer clic:** la asesinan y cae. **Clics insistentes:** cada clic la levanta un poco; si dejas de insistir, la gravedad la vuelve a tumbar. Si la pones de pie, baja una corona y se funden en la I con sus remates. Es la única que vuelve: rescatar del olvido exige insistir. |
| A | Atala | Parte de dos astas inclinadas que se buscan sin tocarse (Atala y Chactas). **Arrastrar** a Chactas hacia ella: cuando las puntas se acercan se atraen y quedan unidas en la cima. **Clic:** aparece el voto (el travesaño), que se envenena de abajo hacia arriba; cuando el veneno lo llena, se funden en la A. |

**Regla de todas las escenas:** cada letra parte de un objeto simple y se forma con acciones del mouse.

## Atributo: rescatar obras que se están olvidando

La sucesión de escenas es una línea de olvido:

- **Cada letra es más transparente que la anterior:** la O es opaca y la A casi transparente.
- **Cada fondo es más apagado que el anterior:** la primera escena es de color vívido y la última casi gris.
- **Escena final:** por primera vez aparece OPHELIA completa, con el degradado de transparencia de O a A. Después se desintegra en partículas que se lleva un campo de ruido, empezando por la A (la más olvidada) y terminando en la O. Cuando no queda nada, la pieza vuelve a empezar.
- Cuando cada letra se forma aparece la cartela de su obra:

| Letra | Obra de la cartela |
|---|---|
| O | *Ophelia*, John Everett Millais, 1851–52, Tate Britain |
| P | *La Pia de' Tolomei*, Dante Gabriel Rossetti, 1868–80 |
| H | *The Finding of Don Juan by Haidée*, Ford Madox Brown, 1869 |
| E | *Echo and Narcissus*, John William Waterhouse, 1903 |
| L | *Laodamia*, George William Joy, 1878 |
| I | *The Coronation of Inês de Castro in 1361*, Pierre-Charles Comte, 1849 |
| A | *Atala au tombeau*, Anne-Louis Girodet, 1808, Louvre |

## Estructura

- `index.html`: carga librerías y scripts.
- `style.css`
- `sketch.js`: motor (p5.js + Matter.js), agua tipográfica, cambio de escena (la cámara baja: la escena anterior sale por arriba y la siguiente entra desde abajo), panel de reglas y parámetros `P`.
- `memoria.js`: el olvido (opacidad de cada letra y color de cada fondo) y la cartela.
- `glifo.js`: convierte cada letra en un campo de distancias (SDF) para deformar una forma simple hasta volverla la letra.
- `escenas/o-ofelia.js`: escena O.
- `escenas/p-pia.js`: escena P.
- `escenas/h-haidee.js`: escena H.
- `escenas/e-eco.js`: escena E.
- `escenas/l-laodamia.js`: escena L.
- `escenas/i-ines.js`: escena I.
- `escenas/a-atala.js`: escena A.
- `escenas/final.js`: OPHELIA completa que se desintegra.

## Uso

- Al subir cambios, sube el número `?v=` de los scripts en `index.html` para que el navegador no use la versión vieja en caché.

- En línea: https://mafora12.github.io/U7-fuerzas/ (se publica sola con cada push a `main`).

- Abre `index.html` con Live Server (VS Code) o cualquier servidor local.
- `index.html#sala`: modo pantalla del museo; si nadie interactúa en 20 s, el viento rompe la cuerda.
- Tecla **R**: panel de reglas con las variables en vivo, incluida la opacidad de la letra (para la bitácora).
- Tecla **→**: salta a la siguiente escena (para probar).
- Los parámetros editables están en el objeto `P` al inicio de `sketch.js`.
