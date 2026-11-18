# GDD · DairyCraft 2.5D

**Proyecto 1 · A, planta láctea** — Modelado y Simulación de Sistemas de
Eventos Discretos (167413), Fase 1 – Laboratorio 1.
Equipo: Deivid Peñaloza, Paula Mendoza, Fabian Garcia, Daniel Castellanos.
Versión 1.0 · motor Phaser 4.2.1 por CDN · 960 × 540.

---

## 1. Concepto

Eres el operador de una planta láctea pequeña. Tres tanques pasteurizadores
comparten una caldera de vapor, una bomba de frío, una embotelladora y un
cuarto frío. Debes embotellar **6 lotes en 3 minutos de simulación** sin
provocar un interbloqueo. Cada máquina obedece su autómata y cada recurso se
mueve solo cuando una transición de la red de Petri se dispara: el juego es la
interfaz del modelo formal, no un juego con reglas inventadas.

El jugador ve el autómata de cada tanque, el grafo de la red, la ecuación de
estado y un radar que mira tres disparos hacia adelante. El reto es de
**gestión de recursos**: el vapor y el frío son únicos, el cuarto frío es
estricto y la embotelladora necesita vapor para volver a arrancar.

## 2. Pilares

1. **El modelo manda.** Ningún estado cambia sin δ; ningún recurso se mueve
   sin el disparo de una transición.
2. **La teoría se ve.** El HUD dibuja el autómata en vivo, la consola muestra
   el DFA de reparación y el inspector enseña \(M_k = M_{k-1} + A^T u_k\).
3. **Decisiones con consecuencia.** Parar la embotelladora y llenar el cuarto
   frío puede provocar un deadlock; activar `Cupo_frio` a tiempo lo evita.
4. **Legible en 2.5D.** Rejilla isométrica 2:1, orden de profundidad y arte
   original dibujado en código.
5. **Reproducible.** Semilla fija (`20261116`): la misma partida produce los
   mismos fallos y las mismas llegadas.

## 3. MDA

| capa | contenido |
|---|---|
| **Mecánicas** | δ de 6 estados por tanque; 8 eventos; 11 lugares y 6 transiciones de Petri; capacidades \(k\); supervisor CIP; lenguaje regular de reparación; reloj de eventos con semilla. |
| **Dinámicas** | El jugador acapara vapor y frío, llena el cuarto frío, detiene la embotelladora y descubre la espera circular. La prevención cambia el orden de las decisiones. |
| **Estéticas** | Tensión de ver el radar pasar de verde a amarillo; alivio al reparar el CIP; satisfacción de ver los tokens viajar por la planta; presión del reloj. |

## 4. Ciclo de juego

- **Corto (atender una máquina, 5–15 s):** abrir la válvula, esperar el
  llenado, iniciar la pasteurización, vigilar el vapor, descargar al frío.
- **Medio (completar un lote, 18–25 s):** llenar → pasteurizar (8 s) →
  enfriar (6 s) → descargar → embotellar (4 s). El lote aparece como token en
  `Botellas`.
- **Largo (terminar el turno, 180 s):** producir 6 lotes, reparar los fallos,
  evitar el deadlock y cerrar con el radar en verde.

## 5. Reglas

### 5.1 Tanques

Cada tanque tiene el autómata de `docs/modelo/automatas.md`:

```
Vacio --a--> Llenando --p--> Pasteurizando --f--> Enfriando --d--> Vacio
Llenando --x,t--> Fallo --i--> Lavado_CIP --c--> Vacio
```

- `a`, `p`, `d`, `i` son controlables; `f`, `x`, `t`, `c` no controlables.
- Todos los eventos son observables.
- El tanque solo puede llenarse en `Vacio`; solo puede pasteurizar en
  `Llenando`; solo descarga en `Enfriando`.
- `x` (contaminación) y `t` (pérdida de temperatura) se detectan en
  `Llenando`; el tanque va a `Fallo` y necesita CIP.

### 5.2 Red de Petri

- `t_iniciar_past` es un **AND-join**: leche + tanque + vapor + cupo.
- `t_fin_past` devuelve vapor y retiene frío.
- `t_fin_enfr` devuelve frío y tanque y suma un lote al cuarto frío (k = 4).
- `t_embotellar` convierte un lote del cuarto frío en un lote embotellado y
  devuelve cupo.
