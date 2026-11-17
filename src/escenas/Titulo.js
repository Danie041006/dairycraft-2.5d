import { PALETA, hex } from '../arte/paleta.js';
import {
  dibujarSuelo,
  dibujarSilo,
  dibujarTanque,
  dibujarCaldera,
  dibujarChiller,
  dibujarEmbotelladora,
  dibujarCuartoFrio,
  dibujarToken
} from '../arte/dibujos.js';
import { texto, boton, panel, FUENTE } from './estilos.js';
import { sonido } from '../audio/sonido.js';

export class Titulo extends Phaser.Scene {
  constructor() {
    super('Titulo');
  }

  create() {
    this.cameras.main.setBackgroundColor(hex(PALETA.fondo));
    const g = this.add.graphics();
    dibujarSuelo(g, 16, 480, 60);

    // Planta de fondo, dibujada en código
    const fondo = this.add.graphics();
    dibujarSilo(fondo, 700, 330, 6, 10);
    dibujarTanque(fondo, 790, 380, 'Pasteurizando', 0.9);
    dibujarTanque(fondo, 690, 440, 'Enfriando', 0.8);
    dibujarCaldera(fondo, 870, 300, true);
    dibujarChiller(fondo, 850, 440, true);
    dibujarEmbotelladora(fondo, 760, 500, 'Emb_lista');
    dibujarCuartoFrio(fondo, 880, 510, 2, 4);
    for (let i = 0; i < 5; i++) dibujarToken(fondo, 'leche', 656 + i * 14, 250, 0.8);

    const velo = this.add.graphics();
    velo.fillStyle(PALETA.fondo, 0.66);
    velo.fillRect(0, 0, 960, 540);

    // Título
    texto(this, 64, 74, 'DairyCraft 2.5D', {
      fontSize: '44px',
      color: hex(PALETA.leche),
      fontStyle: 'bold'
    }).setShadow(0, 4, '#000000', 10);
    texto(this, 66, 126, 'Planta pasteurizadora y láctea · simulador isométrico 2.5D', {
      fontSize: '15px',
      color: hex(PALETA.textoSuave)
    });
    texto(this, 66, 150, 'Modelado y Simulación de Sistemas de Eventos Discretos · Fase 1', {
      fontSize: '11px',
      color: hex(PALETA.acento)
    });

    panel(this, 54, 186, 540, 254, 0.9);
    texto(this, 76, 202, 'Cómo jugar', {
      fontSize: '17px',
      color: hex(PALETA.acento),
      fontStyle: 'bold'
    });

    const lineas = [
      '1. Haz clic en un tanque para abrir el HUD de su autómata.',
      '2. Abre la válvula, pasteuriza y descarga cuando el frío esté listo.',
      '3. La red mueve leche, vapor, frío, lotes y cupo: nada es gratis.',
      '4. Si un tanque falla, escribe la receta CIP con P, S, E, A, Z.',
      '5. Mira el radar: verde, amarillo o rojo. Activa Cupo_frio a tiempo.',
      '6. Objetivo: 6 lotes embotellados en 3 minutos de simulación.'
    ];
    lineas.forEach((linea, i) => {
      texto(this, 78, 238 + i * 27, linea, {
        fontSize: '12px',
        color: hex(PALETA.texto)
      });
    });

    panel(this, 618, 186, 292, 254, 0.9);
    texto(this, 638, 202, 'Controles', {
      fontSize: '17px',
      color: hex(PALETA.acento),
      fontStyle: 'bold'
    });
    const controles = [
      ['Clic / toque', 'abrir el HUD del tanque'],
      ['P', 'pausa / reanudar'],
      ['I', 'inspector de la red'],
      ['1 · 2 · 4', 'velocidad de simulación'],
      ['Esc', 'cerrar panel'],
      ['F1', 'fps y tiempo'],
      ['Arrastre + rueda', 'mover y acercar la cámara']
    ];
    controles.forEach(([tecla, accion], i) => {
      texto(this, 638, 238 + i * 24, tecla, {
        fontSize: '11px',
        color: hex(PALETA.acento),
        fontFamily: 'Consolas, monospace'
      });
      texto(this, 732, 238 + i * 24, accion, {
        fontSize: '11px',
        color: hex(PALETA.textoSuave)
      });
    });

    boton(this, 168, 478, 228, 48, '▶  Iniciar turno', () => { sonido.asegurar(); this.scene.start('Planta'); }, {
      color: PALETA.operacion,
      hover: 0x38b86c,
      borde: 0x9be3c0,
      fontSize: '17px',
      textoColor: PALETA.leche
    });

    texto(this, 64, 474, 'Equipo', {
      fontSize: '10px',
      color: hex(PALETA.textoSuave)
    });
    texto(this, 64, 490, 'Deivid Peñaloza · Paula Mendoza', {
      fontSize: '11px',
      color: hex(PALETA.texto)
    });
    texto(this, 64, 505, 'Fabian Garcia · Daniel Castellanos', {
      fontSize: '11px',
      color: hex(PALETA.texto)
    });

    texto(this, 930, 520, 'Phaser 4.2.1 · Vite', {
      fontSize: '10px',
      color: hex(PALETA.textoSuave)
    }).setOrigin(1, 0.5);

    // Pequeño destello decorativo
    const brillo = this.add.circle(700, 330, 80, PALETA.acento, 0.05);
    this.tweens.add({
      targets: brillo,
      alpha: 0.12,
      scale: 1.2,
      duration: 2200,
      yoyo: true,
      repeat: -1
    });
  }
}
