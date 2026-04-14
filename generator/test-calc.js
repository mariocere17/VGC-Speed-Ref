'use strict';
// generator/test-calc.js
// Test runner for the pure math functions in calc.js.
// Run with: node generator/test-calc.js
//
// Strategy: calc.js is written as a browser script and touches the DOM at the
// very bottom (populateNatureSelects / populateStageSelects / loadData). We
// load it inside a Node `vm` context with minimal shims so function and
// constant declarations execute normally; the 3 init calls become no-ops.
// We then invoke the pure math/build functions directly against the real
// pokemon-stats.json and moves.json.

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT = path.join(__dirname, '..');

// ─── DOM shim ──────────────────────────────────────────────
// Every getElementById returns the same generic fake element so any chained
// access (.value, .innerHTML, .checked, .addEventListener) is safe.
function makeFakeEl() {
  return {
    value: '',
    innerHTML: '',
    textContent: '',
    checked: false,
    style: {},
    dataset: {},
    className: '',
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    querySelector() { return makeFakeEl(); },
    querySelectorAll() { return []; },
  };
}
const fakeDocument = {
  getElementById() { return makeFakeEl(); },
  querySelector()  { return makeFakeEl(); },
  querySelectorAll() { return []; },
  createElement()  { return makeFakeEl(); },
  addEventListener() {},
};

const ctx = {
  document:     fakeDocument,
  window:       {},
  localStorage: { getItem: () => null, setItem: () => {} },
  fetch:        () => Promise.reject(new Error('fetch disabled in tests')),
  console,
  Math, JSON, Set, Map, Array, Object, Number, Promise, Error,
  parseInt, parseFloat, isNaN,
};
vm.createContext(ctx);

// Load calc.js — loadData() will throw inside because fetch is rejected,
// but that happens asynchronously so top-level definitions still populate ctx.
const calcSource = fs.readFileSync(path.join(ROOT, 'calc.js'), 'utf8');
try { vm.runInContext(calcSource, ctx); }
catch (err) {
  console.error('Failed to load calc.js into VM:', err);
  process.exit(1);
}

// Inject real JSON data. calc.js declares `let PKMN` / `let MOVES`, which are
// lexical bindings — setting pkmnData from outside won't reach them. Run an
// assignment *inside* the same vm context so it writes to the existing bindings.
const pkmnData  = JSON.parse(fs.readFileSync(path.join(ROOT, 'pokemon-stats.json'), 'utf8'));
const movesData = JSON.parse(fs.readFileSync(path.join(ROOT, 'moves.json'),         'utf8'));
ctx.__pkmnData  = pkmnData;
ctx.__movesData = movesData;
vm.runInContext('PKMN = __pkmnData; MOVES = __movesData;', ctx);

// Same problem for reading the exported functions back out: we need to export
// them to the context globals. Do that via a runInContext too.
const exposeScript = `
  globalThis.__exp = {
    calcHP, calcStat, calcRolls, calcNHKOChance,
    getTypeEffRaw, getNatureMult, getStageMult,
    buildAtkStat, buildDefStat, buildEffBP, buildStabMult,
    applyPostMods, isImmune, effDefAbility, isGrounded,
  };
`;
vm.runInContext(exposeScript, ctx);
const fns = ctx.__exp;

// ─── Test harness ──────────────────────────────────────────
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name + '\n      ' + e.message); failed++; }
}
function assertEq(actual, expected, label) {
  if (actual !== expected)
    throw new Error(`${label || ''}: expected ${expected}, got ${actual}`);
}
function assertRange(actual, min, max, label) {
  if (actual < min || actual > max)
    throw new Error(`${label || ''}: expected ${min}..${max}, got ${actual}`);
}

