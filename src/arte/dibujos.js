// Funciones de dibujo originales, sin imágenes externas. Todas reciben un
// Phaser.GameObjects.Graphics y coordenadas de pantalla ya proyectadas.
import { PALETA as P, COLORES_ESTADO as CE } from './paleta.js';
import { aPantalla } from '../iso/proyeccion.js';

const TAU = Math.PI * 2;

function sombra(g, x, y, ancho, alto, alpha = 0.22) {
  g.fillStyle(0x000000, alpha);
  g.fillEllipse(x, y + 3, ancho, alto);
}

function puntosDiamante(x, y, ancho = 1, ox = 0, oy = 0) {
  return [
    { x: (x - y) * 32 + ox, y: (x + y) * 16 + oy },
    { x: (x + ancho - y) * 32 + ox, y: (x + ancho + y) * 16 + oy },
    { x: (x + ancho - y - ancho) * 32 + ox, y: (x + ancho + y + ancho) * 16 + oy },
    { x: (x - y - ancho) * 32 + ox, y: (x + y + ancho) * 16 + oy }
  ];
}

export function dibujarSuelo(g, celdas = 14, ox = 480, oy = 100) {
  for (let x = 0; x < celdas; x++) {
    for (let y = 0; y < celdas; y++) {
      const color = (x + y) % 2 === 0 ? P.suelo : P.sueloAlterno;
      const pts = [
        aPantalla(x, y),
        aPantalla(x + 1, y),
        aPantalla(x + 1, y + 1),
        aPantalla(x, y + 1)
      ].map((p) => ({ x: p.x + ox, y: p.y + oy }));
      g.fillStyle(color, 1);
      g.fillPoints(pts, true);
      g.lineStyle(1, P.muro, 0.28);
      g.strokePoints(pts, true);
    }
  }
  // borde exterior
  const borde = [
    aPantalla(0, 0),
    aPantalla(celdas, 0),
    aPantalla(celdas, celdas),
    aPantalla(0, celdas)
  ].map((p) => ({ x: p.x + ox, y: p.y + oy }));
  g.lineStyle(2, P.panelBorde, 0.8);
  g.strokePoints(borde, true);
}

export function dibujarMuros(g, celdas = 14, ox = 480, oy = 100, alto = 64) {
  for (let i = 0; i < celdas; i++) {
    const a = aPantalla(0, i);
    const b = aPantalla(0, i + 1);
    const pts = [
      { x: a.x + ox, y: a.y + oy },
      { x: b.x + ox, y: b.y + oy },
      { x: b.x + ox, y: b.y + oy - alto },
      { x: a.x + ox, y: a.y + oy - alto }
    ];
    g.fillStyle(i % 2 === 0 ? P.muro : P.muroLuz, 1);
    g.fillPoints(pts, true);
    g.lineStyle(1, P.panelBorde, 0.25);
    g.strokePoints(pts, true);
  }
  for (let i = 0; i < celdas; i++) {
    const a = aPantalla(i, 0);
    const b = aPantalla(i + 1, 0);
    const pts = [
      { x: a.x + ox, y: a.y + oy },
      { x: b.x + ox, y: b.y + oy },
      { x: b.x + ox, y: b.y + oy - alto },
      { x: a.x + ox, y: a.y + oy - alto }
    ];
    g.fillStyle(i % 2 === 0 ? P.muroLuz : P.muro, 1);
    g.fillPoints(pts, true);
    g.lineStyle(1, P.panelBorde, 0.25);
    g.strokePoints(pts, true);
  }
}

