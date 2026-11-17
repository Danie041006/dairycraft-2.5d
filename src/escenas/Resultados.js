import { PALETA, hex } from '../arte/paleta.js';
import { texto, boton, panel, separar, formatoTiempo, FUENTE, MONO } from './estilos.js';

export class Resultados extends Phaser.Scene {
  constructor() {
    super('Resultados');
  }

  init(data) {
    this.sim = data.simulador;
    this.datos = data.data;
    this.resumen = this.datos.resumen;
  }

  create() {
    this.scene.stop('HUDMaquina');
    this.scene.stop('Inspector');
    if (this.scene.isActive('HUDJuego')) {
      this.scene.setVisible(false, 'HUDJuego');
      this.scene.pause('HUDJuego');
    }

    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.58).setOrigin(0).setInteractive();
    panel(this, 80, 30, 800, 480);

    const deadlock = this.datos.motivo === 'deadlock';
    const exito = this.datos.exito;
    const colorTitulo = deadlock ? PALETA.fallo : exito ? PALETA.operacion : PALETA.espera;

    texto(this, 110, 48, deadlock ? 'GAME OVER POR INTERBLOQUEO' : exito ? 'TURNO COMPLETADO · VICTORIA' : 'TURNO COMPLETADO', {
      fontSize: '24px',
      color: hex(colorTitulo),
      fontStyle: 'bold'
    });
    texto(this, 110, 80, deadlock
      ? 'El marcado actual no habilita ninguna transición: espera circular entre vapor, frío y cuarto frío.'
      : exito
        ? 'La planta cumplió la meta de producción sin deadlock.'
        : 'El turno terminó; no se alcanzaron los 6 lotes embotellados.', {
      fontSize: '10px',
      color: hex(PALETA.textoSuave),
      wordWrap: { width: 740 }
    });

    // Bloque izquierdo: puntaje y estadísticas
    texto(this, 110, 110, 'PUNTAJE', { fontSize: '10px', color: hex(PALETA.textoSuave) });
    texto(this, 110, 124, separar(this.resumen.puntuacion), {
      fontSize: '34px',
      color: hex(PALETA.acento),
      fontFamily: MONO,
      fontStyle: 'bold'
    });
    const e = this.resumen.estadisticas;
    const filas = [
      ['Lotes embotellados', `${e.botellas}  (meta ${6})`],
      ['Fallos de máquina', String(e.fallos)],
      ['Reparaciones CIP', `${e.reparaciones} válidas · ${e.reparacionesFallidas} inválidas`],
      ['Intentos bloqueados', String(e.intentosBloqueados)],
      ['Desbordes del silo', String(e.desbordes)],
      ['Deadlocks evitados', String(e.deadlocksEvitados)],
      ['Tiempo de simulación', `${formatoTiempo(this.resumen.tiempo)} / 03:00`]
    ];
    filas.forEach(([k, v], i) => {
      texto(this, 110, 180 + i * 24, k, { fontSize: '10px', color: hex(PALETA.textoSuave) });
      texto(this, 300, 180 + i * 24, v, { fontSize: '10px', color: hex(PALETA.texto) });
    });

    // Bloque derecho: logros
    texto(this, 470, 110, 'LOGROS', { fontSize: '10px', color: hex(PALETA.textoSuave) });
    this.resumen.logros.forEach((l, i) => {
      const y = 128 + i * 33;
      texto(this, 470, y, l.ganado ? '✓' : '○', {
        fontSize: '14px',
        color: hex(l.ganado ? PALETA.operacion : PALETA.textoSuave),
        fontFamily: MONO
      });
      texto(this, 492, y, l.nombre, {
        fontSize: '11px',
        color: hex(l.ganado ? PALETA.leche : PALETA.textoSuave)
      });
      texto(this, 492, y + 13, l.descripcion, {
        fontSize: '8px',
        color: hex(PALETA.textoSuave),
        wordWrap: { width: 330 }
      });
    });

