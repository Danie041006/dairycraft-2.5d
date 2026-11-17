// Constantes del GDD y de la vista. Ninguna de estas constantes cambia el modelo
// formal: los estados, eventos y matrices viven en src/sed/modelos/.
export const CONFIG = {
  TILE_W: 64,
  TILE_H: 32,
  PLANTA: 14,
  VELOCIDADES: [1, 2, 4],
  SEMILLA: 20261116,

  DURACION_TURNO: 180, // segundos de simulación
  TIEMPOS: {
    llenado: 2.5,
    pasteurizacion: 8,
    enfriamiento: 6,
    embotellado: 4,
    llegadaLeche: 15,
    revisionFallo: 18
  },
  PROBABILIDAD_FALLO: 0.3,
  CAPACIDAD_MAXIMA_LLEGADAS: 12,

  PUNTOS: {
    botella: 12,
    reparacionPrimerIntento: 20,
    reparacionInvalida: -8,
    desborde: -10,
    intentoBloqueado: -15,
    fallo: -25,
    deadlockEvitado: 30,
    logro: 15,
    deadlock: -100
  },

  VICTORIA: {
    botellasMinimas: 6,
    turnos: 1
  },

  PALETA: {
    fondo: 0x0b1218,
    suelo: 0x263641,
    sueloAlterno: 0x2d3f4b,
    muro: 0x17232b,
    muroLuz: 0x22323d,
    metal: 0x8fa6b2,
    metalClaro: 0xc7d3da,
    metalOscuro: 0x4c5f6a,
    acento: 0xf2c14e,
    operacion: 0x2e9e5b,
    espera: 0xe0b21b,
    fallo: 0xd64545,
    mantenimiento: 0x3b7dd8,
    frio: 0x7fd1e8,
    leche: 0xf4f1e8,
    vapor: 0xcfeee6,
    lote: 0xe8c07a,
    botella: 0x9be3c0,
    texto: 0xeaf2f5,
    textoSuave: 0x9fb3bf,
    panel: 0x101c24,
    panelBorde: 0x38505e
  },

  COLORES_ESTADO: {
    Vacio: 0x2e9e5b,
    Llenando: 0xe0b21b,
    Pasteurizando: 0xf08a3c,
    Enfriando: 0x7fd1e8,
    Lavado_CIP: 0x3b7dd8,
    Fallo: 0xd64545
  }
};

export const CLAVES = {
  TANQUE: 'tanque',
  REPARACION: 'reparacion',
  RED: 'dairycraft'
};
