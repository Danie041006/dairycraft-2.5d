import { CONFIG } from '../config.js';
import { PALETA, hex } from '../arte/paleta.js';
import { texto, boton, panel, formatoTiempo, separar, FUENTE, MONO } from './estilos.js';
import { dibujarToken } from '../arte/dibujos.js';

const NOMBRES_CORTOS = {
  leche: 'Leche_cruda',
  tanque: 'Tanque_libre',
  vapor: 'Vapor_disp',
  frio: 'Frio_disp',
  lote_past: 'Lote_past',
  lote_enfr: 'Lote_enfr',
  cuarto: 'Cuarto_frio',
  emb_lista: 'Emb_lista',
  emb_parada: 'Emb_parada',
  botellas: 'Botellas',
  cupo: 'Cupo_frio'
};

const COLOR_ALERTA = {
  fallo: PALETA.fallo,
  desborde: PALETA.fallo,
  deadlock: PALETA.fallo,
  bloqueo: 0xf08a3c,
  espera: PALETA.espera,
  ok: PALETA.operacion,
  logro: PALETA.acento,
  info: PALETA.textoSuave,
  modelo: PALETA.fallo
};

export class HUDJuego extends Phaser.Scene {
  constructor() {
    super('HUDJuego');
  }

  init(data) {
    this.sim = data.simulador;
    this.suscripciones = [];
  }

  create() {
    this.scene.setVisible(true);
    this.crearPaneles();
    this.crearBotones();
    this.crearTextos();
    this.crearRadar();
    this.crearAlertas();
    this.crearToast();
    this.conectarEventos();
    this.actualizar(true);
    this.events.once('shutdown', () => {
      for (const off of this.suscripciones) off();
      this.suscripciones = [];
    });
  }

  crearPaneles() {
    panel(this, 8, 8, 230, 66);
    panel(this, 248, 8, 280, 58);
    panel(this, 760, 8, 192, 124);
    panel(this, 8, 376, 258, 156);
    panel(this, 694, 376, 258, 156);
  }

  crearTextos() {
    this.turnoTexto = texto(this, 20, 14, 'TURNO 1 / 1', {
      fontSize: '10px',
      color: hex(PALETA.acento)
    });
    this.relojTexto = texto(this, 20, 28, '03:00', {
      fontSize: '24px',
      color: hex(PALETA.leche),
      fontFamily: MONO,
      fontStyle: 'bold'
    });
    this.estadoTexto = texto(this, 20, 58, 'x1 · en marcha', {
      fontSize: '10px',
      color: hex(PALETA.textoSuave)
    });

    texto(this, 260, 14, 'PUNTAJE', {
      fontSize: '10px',
      color: hex(PALETA.textoSuave)
    });
    this.puntajeTexto = texto(this, 260, 24, '0', {
      fontSize: '22px',
      color: hex(PALETA.acento),
      fontFamily: MONO,
      fontStyle: 'bold'
    });
    this.lotesTexto = texto(this, 356, 30, 'Lotes 0/6', {
      fontSize: '12px',
      color: hex(PALETA.texto)
    });
    this.metaTexto = texto(this, 356, 46, 'meta: 6 lotes', {
      fontSize: '9px',
      color: hex(PALETA.textoSuave)
    });

    texto(this, 16, 382, 'TOKENS POR LUGAR', {
      fontSize: '10px',
      color: hex(PALETA.acento)
    });
    this.tokensTextos = [];
    this.sim.red.lugares.forEach((lugar, i) => {
      const col = i < 6 ? 0 : 1;
      const fila = i < 6 ? i : i - 6;
      const t = texto(this, 16 + col * 124, 400 + fila * 18, '', {
        fontSize: '9px',
        color: hex(PALETA.textoSuave),
        fontFamily: MONO
      });
      this.tokensTextos.push(t);
    });

    texto(this, 702, 382, 'ALERTAS', {
      fontSize: '10px',
      color: hex(PALETA.acento)
    });
  }

