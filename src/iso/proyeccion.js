import { CONFIG } from '../config.js';

export const TILE_W = CONFIG.TILE_W;
export const TILE_H = CONFIG.TILE_H;

// Proyección isométrica 2:1 de la guía:
// pantallaX = (x - y) * TILE_W / 2
// pantallaY = (x + y) * TILE_H / 2 - z * TILE_H
export function aPantalla(x, y, z = 0) {
  return {
    x: (x - y) * (TILE_W / 2),
    y: (x + y) * (TILE_H / 2) - z * TILE_H
  };
}

export function aPantallaConOffset(x, y, z = 0, ox = 480, oy = 100) {
  const p = aPantalla(x, y, z);
  return { x: p.x + ox, y: p.y + oy };
}

// Inversa para saber qué celda se tocó con el mouse (z = 0).
export function aCelda(px, py, ox = 480, oy = 100) {
  const sx = px - ox;
  const sy = py - oy;
  return {
    x: (sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2,
    y: (sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2
  };
}

// Orden de profundidad: el más cercano (x + y mayor) tapa al lejano.
export function profundidad(x, y, z = 0) {
  return (x + y) * 10 + z;
}

export function celdaDeSprite(px, py, ox = 480, oy = 100) {
  return aCelda(px, py, ox, oy);
}
