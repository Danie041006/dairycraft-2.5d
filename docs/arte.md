# Guía de estilo · DairyCraft 2.5D

Arte original dibujado en código (sin archivos de imagen externos). La hoja de
arte interactiva está en `hoja-arte.html`; las funciones reutilizables en
`src/arte/dibujos.js` y `src/arte/paleta.js`.

## 1. Rejilla y cámara

- Lienzo 960 × 540, escala **FIT**.
- Rejilla isométrica 2:1 con celdas de **64 × 32 px**.
- Proyección:
  `pantallaX = (x − y) · 32`; `pantallaY = (x + y) · 16 − z · 16`.
- Orden de profundidad: `(x + y) · 10 + z`; el objeto con mayor `x + y` tapa
  al lejano. Los tokens llevan `z` mayor que su máquina.
- Luz desde arriba a la izquierda: caras izquierdas más oscuras, caras
  derechas más claras, brillo en el borde superior.
- La cámara permite arrastre y zoom (0,85× a 1,8×); el HUD vive en escenas
  separadas y no se mueve.

## 2. Paleta principal (14 colores)

| uso | color | hexadecimal |
|---|---|---|
| fondo / cielo | negro azulado | `#0b1218` |
| suelo | gris azulado | `#263641` |
| suelo alterno | gris azulado claro | `#2d3f4b` |
| muro | azul muy oscuro | `#17232b` |
| metal | acero medio | `#8fa6b2` |
| metal claro | acero claro | `#c7d3da` |
| metal oscuro | acero oscuro | `#4c5f6a` |
| acento / HUD | dorado | `#f2c14e` |
| operación | verde | `#2e9e5b` |
| espera | amarillo | `#e0b21b` |
| fallo | rojo | `#d64545` |
| mantenimiento | azul | `#3b7dd8` |
| frío | cian | `#7fd1e8` |
| leche | hueso | `#f4f1e8` |

**Auxiliares de interfaz (neutros):** panel `#101c24`, borde `#38505e`,
texto `#eaf2f5`, texto suave `#9fb3bf`, lote `#e8c07a`, botella `#9be3c0`,
vapor `#cfeee6`.

**Tinte térmico:** `#f08a3c` para `Pasteurizando` (derivado del acento).

## 3. Colores e íconos de estado

Los 4 colores base de la guía son operación, espera, fallo y mantenimiento;
DairyCraft agrega el cian de frío y el naranja térmico para distinguir los
procesos.

| estado | color | ícono sobre la máquina |
|---|---|---|
| `Vacio` | `#2e9e5b` operación | check |
| `Llenando` | `#e0b21b` espera | gota |
| `Pasteurizando` | `#f08a3c` térmico | llama |
| `Enfriando` | `#7fd1e8` frío | copo de nieve |
| `Lavado_CIP` | `#3b7dd8` mantenimiento | burbujas |
| `Fallo` | `#d64545` fallo | signo de admiración |

Cada tanque lleva un **aro de estado** en la base y el ícono en un círculo
sobre la tapa. El estado actual del HUD se ilumina con un halo manual (tres
círculos concéntricos con alfa) y el último evento parpadea 0,5 s.

## 4. Tokens

| lugar / tipo | forma | color | representación física |
|---|---|---|---|
| `Leche_cruda` | gota | `#f4f1e8` | nivel del silo + gotas |
| `Vapor_disp` | nube | `#cfeee6` | nube sobre la caldera |
| `Frio_disp` | copo | `#7fd1e8` | copo sobre la bomba de frío |
| `Lote_past` | caja isométrica | `#e8c07a` | caja sobre el tanque |
| `Lote_enfr` | caja isométrica | `#e8c07a` | caja sobre el tanque |
| `Cuarto_frio` | caja isométrica | `#e8c07a` | ranuras del cuarto frío (4) |
| `Emb_lista` / `Emb_parada` | luz | verde / rojo | luz de la embotelladora |
| `Botellas` | botella | `#9be3c0` | botellas a la salida |
| `Cupo_frio` | rombo | `#2e9e5b` | rombos junto al cuarto frío |
| `Tanque_libre` | disco | `#c7d3da` | contador `m/k` en el HUD |

Cada token se dibuja a tamaño real y se agrupa de 1, 5 y \(k\) unidades en la
hoja de arte. En el juego, los tokens viajan con tweens desde los lugares de
entrada hasta la estación y luego a los de salida.

## 5. Máquinas

Todas se dibujan con `Graphics` en vista isométrica, con la base en el centro
de su celda y una sombra elíptica:

