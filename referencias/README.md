# Referencias

Referencias de estilo, herramientas y bibliografía del proyecto. No se
incluyen imágenes ni audio de juegos comerciales: todo el arte se dibuja en
código en `src/arte/`.

## 1. Referentes de estilo (solo inspiración, sin copiar)

| referente | qué se tomó | qué no se copió |
|---|---|---|
| Factorio | planta isométrica, flujo de recursos, lectura de cuellos de botella | sprites, nombres, mapas, música |
| Overcooked | tensión de coordinar estaciones y tiempos | personajes, niveles, arte |
| Two Point Hospital | HUD por zonas, estados de máquina con color e ícono | personajes, edificios, UI |
| Automachef | idea de automatizar una planta pequeña | código, nombres, arte |

## 2. Herramientas

- **JFLAP 7.1**: autómatas, expresión regular, NFA/DFA y minimización.
- **PIPE2 / WoPeD / CPN Tools**: red de Petri, incidencia, alcanzabilidad,
  invariantes y árbol de cobertura. Para el proyecto 1 se usó PIPE2.
- **Supremica**: opcional para composición/supervisor; el proyecto 1 no lo
  exige, pero la política CIP se puede comparar.
- **Phaser 4.2.1** por CDN (jsDelivr), Vite 7, Node 24.
- **Chrome/Edge 115+** con WebGL.

## 3. Bibliografía

- Cassandras, C. G., & Lafortune, S. (2021). *Introduction to Discrete Event
  Systems* (3.ª ed.). Springer.
- Hopcroft, J. E., Motwani, R., & Ullman, J. D. (2007). *Introduction to
  Automata Theory, Languages, and Computation* (3.ª ed.). Pearson.
- Ramadge, P. J., & Wonham, W. M. (1989). The control of discrete event
  systems. *Proceedings of the IEEE*, 77(1), 81–98.
- Sampath, M., Sengupta, R., Lafortune, S., Sinnamohideen, K., & Teneketzis,
  D. (1995). Diagnosability of discrete-event systems. *IEEE Transactions on
  Automatic Control*, 40(9), 1555–1575.
- Murata, T. (1989). Petri nets: Properties, analysis and applications.
  *Proceedings of the IEEE*, 77(4), 541–580.
- Guía Unificada de Laboratorios, código FLA-23 v.00, Laboratorio 1.

## 4. Enlaces de consulta

- Phaser 4 Docs: https://docs.phaser.io
- Phaser Examples: https://phaser.io/examples
- Vite: https://vite.dev
- JFLAP: https://www.jflap.org
- PIPE2: https://sourceforge.net/projects/pipe2/
- MDN Web Audio API: https://developer.mozilla.org/docs/Web/API/Web_Audio_API

## 5. Nota de originalidad

La paleta, los nombres de la planta, los íconos de estado, los tokens y las
máquinas son originales del equipo. Las referencias de estilo se citan solo
como inspiración y no se distribuyen assets de terceros.
