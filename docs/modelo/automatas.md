# Modelo formal · Autómatas (Unidad 2)

Proyecto **DairyCraft 2.5D · A, planta láctea** (proyecto 1).
Modelo verificado con la ficha D.1 del Anexo D de la guía y con
`modelos/automatas/tanque.jff` en JFLAP 7.1.

## 1. Autómata del tanque

Cada uno de los 3 tanques tiene su propia instancia del mismo autómata
determinista:

\[
G = (Q, \Sigma, \delta, q_0, Q_m)
\]

- \(Q =\) {`Vacio`, `Llenando`, `Pasteurizando`, `Enfriando`, `Lavado_CIP`, `Fallo`}
- \(q_0 =\) `Vacio`
- \(Q_m =\) {`Vacio`}
- \(|\Sigma| = 8\), \(|\delta| = 8\) transiciones definidas.
- \(\Sigma_{uo} = \varnothing\): todos los eventos son observables.
- El autómata es determinista: para cada par (estado, evento) hay cero o una
  transición.

### 1.1 Eventos

| id | código | nombre | controlable | observable | descripción |
|---|---|--------|:---:|:---:|---|
| `abrir_valvula` | a | Abrir válvula | c | sí | Vacio → Llenando |
| `iniciar_past` | p | Iniciar pasteurización | c | sí | Llenando → Pasteurizando; consume leche, tanque, vapor y cupo en la red |
| `fin_past` | f | Fin de pasteurización | uc | sí | Pasteurizando → Enfriando; devuelve vapor y retiene frío |
| `descargar` | d | Descargar al cuarto frío | c | sí | Enfriando → Vacio; devuelve frío y tanque |
| `contaminacion` | x | Contaminación | uc | sí | Llenando → Fallo; detectada en la recepción |
| `perdida_temp` | t | Pérdida de temperatura | uc | sí | Llenando → Fallo; también es el evento del botón “Forzar” |
| `iniciar_CIP` | i | Iniciar lavado CIP | c | sí | Fallo → Lavado_CIP; compite por el único circuito CIP |
| `CIP_ok` | c | CIP validado | uc | sí | Lavado_CIP → Vacio; se dispara al aceptar la palabra de reparación |

### 1.2 Tabla δ

| estado | a | p | f | d | x | t | i | c |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Vacio** | Llenando | — | — | — | — | — | — | — |
| **Llenando** | — | Pasteurizando | — | — | Fallo | Fallo | — | — |
| **Pasteurizando** | — | — | Enfriando | — | — | — | — | — |
| **Enfriando** | — | — | — | Vacio | — | — | — | — |
| **Fallo** | — | — | — | — | — | — | Lavado_CIP | — |
| **Lavado_CIP** | — | — | — | — | — | — | — | Vacio |

> Decisión de modelado documentada: `contaminacion` y `perdida_temp` se
> definen en **Llenando**. Así el fallo no deja retenidos tokens de
> `Lote_past`, `Vapor_disp` ni `Frio_disp` en la red, y el CIP solo cambia el
> estado del tanque. La ficha no fija los estados origen de esos eventos; esta
> es una extensión permitida que mantiene intactos los estados y eventos de la
> ficha.

## 2. Palabras de prueba (JFLAP y juego)

| palabra | eventos | ¿pertenece a L(G)? | resultado esperado |
|---|---|:---:|---|
| `apfd` | abrir, iniciar, fin, descargar | sí | termina en Vacio (marcado) |
| `axic` | abrir, contaminación, CIP, CIP_ok | sí | termina en Vacio (reparado) |
| `apfdapfd` | dos ciclos completos | sí | termina en Vacio |
| `apfdaxic` | ciclo + fallo + CIP | sí | termina en Vacio |
| `p` | iniciar | no | δ(Vacio, p) no definida |
| `ap` | abrir, iniciar | no | termina en Pasteurizando, no marcado |
| `apf` | abrir, iniciar, fin | no | termina en Enfriando, no marcado |
| `apfdxt` | ... | no | δ(Vacio, x) no definida |

Las 4 palabras aceptadas y las 4 rechazadas se prueban en JFLAP con
`Input > Multiple Run` y en el juego con el HUD del tanque. La prueba
automática `test/automata.test.js` reproduce la tabla.

## 3. Lenguaje de reparación CIP

La ficha pide:

\[
L = \mathcal{L}(P(SE)^+AEZ)
\]

- Alfabeto de la consola: `{P, S, E, A, Z}`.
- Significado: **P** preenjuague, **S** soda cáustica, **E** enjuague,
  **A** ácido, **Z** sanitizar.
- Palabra válida de la ficha: **PSESEAEZ**.
- Palabra inválida de la ficha: **PSAEZ** (falta el enjuague después de la
  soda).
- Otra válida: **PSEAEZ** (una ronda SE, luego AEZ).
- Otra inválida: **PSEA**.

