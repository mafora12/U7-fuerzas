# OPHELIA · Unidad 7 Simulación

Sistema tipográfico jugable para **Tate Britain**. Cada letra de OPHELIA es una mujer que murió de forma trágica y romántica, y la persona la forma con sus acciones. La palabra completa solo aparece al final, y para entonces ya se está olvidando.

En línea: https://mafora12.github.io/U7-fuerzas/

## Intención: de dónde sale la idea

El punto de partida es el cuadro *Ophelia* de John Everett Millais: Ofelia flota en el río poco antes de ahogarse, rodeada de flores. La pregunta fue qué pasaría si el nombre mismo del cuadro se construyera con muertes así.

La referencia de mecánica es *Dumb Ways to Die*: una serie de escenas cortas, cada una con una muerte y una acción del jugador. Aquí el tono cambia de cómico a trágico y romántico, y cada escena forma una letra:

- **O · Ofelia**, ahogada en el río.
- **P · Pía de' Tolomei**, encerrada en un castillo del pantano y, según la leyenda, arrojada por la ventana.
- **H · Haidée**, que muere de pena cuando la separan de Don Juan.
- **E · Eco**, que se consume de amor hasta quedar solo en voz.
- **L · Laodamía**, que abraza la estatua de su esposo muerto hasta morir con ella en el fuego.
- **I · Inés de Castro**, asesinada y coronada reina después de muerta.
- **A · Atala**, que se envenena antes que romper un voto.

Todo lo que se ve sale de las letras, como en *Word as Image* de Ji Lee. Los objetos de cada escena (círculos, astas, travesaños, barras) se deforman hasta ser la letra de la tipografía, y el agua, el suelo, las burbujas, las chispas y las gotas también están hechas de letras.

## La organización: Tate Britain

**Qué hace y a quién se dirige.** Tate Britain es el museo de arte británico de la red Tate, en Londres. *Ophelia* de Millais es parte de su colección. Su público es el visitante general del museo y quien entra a su sitio web.

**Atributo que se comunica: rescatar obras que se están olvidando.** La pieza pone al museo en el papel de alguien que intenta revivir obras olvidadas. *Ophelia* es muy conocida, pero las otras seis mujeres vienen de pinturas del siglo XIX que casi nadie recuerda. Al jugar, la persona hace el trabajo del museo: reconstruye cada letra y, al terminarla, ve la cartela de la obra de donde viene.

**Dónde se usa.**

- **Portada web del museo:** la persona avanza a su ritmo con el mouse.
- **Pantalla grande dentro del museo** (`index.html#sala`): si nadie interactúa en 20 segundos, la escena avanza sola. Al terminar, la pieza vuelve a empezar.

## Qué puede hacer la persona

**Regla de todas las escenas:** cada letra parte de un objeto simple y se forma con acciones del mouse.

| Letra | Mujer | Parte de | Acciones y reglas |
|---|---|---|---|
| O | Ofelia | Un círculo que cuelga de una cuerda de 4 hilos sobre el río. | **Pasar el mouse** por el círculo rompe un hilo. Al romperse el último, cae al agua, flota por empuje y el agua le abre el centro hasta que el círculo se deforma en la O, que queda medio hundida. |
| P | Pía de' Tolomei | Un asta del tamaño de una torre que sale desde abajo y se clava en el suelo. | **Clic** en cualquier parte: se forma un círculo ahí (Pía). **Otro clic**, cuando quieras: el círculo se tambalea y cae siempre a la punta del asta, y se funden en la P. |
| H | Haidée | Un asta de pie (Haidée) y otra tirada en la arena (Don Juan). | **Arrastrar** a Don Juan hacia ella: se levanta y, si queda cerca, nace entre los dos un travesaño que funciona como resorte. **Arrastrarlo lejos:** el travesaño se estira y se adelgaza. Si lo sueltas, el resorte lo devuelve. Si lo estiras demasiado, se quiebra, el golpe los junta y queda la H con el travesaño roto. |
| E | Eco | Un asta sola frente a una pared de roca hecha de "e". | **Clic** en cualquier parte: Eco grita. La voz viaja a la pared, rebota y vuelve, y se pega al asta como un brazo, a la altura más cercana al clic. Tres gritos forman la E, que queda con contornos repetidos: lo único que queda de ella es el eco. |
| L | Laodamía | Un asta de pie y, lejos, una barra acostada (la estatua de su esposo). | **Mantener presionado** en cualquier parte: ella camina hacia la estatua; si sueltas, retrocede. Al tocarla y seguir presionando la abraza: la estatua se enciende y suelta chispas. Cuando el fuego llega al máximo, se apaga y quedan fundidas en la L. |
| I | Inés de Castro | Un asta lisa de pie. | **Primer clic:** la asesinan y cae. **Clics insistentes:** cada clic la levanta un poco; si dejas de insistir, la gravedad la vuelve a tumbar. Si la pones de pie, baja una corona y se funden en la I con sus remates. Es la única que vuelve: rescatar del olvido exige insistir. |
| A | Atala | Dos astas inclinadas que se buscan sin tocarse (Atala y Chactas). | **Arrastrar** a Chactas hacia ella: cuando las puntas se acercan se atraen y quedan unidas en la cima. **Clic:** aparece el voto (el travesaño), que se llena de veneno verde de abajo hacia arriba y sube por las astas. Cuando lo llena, la forma verde se funde como las demás letras en la A de la tipografía y el verde se apaga. |

