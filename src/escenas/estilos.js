import { PALETA, hex } from '../arte/paleta.js';
import { sonido } from '../audio/sonido.js';

export const FUENTE = '"Trebuchet MS", "Segoe UI", sans-serif';
export const MONO = 'Consolas, "Courier New", monospace';

export function texto(escena, x, y, contenido, opciones = {}) {
  const {
    fontSize = '12px',
    color = hex(PALETA.texto),
    fontFamily = FUENTE,
    align = 'left',
    ...resto
  } = opciones;
  return escena.add.text(x, y, contenido, { fontFamily, fontSize, color, align, ...resto });
}

export function boton(escena, x, y, ancho, alto, etiqueta, onClick, opciones = {}) {
  const {
    color = PALETA.panelBorde,
    hover = PALETA.metalOscuro,
    textoColor = PALETA.texto,
    fontSize = '12px',
    borde = PALETA.metal
  } = opciones;
  const fondo = escena.add.rectangle(x, y, ancho, alto, color, 1).setOrigin(0.5);
  fondo.setStrokeStyle(1.5, borde, 0.85);
  fondo.setInteractive({ useHandCursor: true });
  const label = escena.add.text(x, y, etiqueta, {
    fontFamily: FUENTE,
    fontSize,
    color: hex(textoColor),
    align: 'center'
  }).setOrigin(0.5);

  fondo.on('pointerover', () => fondo.setFillStyle(hover, 1));
  fondo.on('pointerout', () => fondo.setFillStyle(color, 1));
  fondo.on('pointerdown', (pointer) => {
    pointer?.event?.stopPropagation?.();
    sonido.asegurar();
    sonido.clic();
    onClick?.(pointer);
  });

  return {
    fondo,
    label,
    setColor: (c) => fondo.setFillStyle(c, 1),
    setLabel: (t) => label.setText(t),
    setEnabled: (v) => {
      if (v) {
        fondo.setInteractive({ useHandCursor: true });
        label.setAlpha(1);
      } else {
        fondo.disableInteractive();
        label.setAlpha(0.45);
      }
    },
    destruir: () => {
      fondo.destroy();
      label.destroy();
    }
  };
}

export function panel(escena, x, y, ancho, alto, alpha = 0.95, borde = PALETA.panelBorde) {
  const g = escena.add.graphics();
  g.fillStyle(PALETA.panel, alpha);
  g.fillRoundedRect(x, y, ancho, alto, 10);
  g.lineStyle(1.5, borde, 0.9);
  g.strokeRoundedRect(x, y, ancho, alto, 10);
  g.fillStyle(PALETA.acento, 0.8);
  g.fillRect(x + 12, y + 1, ancho - 24, 2);
  return g;
}

export function formatoTiempo(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function separar(numero) {
  return String(Math.round(numero)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
