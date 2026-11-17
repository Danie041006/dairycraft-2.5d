import test from 'node:test';
import assert from 'node:assert/strict';
import tanqueJson from '../src/sed/modelos/tanque.json' with { type: 'json' };
import { Automata } from '../src/sed/automata.js';
import { componer, supervisor, SupervisorCIP, contarProductoTanques } from '../src/sed/composicion.js';
import { Aleatorio } from '../src/sed/aleatorio.js';

const especificacion = {
  nombre: 'Circuito_CIP',
  estados: ['Libre', 'Ocupado'],
  inicial: 'Libre',
  marcados: ['Libre', 'Ocupado'],
  eventos: [
    { id: 'iniciar_CIP', controlable: true },
    { id: 'CIP_ok', controlable: false }
  ],
  transiciones: [
    ['Libre', 'iniciar_CIP', 'Ocupado'],
    ['Ocupado', 'CIP_ok', 'Libre']
  ]
};

test('producto de 3 tanques: 216 estados, 16 prohibidos, 200 supervisados', () => {
  const tanques = Array.from({ length: 3 }, () => new Automata(tanqueJson));
  const r = contarProductoTanques(tanques, especificacion);
  assert.equal(r.totales.producto, 216);
  assert.equal(r.totales.prohibidos, 16);
  assert.equal(r.totales.supervisado, 200);
  assert.ok(r.prohibidos.includes('Lavado_CIP|Lavado_CIP|Vacio|Libre'));
});

test('producto de 2 tanques: 36 estados, 1 prohibido, 35 supervisados', () => {
  const tanques = Array.from({ length: 2 }, () => new Automata(tanqueJson));
  const r = contarProductoTanques(tanques, especificacion);
  assert.equal(r.totales.producto, 36);
  assert.equal(r.totales.prohibidos, 1);
  assert.equal(r.totales.supervisado, 35);
});

test('el supervisor CIP deshabilita iniciar_CIP en los demás tanques', () => {
  const tanques = Array.from({ length: 3 }, () => new Automata(tanqueJson));
  tanques[0].estado = 'Lavado_CIP';
  const sup = new SupervisorCIP(tanques);
  assert.equal(sup.ocupadoPor(), 0);
  assert.equal(sup.puede(0, 'iniciar_CIP'), true); // el que ya está en CIP no vuelve a iniciarlo
  assert.equal(sup.puede(1, 'iniciar_CIP'), false);
  assert.ok(sup.eventosDeshabilitados(2)[0].razon.includes('Tanque 1'));
});

test('10 000 eventos aleatorios con el supervisor nunca alcanzan 2 CIP', () => {
  const tanques = Array.from({ length: 3 }, () => new Automata(tanqueJson));
  const sup = new SupervisorCIP(tanques);
  const rnd = new Aleatorio(7);
  for (let i = 0; i < 10000; i++) {
    const indice = rnd.entero(0, 2);
    const automata = tanques[indice];
    const activos = automata.eventosActivos();
    if (!activos.length) continue;
    const evento = rnd.elegir(activos);
    if (evento.id === 'iniciar_CIP' && !sup.puede(indice, evento.id)) continue;
    automata.ejecutar(evento.id);
    const enCIP = tanques.filter((a) => a.estado === 'Lavado_CIP').length;
    assert.ok(enCIP <= 1, `Dos tanques en CIP en la iteración ${i}`);
  }
});

test('composición síncrona de dos autómatas y supervisor de seguridad', () => {
  const A = {
    nombre: 'A',
    estados: ['a0', 'a1'],
    inicial: 'a0',
    marcados: ['a0'],
    eventos: [
      { id: 'x', controlable: true },
      { id: 's', controlable: true }
    ],
    transiciones: [
      ['a0', 'x', 'a1'],
      ['a1', 's', 'a0']
    ]
  };
  const B = {
    nombre: 'B',
    estados: ['b0', 'b1'],
    inicial: 'b0',
    marcados: ['b0'],
    eventos: [
      { id: 'y', controlable: true },
      { id: 's', controlable: true }
    ],
    transiciones: [
      ['b0', 's', 'b1'],
      ['b1', 'y', 'b0']
    ]
  };
  const comp = componer([A, B], { compartidos: new Set(['s']) });
  assert.equal(comp.total, 4);
  const sup = supervisor(comp, ['a1|b1']);
  const inicial = sup.deshabilitados.get('a0|b0') ?? [];
  assert.ok(Array.isArray(inicial));
  assert.ok(sup.malos.includes('a1|b1'));
});
