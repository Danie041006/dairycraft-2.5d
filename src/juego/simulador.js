// Orquestador del juego: une el núcleo formal (src/sed/) con la vista y el reloj.
// No importa Phaser. Cada cambio de estado de un tanque pasa por su autómata y
// cada recurso se mueve por el disparo de una transición de la red de Petri.
import { CONFIG } from '../config.js';
import { Automata } from '../sed/automata.js';
import { RedPetri } from '../sed/redPetri.js';
import { Reloj } from '../sed/reloj.js';
import { Aleatorio } from '../sed/aleatorio.js';
import { Lenguaje } from '../sed/lenguaje.js';
import { Emisor } from '../sed/emisor.js';
import { SupervisorCIP } from '../sed/composicion.js';
import { explorar } from '../sed/cobertura.js';
import tanqueJson from '../sed/modelos/tanque.json' with { type: 'json' };
import redJson from '../sed/modelos/dairycraft.json' with { type: 'json' };
import reparacionJson from '../sed/modelos/reparacion.json' with { type: 'json' };

const NOMBRES = ['Tanque 1', 'Tanque 2', 'Tanque 3'];
const OPERACION = ['Llenando', 'Pasteurizando', 'Enfriando'];
const NIVELES = {
  Vacio: 0.14,
  Llenando: 0.55,
  Pasteurizando: 1,
  Enfriando: 0.94,
  Lavado_CIP: 0.34,
  Fallo: 0.28
};

export class Simulador {
  constructor({ semilla = CONFIG.SEMILLA, monitorActivo = false } = {}) {
    this.emisor = new Emisor();
    this.semilla = semilla;
    this.aleatorio = new Aleatorio(semilla);
    this.reloj = new Reloj();
    this.red = new RedPetri(redJson, { monitorActivo });
    this.tanques = [0, 1, 2].map((i) => this.crearTanque(i));
    this.supervisor = new SupervisorCIP(this.tanques.map((t) => t.automata));

    this.puntuacion = 0;
    this.estadisticas = {
      botellas: 0,
      fallos: 0,
      reparaciones: 0,
      reparacionesFallidas: 0,
      intentosBloqueados: 0,
      desbordes: 0,
      deadlocksEvitados: 0,
      logros: 0
    };
    this.logros = this.crearLogros();
    this.alertas = [];
    this.log = [];
    this.tiempo = 0;
    this.activo = false;
    this.pausado = false;
    this.velocidad = 1;
    this.terminado = false;
    this.motivoFin = null;
    this.radarCache = null;
    this._radarT = -1;
    this.puntoSeguro = null;
    this._ultimoPuntoSeguro = -99;
    this.ultimoLogro = null;
    this.reparadoPrimerIntento = false;
    this.iniciar();
  }

  crearTanque(i) {
    return {
      id: `T${i + 1}`,
      numero: i + 1,
      nombre: NOMBRES[i],
      automata: new Automata(tanqueJson),
      lenguaje: new Lenguaje(reparacionJson),
      llenadoEn: -Infinity,
      pasteurizandoEn: -Infinity,
      enfriandoEn: -Infinity,
      cipEn: -Infinity,
      intentosReparacion: 0,
      ayuda: false,
      fallos: 0,
      esperandoFrio: false
    };
  }

  iniciar() {
    this.reloj.limpiar();
    this.reloj.tiempo = 0;
    this.tiempo = 0;
    this.activo = true;
    this.terminado = false;
    this.pausado = false;
    this.motivoFin = null;
    this.radarCache = null;
    this.puntoSeguro = null;
    this.reloj.programar(CONFIG.DURACION_TURNO, () => this.finalizar('tiempo'), 'turno');
    this.reloj.programar(CONFIG.TIEMPOS.llegadaLeche, () => this.llegadaLeche(), 'leche');
    this.reloj.programar(CONFIG.TIEMPOS.embotellado, () => this.embotellarAuto(), 'embotellado');
    this.reloj.programar(CONFIG.TIEMPOS.revisionFallo, () => this.revisionFallo(), 'revision');
    this.actualizarRadar();
    this.actualizarPuntoSeguro();
    this.emisor.emitir('cambio');
  }