  crearBotones() {
    this.botonPausa = boton(this, 274, 82, 50, 24, 'Pausa', () => this.sim.pausar(), {
      color: PALETA.metalOscuro,
      hover: PALETA.panelBorde,
      fontSize: '10px'
    });
    this.botonesVelocidad = CONFIG.VELOCIDADES.map((v, i) =>
      boton(this, 330 + i * 36, 82, 30, 24, `${v}×`, () => this.sim.setVelocidad(v), {
        color: PALETA.metalOscuro,
        hover: PALETA.panelBorde,
        fontSize: '10px'
      })
    );
    this.botonInspector = boton(this, 476, 82, 78, 24, 'Inspector', () => this.abrirInspector(), {
      color: PALETA.metalOscuro,
      hover: PALETA.panelBorde,
      fontSize: '10px'
    });
    this.botonMonitor = boton(this, 806, 146, 92, 24, 'Cupo: OFF', () => this.sim.alternarMonitor(), {
      color: PALETA.metalOscuro,
      hover: PALETA.panelBorde,
      fontSize: '9px'
    });
    this.botonEmbotelladora = boton(this, 900, 146, 92, 24, 'Embot: ON', () => this.sim.alternarEmbotelladora(), {
      color: PALETA.metalOscuro,
      hover: PALETA.panelBorde,
      fontSize: '9px'
    });
    this.botonCerrarResultados = null;
  }

  crearRadar() {
    this.radarTitulo = texto(this, 772, 16, 'RADAR DEL ÁRBOL', {
      fontSize: '10px',
      color: hex(PALETA.acento)
    });
    this.radarEstado = texto(this, 936, 16, 'VERDE', {
      fontSize: '10px',
      color: hex(PALETA.operacion),
      fontStyle: 'bold'
    }).setOrigin(1, 0);
    this.radarBorde = this.add.graphics().setDepth(11);
    this.radarGrafico = this.add.graphics().setDepth(12);
    this.radarDetalle = texto(this, 772, 30, 'sin deadlock en 3 disparos', {
      fontSize: '8px',
      color: hex(PALETA.textoSuave)
    });
    this.radarPulse = 0;
    this.radarClave = null;
  }

  crearAlertas() {
    this.alertasTextos = [];
    for (let i = 0; i < 3; i++) {
      const t = texto(this, 702, 400 + i * 42, '', {
        fontSize: '9px',
        color: hex(PALETA.textoSuave),
        wordWrap: { width: 240 }
      });
      this.alertasTextos.push(t);
    }
  }

  crearToast() {
    this.toastFondo = this.add.rectangle(480, 104, 300, 40, PALETA.panel, 0.96)
      .setStrokeStyle(1.5, PALETA.acento, 0.8)
      .setDepth(20)
      .setAlpha(0);
    this.toastTexto = texto(this, 480, 104, '', {
      fontSize: '12px',
      color: hex(PALETA.acento),
      align: 'center'
    }).setOrigin(0.5).setDepth(21).setAlpha(0);
  }

  conectarEventos() {
    this.suscripciones.push(this.sim.emisor.on('cambio', () => this.actualizar(false)));
    this.suscripciones.push(this.sim.emisor.on('logro', (logro) => this.mostrarToast(logro.nombre)));
    this.suscripciones.push(this.sim.emisor.on('alerta', () => this.actualizarAlertas()));
    this.suscripciones.push(this.sim.emisor.on('fin', () => this.actualizar(false)));
  }

  abrirInspector() {
    if (this.scene.isActive('Inspector')) return;
    this.scene.launch('Inspector', { simulador: this.sim });
    this.scene.bringToTop('Inspector');
  }

  mostrarToast(nombre) {
    this.toastTexto.setText(`Logro: ${nombre}`);
    this.toastFondo.setAlpha(1);
    this.toastTexto.setAlpha(1);
    this.toastFondo.y = 96;
    this.toastTexto.y = 96;
    this.tweens.add({
      targets: [this.toastFondo, this.toastTexto],
      y: 112,
      duration: 350,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: [this.toastFondo, this.toastTexto],
      alpha: 0,
      delay: 1900,
      duration: 500
    });
  }

