// Sonidos sintetizados con Web Audio API. No usa archivos externos.
// El AudioContext se crea o reanuda en el primer gesto del usuario.
class Sonido {
  constructor() {
    this.ctx = null;
    this.activo = true;
  }

  asegurar() {
    if (!this.activo) return;
    try {
      if (!this.ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) {
          this.activo = false;
          return;
        }
        this.ctx = new Ctx();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {
      this.activo = false;
    }
  }

  _tono(frecuencia, duracion = 0.08, tipo = 'sine', volumen = 0.04, retardo = 0) {
    if (!this.activo) return;
    this.asegurar();
    if (!this.ctx) return;
    try {
      const t0 = this.ctx.currentTime + retardo;
      const osc = this.ctx.createOscillator();
      const gan = this.ctx.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(frecuencia, t0);
      gan.gain.setValueAtTime(Math.max(0.0001, volumen), t0);
      gan.gain.exponentialRampToValueAtTime(0.0001, t0 + duracion);
      osc.connect(gan);
      gan.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duracion + 0.02);
    } catch {
      // Si el navegador bloquea el audio, el juego sigue sin sonido.
    }
  }

  clic() {
    this._tono(520, 0.05, 'square', 0.025);
  }

  transicion() {
    this._tono(440, 0.07, 'triangle', 0.03);
  }

  botella() {
    this._tono(660, 0.08, 'sine', 0.04);
    this._tono(880, 0.1, 'sine', 0.03, 0.06);
  }

  fallo() {
    this._tono(180, 0.22, 'sawtooth', 0.035);
    this._tono(120, 0.3, 'sawtooth', 0.03, 0.08);
  }

  bloqueado() {
    this._tono(110, 0.12, 'square', 0.035);
  }

  logro() {
    [523, 659, 784].forEach((f, i) => this._tono(f, 0.18, 'sine', 0.035, i * 0.09));
  }

  deadlock() {
    [220, 180, 140, 100].forEach((f, i) => this._tono(f, 0.3, 'sawtooth', 0.035, i * 0.12));
  }

  victoria() {
    [523, 659, 784, 1046].forEach((f, i) => this._tono(f, 0.24, 'sine', 0.04, i * 0.11));
  }
}

export const sonido = new Sonido();
