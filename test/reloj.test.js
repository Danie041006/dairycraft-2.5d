import test from 'node:test';
import assert from 'node:assert/strict';
import { Reloj } from '../src/sed/reloj.js';
import { Aleatorio } from '../src/sed/aleatorio.js';

test('los eventos se disparan en orden de tiempo, aunque se programen desordenados', () => {
  const reloj = new Reloj();
  const orden = [];
  reloj.programar(3, () => orden.push(3));
  reloj.programar(1, () => orden.push(1));
  reloj.programar(2, () => orden.push(2));
  reloj.avanzar(5);
  assert.deepEqual(orden, [1, 2, 3]);
  assert.equal(reloj.tiempo, 5);
  assert.equal(reloj.disparados, 3);
});

test('un evento programado dentro de un callback también se dispara', () => {
  const reloj = new Reloj();
  const orden = [];
  reloj.programar(1, () => {
    orden.push('primero');
    reloj.programar(0.5, () => orden.push('segundo'));
  });
  reloj.avanzar(5);
  assert.deepEqual(orden, ['primero', 'segundo']);
});

test('la misma semilla produce la misma secuencia aleatoria', () => {
  const a = new Aleatorio(2026);
  const b = new Aleatorio(2026);
  const c = new Aleatorio(2027);
  const sa = Array.from({ length: 5 }, () => a.siguiente());
  const sb = Array.from({ length: 5 }, () => b.siguiente());
  const sc = Array.from({ length: 5 }, () => c.siguiente());
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
});

test('pausar y reanudar el reloj', () => {
  const reloj = new Reloj();
  let disparos = 0;
  reloj.programar(1, () => disparos++);
  reloj.pausar();
  reloj.avanzar(10);
  assert.equal(disparos, 0);
  reloj.reanudar();
  reloj.avanzar(1);
  assert.equal(disparos, 1);
});

test('cancelar eventos por etiqueta', () => {
  const reloj = new Reloj();
  let disparos = 0;
  reloj.programar(1, () => disparos++, 'fallo');
  reloj.programar(2, () => disparos++, 'turno');
  reloj.cancelar('fallo');
  reloj.avanzar(3);
  assert.equal(disparos, 1);
});