  // ---------- bucle ----------
  actualizar(dtSegundos) {
    if (!this.activo || this.pausado) return;
    this.reloj.avanzar(dtSegundos * this.velocidad);
    this.tiempo = this.reloj.tiempo;
    if (!this.activo) return;
    if (this.verificarDeadlock()) return;
    if (this.tiempo - this._radarT >= 0.5) {
      this.actualizarRadar();
      this._radarT = this.tiempo;
    }
    this.verificarLogros();
  }

  tanque(id) {
    return this.tanques.find((t) => t.id === id || t.numero === Number(id));
  }

  pausar() {
    if (!this.activo) return;
    this.pausado = !this.pausado;
    this.emisor.emitir('pausa', this.pausado);
    this.emisor.emitir('cambio');
  }

  setVelocidad(v) {
    if (!CONFIG.VELOCIDADES.includes(v)) return;
    this.velocidad = v;
    this.emisor.emitir('velocidad', v);
    this.emisor.emitir('cambio');
  }

  // ---------- eventos del reloj ----------
  llegadaLeche() {
    if (!this.activo) return;
    const antes = this.red.M[this.red.idxLugar.get('leche')];
    const r = this.red.agregarToken('leche', 1);
    if (r.desborde && r.despues > antes) {
      this.puntuacion += CONFIG.PUNTOS.desborde;
      this.estadisticas.desbordes++;
      this.alerta(`Desborde del silo: Leche_cruda ${r.despues}/${this.red.lugares[this.red.idxLugar.get('leche')].k}. −${Math.abs(CONFIG.PUNTOS.desborde)} pts.`, 'desborde');
    }
    this.emisor.emitir('transicion', { tipo: 'llegada_leche', lugar: 'leche', antes, despues: r.despues });
    this.cambio();
    this.actualizarRadar();
    this.reloj.programar(CONFIG.TIEMPOS.llegadaLeche, () => this.llegadaLeche(), 'leche');
  }

  embotellarAuto() {
    if (!this.activo) return;
    if (this.red.habilitada('t_embotellar')) {
      const d = this.red.disparar('t_embotellar');
      this.estadisticas.botellas++;
      this.puntuacion += CONFIG.PUNTOS.botella;
      this.emisor.emitir('transicion', { tipo: 'embotellar', ...d });
      this.cambio();
      this.actualizarRadar();
      this.verificarLogros();
      this.verificarDeadlock();
    }
    if (this.activo) this.reloj.programar(CONFIG.TIEMPOS.embotellado, () => this.embotellarAuto(), 'embotellado');
  }

  revisionFallo() {
    if (!this.activo) return;
    const candidatos = this.tanques.filter((t) => t.automata.estado === 'Llenando');
    if (candidatos.length && this.aleatorio.probabilidad(CONFIG.PROBABILIDAD_FALLO)) {
      const t = this.aleatorio.elegir(candidatos);
      this.fallar(t, 'contaminacion');
    }
    this.reloj.programar(CONFIG.TIEMPOS.revisionFallo, () => this.revisionFallo(), 'revision');
  }

  fallar(t, eventoId) {
    if (!t || t.automata.estado !== 'Llenando') return false;
    t.automata.ejecutar(eventoId);
    t.fallos++;
    this.estadisticas.fallos++;
    this.puntuacion += CONFIG.PUNTOS.fallo;
    const causa = eventoId === 'contaminacion' ? 'contaminación' : 'pérdida de temperatura';
    this.alerta(`${t.nombre}: ${causa} durante el llenado → Fallo. Requiere Lavado CIP.`, 'fallo');
    this.emisor.emitir('transicion', { tipo: 'fallo', tanque: t.id, evento: eventoId });
    this.cambio();
    this.actualizarRadar();
    this.verificarLogros();
    return true;
  }

  finPasteurizacion(t) {
    if (!this.activo || t.automata.estado !== 'Pasteurizando') return;
    if (!this.red.habilitada('t_fin_past')) {
      if (!t.esperandoFrio) {
        t.esperandoFrio = true;
        this.alerta(`${t.nombre}: pasteurización retenida; Frio_disp = 0 (lo retiene otro lote en enfriamiento).`, 'espera');
      }
      this.reloj.programar(1, () => this.finPasteurizacion(t), `fin_past_${t.id}`);
      return;
    }
    t.esperandoFrio = false;
    const d = this.red.disparar('t_fin_past');
    t.automata.ejecutar('fin_past');
    t.enfriandoEn = this.reloj.tiempo;
    this.emisor.emitir('transicion', { tipo: 'fin_past', tanque: t.id, ...d });
    this.alerta(`${t.nombre}: fin de pasteurización; lote en enfriamiento.`, 'ok');
    this.cambio();
    this.actualizarRadar();
    this.verificarLogros();
    this.verificarDeadlock();
  }

