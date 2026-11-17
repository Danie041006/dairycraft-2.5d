import test from 'node:test';
import assert from 'node:assert/strict';
import { Automata } from '../src/sed/automata.js';
import { Observador, construirObservador } from '../src/sed/observador.js';

const autoJson = {
  nombre: 'Sensor',
  estados: ['q0', 'q1', 'q2', 'q3'],
  inicial: 'q0',
  marcados: ['q2'],
  eventos: [
    { id: 'u', controlable: false, observable: false },
    { id: 'a', controlable: true, observable: true },
    { id: 'b', controlable: true, observable: true }
  ],
  transiciones: [
    ['q0', 'u', 'q1'],
    ['q1', 'a', 'q2'],
    ['q0', 'a', 'q3'],
    ['q3', 'b', 'q0']
  ]
};

test('la estimación inicial incluye el alcance no observable', () => {
  const obs = new Observador(new Automata(autoJson), ['u']);
  assert.deepEqual(obs.estadosPosibles(), ['q0', 'q1']);
});

test('después de a la estimación es {q2, q3} y contiene el estado real', () => {
  const automata = new Automata(autoJson);
  const obs = new Observador(automata, ['u']);
  automata.ejecutar('u');
  automata.ejecutar('a');
  assert.equal(automata.estado, 'q2');
  const estimacion = obs.observar('a');
  assert.deepEqual(estimacion, ['q2', 'q3']);
  assert.ok(estimacion.includes(automata.estado));
});

test('el observador construido tiene 2 estados y acepta la estimación con q2', () => {
  const obs = construirObservador(new Automata(autoJson), ['u']);
  assert.equal(obs.total, 2);
  assert.ok(obs.acepta.includes('q2|q3'));
});

test('100 secuencias aleatorias: la estimación siempre contiene el estado real', () => {
  const rnd = new (class {
    constructor(s) { this.s = s; }
    siguiente() { this.s = (this.s * 1103515245 + 12345) % 2147483648; return this.s / 2147483648; }
    elegir(a) { return a[Math.floor(this.siguiente() * a.length)]; }
  })(42);
  for (let i = 0; i < 100; i++) {
    const automata = new Automata(autoJson);
    const obs = new Observador(automata, ['u']);
    const eventos = ['u', 'a', 'b'];
    for (let j = 0; j < 8; j++) {
      const ev = rnd.elegir(eventos);
      if (!automata.puede(ev)) continue;
      automata.ejecutar(ev);
      obs.observar(ev);
      assert.ok(obs.estadosPosibles().includes(automata.estado));
    }
  }
});
