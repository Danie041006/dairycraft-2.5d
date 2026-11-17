// Entrada unificada: teclado, mouse y táctil producen las mismas acciones.
import { Emisor } from '../sed/emisor.js';

export class GestorEntrada {
  constructor(escena) {
    this.escena = escena;
    this.emisor = new Emisor();
    this.arrastre = null;
    this.pinch = null;
    this._handlers = [];

    const on = (objeto, evento, fn) => {
      objeto.on(evento, fn);
      this._handlers.push({ objeto, evento, fn });
    };

    on(escena.input.keyboard, 'keydown', (event) => {
      const k = event.key;
      if (k === 'p' || k === 'P') {
        event.preventDefault?.();
        this.emisor.emitir('accion', { tipo: 'pausa' });
      } else if (k === 'i' || k === 'I') {
        event.preventDefault?.();
        this.emisor.emitir('accion', { tipo: 'inspector' });
      } else if (k === '1' || k === '2' || k === '4') {
        this.emisor.emitir('accion', { tipo: 'velocidad', valor: Number(k) });
      } else if (k === 'Escape') {
        this.emisor.emitir('accion', { tipo: 'cerrar' });
      } else if (k === 'F1') {
        event.preventDefault?.();
        this.emisor.emitir('accion', { tipo: 'fps' });
      }
    });

    on(escena.input, 'pointerdown', (pointer) => {
      const hits = escena.input.hitTestPointer(pointer) ?? [];
      const sobreFondo = hits.length === 0 || hits[0] === escena.zonaFondo;
      if (sobreFondo) {
        this.emisor.emitir('accion', { tipo: 'clicFondo' });
        this.arrastre = { x: pointer.x, y: pointer.y, movido: false };
      } else {
        this.arrastre = null;
      }
      this._actualizarPinch();
    });

    on(escena.input, 'pointermove', (pointer) => {
      if (this.arrastre && pointer.isDown) {
        const dx = pointer.x - this.arrastre.x;
        const dy = pointer.y - this.arrastre.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) {
          this.arrastre.movido = true;
          this.emisor.emitir('accion', { tipo: 'camara', dx, dy });
          this.arrastre.x = pointer.x;
          this.arrastre.y = pointer.y;
        }
      }
      this._actualizarPinch();
    });

    on(escena.input, 'pointerup', () => {
      this.arrastre = null;
      this.pinch = null;
    });

    on(escena.input, 'wheel', (pointer, objetos, dx, dy) => {
      this.emisor.emitir('accion', { tipo: 'zoom', delta: dy });
    });
  }

  _actualizarPinch() {
    const punteros = this.escena.input.manager?.pointers ?? [];
    const activos = punteros.filter((p) => p && p.isDown);
    if (activos.length < 2) return;
    const distancia = Math.hypot(activos[0].x - activos[1].x, activos[0].y - activos[1].y);
    if (this.pinch == null) {
      this.pinch = distancia;
    } else {
      const delta = distancia - this.pinch;
      if (Math.abs(delta) > 3) {
        this.emisor.emitir('accion', { tipo: 'zoom', delta: -delta * 0.8 });
        this.pinch = distancia;
      }
    }
  }

  on(fn) {
    return this.emisor.on('accion', fn);
  }

  destruir() {
    for (const { objeto, evento, fn } of this._handlers) objeto.off(evento, fn);
    this._handlers = [];
    this.emisor.limpiar();
  }
}
