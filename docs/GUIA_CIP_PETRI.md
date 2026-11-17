# Guía: CIP y red de Petri, paso a paso

Esta guía responde dos preguntas: **cómo se repara un tanque con la expresión
regular** y **cómo leer la red de Petri del juego**. Al final están los pasos
para la entrega y el despliegue.

**Video:** [`docs/video-tutorial.mp4`](video-tutorial.mp4) (3:58). El capítulo
04 muestra el CIP y el 06 la red de Petri con el marcado en vivo.

---

## 1. Reparación CIP paso a paso

### 1.1 La palabra que falla

La ficha pide el lenguaje:

\[
L = \mathcal{L}(P(SE)^+AEZ)
\]

Se lee así:

1. **P**: preenjuague (obligatorio, una vez).
2. **(SE)+**: una o más rondas de **S** (soda cáustica) y **E** (enjuague).
3. **A**: ácido.
4. **E**: enjuague después del ácido.
5. **Z**: sanitizar.

Por eso:

| palabra | ¿válida? | por qué |
|---|:---:|---|
| `P S E S E A E Z` | ✅ | P, dos rondas SE, A, E, Z (la de la ficha) |
| `P S E A E Z` | ✅ | P, una ronda SE, A, E, Z |
| `P S E A Z` | ❌ | después de **A** falta **E** antes de **Z** |
| `P S A E Z` | ❌ | después de **S** falta **E** antes de **A** |
| `P S E A` | ❌ | falta **Z**; el DFA queda en `q5` |

**`P S E A Z` no se puede completar con Z** porque en `q4` (después de
`P S E A`) la única transición es `E`, no `Z`. El último símbolo no es un
dígito ni un bug del teclado: el DFA te está pidiendo el enjuague.

### 1.2 En el juego

1. Consigue un tanque en `Llenando`.
   - Espera la revisión de fallo (30 % cada 18 s), o
   - usa el botón naranja **`t · Forzar pérdida de temperatura`** del HUD.
2. El tanque va a **`Fallo`** y pierde 25 puntos.
3. Clic en el tanque → HUD → **`i · Iniciar lavado CIP`**.
   - Si otro tanque está en `Lavado_CIP`, el botón está rojo: el supervisor
     no deja dos circuitos CIP a la vez.
4. Se abre la **CONSOLA CIP**. El DFA arranca en `q0`.
5. Escribe la receta con el teclado o con los botones:
   `P → S → E → S → E → A → E → Z`
   (o `P → S → E → A → E → Z`).
   - Cada símbolo válido avanza el DFA: `q0 → q1 → q2 → q3 → q2 → q3 → q4 →
     q5 → q6`.
   - Si te equivocas, la consola dice **“Esperado: …”**. Por ejemplo, si
     escribes `P S E A Z`, dirá **“Desde q4 no hay transición con Z.
     Esperado: E.”** Escribe `E` y luego `Z`.
   - **Borrar** quita el último símbolo; **Ayuda** muestra la expresión
     regular y cuesta 5 puntos.
6. Cuando el DFA esté en **`q6`** (verde, con ✓), pulsa **Validar** o
   **Enter**.
7. El juego dispara `CIP_ok` (evento de δ), el tanque vuelve a **`Vacio`** y
   gana +20 puntos si fue al primer intento (+10 si hubo intentos previos).
   El logro **CIP perfecto** se desbloquea al primer intento.
8. Si la palabra no pertenece a \(L\), el tanque sigue en `Lavado_CIP`, pierde
   8 puntos y puedes corregir la palabra sin salir de la consola.

### 1.3 Lo que está pasando por dentro

- `src/sed/lenguaje.js` valida con **dos** controles: la `RegExp` anclada
  `^P(SE)+AEZ$` y el **DFA** de `src/sed/modelos/reparacion.json`.
- El DFA tiene 7 estados útiles (`q0` a `q6`) y un estado trampa en JFLAP para
  que sea completo.
