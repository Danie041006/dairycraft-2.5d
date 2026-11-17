# Video tutorial · DairyCraft 2.5D

**Duración:** 3:58 · **Formato:** MP4 1280×720 · H.264 + AAC · **Voz:**
español (es-CO) · **Subtítulos:** incrustados en el video.

El video muestra el juego y la red de Petri al mismo tiempo: a la izquierda el
simulador, a la derecha el capítulo, el marcado en vivo y los badges de
`Cupo` y del radar.

- **Archivo en el repositorio:** [`docs/video-tutorial.mp4`](video-tutorial.mp4)
- **Ver en GitHub:** https://github.com/Danie041006/dairycraft-2.5d/blob/main/docs/video-tutorial.mp4
- **Descarga directa:** https://raw.githubusercontent.com/Danie041006/dairycraft-2.5d/main/docs/video-tutorial.mp4
- **Juego publicado:** https://dairycraft-2-5d.vercel.app/
- **Guía escrita:** [`docs/TUTORIAL.md`](TUTORIAL.md) y
  [`docs/GUIA_CIP_PETRI.md`](GUIA_CIP_PETRI.md)

## Capítulos

| tiempo | capítulo | qué muestra |
|---|---|---|
| 0:00 | Intro | título, objetivo y los tres pilares: autómatas, red de Petri y supervisor |
| 0:19 | La planta | tres tanques, caldera, frío, embotelladora y cuarto frío \(k=4\) |
| 0:39 | Autómata | HUD del Tanque 1, δ en vivo y ciclo completo: llenar, pasteurizar, enfriar y descargar |
| 1:03 | CIP: error | fallo forzado, consola CIP y `P S E A Z` → **“Esperado: E”** |
| 1:28 | CIP: válido | `P S E S E A E Z`, DFA en `q6`, `CIP_ok` y tanque en `Vacío` |
| 1:44 | Supervisor | segundo CIP bloqueado en rojo: un solo circuito a la vez |
| 2:03 | Red de Petri | diagrama con 11 lugares y 6 transiciones; marcado y transiciones habilitadas en vivo |
| 2:33 | Inspector | matrices Pre/Post/A, ecuación \(M_k = M_{k-1} + A^T u_k\) y árbol de cobertura |
| 2:52 | Deadlock | `Cupo: OFF`, cuarto frío 4/4, radar rojo y **Game over por interbloqueo** |
| 3:17 | Prevención | reintento, `Cupo: ON`, radar verde e invariante \(Cupo + Lote_{past} + Lote_{enfr} + Cuarto = 4\) |
| 3:42 | Cierre | 42/42 pruebas, 146/0 con monitor, 216/16/200 del supervisor y enlaces |

## Qué se explica

1. **El juego como interfaz del modelo.** Cada máquina es un autómata de 6
   estados y 8 eventos; cada recurso es un lugar de la red.
2. **La reparación CIP.** El lenguaje \(P(SE)^+AEZ\) se valida con la RegExp y
   el DFA. La palabra `P S E A Z` no pertenece a \(L\): en `q4` la única
   transición es `E`, y la consola lo dice con **“Esperado: E”**.
3. **El supervisor.** `SupervisorCIP` compone los tres tanques y elimina los
   16 estados con dos o más tanques en `Lavado_CIP`.
4. **La red de Petri.** `t_iniciar_past` es un AND-join; el vapor es el
   conflicto entre pasteurizar y arrancar la embotelladora; el cuarto frío es
   estricto \(k=4\).
5. **El deadlock y su prevención.** Sin monitor: 160 marcados y 1 deadlock.
   Con `Cupo_frio`: 146 marcados y 0 deadlocks.

## Cómo se produjo

- La página [`docs/tutorial-video.html`](tutorial-video.html) monta el juego en
  un iframe, el panel de capítulos y el marcado en vivo.
- El diagrama de la red se genera con Graphviz desde
  [`docs/petri.dot`](petri.dot) y se guarda como [`docs/petri.svg`](petri.svg).
- La grabación se hizo con Playwright a 1280×720 y 25 fps; la página de
  montaje es `docs/tutorial-video.html` y la secuencia de capítulos es la de
  este documento.
- La voz se generó con Edge TTS (`es-CO-SalomeNeural`, +10 %) y se mezcló con
  `ffmpeg`; el audio se normalizó a −16 LUFS.
- Los cortes siguen el guion de `docs/TUTORIAL.md`; el video no usa música ni
  material de terceros.

## Guion de referencia

El guion inicial de 4 minutos está en el historial del repositorio. La versión
publicada conserva el orden: intro → planta → autómata → CIP inválido → CIP
válido → supervisor → red de Petri → inspector → deadlock → prevención →
cierre. Si el equipo necesita regrabar, puede usar los textos de
[`docs/TUTORIAL.md`](TUTORIAL.md) y la página `docs/tutorial-video.html`.
