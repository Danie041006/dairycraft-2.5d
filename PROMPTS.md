# PROMPTS.md

Registro de los prompts del Laboratorio 1, en orden, con lo que funcionó y lo
que hubo que corregir.

> **Herramienta usada:** la guía está escrita para Antigravity. Este equipo
> construyó y verificó la versión con **OpenCode**, que usa el mismo formato de
> habilidades `.agents/skills/` que Antigravity, Claude Code, Codex, Cursor o
> Kiro. Las tres skills están en la carpeta del proyecto y los prompts de abajo
> se pueden repetir en Antigravity sin cambios; el modelo formal, el GDD y los
> archivos `.jff`/`.pnml` son los mismos. Los resultados de la columna
> “resultado” corresponden a esta versión (Phaser 4.2.1 por CDN, Vite 7,
> Node 24).

## Tabla resumen

| # | momento | resultado | corrección |
|:---:|---|---|---|
| 1 | carpeta + git | ✅ | — |
| 2 | skill diseñador | ✅ | — |
| 3 | skill ingeniero | ✅ | — |
| 4 | skill director de arte | ✅ | — |
| 5 | comprobar skills + docs/ y referencias/ | ✅ | — |
| 6 | modelo en Markdown + GDD | ✅ | se fijó la decisión de los fallos en Llenando |
| 7 | proyecto base Phaser 4 + Vite | ✅ | `base: './'`, Phaser CDN |
| 8 | núcleo formal + pruebas | ✅ | 42/42; se separó `composicion.js` |
| 9 | planta isométrica + entidades | ✅ | se movieron celdas y etiquetas |
| 10 | HUD de máquina | ✅ | se reescribió el layout del grafo |
| 11 | consola de reparación | ✅ | se separó el DFA del lenguaje de δ |
| 12 | supervisor u observador | ✅ | supervisor CIP (proyecto 1) |
| 13 | tokens, AND-join, conflicto, desborde | ✅ | se añadió el monitor ON/OFF |
| 14 | ecuación de estado + radar | ✅ | se añadió el reintento desde verde |
| 15 | HUD, logros, táctil, sonido | ✅ | — |
| 16 | pulido Phaser 4 + pruebas | ✅ | glow manual por limitación de filtros en Graphics |
| 17 | publicar en Netlify/Vercel | ☐ opcional | no se publicó; el ZIP local está listo |

## 1. Preparar la carpeta del proyecto

> Crea una carpeta con el nombre de mi proyecto y prepárala para guardar
> versiones con git. Ya copié la carpeta modelos con los archivos de JFLAP y
> PIPE2. Todavía no escribas código: primero vamos a crear las habilidades del
> equipo.

**Resultado:** `dairycraft/` con `git`, `.gitignore`, `modelos/`, `docs/`,
`referencias/` y las skills. **Funcionó.**

## 2. Skill 1: el diseñador del simulador

> Crea una habilidad (skill) llamada diseñador del simulador para mi proyecto.
> Debe decidir cómo se juega: qué hace el jugador, cómo gana puntos, cuándo
> pierde y qué logros hay, y escribir el documento de diseño con una lista para
> saber cuándo está terminado. Cada regla del juego debe salir de los autómatas
> y de la red de Petri. Guárdala en la carpeta de habilidades de este proyecto.

**Resultado:** `.agents/skills/disenador-simuladores-sed/SKILL.md`.
**Funcionó.**

## 3. Skill 2: el ingeniero de eventos discretos

> Crea otra habilidad (skill) llamada ingeniero de eventos discretos. Debe
> cuidar que el juego obedezca exactamente los autómatas y la red de Petri que
> hicimos en JFLAP y PIPE2: ninguna máquina cambia de estado ni gasta recursos
> por fuera del modelo, y todo se comprueba con pruebas. Guárdala en la carpeta
> de habilidades de este proyecto.

**Resultado:** `.agents/skills/ingeniero-sed/SKILL.md`. **Funcionó.**

## 4. Skill 3: el director de arte

> Crea otra habilidad (skill) llamada director de arte para el mismo
> simulador. Debe decidir cómo se ve: la planta en vista isométrica, los
> colores de cada estado de las máquinas, la forma de cada tipo de token y la
> pantalla. Que todo sea original. Guárdala en la carpeta de habilidades de
> este proyecto.

**Resultado:** `.agents/skills/director-arte-isometrico/SKILL.md`.
**Funcionó.**

## 5. Paso 0 · Comprobar las tres skills

> Lee las tres habilidades que creamos, el diseñador, el ingeniero y el
> director de arte, y cuéntame en pocas palabras qué reglas vas a seguir. Crea
> una carpeta para los documentos y otra para imágenes de referencia. Si algo
> no está definido, pregúntame antes de inventarlo.

