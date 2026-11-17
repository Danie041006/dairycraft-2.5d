# Informe · Laboratorio 1

**DairyCraft 2.5D · A, planta láctea** (proyecto 1)
Modelado y Simulación de Sistemas de Eventos Discretos (167413)
Fase 1 – Laboratorio 1
Integrantes: Deivid Peñaloza, Paula Mendoza, Fabian Garcia, Daniel Castellanos
Docente: Ing. Harvey Michael Gamboa Peña

---

## Resumen

Se construyó un simulador interactivo pseudo-3D (isométrico 2.5D) para una
planta láctea con Phaser 4.2.1, Vite y JavaScript. El modelo formal se escribió
y verificó antes del código: un autómata de 6 estados por tanque (3 tanques),
un lenguaje regular de reparación CIP y una red de Petri de 11 lugares y 6
transiciones con un lugar monitor de prevención. El juego expone el autómata
en un HUD en vivo, valida la reparación con RegExp + DFA, implementa el
supervisor del único circuito CIP, muestra los tokens físicos con AND-join y
conflicto, y usa un radar de árbol de cobertura para provocar y prevenir el
deadlock de la ficha. El núcleo `src/sed/` no depende de Phaser y se prueba con
`node --test`: **42/42 pruebas**. El build de Vite y el preview se ejecutaron
en Chromium con WebGL sin errores de página.

## 1. Introducción y objetivos

El objetivo del laboratorio es que el simulador sea la interfaz de un modelo
formal: cada cambio de estado de una máquina pasa por δ y cada recurso se mueve
solo por el disparo de una transición. El proyecto 1 exige:

- autómata por tanque y limpieza CIP validada por expresión regular;
- caldera y bomba de frío como recursos compartidos;
- partículas de vapor y tweens de nivel en los tanques;
- 3 tanques, 1 caldera, 1 bomba de frío, 1 embotelladora y 1 cuarto frío.

El alcance del equipo fue: modelo verificado, GDD, arte original en código,
núcleo formal probado, juego jugable de principio a fin, inspector, radar,
resultados y despliegue local listo para el ZIP.

## 2. Modelo formal

### 2.1 Autómata del tanque

\(G = (Q, \Sigma, \delta, q_0, Q_m)\) con:

- \(Q\) = {Vacio, Llenando, Pasteurizando, Enfriando, Lavado_CIP, Fallo}
- \(q_0 = Q_m =\) Vacio
- \(\Sigma\) = {a, p, f, d, x, t, i, c}; \(\Sigma_c\) = {a, p, d, i};
  \(\Sigma_{uc}\) = {f, x, t, c}; \(\Sigma_{uo} = \varnothing\).
- 8 transiciones, determinista.

| estado | a | p | f | d | x | t | i | c |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Vacio | Llenando | — | — | — | — | — | — | — |
| Llenando | — | Pasteurizando | — | — | Fallo | Fallo | — | — |
| Pasteurizando | — | — | Enfriando | — | — | — | — | — |
| Enfriando | — | — | — | Vacio | — | — | — | — |
| Fallo | — | — | — | — | — | — | Lavado_CIP | — |
| Lavado_CIP | — | — | — | — | — | — | — | Vacio |

Palabras aceptadas: `apfd`, `axic`, `apfdapfd`, `apfdaxic`.
Rechazadas: `p`, `ap`, `apf`, `apfdxt`.

La tabla completa de eventos, la justificación de los fallos en `Llenando` y
la verificación en JFLAP están en `docs/modelo/automatas.md`.

### 2.2 Lenguaje de reparación

\[
L = \mathcal{L}(P(SE)^+AEZ)
\]

- **PSESEAEZ** ∈ \(L\); **PSAEZ** ∉ \(L\).
- DFA de 7 estados útiles + estado trampa (8 en JFLAP).
- La RegExp anclada y el DFA coinciden en 20 palabras.
- Al aceptar, se dispara `CIP_ok` (evento de δ) y el tanque vuelve a Vacio.

### 2.3 Supervisor CIP

Autómata `Circuito_CIP` (Libre/Ocupado) que comparte `iniciar_CIP` y `CIP_ok`
con los tanques. Composición de los 3 tanques:

| comprobación | resultado |
|---|---:|
| producto de los 3 tanques | **216** estados |
| estados prohibidos (2+ en CIP) | **16** |
| estados con supervisor | **200** |
| 10 000 eventos aleatorios | 0 violaciones |

### 2.4 Red de Petri

\(N = (P,T,Pre,Post,M_0)\) con 11 lugares y 6 transiciones. Las tablas
completas, las matrices Pre/Post/A y los invariantes están en
`docs/modelo/petri.md`.