  // ---------- acciones del jugador ----------
  solicitarEvento(id, eventoId) {
    if (!this.activo) return { ok: false, motivo: 'El turno terminó.' };
    if (this.pausado) return { ok: false, motivo: 'La simulación está en pausa.' };
    const t = this.tanque(id);
    if (!t) return { ok: false, motivo: 'Tanque desconocido.' };
    const a = t.automata;
    if (!a.puede(eventoId)) {
      this.alerta(`δ(${a.estado}, ${eventoId}) no está definida para ${t.nombre}.`, 'modelo');
      return { ok: false, motivo: `δ(${a.estado}, ${eventoId}) no está definida.` };
    }

    switch (eventoId) {
      case 'abrir_valvula': {
        a.ejecutar('abrir_valvula');
        t.llenadoEn = this.reloj.tiempo;
        this.alerta(`${t.nombre}: válvula abierta, llenando.`, 'ok');
        this.emisor.emitir('transicion', { tipo: 'llenar', tanque: t.id });
        break;
      }
      case 'iniciar_past': {
        const falta = t.llenadoEn + CONFIG.TIEMPOS.llenado - this.reloj.tiempo;
        if (falta > 0) {
          return { ok: false, motivo: `Llenando: faltan ${falta.toFixed(1)} s.` };
        }
        if (!this.red.habilitada('t_iniciar_past')) {
          return this.bloqueo(t, eventoId, this.red.razonNoHabilitada('t_iniciar_past').texto);
        }
        const d = this.red.disparar('t_iniciar_past');
        a.ejecutar('iniciar_past');
        t.pasteurizandoEn = this.reloj.tiempo;
        t.esperandoFrio = false;
        this.alerta(`${t.nombre}: pasteurización iniciada (Leche + Tanque_libre + Vapor + Cupo).`, 'ok');
        this.emisor.emitir('transicion', { tipo: 'iniciar_past', tanque: t.id, ...d });
        this.reloj.programar(CONFIG.TIEMPOS.pasteurizacion, () => this.finPasteurizacion(t), `fin_past_${t.id}`);
        break;
      }
      case 'descargar': {
        const falta = t.enfriandoEn + CONFIG.TIEMPOS.enfriamiento - this.reloj.tiempo;
        if (falta > 0) {
          return { ok: false, motivo: `Enfriando: faltan ${falta.toFixed(1)} s.` };
        }
        if (!this.red.habilitada('t_fin_enfr')) {
          return this.bloqueo(t, eventoId, this.red.razonNoHabilitada('t_fin_enfr').texto);
        }
        const d = this.red.disparar('t_fin_enfr');
        a.ejecutar('descargar');
        t.enfriandoEn = -Infinity;
        this.alerta(`${t.nombre}: lote descargado al cuarto frío (${this.red.M[this.red.idxLugar.get('cuarto')]}/4).`, 'ok');
        this.emisor.emitir('transicion', { tipo: 'descargar', tanque: t.id, ...d });
        break;
      }
      case 'iniciar_CIP': {
        const deshabilitados = this.supervisor.eventosDeshabilitados(t.numero - 1);
        if (deshabilitados.length) {
          return this.bloqueo(t, eventoId, deshabilitados[0].razon);
        }
        a.ejecutar('iniciar_CIP');
        t.cipEn = this.reloj.tiempo;
        t.intentosReparacion = 0;
        t.ayuda = false;
        t.lenguaje.reiniciar();
        this.alerta(`${t.nombre}: circuito CIP iniciado. Escribe la receta de reparación.`, 'ok');
        this.emisor.emitir('transicion', { tipo: 'iniciar_CIP', tanque: t.id });
        this.emisor.emitir('abrir_consola', t.id);
        break;
      }
      case 'contaminacion':
      case 'perdida_temp': {
        if (a.estado !== 'Llenando') {
          return { ok: false, motivo: 'El fallo solo se puede provocar durante el llenado.' };
        }
        return { ok: this.fallar(t, eventoId) };
      }
      default:
        return { ok: false, motivo: `El evento ${eventoId} no se solicita desde el HUD.` };
    }

    this.cambio();
    this.actualizarRadar();
    this.verificarLogros();
    this.verificarDeadlock();
    return { ok: true };
  }

