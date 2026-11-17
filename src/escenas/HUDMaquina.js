import tanqueJson from '../sed/modelos/tanque.json' with { type: 'json' };
import reparacionJson from '../sed/modelos/reparacion.json' with { type: 'json' };
import { Lenguaje } from '../sed/lenguaje.js';
import { PALETA, hex, colorEstado } from '../arte/paleta.js';
import { dibujarArista, dibujarNodo } from '../arte/dibujos.js';
import { texto, boton, panel, FUENTE, MONO } from './estilos.js';

const ORIGEN = { x: 552, y: 62 };
const R = 21;
const PUNTOS = tanqueJson.posiciones;
const nodoPos = (estado) => ({
  x: ORIGEN.x + (PUNTOS[estado]?.[0] ?? 180),
  y: ORIGEN.y + (PUNTOS[estado]?.[1] ?? 180)
});

const CURVAS = {
  'Enfriando>Vacio': 78,
  'Llenando>Fallo': -28,
  'Pasteurizando>Fallo': 0,
  'Enfriando>Fallo': 55,
  'Fallo>Lavado_CIP': 0,
  'Lavado_CIP>Vacio': 92,
  'Vacio>Llenando': 0,
  'Llenando>Pasteurizando': 0,
  'Pasteurizando>Enfriando': 0
};

function construirAristas() {
  const mapa = new Map();
  const lista = [];
  for (const [origen, eventoId, destino] of tanqueJson.transiciones) {
    const clave = `${origen}>${destino}`;
    if (!mapa.has(clave)) {
      const item = { origen, destino, codigos: [], clave };
      mapa.set(clave, item);
      lista.push(item);
    }
    const ev = tanqueJson.eventos.find((e) => e.id === eventoId);
    if (ev && !mapa.get(clave).codigos.includes(ev.codigo)) mapa.get(clave).codigos.push(ev.codigo);
  }
  return lista;
}

const ARISTAS = construirAristas();

export class HUDMaquina extends Phaser.Scene {
  constructor() {
    super('HUDMaquina');
  }

  init(data) {
    this.sim = data.simulador;
    this.tanqueId = data.tanqueId;
    this.suscripciones = [];
    this.lenguaje = new Lenguaje(reparacionJson);
    this.palabra = '';
    this.error = '';
    this.consolaActiva = false;
    this.estadoAnterior = null;
    this.firmaGrafo = null;
    this.eventosActuales = [];
    this.eventoResaltado = null;
    this.botonesEventos = [];
    this.consolaObjetos = [];
  }

  create() {
    // Fondo interactivo del panel: aísla los clics de la planta.
    this.add.rectangle(742, 266, 428, 524, 0x000000, 0.001)
      .setDepth(0)
      .setInteractive();

    panel(this, 528, 4, 428, 524);
    this.tanque = this.sim.tanque(this.tanqueId);
    this.nombreTexto = texto(this, 552, 24, this.tanque.nombre, {
      fontSize: '17px',
      color: hex(PALETA.leche),
      fontStyle: 'bold'
    });
    this.estadoTexto = texto(this, 552, 45, this.tanque.automata.estado, {
      fontSize: '12px',
      color: hex(PALETA.textoSuave)
    });
    this.cerrarBoton = boton(this, 928, 32, 24, 24, '×', () => this.cerrar(), {
      color: PALETA.metalOscuro,
      hover: PALETA.fallo,
      fontSize: '14px'
    });

    this.graficosGrafo = this.add.graphics().setDepth(10);
    this.graficosFlash = this.add.graphics().setDepth(12);
    this.crearGrafoEstatico();
    this.crearConsola();
    this.crearTextosInferiores();
    this.conectarEventos();
    this.actualizar(true);

    this.input.keyboard.on('keydown', (event) => this.tecla(event));
    this.events.once('shutdown', () => {
      for (const off of this.suscripciones) off();
      this.suscripciones = [];
    });
  }