- `t_parar_emb` / `t_arrancar_emb`: arrancar exige vapor.
- `Leche_cruda` (k = 10, desborde) recibe 1 token cada 15 s; por encima de 10
  hay derrame y −10 puntos.
- `Cuarto_frio` (k = 4, estricta): si está lleno, no se puede descargar.
- `Cupo_frio` (M0 = 4): monitor de prevención; el jugador lo activa o
  desactiva con el botón **Cupo: ON/OFF**.

### 5.3 Fallos, CIP y supervisor

- Cada 18 s se revisa si hay tanques en `Llenando`; con 30 % de probabilidad
  uno falla por `contaminacion`.
- El botón **Forzar** de un tanque en `Llenando` dispara `perdida_temp`
  (apuesta arriesgada: −25 puntos y CIP).
- La consola CIP pide una palabra de \(L = \mathcal{L}(P(SE)^+AEZ)\):
  **PSESEAEZ** es válida; **PSAEZ** no. La ayuda cuesta 5 puntos.
- El **supervisor** solo permite un tanque en `Lavado_CIP` a la vez; el botón
  `i` del segundo tanque se pinta rojo con la razón formal.
- El juego nunca asigna un tanque en `Fallo` o `Lavado_CIP` a una nueva
  pasteurización; el tanque vuelve a `Vacio` solo con `CIP_ok`.

### 5.4 Tiempos (segundos de simulación)

| acción | duración | elemento del GDD |
|---|:---:|---|
| llenado | 2,5 s | tiempo de `a` antes de habilitar `p` |
| pasteurización | 8 s | `fin_past` programado por el reloj |
| enfriamiento | 6 s | tiempo antes de habilitar `d` |
| embotellado | 4 s | periodo de `t_embotellar` |
| llegada de leche | 15 s | evento externo que agrega 1 token |
| revisión de fallo | 18 s | probabilidad 30 % de `contaminacion` |
| turno | 180 s | fin de partida |

### 5.5 Velocidad y pausa

`1×`, `2×` y `4×` multiplican el reloj de simulación; `P` pausa. El reloj de
eventos usa una cola de prioridad y una semilla fija para que la partida sea
reproducible.

## 6. Controles

| acción | mouse / teclado | táctil |
|---|---|---|
| seleccionar tanque y abrir su HUD | clic sobre el tanque | tocar el tanque |
| disparar un evento | clic en el botón verde del HUD | tocar el botón |
| escribir la receta CIP | teclas P, S, E, A, Z y Enter | botones P, S, E, A, Z y Validar |
| pausa / reanudar | `P` | botón Pausa |
| inspector de la red | `I` | botón Inspector |
| velocidad | `1`, `2`, `4` | botones 1×, 2×, 4× |
| cerrar panel | `Esc` | botón × |
| fps y tiempo | `F1` | — |
| mover / acercar cámara | arrastre + rueda | arrastre + pinza |
| detener / arrancar embotelladora | clic en la embotelladora | tocar la embotelladora |
| activar prevención | botón **Cupo** | botón **Cupo** |

## 7. HUD por zonas

| zona | contenido |
|---|---|
| arriba izquierda | turno, reloj, velocidad, pausa |
| arriba centro | puntaje, lotes / meta, botones de pausa, 1×, 2×, 4×, Inspector |
| arriba derecha | **Radar del Árbol de Cobertura** (verde / amarillo / rojo) y botones Cupo / Embotelladora |
| abajo izquierda | tokens por lugar con `m/k` (11 lugares) |
| abajo derecha | alertas: fallos, desbordes, intentos bloqueados, logros |
| centro | planta isométrica, tanques, caldera, frío, embotelladora, cuarto frío y silo |
| escena HUD de máquina | grafo del autómata, estado iluminado, botones de Γ(q), últimos 10 eventos y consola CIP |
| escena Inspector | matrices Pre/Post/A, \(M_k\), \(u_k\), ecuación, prueba de disparo y árbol de 4 niveles |

El HUD de máquina no pausa la simulación; el Inspector sí.

## 8. Puntaje

