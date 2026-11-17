import test from 'node:test';
import assert from 'node:assert/strict';
import redJson from '../src/sed/modelos/dairycraft.json' with { type: 'json' };
import { RedPetri } from '../src/sed/redPetri.js';
import { grafoAlcanzabilidad, arbolCobertura } from '../src/sed/cobertura.js';
import { Aleatorio } from '../src/sed/aleatorio.js';

const nuevaRed = (monitorActivo = true) => new RedPetri(redJson, { monitorActivo });

test('dimensiones, M0 y matrices Pre/Post/A', () => {
  const red = nuevaRed(true);
  assert.equal(red.nP, 11);
  assert.equal(red.nT, 6);
  assert.deepEqual(red.M, [6, 3, 1, 1, 0, 0, 0, 1, 0, 0, 4]);
  assert.equal(red.pre.length, red.nT);
  assert.equal(red.pre[0].length, red.nP);
  assert.equal(red.A.length, red.nT);
  assert.equal(red.A[0].length, red.nP);
  assert.deepEqual(red.pre[0], [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1]);
  assert.deepEqual(red.post[0], [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]);
});

test('habilitación inicial y AND-join de t_iniciar_past', () => {
  const red = nuevaRed(true);
  assert.deepEqual(red.habilitadas().sort(), ['t_iniciar_past', 't_parar_emb'].sort());
  assert.equal(red.habilitada('t_embotellar'), false);
  const razon = red.razonNoHabilitada('t_embotellar');
  assert.equal(razon.habilitada, false);
  assert.ok(razon.texto.includes('Cuarto_frio'));
});

test('disparo, ecuación de estado y vector u', () => {
  const red = nuevaRed(true);
  const antes = [...red.M];
  const disparo = red.disparar('t_iniciar_past');
  const ti = red.idxTransicion.get('t_iniciar_past');
  for (let p = 0; p < red.nP; p++) {
    assert.equal(disparo.despues[p], antes[p] + red.A[ti][p]);
  }
  assert.deepEqual(disparo.u, [1, 0, 0, 0, 0, 0]);
  assert.deepEqual(red.M, [5, 2, 0, 1, 1, 0, 0, 1, 0, 0, 3]);
});

test('resultado() no modifica el marcado', () => {
  const red = nuevaRed(true);
  const antes = [...red.M];
  const resultado = red.resultado('t_iniciar_past');
  assert.ok(resultado);
  assert.deepEqual(red.M, antes);
  assert.equal(red.resultado('t_embotellar'), null);
});

test('conflicto por Vapor_disp entre pasteurizar y arrancar la embotelladora', () => {
  const red = nuevaRed(true);
  red.disparar('t_parar_emb');
  assert.ok(red.habilitada('t_arrancar_emb'));
  assert.ok(red.habilitada('t_iniciar_past'));
  const conflictos = red.conflictos();
  assert.ok(conflictos.some((c) => c.lugar === 'Vapor_disp'));
});

test('el deadlock de la ficha se alcanza con la secuencia de 16 disparos', () => {
  const red = nuevaRed(false);
  for (const t of redJson.deadlock.secuencia) {
    assert.ok(red.habilitada(t), `La transición ${t} debe estar habilitada`);
    red.disparar(t);
  }
  assert.equal(red.esMuerto(), true);
  assert.deepEqual(red.M, [0, 1, 0, 0, 1, 1, 4, 0, 1, 0, 0]);
  assert.deepEqual(red.marcadoObj(), {
    leche: 0,
    tanque: 1,
    vapor: 0,
    frio: 0,
    lote_past: 1,
    lote_enfr: 1,
    cuarto: 4,
    emb_lista: 0,
    emb_parada: 1,
    botellas: 0,
    cupo: 0
  });
});

test('el monitor Cupo_frio elimina el deadlock (146 marcados, 0 muertos)', () => {
  const red = nuevaRed(true);
  const grafo = grafoAlcanzabilidad(red, red.M);
  assert.equal(grafo.total, 146);
  assert.equal(grafo.muertos.length, 0);
  assert.equal(grafo.completo, true);
});

test('sin prevención hay 160 marcados y 1 deadlock', () => {
  const red = nuevaRed(false);
  const grafo = grafoAlcanzabilidad(red, red.M);
  assert.equal(grafo.total, 160);
  assert.equal(grafo.muertos.length, 1);
  assert.equal(grafo.completo, true);
});

test('los invariantes P se conservan en 1000 disparos aleatorios', () => {
  const red = nuevaRed(true);
  const rnd = new Aleatorio(123);
  for (let i = 0; i < 1000; i++) {
    const habilitadas = red.habilitadas();
    if (!habilitadas.length) {
      red.reiniciar();
      continue;
    }
    red.disparar(rnd.elegir(habilitadas));
    const inv = red.verificarInvariantes();
    assert.equal(inv.ok, true, `Invariante roto en el disparo ${i}: ${JSON.stringify(inv.resultados)}`);
  }
});

test('el árbol de cobertura marca ω en una red no acotada', () => {
  const json = {
    nombre: 'NoAcotada',
    lugares: [{ id: 'p', nombre: 'P', m0: 1, k: 99, capacidad: 'desborde' }],
    transiciones: [{ id: 't', nombre: 't', disparo: 'jugador' }],
    pre: [[1]],
    post: [[2]]
  };
  const red = new RedPetri(json);
  const arbol = arbolCobertura(red, red.M, 10);
  assert.ok(arbol.nodos.length >= 2);
  assert.equal(arbol.nodos[1].marcado[0], Infinity);
});