- **Tanque:** cilindro de acero de 76 × 90 px, tapa elíptica, ventana de
  cristal con nivel de líquido, aros de estado, ícono y etiqueta.
- **Silo:** cilindro de 76 × 152 px, nivel de leche, escalera y tubo.
- **Caldera:** cilindro horizontal con puerta de fuego, llama, manómetro,
  chimenea y partículas de vapor.
- **Bomba de frío:** caja isométrica con ventilador, serpentín, copo y aura
  cian.
- **Embotelladora:** banda con 5 botellas, máquina, tolva, luz de marcha y
  pila de botellas a la salida.
- **Cuarto frío:** caja grande con puerta, termómetro, 4 ranuras y un lote
  por ranura; el borde se pone rojo cuando está lleno.
- **Etiquetas:** nombre y estado debajo de cada máquina; el silo y el cuarto
  frío muestran `m/k`. La etiqueta de la embotelladora se coloca a la
  izquierda para no quedar tapada por el cuarto frío.

## 6. HUD

- **HUD de partida:** paneles redondeados `#101c24` con borde `#38505e` y una
  línea dorada superior; tipografía Trebuchet MS y números en Consolas.
- **HUD de máquina:** escena superpuesta a la derecha. Nodos circulares de
  21 px, etiquetas de estado debajo, flechas curvas con el código del evento,
  estado inicial con flecha de entrada y estados marcados con doble círculo.
  El nodo actual se ilumina; los botones verdes, grises y rojos siguen la
  regla de la guía.
- **Consola CIP:** palabra en monoespaciado, estado del DFA, comandos
  `P S E A Z`, botones Validar / Borrar / Ayuda y el texto “Esperado: …”.
- **Radar:** panel de 192 × 124 px, nodos de 2–3 px, aristas finas, marcados
  muertos en rojo, borde verde / amarillo parpadeante / rojo.
- **Inspector:** tablas de 6 × 11 con celdas de 58 × 23 px, valores en
  monoespaciado, M actual y u del último disparo; el árbol ocupa el ancho
  completo.

## 7. Efectos con propósito

- **Partículas:** vapor continuo en la caldera y una explosión al iniciar o
  terminar una pasteurización; burbujas en el CIP; destellos y anillos en los
  eventos críticos.
- **Tweens:** nivel de los tanques, tokens que viajan, botellas, radar,
  avisos de logro y transiciones entre escenas.
- **Cámara:** temblor al bloquear un evento o fallar; destello de pantalla en
  el deadlock y en los logros.
- **Glow/bloom:** la selección de máquina usa halos concéntricos y el estado
  actual del HUD un círculo luminoso; los eventos críticos usan un flash
  aditivo. En Phaser 4 los filtros de `Graphics` no están disponibles, así que
  el brillo se dibuja a mano para que el efecto sea estable en WebGL y Canvas.

## 8. Funciones reutilizables

| función | uso |
|---|---|
| `dibujarSuelo` / `dibujarMuros` | planta 14 × 14 |
| `dibujarSilo` | silo con nivel de leche |
| `dibujarTanque` | tanque con estado y nivel |
| `dibujarCaldera` / `dibujarChiller` | vapor y frío |
| `dibujarEmbotelladora` / `dibujarCuartoFrio` | salida y almacenamiento |
| `dibujarToken` | 9 tipos de token |
| `dibujarIconoEstado` | 6 íconos de estado |
| `dibujarArista` / `dibujarNodo` | grafo del autómata |
| `dibujarPanel` / `dibujarBarra` | HUD |

## 9. Hoja de arte

Abrir `hoja-arte.html` con `npx serve` y tomar una captura. La página muestra:

1. La paleta con su código hexadecimal.
2. Cada máquina una vez por cada estado de su autómata, con el nombre debajo.
3. Cada tipo de token a tamaño real, agrupado de 1, 5 y \(k\) unidades.
4. Un trozo de planta de 8 × 8 celdas con suelo, muros, tuberías y orden de
   profundidad.
5. Una maqueta del HUD de máquina con el estado actual iluminado y un evento
   deshabilitado en rojo, y el radar en sus 3 colores.

## 10. Originalidad

No se copian personajes, nombres, mapas, logotipos ni música de Factorio,
Automachef, SimCity, Overcooked, Two Point Hospital ni de ningún otro juego
comercial. La paleta, los nombres de la planta, los íconos y las máquinas son
originales del equipo. La única dependencia visual es Phaser 4.2.1 por CDN.