  crearGrafoEstatico() {
    // Etiquetas de los estados
    for (const estado of tanqueJson.estados) {
      const p = nodoPos(estado);
      texto(this, p.x, p.y + R + 5, estado, {
        fontSize: '9px',
        color: hex(PALETA.textoSuave),
        align: 'center'
      }).setOrigin(0.5, 0).setDepth(11);
    }

    // Etiquetas de las aristas (se dibujan aparte del grafo dinámico)
    this.etiquetasAristas = [];
    for (const arista of ARISTAS) {
      const a = nodoPos(arista.origen);
      const b = nodoPos(arista.destino);
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const largo = Math.hypot(dx, dy) || 1;
      const x1 = a.x + (dx / largo) * (R + 3);
      const y1 = a.y + (dy / largo) * (R + 3);
      const x2 = b.x - (dx / largo) * (R + 5);
      const y2 = b.y - (dy / largo) * (R + 5);
      const g = this.add.graphics().setDepth(9);
      const punto = dibujarArista(g, x1, y1, x2, y2, PALETA.panelBorde, CURVAS[arista.clave] ?? 0, 1.5, 0.9);
      const t = texto(this, punto.x, punto.y, arista.codigos.join(','), {
        fontSize: '8px',
        color: hex(PALETA.acento),
        fontFamily: MONO,
        align: 'center'
      }).setOrigin(0.5).setDepth(13);
      t.setShadow(0, 0, '#000000', 3);
      this.etiquetasAristas.push(t);
    }

    // Flecha de estado inicial
    const v = nodoPos('Vacio');
    const g = this.add.graphics().setDepth(13);
    g.lineStyle(1.5, PALETA.textoSuave, 0.9);
    g.lineBetween(v.x, v.y - R - 22, v.x, v.y - R - 4);
    g.fillStyle(PALETA.textoSuave, 0.9);
    g.fillTriangle(v.x, v.y - R - 2, v.x - 4, v.y - R - 9, v.x + 4, v.y - R - 9);
    texto(this, v.x + 6, v.y - R - 28, 'inicio', {
      fontSize: '8px',
      color: hex(PALETA.textoSuave)
    });
  }

  crearTextosInferiores() {
    this.historialTexto = texto(this, 552, 490, '', {
      fontSize: '9px',
      color: hex(PALETA.textoSuave),
      fontFamily: MONO,
      wordWrap: { width: 380 }
    });
    this.razonTexto = texto(this, 552, 508, '', {
      fontSize: '8px',
      color: hex(PALETA.textoSuave),
      wordWrap: { width: 380 }
    });
  }

  crearConsola() {
    const visible = false;
    this.consolaTitulo = texto(this, 552, 424, 'CONSOLA CIP · escribe P S E A Z', {
      fontSize: '10px',
      color: hex(PALETA.acento),
      fontStyle: 'bold'
    }).setVisible(visible);
    this.consolaPalabra = texto(this, 552, 440, '', {
      fontSize: '18px',
      color: hex(PALETA.leche),
      fontFamily: MONO,
      fontStyle: 'bold'
    }).setVisible(visible);
    this.consolaDFA = texto(this, 938, 440, '', {
      fontSize: '10px',
      color: hex(PALETA.textoSuave),
      fontFamily: MONO
    }).setOrigin(1, 0).setVisible(visible);
    this.consolaError = texto(this, 552, 508, '', {
      fontSize: '8px',
      color: hex(PALETA.fallo),
      wordWrap: { width: 380 }
    }).setVisible(visible);

    const comandos = ['P', 'S', 'E', 'A', 'Z'];
    this.consolaObjetos.push(this.consolaTitulo, this.consolaPalabra, this.consolaDFA, this.consolaError);
    comandos.forEach((s, i) => {
      const b = boton(this, 572 + i * 42, 468, 36, 24, s, () => this.agregarSimbolo(s), {
        color: PALETA.metalOscuro,
        hover: PALETA.mantenimiento,
        fontSize: '12px',
        textoColor: PALETA.leche
      });
      b.fondo.setVisible(visible);
      b.label.setVisible(visible);
      this.consolaObjetos.push(b);
    });
    const validar = boton(this, 800, 468, 70, 24, 'Validar', () => this.validar(), {
      color: PALETA.operacion,
      hover: 0x38b86c,
      fontSize: '10px',
      textoColor: PALETA.leche
    });
    const borrar = boton(this, 872, 468, 58, 24, 'Borrar', () => this.borrar(), {
      color: PALETA.metalOscuro,
      hover: PALETA.panelBorde,
      fontSize: '9px'
    });
    const ayuda = boton(this, 938, 468, 56, 24, 'Ayuda', () => this.ayuda(), {
      color: PALETA.metalOscuro,
      hover: PALETA.acento,
      fontSize: '9px'
    });
    for (const b of [validar, borrar, ayuda]) {
      b.fondo.setVisible(visible);
      b.label.setVisible(visible);
      this.consolaObjetos.push(b);
    }
    this.consolaAyuda = texto(this, 552, 498, '', {
      fontSize: '8px',
      color: hex(PALETA.acento),
      wordWrap: { width: 380 }
    }).setVisible(visible);
    this.consolaObjetos.push(this.consolaAyuda);
  }

