// Reloj de simulación por eventos discretos: calendario de eventos futuros
// implementado con una cola de prioridad (arreglo ordenado por tiempo y secuencia).
export class Reloj {
  constructor(tiempo = 0) {
    this.tiempo = tiempo;
    this.eventos = [];
    this.secuencia = 0;
    this.pausado = false;
    this.disparados = 0;
  }

  programar(dt, callback, etiqueta = null) {
    const t = this.tiempo + Math.max(0, Number(dt) || 0);
    const evento = { t, callback, etiqueta, seq: this.secuencia++ };
    let i = this.eventos.length;
    while (i > 0 && (this.eventos[i - 1].t > t || (this.eventos[i - 1].t === t && this.eventos[i - 1].seq > evento.seq))) i--;
    this.eventos.splice(i, 0, evento);
    return evento;
  }

  avanzar(dt) {
    if (this.pausado) return this.tiempo;
    const objetivo = this.tiempo + Math.max(0, Number(dt) || 0);
    while (this.eventos.length && this.eventos[0].t <= objetivo) {
      const evento = this.eventos.shift();
      this.tiempo = evento.t;
      this.disparados++;
      evento.callback?.(evento);
      // Si un callback limpió el reloj, el while se detiene solo.
    }
    this.tiempo = objetivo;
    return this.tiempo;
  }

  cancelar(etiqueta) {
    this.eventos = this.eventos.filter((e) => e.etiqueta !== etiqueta);
  }

  limpiar() {
    this.eventos = [];
  }

  pausar() {
    this.pausado = true;
  }

  reanudar() {
    this.pausado = false;
  }

  pendientes() {
    return this.eventos.length;
  }
}
