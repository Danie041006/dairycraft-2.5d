# Pruebas y conformidad · Laboratorio 1

Este documento reúne las tablas de la sección 5.2 (modelo verificado) y de la
sección 5.9 (pruebas del simulador). Las celdas marcadas Listo se ejecutaron en el
entorno de desarrollo; las marcadas Pendiente las completa el equipo con JFLAP, PIPE2,
el navegador del aula y el playtest.

## 1. Modelo verificado (sección 5.2)

### 1.1 Autómata del tanque

| autómata | Σ | Σuc | Σuo | q0 | Qm | n.º estados | ¿determinista? | archivo |
|---|---|---|:---:|---|---|:---:|:---:|---|
| Tanque (×3) | a, p, f, d, x, t, i, c | f, x, t, c | ∅ | Vacio | Vacio | 6 | sí | `modelos/automatas/tanque.jff` |
| Reparación CIP | P, S, E, A, Z | — | — | q0 | q6 | 7 útiles + trampa | sí | `modelos/automatas/reparacion.jff` |
| Circuito CIP | i, c | c | — | Libre | Libre/Ocupado | 2 | sí | `modelos/automatas/cip_supervisor.jff` |

| palabra | representa | ¿debe aceptarse? | JFLAP | juego |
|---|---|:---:|:---:|:---:|
| `apfd` | ciclo normal | sí | Listo | Listo |
| `axic` | fallo en llenado + CIP | sí | Listo | Listo |
| `apfdapfd` | dos ciclos | sí | Listo | Listo |
| `apfdaxic` | ciclo + fallo + CIP | sí | Listo | Listo |
| `p` | iniciar sin llenar | no | Listo | Listo |
| `ap` | queda en Pasteurizando | no | Listo | Listo |
| `apf` | queda en Enfriando | no | Listo | Listo |
| `apfdxt` | evento fuera de δ | no | Listo | Listo |

> Los 8 casos están automatizados en `test/automata.test.js` y verificados en
> JFLAP 7.1: `modelos/capturas/01_tanque_multiple_run.png`.

### 1.2 Red de Petri

| propiedad | resultado | evidencia |
|---|---|---|
| n.º de lugares / transiciones | 11 / 6 | `src/sed/modelos/dairycraft.json` |
| M0 | `[6, 3, 1, 1, 0, 0, 0, 1, 0, 0, 4]` | tabla de `docs/modelo/petri.md` |
| ¿Acotada? | sí, con M0 sin llegadas | 146 / 160 marcados |
| k por lugar | Leche 10, Tanque 3, Vapor 1, Frio 1, LoteP 3, LoteE 3, Cuarto 4, EmbL 1, EmbP 1, Cupo 4 | JSON |
| ¿Segura (1-acotada)? | en Vapor, Frio, EmbL, EmbP; no en los demás | análisis |
| Deadlock sin prevención | 1: `[0,1,0,0,1,1,4,0,1,0]` (10 lugares; con `Cupo = 0` se escribe con 11) | 16 disparos; PIPE: capturas 04 y 05 Listo |
| Deadlock con `Cupo_frio` | 0 | 146 marcados; PIPE: captura 06 Listo |
| Regla de prevención | `Cupo_frio + LoteP + LoteE + Cuarto = 4` | invariante |
| Invariantes P | 6 (tabla de `petri.md`) | 1000 disparos aleatorios: Listo; PIPE: captura 08 Listo |
| N.º de nodos/marcados del árbol | 160 sin prevención · 146 con prevención (marcados distintos) | `grafoAlcanzabilidad`: Listo |
| Conflictos | `Vapor_disp` entre `t_iniciar_past` y `t_arrancar_emb` | `conflictos()`: Listo |
| AND-join | `t_iniciar_past` con 4 tokens | HUD / inspector: Listo |

> Verificado en PIPE 4.3.0 con los `.xml` de `modelos/petri/` (PIPE no lee el PNML
> estándar): *160 states with 355 arcs* y deadlock con la ruta de 16 disparos
> sin prevención; *146 states with 321 arcs* y sin deadlock con prevención;
> matrices Pre/Post/A, M0 y los 6 invariantes P. Capturas `04` a `08` en
> `modelos/capturas/`.

## 2. Pruebas del GDD (sección 5.9 a)

