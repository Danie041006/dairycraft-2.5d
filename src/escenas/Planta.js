import { CONFIG } from '../config.js';
import { Simulador, NIVELES } from '../juego/simulador.js';
import { GestorEntrada } from '../entrada/gestorEntrada.js';
import { aPantallaConOffset, profundidad } from '../iso/proyeccion.js';
import {
  dibujarSuelo,
  dibujarMuros,
  dibujarSilo,
  dibujarTanque,
  dibujarCaldera,
  dibujarChiller,
  dibujarEmbotelladora,
  dibujarCuartoFrio,
  dibujarToken
} from '../arte/dibujos.js';
import { PALETA, hex, colorEstado } from '../arte/paleta.js';
import { texto, FUENTE } from './estilos.js';
import { sonido } from '../audio/sonido.js';

const OX = 480;
const OY = 100;
const CELDAS = {
  silo: { x: 1, y: 7 },
  t1: { x: 5, y: 2 },
  t2: { x: 3, y: 6 },
  t3: { x: 12, y: 2 },
  caldera: { x: 2, y: 9 },
  chiller: { x: 5, y: 10 },
  embotelladora: { x: 9, y: 7 },
  cuarto: { x: 13, y: 11 }
};

const pos = (c) => aPantallaConOffset(c.x + 0.5, c.y + 0.5, 0, OX, OY);
const prof = (c, z = 0) => profundidad(c.x + 0.5, c.y + 0.5, z);

export class Planta extends Phaser.Scene {
  constructor() {
    super('Planta');
  }

  create() {
    this.cameras.main.setBackgroundColor(hex(PALETA.fondo));
    this.cameras.main.setBounds(-60, -50, 1080, 660);
    this.sim = new Simulador({ monitorActivo: false });
    this.niveles = { T1: 0.14, T2: 0.14, T3: 0.14 };
    this.estadosPrevios = { T1: 'Vacio', T2: 'Vacio', T3: 'Vacio' };
    this.tanqueSeleccionado = null;
    this.fpsVisible = false;
    this.ultimoTiempoRadar = -1;

    this.crearTexturas();
    this.crearSuelo();
    this.crearMaquinas();
    this.crearZonas();
    this.crearParticulas();
    this.crearHUDJuego();
    this.conectarEventos();
    this.crearEntrada();
    this.actualizarVista();
    this.crearTextoFPS();

    this.events.once('shutdown', () => {
      this.gestor?.destruir();
    });
  }

  // ---------- mundo ----------
  crearTexturas() {
    if (this.textures.exists('vapor')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 8);
    g.generateTexture('vapor', 16, 16);
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(10, 10, 10);
    g.generateTexture('brillo', 20, 20);
    g.destroy();
  }

  crearSuelo() {
    const g = this.add.graphics().setDepth(-100);
    dibujarSuelo(g, 14, OX, OY);
    const muros = this.add.graphics().setDepth(-90);
    dibujarMuros(muros, 14, OX, OY, 62);

    // tuberías y conductos
    const p = this.add.graphics().setDepth(-40);
    const silo = pos(CELDAS.silo);
    const t1 = pos(CELDAS.t1);
    const t2 = pos(CELDAS.t2);
    const t3 = pos(CELDAS.t3);
    const caldera = pos(CELDAS.caldera);
    const chiller = pos(CELDAS.chiller);
    const emb = pos(CELDAS.embotelladora);
    const cuarto = pos(CELDAS.cuarto);

    p.lineStyle(7, PALETA.metalClaro, 0.55);
    p.lineBetween(silo.x + 28, silo.y - 30, t1.x - 30, t1.y - 20);
    p.lineBetween(silo.x + 18, silo.y - 22, t2.x - 10, t2.y - 24);
    p.lineBetween(silo.x + 36, silo.y - 34, t3.x - 20, t3.y - 20);
    p.lineBetween(caldera.x + 40, caldera.y - 30, t2.x + 20, t2.y - 10);
    p.lineBetween(caldera.x + 42, caldera.y - 24, t3.x - 34, t3.y - 4);
    p.lineStyle(5, PALETA.frio, 0.45);
    p.lineBetween(chiller.x + 44, chiller.y - 40, t1.x - 10, t1.y - 8);
    p.lineBetween(chiller.x + 48, chiller.y - 34, t2.x + 30, t2.y - 6);
    p.lineStyle(5, PALETA.metalClaro, 0.45);
    p.lineBetween(t1.x + 20, t1.y + 2, emb.x - 60, emb.y - 8);
    p.lineBetween(t2.x + 20, t2.y + 2, emb.x - 50, emb.y - 4);
    p.lineBetween(t3.x + 10, t3.y + 2, emb.x - 70, emb.y);
    p.lineBetween(emb.x + 30, emb.y + 6, cuarto.x - 60, cuarto.y - 8);
    p.lineStyle(3, PALETA.metal, 0.35);
    p.lineBetween(silo.x, silo.y - 150, silo.x + 30, silo.y - 170);
  }

