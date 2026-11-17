// Autómata de estado finito determinista G = (Q, Sigma, delta, q0, Qm).
// Toda transición del juego pasa por este ejecutar(); no hay cambios de estado sueltos.
export class Automata {
  constructor(json) {
    this.json = json;
    this.estado = json.inicial;
    this.historial = [];
    this.eventosPorId = new Map(json.eventos.map((e) => [e.id, e]));
    this.delta = new Map();

    for (const [origen, evento, destino] of json.transiciones) {
      if (!json.estados.includes(origen) || !json.estados.includes(destino)) {
        throw new Error(`Estado desconocido en la transición ${origen} -${evento}-> ${destino}`);
      }
      if (!this.eventosPorId.has(evento)) {
        throw new Error(`Evento desconocido en la transición: ${evento}`);
      }
      if (!this.delta.has(origen)) this.delta.set(origen, new Map());
      if (this.delta.get(origen).has(evento)) {
        throw new Error(`El autómata ${json.nombre} no es determinista en (${origen}, ${evento})`);
      }
      this.delta.get(origen).set(evento, destino);
    }
  }

  eventosActivos() {
    const salidas = this.delta.get(this.estado) ?? new Map();
    return [...salidas.keys()].map((id) => this.eventosPorId.get(id));
  }

  transicionesActivas() {
    const salidas = this.delta.get(this.estado) ?? new Map();
    return [...salidas.entries()].map(([id, destino]) => ({
      evento: this.eventosPorId.get(id),
      destino
    }));
  }

  puede(eventoId) {
    return (this.delta.get(this.estado) ?? new Map()).has(eventoId);
  }

  ejecutar(eventoId) {
    const salida = this.delta.get(this.estado) ?? new Map();
    if (!salida.has(eventoId)) {
      throw new Error(
        `delta(${this.estado}, ${eventoId}) no está definida en el autómata ${this.json.nombre}`
      );
    }
    const destino = salida.get(eventoId);
    this.estado = destino;
    this.historial.push(eventoId);
    return destino;
  }

  esMarcado() {
    return this.json.marcados.includes(this.estado);
  }

  reiniciar() {
    this.estado = this.json.inicial;
    this.historial = [];
  }

  codigoDe(eventoId) {
    return this.eventosPorId.get(eventoId)?.codigo ?? '?';
  }

  historialCodigos(n = 10) {
    return this.historial.slice(-n).map((id) => this.codigoDe(id));
  }

  clonar() {
    const copia = new Automata(this.json);
    copia.estado = this.estado;
    copia.historial = [...this.historial];
    return copia;
  }
}
