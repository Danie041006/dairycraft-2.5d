# Modelo formal · Red de Petri (Unidad 3)

Red de la ficha D.1, con el lugar monitor `Cupo_frio` de la regla de
prevención. Archivos: `modelos/petri/dairycraft.pnml` (con prevención) y
`modelos/petri/dairycraft_sin_prevencion.pnml` (para provocar el deadlock).

\[
N = (P, T, Pre, Post, M_0), \quad A = Post - Pre, \quad M_k = M_{k-1} + A^T u_k
\]

## 1. Lugares

| id | nombre | M0 | k | capacidad | papel |
|---|---|:---:|:---:|---|---|
| `leche` | Leche_cruda | 6 | 10 | desborde | silo; las llegadas externas agregan tokens |
| `tanque` | Tanque_libre | 3 | 3 | estricta | tanques disponibles para pasteurizar |
| `vapor` | Vapor_disp | 1 | 1 | estricta | caldera; recurso compartido |
| `frio` | Frio_disp | 1 | 1 | estricta | bomba de frío; se retiene en el enfriamiento |
| `lote_past` | Lote_past | 0 | 3 | estricta | lote en pasteurización |
| `lote_enfr` | Lote_enfr | 0 | 3 | estricta | lote en enfriamiento |
| `cuarto` | Cuarto_frio | 0 | 4 | estricta | cuarto frío; 4 lotes como máximo |
| `emb_lista` | Emb_lista | 1 | 1 | estricta | embotelladora en marcha |
| `emb_parada` | Emb_parada | 0 | 1 | estricta | embotelladora detenida |
| `botellas` | Botellas | 0 | 999 | desborde | lotes embotellados (salida) |
| `cupo` | Cupo_frio | 4 | 4 | estricta | **lugar monitor de prevención** |

- \(M_0 = [6, 3, 1, 1, 0, 0, 0, 1, 0, 0, 4]\) en el orden de la tabla.
- `Cupo_frio` es el único lugar que no aparece en la ficha original: es la
  regla de prevención que la ficha exige. La variante sin prevención lo quita.
- `Leche_cruda` y `Botellas` son de capacidad “desborde”: la transición no se
  bloquea si se supera \(k\), pero el juego muestra el derrame y penaliza.

## 2. Transiciones

| id | nombre | disparo | Pre → Post |
|---|---|---|---|
| `t_iniciar_past` | Iniciar pasteurización | jugador | Leche + Tanque_libre + Vapor + Cupo → Lote_past |
| `t_fin_past` | Fin de pasteurización | automática | Lote_past + Frio → Lote_enfr + Vapor |
| `t_fin_enfr` | Descargar al cuarto frío | jugador | Lote_enfr → Cuarto_frio + Frio + Tanque_libre |
| `t_embotellar` | Embotellar un lote | automática | Cuarto_frio + Emb_lista → Botellas + Emb_lista + Cupo |
| `t_parar_emb` | Parar embotelladora | jugador | Emb_lista → Emb_parada |
| `t_arrancar_emb` | Arrancar embotelladora | jugador | Emb_parada + Vapor → Emb_lista + Vapor |

- **AND-join:** `t_iniciar_past` necesita cuatro tokens a la vez
  (leche, tanque, vapor, cupo). Si falta uno, el HUD muestra cuál.
- **Conflicto (choice):** `Vapor_disp` es compartido por `t_iniciar_past` y
  `t_arrancar_emb`. El jugador decide si usa el vapor para pasteurizar o para
  arrancar la embotelladora.
- **Acotación:** `Cuarto_frio` es estricto \(k=4\); si está lleno,
  `t_fin_enfr` se deshabilita y el tanque retiene el lote y el frío.

## 3. Matrices Pre, Post y A

Columnas: Leche, Tanque, Vapor, Frio, LoteP, LoteE, Cuarto, EmbL, EmbP, Bot, Cupo.