export function dibujarSilo(g, x, y, cantidad = 6, k = 10) {
  const nivel = Math.max(0, Math.min(1, cantidad / Math.max(1, k)));
  sombra(g, x, y, 104, 28, 0.28);
  g.fillStyle(P.metalOscuro, 1);
  g.fillRoundedRect(x - 38, y - 152, 76, 148, 10);
  g.fillStyle(P.metal, 1);
  g.fillRoundedRect(x - 34, y - 150, 68, 144, 9);
  g.fillStyle(P.metalClaro, 0.35);
  g.fillRoundedRect(x - 30, y - 146, 12, 136, 6);
  // leche
  const altoLeche = 122 * nivel;
  if (altoLeche > 2) {
    g.fillStyle(P.leche, 0.88);
    g.fillRoundedRect(x - 25, y - 14 - altoLeche, 50, altoLeche, 6);
    g.fillStyle(0xffffff, 0.35);
    g.fillEllipse(x, y - 14 - altoLeche, 50, 12);
  }
  // ventana y bandas
  g.lineStyle(2, P.panelBorde, 0.9);
  g.strokeRoundedRect(x - 27, y - 142, 54, 126, 7);
  g.lineStyle(3, P.metalOscuro, 0.9);
  g.lineBetween(x - 36, y - 116, x + 36, y - 116);
  g.lineBetween(x - 36, y - 62, x + 36, y - 62);
  g.lineBetween(x - 36, y - 26, x + 36, y - 26);
  // tapa
  g.fillStyle(P.metalClaro, 1);
  g.fillEllipse(x, y - 152, 76, 24);
  g.lineStyle(2, P.metalOscuro, 0.9);
  g.strokeEllipse(x, y - 152, 76, 24);
  // escalera
  g.lineStyle(2, P.metalClaro, 0.75);
  g.lineBetween(x + 30, y - 132, x + 30, y - 10);
  g.lineBetween(x + 40, y - 132, x + 40, y - 10);
  for (let i = 0; i < 7; i++) {
    g.lineBetween(x + 30, y - 124 + i * 17, x + 40, y - 124 + i * 17);
  }
  // tubo superior
  g.lineStyle(6, P.metalClaro, 0.8);
  g.lineBetween(x + 30, y - 150, x + 30, y - 170);
}

export function dibujarTanque(g, x, y, estado = 'Vacio', nivel = 0.2, seleccionado = false) {
  const color = CE[estado] ?? P.metal;
  sombra(g, x, y, 90, 24, 0.26);
  if (seleccionado) {
    for (let i = 3; i >= 1; i--) {
      g.fillStyle(color, 0.06 * i);
      g.fillEllipse(x, y - 46, 100 + i * 14, 120 + i * 8);
    }
  }
  // cuerpo
  g.fillStyle(P.metalOscuro, 1);
  g.fillRoundedRect(x - 38, y - 90, 76, 86, 10);
  g.fillStyle(P.metal, 1);
  g.fillRoundedRect(x - 34, y - 88, 68, 82, 9);
  g.fillStyle(P.metalClaro, 0.4);
  g.fillRoundedRect(x - 30, y - 84, 11, 74, 5);
  // ventana
  const alto = 62 * Math.max(0.05, Math.min(1, nivel));
  const colorLiquido =
    estado === 'Enfriando' ? P.frio :
    estado === 'Lavado_CIP' ? P.mantenimiento :
    estado === 'Fallo' ? P.fallo :
    P.leche;
  g.fillStyle(colorLiquido, estado === 'Vacio' ? 0.3 : 0.88);
  g.fillRoundedRect(x - 23, y - 17 - alto, 46, alto, 5);
  g.fillStyle(0xffffff, 0.25);
  g.fillEllipse(x, y - 17 - alto, 46, 10);
  g.lineStyle(2, P.panelBorde, 0.9);
  g.strokeRoundedRect(x - 25, y - 80, 50, 64, 6);
  // tapa y bandas
  g.fillStyle(P.metalClaro, 1);
  g.fillEllipse(x, y - 90, 76, 24);
  g.lineStyle(2, P.metalOscuro, 0.9);
  g.strokeEllipse(x, y - 90, 76, 24);
  g.lineStyle(3, P.metalOscuro, 0.85);
  g.lineBetween(x - 36, y - 70, x + 36, y - 70);
  g.lineBetween(x - 36, y - 24, x + 36, y - 24);
  // aro de estado
  g.lineStyle(3, color, 0.95);
  g.strokeEllipse(x, y - 5, 88, 26);
  g.fillStyle(color, 0.85);
  g.fillCircle(x + 34, y - 8, 5);
  // tubo
  g.lineStyle(6, P.metalClaro, 0.75);
  g.lineBetween(x - 30, y - 90, x - 30, y - 108);
  dibujarIconoEstado(g, estado, x, y - 116);
}

