# DairyCraft 2.5D

Simulador isométrico 2.5D de una planta láctea para **Modelado y Simulación de
Sistemas de Eventos Discretos (167413)**, Fase 1 – Laboratorio 1, proyecto 1.

**Equipo:** Deivid Peñaloza · Paula Mendoza · Fabian Garcia · Daniel Castellanos
**Docente:** Ing. Harvey Michael Gamboa Peña

El juego es la interfaz de un modelo formal: 3 tanques con autómata de 6
estados, un lenguaje regular de reparación CIP, un supervisor de un único
circuito CIP y una red de Petri de 11 lugares y 6 transiciones con un lugar
monitor de prevención del deadlock.

## Video tutorial

**3:58 · 1280×720 · voz en español y subtítulos incrustados.** Recorre el
juego, la reparación CIP (`P S E A Z` → **Esperado: E**), el supervisor, la red
de Petri en vivo, el deadlock y la prevención con `Cupo: ON`.

- Release con video y ZIP: https://github.com/Danie041006/dairycraft-2.5d/releases/tag/v1.0.0
- Ver en GitHub: https://github.com/Danie041006/dairycraft-2.5d/blob/main/docs/video-tutorial.mp4
- Archivo: [`docs/video-tutorial.mp4`](docs/video-tutorial.mp4)
- Capítulos y detalles: [`docs/VIDEO.md`](docs/VIDEO.md)
- Juego publicado: https://dairycraft-2-5d.vercel.app/

## Requisitos

- Node.js **24 LTS** (o 22 LTS) y npm.
- Chrome o Edge **115+** con WebGL (para los efectos de Phaser 4).
- Internet para cargar **Phaser 4.2.1** desde jsDelivr (no se instala por npm).
- Opcional: JFLAP 7.1, PIPE2 y Java para abrir los modelos académicos.
- Opcional: tableta o teléfono para probar el táctil.

## Ejecutar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 42 pruebas del núcleo y del simulador
npm run build      # genera dist/
npm run preview    # http://localhost:4173
npm run modelos    # regenera modelos/*.jff y modelos/petri/*.pnml
```

> En este entorno **arm64** el transformador de esbuild 0.28.2 se queda
> colgado al minificar; por eso `vite.config.js` usa `target: 'esnext'` y
> `minify: false`. El bundle queda en ~148 kB (37 kB gzip) y el ZIP sigue
> muy por debajo de 25 MB. Si `npm run dev` se queda cargando, usa
> `npm run build && npm run preview`, que sirve el build ya compilado.

Para la hoja de arte:

```bash
npx serve .
# abrir http://localhost:3000/hoja-arte.html
```

## Controles

| acción | mouse / teclado | táctil |
|---|---|---|
| abrir el HUD de un tanque | clic en el tanque | tocar |
| disparar un evento | clic en el botón del HUD | tocar |
| consola CIP | teclas P, S, E, A, Z + Enter | botones + Validar |
| pausa | `P` | botón Pausa |
| inspector | `I` | botón Inspector |
| velocidad | `1`, `2`, `4` | botones 1×, 2×, 4× |
| cerrar panel | `Esc` | botón × |
| fps y tiempo | `F1` | — |
| cámara | arrastre + rueda | arrastre + pinza |
| detener / arrancar embotelladora | clic en la embotelladora | tocar |
| prevención | botón **Cupo** | botón **Cupo** |

## El modelo en una página

### Autómata del tanque (×3)

```
Vacio --a--> Llenando --p--> Pasteurizando --f--> Enfriando --d--> Vacio
Llenando --x,t--> Fallo --i--> Lavado_CIP --c--> Vacio
```

- q0 = Qm = Vacio; 6 estados; 8 transiciones; determinista.
- Σc = {a, p, d, i}; Σuc = {f, x, t, c}; Σuo = ∅.
- 4 palabras aceptadas: `apfd`, `axic`, `apfdapfd`, `apfdaxic`; 4 rechazadas:
  `p`, `ap`, `apf`, `apfdxt`.

### Reparación CIP

- \(L = \mathcal{L}(P(SE)^+AEZ)\); válida `PSESEAEZ`; inválida `PSAEZ`.
- DFA de 7 estados útiles + trampa; RegExp y DFA coinciden en 20 palabras.

### Red de Petri

- 11 lugares, 6 transiciones; M0 = `[6,3,1,1,0,0,0,1,0,0,4]`.
- AND-join en `t_iniciar_past`; conflicto por `Vapor_disp`; `Cuarto_frio` k = 4.
- Sin `Cupo_frio`: **160** marcados, **1** deadlock.
- Con `Cupo_frio`: **146** marcados, **0** deadlocks.
- Marcado muerto: `[0,1,0,0,1,1,4,0,1,0,0]`; secuencia de 16 disparos.
- Invariante de prevención:
  `Cupo_frio + Lote_past + Lote_enfr + Cuarto_frio = 4`.

### Supervisor CIP

- 216 estados de producto; 16 prohibidos; 200 supervisados.
- 10 000 eventos aleatorios sin dos tanques en `Lavado_CIP`.

## Estructura

```
.agents/skills/           las 3 habilidades del proyecto
docs/                     GDD, arte, modelo formal, pruebas, informe, postmortem
docs/capturas/            capturas del juego
hoja-arte.html            hoja de arte interactiva (Phaser 4 CDN)
modelos/                  .jff de JFLAP y .pnml de PIPE2
referencias/              referencias de estilo y herramientas
scripts/generar-modelos.mjs
src/config.js             constantes del GDD
src/iso/proyeccion.js     proyección 2:1 y profundidad
src/arte/                 paleta y dibujos originales
src/entrada/              mouse, teclado y táctil → mismas acciones
src/sed/                  NÚCLEO FORMAL sin Phaser ni DOM
src/juego/simulador.js    orquesta el modelo y el reloj
src/escenas/              Arranque, Titulo, Planta, HUDJuego, HUDMaquina,
                          Inspector, Resultados