  bloqueo(t, evento, razon) {
    this.estadisticas.intentosBloqueados++;
    this.puntuacion += CONFIG.PUNTOS.intentoBloqueado;
    const nombre = t?.nombre ?? 'Embotelladora';
    this.alerta(`Intento bloqueado en ${nombre}: ${razon} (−${Math.abs(CONFIG.PUNTOS.intentoBloqueado)} pts).`, 'bloqueo');
    this.emisor.emitir('bloqueado', { tanque: t?.id ?? null, evento, razon });
    this.cambio();
    return { ok: false, motivo: razon };
  }

  // ---------- consola de reparación ----------
  avanzarReparacion(id, simbolo) {
    const t = this.tanque(id);
    if (!t || t.automata.estado !== 'Lavado_CIP') return { ok: false, motivo: 'El tanque no está en Lavado_CIP.' };
    const r = t.lenguaje.avanzar(simbolo);
    this.emisor.emitir('reparacion_progreso', { tanque: t.id, ...r });
    return r;
  }

  reiniciarReparacion(id) {
    const t = this.tanque(id);
    if (!t) return;
    t.lenguaje.reiniciar();
    this.emisor.emitir('reparacion_progreso', { tanque: t.id, ...t.lenguaje.progreso() });
  }

  pedirAyuda(id) {
    const t = this.tanque(id);
    if (!t || t.ayuda) return;
    t.ayuda = true;
    this.puntuacion -= 5;
    this.alerta(`${t.nombre}: ayuda mostrada (${reparacionJson.regex}); −5 pts.`, 'info');
    this.cambio();
  }

  reparar(id, palabra) {
    const t = this.tanque(id);
    if (!t) return { ok: false, motivo: 'Tanque desconocido.' };
    if (t.automata.estado !== 'Lavado_CIP') return { ok: false, motivo: 'El tanque no está en Lavado_CIP.' };
    const validador = new Lenguaje(reparacionJson);
    const v = validador.validar(palabra);
    if (!v.coincide) {
      t.intentosReparacion++;
      this.estadisticas.reparacionesFallidas++;
      this.puntuacion += CONFIG.PUNTOS.reparacionInvalida;
      this.alerta(`${t.nombre}: CIP inválido "${v.palabra}". La máquina sigue en Lavado_CIP (−${Math.abs(CONFIG.PUNTOS.reparacionInvalida)} pts).`, 'fallo');
      this.emisor.emitir('reparacion', { tanque: t.id, palabra: v.palabra, ok: false });
      this.cambio();
      return { ok: false, motivo: 'La palabra no pertenece a L.', validacion: v };
    }
    const primero = t.intentosReparacion === 0;
    t.automata.ejecutar('CIP_ok');
    t.reparadoPrimerIntento = primero;
    this.estadisticas.reparaciones++;
    this.puntuacion += primero
      ? CONFIG.PUNTOS.reparacionPrimerIntento
      : Math.round(CONFIG.PUNTOS.reparacionPrimerIntento / 2);
    this.alerta(`${t.nombre}: CIP validado con ${v.palabra}. Tanque disponible.`, 'ok');
    if (primero) this.otorgarLogro('cip_perfecto');
    this.emisor.emitir('reparacion', { tanque: t.id, palabra: v.palabra, ok: true });
    this.emisor.emitir('transicion', { tipo: 'CIP_ok', tanque: t.id });
    this.cambio();
    this.actualizarRadar();
    this.verificarLogros();
    return { ok: true, validacion: v };
  }

  // ---------- embotelladora ----------
  pararEmbotelladora() {
    return this.accionEmbotelladora('t_parar_emb');
  }

  arrancarEmbotelladora() {
    return this.accionEmbotelladora('t_arrancar_emb');
  }

  alternarEmbotelladora() {
    if (this.red.habilitada('t_parar_emb')) return this.pararEmbotelladora();
    if (this.red.habilitada('t_arrancar_emb')) return this.arrancarEmbotelladora();
    return this.bloqueo(null, 't_arrancar_emb', this.red.razonNoHabilitada('t_arrancar_emb').texto);
  }