// Helper to build the full state object that buildAtkStat/etc. expect
function makeState(overrides) {
  const base = {
    atkPkmn: '', atkMove: '', atkNature: 'Hardy',
    atkHpSP: 0, atkAtkSP: 0, atkDefSP: 0, atkSpaSP: 0, atkSpdSP: 0, atkSpeSP: 0,
    atkAtkStage: 0, atkDefStage: 0, atkSpaStage: 0, atkSpdStage: 0, atkSpeStage: 0,
    atkItem: '', atkAbility: '',
    defPkmn: '', defNature: 'Hardy',
    defHpSP: 0, defAtkSP: 0, defDefSP: 0, defSpaSP: 0, defSpdSP: 0, defSpeSP: 0,
    defAtkStage: 0, defDefStage: 0, defSpaStage: 0, defSpdStage: 0, defSpeStage: 0,
    defItem: '', defAbility: '', defHPPct: 100,
    weather: '', terrain: '',
    reflect: false, lightScreen: false, auroraVeil: false, crit: false,
  };
  return Object.assign(base, overrides);
}

// ─── Tests ─────────────────────────────────────────────────
console.log('\nStat formula tests');

test('Garchomp 0 HP SP → 183', () => {
  assertEq(fns.calcHP(108, 0), 183);
});
test('Garchomp 12 HP SP → 195', () => {
  assertEq(fns.calcHP(108, 12), 195);
});
test('Garchomp Adamant 32 Atk SP → 200', () => {
  assertEq(fns.calcStat(130, 32, 1.1), 200);
});
test('Garchomp neutral 0 Atk SP → 150', () => {
  assertEq(fns.calcStat(130, 0, 1.0), 150);
});

console.log('\nDamage roll tests');

test('Adamant 32 Atk Garchomp Dragon Claw vs 0/0 Garchomp → 158-188', () => {
  const s = makeState({
    atkPkmn: 'garchomp', defPkmn: 'garchomp',
    atkMove: 'Dragon Claw', atkNature: 'Adamant', atkAtkSP: 32,
  });
  const moveData = movesData['Dragon Claw'];
  const atkStat  = fns.buildAtkStat(s, moveData, true, '');
  const { hp, def } = fns.buildDefStat(s, moveData, true);
  const stab     = fns.buildStabMult(s, moveData, pkmnData['garchomp']);
  const rolls    = fns.calcRolls(atkStat, def, moveData.bp, stab, moveData.type, pkmnData['garchomp'].types);
  assertEq(rolls[0],  158, 'min roll');
  assertEq(rolls[15], 188, 'max roll');
  assertEq(hp, 183, 'defender HP');
});

test('Same vs 12 HP / 4 Def Garchomp → 152-182', () => {
  const s = makeState({
    atkPkmn: 'garchomp', defPkmn: 'garchomp',
    atkMove: 'Dragon Claw', atkNature: 'Adamant', atkAtkSP: 32,
    defHpSP: 12, defDefSP: 4,
  });
  const moveData = movesData['Dragon Claw'];
  const atkStat  = fns.buildAtkStat(s, moveData, true, '');
  const { hp, def } = fns.buildDefStat(s, moveData, true);
  const stab     = fns.buildStabMult(s, moveData, pkmnData['garchomp']);
  const rolls    = fns.calcRolls(atkStat, def, moveData.bp, stab, moveData.type, pkmnData['garchomp'].types);
  assertEq(rolls[0],  152, 'min roll');
  assertEq(rolls[15], 182, 'max roll');
  assertEq(hp, 195, 'defender HP');
});

console.log('\nModifier tests');

test('Huge Power doubles Atk stat (Azumarill base 50 → 200 Adamant+32)', () => {
  const s = makeState({
    atkPkmn: 'azumarill', atkMove: 'Play Rough',
    atkNature: 'Adamant', atkAtkSP: 32, atkAbility: 'huge-power',
  });
  const moveData = movesData['Play Rough'];
  const atkStat  = fns.buildAtkStat(s, moveData, true, '');
  // Base Atk 50 → (65+5+32)*1.1 = 112.2 → 112. Huge Power ×2 → 224.
  assertEq(atkStat, 224);
});