  actualizar(inicial = false) {
    const r = this.sim.resumen();
    this.turnoTexto.setText(`TURNO 1 / 1  ·  x${r.velocidad}`);
    this.relojTexto.setText(formatoTiempo(r.tiempoRestante));
    this.estadoTexto.setText(
      `${this.sim.pausado ? 'PAUSA' : 'en marcha'}  ·  ${r.estadisticas.botellas} lotes  ·  ${r.estadisticas.fallos} fallos`
    );
    this.puntajeTexto.setText(separar(r.puntuacion));
    this.lotesTexto.setText(`Lotes ${r.estadisticas.botellas}/${CONFIG.VICTORIA.botellasMinimas}`);
    this.lotesTexto.setColor(hex(r.estadisticas.botellas >= CONFIG.VICTORIA.botellasMinimas ? PALETA.operacion : PALETA.texto));

    this.botonPausa.setLabel(this.sim.pausado ? 'Seguir' : 'Pausa');
    this.botonesVelocidad.forEach((b, i) => {
      b.setColor(r.velocidad === CONFIG.VELOCIDADES[i] ? PALETA.metal : PALETA.metalOscuro);
    });
    this.botonMonitor.setLabel(`Cupo: ${r.monitorActivo ? 'ON' : 'OFF'}`);
    this.botonMonitor.setColor(r.monitorActivo ? PALETA.operacion : PALETA.metalOscuro);
    const enMarcha = r.red.marcadoObj.emb_lista > 0;
    this.botonEmbotelladora.setLabel(`Embot: ${enMarcha ? 'ON' : 'OFF'}`);
    this.botonEmbotelladora.setColor(enMarcha ? PALETA.operacion : PALETA.fallo);

    // tokens
    this.sim.red.lugares.forEach((lugar, i) => {
      const m = r.red.marcado[i];
      const t = this.tokensTextos[i];
      t.setText(`${NOMBRES_CORTOS[lugar.id] ?? lugar.nombre} ${m}/${lugar.k}`);
      let color = PALETA.texto;
      if (m === 0) color = PALETA.textoSuave;
      if (m > lugar.k && lugar.capacidad === 'desborde') color = PALETA.fallo;
      else if (m >= lugar.k && lugar.capacidad === 'estricta') color = PALETA.espera;
      t.setColor(hex(color));
    });

    this.actualizarRadar(inicial);
    this.actualizarAlertas();
  }

  actualizarRadar(inicial = false) {
    const radio = this.sim.radar();
    const color = radio.color;
    const colores = { verde: PALETA.operacion, amarillo: PALETA.espera, rojo: PALETA.fallo };
    const c = colores[color] ?? PALETA.textoSuave;
    this.radarEstado.setText(color.toUpperCase());
    this.radarEstado.setColor(hex(c));
    this.radarDetalle.setText(
      color === 'rojo'
        ? 'marcado muerto: sin transiciones'
        : color === 'amarillo'
          ? `${radio.muertosCirc.length} marcado(s) muerto(s) en ≤3`
          : 'sin deadlock en 3 disparos'
    );
    this.radarDetalle.setColor(hex(color === 'verde' ? PALETA.textoSuave : c));

    if (inicial || this.radarClave !== radio.clave) {
      this.radarClave = radio.clave;
      this.radarGrafico.clear();
      const nodos = radio.nodos;
      const posiciones = new Map();
      nodos.forEach((n, i) => {
        const x = 776 + (i % 12) * 14;
        const y = 48 + Math.floor(i / 12) * 13;
        posiciones.set(n.id, { x, y, n });
      });
      for (const e of radio.aristas) {
        const a = posiciones.get(e.de);
        const b = posiciones.get(e.a);
        if (!a || !b) continue;
        this.radarGrafico.lineStyle(1, PALETA.panelBorde, 0.55);
        this.radarGrafico.lineBetween(a.x, a.y, b.x, b.y);
      }
      for (const [id, p] of posiciones) {
        const muerto = radio.muertosCirc.some((m) => m.id === id);
        const actual = id === 'M0';
        this.radarGrafico.fillStyle(
          muerto ? PALETA.fallo : actual ? PALETA.acento : PALETA.metal,
          0.95
        );
        this.radarGrafico.fillCircle(p.x, p.y, actual ? 3.5 : 2.2);
        if (muerto) {
          this.radarGrafico.lineStyle(1, PALETA.fallo, 0.8);
          this.radarGrafico.strokeCircle(p.x, p.y, 4.5);
        }
      }
    }
    this.radarColor = color;
  }

  actualizarAlertas() {
    const ultimas = this.sim.alertas.slice(-3);
    for (let i = 0; i < 3; i++) {
      const a = ultimas[i];
      if (!a) {
        this.alertasTextos[i].setText('');
        continue;
      }
      this.alertasTextos[i].setText(`${formatoTiempo(a.tiempo)}  ${a.texto}`);
      this.alertasTextos[i].setColor(hex(COLOR_ALERTA[a.tipo] ?? PALETA.textoSuave));
    }
  }

  update(time, delta) {
    if (!this.sim) return;
    this.actualizar(false);
    this.radarPulse += delta;
    const colores = { verde: PALETA.operacion, amarillo: PALETA.espera, rojo: PALETA.fallo };
    const c = colores[this.radarColor] ?? PALETA.textoSuave;
    const alpha = this.radarColor === 'amarillo'
      ? 0.45 + 0.45 * Math.abs(Math.sin(this.radarPulse / 360))
      : 0.85;
    this.radarBorde.clear();
    this.radarBorde.lineStyle(2.5, c, alpha);
    this.radarBorde.strokeRoundedRect(760, 8, 192, 124, 10);
  }
}
