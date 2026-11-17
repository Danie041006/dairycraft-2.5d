// Red de Petri N = (P, T, Pre, Post, M0) con capacidad por lugar.
// Pre y Post son |T| x |P| (fila por transición); A = Post - Pre.
// M_k = M_{k-1} + A^T * u_k, con u_k el vector de disparo one-hot.
export class RedPetri {
  constructor(json, { monitorActivo = true } = {}) {
    this.json = json;
    this.lugares = json.lugares.map((p) => ({ ...p }));
    this.transiciones = json.transiciones.map((t) => ({ ...t }));
    this.nP = this.lugares.length;
    this.nT = this.transiciones.length;
    this.idxLugar = new Map(this.lugares.map((p, i) => [p.id, i]));
    this.idxTransicion = new Map(this.transiciones.map((t, i) => [t.id, i]));
    this.preBase = json.pre.map((fila) => [...fila]);
    this.postBase = json.post.map((fila) => [...fila]);
    this.M0Base = this.lugares.map((p) => p.m0);
    this.monitor = json.monitor ?? null;
    this.monitorActivo = monitorActivo;
    this.pre = [];
    this.post = [];
    this.A = [];
    this.M = [...this.M0Base];
    this.disparos = [];
    this.reconstruirMatrices();
    this.reiniciar();
  }

  _ti(transicion) {
    if (typeof transicion === 'number') return transicion;
    if (typeof transicion === 'string') return this.idxTransicion.get(transicion) ?? -1;
    return this.idxTransicion.get(transicion?.id) ?? -1;
  }

  _pi(lugar) {
    if (typeof lugar === 'number') return lugar;
    if (typeof lugar === 'string') return this.idxLugar.get(lugar) ?? -1;
    return this.idxLugar.get(lugar?.id) ?? -1;
  }

  reconstruirMatrices() {
    this.pre = this.preBase.map((fila) => [...fila]);
    this.post = this.postBase.map((fila) => [...fila]);
    if (this.monitor && !this.monitorActivo) {
      const idx = this.idxLugar.get(this.monitor.lugar);
      for (const id of this.monitor.transiciones) {
        const ti = this.idxTransicion.get(id);
        if (ti !== undefined && idx !== undefined) {
          this.pre[ti][idx] = 0;
          this.post[ti][idx] = 0;
        }
      }
    }
    this.A = this.post.map((fila, t) => fila.map((v, p) => v - this.pre[t][p]));
  }

  marcadoInicial() {
    const M = [...this.M0Base];
    if (this.monitor) {
      const idx = this.idxLugar.get(this.monitor.lugar);
      M[idx] = this.monitorActivo ? this.monitor.m0 : 0;
    }
    return M;
  }

  reiniciar() {
    this.M = this.marcadoInicial();
    this.disparos = [];
    return this;
  }

  setMonitor(activo) {
    this.monitorActivo = Boolean(activo);
    this.reconstruirMatrices();
    if (this.monitor) {
      const idx = this.idxLugar.get(this.monitor.lugar);
      if (this.monitorActivo) {
        const comprometidos =
          this.M[this.idxLugar.get('lote_past')] +
          this.M[this.idxLugar.get('lote_enfr')] +
          this.M[this.idxLugar.get('cuarto')];
        this.M[idx] = Math.max(0, this.monitor.m0 - comprometidos);
      } else {
        this.M[idx] = 0;
      }
    }
    return this;
  }

  habilitada(transicion, M = this.M) {
    const ti = this._ti(transicion);
    if (ti < 0) return false;
    const pre = this.pre[ti];
    const post = this.post[ti];
    for (let p = 0; p < this.nP; p++) {
      if (M[p] < pre[p]) return false;
    }
    for (let p = 0; p < this.nP; p++) {
      const m2 = M[p] - pre[p] + post[p];
      if (m2 < 0) return false;
      if (this.lugares[p].capacidad === 'estricta' && m2 > this.lugares[p].k) return false;
    }
    return true;
  }

  razonNoHabilitada(transicion, M = this.M) {
    const ti = this._ti(transicion);
    if (ti < 0) return { habilitada: false, faltan: [], excede: [], texto: 'Transición desconocida' };
    const faltan = [];
    const excede = [];
    for (let p = 0; p < this.nP; p++) {
      const pre = this.pre[ti][p];
      if (M[p] < pre) {
        faltan.push({ lugar: this.lugares[p].nombre, tiene: M[p], necesita: pre });
      }
      const m2 = M[p] - pre + this.post[ti][p];
      if (this.lugares[p].capacidad === 'estricta' && m2 > this.lugares[p].k) {
        excede.push({ lugar: this.lugares[p].nombre, resultante: m2, k: this.lugares[p].k });
      }
    }
    const partes = [];
    if (faltan.length) partes.push('faltan tokens: ' + faltan.map((f) => `${f.lugar} ${f.tiene}/${f.necesita}`).join(', '));
    if (excede.length) partes.push('capacidad estricta: ' + excede.map((e) => `${e.lugar} ${e.resultante}/${e.k}`).join(', '));
    return {
      habilitada: faltan.length === 0 && excede.length === 0,
      faltan,
      excede,
      texto: partes.length ? partes.join(' · ') : 'habilitada'
    };
  }

