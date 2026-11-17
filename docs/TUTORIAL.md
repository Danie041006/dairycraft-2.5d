# Tutorial: jugar y explicar DairyCraft 2.5D

Guía para el equipo y para la sustentación. Complementa
`docs/GUIA_CIP_PETRI.md` (CIP y red de Petri en detalle) y
`docs/VIDEO.md` (video publicado y capítulos).

- **Juego local:** `http://localhost:5180/` (o `http://172.31.188.192:5180/`)
- **Juego publicado:** https://dairycraft-2-5d.vercel.app/
- **Hoja de arte:** `http://localhost:5181/hoja-arte.html`
- **Repositorio:** https://github.com/Danie041006/dairycraft-2.5d
- **Guía CIP/Petri:** `docs/GUIA_CIP_PETRI.md`
- **Video:** [`docs/video-tutorial.mp4`](video-tutorial.mp4) (3:58, voz y subtítulos) · [release v1.0.0](https://github.com/Danie041006/dairycraft-2.5d/releases/tag/v1.0.0)
- **Capítulos del video:** `docs/VIDEO.md`

---

## 1. Objetivo del juego

Eres el operador de una planta láctea. Tienes **3 tanques**, una **caldera**
de vapor, una **bomba de frío**, una **embotelladora** y un **cuarto frío**
estricto de 4 lotes. Debes embotellar **6 lotes en 180 s** de simulación sin
provocar un **deadlock**.

Cada máquina obedece su autómata; cada recurso se mueve solo cuando una
transición de la red de Petri se dispara. El juego es la interfaz del modelo:
si el juego y el modelo no coinciden, se corrige el juego.

---

## 2. Primeros 30 segundos

1. Abre el juego y pulsa **▶ Iniciar turno**.
2. Verás la planta isométrica y el HUD:
   - arriba izquierda: reloj y turno;
   - arriba centro: puntaje y lotes / 6;
   - arriba derecha: **Radar del Árbol de Cobertura**;
   - abajo izquierda: tokens por lugar (`m/k`);
   - abajo derecha: alertas.
3. Haz clic en un tanque para abrir su **HUD de máquina**: el grafo del
   autómata, el estado actual iluminado, los botones de eventos y el historial.
4. Botones y teclas: **P** pausa, **I** inspector, **1 / 2 / 4** velocidad,
   **Esc** cerrar, **F1** fps. En el celular: tocar = clic; los mismos botones.

---

## 3. Ciclo de producción

Para cada lote:

1. **Abrir válvula** (`a`): el tanque pasa a `Llenando` (2,5 s de llenado).
2. **Iniciar pasteurización** (`p`): exige leche + tanque + vapor + cupo
   (AND-join). Si falta vapor, el botón está rojo y explica qué falta.
3. **Fin de pasteurización** (`f`, no controlable): a los 8 s el lote pasa a
   `Enfriando`; el vapor vuelve a la caldera y el frío queda retenido.
4. **Descargar** (`d`): a los 6 s de enfriamiento, el lote va al cuarto frío;
   se devuelven el frío y el tanque. Si el cuarto está lleno (4/4), el botón
   está rojo.
5. La **embotelladora** toma un lote del cuarto frío cada 4 s y suma +12
   puntos. Puedes detenerla/arrancarla; para arrancar necesita **vapor**.

La meta es **6 lotes** antes de que termine el turno. Mira el contador
`Lotes x/6` y el reloj.

---

## 4. Recursos y tokens

| lugar | qué representa | regla |
|---|---|---|
| `Leche_cruda` | silo | empieza 6/10; llega 1 token cada 15 s; si pasa de 10 hay **desborde** y −10 |
| `Tanque_libre` | tanques disponibles | 3/3; se ocupa al pasteurizar y se libera al descargar |
| `Vapor_disp` | caldera | 1/1; lo comparten pasteurizar y arrancar la embotelladora (**conflicto**) |
| `Frio_disp` | bomba de frío | 1/1; se retiene mientras un lote se enfría |
| `Lote_past` / `Lote_enfr` | lotes en proceso | 0/3; se ven como cajas sobre el tanque |
| `Cuarto_frio` | almacenamiento | 0/4, **estricto**; si está lleno no se puede descargar |
| `Emb_lista` / `Emb_parada` | embotelladora | 1/1; arrancar exige vapor |
| `Botellas` | salida | +1 por lote embotellado |
| `Cupo_frio` | prevención | 4/4 con el monitor ON; 0 si está OFF |

Los tokens físicos viajan con animaciones; los contadores `m/k` están abajo
izquierda. El inspector muestra las matrices y la ecuación de estado.

---

## 5. Fallos y reparación CIP

### 5.1 Provocar el fallo

- **Aleatorio:** cada 18 s, con 30 % de probabilidad, un tanque en `Llenando`
  falla por `contaminacion`.
- **Manual:** en `Llenando`, pulsa el botón naranja
  **`t · Forzar pérdida de temperatura`**. El tanque va a `Fallo` y pierdes
  25 puntos.

### 5.2 Reparar

1. Clic en el tanque en `Fallo` → **`i · Iniciar lavado CIP`**.
2. Se abre la consola. El lenguaje es `P(SE)+AEZ`:
   - **P** preenjuague; **S** soda; **E** enjuague; **A** ácido; **Z**
     sanitizar.
   - Válidas: **`P S E S E A E Z`** y **`P S E A E Z`**.
   - **`P S E A Z` no**: después de **A** falta **E** antes de **Z**.
3. Escribe la secuencia; el DFA avanza (`q0` a `q6`). Si te equivocas, la
   consola dice **“Esperado: …”**.
4. En `q6` pulsa **Validar** o **Enter**: se dispara `CIP_ok` y el tanque
   vuelve a `Vacio`. +20 puntos al primer intento; −8 si la palabra no
   pertenece a \(L\).
5. **Ayuda** muestra la expresión regular y cuesta 5 puntos.
6. **Un solo CIP a la vez:** si otro tanque está en `Lavado_CIP`, el botón
   `i` está rojo con la razón del supervisor; el intento cuesta 15 puntos.

---

## 6. Deadlock: provocarlo y prevenirlo

### 6.1 Provocarlo (con `Cupo: OFF`)

1. Detén la embotelladora (clic en ella o botón **Embot: ON/OFF**).
2. Embotella 4 lotes hasta llenar el **cuarto frío**.
3. Deja un lote en **Pasteurizando** (retiene vapor) y otro en
   **Enfriando** (retiene frío).
4. Intenta seguir: el cuarto frío no acepta el quinto lote, la
   embotelladora no arranca sin vapor y el pasteurizador no termina sin frío.
5. El radar pasa a **amarillo** y luego a **rojo**. Aparece **Game over por
   interbloqueo** con el marcado muerto
   `[0,1,0,0,1,1,4,0,1,0,0]`, la secuencia y la regla.

### 6.2 Prevenirlo

1. Activa **Cupo: ON** antes de llenar el cuarto frío.
2. `Cupo_frio` se consume en `t_iniciar_past` y se devuelve en
   `t_embotellar`; el invariante `Cupo_frio + Lote_past + Lote_enfr +
   Cuarto_frio = 4` hace inalcanzable el deadlock.
3. Números: **146 marcados / 0 deadlocks** con monitor; **160 / 1** sin
   monitor.
4. En el game over puedes **Reintentar desde el último verde**, activar
   **Cupo: ON** y repetir; el radar vuelve a verde.

---

## 7. Inspector y radar

- Pulsa **I**: se pausa la simulación y se abre el inspector.
- Pestañas **Pre**, **Post** y **A**: matrices de 6 × 11.
- **M actual**: el marcado; **Último disparo**: el vector `u_k`.
- La cuenta: `M_k = M_{k−1} + A^T·u_k`.
- **Probar disparo**: muestra el marcado resultante sin aplicarlo; si no está
  habilitada, indica qué lugar falta.
- Pestaña **Árbol**: 4 niveles desde el marcado actual, marcados muertos en
  rojo, y el total de marcados desde M0 (146/160).
- Radar: **verde** sin deadlock en 3 disparos, **amarillo** si es alcanzable,
  **rojo** si el marcado actual está muerto.

---

## 8. Puntaje, logros y final

| acción | puntos |
|---|:---:|
| lote embotellado | +12 |
| CIP válido al primer intento | +20 |
| CIP válido posterior | +10 |
| CIP inválido | −8 |
| ayuda de la expresión | −5 |
| desborde del silo | −10 |
| intento bloqueado | −15 |
| fallo de máquina | −25 |
| logro | +15 |
| deadlock evitado (Cupo en amarillo) | +30 |
| game over por deadlock | −100 |

**6 logros:** Primer lote, Línea completa (3 tanques en Llenando /
Pasteurizando / Enfriando), CIP perfecto, Guardián del frío, Sin derrames,
Deadlock evitado.

**Final:** victoria con 6 lotes; si el turno termina con menos, no hay
victoria; el deadlock es derrota. La pantalla de resultados muestra la
producción, fallos, reparaciones, bloqueos, desbordes, deadlocks evitados y
logros.

---

## 9. Cómo explicarlo en la sustentación

### 9.1 Los 3 minutos del modelo

1. **Autómata:** \(G=(Q,\Sigma,\delta,q_0,Q_m)\), 6 estados, 8 eventos,
   determinista; \(q_0=Q_m=\) Vacio. Muestra §5.2 de
   `docs/modelo/automatas.md`.
2. **Palabras:** `apfd`, `axic`, `apfdapfd`, `apfdaxic` aceptadas; `p`,
   `ap`, `apf`, `apfdxt` rechazadas.
3. **Reparación:** `P(SE)+AEZ`; DFA de 7 estados útiles + trampa; válida
   `PSESEAEZ`; inválida `PSAEZ`.
4. **Supervisor CIP:** 216 estados de producto, 16 prohibidos, 200
   supervisados; 10 000 eventos sin dos tanques en CIP.
5. **Red de Petri:** 11 lugares, 6 transiciones; AND-join en
   `t_iniciar_past`; conflicto por vapor; cuarto frío \(k=4\).
6. **Deadlock:** 16 disparos; marcado muerto; `Cupo_frio` con invariante 4;
   146/0 vs. 160/1.

### 9.2 Los 7 minutos de demo

1. Abre el HUD de un tanque y explica el estado iluminado, Γ(q) y los
   botones verde/gris/rojo.
2. Llena, pasteuriza y descarga un lote; muestra los tokens y el cuarto frío.
3. Fuerza un fallo y repara con la consola: primero `P S E A Z` (error y
   “Esperado: E”), luego `P S E A E Z`.
4. Con un tanque en CIP, intenta el CIP de otro: botón rojo y razón.
5. Detén la embotelladora y provoca el deadlock; muestra el radar
   amarillo/rojo y la pantalla de game over.
6. Reintenta, activa **Cupo: ON**, repite y muestra el radar verde.
7. Abre el inspector (`I`): Pre/Post/A, M, u, ecuación y árbol.

### 9.3 Los 5 minutos de preguntas

Cada integrante debe poder explicar **una** de estas funciones y compararla
con JFLAP/PIPE2:

| función | qué explicar |
|---|---|
| `Automata.ejecutar` | usa solo la tabla δ; lanza error si δ no está definida; guarda historial |
| `Lenguaje.avanzar` / `pertenece` | RegExp anclada + DFA; q0..q6; `esperado`; PSESEAEZ vs. PSAEZ |
| `RedPetri.habilitada` / `disparar` | `M ≥ Pre`; capacidad estricta; `M' = M + A^T u` |
| `RedPetri.conflictos` / `esMuerto` | transiciones habilitadas que comparten lugar; ninguna habilitada |
| `cobertura.explorar` | BFS de profundidad 3; nodos/aristas; muertos; radar |
| `composicion.SupervisorCIP` | un solo CIP; 216/16/200; 10 000 eventos |
| `Simulador` | sincroniza `t_iniciar_past → p`, `t_fin_past → f`, `t_fin_enfr → d`; el deadlock |
| `Reloj` / `Aleatorio` | cola de prioridad; semilla fija; reproducibilidad |

**Preguntas típicas:**

- *¿Por qué el Z no entra después de P S E A?* Porque el DFA está en `q4` y
  espera `E`; el lenguaje exige `AEZ`, no `AZ`.
- *¿Por qué 146 y 160?* Con `Cupo_frio` el marcado muerto exigiría
  `Cupo = −2`; el invariante lo bloquea.
- *¿Por qué 216/16/200?* Producto de 3 tanques de 6 estados; 16 estados con
  2+ tanques en CIP; el supervisor los elimina.
- *¿Por qué los fallos en Llenando?* Para que el CIP no retenga
  `Lote_past`, vapor ni frío; la ficha no fija los estados origen.
- *¿Por qué el monitor se puede apagar?* La ficha lo usa para prevenir, pero
  la guía pide provocar el deadlock; el juego empieza OFF y el botón lo
  activa.
- *¿Por qué un DFA de reparación aparte?* La ficha tiene 6 estados y el
  lenguaje 5 símbolos; el DFA valida la palabra y `CIP_ok` devuelve el tanque.
- *¿Qué se probó?* 42 pruebas: palabras, RegExp/DFA, matrices, deadlock,
  invariantes, árbol, supervisor, observador, reloj, flujo y game over.

---

## 10. Qué falta según el PDF (checklist)

| entregable | estado |
|---|---|
| Simulador local (`npm run preview`) | ✅ |
| ZIP `Grupo1_DairyCraft.zip` (37 kB, `index.html` en la raíz) | ✅ construido; ☐ subido al aula |
| `modelos/` `.jff` y `.pnml` | ✅ |
| Capturas JFLAP/PIPE2 en `modelos/capturas/` | ☐ (las toma el equipo; no hay Java en este entorno) |
| `.wmod` de Supremica | opcional (proyecto 1 no lo exige) |
| `.agents/skills/` con las 3 skills | ✅ |
| `docs/GDD.md`, `docs/arte.md`, `docs/modelo/` | ✅ |
| `src/sed/` + JSON + `npm test` | ✅ 42/42 |
| Repositorio GitHub con README e historial | ✅ |
| `PROMPTS.md` con los 17 prompts | ✅ |
| Video de 4 min (HUD, CIP, supervisor, deadlock) | ✅ `docs/video-tutorial.mp4` (3:58, voz y subtítulos) |
| Informe con tablas 5.2/5.9 y postmortem | ✅ borradores; ☐ filas manuales (fps, tableta, playtest, JFLAP/PIPE2) |
| URL pública Vercel | ✅ `https://dairycraft-2-5d.vercel.app/` |
| Prueba en tableta, fps y playtest | ☐ |
| Sustentación de 15 min | ☐ ensayar con este tutorial |

**Lo más urgente para el docente:** las capturas de **JFLAP/PIPE2** (revisa
las tablas antes de autorizar la Fase 2). Después: el **ZIP en el aula** y las
filas manuales del informe.

---

## 11. Enlaces y comandos

```bash
npm test          # 42/42
npm run build     # dist/ (148 kB)
npm run preview   # http://localhost:4173
npm run modelos   # regenera .jff y .pnml
```

- Juego local: `http://localhost:5180/`
- Juego publicado: `https://dairycraft-2-5d.vercel.app/`
- GitHub: `https://github.com/Danie041006/dairycraft-2.5d`
- Guía CIP/Petri: `docs/GUIA_CIP_PETRI.md`
- GDD: `docs/GDD.md`
- Pruebas: `docs/pruebas.md`
- Informe: `docs/INFORME.md`
- Postmortem: `docs/POSTMORTEM.md`
- Video: `docs/video-tutorial.mp4` · capítulos en `docs/VIDEO.md`
- Prompts: `PROMPTS.md`