  crearMaquinas() {
    this.graficos = {};
    this.textos = {};

    const crear = (clave, celda, anchoZona = 100, altoZona = 110, zonaY = -50) => {
      const p = pos(celda);
      const g = this.add.graphics().setDepth(prof(celda, 2));
      const eta = texto(this, p.x, p.y + 14, '', {
        fontSize: '11px',
        color: hex(PALETA.texto),
        align: 'center'
      }).setOrigin(0.5, 0).setDepth(prof(celda, 3));
      eta.setShadow(0, 1, '#000000', 3);
      this.graficos[clave] = g;
      this.textos[clave] = eta;
      return { p, g, eta };
    };

    crear('silo', CELDAS.silo, 110, 170, -70);
    crear('t1', CELDAS.t1, 96, 110, -54);
    crear('t2', CELDAS.t2, 96, 110, -54);
    crear('t3', CELDAS.t3, 96, 110, -54);
    crear('caldera', CELDAS.caldera, 120, 100, -46);
    crear('chiller', CELDAS.chiller, 110, 100, -46);
    crear('embotelladora', CELDAS.embotelladora, 160, 100, -42);
    crear('cuarto', CELDAS.cuarto, 170, 120, -56);

    const pEmb = pos(CELDAS.embotelladora);
    this.textos.embotelladora.setPosition(pEmb.x - 96, pEmb.y - 46).setOrigin(0.5, 0);
    const pCuarto = pos(CELDAS.cuarto);
    this.textos.cuarto.setPosition(pCuarto.x + 84, pCuarto.y - 10).setOrigin(0, 0.5);

    this.tokens = this.add.graphics().setDepth(260);
    this.zonas = {};
  }

  crearZonas() {
    const crearZona = (clave, celda, ancho, alto, y, onClick) => {
      const p = pos(celda);
      const zona = this.add.zone(p.x, p.y + y, ancho, alto)
        .setDepth(prof(celda, 8))
        .setInteractive({ useHandCursor: true });
      zona.on('pointerdown', onClick);
      this.zonas[clave] = zona;
      return zona;
    };

    crearZona('T1', CELDAS.t1, 96, 108, -52, () => this.abrirHUD('T1'));
    crearZona('T2', CELDAS.t2, 96, 108, -52, () => this.abrirHUD('T2'));
    crearZona('T3', CELDAS.t3, 96, 108, -52, () => this.abrirHUD('T3'));
    crearZona('embotelladora', CELDAS.embotelladora, 170, 90, -40, () => this.sim.alternarEmbotelladora());
    crearZona('cuarto', CELDAS.cuarto, 160, 90, -50, () => this.abrirInspector());

    // Fondo interactivo para arrastrar la cámara y cerrar el HUD.
    this.zonaFondo = this.add.rectangle(0, 0, 2000, 1200, 0x000000, 0)
      .setOrigin(0)
      .setDepth(-95)
      .setInteractive();
  }

  crearParticulas() {
    try {
      const caldera = pos(CELDAS.caldera);
      this.emisorVapor = this.add.particles(caldera.x, caldera.y - 92, 'vapor', {
        speedY: { min: -34, max: -12 },
        speedX: { min: -8, max: 8 },
        lifespan: 1400,
        scale: { start: 0.75, end: 0 },
        alpha: { start: 0.35, end: 0 },
        frequency: 520,
        quantity: 1,
        blendMode: 'ADD'
      });
      this.emisorVapor.setDepth(prof(CELDAS.caldera, 6));
    } catch {
      this.emisorVapor = null;
    }
  }