test('Multiscale halves damage at 100% HP only', () => {
  const s = makeState({
    atkPkmn: 'azumarill', defPkmn: 'dragonite',
    atkMove: 'Play Rough', atkNature: 'Adamant', atkAtkSP: 32,
    atkAbility: 'huge-power', defDefSP: 4,
    defAbility: 'multiscale', defHPPct: 100,
  });
  const moveData = movesData['Play Rough'];
  const atkStat  = fns.buildAtkStat(s, moveData, true, '');
  const { hp, def } = fns.buildDefStat(s, moveData, true);
  const stab     = fns.buildStabMult(s, moveData, pkmnData['azumarill']);
  let rolls      = fns.calcRolls(atkStat, def, moveData.bp, stab, moveData.type, pkmnData['dragonite'].types);
  const typeEff  = fns.getTypeEffRaw(moveData.type, pkmnData['dragonite'].types);
  const rolls100 = fns.applyPostMods(rolls, s, moveData, true, typeEff);

  const s99 = Object.assign({}, s, { defHPPct: 99 });
  const rolls99 = fns.applyPostMods(rolls, s99, moveData, true, typeEff);

  // At 100%, Multiscale should halve everything
  if (rolls100[0] >= rolls99[0])
    throw new Error(`Multiscale not reducing at 100%: 100%=${rolls100[0]} vs 99%=${rolls99[0]}`);
  // At 100%, rolls should be roughly half the 99% values
  assertRange(rolls100[0] / rolls99[0], 0.49, 0.51, 'Multiscale ratio');
});

test('Mold Breaker bypasses Multiscale', () => {
  const s = makeState({
    atkPkmn: 'haxorus', defPkmn: 'dragonite',
    atkMove: 'Outrage', atkNature: 'Adamant', atkAtkSP: 32,
    atkAbility: 'mold-breaker', defAbility: 'multiscale', defHPPct: 100,
  });
  const moveData = movesData['Outrage'];
  const atkStat  = fns.buildAtkStat(s, moveData, true, '');
  const { def }  = fns.buildDefStat(s, moveData, true);
  const stab     = fns.buildStabMult(s, moveData, pkmnData['haxorus']);
  const rolls    = fns.calcRolls(atkStat, def, moveData.bp, stab, moveData.type, pkmnData['dragonite'].types);
  const typeEff  = fns.getTypeEffRaw(moveData.type, pkmnData['dragonite'].types);
  const finalMB  = fns.applyPostMods(rolls, s, moveData, true, typeEff);

  const sNoMB   = Object.assign({}, s, { atkAbility: '' });
  const finalNo = fns.applyPostMods(rolls, sNoMB, moveData, true, typeEff);

  if (finalMB[0] <= finalNo[0])
    throw new Error(`Mold Breaker not bypassing Multiscale: MB=${finalMB[0]} vs no=${finalNo[0]}`);
});

test('Sun boosts Fire-type damage ×1.5', () => {
  const s = makeState({
    atkPkmn: 'charizard', defPkmn: 'garchomp',
    atkMove: 'Flamethrower', atkNature: 'Modest', atkSpaSP: 32,
    weather: 'sun',
  });
  const moveData = movesData['Flamethrower'];
  const atkStat  = fns.buildAtkStat(s, moveData, false, '');
  const { def }  = fns.buildDefStat(s, moveData, false);
  const stab     = fns.buildStabMult(s, moveData, pkmnData['charizard']);
  const rolls    = fns.calcRolls(atkStat, def, moveData.bp, stab, moveData.type, pkmnData['garchomp'].types);
  const typeEff  = fns.getTypeEffRaw(moveData.type, pkmnData['garchomp'].types);
  const sun      = fns.applyPostMods(rolls, s, moveData, false, typeEff);
  const nonSun   = fns.applyPostMods(rolls, Object.assign({}, s, { weather: '' }), moveData, false, typeEff);

  // Sun ratio ~1.5 (with floor errors)
  assertRange(sun[0] / nonSun[0], 1.49, 1.51, 'Sun ratio');
});