**Pre (|T| × |P|)**

| T | Leche | Tanque | Vapor | Frio | LoteP | LoteE | Cuarto | EmbL | EmbP | Bot | Cupo |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| t_iniciar_past | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| t_fin_past | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| t_fin_enfr | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| t_embotellar | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 | 0 |
| t_parar_emb | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| t_arrancar_emb | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |

**Post (|T| × |P|)**

| T | Leche | Tanque | Vapor | Frio | LoteP | LoteE | Cuarto | EmbL | EmbP | Bot | Cupo |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| t_iniciar_past | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| t_fin_past | 0 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| t_fin_enfr | 0 | 1 | 0 | 1 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| t_embotellar | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 1 | 1 |
| t_parar_emb | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |
| t_arrancar_emb | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |

**A = Post − Pre**

| T | Leche | Tanque | Vapor | Frio | LoteP | LoteE | Cuarto | EmbL | EmbP | Bot | Cupo |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| t_iniciar_past | −1 | −1 | −1 | 0 | +1 | 0 | 0 | 0 | 0 | 0 | −1 |
| t_fin_past | 0 | 0 | +1 | −1 | −1 | +1 | 0 | 0 | 0 | 0 | 0 |
| t_fin_enfr | 0 | +1 | 0 | +1 | 0 | −1 | +1 | 0 | 0 | 0 | 0 |
| t_embotellar | 0 | 0 | 0 | 0 | 0 | 0 | −1 | 0 | 0 | +1 | +1 |
| t_parar_emb | 0 | 0 | 0 | 0 | 0 | 0 | 0 | −1 | +1 | 0 | 0 |
| t_arrancar_emb | 0 | 0 | 0 | 0 | 0 | 0 | 0 | +1 | −1 | 0 | 0 |

Ejemplo de la ecuación con \(u = [1,0,0,0,0,0]^T\):

\[
M_1 = [6,3,1,1,0,0,0,1,0,0,4] + [-1,-1,-1,0,+1,0,0,0,0,0,-1]
     = [5,2,0,1,1,0,0,1,0,0,3]
\]

## 4. Invariantes P

Se conservan en los 146 marcados alcanzables y en 1000 disparos aleatorios
con semilla (`test/redPetri.test.js`):

| invariante | valor | interpretación |
|---|:---:|---|
| Tanque_libre + Lote_past + Lote_enfr | 3 | los 3 tanques están libres, pasteurizando o enfriando |
| Vapor_disp + Lote_past | 1 | el vapor está libre o lo retiene un lote en pasteurización |
| Frio_disp + Lote_enfr | 1 | el frío está libre o lo retiene un lote en enfriamiento |
| Emb_lista + Emb_parada | 1 | la embotelladora está en marcha o detenida |
| **Cupo_frio + Lote_past + Lote_enfr + Cuarto_frio** | **4** | **el monitor limita el circuito a 4 lotes** |
| Leche + Lote_past + Lote_enfr + Cuarto_frio + Botellas | 6 | conservación de lotes sin llegadas externas |

## 5. Deadlock y regla de prevención

**Marcado muerto (sin `Cupo_frio`):**

\[
M_d = [0, 1, 0, 0, 1, 1, 4, 0, 1, 0, 0]
\]

`Leche = 0`, `Tanque_libre = 1`, `Vapor = 0`, `Frio = 0`, `Lote_past = 1`,
`Lote_enfr = 1`, `Cuarto_frio = 4`, `Emb_lista = 0`, `Emb_parada = 1`,
`Botellas = 0`, `Cupo = 0`.

Secuencia de 16 disparos que lo produce:

```
t_iniciar_past → t_fin_past → t_iniciar_past → t_fin_enfr →
t_fin_past → t_iniciar_past → t_fin_enfr → t_fin_past →
t_iniciar_past → t_fin_enfr → t_fin_past → t_iniciar_past →
t_fin_enfr → t_fin_past → t_iniciar_past → t_parar_emb
```

