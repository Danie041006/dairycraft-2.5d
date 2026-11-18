# Capturas de JFLAP y PIPE2

Guía para tomar las 8 capturas que el docente revisa antes de autorizar la
Fase 2. Los archivos `.jff` y `.pnml` ya están generados en
`modelos/automatas/` y `modelos/petri/`; no hay que construirlos a mano.

## 1. Qué se entrega

Guardar los PNG en esta carpeta, con estos nombres exactos:

| archivo | herramienta | qué debe mostrar |
|---|---|---|
| `01_tanque_multiple_run.png` | JFLAP | `Input > Multiple Run` con las 8 palabras: 4 aceptadas y 4 rechazadas |
| `02_reparacion_equivalencia.png` | JFLAP | `PSESEAEZ` y `PSEAEZ` aceptadas; `PSAEZ`, `PSEA` y `PSEEZ` rechazadas, o la equivalencia con `P(SE)(SE)*AEZ` |
| `03_cip_supervisor.png` | JFLAP | el autómata `Libre --iniciar_CIP--> Ocupado --CIP_ok--> Libre`; opcional: producto de 2 tanques |
| `04_pipe2_estado_sin.png` | PIPE2 | State Space / Reachability de `dairycraft_sin_prevencion.pnml`: **160 marcados, 1 deadlock** |
| `05_pipe2_deadlock.png` | PIPE2 | el marcado muerto y la secuencia de 16 disparos en la variante sin prevención |
| `06_pipe2_estado_con.png` | PIPE2 | State Space de `dairycraft.pnml`: **146 marcados, 0 deadlocks** y la 5.ª `t_iniciar_past` deshabilitada (disparo 12) |
| `07_pipe2_incidencia.png` | PIPE2 | `Incidence & Marking`: Pre, Post, A y M0 |
| `08_pipe2_invariantes.png` | PIPE2 | `Invariant Analysis`: los 6 invariantes P |

> **No** se necesitan capturas de la composición de 216/16/200 en JFLAP: ese
> número se calcula con `src/sed/composicion.js` y sus pruebas. En JFLAP basta
> con mostrar el supervisor de 2 estados y, si quieren, el producto de 2
> tanques como ilustración.

## 2. Antes de empezar

1. Instalar **Java** (Temurin/Adoptium 17 o el JRE que pida JFLAP).
2. Descargar **JFLAP 7.1** y **PIPE2**; abrirlos con doble clic o
   `java -jar JFLAP.jar` / `java -jar PIPE2.jar`.
3. Abrir los archivos desde la carpeta del repositorio, no desde una copia
   suelta, para que el título de la ventana muestre el nombre correcto.
4. Usar la herramienta de recortes de Windows (`Win + Shift + S`) o
   `Alt + Impr Pant`; guardar como **PNG**. No usar fotos del celular.
5. Capturar la ventana completa, incluida la barra de título, el menú y la
   tabla/resultado. El docente debe poder ver qué archivo y qué operación se
   ejecutó.

## 3. JFLAP

### 3.1 `tanque.jff` → `01_tanque_multiple_run.png`

1. `File > Open` → `modelos/automatas/tanque.jff`.
2. Verificar: 6 estados, `Vacio` es inicial y final (doble círculo), 8
   transiciones.
3. `Test > Highlight Nondeterminism`: no debe marcar nada (es determinista).
4. `Input > Multiple Run`, cargar una palabra por línea:

```
apfd
axic
apfdapfd
apfdaxic
p
ap
apf
apfdxt
```

5. Pulsar **Run Inputs**. Resultado esperado:

| palabra | resultado |
|---|---|
| `apfd` | aceptada |
| `axic` | aceptada |
| `apfdapfd` | aceptada |
| `apfdaxic` | aceptada |
| `p` | rechazada |
| `ap` | rechazada |
| `apf` | rechazada |
| `apfdxt` | rechazada |

6. Capturar la ventana de `Multiple Run` con las 8 filas visibles.

### 3.2 `reparacion.jff` → `02_reparacion_equivalencia.png`

1. `File > Open` → `modelos/automatas/reparacion.jff`.
2. Verificar: `q0` inicial, `q6` final; 8 estados en JFLAP (7 útiles + trampa).
3. `Input > Multiple Run` con:

```
PSESEAEZ
PSEAEZ
PSAEZ
PSEA
PSEEZ
```

