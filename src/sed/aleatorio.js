// Generador pseudoaleatorio con semilla (mulberry32) para partidas reproducibles.
export class Aleatorio {
  constructor(semilla = 1) {
    this.semilla = semilla >>> 0;
    this.estado = this.semilla;
  }

  reiniciar() {
    this.estado = this.semilla;
  }

  siguiente() {
    let a = (this.estado = (this.estado + 0x6d2b79f5) >>> 0);
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  entero(min, max) {
    return Math.floor(this.siguiente() * (max - min + 1)) + min;
  }

  probabilidad(p) {
    return this.siguiente() < p;
  }

  elegir(lista) {
    if (!lista.length) return undefined;
    return lista[this.entero(0, lista.length - 1)];
  }
}

export function crearAleatorio(semilla = 1) {
  return new Aleatorio(semilla);
}
