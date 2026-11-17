// Validador del lenguaje de reparación: RegExp anclada + DFA exportado de JFLAP.
// El alfabeto del CIP es {P, S, E, A, Z}. La palabra válida de la ficha es PSESEAEZ.
export class Lenguaje {
  constructor(json) {
    this.json = json;
    this.regex = new RegExp(json.regex);
    this.simbolos = [...json.simbolos];
    this.inicial = json.inicial;
    this.finales = new Set(json.finales);
    this.delta = new Map();
    for (const [origen, simbolo, destino] of json.transiciones) {
      if (!this.delta.has(origen)) this.delta.set(origen, new Map());
      this.delta.get(origen).set(simbolo, destino);
    }
    this.reiniciar();
  }

  reiniciar() {
    this.estado = this.inicial;
    this.palabra = '';
    this.ultimo = null;
    return this;
  }

  siguientes() {
    return [...(this.delta.get(this.estado)?.keys() ?? [])];
  }

  avanzar(simbolo) {
    const s = String(simbolo).toUpperCase();
    if (!this.simbolos.includes(s)) {
      this.ultimo = {
        ok: false,
        motivo: `El símbolo "${s}" no pertenece al alfabeto de reparación {${this.simbolos.join(', ')}}.`,
        esperado: this.siguientes()
      };
      return this.ultimo;
    }
    const destino = this.delta.get(this.estado)?.get(s);
    if (!destino) {
      this.ultimo = {
        ok: false,
        motivo: `Desde ${this.estado} no hay transición con ${s}.`,
        esperado: this.siguientes()
      };
      return this.ultimo;
    }
    this.estado = destino;
    this.palabra += s;
    this.ultimo = {
      ok: true,
      estado: this.estado,
      palabra: this.palabra,
      acepta: this.esValida(),
      esperado: this.siguientes()
    };
    return this.ultimo;
  }

  esValida() {
    return this.finales.has(this.estado);
  }

  perteneceDFA(palabra) {
    let q = this.inicial;
    for (const ch of String(palabra).toUpperCase()) {
      const siguiente = this.delta.get(q)?.get(ch);
      if (!siguiente) return false;
      q = siguiente;
    }
    return this.finales.has(q);
  }

  perteneceRegex(palabra) {
    return this.regex.test(String(palabra).toUpperCase());
  }

  pertenece(palabra) {
    return this.perteneceRegex(palabra) && this.perteneceDFA(palabra);
  }

  validar(palabra) {
    return {
      palabra: String(palabra).toUpperCase(),
      regex: this.perteneceRegex(palabra),
      dfa: this.perteneceDFA(palabra),
      coincide: this.pertenece(palabra)
    };
  }

  progreso() {
    return { estado: this.estado, palabra: this.palabra, acepta: this.esValida(), siguientes: this.siguientes() };
  }
}
