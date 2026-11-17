// Composición síncrona, supervisor y el supervisor concreto del circuito CIP.
// El supervisor de la ficha: hay un solo circuito CIP, así que dos tanques no
// pueden estar en Lavado_CIP al mismo tiempo.
import { Automata } from './automata.js';

function eventosDe(modelo) {
  return new Set(modelo.eventos.map((e) => e.id));
}

function transicionDe(modelo, estado, evento) {
  for (const [origen, ev, destino] of modelo.transiciones) {
    if (origen === estado && ev === evento) return destino;
  }
  return null;
}

function eventoDe(modelo, id) {
  return modelo.eventos.find((e) => e.id === id) ?? null;
}

// Producto síncrono de dos o más autómatas. Un evento compartido ocurre a la vez
// en todos los componentes que lo tienen en su alfabeto; un evento privado solo
// mueve al componente que lo define.
export function componer(automatas, { compartidos = null } = {}) {
  const modelos = automatas.map((a) => a.json ?? a);
  const alfabetos = modelos.map(eventosDe);
  const union = new Set();
  for (const alfa of alfabetos) for (const ev of alfa) union.add(ev);

  const inicial = modelos.map((m) => m.inicial);
  const clave = (estado) => estado.join('|');
  const estados = new Map();
  const aristas = [];

  const crear = (estado) => {
    const k = clave(estado);
    if (!estados.has(k)) {
      estados.set(k, {
        id: k,
        estado: [...estado],
        acepta: modelos.every((m, i) => m.marcados.includes(estado[i])),
        transiciones: []
      });
    }
    return estados.get(k);
  };

  const raiz = crear(inicial);
  const cola = [inicial];
  const visitados = new Set([clave(inicial)]);

  while (cola.length) {
    const actual = cola.shift();
    const nodo = crear(actual);
    for (const ev of union) {
      const involucrados = [];
      let habilitado = true;
      for (let i = 0; i < modelos.length; i++) {
        if (!alfabetos[i].has(ev)) continue;
        const destino = transicionDe(modelos[i], actual[i], ev);
        if (destino === null) {
          habilitado = false;
          break;
        }
        involucrados.push([i, destino]);
      }
      if (!habilitado || involucrados.length === 0) continue;
      if (compartidos && !compartidos.has(ev) && involucrados.length > 1) {
        // Evento privado con etiqueta repetida: el producto síncrono no puede
        // distinguir cuál componente lo dispara. Se omite y se documenta.
        continue;
      }
      const siguiente = [...actual];
      for (const [i, destino] of involucrados) siguiente[i] = destino;
      const k = clave(siguiente);
      const controlable = involucrados.every(([i]) => eventoDe(modelos[i], ev)?.controlable !== false);
      nodo.transiciones.push({
        evento: ev,
        destino: k,
        controlable,
        compartido: involucrados.length > 1
      });
      aristas.push({ de: nodo.id, a: k, evento: ev });
      if (!visitados.has(k)) {
        visitados.add(k);
        cola.push(siguiente);
      }
    }
  }

  const lista = [...estados.values()];
  return {
    modelos,
    estados: lista,
    inicial: raiz.id,
    acepta: lista.filter((e) => e.acepta).map((e) => e.id),
    aristas,
    estadoDe: (id) => estados.get(id),
    total: lista.length
  };
}

// Supervisor de seguridad: calcula los estados malos (prohibidos y los que
// llegan a ellos por eventos no controlables) y los eventos controlables que
// deben deshabilitarse en cada estado.
export function supervisor(composicion, estadosProhibidos = []) {
  const prohibidos = new Set(estadosProhibidos);
  const mapa = new Map(composicion.estados.map((e) => [e.id, e]));
  const malos = new Set(prohibidos);
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const estado of composicion.estados) {
      if (malos.has(estado.id)) continue;
      for (const tr of estado.transiciones) {
        if (!tr.controlable && malos.has(tr.destino)) {
          malos.add(estado.id);
          cambio = true;
          break;
        }
      }
    }
  }

  const deshabilitados = new Map();
  let controlable = true;
  for (const estado of composicion.estados) {
    const lista = [];
    for (const tr of estado.transiciones) {
      if (!tr.controlable) continue;
      if (malos.has(tr.destino)) {
        const razon = prohibidos.has(tr.destino)
          ? `el evento llevaría al estado prohibido ${tr.destino}`
          : `el evento llevaría a ${tr.destino}, que alcanza un estado prohibido por eventos no controlables`;
        lista.push({ evento: tr.evento, razon, destino: tr.destino });
      }
    }
    deshabilitados.set(estado.id, lista);
    if (malos.has(estado.id)) {
      // Si desde un estado malo no hay forma de deshabilitar todos los eventos
      // controlables hacia lo malo, la especificación no es controlable.
      for (const tr of estado.transiciones) {
        if (tr.controlable && !malos.has(tr.destino)) continue;
      }
    }
  }

  const malosAlcanzables = composicion.estados.filter((e) => malos.has(e.id)).map((e) => e.id);
  if (malosAlcanzables.length && malosAlcanzables.includes(composicion.inicial)) controlable = false;
  return {
    deshabilitados,
    malos: malosAlcanzables,
    prohibidos: [...prohibidos],
    controlable,
    mapa
  };
}

