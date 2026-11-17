# Postmortem

Proyecto **DairyCraft 2.5D** · Fase 1 – Laboratorio 1.
Cada respuesta está escrita para el informe y para la sustentación.

## 1. ¿Qué funcionó bien en el modelo formal, el diseño, el arte y el código?

- **Modelo formal:** empezar por JFLAP/PIPE2 y por un simulador independiente
  permitió descubrir los números reales antes de programar: 160 marcados y 1
  deadlock sin prevención; 146 y 0 con `Cupo_frio`; 216/16/200 en el supervisor
  CIP. El deadlock se entiende con un invariante de 4, no con una explicación
  oral.
- **Diseño:** el GDD cita el elemento formal de cada mecánica. El ciclo
  corto/medio/largo (atender un tanque, completar un lote, terminar el turno)
  dio una progresión clara. El toggle **Cupo** convirtió la regla de
  prevención en una decisión del jugador.
- **Arte:** todo se dibuja en código, sin assets externos; eso mantuvo el ZIP
  liviano, evitó licencias y permitió que la hoja de arte y el juego compartan
  funciones. La paleta de 14 colores y los 6 estados con color e ícono se
  sostuvieron en todas las pantallas.
- **Código:** la separación `src/sed/` (sin Phaser) vs. `src/escenas/` hizo
  que las 42 pruebas se ejecutaran en Node y que la vista se pudiera cambiar
  sin tocar el modelo. El inspector y el radar consumen el mismo núcleo que
  las pruebas.

## 2. ¿Qué diferencias aparecieron entre el modelo y el juego?

| diferencia | decisión | resultado |
|---|---|---|
| La ficha no fija desde qué estados ocurren `contaminacion` y `perdida_temp` | modelarlos en `Llenando` | el fallo no retiene `Lote_past`, vapor ni frío; el CIP es solo del autómata |
| El lenguaje \(P(SE)^+AEZ\) no cabe en los 6 estados de la ficha | DFA de reparación aparte + `CIP_ok` como evento de δ | se conservan los 6 estados y el HUD no se satura; la consola muestra el DFA |
| El monitor `Cupo_frio` de la ficha elimina el deadlock, pero la guía pide provocarlo | botón **Cupo: ON/OFF**; el turno empieza en OFF | se demuestran los dos caminos y el radar pasa por los 3 colores |
| La ficha dice que “forzar sin vapor” lleva a Fallo, pero la red prohíbe `t_iniciar_past` sin vapor | botón **Forzar** que dispara `perdida_temp` (evento de δ) en `Llenando` | no hay `if` de escena; el riesgo tiene costo −25 y CIP |
| El tanque que falla en `Llenando` no había tomado `Tanque_libre` | el juego no asigna tanques en `Fallo`/`Lavado_CIP` | el pool de la red y la disponibilidad física quedan consistentes |
| La embotelladora y el cuarto frío se tapaban en la primera rejilla | se movieron celdas y etiquetas | el cuarto frío queda al frente y la embotelladora visible |
| Los gráficos de Phaser no aceptan filtros glow/bloom | halos concéntricos y flashes manuales | el efecto es estable en WebGL y Canvas |

Ninguna diferencia se resolvió cambiando el modelo sin dejar registro: todas
están en el GDD (§15), en `docs/modelo/` y en este postmortem.

## 3. ¿Qué prompts dieron mejores resultados y cuáles se reescribieron?

**Mejores:** los tres de las skills (diseñador, ingeniero, director de arte),
el del núcleo formal (`automata.js`, `lenguaje.js`, `redPetri.js`,
`cobertura.js`) y el del deadlock/radar. El prompt del núcleo funcionó porque
pedía el formato JSON, las pruebas contra JFLAP/PIPE2 y prohibía Phaser.

**Reescritos:**

- **Consola CIP:** el primer prompt mezclaba la palabra del lenguaje con los
  eventos del tanque. Se reescribió para separar el DFA de reparación (7
  estados útiles) del evento `CIP_ok` y para mostrar `Esperado: …` en la
  consola.
- **HUD de máquina:** hubo que fijar la posición del panel, el tamaño de los
  nodos y la etiqueta de `Lavado_CIP`; el primer layout tapaba la etiqueta con
  el botón.
- **Planta isométrica:** la primera rejilla superponía la embotelladora y el
  cuarto frío; se pidió mover celdas y etiquetas, no cambiar el modelo.

**Lo que decidió el agente sin estar en el modelo ni en el GDD:** los tiempos
de llenado/pasteurización/enfriamiento/embotellado (2,5/8/6/4 s), la
probabilidad de fallo (30 % cada 18 s), el puntaje, el toggle del monitor, el
botón Forzar, el layout de las máquinas y el uso de halos manuales en lugar de
filtros. El equipo los revisó y los aceptó en el GDD; los valores del modelo
(estados, eventos, M0, k) no se cambiaron.

## 4. ¿Qué mecánica hizo más visible la teoría?

1. **HUD del autómata:** el estado iluminado, Γ(q), los botones verdes/grises/
   rojos y el historial hacen visible δ en cada clic.
2. **Consola CIP:** el DFA avanza símbolo a símbolo y la RegExp se muestra solo
   si el jugador paga 5 puntos; es la demostración más directa de la Unidad 2.
3. **Supervisor CIP:** el segundo tanque no puede entrar a `Lavado_CIP`; el
   botón rojo y la razón formal son una demostración de 10 segundos.
4. **Tokens + radar:** el AND-join, el conflicto por vapor y el deadlock
   circular se ven como fichas y como un marcado muerto; el inspector muestra
   la ecuación.
5. **Logros y resultados:** convierten las decisiones en evidencia para el
   informe.

## 5. ¿Qué cambiarían con una semana más? ¿Qué parte de la Fase 2 anticipan?

- Medir fps con GPU real y en tableta; probar el playtest con otro equipo y
  ajustar el balance con esos datos.
- Agregar un modo “sin llegadas” para que el árbol de cobertura coincida
  exactamente con PIPE2 y comparar nodo a nodo.
- Mejorar el arte de los tanques (más volumen, sombras y nivel de líquido con
  máscara) y las transiciones entre escenas.
- Añadir un segundo turno con más dificultad y un ranking local.
- **Fase 2:** los tiempos de operación se pueden modelar con autómatas
  temporizados y los fallos con redes de Petri estocásticas o distributions;
  hoy son timers del GDD y del reloj. El supervisor y el observador ya están
  preparados en `composicion.js` y `observador.js` para extenderse.
