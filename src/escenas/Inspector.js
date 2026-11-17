import { PALETA, hex } from '../arte/paleta.js';
import { explorar, grafoAlcanzabilidad } from '../sed/cobertura.js';
import { texto, boton, panel, FUENTE, MONO } from './estilos.js';

const ABREV = ['Leche', 'Tanque', 'Vapor', 'Frio', 'LoteP', 'LoteE', 'Cuarto', 'EmbL', 'EmbP', 'Bot', 'Cupo'];

export class Inspector extends Phaser.Scene {
  constructor() {
    super('Inspector');
  }

  init(data) {
    this.sim = data.simulador;
    this.tab = 'matriz';
    this.subTab = 'pre';
    this.contenido = [];
    this.resultadoPrueba = '';
  }

  create() {
    this.add.rectangle(0, 0, 960, 540, 0x000000, 0.42).setOrigin(0).setInteractive();
    panel(this, 24, 16, 912, 508);

    texto(this, 44, 28, 'INSPECTOR DE LA RED DE PETRI', {
      fontSize: '18px',
      color: hex(PALETA.leche),
      fontStyle: 'bold'
    });
    texto(this, 44, 50, 'Ecuación de estado: M_k = M_{k−1} + A^T · u_k   ·   Pre/Post de |T| × |P|   ·   A = Post − Pre', {
      fontSize: '10px',
      color: hex(PALETA.textoSuave)
    });
    boton(this, 910, 38, 26, 26, '×', () => this.cerrar(), {
      color: PALETA.metalOscuro,
      hover: PALETA.fallo,
      fontSize: '15px'
    });

    this.botonMatriz = boton(this, 90, 86, 110, 26, 'Matriz', () => this.cambiarTab('matriz'), {
      color: PALETA.operacion,
      hover: PALETA.operacion,
      fontSize: '11px'
    });
    this.botonArbol = boton(this, 210, 86, 110, 26, 'Árbol', () => this.cambiarTab('arbol'), {
      color: PALETA.metalOscuro,
      hover: PALETA.panelBorde,
      fontSize: '11px'
    });

    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Escape' || event.key === 'i' || event.key === 'I') this.cerrar();
    });

    this.crearSubTabs();
    this.dibujar();
    this.scene.setVisible(false, 'HUDJuego');
    this.scene.pause('HUDJuego');
    this.scene.pause('Planta');
  }

  crearSubTabs() {
    this.subBotones = [
      ['pre', 'Pre'],
      ['post', 'Post'],
      ['A', 'A = Post − Pre']
    ].map(([id, label], i) => {
      const b = boton(this, 350 + i * 112, 86, 104, 24, label, () => {
        this.subTab = id;
        this.dibujar();
      }, {
        color: PALETA.metalOscuro,
        hover: PALETA.panelBorde,
        fontSize: '9px'
      });
      b.id = id;
      return b;
    });
  }

  cambiarTab(tab) {
    this.tab = tab;
    this.botonMatriz.setColor(tab === 'matriz' ? PALETA.operacion : PALETA.metalOscuro);
    this.botonArbol.setColor(tab === 'arbol' ? PALETA.operacion : PALETA.metalOscuro);
    for (const b of this.subBotones) {
      b.setEnabled(tab === 'matriz');
      b.label.setVisible(tab === 'matriz');
      b.fondo.setVisible(tab === 'matriz');
    }
    this.dibujar();
  }

  limpiar() {
    for (const obj of this.contenido) {
      if (obj?.destroy) obj.destroy();
    }
    this.contenido = [];
  }

  guardar(obj) {
    this.contenido.push(obj);
    return obj;
  }

  dibujar() {
    this.limpiar();
    for (const b of this.subBotones) {
      const activo = this.subTab === b.id;
      b.setColor(activo ? PALETA.metal : PALETA.metalOscuro);
    }
    if (this.tab === 'matriz') this.dibujarMatrices();
    else this.dibujarArbol();
  }

  dibujarMatrices() {
    const red = this.sim.red;
    const matrices = red.matrices();
    const datos =
      this.subTab === 'pre' ? matrices.pre :
      this.subTab === 'post' ? matrices.post :
      matrices.A;
    const x0 = 46;
    const y0 = 132;
    const anchoFila = 88;
    const anchoCol = 58;
    const altoFila = 23;

    const g = this.guardar(this.add.graphics());
    g.fillStyle(PALETA.metalOscuro, 1);
    g.fillRoundedRect(x0, y0 - 20, anchoFila + anchoCol * 11, 18, 4);
    for (let p = 0; p < 11; p++) {
      this.guardar(texto(this, x0 + anchoFila + p * anchoCol + anchoCol / 2, y0 - 16, ABREV[p], {
        fontSize: '8px',
        color: hex(PALETA.acento),
        fontFamily: MONO
      }).setOrigin(0.5, 0));
    }
    this.guardar(texto(this, x0 + 4, y0 - 16, 'Transición', {
      fontSize: '8px',
      color: hex(PALETA.acento),
      fontFamily: MONO
    }));

    for (let t = 0; t < red.nT; t++) {
      const y = y0 + t * altoFila;
      g.fillStyle(t % 2 === 0 ? PALETA.panel : PALETA.muro, 0.65);
      g.fillRect(x0, y, anchoFila + anchoCol * 11, altoFila);
      this.guardar(texto(this, x0 + 4, y + 6, red.transiciones[t].id.replace('t_', ''), {
        fontSize: '8px',
        color: hex(red.habilitada(t) ? PALETA.operacion : PALETA.textoSuave),
        fontFamily: MONO
      }));
      for (let p = 0; p < 11; p++) {
        const valor = datos[t][p];
        const color = valor === 0 ? PALETA.textoSuave : valor > 0 ? PALETA.operacion : PALETA.fallo;
        this.guardar(texto(this, x0 + anchoFila + p * anchoCol + anchoCol / 2, y + 6, String(valor), {
          fontSize: '9px',
          color: hex(color),
          fontFamily: MONO
        }).setOrigin(0.5, 0));
      }
    }

    const yM = y0 + red.nT * altoFila + 8;
    g.fillStyle(PALETA.metalOscuro, 0.9);
    g.fillRect(x0, yM, anchoFila + anchoCol * 11, 22);
    this.guardar(texto(this, x0 + 4, yM + 7, 'M actual', {
      fontSize: '8px',
      color: hex(PALETA.leche),
      fontFamily: MONO
    }));
    for (let p = 0; p < 11; p++) {
      const m = red.M[p];
      const k = red.lugares[p].k;
      const color = m > k ? PALETA.fallo : m === k ? PALETA.espera : PALETA.leche;
      this.guardar(texto(this, x0 + anchoFila + p * anchoCol + anchoCol / 2, yM + 7, `${m}/${k}`, {
        fontSize: '8px',
        color: hex(color),
        fontFamily: MONO
      }).setOrigin(0.5, 0));
    }

    const ultimo = red.ultimoDisparo();
    const yU = yM + 28;
    this.guardar(texto(this, x0, yU, ultimo ? `Último disparo: ${ultimo.transicion}  ·  u = [${ultimo.u.join(', ')}]` : 'Último disparo: aún no hay disparos', {
      fontSize: '9px',
      color: hex(PALETA.texto),
      fontFamily: MONO
    }));
    if (ultimo) {
      const ti = red.idxTransicion.get(ultimo.transicion);
      const ecuacion = ultimo.antes
        .map((v, p) => `${v}${red.A[ti][p] >= 0 ? '+' : ''}${red.A[ti][p]}=${ultimo.despues[p]}`)
        .join('  ');
      this.guardar(texto(this, x0, yU + 18, `M_k = M_{k−1} + A^T·u_k  →  ${ecuacion}`, {
        fontSize: '8px',
        color: hex(PALETA.textoSuave),
        fontFamily: MONO,
        wordWrap: { width: 840 }
      }));
    }

    this.guardar(texto(this, x0, yU + 44, 'Probar disparo (sin aplicarlo):', {
      fontSize: '9px',
      color: hex(PALETA.acento)
    }));
    red.transiciones.forEach((t, i) => {
      const b = boton(this, x0 + 70 + i * 128, yU + 68, 120, 24, t.id.replace('t_', ''), () => this.probar(t.id), {
        color: red.habilitada(t.id) ? PALETA.panelBorde : PALETA.metalOscuro,
        hover: PALETA.operacion,
        fontSize: '8px'
      });
      this.guardar(b.fondo);
      this.guardar(b.label);
    });
    this.resultadoTexto = this.guardar(texto(this, x0, yU + 102, this.resultadoPrueba || 'Selecciona una transición para ver el marcado resultante.', {
      fontSize: '9px',
      color: hex(PALETA.textoSuave),
      fontFamily: MONO,
      wordWrap: { width: 840 }
    }));
    const conflictos = red.conflictos();
    this.guardar(texto(this, x0, yU + 124, `Habilitadas: ${red.habilitadas().join(', ') || 'ninguna'}   ·   Conflictos: ${conflictos.length ? conflictos.map((c) => `${c.a} vs ${c.b} por ${c.lugar}`).join(' · ') : 'ninguno'}`, {
      fontSize: '8px',
      color: hex(PALETA.textoSuave),
      wordWrap: { width: 840 }
    }));
  }

  probar(tid) {
    const red = this.sim.red;
    const m2 = red.resultado(tid);
    if (m2) {
      this.resultadoPrueba = `M' (${tid}) = [${m2.join(', ')}]  ·  habilitada y dentro de capacidades.`;
    } else {
      this.resultadoPrueba = `M' (${tid}) no es válido: ${red.razonNoHabilitada(tid).texto}`;
    }
    this.dibujar();
  }

  dibujarArbol() {
    const red = this.sim.red;
    const radio = explorar(red, red.M, 4, 600);
    const inicial = red.marcadoInicial();
    const grafo = grafoAlcanzabilidad(red, inicial, 20000);
    const x0 = 46;
    const y0 = 140;

    this.guardar(texto(this, x0, y0, `Marcados alcanzables desde M0: ${grafo.total}${grafo.completo ? '' : ' (truncado)'}  ·  muertos: ${grafo.muertos.length}  ·  red acotada: sin ω  ·  explorados desde M actual (4 niveles): ${radio.nodos.length}`, {
      fontSize: '9px',
      color: hex(PALETA.texto),
      wordWrap: { width: 860 }
    }));
    this.guardar(texto(this, x0, y0 + 20, `M0 actual = [${red.M.join(', ')}]   ·   monitor Cupo_frio: ${red.monitorActivo ? 'ON (146 marcados, 0 muertos)' : 'OFF (160 marcados, 1 muerto)'}`, {
      fontSize: '9px',
      color: hex(red.monitorActivo ? PALETA.operacion : PALETA.espera),
      fontFamily: MONO,
      wordWrap: { width: 860 }
    }));

    const g = this.guardar(this.add.graphics());
    const niveles = new Map();
    for (const n of radio.nodos) {
      if (!niveles.has(n.nivel)) niveles.set(n.nivel, []);
      niveles.get(n.nivel).push(n);
    }
    const posiciones = new Map();
    const maxNivel = Math.max(0, ...radio.nodos.map((n) => n.nivel));
    const alto = 300 / Math.max(1, maxNivel + 1);
    for (const [nivel, lista] of niveles) {
      lista.forEach((n, i) => {
        const x = 90 + ((i + 0.5) / lista.length) * 800;
        const y = y0 + 60 + nivel * Math.min(60, alto);
        posiciones.set(n.id, { x, y, n });
      });
    }
    for (const e of radio.aristas) {
      const a = posiciones.get(e.de);
      const b = posiciones.get(e.a);
      if (!a || !b) continue;
      g.lineStyle(1.6, PALETA.textoSuave, 0.48);
      g.lineBetween(a.x, a.y + 4, b.x, b.y - 4);
    }
    for (const [, p] of posiciones) {
      const muerto = p.n.muerto;
      g.fillStyle(muerto ? PALETA.fallo : p.n.id === 'M0' ? PALETA.acento : PALETA.metal, 0.95);
      g.fillCircle(p.x, p.y, p.n.id === 'M0' ? 7 : 5);
      if (muerto) {
        g.lineStyle(1.5, PALETA.fallo, 0.9);
        g.strokeCircle(p.x, p.y, 8);
      }
    }

    const muertos = radio.muertos.slice(0, 4);
    this.guardar(texto(this, x0, y0 + 310, muertos.length
      ? `Marcados muertos alcanzables (≤4 niveles): ${muertos.map((m) => `[${m.marcado.join(',')}]`).join(' · ')}`
      : 'No hay marcados muertos en 4 niveles desde el marcado actual.', {
      fontSize: '8px',
      color: hex(muertos.length ? PALETA.fallo : PALETA.operacion),
      fontFamily: MONO,
      wordWrap: { width: 860 }
    }));
    this.guardar(texto(this, x0, y0 + 330, 'Verde: marcado actual · rojo: marcado muerto · el inspector usa la red con el monitor activo o desactivado según el juego.', {
      fontSize: '8px',
      color: hex(PALETA.textoSuave)
    }));
  }

  cerrar() {
    this.scene.setVisible(true, 'HUDJuego');
    this.scene.resume('HUDJuego');
    this.scene.resume('Planta');
    this.scene.stop();
  }
}
