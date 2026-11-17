// Genera los archivos académicos a partir de los JSON del núcleo:
//   modelos/automatas/tanque.jff
//   modelos/automatas/reparacion.jff
//   modelos/automatas/cip_supervisor.jff
//   modelos/petri/dairycraft.pnml
//   modelos/petri/dairycraft_sin_prevencion.pnml
// Uso: npm run modelos
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (ruta) => JSON.parse(readFileSync(join(raiz, ruta), 'utf8'));
const tanque = leer('src/sed/modelos/tanque.json');
const reparacion = leer('src/sed/modelos/reparacion.json');
const red = leer('src/sed/modelos/dairycraft.json');

const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function escribir(ruta, contenido) {
  const destino = join(raiz, ruta);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido, 'utf8');
  console.log('  ' + ruta);
}

function jflap({ nombre, estados, inicial, finales, transiciones, posiciones, escala = 2, offset = 80 }) {
  const id = new Map(estados.map((e, i) => [e, i]));
  const lineas = [];
  lineas.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
  lineas.push('<!--Created with JFLAP 7.1. Generado por scripts/generar-modelos.mjs-->');
  lineas.push('<structure>');
  lineas.push('  <type>fa</type>');
  lineas.push('  <automaton>');
  for (const [i, estado] of estados.entries()) {
    const [x, y] = posiciones[estado] ?? [80 + i * 90, 120];
    lineas.push(`    <state id="${i}" name="${esc(estado)}">`);
    lineas.push(`      <x>${Math.round(x * escala + offset)}</x>`);
    lineas.push(`      <y>${Math.round(y * escala + offset)}</y>`);
    if (estado === inicial) lineas.push('      <initial/>');
    if (finales.includes(estado)) lineas.push('      <final/>');
    lineas.push('    </state>');
  }
  for (const [origen, evento, destino] of transiciones) {
    lineas.push('    <transition>');
    lineas.push(`      <from>${id.get(origen)}</from>`);
    lineas.push(`      <to>${id.get(destino)}</to>`);
    lineas.push(`      <read>${esc(evento)}</read>`);
    lineas.push('    </transition>');
  }
  lineas.push('  </automaton>');
  lineas.push('</structure>');
  return lineas.join('\n') + '\n';
}

// 1) Tanque
const jffTanque = jflap({
  nombre: 'Tanque',
  estados: tanque.estados,
  inicial: tanque.inicial,
  finales: tanque.marcados,
  transiciones: tanque.transiciones.map(([o, e, d]) => [
    o,
    tanque.eventos.find((ev) => ev.id === e)?.codigo ?? e,
    d
  ]),
  posiciones: tanque.posiciones
});
escribir('modelos/automatas/tanque.jff', jffTanque);

// 2) DFA de reparación con estado trampa para que sea completo en JFLAP
const transRep = [...reparacion.transiciones];
const simbolos = reparacion.simbolos;
const salidas = new Map();
for (const [o, s] of transRep) {
  if (!salidas.has(o)) salidas.set(o, new Set());
  salidas.get(o).add(s);
}
for (const estado of reparacion.estados) {
  if (estado === reparacion.trampa) continue;
  for (const s of simbolos) {
    if (!salidas.get(estado)?.has(s)) transRep.push([estado, s, reparacion.trampa]);
  }
}
for (const s of simbolos) transRep.push([reparacion.trampa, s, reparacion.trampa]);
const jffRep = jflap({
  nombre: 'Reparacion_CIP',
  estados: reparacion.estados,
  inicial: reparacion.inicial,
  finales: reparacion.finales,
  transiciones: transRep,
  posiciones: reparacion.posiciones,
  escala: 1.4,
  offset: 60
});
escribir('modelos/automatas/reparacion.jff', jffRep);

// 3) Especificación del supervisor CIP
const spec = {
  estados: ['Libre', 'Ocupado'],
  inicial: 'Libre',
  finales: ['Libre', 'Ocupado'],
  transiciones: [
    ['Libre', 'iniciar_CIP', 'Ocupado'],
    ['Ocupado', 'CIP_ok', 'Libre']
  ],
  posiciones: { Libre: [80, 100], Ocupado: [300, 100] }
};
escribir('modelos/automatas/cip_supervisor.jff', jflap({ ...spec, escala: 2, offset: 80 }));

