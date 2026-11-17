import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulador } from '../src/juego/simulador.js';

test('flujo normal: llenar, pasteurizar, enfriar y descargar', () => {
  const sim = new Simulador({ monitorActivo: false });
  assert.equal(sim.tanque('T1').automata.estado, 'Vacio');
  assert.equal(sim.solicitarEvento('T1', 'abrir_valvula').ok, true);
  assert.equal(sim.tanque('T1').automata.estado, 'Llenando');
  assert.equal(sim.solicitarEvento('T1', 'iniciar_past').ok, false); // falta el tiempo de llenado
  sim.actualizar(2.6);
  assert.equal(sim.solicitarEvento('T1', 'iniciar_past').ok, true);
  assert.equal(sim.tanque('T1').automata.estado, 'Pasteurizando');
  assert.equal(sim.red.M[sim.red.idxLugar.get('vapor')], 0);
  assert.equal(sim.red.M[sim.red.idxLugar.get('lote_past')], 1);
  sim.actualizar(8);
  assert.equal(sim.tanque('T1').automata.estado, 'Enfriando');
  assert.equal(sim.red.M[sim.red.idxLugar.get('lote_enfr')], 1);
  assert.equal(sim.solicitarEvento('T1', 'descargar').ok, false); // falta el enfriamiento
  sim.actualizar(6);
  assert.equal(sim.solicitarEvento('T1', 'descargar').ok, true);
  assert.equal(sim.tanque('T1').automata.estado, 'Vacio');
  assert.equal(sim.red.M[sim.red.idxLugar.get('cuarto')], 1);
});

test('el HUD muestra verde, gris y rojo según el modelo', () => {
  const sim = new Simulador({ monitorActivo: false });
  const eventos = sim.eventosHUD('T1');
  assert.equal(eventos.find((e) => e.id === 'abrir_valvula').color, 'verde');
  sim.solicitarEvento('T1', 'abrir_valvula');
  sim.actualizar(2.6);
  const enLlenando = sim.eventosHUD('T1');
  assert.equal(enLlenando.find((e) => e.id === 'contaminacion').color, 'gris');
  assert.equal(enLlenando.find((e) => e.id === 'iniciar_past').color, 'verde');
  // Sin vapor (lo retiene otro lote) el botón se pone rojo.
  sim.solicitarEvento('T1', 'iniciar_past');
  const t2 = sim.tanque('T2');
  t2.automata.estado = 'Llenando';
  t2.llenadoEn = sim.reloj.tiempo - 10;
  const eventosT2 = sim.eventosHUD('T2');
  assert.equal(eventosT2.find((e) => e.id === 'iniciar_past').color, 'rojo');
});

test('un fallo en Llenando y la reparación CIP con una palabra válida', () => {
  const sim = new Simulador({ monitorActivo: false });
  sim.solicitarEvento('T1', 'abrir_valvula');
  sim.actualizar(2.6);
  assert.equal(sim.solicitarEvento('T1', 'perdida_temp').ok, true);
  assert.equal(sim.tanque('T1').automata.estado, 'Fallo');
  assert.equal(sim.solicitarEvento('T1', 'iniciar_CIP').ok, true);
  assert.equal(sim.tanque('T1').automata.estado, 'Lavado_CIP');
  const invalida = sim.reparar('T1', 'PSAEZ');
  assert.equal(invalida.ok, false);
  assert.equal(sim.tanque('T1').automata.estado, 'Lavado_CIP');
  const valida = sim.reparar('T1', 'PSESEAEZ');
  assert.equal(valida.ok, true);
  assert.equal(sim.tanque('T1').automata.estado, 'Vacio');
});

test('el supervisor CIP bloquea el segundo lavado y penaliza el intento', () => {
  const sim = new Simulador({ monitorActivo: false });
  sim.tanque('T1').automata.estado = 'Lavado_CIP';
  sim.tanque('T2').automata.estado = 'Fallo';
  const antes = sim.puntuacion;
  const r = sim.solicitarEvento('T2', 'iniciar_CIP');
  assert.equal(r.ok, false);
  assert.ok(sim.puntuacion < antes);
  assert.equal(sim.tanque('T2').automata.estado, 'Fallo');
});

test('la embotelladora se detiene y arranca con vapor', () => {
  const sim = new Simulador({ monitorActivo: false });
  assert.equal(sim.pararEmbotelladora().ok, true);
  assert.equal(sim.red.M[sim.red.idxLugar.get('emb_parada')], 1);
  assert.equal(sim.arrancarEmbotelladora().ok, true);
  assert.equal(sim.red.M[sim.red.idxLugar.get('emb_lista')], 1);
});

test('el radar arranca en verde y el monitor se puede alternar', () => {
  const sim = new Simulador({ monitorActivo: false });
  assert.equal(sim.radar().color, 'verde');
  const r = sim.alternarMonitor();
  assert.equal(r.monitorActivo, true);
  assert.equal(sim.red.monitorActivo, true);
  assert.equal(sim.radar().color, 'verde');
});

test('el resumen incluye tanques, red, radar y logros', () => {
  const sim = new Simulador({ monitorActivo: false });
  const r = sim.resumen();
  assert.equal(r.tanques.length, 3);
  assert.equal(r.red.marcado.length, 11);
  assert.equal(r.logros.length, 6);
  assert.ok(r.radar);
  assert.equal(r.tiempoRestante, 180);
});