test('Yache Berry halves SE Ice damage, does nothing to non-SE', () => {
  const s = makeState({
    atkPkmn: 'alakazam', defPkmn: 'garchomp',
    atkMove: 'Ice Beam', atkNature: 'Modest', atkSpaSP: 32,
    defItem: 'berry-ice',
  });
  const moveData = movesData['Ice Beam'];
  const atkStat  = fns.buildAtkStat(s, moveData, false, '');
  const { def }  = fns.buildDefStat(s, moveData, false);
  const stab     = fns.buildStabMult(s, moveData, pkmnData['alakazam']);
  const rolls    = fns.calcRolls(atkStat, def, moveData.bp, stab, moveData.type, pkmnData['garchomp'].types);
  const typeEff  = fns.getTypeEffRaw(moveData.type, pkmnData['garchomp'].types); // 4×
  const withBerry = fns.applyPostMods(rolls, s, moveData, false, typeEff);
  const noBerry   = fns.applyPostMods(rolls, Object.assign({}, s, { defItem: '' }), moveData, false, typeEff);
  assertRange(withBerry[0] / noBerry[0], 0.49, 0.51, 'Yache halving on 4× Ice');

  // Same berry vs a non-matching type → should NOT activate
  const sOther = Object.assign({}, s, { atkMove: 'Tackle' });
  const moveN  = movesData['Tackle'];
  const atk2   = fns.buildAtkStat(sOther, moveN, true, '');
  const def2   = fns.buildDefStat(sOther, moveN, true).def;
  const stab2  = fns.buildStabMult(sOther, moveN, pkmnData['alakazam']);
  const rollsN = fns.calcRolls(atk2, def2, moveN.bp, stab2, moveN.type, pkmnData['garchomp'].types);
  const typeN  = fns.getTypeEffRaw(moveN.type, pkmnData['garchomp'].types);
  const afterBerry = fns.applyPostMods(rollsN, sOther, moveN, true, typeN);
  assertEq(afterBerry[0], rollsN[0], 'Ice berry should not react to Normal move');
});

test('Chilan Berry halves Normal damage at neutral effectiveness', () => {
  const s = makeState({
    atkPkmn: 'snorlax', defPkmn: 'alakazam',
    atkMove: 'Body Slam', atkNature: 'Adamant', atkAtkSP: 32,
    defItem: 'berry-normal',
  });
  const moveData = movesData['Body Slam'];
  const atkStat  = fns.buildAtkStat(s, moveData, true, '');
  const { def }  = fns.buildDefStat(s, moveData, true);
  const stab     = fns.buildStabMult(s, moveData, pkmnData['snorlax']);
  const rolls    = fns.calcRolls(atkStat, def, moveData.bp, stab, moveData.type, pkmnData['alakazam'].types);
  const typeEff  = fns.getTypeEffRaw(moveData.type, pkmnData['alakazam'].types); // 1×
  const withBerry = fns.applyPostMods(rolls, s, moveData, true, typeEff);
  const noBerry   = fns.applyPostMods(rolls, Object.assign({}, s, { defItem: '' }), moveData, true, typeEff);
  assertRange(withBerry[0] / noBerry[0], 0.49, 0.51, 'Chilan halving on neutral Normal');
});

test('Critical hit ignores positive Def stages', () => {
  const s = makeState({
    atkPkmn: 'garchomp', defPkmn: 'garchomp',
    atkMove: 'Dragon Claw', atkNature: 'Adamant', atkAtkSP: 32,
    defDefStage: 2, // +2 Def
  });
  const moveData = movesData['Dragon Claw'];
  const normal = fns.buildDefStat(s, moveData, true).def;
  const crit   = fns.buildDefStat(Object.assign({}, s, { crit: true }), moveData, true).def;
  // With crit, +2 stage should be ignored → crit def equals no-stage def
  const noStage = fns.buildDefStat(Object.assign({}, s, { defDefStage: 0 }), moveData, true).def;
  assertEq(crit, noStage);
  if (normal <= crit)
    throw new Error(`+2 Def boost should raise defense: normal=${normal} crit=${crit}`);
});

console.log('\nType effectiveness tests');

