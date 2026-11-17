import test from 'node:test';
import assert from 'node:assert/strict';
import reparacionJson from '../src/sed/modelos/reparacion.json' with { type: 'json' };
import { Lenguaje } from '../src/sed/lenguaje.js';

test('la palabra válida de la ficha PSESEAEZ es aceptada', () => {
  const l = new Lenguaje(reparacionJson);
  assert.equal(l.perteneceRegex('PSESEAEZ'), true);
  assert.equal(l.perteneceDFA('PSESEAEZ'), true);
  assert.deepEqual(l.validar('PSESEAEZ'), {
    palabra: 'PSESEAEZ',
    regex: true,
    dfa: true,
    coincide: true
  });
});

test('PSAEZ se rechaza porque falta el enjuague después de la soda', () => {
  const l = new Lenguaje(reparacionJson);
  assert.equal(l.pertenece('PSAEZ'), false);
});

test('la RegExp y el DFA coinciden en 20 palabras', () => {
  const l = new Lenguaje(reparacionJson);
  const palabras = [
    'PSEAEZ', 'PSESEAEZ', 'PSESESEAEZ', 'PSEAEAEZ', 'PSAEZ', 'PSEAE', 'PSEAZ',
    'PSEA', 'P', '', 'PS', 'PSE', 'PSEEZ', 'PSEAEEZ', 'PSESEZ', 'PSEEAEZ',
    'ZAPSE', 'pseaez', 'PSEAEZP', 'PSEAEZ '
  ];
  for (const w of palabras) {
    assert.equal(l.perteneceRegex(w), l.perteneceDFA(w), `RegExp y DFA difieren en ${w}`);
  }
});

test('avanzar muestra el progreso del DFA y rechaza símbolos fuera de lugar', () => {
  const l = new Lenguaje(reparacionJson);
  assert.equal(l.avanzar('P').ok, true);
  assert.equal(l.avanzar('S').ok, true);
  assert.equal(l.avanzar('E').ok, true);
  const invalido = l.avanzar('P');
  assert.equal(invalido.ok, false);
  assert.ok(invalido.motivo.includes('no hay transición'));
  l.reiniciar();
  assert.equal(l.avanzar('A').ok, false);
});