// 4) Red de Petri en PNML (con y sin prevención)
function pnml(redPetri, { conPrevencion, idNet }) {
  const lugares = conPrevencion
    ? redPetri.lugares
    : redPetri.lugares.filter((p) => p.id !== redPetri.monitor.lugar);
  const idx = new Map(lugares.map((p, i) => [p.id, i]));
  const lineas = [];
  lineas.push('<?xml version="1.0" encoding="UTF-8"?>');
  lineas.push('<pnml xmlns="http://www.pnml.org/version-2009/grammar/pnml">');
  lineas.push(`  <net id="${idNet}" type="http://www.pnml.org/version-2009/grammar/ptnet">`);
  lineas.push(`    <name><text>${esc(conPrevencion ? 'DairyCraft con Cupo_frio' : 'DairyCraft sin prevención')}</text></name>`);
  lineas.push('    <page id="page1">');
  lugares.forEach((p, i) => {
    const x = 80 + (i % 6) * 150;
    const y = 80 + Math.floor(i / 6) * 160;
    lineas.push(`      <place id="${esc(p.id)}">`);
    lineas.push(`        <name><text>${esc(p.nombre)}</text></name>`);
    lineas.push(`        <initialMarking><text>${conPrevencion || p.id !== redPetri.monitor.lugar ? p.m0 : 0}</text></initialMarking>`);
    lineas.push(`        <capacity><text>${p.k}</text></capacity>`);
    lineas.push(`        <graphics><position x="${x}" y="${y}"/></graphics>`);
    lineas.push('      </place>');
  });
  redPetri.transiciones.forEach((t, i) => {
    const x = 80 + i * 150;
    const y = 420;
    lineas.push(`      <transition id="${esc(t.id)}">`);
    lineas.push(`        <name><text>${esc(t.id)}</text></name>`);
    lineas.push(`        <graphics><position x="${x}" y="${y}"/></graphics>`);
    lineas.push('      </transition>');
  });
  let n = 0;
  const agregarArco = (origen, destino, peso) => {
    if (peso <= 0) return;
    lineas.push(`      <arc id="a${n++}" source="${esc(origen)}" target="${esc(destino)}">`);
    lineas.push(`        <inscription><text>${peso}</text></inscription>`);
    lineas.push('      </arc>');
  };
  redPetri.lugares.forEach((p, pi) => {
    if (!idx.has(p.id)) return;
    redPetri.transiciones.forEach((t, ti) => {
      agregarArco(p.id, t.id, redPetri.pre[ti][pi]);
      agregarArco(t.id, p.id, redPetri.post[ti][pi]);
    });
  });
  lineas.push('    </page>');
  lineas.push('  </net>');
  lineas.push('</pnml>');
  return lineas.join('\n') + '\n';
}

const redCon = JSON.parse(JSON.stringify(red));
const redSin = JSON.parse(JSON.stringify(red));
// En la variante sin prevención se eliminan los arcos del lugar monitor y su M0.
const idxCupo = redSin.lugares.findIndex((p) => p.id === redSin.monitor.lugar);
for (const id of redSin.monitor.transiciones) {
  const ti = redSin.transiciones.findIndex((t) => t.id === id);
  redSin.pre[ti][idxCupo] = 0;
  redSin.post[ti][idxCupo] = 0;
}
redSin.lugares[idxCupo].m0 = 0;

escribir('modelos/petri/dairycraft.pnml', pnml(redCon, { conPrevencion: true, idNet: 'dairycraft' }));
escribir('modelos/petri/dairycraft_sin_prevencion.pnml', pnml(redSin, { conPrevencion: false, idNet: 'dairycraft_sin_prevencion' }));

console.log('\nListo. Abre los .jff en JFLAP y los .pnml en PIPE2 para verificar y capturar.');