| criterio de aceptación | cómo se prueba | ¿cumple? | observación |
|---|---|:---:|---|
| Color e ícono = estado del autómata | abrir 3 HUD en momentos distintos | Listo | captura `captura-planta.png` |
| Grafo del HUD = `tanque.jff` | comparar captura del HUD con JFLAP | Listo | 6 nodos, 8 eventos; captura `01` de JFLAP |
| Ninguna máquina cambia sin δ | revisar el historial de 10 eventos | Listo | `historial` del autómata |
| La consola repara con \(L\) y rechaza lo demás | PSESEAEZ válida; PSAEZ inválida | Listo | `test/lenguaje.test.js`, `test/simulador.test.js` |
| El supervisor nunca deja 2 CIP | 3 intentos + 10 000 eventos | Listo | `test/composicion.test.js` |
| Ninguna transición sin tokens | iniciar sin vapor; descargar con cuarto lleno | Listo | `eventosHUD` rojo y razón |
| El desborde penaliza | llegar a 11/10 | Listo | alerta y −10 |
| El radar pasa por verde/amarillo/rojo | provocar y prevenir el deadlock | Listo | verde con Cupo ON (`prevencion_cupo_on.png`); amarillo con 1 marcado muerto en ≤3 disparos (`radar_amarillo.png`); marcado muerto y game over (`game_over_interbloqueo.png`) |
| El inspector calcula \(M_k\) | 3 disparos a mano | Listo | matriz y ecuación |
| HUD en zonas + 6 logros | comparar con GDD §7 | Listo | captura HUD |
| `npm test` | `npm test` | Listo | **42/42** |
| Build y preview sin 404 | `npm run build`, `npm run preview` | Listo | Chromium headless sin errores |
| Mouse, teclado y táctil | un turno con mouse y otro en celular | Listo | turno completo en celular con Chrome (horizontal): victoria, 7 lotes, 74 pts (`celular_victoria.png`); no se contó con tableta, por eso la prueba táctil se hizo en celular |
| Juego = JFLAP y PIPE2 | tablas 5.2 y 5.9 | Listo | núcleo probado; capturas `01`–`08` |

## 3. Conformidad modelo ↔ juego (sección 5.9 b)

| secuencia | JFLAP / PIPE2 | juego | ¿coincide? |
|---|---|---|---|
| `a p f d` | Vacio (aceptada) | Vacio | Listo |
| `a x i c` | Vacio (aceptada) | Vacio | Listo |
| `p` | rechazada | rechazada | Listo |
| 16 disparos del deadlock | marcado `[0,1,0,0,1,1,4,0,1,0,0]` | mismo marcado | Listo |
| 16 disparos con `Cupo_frio` | la 5.ª `t_iniciar_past` (disparo 12) se deshabilita | el botón queda rojo | Listo |

| dato | software académico | juego |
|---|---|---|
| n.º estados del supervisor | 216 producto / 16 prohibidos / 200 con supervisor | 216/16/200 Listo |
| n.º marcados desde M0 | 160 sin / 146 con | 160/146 Listo |
| marcado muerto | `[0,1,0,0,1,1,4,0,1,0,0]` | mismo: Listo |

## 4. Consola de reparación (sección 5.9 c)

| palabra | ¿en \(L\)? | resultado en el juego | estado final |
|---|:---:|---|---|
| PSESEAEZ | sí | repara | Vacio |
| PSEAEZ | sí | repara | Vacio |
| PSAEZ | no | no repara, −8 | Lavado_CIP |
| PSEA | no | no repara, −8 | Lavado_CIP |
| PSEEZ | no | no repara, −8 | Lavado_CIP |

## 5. Deadlock: provocar y prevenir (sección 5.9 d)

| prueba | decisiones | radar antes | resultado |
|---|---|---|---|
| Provocar | detener embotelladora, descargar 4 lotes al cuarto frío, seguir pasteurizando | rojo | game over, marcado muerto |
| Prevenir con el monitor | activar **Cupo** antes de llenar el cuarto frío | verde | 0 deadlocks |
| Salir de amarillo | ver amarillo y activar **Cupo** | amarillo → verde | +30 y logro 6 |

## 6. Supervisor / observador (sección 5.9 e)

| intento | esperado | juego | ¿cumple? |
|---|---|---|---|
| `iniciar_CIP` en T2 con T1 en CIP | rechazar y explicar | botón rojo, −15 | Listo |
| 10 000 eventos aleatorios | 0 estados con 2 CIP | 0 | Listo |
| Observador (módulo aparte) | estimación contiene el estado real | 100 secuencias | Listo |

## 7. Controles alternos (sección 5.9 f)

| acción | mouse/teclado | táctil | ¿funciona? |
|---|---|:---:|:---:|
| seleccionar tanque y abrir HUD | clic | tocar | Listo |
| disparar evento | clic en botón | tocar botón | Listo |
| escribir CIP | teclado | botones | Listo |
| pausa / inspector | P / I | botones | Listo |
| velocidad | 1, 2, 4 | botones | Listo |
| cámara | arrastre + rueda | arrastre + pinza | Listo / Pendiente |

## 8. Rendimiento (sección 5.9 g)

Medido con **F1** dentro del juego (el juego muestra un solo valor de fps).