  conectarEventos() {
    this.suscripciones.push(this.sim.emisor.on('cambio', () => this.actualizar(false)));
    this.suscripciones.push(this.sim.emisor.on('fin', () => this.actualizar(false)));
  }

  tecla(event) {
    if (!this.consolaActiva) {
      if (event.key === 'Escape') this.cerrar();
      return;
    }
    const k = event.key.toUpperCase();
    if ('PSEAZ'.includes(k) && k.length === 1) {
      event.stopPropagation?.();
      this.agregarSimbolo(k);
    } else if (k === 'ENTER') {
      event.preventDefault?.();
      this.validar();
    } else if (k === 'BACKSPACE') {
      event.preventDefault?.();
      this.borrar();
    } else if (k === 'ESCAPE') {
      this.cerrar();
    }
  }

  agregarSimbolo(s) {
    const r = this.lenguaje.avanzar(s);
    if (!r.ok) {
      this.error = r.motivo;
    } else {
      this.error = '';
      this.palabra = this.lenguaje.palabra;
    }
    this.actualizarConsola();
  }

  borrar() {
    this.palabra = this.palabra.slice(0, -1);
    this.lenguaje.reiniciar();
    for (const ch of this.palabra) this.lenguaje.avanzar(ch);
    this.error = '';
    this.actualizarConsola();
  }

  validar() {
    if (!this.palabra) {
      this.error = 'Escribe al menos la palabra P antes de validar.';
      this.actualizarConsola();
      return;
    }
    const r = this.sim.reparar(this.tanqueId, this.palabra);
    if (r.ok) {
      this.palabra = '';
      this.error = '';
      this.lenguaje.reiniciar();
    } else {
      this.error = 'La palabra no pertenece a L; la máquina sigue en Lavado_CIP.';
    }
    this.actualizarConsola();
    this.actualizar(false);
  }

  ayuda() {
    this.sim.pedirAyuda(this.tanqueId);
    this.actualizar(false);
  }

  cerrar() {
    this.scene.stop();
  }

  actualizar(inicial = false) {
    const t = this.sim.tanque(this.tanqueId);
    if (!t) return;
    const estado = t.automata.estado;
    const eventos = this.sim.eventosHUD(this.tanqueId);
    this.eventosActuales = eventos;
    const firma = `${estado}|${t.automata.historial.length}`;
    const cambioEstado = estado !== this.estadoAnterior;
    this.estadoAnterior = estado;
    this.consolaActiva = estado === 'Lavado_CIP';

    this.nombreTexto.setText(t.nombre);
    this.estadoTexto.setText(`${estado}  ·  ${t.automata.historialCodigos(10).join(' ') || 'sin eventos'}`);
    this.estadoTexto.setColor(hex(colorEstado(estado)));

    if (inicial || cambioEstado) {
      this.lenguaje = new Lenguaje(reparacionJson);
      this.palabra = '';
      this.error = '';
    }
    if (firma !== this.firmaGrafo) {
      this.firmaGrafo = firma;
      this.dibujarGrafo(estado, t.automata.historial[t.automata.historial.length - 1]);
    }
    this.crearBotonesEventos(eventos);
    this.actualizarConsola();
    this.actualizarVisibilidad();
    this.historialTexto.setText(`Historial (10): ${t.automata.historialCodigos(10).join(' ')}`);
    const resaltado = eventos.find((e) => e.id === this.eventoResaltado);
    const rojo = eventos.find((e) => e.color === 'rojo');
    this.razonTexto.setText(resaltado?.razon ?? rojo?.razon ?? 'Todos los eventos del estado actual están disponibles.');
    this.razonTexto.setColor(hex(resaltado && !resaltado.habilitado ? PALETA.fallo : PALETA.textoSuave));
  }