export function dibujarCaldera(g, x, y, activa = true) {
  sombra(g, x, y, 112, 30, 0.28);
  g.fillStyle(P.metalOscuro, 1);
  g.fillRoundedRect(x - 52, y - 58, 104, 50, 10);
  g.fillStyle(P.metal, 1);
  g.fillRoundedRect(x - 47, y - 55, 94, 43, 9);
  g.fillStyle(P.metalClaro, 0.35);
  g.fillRoundedRect(x - 42, y - 51, 14, 35, 5);
  g.fillStyle(P.metalClaro, 1);
  g.fillEllipse(x - 47, y - 34, 18, 42);
  g.fillEllipse(x + 47, y - 34, 18, 42);
  // puerta de fuego
  g.fillStyle(0x2a1c1a, 1);
  g.fillRoundedRect(x + 4, y - 46, 28, 28, 5);
  if (activa) {
    g.fillStyle(0xf08a3c, 0.95);
    g.fillTriangle(x + 10, y - 22, x + 15, y - 43, x + 20, y - 24);
    g.fillStyle(0xf2c14e, 0.95);
    g.fillTriangle(x + 17, y - 22, x + 21, y - 37, x + 26, y - 23);
    g.fillStyle(0xf08a3c, 0.2);
    g.fillCircle(x + 18, y - 32, 22);
  }
  // manómetro
  g.fillStyle(P.metalClaro, 1);
  g.fillCircle(x - 18, y - 24, 8);
  g.lineStyle(2, P.panelBorde, 1);
  g.strokeCircle(x - 18, y - 24, 8);
  g.lineBetween(x - 18, y - 24, x - 14, y - 28);
  // chimenea
  g.fillStyle(P.metalOscuro, 1);
  g.fillRoundedRect(x - 26, y - 86, 14, 32, 3);
  g.fillStyle(P.metal, 1);
  g.fillRoundedRect(x - 28, y - 90, 18, 8, 3);
  g.fillStyle(activa ? P.espera : P.textoSuave, 0.85);
  g.fillCircle(x - 19, y - 92, 3);
}

export function dibujarChiller(g, x, y, activa = true) {
  sombra(g, x, y, 104, 28, 0.28);
  // caja isométrica
  const ancho = 88;
  const alto = 66;
  const prof = 28;
  g.fillStyle(P.metalOscuro, 1);
  g.fillPoints([
    { x: x - ancho / 2, y: y - 10 },
    { x: x, y: y - 10 - prof / 2 },
    { x: x + ancho / 2, y: y - 10 },
    { x: x, y: y - 10 + prof / 2 }
  ], true);
  g.fillStyle(P.metal, 1);
  g.fillRect(x - ancho / 2, y - 10 - alto, ancho, alto);
  g.fillStyle(P.metalClaro, 0.28);
  g.fillRect(x - ancho / 2, y - 10 - alto, 14, alto);
  g.fillStyle(P.metalClaro, 1);
  g.fillPoints([
    { x: x - ancho / 2, y: y - 10 - alto },
    { x: x, y: y - 10 - alto - prof / 2 },
    { x: x + ancho / 2, y: y - 10 - alto },
    { x: x, y: y - 10 - alto + prof / 2 }
  ], true);
  // ventilador
  g.fillStyle(P.panel, 1);
  g.fillCircle(x - 18, y - 42, 17);
  g.lineStyle(2, P.metalClaro, 0.8);
  g.strokeCircle(x - 18, y - 42, 17);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + 0.4;
    g.lineStyle(3, P.frio, activa ? 0.9 : 0.35);
    g.lineBetween(x - 18, y - 42, x - 18 + Math.cos(a) * 13, y - 42 + Math.sin(a) * 13);
  }
  // serpentín
  g.lineStyle(2, P.frio, activa ? 0.9 : 0.35);
  for (let i = 0; i < 4; i++) {
    g.strokeRoundedRect(x + 8, y - 64 + i * 9, 24, 6, 3);
  }
  // copo
  dibujarIconoEstado(g, 'Enfriando', x + 18, y - 78);
  if (activa) {
    g.fillStyle(P.frio, 0.08);
    g.fillCircle(x, y - 46, 62);
  }
}

