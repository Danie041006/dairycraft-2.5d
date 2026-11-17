import test from 'node:test';
import assert from 'node:assert/strict';
import tanqueJson from '../src/sed/modelos/tanque.json' with { type: 'json' };
import { Automata } from '../src/sed/automata.js';

const ejecutarPalabra = (palabra) => {
  const a = new Automata(tanqueJson);
  for (const codigo of palabra) {
    const evento = tanqueJson.eventos.find((e) => e.codigo === codigo);
    assert.ok(evento, `No existe el código ${codigo}`);
    a.ejecutar(evento.id);
  }
  return a;
};

const acepta = (palabra) => {
  try {
    return ejecutarPalabra(palabra).esMarcado();
  } catch {
    return false;
  }
};

test('el autómata del tanque es determinista', () => {
  assert.doesNotThrow(() => new Automata(tanqueJson));
  const copia = structuredClone(tanqueJson);
  copia.transiciones.push(['Llenando', 'iniciar_past', 'Fallo']);
  assert.throws(() => new Automata(copia), /no es determinista/);
});

test('palabras aceptadas: 4 casos', () => {
  const palabras = ['apfd', 'axic', 'apfdapfd', 'apfdaxic'];
  for (const w of palabras) {
    const a = ejecutarPalabra(w);
    assert.equal(a.estado, 'Vacio', `La palabra ${w} debe terminar en Vacio`);
    assert.ok(a.esMarcado(), `La palabra ${w} debe ser aceptada`);
  }
});

test('palabras rechazadas: 4 casos', () => {
  const invalidas = ['p', 'ap', 'apf', 'apfdxt'];
  for (const w of invalidas) {
    assert.equal(acepta(w), false, `La palabra ${w} debe rechazarse`);
  }
});

test('Γ(Vacio) = {abrir_valvula} y el historial guarda códigos', () => {
  const a = new Automata(tanqueJson);
  assert.deepEqual(a.eventosActivos().map((e) => e.id), ['abrir_valvula']);
  a.ejecutar('abrir_valvula');
  a.ejecutar('iniciar_past');
  assert.equal(a.estado, 'Pasteurizando');
  assert.deepEqual(a.historialCodigos(), ['a', 'p']);
});

test('ejecutar un evento fuera de δ lanza error y no cambia el estado', () => {
  const a = new Automata(tanqueJson);
  assert.throws(() => a.ejecutar('iniciar_past'), /no está definida/);
  assert.equal(a.estado, 'Vacio');
});