| momento | fps | equipo / navegador | evidencia |
|---|:---:|---|---|
| inicio del turno (≈1 min de simulación, ×2) | 60–61 | PC con Windows, navegador Opera | `fps_inicio_turno.png` |
| hora pico a ×4 | 60 | PC con Windows, navegador Opera | `fps_hora_pico_x4.png` |
| inspector con árbol | 60 | PC con Windows, navegador Opera | `fps_inspector_arbol.png` (el panel tapa la línea F1; el valor se leyó al cerrar) |

En el navegador headless usado para las capturas el renderer fue WebGL 2 y no
aparecieron errores; las mediciones de esta tabla se hicieron con el juego
publicado en Vercel y GPU real.

## 9. Playtest (sección 5.9 h)

| observación de otro equipo | cambio realizado | sección |
|---|---|---|
| Pendiente | Pendiente | — |
| Pendiente | Pendiente | — |

## 10. Comandos y resultados

```
$ npm test
ℹ tests 42
ℹ pass 42
ℹ fail 0

$ npm run build
✓ built in ~0.5 s
dist/index.html + dist/assets/index-*.js (148 kB, 37 kB gzip, sin minificar)

$ npm run preview
http://localhost:4173
```

- `src/sed/` no importa Phaser ni el DOM.
- `index.html` carga Phaser 4.2.1 por CDN y monta `#game-container`.
- `vite.config.js` usa `base: './'` y excluye `phaser` del bundle.
- El ZIP de `dist/` debe quedar con `index.html` en la raíz y < 25 MB.

## 11. Capturas del juego

Disponibles en `docs/capturas/`:

| archivo | contenido |
|---|---|
| `captura-planta.png` | planta isométrica con tanques en Vacio/Fallo/Llenando, silo 13/10, HUD y radar |
| `captura-hud2.png` | HUD del Tanque 2 en Fallo con el grafo y el botón CIP |
| `captura-inspector2.png` | inspector con Pre, M actual y ecuación |
| `captura-resultados2.png` | game over por interbloqueo con marcado y prevención |
| `captura-cip.png` | consola CIP con PSESEAEZ, DFA q6 y botones P S E A Z |
| `captura-supervisor.png` | Tanque 2 bloqueado por el circuito CIP ocupado |
| `captura-arbol.png` | pestaña Árbol del inspector con 12 nodos explorados |
| `hoja-arte.png` | hoja de arte: paleta, estados, tokens, planta y HUD |
| `captura-forzar.png` | Tanque 1 en Fallo tras usar **Forzar**; −25 y botón CIP |
| `captura-cip-error.png` | consola CIP con P S E A + Z: muestra “Esperado: E” |

Capturas de las pruebas manuales (`docs/capturas/pruebas/`):

| archivo | contenido |
|---|---|
| `fps_inicio_turno.png` | F1: 61 fps al inicio del turno |
| `fps_hora_pico_x4.png` | F1: 60 fps a ×4 |
| `fps_inspector_arbol.png` | inspector con la pestaña Árbol (160 marcados, 12 nodos) |
| `prevencion_cupo_on.png` | Cupo ON: cuarto frío 4/4, radar verde, intento bloqueado por `Cupo_frio` |
| `radar_amarillo.png` | Cupo OFF, cuarto frío 4/4: radar AMARILLO, 1 marcado muerto en ≤3 disparos |
| `game_over_interbloqueo.png` | GAME OVER POR INTERBLOQUEO: marcado muerto y últimos 12 disparos |
| `celular_consola_cip.png` | celular: HUD del Tanque 1 y consola CIP con PSEA rechazada |
| `celular_turno.png` | celular en horizontal, turno en marcha con 7 lotes |
| `celular_victoria.png` | celular: TURNO COMPLETADO · VICTORIA, 7 lotes, 74 pts, 5 de 6 logros |

Capturas de JFLAP 7.1 y PIPE 4.3.0 (`modelos/capturas/`):

| archivo | evidencia |
|---|---|
| `01_tanque_multiple_run.png` | 8 palabras: 4 Accept, 4 Reject |
| `02_reparacion_equivalencia.png` | PSESEAEZ y PSEAEZ Accept; PSAEZ, PSEA, PSEEZ Reject |
| `03_cip_supervisor.png` | supervisor Libre ⇄ Ocupado |
| `04_pipe2_estado_sin.png` | 160 estados / 355 arcos; deadlock y ruta de 16 disparos |
| `05_pipe2_deadlock.png` | marcado muerto tras los 16 disparos, ninguna transición habilitada |
| `06_pipe2_estado_con.png` | 146 estados / 321 arcos; sin deadlock |
| `07_pipe2_incidencia.png` | Post, Pre, A, M0 y transiciones habilitadas |
| `08_pipe2_invariantes.png` | 6 invariantes P |

Las capturas 04, 06 y 07 unen varias ventanas de PIPE sin modificarlas: el
programa no deja tener dos análisis abiertos a la vez y la ventana de
incidencia necesita desplazamiento.