export function dibujarEmbotelladora(g, x, y, estado = 'Emb_lista') {
  const enMarcha = estado === 'Emb_lista';
  sombra(g, x, y, 150, 30, 0.26);
  // banda
  g.fillStyle(P.metalOscuro, 1);
  g.fillPoints([
    { x: x - 76, y: y - 14 },
    { x: x + 48, y: y - 14 },
    { x: x + 54, y: y - 6 },
    { x: x - 70, y: y - 6 }
  ], true);
  g.fillStyle(P.metal, 1);
  g.fillPoints([
    { x: x - 72, y: y - 18 },
    { x: x + 50, y: y - 18 },
    { x: x + 52, y: y - 12 },
    { x: x - 74, y: y - 12 }
  ], true);
  // botellas sobre la banda
  for (let i = 0; i < 5; i++) {
    dibujarToken(g, 'botella', x - 60 + i * 22, y - 22, 0.8);
  }
  // máquina
  g.fillStyle(P.metalOscuro, 1);
  g.fillRoundedRect(x + 40, y - 76, 44, 70, 7);
  g.fillStyle(P.metal, 1);
  g.fillRoundedRect(x + 44, y - 72, 36, 62, 6);
  g.fillStyle(P.metalClaro, 0.3);
  g.fillRoundedRect(x + 48, y - 68, 8, 54, 4);
  g.fillStyle(P.panel, 1);
  g.fillRoundedRect(x + 58, y - 62, 16, 16, 3);
  g.lineStyle(2, enMarcha ? P.operacion : P.fallo, 0.95);
  g.strokeRoundedRect(x + 58, y - 62, 16, 16, 3);
  g.fillStyle(enMarcha ? P.operacion : P.fallo, 1);
  g.fillCircle(x + 66, y - 54, 5);
  // tolva
  g.fillStyle(P.metalClaro, 0.9);
  g.fillTriangle(x + 38, y - 76, x + 60, y - 100, x + 86, y - 76);
  // pila de botellas a la salida
  for (let i = 0; i < 4; i++) {
    dibujarToken(g, 'botella', x + 66 + (i % 2) * 8, y - 8 - Math.floor(i / 2) * 12, 0.7);
  }
}

export function dibujarCuartoFrio(g, x, y, ocupacion = 0, k = 4) {
  const lleno = ocupacion >= k;
  sombra(g, x, y, 170, 38, 0.3);
  const ancho = 144;
  const alto = 92;
  const prof = 38;
  // cara frontal izquierda
  g.fillStyle(P.metalOscuro, 1);
  g.fillRect(x - ancho / 2, y - alto, ancho / 2, alto);
  // cara frontal derecha
  g.fillStyle(0x5c7280, 1);
  g.fillRect(x, y - alto, ancho / 2, alto);
  // techo
  g.fillStyle(P.metalClaro, 1);
  g.fillPoints([
    { x: x - ancho / 2, y: y - alto },
    { x: x, y: y - alto - prof / 2 },
    { x: x + ancho / 2, y: y - alto },
    { x: x, y: y - alto + prof / 2 }
  ], true);
  // puerta
  g.fillStyle(P.panel, 1);
  g.fillRoundedRect(x - 34, y - 78, 68, 66, 6);
  g.lineStyle(2, lleno ? P.fallo : P.frio, 0.95);
  g.strokeRoundedRect(x - 34, y - 78, 68, 66, 6);
  g.fillStyle(P.metalClaro, 1);
  g.fillRoundedRect(x + 22, y - 48, 6, 14, 2);
  // indicador
  g.fillStyle(lleno ? P.fallo : P.frio, 1);
  g.fillCircle(x + 46, y - 84, 6);
  g.lineStyle(2, P.texto, 0.8);
  g.strokeCircle(x + 46, y - 84, 6);
  // ranuras con lotes
  for (let i = 0; i < k; i++) {
    const sx = x - 58 + (i % 2) * 54;
    const sy = y - 84 + Math.floor(i / 2) * 30;
    g.fillStyle(P.panel, 0.9);
    g.fillRoundedRect(sx, sy, 22, 22, 3);
    g.lineStyle(1, lleno ? P.fallo : P.textoSuave, 0.6);
    g.strokeRoundedRect(sx, sy, 22, 22, 3);
    if (i < ocupacion) dibujarToken(g, 'lote', sx + 11, sy + 14, 0.8);
  }
  // termómetro
  g.fillStyle(P.texto, 0.9);
  g.fillRoundedRect(x - 62, y - 70, 4, 40, 2);
  g.fillStyle(P.frio, 1);
  g.fillCircle(x - 60, y - 26, 4);
}