test/                     42 pruebas con node --test
```

## Documentación

| documento | contenido |
|---|---|
| `docs/TUTORIAL.md` | cómo jugar, cómo explicarlo en la sustentación y checklist del PDF |
| `docs/GUIA_CIP_PETRI.md` | CIP paso a paso y red de Petri explicada |
| `docs/GDD.md` | concepto, MDA, reglas, HUD, puntaje, logros, criterios |
| `docs/modelo/automatas.md` | δ, eventos, palabras, DFA, supervisor |
| `docs/modelo/petri.md` | lugares, transiciones, matrices, invariantes, deadlock |
| `docs/arte.md` | paleta, íconos, tokens, HUD, efectos |
| `docs/pruebas.md` | tablas 5.2 y 5.9 |
| `docs/INFORME.md` | informe del laboratorio |
| `docs/POSTMORTEM.md` | postmortem |
| `docs/VIDEO.md` | video tutorial publicado, capítulos y detalles de producción |
| `docs/video-tutorial.mp4` | video de 3:58 con voz y subtítulos |
| `docs/petri.svg` | diagrama de la red de Petri (fuente en `docs/petri.dot`) |
| `PROMPTS.md` | 17 prompts, resultados y correcciones |
| `modelos/README.md` | cómo abrir y verificar en JFLAP/PIPE2 |

## Pruebas

```
npm test
ℹ tests 42 · pass 42 · fail 0
```

Cubren δ, palabras, RegExp/DFA, matrices y ecuación de estado, deadlock,
146/160 marcados, invariantes en 1000 disparos, árbol con ω, composición
216/16/200, 10 000 eventos del supervisor, observador, reloj, flujo del
simulador, game over y reintento.

## Build y entrega

```bash
npm run build
# seleccionar el contenido de dist/ (index.html + assets/) en
# Grupo1_DairyCraft.zip, con index.html en la raíz, y subirlo al aula virtual.
```

- `vite.config.js` usa `base: './'` y excluye `phaser` del bundle.
- `index.html` carga Phaser 4.2.1 por CDN y monta `#game-container`.
- `src/sed/` no menciona Phaser ni el DOM.
- El ZIP debe pesar menos de 25 MB; el bundle es de ~37 kB gzip + Phaser por
  CDN.

## Video

El video tutorial está publicado en
[`docs/video-tutorial.mp4`](docs/video-tutorial.mp4) (3:58, 1280×720, voz en
español y subtítulos). Los capítulos, el guion y la explicación de cómo se
produjo están en [`docs/VIDEO.md`](docs/VIDEO.md).

## Estado

- Modelo formal verificado: ✅ (42/42 pruebas; 146/160; 216/16/200).
- Build y preview sin errores en Chromium WebGL: ✅.
- Capturas del juego: ✅ en `docs/capturas/`.
- Pendiente: capturas de JFLAP/PIPE2, fps en el equipo, prueba con tableta y
  playtest con otro equipo (celdas ☐ de `docs/pruebas.md`).
- Video tutorial: ✅ publicado en `docs/video-tutorial.mp4` y enlazado en
  GitHub; capítulos en `docs/VIDEO.md`.
- Sustentación de 15 min: ☐ ensayar con `docs/TUTORIAL.md`.

## Licencia y originalidad

Código y arte originales del equipo. No se usan sprites, personajes, mapas ni
música de juegos comerciales. Phaser 4.2.1 es MIT y se carga por CDN. La
bibliografía está en `referencias/README.md`.
