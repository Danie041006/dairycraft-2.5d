# Capturas de JFLAP y PIPE2

Guardar aquí las capturas que el docente revisa antes de autorizar la Fase 2.
Los archivos `.jff` y `.pnml` están en `modelos/automatas/` y
`modelos/petri/`.

## Lista

| archivo | herramienta | qué debe mostrar |
|---|---|---|
| `01_tanque_multiple_run.png` | JFLAP | las 8 palabras de la tabla, 4 aceptadas y 4 rechazadas |
| `02_reparacion_equivalencia.png` | JFLAP | `PSESEAEZ`/`PSEAEZ` aceptadas y `PSAEZ` rechazada, o la equivalencia con la RegExp |
| `03_cip_supervisor.png` | JFLAP | el autómata Libre/Ocupado y, si se hizo, el producto de 2 tanques |
| `04_pipe2_estado_sin.png` | PIPE2 | State Space sin prevención: 160 marcados, 1 deadlock |
| `05_pipe2_deadlock.png` | PIPE2 | el marcado muerto `[0,1,0,0,1,1,4,0,1,0,0]` y la secuencia |
| `06_pipe2_estado_con.png` | PIPE2 | State Space con `Cupo_frio`: 146 marcados, 0 deadlocks |
| `07_pipe2_incidencia.png` | PIPE2 | Pre, Post y A (Incidence & Marking) |
| `08_pipe2_invariantes.png` | PIPE2 | los 6 invariantes P |

## Pasos rápidos

1. Abrir `modelos/petri/dairycraft_sin_prevencion.pnml`; `Animation`;
   disparar los 16 pasos de `docs/modelo/petri.md`; capturar el estado muerto.
2. Abrir `modelos/petri/dairycraft.pnml`; repetir; capturar que la sexta
   `t_iniciar_past` está deshabilitada.
3. `Analysis > State Space Analysis` en ambas variantes.
4. `Analysis > Incidence & Marking` y `Analysis > Invariant Analysis`.
5. Abrir los `.jff`; `Input > Multiple Run`; capturar.

> Si PIPE2 no muestra las capacidades de los lugares al importar el PNML,
> revisar la pestaña de capacidades y fijarlas a mano con los valores de
> `docs/modelo/petri.md`. La semántica de la red no cambia.