4. Resultado esperado: `PSESEAEZ` y `PSEAEZ` aceptadas; `PSAEZ`, `PSEA` y
   `PSEEZ` rechazadas.
5. Opcional para la misma captura o una segunda: `Test > Compare Equivalence`
   contra la expresión `P(SE)(SE)*AEZ`. En JFLAP `+` es **unión**, no “una o
   más veces”: escribir `P(SE)+AEZ` daría otro lenguaje. La cadena vacía es `!`.
6. Capturar la tabla de `Multiple Run` o el diálogo de equivalencia.

### 3.3 `cip_supervisor.jff` → `03_cip_supervisor.png`

1. `File > Open` → `modelos/automatas/cip_supervisor.jff`.
2. Verificar: `Libre` inicial/final; `Libre --iniciar_CIP--> Ocupado` y
   `Ocupado --CIP_ok--> Libre`.
3. Capturar el grafo completo.
4. Opcional: construir el producto de 2 tanques para mostrar la idea; si se
   hace, guardar como `03b_cip_producto2.png` y mencionarlo en el informe.

## 4. PIPE2

### 4.1 Preparación y capacidades

> **PIPE 4.3.0 no lee el PNML estándar** (las pestañas abren vacías). Las capturas
> se tomaron con las versiones en formato PIPE que están en `modelos/petri/`
> (`1_dairycraft_SIN_prevencion.xml`, `2_dairycraft_CON_prevencion.xml`); es
> la misma red. Los archivos `respaldo_*.xml` reemplazan la capacidad del cuarto
> frío por el lugar complementario `Cuarto_libre`, por si otra versión de PIPE
> ignora capacidades.

1. `File > Open` → `modelos/petri/dairycraft_sin_prevencion.pnml` (10
   lugares, sin `Cupo_frio`) y `dairycraft.pnml` (11 lugares, con
   `Cupo_frio`).
2. Si PIPE2 no muestra las capacidades al importar, abrir las propiedades de
   cada lugar y fijarlas a mano:

| lugar | k |
|---|:---:|
| `Leche_cruda` | 10 |
| `Tanque_libre` | 3 |
| `Vapor_disp` | 1 |
| `Frio_disp` | 1 |
| `Lote_past` | 3 |
| `Lote_enfr` | 3 |
| `Cuarto_frio` | 4 |
| `Emb_lista` | 1 |
| `Emb_parada` | 1 |
| `Botellas` | 999 (sin límite práctico) |
| `Cupo_frio` | 4 |

3. Confirmar M0:
   - sin prevención: `[6,3,1,1,0,0,0,1,0,0]` (10 lugares);
   - con prevención: `[6,3,1,1,0,0,0,1,0,0,4]` (11 lugares).

### 4.2 Secuencia del deadlock (16 disparos)

En la variante **sin prevención**, disparar en este orden:

```
t_iniciar_past → t_fin_past → t_iniciar_past → t_fin_enfr →
t_fin_past → t_iniciar_past → t_fin_enfr → t_fin_past →
t_iniciar_past → t_fin_enfr → t_fin_past → t_iniciar_past →
t_fin_enfr → t_fin_past → t_iniciar_past → t_parar_emb
```

Al final deben quedar:

- `Leche_cruda = 0`, `Tanque_libre = 1`, `Vapor_disp = 0`, `Frio_disp = 0`;
- `Lote_past = 1`, `Lote_enfr = 1`, `Cuarto_frio = 4`;
- `Emb_lista = 0`, `Emb_parada = 1`, `Botellas = 0`.

En el PNML de 10 lugares el vector es
`[0,1,0,0,1,1,4,0,1,0]`; en el modelo de 11 lugares con `Cupo = 0` se escribe
`[0,1,0,0,1,1,4,0,1,0,0]`. **Las dos formas son correctas**; la diferencia es
que la primera no dibuja `Cupo_frio`. No se debe intentar “cuadrar” un vector
de 11 valores en el PNML de 10 lugares.

### 4.3 `04_pipe2_estado_sin.png`

1. **Salir del modo animación** antes de analizar: con *Use current net*, PIPE
   analiza el marcado actual; si se queda en el marcado muerto, el grafo sale
   con un solo estado.
2. `State Space Analysis`: *Deadlock: true* y la ruta más corta de 16
   disparos que termina en `t_parar_emb`.
3. `Reachability/Coverability Graph`: *There are 160 states with 355 arcs*.
   State Space no muestra el número de marcados; ese dato sale de este módulo.
