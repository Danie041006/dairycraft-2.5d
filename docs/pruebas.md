# Pruebas y conformidad · Laboratorio 1

Este documento reúne las tablas de la sección 5.2 (modelo verificado) y de la
sección 5.9 (pruebas del simulador). Las celdas marcadas ✅ se ejecutaron en el
entorno de desarrollo; las marcadas ☐ las completa el equipo con JFLAP, PIPE2,
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
| `apfd` | ciclo normal | sí | ☐ | ✅ |
| `axic` | fallo en llenado + CIP | sí | ☐ | ✅ |
| `apfdapfd` | dos ciclos | sí | ☐ | ✅ |
| `apfdaxic` | ciclo + fallo + CIP | sí | ☐ | ✅ |
| `p` | iniciar sin llenar | no | ☐ | ✅ |
| `ap` | queda en Pasteurizando | no | ☐ | ✅ |
| `apf` | queda en Enfriando | no | ☐ | ✅ |
| `apfdxt` | evento fuera de δ | no | ☐ | ✅ |

> Los 8 casos están automatizados en `test/automata.test.js`. Falta la captura
> de JFLAP (`Input > Multiple Run`) en `modelos/capturas/`.

### 1.2 Red de Petri

| propiedad | resultado | evidencia |
|---|---|---|
| n.º de lugares / transiciones | 11 / 6 | `src/sed/modelos/dairycraft.json` |
| M0 | `[6, 3, 1, 1, 0, 0, 0, 1, 0, 0, 4]` | tabla de `docs/modelo/petri.md` |
| ¿Acotada? | sí, con M0 sin llegadas | 146 / 160 marcados |
| k por lugar | Leche 10, Tanque 3, Vapor 1, Frio 1, LoteP 3, LoteE 3, Cuarto 4, EmbL 1, EmbP 1, Cupo 4 | JSON |
| ¿Segura (1-acotada)? | en Vapor, Frio, EmbL, EmbP; no en los demás | análisis |
| Deadlock sin prevención | 1: `[0,1,0,0,1,1,4,0,1,0,0]` | 16 disparos |
| Deadlock con `Cupo_frio` | 0 | 146 marcados |
| Regla de prevención | `Cupo_frio + LoteP + LoteE + Cuarto = 4` | invariante |
| Invariantes P | 6 (tabla de `petri.md`) | 1000 disparos aleatorios ✅ |
| N.º de nodos/marcados del árbol | 160 sin prevención · 146 con prevención (marcados distintos) | `grafoAlcanzabilidad` ✅ |
| Conflictos | `Vapor_disp` entre `t_iniciar_past` y `t_arrancar_emb` | `conflictos()` ✅ |
| AND-join | `t_iniciar_past` con 4 tokens | HUD / inspector ✅ |

> PIPE2: abrir los `.pnml`, ejecutar `Incidence & Marking`, `State Space
> Analysis`, `Reachability/Coverability Graph` e `Invariant Analysis`; guardar
> las capturas `04` a `08` en `modelos/capturas/`.

## 2. Pruebas del GDD (sección 5.9 a)

| criterio de aceptación | cómo se prueba | ¿cumple? | observación |
|---|---|:---:|---|
| Color e ícono = estado del autómata | abrir 3 HUD en momentos distintos | ✅ | captura `captura-planta.png` |
| Grafo del HUD = `tanque.jff` | comparar captura del HUD con JFLAP | ✅/☐ | 6 nodos, 8 eventos; falta la captura JFLAP |
| Ninguna máquina cambia sin δ | revisar el historial de 10 eventos | ✅ | `historial` del autómata |
| La consola repara con \(L\) y rechaza lo demás | PSESEAEZ válida; PSAEZ inválida | ✅ | `test/lenguaje.test.js`, `test/simulador.test.js` |
| El supervisor nunca deja 2 CIP | 3 intentos + 10 000 eventos | ✅ | `test/composicion.test.js` |
| Ninguna transición sin tokens | iniciar sin vapor; descargar con cuarto lleno | ✅ | `eventosHUD` rojo y razón |
| El desborde penaliza | llegar a 11/10 | ✅ | alerta y −10 |
| El radar pasa por verde/amarillo/rojo | provocar y prevenir el deadlock | ✅/☐ | lógica probada; falta captura de los 3 colores |
| El inspector calcula \(M_k\) | 3 disparos a mano | ✅ | matriz y ecuación |
| HUD en zonas + 6 logros | comparar con GDD §7 | ✅ | captura HUD |
| `npm test` | `npm test` | ✅ | **42/42** |
| Build y preview sin 404 | `npm run build`, `npm run preview` | ✅ | Chromium headless sin errores |
| Mouse, teclado y táctil | un turno con mouse y otro en tableta | ☐ | pendiente de tableta |
| Juego = JFLAP y PIPE2 | tablas 5.2 y 5.9 | ✅/☐ | núcleo probado; faltan capturas |

