import { Arranque } from './escenas/Arranque.js';
import { Titulo } from './escenas/Titulo.js';
import { Planta } from './escenas/Planta.js';
import { HUDJuego } from './escenas/HUDJuego.js';
import { HUDMaquina } from './escenas/HUDMaquina.js';
import { Inspector } from './escenas/Inspector.js';
import { Resultados } from './escenas/Resultados.js';

// Phaser 4.2.1 se carga por CDN en index.html; aquí se usa el objeto global.
const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#0b1218',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: true,
    roundPixels: false
  },
  scene: [Arranque, Titulo, Planta, HUDJuego, HUDMaquina, Inspector, Resultados]
};

// Se expone para depuración en la consola del navegador.
window.game = new Phaser.Game(config);