| comprobación | resultado |
|---|---:|
| marcados distintos sin prevención | **160** |
| deadlocks sin prevención | **1** |
| marcados con `Cupo_frio` | **146** |
| deadlocks con `Cupo_frio` | **0** |

Marcado muerto:

\[
[0,1,0,0,1,1,4,0,1,0,0]
\]

Secuencia: 16 disparos (4 lotes embotellados, cuarto frío lleno, embotelladora
detenida, vapor y frío retenidos). La prevención es el invariante:

\[
Cupo\_frio + Lote\_past + Lote\_enfr + Cuarto\_frio = 4
\]

El marcado muerto exigiría \(Cupo\_frio = -2\); por eso el monitor lo hace
inalcanzable.

## 3. Implementación

### 3.1 Stack

- JavaScript ES modules, Node.js 24, Vite 7.
- Phaser 4.2.1 por CDN (no está en `package.json`, no se importa como módulo).
- `vite.config.js` con `base: './'` y `phaser` externo.
- Pruebas con `node --test`; sin librerías extra.

### 3.2 Arquitectura

```
index.html
src/main.js
src/config.js
src/iso/proyeccion.js
src/arte/            paleta y dibujos originales en código
src/entrada/         gestor de mouse, teclado y táctil
src/sed/             núcleo formal SIN Phaser ni DOM
  automata.js        δ, Γ(q), historial
  lenguaje.js        RegExp anclada + DFA
  redPetri.js        Pre/Post/A, habilitada, disparar, conflictos, monitor
  cobertura.js       Karp-Miller, grafo de alcanzabilidad, radar
  composicion.js     producto, supervisor, SupervisorCIP
  observador.js      subconjuntos (módulo de la guía)
  reloj.js           cola de prioridad de eventos
  aleatorio.js       mulberry32 con semilla
  modelos/           tanque.json, reparacion.json, dairycraft.json
src/juego/simulador.js   orquesta el modelo y la vista
src/escenas/         Arranque, Titulo, Planta, HUDJuego, HUDMaquina,
                     Inspector, Resultados
test/                42 pruebas
```

La regla de oro se cumple: `src/sed/` no menciona Phaser; las escenas solo
leen el estado y envían solicitudes; el update de la planta solo avanza el
reloj y dibuja.

### 3.3 Jugabilidad

- Turno de 180 s; meta 6 lotes; velocidad 1×/2×/4×; pausa P; inspector I.
- 3 tanques con su autómata; silo, caldera, frío, embotelladora y cuarto frío.
- Fallos en `Llenando` (30 % cada 18 s) y botón **Forzar** (`perdida_temp`).
- Consola CIP con DFA y ayuda de −5 puntos.
- Supervisor CIP con botón rojo y razón formal; 10 000 eventos sin 2 CIP.
- Tokens físicos, AND-join, conflicto por vapor, desborde del silo.
- Inspector con Pre/Post/A, \(M_k\), \(u_k\), ecuación y prueba de disparo.
- Radar de 3 colores; game over con marcado, secuencia y prevención.
- 6 logros, resultados, táctil y sonido sintetizado con Web Audio.

## 4. Resultados

### 4.1 Pruebas automatizadas

```
npm test  →  tests 42 · pass 42 · fail 0
```

Cubren: determinismo y palabras del tanque; RegExp vs DFA; matrices y
ecuación; deadlock de 16 disparos; 146/160 marcados; invariantes en 1000
disparos; árbol con ω; composición 216/16/200; 10 000 eventos del supervisor;
observador; reloj; flujo del simulador; game over; reintento.

### 4.2 Build y navegador

- `npm run build` → `dist/index.html` + `dist/assets/index-*.js` (~148 kB JS,
  37 kB gzip); Phaser queda fuera del bundle. Se usa `target: 'esnext'` y
  `minify: false` porque el esbuild 0.28.2 de este entorno arm64 se cuelga al
  minificar; el ZIP sigue muy por debajo de 25 MB.
- `npm run preview` → Chromium headless con WebGL 2; sin `pageerror`; se
  recorrieron el flujo normal, el HUD, el inspector, el game over y el
  reinicio.
- `dist/` se puede comprimir en `Grupo1_DairyCraft.zip` con `index.html` en la
  raíz; el tamaño está muy por debajo de 25 MB.

### 4.3 Capturas

| captura | contenido |
|---|---|
| `docs/capturas/captura-planta.png` | planta, tanques en Vacio/Fallo/Llenando, silo 13/10, HUD, radar |
| `docs/capturas/captura-hud2.png` | HUD del Tanque 2 en Fallo, grafo y botón CIP |
| `docs/capturas/captura-inspector2.png` | inspector con Pre, M actual y ecuación |
| `docs/capturas/captura-resultados2.png` | game over con marcado y prevención |
| `docs/capturas/captura-cip.png` | consola CIP con PSESEAEZ y DFA q6 |
| `docs/capturas/captura-supervisor.png` | supervisor CIP: Tanque 2 bloqueado |
| `docs/capturas/captura-arbol.png` | árbol del inspector |
| `docs/capturas/hoja-arte.png` | hoja de arte |
| `docs/capturas/captura-forzar.png` | fallo forzado y botón CIP |