4. PIPE no deja ambas ventanas abiertas a la vez: la captura 04 une las dos
   ventanas lado a lado, sin modificarlas.

### 4.4 `05_pipe2_deadlock.png`

1. En `Animation`, después de la secuencia de 16 disparos, comprobar que
   **ninguna transición está habilitada**.
2. Capturar los tokens de todos los lugares y el marcado muerto. Si la
   ventana muestra la lista de marcados, seleccionar el muerto para que se
   vea resaltado.

### 4.5 `06_pipe2_estado_con.png`

1. Abrir `dairycraft.pnml` (11 lugares, `Cupo_frio = 4`).
2. Repetir la secuencia. En el **disparo 12**, que es la **5.ª**
   `t_iniciar_past`, el monitor `Cupo_frio` (ya en 0 tras 4 pasteurizaciones)
   la deshabilita; no se alcanza el deadlock.
3. Fuera del modo animación: `State Space Analysis` → *Deadlock: false*;
   `Reachability/Coverability Graph` → *146 states with 321 arcs*.
4. Capturar el estado con la transición deshabilitada y el resumen 146/0.

### 4.6 `07_pipe2_incidencia.png`

1. `Analysis > Incidence & Marking`.
2. Comprobar las matrices Pre, Post, A y M0 contra
   `docs/modelo/petri.md` §3.
3. Capturar la ventana con las matrices completas (6 × 11 con prevención, o
   6 × 10 sin prevención; indicar cuál se usó).

### 4.7 `08_pipe2_invariantes.png`

1. `Analysis > Invariant Analysis`.
2. Deben aparecer los **6 invariantes P** de la tabla de
   `docs/modelo/petri.md`.
3. Capturar la lista completa.

## 5. Checklist antes de entregar

- [x] `01_tanque_multiple_run.png` con 4 aceptadas y 4 rechazadas.
- [x] `02_reparacion_equivalencia.png` con `PSESEAEZ`/`PSEAEZ` aceptadas y
      `PSAEZ` rechazada.
- [x] `03_cip_supervisor.png` con `Libre`/`Ocupado`.
- [x] `04_pipe2_estado_sin.png` con **160 / 1**.
- [x] `05_pipe2_deadlock.png` con el marcado muerto y la secuencia.
- [x] `06_pipe2_estado_con.png` con **146 / 0**.
- [x] `07_pipe2_incidencia.png` con Pre/Post/A y M0.
- [x] `08_pipe2_invariantes.png` con los 6 invariantes.
- [x] Los PNG están en `modelos/capturas/` y se ven nítidos.
- [x] El título de la ventana o el nombre del archivo se lee en la captura.
- [x] Las tablas de `docs/pruebas.md` se actualizaron de Pendiente a Listo.
- [x] Las capturas se enlazaron en `docs/INFORME.md`.

## 6. Cómo integrarlas al informe y al repositorio

1. Copiar los 8 PNG a `modelos/capturas/`.
2. En `docs/pruebas.md`, cambiar las celdas Pendiente de JFLAP/PIPE2 por Listo y agregar
   el nombre del archivo en la columna de evidencia.
3. En `docs/INFORME.md`, agregar una tabla:

```markdown
| captura | evidencia |
|---|---|
| `modelos/capturas/01_tanque_multiple_run.png` | 8 palabras del autómata |
| `modelos/capturas/02_reparacion_equivalencia.png` | DFA CIP y RegExp |
| `modelos/capturas/03_cip_supervisor.png` | supervisor Libre/Ocupado |
| `modelos/capturas/04_pipe2_estado_sin.png` | 160 marcados, 1 deadlock |
| `modelos/capturas/05_pipe2_deadlock.png` | marcado muerto |
| `modelos/capturas/06_pipe2_estado_con.png` | 146 marcados, 0 deadlocks |
| `modelos/capturas/07_pipe2_incidencia.png` | Pre/Post/A y M0 |
| `modelos/capturas/08_pipe2_invariantes.png` | 6 invariantes P |
```

4. Confirmar que los nombres coinciden exactamente con la tabla de la sección 1.
5. Hacer commit y push:

```bash
git add modelos/capturas/*.png docs/pruebas.md docs/INFORME.md
git commit -m "Capturas de JFLAP y PIPE2"
git push origin main
```

Si alguna captura no coincide con los números esperados, no se debe inventar
ni recortar: primero revisar capacidades, M0 y la secuencia de disparos, y
anotar la diferencia en el informe.