  crearHUDJuego() {
    if (this.scene.isActive('HUDJuego')) this.scene.stop('HUDJuego');
    this.scene.launch('HUDJuego', { simulador: this.sim });
    this.scene.bringToTop('HUDJuego');
  }

  crearTextoFPS() {
    this.fpsTexto = texto(this, 12, 78, '', {
      fontSize: '10px',
      color: hex(PALETA.textoSuave),
      fontFamily: 'Consolas, monospace'
    }).setDepth(3000).setVisible(false);
  }

  // ---------- eventos del simulador ----------
  conectarEventos() {
    const sim = this.sim;
    this.suscripciones = [];
    const on = (evento, fn) => this.suscripciones.push(sim.emisor.on(evento, fn));
    on('cambio', () => this.actualizarVista());
    on('transicion', (data) => {
      this.animarTransicion(data);
      if (data.tipo === 'embotellar') sonido.botella();
      else if (data.tipo === 'fallo') sonido.fallo();
      else sonido.transicion();
    });
    on('bloqueado', () => {
      this.cameras.main.shake(180, 0.006);
      this.destelloPantalla(PALETA.fallo, 0.16);
      sonido.bloqueado();
    });
    on('logro', () => {
      this.destelloPantalla(PALETA.acento, 0.12);
      sonido.logro();
    });
    on('alerta', (a) => {
      if (a.tipo === 'fallo' || a.tipo === 'desborde') this.cameras.main.shake(140, 0.004);
    });
    on('fin', (data) => {
      if (data.motivo === 'deadlock') sonido.deadlock();
      else if (data.exito) sonido.victoria();
      else sonido.transicion();
      this.terminar(data);
    });
    on('abrir_consola', (id) => this.abrirHUD(id));
    on('pausa', (pausado) => {
      if (pausado) this.cameras.main.flash(120, 20, 30, 40);
    });
  }

