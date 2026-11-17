import { CONFIG } from '../config.js';

export const PALETA = CONFIG.PALETA;
export const COLORES_ESTADO = CONFIG.COLORES_ESTADO;

export const PALETA_LISTA = [
  ['Fondo', PALETA.fondo],
  ['Suelo', PALETA.suelo],
  ['Suelo alterno', PALETA.sueloAlterno],
  ['Muro', PALETA.muro],
  ['Metal', PALETA.metal],
  ['Metal claro', PALETA.metalClaro],
  ['Metal oscuro', PALETA.metalOscuro],
  ['Acento', PALETA.acento],
  ['Operación', PALETA.operacion],
  ['Espera', PALETA.espera],
  ['Fallo', PALETA.fallo],
  ['Mantenimiento', PALETA.mantenimiento],
  ['Frío', PALETA.frio],
  ['Leche', PALETA.leche],
  ['Lote', PALETA.lote],
  ['Botella', PALETA.botella]
];

export function hex(color) {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function colorEstado(estado) {
  return COLORES_ESTADO[estado] ?? PALETA.metal;
}