Cuando cada letra se forma, aparece la cartela de su obra:

| Letra | Obra |
|---|---|
| O | *Ophelia*, John Everett Millais, 1851–52, Tate Britain |
| P | *La Pia de' Tolomei*, Dante Gabriel Rossetti, 1868–80 |
| H | *The Finding of Don Juan by Haidée*, Ford Madox Brown, 1869 |
| E | *Echo and Narcissus*, John William Waterhouse, 1903 |
| L | *Laodamia*, George William Joy, 1878 |
| I | *The Coronation of Inês de Castro in 1361*, Pierre-Charles Comte, 1849 |
| A | *Atala au tombeau*, Anne-Louis Girodet, 1808, Louvre |

## El olvido

El atributo no se explica con texto. Se ve en cómo avanza la pieza: la sucesión de escenas es una línea de olvido.

1. **Cada letra es más transparente que la anterior.** La O es completamente opaca y la A casi transparente. Cuanto más lejos está una letra del principio, menos queda de ella.

   | O | P | H | E | L | I | A |
   |---|---|---|---|---|---|---|
   | 1 | 0,87 | 0,74 | 0,61 | 0,48 | 0,35 | 0,22 |

2. **El fondo pierde el color.** Toda la pieza usa un solo morado. La primera escena es un morado vívido y cada escena es más gris que la anterior, hasta la escena final, que es gris del todo. El color y el brillo cambian poco a poco durante el descenso entre escenas, sin saltos.

3. **Escena final.** Por primera vez aparece la palabra OPHELIA completa, con el degradado de transparencia de la O a la A: se lee lo que se recuerda y lo que ya casi no. Después la palabra se desintegra en partículas que se lleva un campo de ruido. Empieza por la A, la más olvidada, y termina en la O. Cuando no queda nada, la pantalla se queda vacía unos segundos y la pieza vuelve a empezar.

**Qué se espera que la persona descubra:** que cada obra se puede reconstruir con sus acciones, pero que el olvido avanza de todas formas. La única forma de que una obra vuelva es que alguien la mire y la reconstruya otra vez, que es lo que el museo intenta hacer.

## Modelo y herramientas

- **p5.js** para dibujar y **Matter.js** para la física de la O (cuerda, caída y flotación).
- **Fuerzas** en las demás escenas: gravedad (caída de Pía, péndulo invertido de Inés), resorte con amortiguación (travesaño de Haidée), atracción (astas de Atala) y campo de ruido (partículas de la escena final).
- **Campos de distancia (SDF):** cada letra se convierte en un mapa de distancias. Para que un objeto simple se vuelva la letra, se interpolan la distancia del objeto y la de la letra, y la forma se deforma de verdad en vez de hacer un fundido.

## Estructura

- `index.html`: carga librerías y scripts.
- `style.css`
- `sketch.js`: motor, agua y suelo hechos de letras, descenso entre escenas, panel de reglas y parámetros `P`.
- `memoria.js`: el olvido (opacidad de cada letra y color de cada fondo) y la cartela.
- `glifo.js`: campos de distancia de las letras y detección de astas, brazos, travesaños y diagonales.
- `escenas/o-ofelia.js`, `p-pia.js`, `h-haidee.js`, `e-eco.js`, `l-laodamia.js`, `i-ines.js`, `a-atala.js`: una escena por letra.
- `escenas/final.js`: OPHELIA completa que se desintegra.

## Uso

- Abre `index.html` con Live Server (VS Code) o cualquier servidor local.
- `index.html#sala`: modo pantalla del museo.
- Tecla **R**: panel de reglas con las variables en vivo de cada escena (para la bitácora).
- Tecla **→**: salta a la siguiente escena (para probar).
- Los parámetros editables están en el objeto `P` al inicio de `sketch.js`. Los del olvido están en `P.olvido` y los de la escena final en `P.final`.
- Al subir cambios, sube el número `?v=` de los scripts en `index.html` para que el navegador no use la versión vieja en caché.