  // ---------- vista ----------
  actualizarVista() {
    if (!this.sim) return;
    const M = this.sim.red.M;
    const idx = (id) => this.sim.red.idxLugar.get(id);

    // Silo
    this.graficos.silo.clear();
    const silo = pos(CELDAS.silo);
    dibujarSilo(this.graficos.silo, silo.x, silo.y, M[idx('leche')], this.sim.red.lugares[idx('leche')].k);
    const kLeche = this.sim.red.lugares[idx('leche')].k;
    this.textos.silo.setText(`Silo de leche\n${M[idx('leche')]}/${kLeche}`);
    this.textos.silo.setColor(hex(M[idx('leche')] > kLeche ? PALETA.fallo : PALETA.leche));

    // Tanques
    for (let i = 1; i <= 3; i++) {
      const id = `T${i}`;
      const clave = `t${i}`;
      const t = this.sim.tanque(id);
      const celda = CELDAS[clave];
      const p = pos(celda);
      const estado = t.automata.estado;
      this.graficos[clave].clear();
      dibujarTanque(
        this.graficos[clave],
        p.x,
        p.y,
        estado,
        this.niveles[id],
        this.scene.isActive('HUDMaquina') && this.tanqueSeleccionado === id
      );
      this.textos[clave].setText(`${t.nombre}\n${estado}`);
      this.textos[clave].setColor(hex(colorEstado(estado)));
    }

    // Caldera y frío
    const caldera = pos(CELDAS.caldera);
    this.graficos.caldera.clear();
    dibujarCaldera(this.graficos.caldera, caldera.x, caldera.y, M[idx('vapor')] > 0);
    this.textos.caldera.setText(`Caldera\nVapor: ${M[idx('vapor')]}/1`);
    this.textos.caldera.setColor(hex(M[idx('vapor')] > 0 ? PALETA.espera : PALETA.textoSuave));

    const chiller = pos(CELDAS.chiller);
    this.graficos.chiller.clear();
    dibujarChiller(this.graficos.chiller, chiller.x, chiller.y, M[idx('frio')] > 0);
    this.textos.chiller.setText(`Bomba de frío\nFrio: ${M[idx('frio')]}/1`);
    this.textos.chiller.setColor(hex(M[idx('frio')] > 0 ? PALETA.frio : PALETA.textoSuave));

    // Embotelladora
    const emb = pos(CELDAS.embotelladora);
    const enMarcha = M[idx('emb_lista')] > 0;
    this.graficos.embotelladora.clear();
    dibujarEmbotelladora(this.graficos.embotelladora, emb.x, emb.y, enMarcha ? 'Emb_lista' : 'Emb_parada');
    this.textos.embotelladora.setText(`Embotelladora\n${enMarcha ? 'En marcha' : 'Detenida'}`);
    this.textos.embotelladora.setColor(hex(enMarcha ? PALETA.operacion : PALETA.fallo));

    // Cuarto frío
    const cuarto = pos(CELDAS.cuarto);
    const kCuarto = this.sim.red.lugares[idx('cuarto')].k;
    this.graficos.cuarto.clear();
    dibujarCuartoFrio(this.graficos.cuarto, cuarto.x, cuarto.y, M[idx('cuarto')], kCuarto);
    this.textos.cuarto.setText(`Cuarto frío\n${M[idx('cuarto')]}/${kCuarto}`);
    this.textos.cuarto.setColor(hex(M[idx('cuarto')] >= kCuarto ? PALETA.fallo : PALETA.frio));

    // Tokens físicos
    this.tokens.clear();
    const t1 = pos(CELDAS.t1);
    const t2 = pos(CELDAS.t2);
    const t3 = pos(CELDAS.t3);
    const posT = { T1: t1, T2: t2, T3: t3 };
    for (const t of this.sim.tanques) {
      const p = posT[t.id];
      if (t.automata.estado === 'Pasteurizando') dibujarToken(this.tokens, 'lote', p.x + 30, p.y - 30, 1);
      if (t.automata.estado === 'Enfriando') dibujarToken(this.tokens, 'lote', p.x + 30, p.y - 30, 1);
    }
    if (M[idx('vapor')] > 0) dibujarToken(this.tokens, 'vapor', caldera.x, caldera.y - 100, 1.2);
    if (M[idx('frio')] > 0) dibujarToken(this.tokens, 'frio', chiller.x + 30, chiller.y - 88, 1);
    const cupo = M[idx('cupo')];
    for (let i = 0; i < cupo; i++) {
      dibujarToken(this.tokens, 'cupo', cuarto.x - 96 + i * 16, cuarto.y - 18, 0.75);
    }
    const botellas = Math.min(8, M[idx('botellas')]);
    for (let i = 0; i < botellas; i++) {
      dibujarToken(this.tokens, 'botella', emb.x + 74 + (i % 2) * 10, emb.y - 14 - Math.floor(i / 2) * 12, 0.7);
    }
  }

  // ---------- animaciones ----------
  crearTokenViajero(tipo, x1, y1, x2, y2, duracion = 850, escala = 1) {
    const g = this.add.graphics().setDepth(280);
    dibujarToken(g, tipo, 0, 0, escala);
    g.setPosition(x1, y1);
    this.tweens.add({
      targets: g,
      x: x2,
      y: y2,
      alpha: 0,
      duration: duracion,
      ease: 'Sine.easeInOut',
      onComplete: () => g.destroy()
    });
    return g;
  }