  accionEmbotelladora(tid) {
    if (!this.activo) return { ok: false, motivo: 'El turno terminó.' };
    if (!this.red.habilitada(tid)) {
      return this.bloqueo(null, tid, this.red.razonNoHabilitada(tid).texto);
    }
    const d = this.red.disparar(tid);
    this.alerta(
      tid === 't_parar_emb'
        ? 'Embotelladora detenida. Para arrancarla se necesita Vapor_disp.'
        : 'Embotelladora en marcha (vapor disponible).',
      'ok'
    );
    this.emisor.emitir('transicion', { tipo: tid, ...d });
    this.cambio();
    this.actualizarRadar();
    this.verificarDeadlock();
    return { ok: true };
  }

  // ---------- prevención ----------
  alternarMonitor() {
    if (!this.activo) return { ok: false, motivo: 'El turno terminó.' };
    const antes = this.radar().color;
    const activar = !this.red.monitorActivo;
    this.red.setMonitor(activar);
    this.actualizarRadar();
    if (activar) {
      this.alerta('Prevención Cupo_frio activada: se limita el circuito a 4 lotes.', 'ok');
      if (antes === 'amarillo') {
        this.estadisticas.deadlocksEvitados++;
        this.puntuacion += CONFIG.PUNTOS.deadlockEvitado;
        this.otorgarLogro('deadlock_evitado');
      }
      if (this.red.M[this.red.idxLugar.get('cuarto')] <= 2) this.otorgarLogro('guardian_frio');
    } else {
      this.alerta('Prevención Cupo_frio desactivada: el deadlock vuelve a ser alcanzable.', 'espera');
    }
    this.cambio();
    this.verificarDeadlock();
    return { ok: true, monitorActivo: this.red.monitorActivo };
  }

  // ---------- radar y punto seguro ----------
  verificarDeadlock() {
    if (!this.activo) return false;
    if (this.esDeadlockCircular(this.red.M)) {
      this.finalizar('deadlock');
      return true;
    }
    return false;
  }

  esDeadlockCircular(M = this.red.M) {
    if (!this.red.esMuerto(M)) return false;
    const v = (id) => M[this.red.idxLugar.get(id)];
    return (
      v('cuarto') >= 4 &&
      v('emb_parada') === 1 &&
      v('lote_past') + v('lote_enfr') >= 2 &&
      v('vapor') === 0 &&
      v('frio') === 0
    );
  }

  actualizarRadar() {
    const radio = explorar(this.red, this.red.M, 3);
    const muertosCirc = radio.muertos.filter((n) => this.esDeadlockCircular(n.marcado));
    const color = this.esDeadlockCircular(this.red.M) ? 'rojo' : muertosCirc.length ? 'amarillo' : 'verde';
    this.radarCache = {
      ...radio,
      muertosCirc,
      color,
      clave: this.red.M.join(','),
      monitor: this.red.monitorActivo
    };
    if (color === 'verde') this.actualizarPuntoSeguro();
    return this.radarCache;
  }

  radar() {
    if (!this.radarCache || this.radarCache.clave !== this.red.M.join(',')) {
      return this.actualizarRadar();
    }
    return this.radarCache;
  }

  actualizarPuntoSeguro() {
    if (!this.activo) return;
    if (this.tiempo - this._ultimoPuntoSeguro < 1) return;
    this._ultimoPuntoSeguro = this.tiempo;
    this.puntoSeguro = {
      tiempo: this.reloj.tiempo,
      puntuacion: this.puntuacion,
      M: [...this.red.M],
      tanques: this.tanques.map((t) => ({
        estado: t.automata.estado,
        historial: [...t.automata.historial]
      }))
    };
  }