  actualizarVisibilidad() {
    const visible = this.consolaActiva;
    for (const obj of this.consolaObjetos) {
      if (obj.fondo) {
        obj.fondo.setVisible(visible);
        obj.label.setVisible(visible);
      } else {
        obj.setVisible(visible);
      }
    }
    this.historialTexto.setVisible(!visible);
    this.razonTexto.setVisible(!visible);
    for (const b of this.botonesEventos) {
      b.fondo.setVisible(!visible);
      b.label.setVisible(!visible);
    }
    if (visible) {
      const t = this.sim.tanque(this.tanqueId);
      this.consolaAyuda.setText(t.ayuda ? `L = ${reparacionJson.regex}  ·  ${this.sim.tanque(this.tanqueId).ayuda ? 'ayuda mostrada (−5 pts)' : ''}` : 'P preenjuague · S soda · E enjuague · A ácido · Z sanitizar');
    }
  }

  actualizarConsola() {
    this.consolaPalabra.setText(this.palabra || '· · ·');
    this.consolaDFA.setText(`DFA: ${this.lenguaje.estado}${this.lenguaje.esValida() ? ' ✓' : ''}`);
    this.consolaDFA.setColor(hex(this.lenguaje.esValida() ? PALETA.operacion : PALETA.textoSuave));
    if (this.error) {
      this.consolaError.setText(this.error);
      this.consolaError.setColor(hex(PALETA.fallo));
    } else {
      this.consolaError.setText(`Esperado: ${this.lenguaje.siguientes().join(' / ') || '—'}`);
      this.consolaError.setColor(hex(PALETA.textoSuave));
    }
  }

  dibujarGrafo(estado, ultimoEvento) {
    this.graficosGrafo.clear();
    // nodos
    for (const q of tanqueJson.estados) {
      const p = nodoPos(q);
      dibujarNodo(this.graficosGrafo, p.x, p.y, {
        actual: q === estado,
        marcado: tanqueJson.marcados.includes(q),
        color: colorEstado(q),
        r: R
      });
    }

    // flash de la última transición
    this.graficosFlash.clear();
    if (ultimoEvento) {
      for (const [origen, eventoId, destino] of tanqueJson.transiciones) {
        if (eventoId !== ultimoEvento) continue;
        const a = nodoPos(origen);
        const b = nodoPos(destino);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const largo = Math.hypot(dx, dy) || 1;
        const x1 = a.x + (dx / largo) * (R + 2);
        const y1 = a.y + (dy / largo) * (R + 2);
        const x2 = b.x - (dx / largo) * (R + 4);
        const y2 = b.y - (dy / largo) * (R + 4);
        const valor = { alpha: 1 };
        const curva = CURVAS[`${origen}>${destino}`] ?? 0;
        this.tweens.add({
          targets: valor,
          alpha: 0,
          duration: 500,
          onUpdate: () => {
            this.graficosFlash.clear();
            dibujarArista(this.graficosFlash, x1, y1, x2, y2, PALETA.acento, curva, 3, valor.alpha * 0.8);
          },
          onComplete: () => this.graficosFlash.clear()
        });
        break;
      }
    }
  }

  crearBotonesEventos(eventos) {
    const ids = eventos.map((e) => e.id).join(',');
    if (this.idsEventos === ids && this.botonesEventos.length === eventos.length) {
      eventos.forEach((ev, i) => {
        const b = this.botonesEventos[i];
        const color =
          ev.color === 'verde' ? PALETA.operacion :
          ev.color === 'rojo' ? PALETA.fallo :
          PALETA.metalOscuro;
        b.setColor(color);
      });
      return;
    }
    for (const b of this.botonesEventos) b.destruir();
    this.botonesEventos = [];
    this.idsEventos = ids;
    eventos.forEach((ev, i) => {
      const color =
        ev.color === 'verde' ? PALETA.operacion :
        ev.color === 'rojo' ? PALETA.fallo :
        PALETA.metalOscuro;
      const b = boton(this, 742, 426 + i * 26, 380, 23, `${ev.codigo} · ${ev.nombre}`, () => {
        if (!ev.controlable) {
          this.eventoResaltado = ev.id;
          return;
        }
        this.sim.solicitarEvento(this.tanqueId, ev.id);
        this.actualizar(false);
      }, {
        color,
        hover: ev.color === 'rojo' ? 0xa83232 : PALETA.panelBorde,
        fontSize: '10px',
        textoColor: PALETA.texto
      });
      b.fondo.on('pointerover', () => {
        this.eventoResaltado = ev.id;
      });
      b.fondo.on('pointerout', () => {
        this.eventoResaltado = null;
      });
      b.fondo.setDepth(14);
      b.label.setDepth(15);
      this.botonesEventos.push(b);
    });
  }

  update() {
    if (!this.sim) return;
    this.actualizar(false);
  }
}
