import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulador } from '../src/juego/simulador.js';

test('el game over por deadlock se dispara con el marcado muerto de la ficha', () => {
  const sim = new Simulador({ monitorActivo: false });
  sim.red.M = [0, 1, 0, 0, 1, 1, 4, 0, 1, 0, 0];
  sim.actualizarRadar();
  assert.equal(sim.radar().color, 'rojo');
  const disparado = sim.verificarDeadlock();
  assert.equal(disparado, true);
  assert.equal(sim.activo, false);
  assert.equal(sim.motivoFin, 'deadlock');
  assert.ok(sim.alertas.some((a) => a.tipo === 'deadlock'));
});

test('el reintento desde el último marcado verde restaura el turno', () => {
  const sim = new Simulador({ monitorActivo: false });
  sim.actualizarPuntoSeguro();
  assert.ok(sim.puntoSeguro);
  sim.red.M = [0, 1, 0, 0, 1, 1, 4, 0, 1, 0, 0];
  sim.actualizarRadar();
  sim.verificarDeadlock();
  assert.equal(sim.activo, false);
  const ok = sim.reintentarSeguro();
  assert.equal(ok, true);
  assert.equal(sim.activo, true);
  assert.equal(sim.motivoFin, null);
  assert.deepEqual(sim.red.M, [6, 3, 1, 1, 0, 0, 0, 1, 0, 0, 0]);
});