**Resultado:** `docs/`, `docs/modelo/`, `referencias/`. **Funcionó.**

## 6. Paso 1 · Escribir el modelo y el GDD

> Usa al ingeniero para pasar a documentos los autómatas y la red de Petri que
> hicimos en JFLAP y PIPE2, sin cambiar nada. Después usa al diseñador y al
> director de arte para escribir el documento de diseño de mi simulador: qué
> máquinas hay, qué hace el jugador, cómo gana puntos, cómo se pierde por un
> bloqueo y qué se ve en pantalla. Pon una lista para saber cuándo está
> terminado.

**Resultado:** `docs/modelo/automatas.md`, `docs/modelo/petri.md`,
`docs/GDD.md`, `docs/arte.md`.
**Corrección:** se documentó que `contaminacion`/`perdida_temp` se modelan en
`Llenando` para que el CIP no retenga tokens; la ficha no fija esos estados
origen. El GDD cita cada mecánica con su elemento formal.

## 7. Paso 2 · Proyecto base en Phaser 4

> Prepara la página web del simulador con Phaser 4: la planta vista en
> diagonal, en estilo isométrico, con un reloj que avanza por eventos y que se
> puede pausar y acelerar. Separa el cerebro del simulador (los modelos) del
> dibujo, para poder probarlo aparte. Ábrela en el navegador y revisa que no
> haya errores.

**Resultado:** `index.html` con Phaser 4.2.1 CDN, `vite.config.js` con
`base: './'`, `src/main.js`, `src/iso/proyeccion.js`, `src/sed/reloj.js`,
`src/entrada/gestorEntrada.js` y las escenas base.
**Funcionó:** build y preview sin 404.

## 8. Paso 3 · El cerebro del simulador

> Usa al ingeniero para convertir nuestros autómatas y nuestra red de Petri en
> código, sin dibujos todavía. Que cada máquina solo cambie de estado con la
> tabla de transiciones, que los recursos se muevan solo cuando una transición
> se dispara y que haya pruebas que den lo mismo que JFLAP y PIPE2.

**Resultado:** `src/sed/automata.js`, `lenguaje.js`, `redPetri.js`,
`cobertura.js`, `composicion.js`, `observador.js`, modelos JSON y 42 pruebas.
**Funcionó:** `npm test` 42/42; el deadlock de 16 disparos y los 146/160
marcados se reproducen.

## 9. Paso 4 · La planta en 2.5D

> Dibuja la planta como dice el documento de diseño, vista en diagonal: las
> máquinas, las tuberías o bandas y los depósitos. Cada máquina cambia de color
> según su estado y los recursos se ven como objetos que se mueven de un lugar
> a otro. Las fallas y llegadas ocurren solas según el reloj.

**Resultado:** `src/escenas/Planta.js`, `src/arte/dibujos.js`, partículas de
vapor, tweens de nivel y tokens físicos.
**Corrección:** la primera rejilla superponía la embotelladora y el cuarto
frío; se movieron celdas y etiquetas sin cambiar el modelo.

## 10. Paso 5 · Ver el autómata de cada máquina

> Cuando haga clic en una máquina, abre una ventana con el dibujo de su
> autómata: círculos para los estados, flechas para los eventos y el estado
> actual iluminado. Pon botones para los eventos que puedo usar ahora y
> muéstrame en rojo los que están prohibidos y por qué.

**Resultado:** `src/escenas/HUDMaquina.js` con el grafo, Γ(q), colores
verde/gris/rojo, historial de 10 eventos y la razón formal.
**Corrección:** el primer layout tapaba la etiqueta de `Lavado_CIP` con el
botón; se reubicó el nodo y se fijó el tamaño del panel.

## 11. Paso 6 · Reparar con una expresión regular

> Cuando una máquina se dañe, que el jugador tenga que escribir la secuencia
> correcta de comandos para repararla. La secuencia se revisa con nuestra
> expresión regular: si está bien, la máquina vuelve a funcionar; si está mal,
> sigue dañada y pierde puntos.

**Resultado:** consola CIP con el DFA de 7 estados útiles, botones P/S/E/A/Z,
Validar/Borrar/Ayuda, palabra `PSESEAEZ` válida y `PSAEZ` inválida.
**Corrección:** se separó el DFA del lenguaje de los eventos del tanque: al
aceptar se dispara `CIP_ok` (δ) y el tanque vuelve a Vacio. Se añadió el
“Esperado: …” para que el DFA se entienda.

## 12. Paso 7 · El vigilante o el detective