| concepto | puntos | condición |
|---|:---:|---|
| lote embotellado | **+12** | cada `t_embotellar` |
| reparación CIP válida al primer intento | **+20** | primera palabra válida |
| reparación CIP válida posterior | **+10** | palabra válida con intentos previos |
| reparación inválida | **−8** | palabra fuera de \(L\) |
| ayuda de la expresión regular | **−5** | una vez por tanque |
| desborde del silo | **−10** | cada llegada por encima de 10 |
| intento bloqueado por supervisor o red | **−15** | clic en un botón rojo |
| fallo de máquina | **−25** | `x` o `t` |
| logro | **+15** | cada uno de los 6 |
| deadlock evitado | **+30** | activar Cupo con el radar amarillo |
| game over por deadlock | **−100** | marcado muerto |

El puntaje puede ser negativo. En `Resultados` se muestra el total, los lotes,
la producción, las reparaciones, los intentos bloqueados, los desbordes, los
deadlocks evitados y los logros.

## 9. Victoria y derrota

- **Victoria:** terminar los 180 s con **6 lotes** embotellados y sin deadlock.
- **Turno terminado sin victoria:** terminar los 180 s con menos de 6 lotes.
- **Derrota:** el marcado actual es un deadlock circular (cuarto frío lleno +
  embotelladora detenida + vapor y frío retenidos). La simulación se detiene,
  se muestra “Game over por interbloqueo” con el marcado, la secuencia de
  disparos y la regla de prevención, y se puede **reintentar desde el último
  marcado verde** o empezar otro turno.

## 10. Logros (6)

| # | nombre | condición verificable |
|---|---|---|
| 1 | **Primer lote** | `t_embotellar` se dispara por primera vez (lotes ≥ 1). |
| 2 | **Línea completa** | los 3 tanques están simultáneamente en `Llenando`, `Pasteurizando` y `Enfriando` (3 estados de operación distintos). |
| 3 | **CIP perfecto** | una palabra válida de \(L\) repara un tanque al primer intento (`intentosReparacion === 0`). |
| 4 | **Guardián del frío** | se activa `Cupo_frio` con `Cuarto_frio ≤ 2` y sin deadlock. |
| 5 | **Sin derrames** | se termina el turno con `desbordes === 0`. |
| 6 | **Deadlock evitado** | se activa `Cupo_frio` cuando el radar está **amarillo** (deadlock alcanzable en ≤ 3 disparos) y no se llega al deadlock. |

Cada logro vale +15 puntos y muestra un aviso animado en el HUD.

## 11. Dificultad y turnos

- Un turno de 180 s. La primera partida usa la planta completa y el monitor
  **desactivado**, para que el jugador vea el deadlock en el radar.
- La dificultad crece por tres vías: la revisión de fallos cada 18 s, las
  llegadas de leche cada 15 s (que pueden desbordar) y el cuarto frío de 4.
- El jugador puede activar `Cupo_frio` en cualquier momento; si lo hace con el
  radar amarillo gana 30 puntos y el logro 6. La estrategia “nunca activar el
  monitor” puede producir más producción, pero el deadlock es una derrota.
- Ninguna estrategia gana siempre: el vapor y el frío se retienen por lotes
  distintos y la embotelladora detenida es la trampa.

## 12. Mecánicas → elemento formal

| mecánica del GDD | elemento formal |
|---|---|
| color e ícono de cada tanque | estado de \(G\) (`Vacio`, `Llenando`, `Pasteurizando`, `Enfriando`, `Lavado_CIP`, `Fallo`) |
| abrir válvula | evento `abrir_valvula` (c) de δ |
| iniciar pasteurización | evento `iniciar_past` (c) + `t_iniciar_past` (AND-join) |
| fin de pasteurización | evento no controlable `fin_past` + `t_fin_past` |
| descargar | evento `descargar` (c) + `t_fin_enfr` |
| fallo por contaminación | evento no controlable `contaminacion` en `Llenando` |
| forzar sin vapor | evento no controlable `perdida_temp` en `Llenando` |
| consola CIP | lenguaje \(P(SE)^+AEZ\) y DFA de 7 estados útiles |
| un solo CIP | supervisor `Circuito_CIP` (Libre/Ocupado) |
| vapor compartido | `Vapor_disp` (k = 1) y conflicto `t_iniciar_past` vs `t_arrancar_emb` |
| frío retenido | `Frio_disp` (k = 1) y `Lote_enfr` |
| cuarto frío lleno | `Cuarto_frio` (k = 4, estricta) |
| desborde del silo | `Leche_cruda` (k = 10, desborde) |
| cupo de prevención | `Cupo_frio` (M0 = 4) e invariante 4 |
| radar verde/amarillo/rojo | `explorar(red, M, 3)` y marcados muertos |
| game over | deadlock circular de la ficha |
| inspector | \(A = Post - Pre\), \(M_k = M_{k-1} + A^T u_k\) |
| reloj y semilla | `reloj.js` (cola de prioridad) y `aleatorio.js` (mulberry32) |
| HUD de máquina | grafo de \(G\) y Γ(q) |
| logros | condiciones verificables sobre el marcado y el historial |

