// Árbol de cobertura de Karp y Miller y exploración limitada para el radar.
// En una red acotada, el árbol coincide con el grafo de alcanzabilidad salvo
// que el árbol no fusiona caminos; por eso también se ofrece grafoAlcanzabilidad
// (marcados distintos), que es el número que se compara con PIPE2.

const clave = (M) => M.join(',');

export function explorar(red, M, profundidad = 3, maxNodos = 800) {
  const raiz = { id: 'M0', marcado: [...M], nivel: 0, muerto: red.esMuerto(M) };
  const nodos = [raiz];
  const aristas = [];
  const mapa = new Map([[clave(M), raiz]]);
  const cola = [{ nodo: raiz, M: [...M] }];

  while (cola.length && nodos.length < maxNodos) {
    const { nodo, M: actual } = cola.shift();
    if (nodo.nivel >= profundidad) continue;
    for (const t of red.habilitadas(actual)) {
      const siguiente = red.resultado(t, actual);
      if (!siguiente) continue;
      const k = clave(siguiente);
      let destino = mapa.get(k);
      if (!destino) {
        destino = {
          id: `M${nodos.length}`,
          marcado: siguiente,
          nivel: nodo.nivel + 1,
          muerto: red.esMuerto(siguiente)
        };
        nodos.push(destino);
        mapa.set(k, destino);
        cola.push({ nodo: destino, M: siguiente });
      }
      aristas.push({ de: nodo.id, a: destino.id, transicion: t });
      if (nodos.length >= maxNodos) break;
    }
  }

  return {
    nodos,
    aristas,
    muertos: nodos.filter((n) => n.muerto),
    profundidad,
    truncado: nodos.length >= maxNodos
  };
}

export function grafoAlcanzabilidad(red, M0, maxNodos = 10000) {
  const raiz = { id: 'M0', marcado: [...M0], muerto: red.esMuerto(M0) };
  const nodos = [raiz];
  const aristas = [];
  const mapa = new Map([[clave(M0), raiz]]);
  const cola = [raiz];
  let completo = true;

  while (cola.length) {
    const nodo = cola.shift();
    for (const t of red.habilitadas(nodo.marcado)) {
      const siguiente = red.resultado(t, nodo.marcado);
      if (!siguiente) continue;
      const k = clave(siguiente);
      let destino = mapa.get(k);
      if (!destino) {
        if (nodos.length >= maxNodos) {
          completo = false;
          break;
        }
        destino = {
          id: `M${nodos.length}`,
          marcado: siguiente,
          muerto: red.esMuerto(siguiente)
        };
        nodos.push(destino);
        mapa.set(k, destino);
        cola.push(destino);
      }
      aristas.push({ de: nodo.id, a: destino.id, transicion: t });
    }
    if (!completo) break;
  }

  return {
    nodos,
    aristas,
    muertos: nodos.filter((n) => n.muerto),
    completo,
    total: nodos.length
  };
}

export function arbolCobertura(red, M0, maxNodos = 2000) {
  const raiz = {
    id: 0,
    marcado: [...M0],
    padre: null,
    nivel: 0,
    muerto: red.esMuerto(M0)
  };
  const nodos = [raiz];
  const aristas = [];
  const cola = [{ nodo: raiz, camino: [[...M0]] }];
  let truncado = false;

  while (cola.length) {
    const { nodo, camino } = cola.shift();
    // Los nodos con omega representan crecimiento sin cota; para el dibujo
    // del inspector se dejan como hojas.
    if (nodo.marcado.some((v) => v === Infinity)) continue;

    for (const t of red.habilitadas(nodo.marcado)) {
      let siguiente = red.resultado(t, nodo.marcado);
      if (!siguiente) continue;

      for (const ancestro of camino) {
        const cubre = siguiente.every((v, i) => v >= ancestro[i]);
        const estricto = siguiente.some((v, i) => v > ancestro[i]);
        if (cubre && estricto) {
          siguiente = siguiente.map((v, i) => (v > ancestro[i] ? Infinity : v));
        }
      }

      const hijo = {
        id: nodos.length,
        marcado: siguiente,
        padre: nodo.id,
        nivel: nodo.nivel + 1,
        muerto: red.esMuerto(siguiente)
      };
      nodos.push(hijo);
      aristas.push({ de: nodo.id, a: hijo.id, transicion: t });
      if (nodos.length >= maxNodos) {
        truncado = true;
        break;
      }
      cola.push({ nodo: hijo, camino: [...camino, siguiente] });
    }
    if (truncado) break;
  }

  return {
    nodos,
    aristas,
    muertos: nodos.filter((n) => n.muerto),
    truncado
  };
}

export function marcadoTexto(M) {
  return M.map((v) => (v === Infinity ? 'ω' : v)).join(' ');
}
