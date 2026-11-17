import { PALETA, hex } from '../arte/paleta.js';
import { dibujarSuelo, dibujarBarra } from '../arte/dibujos.js';
import { texto, FUENTE } from './estilos.js';

export class Arranque extends Phaser.Scene {
  constructor() {
    super('Arranque');
  }

  create() {
    this.cameras.main.setBackgroundColor(hex(PALETA.fondo));
    const g = this.add.graphics();
    dibujarSuelo(g, 18, 480, 120);
    g.fillStyle(PALETA.fondo, 0.72);
    g.fillRect(0, 0, 960, 540);

    this.add.text(480, 190, 'DairyCraft 2.5D', {
      fontFamily: FUENTE,
      fontSize: '42px',
      color: hex(PALETA.leche),
      fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 4, '#000000', 8);

    this.add.text(480, 238, 'Planta pasteurizadora y láctea · AEF + Redes de Petri', {
      fontFamily: FUENTE,
      fontSize: '15px',
      color: hex(PALETA.textoSuave)
    }).setOrigin(0.5);

    const progreso = { valor: 0 };
    const barra = this.add.graphics();
    const dibujar = () => {
      barra.clear();
      barra.fillStyle(PALETA.muro, 1);
      barra.fillRoundedRect(280, 300, 400, 14, 7);
      barra.fillStyle(PALETA.operacion, 1);
      barra.fillRoundedRect(280, 300, Math.max(14, 400 * progreso.valor), 14, 7);
      barra.lineStyle(1.5, PALETA.panelBorde, 1);
      barra.strokeRoundedRect(280, 300, 400, 14, 7);
    };
    dibujar();

    texto(this, 480, 336, 'Cargando Phaser 4.2.1 por CDN…', {
      fontSize: '12px',
      color: hex(PALETA.textoSuave)
    }).setOrigin(0.5);

    this.tweens.add({
      targets: progreso,
      valor: 1,
      duration: 1200,
      ease: 'Sine.easeInOut',
      onUpdate: dibujar,
      onComplete: () => this.scene.start('Titulo')
    });
  }
}