## 13. Criterios de aceptación

| # | criterio | cómo se prueba | estado |
|:---:|---|---|:---:|
| 1 | El color e ícono de cada tanque coinciden con su estado | abrir el HUD de 3 tanques en momentos distintos | Listo |
| 2 | El grafo del HUD es igual al de `tanque.jff` | comparar la captura con JFLAP | Listo |
| 3 | Ningún tanque cambia de estado sin un evento de δ | revisar el historial de 10 eventos del HUD | Listo |
| 4 | La consola repara con palabras de \(L\) y rechaza las demás | probar PSESEAEZ (válida) y PSAEZ (inválida) | Listo |
| 5 | El supervisor nunca deja 2 tanques en CIP | intentar 3 veces; prueba de 10 000 eventos | Listo |
| 6 | Ninguna transición se dispara sin sus tokens | intentar iniciar sin vapor, descargar con el cuarto lleno | Listo |
| 7 | El desborde del silo penaliza | dejar llegar leche por encima de 10 | Listo |
| 8 | El radar pasa por verde, amarillo y rojo; el deadlock termina | provocar el deadlock y luego prevenirlo | Listo |
| 9 | El inspector calcula \(M_k = M_{k-1} + A^T u_k\) | probar 3 disparos a mano | Listo |
| 10 | HUD completo en las zonas del GDD y 6 logros con aviso | comparar con la sección 7 | Listo |
| 11 | `npm test` pasa completo | `npm test` | Listo (42/42) |
| 12 | El build y el preview no tienen errores 404 | `npm run build`, `npm run preview` | Listo |
| 13 | El simulador corre con mouse, teclado y táctil | turno con mouse y otro en tableta | Listo en celular (no se contó con tableta) |
| 14 | El juego coincide con JFLAP y PIPE2 | tablas de `docs/pruebas.md` | Listo |

## 14. Arte

La guía de estilo, la paleta, los íconos de estado, los tokens y la hoja de
arte están en `docs/arte.md` y `hoja-arte.html`. Todo el arte es original y se
dibuja en código; no se usan sprites, personajes ni música de juegos
comerciales.

## 15. Alcance y decisiones

- **Incluido:** 3 tanques, 1 caldera, 1 bomba de frío, 1 embotelladora, 1
  cuarto frío, 1 silo, HUD de máquina, consola CIP, supervisor CIP, tokens
  físicos, inspector, radar, 6 logros, resultados y controles táctiles.
- **Reparación CIP:** se mantienen los 6 estados de la ficha y el lenguaje se
  valida con el DFA de reparación de 7 estados útiles; al aceptar, `CIP_ok`
  (evento de δ) devuelve el tanque a `Vacio`. Es la opción A de la guía.
- **Fallos:** se modelan en `Llenando`; así el CIP no retiene tokens de la
  red. La ficha no fija los estados origen; es una extensión permitida.
- **Monitor:** el juego empieza con `Cupo_frio` desactivado para poder mostrar
  el deadlock; el botón **Cupo** lo activa. La red formal de PIPE2 con
  prevención tiene 146 marcados y 0 muertos; sin prevención, 160 y 1.
- **Pendiente para la sustentación:** playtest con otro equipo. Las capturas
  de JFLAP/PIPE2 y los fps ya están; no se contó con tableta, así que la
  prueba táctil se hizo en celular.