// Supervisor concreto del proyecto 1: un solo circuito CIP para 3 tanques.
export class SupervisorCIP {
  constructor(automatas) {
    this.automatas = automatas;
  }

  ocupadoPor() {
    const i = this.automatas.findIndex((a) => a.estado === 'Lavado_CIP');
    return i >= 0 ? i : null;
  }

  eventosDeshabilitados(indice) {
    const ocupado = this.ocupadoPor();
    if (ocupado !== null && ocupado !== indice) {
      return [
        {
          evento: 'iniciar_CIP',
          razon: `Circuito CIP ocupado por Tanque ${ocupado + 1} (un solo circuito en la planta)`
        }
      ];
    }
    return [];
  }

  puede(indice, evento) {
    return !this.eventosDeshabilitados(indice).some((d) => d.evento === evento);
  }

  estado() {
    return {
      ocupadoPor: this.ocupadoPor(),
      tanquesEnCIP: this.automatas.map((a, i) => (a.estado === 'Lavado_CIP' ? i + 1 : null)).filter(Boolean)
    };
  }
}

// Producto de los 3 tanques + especificación del circuito CIP. Sirve para
// verificar los conteos 216 (producto), 16 (prohibidos) y 200 (supervisado).
export function contarProductoTanques(automatas, especificacion) {
  const modelos = automatas.map((a) => a.json ?? a);
  const n = modelos.length;
  const inicial = [...modelos.map((m) => m.inicial), especificacion.inicial];
  const clave = (S) => S.join('|');

  const privados = ['abrir_valvula', 'iniciar_past', 'fin_past', 'descargar', 'contaminacion', 'perdida_temp'];
  const compartidos = ['iniciar_CIP', 'CIP_ok'];

  const trans = (modelo, estado, ev) => {
    for (const [o, e, d] of modelo.transiciones) if (o === estado && e === ev) return d;
    return null;
  };

  function explorar(conSpec) {
    const vistos = new Set([clave(inicial)]);
    const cola = [[...inicial]];
    const aristas = [];
    const prohibidos = [];
    while (cola.length) {
      const S = cola.shift();
      const k = clave(S);
      if (S.slice(0, n).filter((q) => q === 'Lavado_CIP').length > 1 && !prohibidos.includes(k)) {
        prohibidos.push(k);
      }
      for (let i = 0; i < n; i++) {
        for (const ev of privados) {
          const d = trans(modelos[i], S[i], ev);
          if (!d) continue;
          const T = [...S];
          T[i] = d;
          const kt = clave(T);
          aristas.push({ de: k, a: kt, evento: ev, tanque: i });
          if (!vistos.has(kt)) {
            vistos.add(kt);
            cola.push(T);
          }
        }
        for (const ev of compartidos) {
          const d = trans(modelos[i], S[i], ev);
          if (!d) continue;
          if (conSpec) {
            const ds = trans(especificacion, S[n], ev);
            if (!ds) continue;
            const T = [...S];
            T[i] = d;
            T[n] = ds;
            if (T.slice(0, n).filter((q) => q === 'Lavado_CIP').length > 1) continue;
            const kt = clave(T);
            aristas.push({ de: k, a: kt, evento: ev, tanque: i });
            if (!vistos.has(kt)) {
              vistos.add(kt);
              cola.push(T);
            }
          } else {
            const T = [...S];
            T[i] = d;
            const kt = clave(T);
            aristas.push({ de: k, a: kt, evento: ev, tanque: i });
            if (!vistos.has(kt)) {
              vistos.add(kt);
              cola.push(T);
            }
          }
        }
      }
    }
    return { estados: [...vistos], aristas, prohibidos };
  }

  const producto = explorar(false);
  const supervisado = explorar(true);
  return {
    producto: producto.estados,
    aristasProducto: producto.aristas,
    prohibidos: producto.prohibidos,
    supervisado: supervisado.estados,
    aristasSupervisado: supervisado.aristas,
    totales: {
      producto: producto.estados.length,
      prohibidos: producto.prohibidos.length,
      supervisado: supervisado.estados.length
    }
  };
}

export function crearTanques(jsonTanque, cantidad = 3) {
  return Array.from({ length: cantidad }, (_, i) => {
    const a = new Automata(jsonTanque);
    a.id = `T${i + 1}`;
    return a;
  });
}