Las capturas de JFLAP/PIPE2 y las tablas completas de la sección 5.9 están en
`docs/pruebas.md`; las celdas ☐ son las que el equipo completa en el aula.

## 5. Postmortem

1. **¿Qué funcionó bien?** Empezar por el modelo y por el núcleo sin Phaser.
   Los números 146/160 y 216/16/200 salieron antes de dibujar una sola máquina
   y se convirtieron en pruebas. Las tres skills mantuvieron el diseño, el
   modelo y el arte separados. El radar y el inspector son las pantallas que
   más explican la teoría.
2. **¿Qué diferencias aparecieron entre el modelo y el juego?** La ficha no
   fija los estados origen de `contaminacion`/`perdida_temp`; se modelaron en
   `Llenando` para que el CIP no retenga tokens. El lenguaje CIP no cabe en los
   6 estados de la ficha; se usó un DFA de reparación aparte y `CIP_ok` como
   evento de planta. El monitor `Cupo_frio` de la ficha elimina el deadlock, y
   la guía pide provocarlo: el GDD lo convirtió en un botón ON/OFF y el juego
   empieza con OFF. El botón “Forzar” se volvió un evento de δ (`perdida_temp`)
   para no usar un `if` de escena.
3. **¿Qué prompts dieron mejores resultados?** Los de las tres skills, el del
   núcleo formal (`automata.js`, `redPetri.js`, `cobertura.js`) y el del
   deadlock/radar. Hubo que reescribir el de la consola CIP para separar el
   DFA del lenguaje de los estados de la máquina, y el del HUD para fijar la
   posición de las etiquetas y del panel. El agente decidió sin que estuviera
   en el modelo: los tiempos (2,5/8/6/4 s), la probabilidad de fallo, el
   puntaje, el toggle del monitor, el botón Forzar y el layout de la planta;
   el equipo los aceptó y quedaron en el GDD.
4. **¿Qué mecánica hizo más visible la teoría?** El HUD del autómata (δ y Γ(q))
   y la consola (DFA/RegExp) para la Unidad 2; los tokens con AND-join y el
   radar/inspector para la Unidad 3. El supervisor CIP con el botón rojo es la
   demostración más rápida en la sustentación.
5. **¿Qué cambiarían con una semana más?** Medir fps con GPU real, probar en
   tableta, agregar el playtest de otro equipo, capturar JFLAP/PIPE2, mejorar
   el arte de los tanques y añadir un modo “sin llegadas” para comparar el
   árbol con PIPE2. En la Fase 2 del curso se anticipan los autómatas
   temporizados (tiempos de operación) y las redes estocásticas (fallos con
   distribución), que hoy son timers del GDD y del reloj.

## 6. Conclusiones

El simulador cumple el contrato del laboratorio: el modelo formal es la
autoridad, el juego lo hace visible y las pruebas lo verifican. El equipo puede
defender cada función del núcleo (`ejecutar`, `avanzar`, `disparar`,
`conflictos`, `arbolCobertura`, `SupervisorCIP`) y cada decisión de diseño
(toggle del monitor, DFA de reparación, fallos en Llenando). Quedan las
capturas académicas y las mediciones en el equipo, que no se pueden producir
en este entorno.

## 7. Referencias

- Cassandras, C. G., & Lafortune, S. (2021). *Introduction to Discrete Event
  Systems* (3.ª ed.). Springer.
- Hopcroft, J. E., Motwani, R., & Ullman, J. D. (2007). *Introduction to
  Automata Theory, Languages, and Computation* (3.ª ed.). Pearson.
- Ramadge, P. J., & Wonham, W. M. (1989). The control of discrete event
  systems. *Proceedings of the IEEE*, 77(1), 81–98.
- Murata, T. (1989). Petri nets: Properties, analysis and applications.
  *Proceedings of the IEEE*, 77(4), 541–580.
- Guía Unificada de Laboratorios, FLA-23 v.00, Laboratorio 1.

## Anexos

- `docs/modelo/automatas.md`: δ, eventos, palabras, DFA, supervisor.
- `docs/modelo/petri.md`: lugares, transiciones, matrices, invariantes,
  deadlock y PIPE2.
- `docs/GDD.md`: diseño completo, puntaje, logros, criterios.
- `docs/arte.md` y `hoja-arte.html`.
- `docs/pruebas.md`: tablas 5.2 y 5.9.
- `PROMPTS.md`, `referencias/`, `modelos/`.