test('Dragon Claw vs Garchomp (Dragon/Ground) → 2×', () => {
  assertEq(fns.getTypeEffRaw('dragon', ['dragon', 'ground']), 2);
});
test('Ice Beam vs Garchomp → 4×', () => {
  assertEq(fns.getTypeEffRaw('ice', ['dragon', 'ground']), 4);
});
test('Electric vs Garchomp → 0×', () => {
  assertEq(fns.getTypeEffRaw('electric', ['dragon', 'ground']), 0);
});

// ─── Parser tests ──────────────────────────────────────────
// Export parser functions via vm the same way as the math functions.
vm.runInContext(`
  globalThis.__parser = { parseShowdownSet, parseShowdownText, parseEVs, normalisePkmnKey };
`, ctx);
const parser = ctx.__parser;

console.log('\nShowdown parser tests');

test('Milotic basic set', () => {
  const s = parser.parseShowdownSet([
    'Milotic @ Leftovers',
    'Ability: Competitive',
    'Level: 50',
    'EVs: 32 HP / 16 Def / 5 SpD / 13 Spe',
    'Bold Nature',
    '- Icy Wind',
    '- Scald',
    '- Protect',
    '- Recover',
  ].join('\n'));
  if (!s) throw new Error('parseShowdownSet returned null');
  assertEq(s.pokemon, 'milotic', 'pokemon key');
  assertEq(s.nature,  'Bold',    'nature');
  assertEq(s.sp.hp,   32,        'HP SP');
  assertEq(s.sp.def,  16,        'Def SP');
  assertEq(s.sp.spd,  5,         'SpD SP');
  assertEq(s.sp.spe,  13,        'Spe SP');
  assertEq(s.sp.atk,  0,         'Atk SP');
  assertEq(s.moves.length, 4,    'moves count');
  assertEq(s.moves[0], 'Icy Wind', 'first move');
  assertEq(s.clamped,  false,    'no clamping');
});

test('Set with nickname (Showdown: "Nickname (Species) @ Item")', () => {
  const s = parser.parseShowdownSet([
    'Fishy (Milotic) @ Sitrus Berry',
    'Ability: Marvel Scale',
    'EVs: 0 HP / 0 Def',
    'Timid Nature',
    '- Surf',
  ].join('\n'));
  if (!s) throw new Error('parseShowdownSet returned null');
  assertEq(s.pokemon, 'milotic', 'species resolved despite nickname');
});

test('Rotom-Wash form normalisation', () => {
  const key = parser.normalisePkmnKey('Rotom-Wash');
  if (!pkmnData[key]) throw new Error(`normalisePkmnKey('Rotom-Wash') → '${key}' not in PKMN`);
});

test('Multi-set import (2 sets separated by blank line)', () => {
  const text = [
    'Milotic @ Leftovers',
    'Ability: Competitive',
    'EVs: 32 HP / 0 Def',
    'Bold Nature',
    '- Scald',
    '',
    'Garchomp @ Choice Scarf',
    'Ability: Rough Skin',
    'EVs: 0 HP / 32 Atk',
    'Jolly Nature',
    '- Earthquake',
  ].join('\n');
  const { sets, warnings } = parser.parseShowdownText(text);
  assertEq(sets.length, 2, 'two sets parsed');
  assertEq(sets[0].pokemon, 'milotic',  'first set');
  assertEq(sets[1].pokemon, 'garchomp', 'second set');
  assertEq(warnings.length, 0, 'no warnings');
});

test('SP values >32 are clamped and flagged', () => {
  const s = parser.parseShowdownSet([
    'Garchomp @ Choice Band',
    'Ability: Rough Skin',
    'EVs: 252 HP / 252 Atk / 4 Spe',
    'Jolly Nature',
    '- Earthquake',
  ].join('\n'));
  if (!s) throw new Error('null');
  assertEq(s.sp.hp,  32, 'HP clamped to 32');
  assertEq(s.sp.atk, 32, 'Atk clamped to 32');
  assertEq(s.clamped, true, 'clamped flag set');
});

test('Unknown species returns null', () => {
  const s = parser.parseShowdownSet('NotARealPokemon @ Leftovers\nBold Nature\n- Tackle');
  if (s !== null) throw new Error(`Expected null, got set for "${s?.pokemon}"`);
});

// ─── Report ────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