  animarTransicion(data) {
    if (!data) return;
    const tankPos = { T1: pos(CELDAS.t1), T2: pos(CELDAS.t2), T3: pos(CELDAS.t3) };
    const silo = pos(CELDAS.silo);
    const caldera = pos(CELDAS.caldera);
    const chiller = pos(CELDAS.chiller);
    const emb = pos(CELDAS.embotelladora);
    const cuarto = pos(CELDAS.cuarto);
    const tp = tankPos[data.tanque] ?? pos(CELDAS.t1);

    switch (data.tipo) {
      case 'llegada_leche':
        this.crearTokenViajero('leche', silo.x - 30, silo.y - 132, silo.x - 30, silo.y - 30, 700, 0.9);
        break;
      case 'llenar':
        this.crearTokenViajero('leche', silo.x + 20, silo.y - 40, tp.x - 10, tp.y - 30, 700, 0.8);
        break;
      case 'iniciar_past':
        this.crearTokenViajero('leche', silo.x + 22, silo.y - 40, tp.x - 8, tp.y - 40, 700, 0.8);
        this.crearTokenViajero('vapor', caldera.x + 30, caldera.y - 60, tp.x + 10, tp.y - 60, 900, 0.9);
        this.explosionVapor(tp.x, tp.y - 70, 5);
        break;
      case 'fin_past':
        this.crearTokenViajero('vapor', tp.x, tp.y - 80, caldera.x, caldera.y - 70, 900, 0.8);
        this.explosionVapor(tp.x, tp.y - 80, 4);
        break;
      case 'descargar':
        this.crearTokenViajero('lote', tp.x + 20, tp.y - 30, cuarto.x - 40, cuarto.y - 40, 950, 1);
        this.crearTokenViajero('frio', chiller.x + 20, chiller.y - 50, tp.x, tp.y - 30, 900, 0.7);
        break;
      case 'embotellar':
        this.crearTokenViajero('lote', cuarto.x - 40, cuarto.y - 50, emb.x + 30, emb.y - 30, 850, 1);
        this.crearTokenViajero('botella', emb.x + 30, emb.y - 30, emb.x + 80, emb.y - 10, 700, 0.8);
        this.puntosFlotantes(emb.x + 40, emb.y - 70, `+${CONFIG.PUNTOS.botella}`, PALETA.botella);
        break;
      case 't_parar_emb':
      case 't_arrancar_emb':
        this.destello(emb.x + 66, emb.y - 54, 24, data.tipo === 't_parar_emb' ? PALETA.fallo : PALETA.operacion);
        break;
      case 'fallo':
        this.destello(tp.x, tp.y - 50, 42, PALETA.fallo);
        this.puntosFlotantes(tp.x, tp.y - 90, `−${Math.abs(CONFIG.PUNTOS.fallo)}`, PALETA.fallo);
        break;
      case 'iniciar_CIP':
        this.destello(tp.x, tp.y - 50, 42, PALETA.mantenimiento);
        this.burbujas(tp.x, tp.y - 60);
        break;
      case 'CIP_ok':
        this.destello(tp.x, tp.y - 50, 50, PALETA.operacion);
        this.burbujas(tp.x, tp.y - 70);
        break;
      default:
        break;
    }
  }

  explosionVapor(x, y, cantidad = 4) {
    if (!this.emisorVapor) return;
    try {
      this.emisorVapor.explode(cantidad, x, y);
    } catch {
      // La versión de Phaser puede no exponer explode; las partículas continuas siguen.
    }
  }

  burbujas(x, y) {
    for (let i = 0; i < 6; i++) {
      const b = this.add.circle(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 30, 3 + Math.random() * 3, PALETA.frio, 0.7).setDepth(270);
      this.tweens.add({
        targets: b,
        y: b.y - 35 - Math.random() * 25,
        alpha: 0,
        duration: 700 + Math.random() * 400,
        onComplete: () => b.destroy()
      });
    }
  }

  destello(x, y, radio, color) {
    const c = this.add.circle(x, y, radio, color, 0.25).setDepth(265);
    this.tweens.add({
      targets: c,
      scale: 1.8,
      alpha: 0,
      duration: 500,
      onComplete: () => c.destroy()
    });
  }

