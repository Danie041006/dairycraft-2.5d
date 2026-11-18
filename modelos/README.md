# Modelos académicos

Archivos que el equipo abre en **JFLAP 7.1** y **PIPE2** para verificar y
capturar. Los genera `npm run modelos` a partir de los JSON del núcleo.

```
modelos/
  automatas/
    tanque.jff              6 estados, 8 transiciones, q0 = Qm = Vacio
    reparacion.jff          8 estados (7 útiles + trampa), 40 transiciones
    cip_supervisor.jff      2 estados (Libre/Ocupado)
  petri/
    dairycraft.pnml         11 lugares, 6 transiciones, con Cupo_frio
    dairycraft_sin_prevencion.pnml  10 lugares, sin Cupo_frio
  capturas/                 capturas de JFLAP y PIPE2 (las toma el equipo)
```

## 1. JFLAP

### 1.1 Tanque

1. Abrir `tanque.jff`.
2. `Test > Highlight Nondeterminism`: no debe marcar ningún estado.
3. `Input > Multiple Run`; cargar:
   - aceptadas: `apfd`, `axic`, `apfdapfd`, `apfdaxic`;
   - rechazadas: `p`, `ap`, `apf`, `apfdxt`.
4. Las 4 primeras terminan en `Vacio` (doble círculo); las 4 últimas se
   rechazan.
5. Captura: `capturas/01_tanque_multiple_run.png`.

### 1.2 Reparación CIP

1. Abrir `reparacion.jff`; el estado inicial es `q0` y el final `q6`.
2. `Input > Multiple Run`: `PSESEAEZ` y `PSEAEZ` aceptan; `PSAEZ`, `PSEA`,
   `PSEEZ` rechazan.
3. `Test > Compare Equivalence` contra la expresión `P(SE)(SE)*AEZ` (en JFLAP
   `+` es unión, no “una o más veces”; la cadena vacía es `!`).
4. `Convert > Minimize DFA`: el DFA con trampa conserva 8 estados; los 7
   útiles son los del lenguaje.
5. Captura: `capturas/02_reparacion_equivalencia.png`.

### 1.3 Supervisor CIP

1. Abrir `cip_supervisor.jff`; `Libre --iniciar_CIP--> Ocupado`,
   `Ocupado --CIP_ok--> Libre`.
2. La composición concreta de los 3 tanques se calcula con
   `src/sed/composicion.js` (216/16/200); en JFLAP se puede construir el
   producto de 2 tanques para mostrar la idea.
3. Captura: `capturas/03_cip_supervisor.png`.

## 2. PIPE2

### 2.1 Deadlock sin prevención

1. Abrir `petri/1_dairycraft_SIN_prevencion.xml` (PIPE 4.3.0 abre vacío el
   `.pnml` estándar; por eso se usa la versión `.xml`).
2. `Animation`: disparar la secuencia de 16 transiciones de
   `docs/modelo/petri.md` §5.
3. Comprobar el marcado muerto `[0,1,0,0,1,1,4,0,1,0]` (10 lugares) y que
   ninguna transición esté habilitada.
4. Fuera del modo animación: `State Space Analysis` → deadlock y ruta de 16
   disparos; `Reachability/Coverability Graph` → 160 estados.
5. Capturas: `capturas/04_pipe2_estado_sin.png` y
   `capturas/05_pipe2_deadlock.png`.

### 2.2 Prevención

1. Abrir `petri/2_dairycraft_CON_prevencion.xml`.
2. Repetir la secuencia. En el disparo 12 (la 5.ª `t_iniciar_past`),
   `Cupo_frio` la deshabilita; no se alcanza el deadlock.
3. Fuera del modo animación: State Space sin deadlock; Reachability 146 estados.
4. Capturas: `capturas/06_pipe2_estado_con.png`.

### 2.3 Incidencia e invariantes

1. `Analysis > Incidence & Marking`: Pre, Post y A; comprobar las matrices de
   `docs/modelo/petri.md` y M0.
2. `Analysis > Invariant Analysis`: los 6 invariantes P.
3. Capturas: `capturas/07_pipe2_incidencia.png` y
   `capturas/08_pipe2_invariantes.png`.

## 3. Correspondencia juego ↔ modelo

| modelo | juego |
|---|---|
| `tanque.jff` | `src/sed/modelos/tanque.json`, HUD del tanque |
| `reparacion.jff` | `src/sed/modelos/reparacion.json`, consola CIP |
| `cip_supervisor.jff` | `SupervisorCIP`, botón `i` rojo |
| `dairycraft.pnml` | `src/sed/modelos/dairycraft.json`, monitor ON |
| `dairycraft_sin_prevencion.pnml` | monitor OFF (botón **Cupo**) |

## 4. Nota

Las capturas de JFLAP/PIPE2 no se pudieron generar en el entorno de
desarrollo (no hay Java instalado). El equipo debe abrir los archivos en su
computador, verificar los resultados de las tablas y guardar las imágenes en
`capturas/` antes de la sustentación. Los archivos ya son válidos y se
regeneran con `npm run modelos`.
