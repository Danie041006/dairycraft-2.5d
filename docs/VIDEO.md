# Guion del video · máximo 4 minutos

> **Grabación base:** `docs/video-demo.mp4` (30 s, 960×540, sin narración).
> Muestra el HUD, el CIP, el supervisor, el deadlock, el reintento con
> **Cupo: ON** y el inspector. El equipo puede grabar la voz sobre esta base
> o repetir el guion completo con narración.

Objetivo: mostrar el HUD del autómata, una reparación por expresión regular,
el supervisor CIP y un deadlock provocado y luego prevenido en el radar.
Grabar la pantalla del simulador a 1280 × 720 o 1920 × 1080, con el navegador
en pantalla completa y el juego a velocidad ×2 o ×4.

| tiempo | plano | qué se hace | qué se dice |
|---|---|---|---|
| 0:00–0:15 | Título | “Iniciar turno”; la planta isométrica | “DairyCraft 2.5D: una planta láctea donde cada máquina obedece un autómata y cada recurso una red de Petri.” |
| 0:15–0:40 | Planta | Abrir válvula del Tanque 1; esperar el llenado; mostrar los tokens del HUD | “Tres tanques comparten caldera, frío, embotelladora y cuarto frío. El silo empieza con 6 tokens y llega leche cada 15 segundos.” |
| 0:40–1:20 | HUD del Tanque 1 | Clic en el tanque; señalar el nodo iluminado, Γ(q), el botón rojo si falta vapor, el historial | “El grafo es el mismo de JFLAP. El estado actual se ilumina; los botones verdes son controlables, los grises no controlables y los rojos los deshabilita el supervisor o la red.” |
| 1:20–1:35 | HUD | Iniciar pasteurización; mostrar `Lote_past`, `Vapor_disp = 0`; al terminar, `Lote_enfr` | “`t_iniciar_past` es un AND-join: leche, tanque, vapor y cupo. El vapor queda retenido hasta `t_fin_past`.” |
| 1:35–2:10 | CIP | Provocar un fallo con **Forzar** en un tanque en Llenando; **Iniciar CIP**; escribir `PSAEZ` (inválida) y luego `PSESEAEZ` (válida) | “La consola valida el lenguaje P(SE)+AEZ. PSAEZ falla porque falta el enjuague después de la soda; PSESEAEZ repara y dispara CIP_ok.” |
| 2:10–2:35 | Supervisor | Con el Tanque 1 en CIP, abrir el Tanque 2 en Fallo e intentar **Iniciar CIP**; mostrar el botón rojo y la razón | “Hay un solo circuito CIP: el supervisor deshabilita iniciar_CIP en los demás tanques. En la prueba de 10 000 eventos nunca hay dos tanques en CIP.” |
| 2:35–3:10 | Embotelladora / cuarto frío | Detener la embotelladora; embotellar 4 lotes; dejar un lote en pasteurización y otro en enfriamiento | “El cuarto frío es estricto: 4 lotes. La embotelladora detenida necesita vapor para arrancar; el vapor y el frío están retenidos.” |
| 3:10–3:35 | Radar / game over | Mostrar el radar en **amarillo** y luego **rojo**; aparece “Game over por interbloqueo” con el marcado y la secuencia | “El radar mira tres disparos hacia adelante. El marcado muerto es `[0,1,0,0,1,1,4,0,1,0,0]`: espera circular entre vapor, frío y cuarto frío.” |
| 3:35–3:50 | Reintento | **Reintentar desde el último verde**; activar **Cupo: ON**; repetir la operación; el radar vuelve a verde | “Cupo_frio consume en t_iniciar_past y devuelve en t_embotellar; el invariante limita el circuito a 4 lotes y el deadlock es inalcanzable.” |
| 3:50–4:00 | Inspector / cierre | Abrir el inspector (`I`); mostrar Pre, M y la ecuación; volver a la planta | “El inspector muestra M_k = M_{k-1} + A^T u_k. Modelo verificado, juego probado: 42 pruebas en Node y build sin errores.” |

## Lista de tomas

1. `01_titulo.png` — pantalla de título con los controles.
2. `02_planta.png` — planta con los 3 tanques en estados distintos.
3. `03_hud.png` — HUD con el autómata y los botones de colores.
4. `04_cip_valida.png` — consola con PSESEAEZ y el DFA en q6.
5. `05_cip_invalida.png` — consola con PSAEZ y el error.
6. `06_supervisor.png` — botón rojo del segundo CIP y razón.
7. `07_tokens.png` — inspector con Pre/Post/A y M.
8. `08_radar_amarillo.png`, `09_radar_rojo.png`, `10_radar_verde.png`.
9. `11_resultados.png` — game over y prevención.

## Consejos de grabación

- Grabar a ×4 para que el turno quepa; bajar a ×1 en la explicación del HUD.
- Usar el micrófono del equipo o una voz en off; no usar música con derechos.
- Cerrar notificaciones y dejar el navegador en 960 × 540 o 1280 × 720.
- Ensayar la secuencia del deadlock: 4 lotes en el cuarto, embotelladora
  detenida, un lote en pasteurización y otro en enfriamiento.
- Si el deadlock no aparece en el primer intento, reiniciar con **Jugar otro
  turno** y repetir; el radar debe estar en amarillo antes de detener la
  embotelladora.
