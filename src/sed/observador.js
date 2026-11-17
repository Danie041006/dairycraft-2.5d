// Autómata observador para sistemas parcialmente observados (Sigma = Sigma_o U Sigma_uo).
// El proyecto 1 no usa observador, pero el núcleo lo incluye y se prueba con un
// autómata pequeño para cumplir el requisito de la guía.
export class Observador {
  constructor(automata, noObservables = []) {
    this.automata = automata;
    this.noObservables = new Set(noObservables);
    this.inicial = this.cerradura([automata.json.inicial]);
    this.estimacion = new Set(this.inicial);
  }

  _transicion(estado, evento) {
    for (const [o, e, d] of this.automata.json.transiciones) {
      if (o === estado && e === evento) return d;
    }
    return null;
  }

  cerradura(estados) {
    const salida = new Set(estados);
    const cola = [...estados];
    while (cola.length) {
      const q = cola.shift();
      for (const [o, e, d] of this.automata.json.transiciones) {
        if (o === q && this.noObservables.has(e) && !salida.has(d)) {
          salida.add(d);
          cola.push(d);
        }
      }
    }
    return [...salida].sort();
  }

  observar(evento) {
    if (this.noObservables.has(evento)) {
      this.estimacion = new Set(this.cerradura([...this.estimacion]));
      return [...this.estimacion];
    }
    const siguientes = new Set();
    for (const q of this.estimacion) {
      const d = this._transicion(q, evento);
      if (d) siguientes.add(d);
    }
    this.estimacion = new Set(this.cerradura([...siguientes]));
    return [...this.estimacion];
  }

  estadosPosibles() {
    return [...this.estimacion].sort();
  }

  reiniciar() {
    this.estimacion = new Set(this.inicial);
  }
}

export function construirObservador(automata, noObservables = []) {
  const no = new Set(noObservables);
  const delta = (estado, ev) => {
    for (const [o, e, d] of automata.json.transiciones) if (o === estado && e === ev) return d;
    return null;
  };
  const cerradura = (estados) => {
    const salida = new Set(estados);
    const cola = [...estados];
    while (cola.length) {
      const q = cola.shift();
      for (const [o, e, d] of automata.json.transiciones) {
        if (o === q && no.has(e) && !salida.has(d)) {
          salida.add(d);
          cola.push(d);
        }
      }
    }
    return [...salida].sort();
  };
  const clave = (conjunto) => conjunto.join('|');
  const inicial = cerradura([automata.json.inicial]);
  const estados = new Map([[clave(inicial), { conjunto: inicial, transiciones: [] }]]);
  const cola = [inicial];
  const observables = [
    ...new Set(automata.json.transiciones.map(([, e]) => e).filter((e) => !no.has(e)))
  ];
  while (cola.length) {
    const actual = cola.shift();
    const nodo = estados.get(clave(actual));
    for (const ev of observables) {
      const destinos = new Set();
      for (const q of actual) {
        const d = delta(q, ev);
        if (d) destinos.add(d);
      }
      const conjunto = cerradura([...destinos]);
      if (!conjunto.length) continue;
      const k = clave(conjunto);
      nodo.transiciones.push({ evento: ev, destino: k });
      if (!estados.has(k)) {
        estados.set(k, { conjunto, transiciones: [] });
        cola.push(conjunto);
      }
    }
  }
  return {
    inicial: clave(inicial),
    estados: [...estados.values()],
    total: estados.size,
    acepta: [...estados.values()]
      .filter((e) => e.conjunto.some((q) => automata.json.marcados.includes(q)))
      .map((e) => clave(e.conjunto))
  };
}
