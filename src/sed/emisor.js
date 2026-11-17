// Emisor de eventos mínimo para que el núcleo SED no dependa de Phaser.
export class Emisor {
  constructor() {
    this.oyentes = new Map();
  }

  on(evento, fn) {
    if (!this.oyentes.has(evento)) this.oyentes.set(evento, new Set());
    this.oyentes.get(evento).add(fn);
    return () => this.off(evento, fn);
  }

  off(evento, fn) {
    this.oyentes.get(evento)?.delete(fn);
  }

  emitir(evento, datos) {
    const lista = this.oyentes.get(evento);
    if (!lista) return;
    for (const fn of [...lista]) fn(datos);
  }

  limpiar() {
    this.oyentes.clear();
  }
}