  puntosFlotantes(x, y, textoPunto, color) {
    const t = texto(this, x, y, textoPunto, {
      fontSize: '14px',
      color: hex(color),
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(290);
    this.tweens.add({
      targets: t,
      y: y - 34,
      alpha: 0,
      duration: 900,
      onComplete: () => t.destroy()
    });
  }

  destelloPantalla(color, alpha = 0.12) {
    const r = this.add.rectangle(0, 0, 960, 540, color, alpha).setOrigin(0).setDepth(2959);
    this.tweens.add({ targets: r, alpha: 0, duration: 450, onComplete: () => r.destroy() });
  }

  // ---------- paneles ----------
  abrirHUD(id) {
    if (this.scene.isActive('Inspector')) return;
    if (this.scene.isActive('HUDMaquina')) this.scene.stop('HUDMaquina');
    this.tanqueSeleccionado = id;
    this.actualizarVista();
    this.scene.launch('HUDMaquina', { simulador: this.sim, tanqueId: id });
    this.scene.bringToTop('HUDMaquina');
  }

  abrirInspector() {
    if (this.scene.isActive('Inspector')) return;
    this.scene.launch('Inspector', { simulador: this.sim });
    this.scene.bringToTop('Inspector');
  }

  cerrarHUD() {
    if (this.scene.isActive('HUDMaquina')) this.scene.stop('HUDMaquina');
    this.tanqueSeleccionado = null;
    this.actualizarVista();
  }

  terminar(data) {
    this.scene.launch('Resultados', { simulador: this.sim, data });
    this.scene.bringToTop('Resultados');
    this.scene.pause();
  }

  // ---------- entrada ----------
  crearEntrada() {
    this.gestor = new GestorEntrada(this);
    this.gestor.on((accion) => this.ejecutarAccion(accion));
    this.input.on('pointerdown', () => sonido.asegurar());
    this.input.keyboard.on('keydown', () => sonido.asegurar());
  }

  consolaAbierta() {
    const hud = this.scene.get('HUDMaquina');
    return this.scene.isActive('HUDMaquina') && hud?.consolaActiva;
  }

  ejecutarAccion(accion) {
    switch (accion.tipo) {
      case 'pausa':
        if (this.consolaAbierta()) return;
        this.sim.pausar();
        break;
      case 'inspector':
        this.abrirInspector();
        break;
      case 'velocidad':
        this.sim.setVelocidad(accion.valor);
        break;
      case 'cerrar':
        if (this.scene.isActive('HUDMaquina')) this.cerrarHUD();
        break;
      case 'fps':
        this.fpsVisible = !this.fpsVisible;
        this.fpsTexto?.setVisible(this.fpsVisible);
        break;
      case 'clicFondo':
        if (this.scene.isActive('HUDMaquina')) this.cerrarHUD();
        break;
      case 'camara':
        this.cameras.main.scrollX -= accion.dx / this.cameras.main.zoom;
        this.cameras.main.scrollY -= accion.dy / this.cameras.main.zoom;
        break;
      case 'zoom': {
        const z = Phaser.Math.Clamp(this.cameras.main.zoom - accion.delta * 0.0015, 0.85, 1.8);
        this.cameras.main.setZoom(z);
        break;
      }
      default:
        break;
    }
  }

  update(time, delta) {
    if (!this.sim) return;
    this.sim.actualizar(delta / 1000);

    // Niveles de los tanques con easing
    let redibujar = false;
    for (let i = 1; i <= 3; i++) {
      const id = `T${i}`;
      const t = this.sim.tanque(id);
      const objetivo = NIVELES[t.automata.estado] ?? 0.2;
      const diferencia = objetivo - this.niveles[id];
      if (Math.abs(diferencia) > 0.001) {
        this.niveles[id] += diferencia * 0.12;
        redibujar = true;
      }
      if (this.estadosPrevios[id] !== t.automata.estado) {
        this.estadosPrevios[id] = t.automata.estado;
        redibujar = true;
      }
    }
    if (redibujar) this.actualizarVista();

    if (this.scene.isActive('HUDMaquina') === false && this.tanqueSeleccionado) {
      this.tanqueSeleccionado = null;
      this.actualizarVista();
    }

    if (this.fpsTexto) {
      const fps = Math.round(this.game.loop.actualFps);
      const restante = this.sim.tiempoRestante();
      this.fpsTexto.setText(
        `F1  fps: ${fps}  ·  sim: ${this.sim.reloj.tiempo.toFixed(1)} s  ·  restante: ${restante.toFixed(0)} s  ·  x${this.sim.velocidad}${this.sim.pausado ? '  · PAUSA' : ''}`
      );
    }
  }
}