- La consola usa `avanzar(simbolo)` y muestra `esperado`; al validar se llama
  `sim.reparar(id, palabra)`, que vuelve a validar con una instancia nueva del
  lenguaje.
- Si la palabra es válida, `Automata.ejecutar('CIP_ok')` cambia
  `Lavado_CIP → Vacio`. Ningún `if` de la escena cambia el estado.
- El **supervisor** `SupervisorCIP` solo permite un `iniciar_CIP` a la vez;
  el segundo botón se pinta rojo con la razón formal y el intento cuesta 15
  puntos.

---

## 2. La red de Petri, paso a paso

### 2.1 Qué es cada cosa

- **Lugar**: un depósito o recurso (silo, tanque libre, vapor, frío, cuarto
  frío, botellas, cupo).
- **Token**: una ficha dentro de un lugar. `m/k` significa “hay `m` tokens de
  capacidad `k`”.
- **Transición**: una operación que consume tokens de sus lugares de entrada
  (`Pre`) y produce tokens en los de salida (`Post`).
- **Habilitada**: la transición puede dispararse si hay todos los tokens de
  `Pre` y las capacidades `k` no se superan.
- **Disparo**: mover los tokens. Es el único mecanismo que cambia el marcado.

La red del proyecto tiene **11 lugares** y **6 transiciones**:

| transición | consume | produce | para qué |
|---|---|---|---|
| `t_iniciar_past` | Leche + Tanque_libre + Vapor + Cupo | Lote_past | arranca la pasteurización (AND-join) |
| `t_fin_past` | Lote_past + Frio | Lote_enfr + Vapor | termina la pasteurización |
| `t_fin_enfr` | Lote_enfr | Cuarto_frio + Frio + Tanque_libre | descarga al cuarto frío |
| `t_embotellar` | Cuarto_frio + Emb_lista | Botellas + Emb_lista + Cupo | embotella un lote |
| `t_parar_emb` | Emb_lista | Emb_parada | detiene la embotelladora |
| `t_arrancar_emb` | Emb_parada + Vapor | Emb_lista + Vapor | la vuelve a arrancar |

### 2.2 Las tres ideas que hay que entender

1. **AND-join.** `t_iniciar_past` necesita **cuatro** tokens a la vez. Si
   falta vapor, el botón `p` está rojo y el HUD dice “Vapor 0/1”. No es un
   capricho del juego: es `M ≥ Pre(t)`.
2. **Conflicto (choice).** `Vapor_disp` es uno solo y lo quieren
   `t_iniciar_past` y `t_arrancar_emb`. El jugador decide si el vapor se usa
   para pasteurizar o para arrancar la embotelladora. Cuando ambos están
   habilitados, el inspector los marca como conflicto.
3. **Acotación.** `Cuarto_frio` es estricto \(k=4\). Cuando hay 4 lotes,
   `t_fin_enfr` no se puede disparar: el tanque retiene el lote y el frío. Esa
   es la pieza que arma el deadlock.

### 2.3 La ecuación de estado

\[
M_k = M_{k-1} + A^T u_k
\]

- `Pre` y `Post` son matrices de \(6 \times 11\) (fila = transición, columna =
  lugar).
- `A = Post - Pre`.
- `u_k` es un vector con un 1 en la transición disparada y 0 en las demás.
- Ejemplo: si `u = [1,0,0,0,0,0]`, el marcado pasa de
  `[6,3,1,1,0,0,0,1,0,0,4]` a `[5,2,0,1,1,0,0,1,0,0,3]`.

En el **Inspector** (`I`):
- pestaña **Pre**, **Post** o **A**: las matrices;
- fila **M actual**: el marcado actual con `m/k`;
- **Último disparo**: el vector `u_k`;
- la línea de la ecuación con los números;
- **Probar disparo**: elige una transición y muestra el marcado que
  resultaría sin aplicarlo; si no está habilitada, dice qué lugar falta.

### 2.4 El deadlock y la prevención