    // Bloque inferior: deadlock o resumen
    if (deadlock) {
      const obj = this.datos.marcadoObj ?? {};
      const marcado = Object.entries(obj)
        .map(([k, v]) => `${k}=${v}`)
        .join(' · ');
      texto(this, 110, 340, 'Marcado muerto', { fontSize: '10px', color: hex(PALETA.fallo) });
      texto(this, 110, 354, `[${marcado}]`, {
        fontSize: '8px',
        color: hex(PALETA.texto),
        fontFamily: MONO,
        wordWrap: { width: 740 }
      });
      texto(this, 110, 378, 'Secuencia de disparos', { fontSize: '10px', color: hex(PALETA.acento) });
      texto(this, 110, 392, `últimos ${Math.min(12, (this.datos.secuencia ?? []).length)}: ${(this.datos.secuencia ?? []).slice(-12).join(' → ') || '—'}`, {
        fontSize: '8px',
        color: hex(PALETA.textoSuave),
        fontFamily: MONO,
        wordWrap: { width: 740 }
      });
      texto(this, 110, 424, `Prevención: ${this.datos.prevencion}`, {
        fontSize: '8px',
        color: hex(PALETA.espera),
        wordWrap: { width: 740 }
      });
    } else {
      texto(this, 110, 340, 'Conformidad con el modelo', { fontSize: '10px', color: hex(PALETA.acento) });
      texto(this, 110, 356, `Cada lote salió por δ y por el disparo de una transición. El monitor Cupo_frio quedó ${this.resumen.monitorActivo ? 'activo' : 'inactivo'}; el radar cerró en ${this.resumen.radar?.color ?? '—'}.`, {
        fontSize: '9px',
        color: hex(PALETA.textoSuave),
        wordWrap: { width: 740 }
      });
      texto(this, 110, 390, `Meta: ${6} lotes · logrados: ${e.botellas} · ${exito ? 'victoria' : 'sin victoria'} · tiempo restante: ${formatoTiempo(this.resumen.tiempoRestante)}`, {
        fontSize: '9px',
        color: hex(PALETA.texto)
      });
      texto(this, 110, 414, 'Prueba el modo de prevención: activa Cupo_frio antes de llenar el cuarto frío y observa el radar.', {
        fontSize: '8px',
        color: hex(PALETA.espera)
      });
    }

    // Botones
    boton(this, 200, 478, 180, 34, 'Jugar otro turno', () => this.otroTurno(), {
      color: PALETA.operacion,
      hover: 0x38b86c,
      fontSize: '11px',
      textoColor: PALETA.leche
    });
    if (deadlock && this.datos.puntoSeguro) {
      boton(this, 420, 478, 220, 34, 'Reintentar desde el último verde', () => this.reintentarSeguro(), {
        color: PALETA.mantenimiento,
        hover: 0x4f92ea,
        fontSize: '10px',
        textoColor: PALETA.leche
      });
    }
    boton(this, 680, 478, 140, 34, 'Volver al título', () => this.volverTitulo(), {
      color: PALETA.metalOscuro,
      hover: PALETA.panelBorde,
      fontSize: '10px'
    });
  }

  otroTurno() {
    this.scene.stop('HUDMaquina');
    this.scene.stop('Inspector');
    this.scene.stop('HUDJuego');
    const planta = this.scene.get('Planta');
    planta.scene.restart();
    this.scene.stop();
  }

  reintentarSeguro() {
    this.scene.stop('HUDMaquina');
    this.scene.stop('Inspector');
    this.scene.setVisible(true, 'HUDJuego');
    this.scene.resume('HUDJuego');
    this.scene.resume('Planta');
    this.sim.reintentarSeguro();
    this.scene.stop();
  }

  volverTitulo() {
    this.scene.stop('HUDMaquina');
    this.scene.stop('Inspector');
    this.scene.stop('HUDJuego');
    this.scene.stop('Planta');
    this.scene.start('Titulo');
    this.scene.stop();
  }
}