  reintentarSeguro() {
    const p = this.puntoSeguro;
    if (!p) return false;
    this.reloj.limpiar();
    this.reloj.tiempo = p.tiempo;
    this.tiempo = p.tiempo;
    this.red.M = [...p.M];
    this.red.disparos = [];
    this.tanques.forEach((t, i) => {
      t.automata.estado = p.tanques[i].estado;
      t.automata.historial = [...p.tanques[i].historial];
      t.llenadoEn = p.tiempo - CONFIG.TIEMPOS.llenado;
      t.enfriandoEn = p.tiempo - CONFIG.TIEMPOS.enfriamiento;
      t.pasteurizandoEn = p.tiempo;
      t.intentosReparacion = 0;
      t.ayuda = false;
      t.esperandoFrio = false;
      t.lenguaje.reiniciar();
    });
    this.puntuacion = p.puntuacion;
    this.activo = true;
    this.terminado = false;
    this.pausado = false;
    this.motivoFin = null;
    this.reloj.programar(Math.max(0.1, CONFIG.DURACION_TURNO - p.tiempo), () => this.finalizar('tiempo'), 'turno');
    this.reloj.programar(CONFIG.TIEMPOS.llegadaLeche, () => this.llegadaLeche(), 'leche');
    this.reloj.programar(CONFIG.TIEMPOS.embotellado, () => this.embotellarAuto(), 'embotellado');
    this.reloj.programar(CONFIG.TIEMPOS.revisionFallo, () => this.revisionFallo(), 'revision');
    for (const t of this.tanques) {
      if (t.automata.estado === 'Pasteurizando') {
        this.reloj.programar(CONFIG.TIEMPOS.pasteurizacion, () => this.finPasteurizacion(t), `fin_past_${t.id}`);
      }
    }
    this.actualizarRadar();
    this.cambio();
    this.alerta('Reintento desde el último marcado verde del radar.', 'ok');
    return true;
  }

  // ---------- vista del HUD ----------
  eventosHUD(id) {
    const t = this.tanque(id);
    if (!t) return [];
    const a = t.automata;
    return a.eventosActivos().map((ev) => {
      let habilitado = false;
      let razon = '';
      if (!ev.controlable) {
        razon = 'Evento no controlable: ocurre solo (reloj o modelo).';
      } else if (ev.id === 'abrir_valvula') {
        habilitado = true;
        razon = 'Controlable y habilitado.';
      } else if (ev.id === 'iniciar_past') {
        const falta = t.llenadoEn + CONFIG.TIEMPOS.llenado - this.reloj.tiempo;
        if (falta > 0) {
          razon = `Llenando: faltan ${falta.toFixed(1)} s de llenado.`;
        } else {
          const r = this.red.razonNoHabilitada('t_iniciar_past');
          habilitado = r.habilitada;
          razon = r.texto;
        }
      } else if (ev.id === 'descargar') {
        const falta = t.enfriandoEn + CONFIG.TIEMPOS.enfriamiento - this.reloj.tiempo;
        if (falta > 0) {
          razon = `Enfriando: faltan ${falta.toFixed(1)} s.`;
        } else {
          const r = this.red.razonNoHabilitada('t_fin_enfr');
          habilitado = r.habilitada;
          razon = r.texto;
        }
      } else if (ev.id === 'iniciar_CIP') {
        const d = this.supervisor.eventosDeshabilitados(t.numero - 1);
        habilitado = d.length === 0;
        razon = d[0]?.razon ?? 'Circuito CIP libre.';
      } else if (ev.id === 'CIP_ok') {
        razon = 'Se dispara al validar la palabra del lenguaje de reparación.';
      }
      if (ev.id === 'perdida_temp') {
        razon = 'Evento no controlable. Puedes forzarlo desde el HUD: el tanque va a Fallo y pierde 25 puntos.';
      }
      return {
        id: ev.id,
        codigo: ev.codigo,
        nombre: ev.nombre,
        controlable: ev.controlable,
        habilitado,
        razon,
        color: !ev.controlable ? 'gris' : habilitado ? 'verde' : 'rojo'
      };
    });
  }

  puedeForzar(t) {
    return this.activo && t.automata.estado === 'Llenando';
  }

  logrosDeTanque(id) {
    return [...(this.tanque(id)?.automata.historialCodigos(10) ?? [])];
  }

  tiempoRestante() {
    return Math.max(0, CONFIG.DURACION_TURNO - this.reloj.tiempo);
  }