export function dibujarToken(g, tipo, x, y, escala = 1) {
  const s = escala;
  switch (tipo) {
    case 'leche': {
      g.fillStyle(P.leche, 0.95);
      g.fillCircle(x, y + 2 * s, 4.5 * s);
      g.fillTriangle(x - 4.5 * s, y + 1.5 * s, x, y - 8 * s, x + 4.5 * s, y + 1.5 * s);
      break;
    }
    case 'vapor': {
      g.fillStyle(P.vapor, 0.5);
      g.fillCircle(x - 4 * s, y + 2 * s, 4 * s);
      g.fillCircle(x + 3 * s, y, 5 * s);
      g.fillCircle(x, y - 4 * s, 3.5 * s);
      break;
    }
    case 'frio': {
      g.lineStyle(1.6 * s, P.frio, 0.95);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI;
        g.lineBetween(x - Math.cos(a) * 7 * s, y - Math.sin(a) * 7 * s, x + Math.cos(a) * 7 * s, y + Math.sin(a) * 7 * s);
      }
      g.fillStyle(P.frio, 1);
      g.fillCircle(x, y, 2 * s);
      break;
    }
    case 'lote': {
      const w = 9 * s;
      const h = 5 * s;
      g.fillStyle(0xb98a4a, 1);
      g.fillRect(x - w, y - h, w * 2, h * 2);
      g.fillStyle(P.lote, 1);
      g.fillPoints([
        { x: x - w, y: y - h },
        { x: x - w / 2, y: y - h - 4 * s },
        { x: x + w, y: y - h - 4 * s },
        { x: x + w / 2, y: y - h }
      ], true);
      g.lineStyle(1, 0x6d4a22, 0.8);
      g.strokeRect(x - w, y - h, w * 2, h * 2);
      break;
    }
    case 'botella': {
      g.fillStyle(P.botella, 0.95);
      g.fillRoundedRect(x - 3 * s, y - 8 * s, 6 * s, 12 * s, 2 * s);
      g.fillRect(x - 1.5 * s, y - 13 * s, 3 * s, 5 * s);
      g.fillStyle(P.metalClaro, 1);
      g.fillRect(x - 2 * s, y - 14 * s, 4 * s, 2 * s);
      g.fillStyle(0xffffff, 0.5);
      g.fillRect(x - 2 * s, y - 6 * s, 1.5 * s, 8 * s);
      break;
    }
    case 'cupo': {
      g.fillStyle(P.operacion, 0.95);
      g.fillPoints([
        { x, y: y - 6 * s },
        { x: x + 6 * s, y },
        { x, y: y + 6 * s },
        { x: x - 6 * s, y }
      ], true);
      g.lineStyle(1, P.texto, 0.5);
      g.strokePoints([
        { x, y: y - 6 * s },
        { x: x + 6 * s, y },
        { x, y: y + 6 * s },
        { x: x - 6 * s, y }
      ], true);
      break;
    }
    case 'tanque': {
      g.fillStyle(P.metalClaro, 0.95);
      g.fillCircle(x, y, 5 * s);
      g.lineStyle(1.5, P.metalOscuro, 1);
      g.strokeCircle(x, y, 5 * s);
      break;
    }
    case 'alerta': {
      g.fillStyle(P.fallo, 1);
      g.fillTriangle(x, y - 7 * s, x + 7 * s, y + 6 * s, x - 7 * s, y + 6 * s);
      g.fillStyle(P.texto, 1);
      g.fillRect(x - 1 * s, y - 2 * s, 2 * s, 5 * s);
      g.fillCircle(x, y + 4 * s, 1.2 * s);
      break;
    }
    default:
      g.fillStyle(P.texto, 0.9);
      g.fillCircle(x, y, 4 * s);
  }
}