> Agrega lo que dice la ficha de mi proyecto: un vigilante que no deja hacer
> combinaciones peligrosas entre máquinas (el botón se pone rojo y explica por
> qué), o un detective que, cuando un sensor se daña y no se ve qué pasa,
> muestra en qué estados podría estar la máquina para que el jugador decida.

**Resultado:** supervisor CIP (`SupervisorCIP` + autómata Libre/Ocupado):
216 estados de producto, 16 prohibidos, 200 supervisados y 10 000 eventos sin
violaciones. **Funcionó.**

## 13. Paso 8 · Los recursos como fichas

> Haz que los recursos de la red de Petri se vean como fichas en el mapa. Una
> estación solo trabaja cuando le llegan todas las fichas que necesita; si dos
> estaciones quieren la misma ficha, que se note; y si un depósito se llena de
> más, que se desborde y quite puntos.

**Resultado:** tokens físicos, contadores `m/k`, AND-join de
`t_iniciar_past`, conflicto por `Vapor_disp`, desborde del silo y el monitor
`Cupo_frio`.
**Corrección:** se agregó el botón **Cupo: ON/OFF** porque el monitor de la
ficha elimina el deadlock y la guía pide provocarlo.

## 14. Paso 9 · El radar de bloqueos

> Agrega una pantalla de pausa que muestre las matrices de la red de Petri y
> cómo cambia el marcado con cada disparo. Pon en una esquina un radar que mire
> unos pasos adelante: verde si todo va bien, amarillo si nos acercamos a un
> bloqueo y rojo si ya nadie puede moverse, y en ese caso termina la partida
> explicando qué pasó.

**Resultado:** `src/escenas/Inspector.js` con Pre/Post/A, M, u, ecuación,
prueba de disparo y árbol de 4 niveles; radar verde/amarillo/rojo; game over
con marcado, secuencia y prevención; reintento desde el último verde.
**Funcionó.**

## 15. Paso 10 · Pantalla, puntos, logros y celular

> Pon en pantalla lo que dice el documento de diseño: el reloj, los puntos, el
> radar, los recursos y las alertas. Agrega los 6 logros con un aviso animado,
> una pantalla de resultados al final del turno, botones para jugar en el
> celular y sonidos.

**Resultado:** `HUDJuego.js` con las cinco zonas del GDD, 6 logros con toast,
`Resultados.js`, botones táctiles y sonidos sintetizados con Web Audio.
**Funcionó.**

## 16. Paso 11 · Pulido con Phaser 4 y pruebas

> Dale el toque final con los efectos de Phaser 4: brillo en la máquina
> elegida y en las alarmas, partículas en lo que fluye, la pantalla que tiembla
> cuando el vigilante bloquea algo y transiciones entre pantallas. Después
> juega varios turnos, arregla lo que no se sienta bien, vuelve a correr las
> pruebas y revisa la lista del documento de diseño.

**Resultado:** partículas de vapor, burbujas CIP, halos, temblor de cámara y
transiciones. `npm test` 42/42.
**Corrección:** en Phaser 4 los `Graphics` no exponen los filtros
`glow`/`bloom`; se reemplazaron por halos concéntricos y flashes aditivos
estables en WebGL y Canvas.

## 17. Publicar en Netlify o Vercel (opcional)

> Publica mi simulador en internet con Netlify o Vercel y dame un enlace para
> compartirlo con mis compañeros.

**Resultado:** no se publicó. El `dist/` está listo para `netlify deploy` o
`vercel`; el ZIP local es la entrega obligatoria.

## Decisiones que el agente propuso y el equipo aceptó

| decisión | valor | dónde quedó |
|---|---|---|
| tiempos de operación | 2,5 / 8 / 6 / 4 s | `src/config.js`, GDD §5.4 |
| revisión de fallo | 30 % cada 18 s | `src/config.js`, GDD §5.3 |
| llegada de leche | 1 token cada 15 s, k = 10 | `src/config.js`, GDD §5.2 |
| puntaje | +12 lote, +20 CIP primer intento, etc. | GDD §8 |
| monitor `Cupo_frio` | ON/OFF; empieza OFF | GDD §9 y §15 |
| botón Forzar | `perdida_temp` en Llenando | GDD §5.3 |
| layout de la planta | silo a la izquierda, cuarto frío al frente | `Planta.js`, GDD §15 |
| filtros | halos manuales en vez de glow/bloom de Graphics | GDD §14, arte §7 |

## Lo que no se cambió

Estados, eventos, M0, capacidades \(k\), lenguaje de reparación, supervisor y
deadlock de la ficha. Cualquier extensión (fallos en Llenando, monitor ON/OFF,
DFA de reparación) está documentada y fue una decisión explícita del equipo.