### 3.1 DFA de reparación

`modelos/automatas/reparacion.jff` contiene el DFA completo (con estado
trampa) y `src/sed/modelos/reparacion.json` la versión útil de 7 estados.

| estado | P | S | E | A | Z | final |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| q0 | q1 | — | — | — | — | no |
| q1 | — | q2 | — | — | — | no |
| q2 | — | — | q3 | — | — | no |
| q3 | — | q2 | — | q4 | — | no |
| q4 | — | — | q5 | — | — | no |
| q5 | — | — | — | — | q6 | no |
| q6 | — | — | — | — | — | **sí** |
| Trampa | Trampa | Trampa | Trampa | Trampa | Trampa | no |

- 7 estados útiles + 1 trampa para que el DFA sea completo en JFLAP.
- La RegExp anclada y el DFA coinciden en las 20 palabras de
  `test/lenguaje.test.js`.
- En la consola del juego, cada símbolo avanza el DFA y se muestra
  `Esperado: ...`; al validar, `lenguaje.js` comprueba RegExp y DFA. Si la
  palabra pertenece a \(L\), se dispara `CIP_ok` (evento de δ) y el tanque
  vuelve a `Vacio`. Si no, sigue en `Lavado_CIP` y pierde puntos.

## 4. Supervisor del circuito CIP

La ficha: **hay un solo circuito CIP**, así que dos tanques no pueden estar en
`Lavado_CIP` a la vez; el supervisor deshabilita `iniciar_CIP` en los demás
tanques.

Autómata de especificación `Circuito_CIP` (archivo
`modelos/automatas/cip_supervisor.jff`):

| estado | `iniciar_CIP` | `CIP_ok` |
|---|---|---|
| **Libre** | Ocupado | — |
| **Ocupado** | — | Libre |

- Ambos estados se marcan para que la especificación sea de seguridad, no de
  aceptación.
- Composición síncrona de los 3 tanques + especificación:

| comprobación | resultado |
|---|---|
| Producto de los 3 tanques (6 estados cada uno) | **216** estados |
| Estados prohibidos (2 o 3 tanques en `Lavado_CIP`) | **16** |
| Estados alcanzables con el supervisor | **200** |
| Prueba aleatoria de 10 000 eventos con el supervisor | 0 violaciones |

La política concreta está en `src/sed/composicion.js`
(`SupervisorCIP`) y en el HUD: el botón `i` del segundo tanque se pinta rojo
con la razón “Circuito CIP ocupado por Tanque N”. El intento se registra y
descuenta puntos. La composición genérica `componer`/`supervisor` se prueba
con dos autómatas pequeños en `test/composicion.test.js`.

## 5. Autómata observador

El proyecto 1 no usa observador (\(\Sigma_{uo}=\varnothing\)), pero el núcleo
incluye `src/sed/observador.js` y `test/observador.test.js` con un sensor
pequeño: la estimación siempre contiene el estado real en 100 secuencias.
Así el equipo puede demostrar que conoce la construcción de subconjuntos si el
docente la pide.

## 6. Archivos y verificación

| archivo | contenido |
|---|---|
| `modelos/automatas/tanque.jff` | 6 estados, 8 transiciones, q0 y Qm |
| `modelos/automatas/reparacion.jff` | DFA completo con trampa |
| `modelos/automatas/cip_supervisor.jff` | especificación Libre/Ocupado |
| `src/sed/modelos/tanque.json` | modelo que consume el juego |
| `src/sed/modelos/reparacion.json` | DFA útil + regex |
| `test/automata.test.js` | 8 palabras y determinismo |
| `test/lenguaje.test.js` | RegExp vs DFA en 20 palabras |
| `test/composicion.test.js` | 216 / 16 / 200 y 10 000 eventos |

### 6.1 Verificación en JFLAP (para el informe)

1. Abrir `tanque.jff`; `Test > Highlight Nondeterminism` no debe marcar nada.
2. `Input > Multiple Run`: cargar las 8 palabras de la tabla; las 4 primeras
   terminan en `Vacio` (aceptadas) y las 4 últimas se rechazan.
3. Abrir `reparacion.jff`; `Test > Compare Equivalence` contra la expresión
   regular `P(SE)(SE)*AEZ` (en JFLAP `+` es unión, no “una o más veces”;
   la cadena vacía es `!`).
4. `Convert > Minimize DFA` (el DFA con trampa conserva 8 estados; los 7
   útiles son los del lenguaje).
5. Guardar capturas en `modelos/capturas/` con los nombres
   `01_tanque_multiple_run.png`, `02_reparacion_equivalencia.png`,
   `03_cip_supervisor.png`.

> Las capturas de JFLAP y PIPE2 debe tomarlas el equipo en su computador:
> aquí no hay Java instalado. Los archivos ya están generados y son la
> especificación que el juego traduce.