export function dibujarIconoEstado(g, estado, x, y, r = 12) {
  const color = CE[estado] ?? P.metal;
  g.fillStyle(0x081016, 0.8);
  g.fillCircle(x + 1, y + 2, r + 1);
  g.fillStyle(color, 1);
  g.fillCircle(x, y, r);
  g.lineStyle(1.5, 0xffffff, 0.5);
  g.strokeCircle(x, y, r);
  g.lineStyle(1.8, 0xffffff, 0.92);
  if (estado === 'Vacio') {
    g.lineBetween(x - 5, y, x - 1, y + 4);
    g.lineBetween(x - 1, y + 4, x + 5, y - 4);
  } else if (estado === 'Llenando') {
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(x, y + 3, 3);
    g.fillTriangle(x - 3, y + 2, x, y - 6, x + 3, y + 2);
  } else if (estado === 'Pasteurizando') {
    g.fillStyle(0xffffff, 0.95);
    g.fillTriangle(x - 5, y + 5, x + 1, y - 6, x + 5, y + 5);
    g.fillStyle(color, 0.9);
    g.fillCircle(x + 1, y + 4, 2.4);
  } else if (estado === 'Enfriando') {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      g.lineBetween(x - Math.cos(a) * 6, y - Math.sin(a) * 6, x + Math.cos(a) * 6, y + Math.sin(a) * 6);
    }
    g.fillStyle(0xffffff, 1);
    g.fillCircle(x, y, 1.8);
  } else if (estado === 'Lavado_CIP') {
    g.strokeCircle(x - 3, y + 2, 2.4);
    g.strokeCircle(x + 3, y + 1, 3);
    g.strokeCircle(x, y - 4, 2);
  } else if (estado === 'Fallo') {
    g.lineBetween(x, y - 5, x, y + 2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(x, y + 5, 1.4);
  }
}

export function dibujarArista(g, x1, y1, x2, y2, color = P.textoSuave, curvatura = 0, grosor = 2, alpha = 0.95) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const largo = Math.hypot(dx, dy) || 1;
  const px = -dy / largo;
  const py = dx / largo;
  const cx = mx + px * curvatura;
  const cy = my + py * curvatura;
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const it = 1 - t;
    pts.push({
      x: it * it * x1 + 2 * it * t * cx + t * t * x2,
      y: it * it * y1 + 2 * it * t * cy + t * t * y2
    });
  }
  g.lineStyle(grosor, color, alpha);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (const p of pts.slice(1)) g.lineTo(p.x, p.y);
  g.strokePath();
  // flecha en el extremo
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const largoFlecha = 8;
  g.fillStyle(color, alpha);
  g.fillTriangle(
    b.x, b.y,
    b.x - Math.cos(ang - 0.45) * largoFlecha, b.y - Math.sin(ang - 0.45) * largoFlecha,
    b.x - Math.cos(ang + 0.45) * largoFlecha, b.y - Math.sin(ang + 0.45) * largoFlecha
  );
  return { x: cx, y: cy };
}

export function dibujarNodo(g, x, y, { actual = false, marcado = false, color = P.operacion, r = 21 } = {}) {
  if (actual) {
    g.fillStyle(color, 0.18);
    g.fillCircle(x, y, r + 9);
    g.lineStyle(2, color, 0.55);
    g.strokeCircle(x, y, r + 6);
  }
  g.fillStyle(P.panel, 0.98);
  g.fillCircle(x, y, r);
  g.lineStyle(2, actual ? color : P.panelBorde, 1);
  g.strokeCircle(x, y, r);
  if (marcado) {
    g.lineStyle(1.5, P.textoSuave, 0.85);
    g.strokeCircle(x, y, r - 4);
  }
}

export function dibujarPanel(g, x, y, w, h, { alpha = 0.94, borde = P.panelBorde } = {}) {
  g.fillStyle(P.panel, alpha);
  g.fillRoundedRect(x, y, w, h, 10);
  g.lineStyle(1.5, borde, 0.9);
  g.strokeRoundedRect(x, y, w, h, 10);
  g.fillStyle(P.acento, 0.8);
  g.fillRect(x + 12, y + 1, w - 24, 2);
}

export function dibujarBarra(g, x, y, w, h, valor, color = P.operacion, fondo = P.muro) {
  g.fillStyle(fondo, 1);
  g.fillRoundedRect(x, y, w, h, h / 2);
  const v = Math.max(0, Math.min(1, valor));
  if (v > 0) {
    g.fillStyle(color, 1);
    g.fillRoundedRect(x, y, Math.max(h, w * v), h, h / 2);
  }
}

export function dibujarDestello(g, x, y, r, color = P.acento) {
  g.fillStyle(color, 0.15);
  g.fillCircle(x, y, r);
  g.lineStyle(2, color, 0.5);
  g.strokeCircle(x, y, r * 0.7);
}

export function dibujarSueloHoja(g, ox, oy) {
  dibujarSuelo(g, 8, ox, oy);
}

export { puntosDiamante };