  resumen() {
    return {
      puntuacion: this.puntuacion,
      tiempo: this.reloj.tiempo,
      tiempoRestante: this.tiempoRestante(),
      velocidad: this.velocidad,
      monitorActivo: this.red.monitorActivo,
      activo: this.activo,
      terminado: this.terminado,
      motivo: this.motivoFin,
      estadisticas: { ...this.estadisticas },
      logros: this.logros.map((l) => ({ ...l })),
      tanques: this.tanques.map((t) => ({
        id: t.id,
        numero: t.numero,
        nombre: t.nombre,
        estado: t.automata.estado,
        nivel: NIVELES[t.automata.estado] ?? 0.2,
        marcado: t.automata.esMarcado(),
        fallos: t.fallos
      })),
      red: {
        marcado: this.red.marcado(),
        marcadoObj: this.red.marcadoObj(),
        habilitadas: this.red.habilitadas(),
        conflictos: this.red.conflictos(),
        muerto: this.red.esMuerto()
      },
      radar: this.radarCache
    };
  }

  // ---------- logros y alertas ----------
  crearLogros() {
    return [
      { id: 'primer_lote', nombre: 'Primer lote', descripcion: 'Embotella tu primer lote.', ganado: false },
      { id: 'linea_completa', nombre: 'Línea completa', descripcion: 'Ten los 3 tanques en Llenando, Pasteurizando y Enfriando a la vez.', ganado: false },
      { id: 'cip_perfecto', nombre: 'CIP perfecto', descripcion: 'Valida una reparación CIP al primer intento.', ganado: false },
      { id: 'guardian_frio', nombre: 'Guardián del frío', descripcion: 'Activa Cupo_frio antes de llenar el cuarto frío.', ganado: false },
      { id: 'sin_derrames', nombre: 'Sin derrames', descripcion: 'Termina el turno sin desbordar el silo.', ganado: false },
      { id: 'deadlock_evitado', nombre: 'Deadlock evitado', descripcion: 'Activa la prevención cuando el radar está amarillo.', ganado: false }
    ];
  }

  verificarLogros() {
    if (this.estadisticas.botellas >= 1) this.otorgarLogro('primer_lote');
    const operando = new Set(
      this.tanques.map((t) => t.automata.estado).filter((e) => OPERACION.includes(e))
    );
    if (operando.size >= 3) this.otorgarLogro('linea_completa');
  }

  otorgarLogro(id) {
    const logro = this.logros.find((l) => l.id === id);
    if (!logro || logro.ganado) return false;
    logro.ganado = true;
    this.puntuacion += CONFIG.PUNTOS.logro;
    this.estadisticas.logros++;
    this.ultimoLogro = logro;
    this.alerta(`Logro: ${logro.nombre}`, 'logro');
    this.emisor.emitir('logro', logro);
    return true;
  }

  alerta(texto, tipo = 'info') {
    const alerta = { texto, tipo, tiempo: this.reloj.tiempo, id: `${this.reloj.tiempo}-${this.alertas.length}` };
    this.alertas.push(alerta);
    if (this.alertas.length > 8) this.alertas.shift();
    this.emisor.emitir('alerta', alerta);
  }

  cambio() {
    this.emisor.emitir('cambio');
  }

  // ---------- fin ----------
  finalizar(motivo) {
    if (!this.activo) return;
    if (motivo === 'tiempo') {
      this.verificarLogros();
      if (this.estadisticas.desbordes === 0) this.otorgarLogro('sin_derrames');
    }
    if (motivo === 'deadlock') {
      this.puntuacion += CONFIG.PUNTOS.deadlock;
      this.alerta('Game over por interbloqueo: el marcado actual no habilita ninguna transición.', 'deadlock');
    }
    this.activo = false;
    this.terminado = true;
    this.motivoFin = motivo;
    this.reloj.limpiar();
    const exito = motivo === 'tiempo' && this.estadisticas.botellas >= CONFIG.VICTORIA.botellasMinimas;
    const data = {
      motivo,
      exito,
      resumen: this.resumen(),
      marcadoMuerto: this.red.marcado(),
      marcadoObj: this.red.marcadoObj(),
      secuencia: this.red.disparos.slice(-20).map((d) => d.transicion),
      prevencion: redJson.deadlock.prevencion,
      reglaCorta: redJson.deadlock.reglaCorta,
      puntoSeguro: Boolean(this.puntoSeguro)
    };
    this.emisor.emitir('fin', data);
  }

  cambiarTurno() {
    // El turno se reinicia con una instancia nueva desde la escena.
    this.activo = false;
    this.terminado = true;
    this.reloj.limpiar();
  }
}

export const ESTADOS_TANQUE = Object.keys(NIVELES);
export { NIVELES };