## 3. Conformidad modelo ↔ juego (sección 5.9 b)

| secuencia | JFLAP / PIPE2 | juego | ¿coincide? |
|---|---|---|---|
| `a p f d` | Vacio (aceptada) | Vacio | ✅ |
| `a x i c` | Vacio (aceptada) | Vacio | ✅ |
| `p` | rechazada | rechazada | ✅ |
| 16 disparos del deadlock | marcado `[0,1,0,0,1,1,4,0,1,0,0]` | mismo marcado | ✅ |
| 16 disparos con `Cupo_frio` | la 6.ª `t_iniciar_past` se deshabilita | el botón queda rojo | ✅ |

| dato | software académico | juego |
|---|---|---|
| n.º estados del supervisor | 216 producto / 16 prohibidos / 200 con supervisor | 216/16/200 ✅ |
| n.º marcados desde M0 | 160 sin / 146 con | 160/146 ✅ |
| marcado muerto | `[0,1,0,0,1,1,4,0,1,0,0]` | mismo ✅ |

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
| Provocar | embotellar 4 lotes, detener embotelladora, seguir pasteurizando | rojo | game over, marcado muerto |
| Prevenir con el monitor | activar **Cupo** antes de llenar el cuarto frío | verde | 0 deadlocks |
| Salir de amarillo | ver amarillo y activar **Cupo** | amarillo → verde | +30 y logro 6 |

## 6. Supervisor / observador (sección 5.9 e)

| intento | esperado | juego | ¿cumple? |
|---|---|---|---|
| `iniciar_CIP` en T2 con T1 en CIP | rechazar y explicar | botón rojo, −15 | ✅ |
| 10 000 eventos aleatorios | 0 estados con 2 CIP | 0 | ✅ |
| Observador (módulo aparte) | estimación contiene el estado real | 100 secuencias | ✅ |

## 7. Controles alternos (sección 5.9 f)

| acción | mouse/teclado | táctil | ¿funciona? |
|---|---|:---:|:---:|
| seleccionar tanque y abrir HUD | clic | tocar | ✅ |
| disparar evento | clic en botón | tocar botón | ✅ |
| escribir CIP | teclado | botones | ✅ |
| pausa / inspector | P / I | botones | ✅ |
| velocidad | 1, 2, 4 | botones | ✅ |
| cámara | arrastre + rueda | arrastre + pinza | ✅/☐ |

## 8. Rendimiento (sección 5.9 g)

| momento | fps sin efectos | fps con efectos | equipo / navegador |
|---|:---:|:---:|---|
| inicio del turno | ☐ | ☐ | — |
| hora pico a ×4 | ☐ | ☐ | — |
| inspector con árbol | ☐ | ☐ | — |

En el navegador headless usado para las capturas el renderer fue WebGL 2 y no
aparecieron errores; la medición de fps con GPU real queda pendiente.

## 9. Playtest (sección 5.9 h)

| observación de otro equipo | cambio realizado | sección |
|---|---|---|
| ☐ | ☐ | — |
| ☐ | ☐ | — |

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

Las capturas de JFLAP y PIPE2 las toma el equipo; los nombres sugeridos están
en `modelos/capturas/README.md`.