Historia: se embotellan 4 lotes, el cuarto frío queda lleno, la embotelladora
se detiene, un lote en enfriamiento retiene `Frio_disp` y otro en
pasteurización retiene `Vapor_disp`; `t_fin_enfr` no puede depositar el quinto
lote, `t_fin_past` no consigue frío, `t_iniciar_past` y `t_arrancar_emb` no
consiguen vapor. Espera circular.

**Prevención:** `Cupo_frio` (M0 = 4) se consume en `t_iniciar_past` y se
devuelve en `t_embotellar`. El invariante
`Cupo_frio + Lote_past + Lote_enfr + Cuarto_frio = 4` obliga a que, para
llegar al marcado muerto, `Cupo_frio` valga −2: es inalcanzable.

**Conteos verificados** (grafo de alcanzabilidad, sin llegadas externas):

| variante | marcados distintos | marcados muertos |
|---|:---:|:---:|
| sin prevención (`dairycraft_sin_prevencion.pnml`) | **160** | **1** |
| con prevención (`dairycraft.pnml`) | **146** | **0** |

> El número 160/146 es de **marcados distintos** (grafo), que es el dato que
> PIPE2 muestra en Reachability/Coverability Graph. El árbol de cobertura con
> caminos duplicados es más grande; `src/sed/cobertura.js` lo implementa con
> `maxNodos` y ω, y el inspector dibuja 4 niveles desde el marcado actual.
> La red es acotada en este escenario, así que no aparecen ω.

## 6. Verificación en PIPE2

1. Abrir `dairycraft_sin_prevencion.pnml`; en **Animation** disparar la
   secuencia de 16 transiciones. Comprobar el marcado muerto y que ninguna
   transición queda habilitada.
2. Abrir `dairycraft.pnml`; repetir la secuencia. Al llegar a la sexta
   `t_iniciar_past` el monitor `Cupo_frio` la deshabilita; no hay deadlock.
3. Módulos de análisis y capturas:
   - **Incidence & Marking:** Pre, Post, A y M0.
   - **State Space Analysis:** acotada; segura en los lugares de \(k=1\);
     deadlock y secuencia más corta en la variante sin prevención.
   - **Reachability/Coverability Graph:** 160 marcados / 1 muerto sin
     prevención; 146 / 0 con prevención.
   - **Invariant Analysis:** los 6 invariantes P de la tabla.
4. Guardar en `modelos/capturas/`: `04_pipe2_incidencia.png`,
   `05_pipe2_estado_sin.png`, `06_pipe2_estado_con.png`,
   `07_pipe2_invariantes.png`.

## 7. Del modelo al juego

- `src/sed/redPetri.js` implementa `habilitada`, `disparar`, `resultado`,
  `conflictos`, `esMuerto`, `setMonitor`, `verificarInvariantes` y la matriz A.
- `src/juego/simulador.js` sincroniza:
  - `t_iniciar_past` → evento `iniciar_past` del tanque.
  - `t_fin_past` → evento `fin_past`.
  - `t_fin_enfr` → evento `descargar`.
  - El tanque que falla en `Llenando` no tomó tokens de la red; por eso el CIP
    no retiene `Tanque_libre`, vapor ni frío. El juego no asigna ese tanque
    hasta que `CIP_ok` lo devuelve a `Vacio`.
- El botón **Cupo: ON/OFF** del HUD llama `red.setMonitor`; con OFF el
  deadlock vuelve a ser alcanzable y el radar puede pasar a amarillo/rojo.
- El radar usa `explorar(red, M, 3)`; el inspector dibuja la ecuación de
  estado, las matrices y un árbol de 4 niveles.
- El juego termina con “Game over por interbloqueo” cuando el marcado actual
  es el deadlock circular de la ficha; `Resultados` muestra el marcado, la
  secuencia y la regla de prevención.