  resultado(transicion, M = this.M) {
    const ti = this._ti(transicion);
    if (ti < 0 || !this.habilitada(ti, M)) return null;
    const salida = M.map((v, p) => v - this.pre[ti][p] + this.post[ti][p]);
    return salida;
  }

  disparar(transicion) {
    const ti = this._ti(transicion);
    const antes = [...this.M];
    const despues = this.resultado(ti, this.M);
    if (!despues) {
      throw new Error(`La transición ${this.transiciones[ti]?.id ?? transicion} no está habilitada`);
    }
    const u = this.transiciones.map((_, i) => (i === ti ? 1 : 0));
    const desborde = [];
    for (let p = 0; p < this.nP; p++) {
      if (despues[p] > this.lugares[p].k) {
        desborde.push({ lugar: this.lugares[p].nombre, valor: despues[p], k: this.lugares[p].k });
      }
    }
    this.M = despues;
    this.disparos.push({ transicion: this.transiciones[ti].id, antes, despues: [...despues], u });
    return {
      id: this.transiciones[ti].id,
      antes,
      despues: [...despues],
      u,
      desborde
    };
  }

  habilitadas(M = this.M) {
    const salida = [];
    for (let t = 0; t < this.nT; t++) {
      if (this.habilitada(t, M)) salida.push(this.transiciones[t].id);
    }
    return salida;
  }

  conflictos(M = this.M) {
    const activas = this.habilitadas(M);
    const pares = [];
    for (let a = 0; a < activas.length; a++) {
      for (let b = a + 1; b < activas.length; b++) {
        const ta = this._ti(activas[a]);
        const tb = this._ti(activas[b]);
        for (let p = 0; p < this.nP; p++) {
          if (this.pre[ta][p] > 0 && this.pre[tb][p] > 0) {
            pares.push({ a: activas[a], b: activas[b], lugar: this.lugares[p].nombre });
            break;
          }
        }
      }
    }
    return pares;
  }

  esMuerto(M = this.M) {
    return this.habilitadas(M).length === 0;
  }

  marcado() {
    return [...this.M];
  }

  marcadoObj(M = this.M) {
    const obj = {};
    this.lugares.forEach((p, i) => {
      obj[p.id] = M[i];
    });
    return obj;
  }

  agregarToken(lugar, cantidad = 1) {
    const pi = this._pi(lugar);
    if (pi < 0) throw new Error(`Lugar desconocido: ${lugar}`);
    const p = this.lugares[pi];
    const limite = p.capacidad === 'estricta' ? p.k : p.k + 3;
    const antes = this.M[pi];
    const nuevo = Math.min(limite, antes + cantidad);
    this.M[pi] = nuevo;
    return {
      lugar: p.nombre,
      antes,
      despues: nuevo,
      desborde: nuevo > p.k,
      excedido: antes + cantidad > limite
    };
  }

  verificarInvariantes(M = this.M, { omitirCupo = !this.monitorActivo } = {}) {
    const resultados = [];
    for (const inv of this.json.invariantes ?? []) {
      if (omitirCupo && inv.nombre.toLowerCase().includes('cupo')) continue;
      let suma = 0;
      for (const [id, peso] of Object.entries(inv.pesos)) {
        const pi = this.idxLugar.get(id);
        if (pi === undefined) throw new Error(`Invariante con lugar desconocido: ${id}`);
        suma += M[pi] * peso;
      }
      resultados.push({ nombre: inv.nombre, esperado: inv.valor, obtenido: suma, ok: suma === inv.valor });
    }
    return { ok: resultados.every((r) => r.ok), resultados };
  }

  matrices() {
    return {
      pre: this.pre.map((f) => [...f]),
      post: this.post.map((f) => [...f]),
      A: this.A.map((f) => [...f])
    };
  }

  ultimoDisparo() {
    return this.disparos[this.disparos.length - 1] ?? null;
  }

  clonar() {
    const copia = new RedPetri(this.json, { monitorActivo: this.monitorActivo });
    copia.M = [...this.M];
    copia.disparos = this.disparos.map((d) => ({ ...d, antes: [...d.antes], despues: [...d.despues], u: [...d.u] }));
    return copia;
  }

  nombresLugares() {
    return this.lugares.map((p) => p.nombre);
  }

  idsLugares() {
    return this.lugares.map((p) => p.id);
  }

  nombresTransiciones() {
    return this.transiciones.map((t) => t.id);
  }
}