**Cómo provocarlo** (con `Cupo: OFF`):

1. Detén la embotelladora (clic en ella o botón **Embot: ON/OFF**).
2. Embotella 4 lotes hasta llenar el cuarto frío.
3. Deja un lote en **Pasteurizando** (retiene vapor) y otro en
   **Enfriando** (retiene frío).
4. Intenta seguir: `t_fin_enfr` no puede meter el quinto lote, `t_fin_past`
   no consigue frío, `t_iniciar_past` y `t_arrancar_emb` no consiguen vapor.
5. El radar pasa a **amarillo** y luego a **rojo**. El juego termina con
   **Game over por interbloqueo** y muestra el marcado muerto
   `[0,1,0,0,1,1,4,0,1,0,0]`, la secuencia y la regla.

**Cómo prevenirlo:**

- Activa **Cupo: ON** antes de llenar el cuarto frío.
- `Cupo_frio` (M0 = 4) se consume en `t_iniciar_past` y se devuelve en
  `t_embotellar`.
- Invariante: `Cupo_frio + Lote_past + Lote_enfr + Cuarto_frio = 4`.
- El marcado muerto tendría `Cupo_frio = -2`; por eso es inalcanzable.
- Con el monitor: **146** marcados y **0** deadlocks. Sin el monitor: **160**
  marcados y **1** deadlock.

**Reintento:** en la pantalla de game over, **Reintentar desde el último
verde** restaura el último marcado seguro; luego activa **Cupo: ON** y el
radar vuelve a verde.

### 2.5 Cómo leer el radar

- **Verde:** no hay ningún marcado muerto alcanzable en 3 disparos.
- **Amarillo (parpadea):** hay un deadlock alcanzable en ≤ 3 disparos.
- **Rojo:** el marcado actual ya no habilita ninguna transición.

El radar no adivina: llama `explorar(red, M, 3)`, que hace un BFS de
profundidad 3 desde el marcado actual y filtra los marcados muertos
circulares. El inspector muestra además el árbol de 4 niveles y el número de
marcados alcanzables desde M0 (146/160 según el monitor).

### 2.6 La red en el juego

| red | juego |
|---|---|
| `t_iniciar_past` | evento `p` del tanque (`Llenando → Pasteurizando`) |
| `t_fin_past` | evento `f` (`Pasteurizando → Enfriando`) |
| `t_fin_enfr` | evento `d` (`Enfriando → Vacio`) |
| `t_parar_emb` / `t_arrancar_emb` | botón **Embot: ON/OFF** |
| `Leche_cruda` | llegada de leche cada 15 s |
| `Cuarto_frio` | 4 ranuras visibles |
| `Cupo_frio` | botón **Cupo: ON/OFF** |

Ninguna escena cambia el marcado a mano: el simulador llama
`red.disparar(t)` y luego envía el evento δ a la máquina.

---

## 3. Ruta para la entrega

1. **Modelo verificado:** abrir los `.jff` en JFLAP y los `.pnml` en PIPE2;
   comprobar 146/160, el deadlock de 16 disparos y 216/16/200; guardar las
   capturas en `modelos/capturas/` (ver `modelos/README.md`).
2. **Simulador:** `npm test` (42/42); `npm run build`; `npm run preview`;
   probar el CIP, el supervisor y el deadlock en el navegador.
3. **ZIP:** `Grupo1_DairyCraft.zip` con `index.html` en la raíz y `assets/`;
   menos de 25 MB.
4. **GitHub:** repositorio con el código, `README.md`, `PROMPTS.md`, `docs/`
   y el historial de commits.
5. **Video:** 4 minutos con el HUD, el CIP, el supervisor y el deadlock; el
   guion está en `docs/VIDEO.md`.
6. **Sustentación:** cada integrante explica una función del núcleo
   (`ejecutar`, `avanzar`, `disparar`, `cobertura`, `SupervisorCIP`) y la
   compara con JFLAP/PIPE2.
