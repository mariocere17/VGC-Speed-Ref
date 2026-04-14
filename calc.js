'use strict';

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════

const TYPE_CHART = {
  normal:   { rock:.5, ghost:0, steel:.5 },
  fire:     { fire:.5, water:.5, grass:2, ice:2, bug:2, rock:.5, dragon:.5, steel:2 },
  water:    { fire:2, water:.5, grass:.5, ground:2, rock:2, dragon:.5 },
  grass:    { fire:.5, water:2, grass:.5, poison:.5, ground:2, flying:.5, bug:.5, rock:2, dragon:.5, steel:.5 },
  electric: { water:2, grass:.5, electric:.5, ground:0, flying:2, dragon:.5 },
  ice:      { fire:.5, water:.5, grass:2, ice:.5, ground:2, flying:2, dragon:2, steel:.5 },
  fighting: { normal:2, ice:2, poison:.5, flying:.5, psychic:.5, bug:.5, rock:2, ghost:0, dark:2, steel:2, fairy:.5 },
  poison:   { grass:2, poison:.5, ground:.5, rock:.5, ghost:.5, steel:0, fairy:2 },
  ground:   { fire:2, grass:.5, electric:2, poison:2, flying:0, bug:.5, rock:2, steel:2 },
  flying:   { grass:2, electric:.5, fighting:2, bug:2, rock:.5, steel:.5 },
  psychic:  { fighting:2, poison:2, psychic:.5, dark:0, steel:.5 },
  bug:      { fire:.5, grass:2, fighting:.5, flying:.5, psychic:2, ghost:.5, dark:2, steel:.5, fairy:.5 },
  rock:     { fire:2, ice:2, fighting:.5, ground:.5, flying:2, bug:2, steel:.5 },
  ghost:    { normal:0, psychic:2, ghost:2, dark:.5 },
  dragon:   { dragon:2, steel:.5, fairy:0 },
  dark:     { fighting:.5, psychic:2, ghost:2, dark:.5, fairy:.5 },
  steel:    { fire:.5, water:.5, electric:.5, ice:2, rock:2, steel:.5, poison:0, fairy:2 },
  fairy:    { fire:.5, fighting:2, poison:.5, dragon:2, dark:2, steel:.5 },
};

// All 25 natures with their boosted/reduced stats
const NATURES = {
  Hardy:   { b:null, r:null }, Docile:  { b:null, r:null },
  Serious: { b:null, r:null }, Bashful: { b:null, r:null }, Quirky: { b:null, r:null },
  Lonely:  { b:'atk', r:'def' }, Brave:   { b:'atk', r:'spe' },
  Adamant: { b:'atk', r:'spa' }, Naughty: { b:'atk', r:'spd' },
  Bold:    { b:'def', r:'atk' }, Relaxed: { b:'def', r:'spe' },
  Impish:  { b:'def', r:'spa' }, Lax:     { b:'def', r:'spd' },
  Modest:  { b:'spa', r:'atk' }, Mild:    { b:'spa', r:'def' },
  Quiet:   { b:'spa', r:'spe' }, Rash:    { b:'spa', r:'spd' },
  Calm:    { b:'spd', r:'atk' }, Gentle:  { b:'spd', r:'def' },
  Sassy:   { b:'spd', r:'spe' }, Careful: { b:'spd', r:'spa' },
  Timid:   { b:'spe', r:'atk' }, Hasty:   { b:'spe', r:'def' },
  Jolly:   { b:'spe', r:'spa' }, Naive:   { b:'spe', r:'spd' },
};

function getNatureMult(nature, stat) {
  const n = NATURES[nature];
  if (!n) return 1.0;
  if (n.b === stat) return 1.1;
  if (n.r === stat) return 0.9;
  return 1.0;
}

// Ordered list of all stats for iteration
const STAT_KEYS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_IDS  = ['Hp', 'Atk', 'Def', 'Spa', 'Spd', 'Spe'];
const STAT_LABELS = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];

const ATK_ITEMS = [
  { id:'',              label:'None' },
  { id:'choice-band',   label:'Choice Band (Atk ×1.5)' },
  { id:'choice-specs',  label:'Choice Specs (SpA ×1.5)' },
  { id:'life-orb',      label:'Life Orb (damage ×1.3)' },
  { id:'expert-belt',   label:'Expert Belt (SE ×1.2)' },
  { id:'muscle-band',   label:'Muscle Band (Atk ×1.1)' },
  { id:'wise-glasses',  label:'Wise Glasses (SpA ×1.1)' },
  { id:'type-normal',   label:'Silk Scarf (Normal ×1.2)',     moveType:'normal' },
  { id:'type-fire',     label:'Charcoal (Fire ×1.2)',         moveType:'fire' },
  { id:'type-water',    label:'Mystic Water (Water ×1.2)',    moveType:'water' },
  { id:'type-grass',    label:'Miracle Seed (Grass ×1.2)',    moveType:'grass' },
  { id:'type-electric', label:'Magnet (Electric ×1.2)',       moveType:'electric' },
  { id:'type-ice',      label:'Never-Melt Ice (Ice ×1.2)',    moveType:'ice' },
  { id:'type-fighting', label:'Black Belt (Fighting ×1.2)',   moveType:'fighting' },
  { id:'type-poison',   label:'Poison Barb (Poison ×1.2)',    moveType:'poison' },
  { id:'type-ground',   label:'Soft Sand (Ground ×1.2)',      moveType:'ground' },
  { id:'type-flying',   label:'Sharp Beak (Flying ×1.2)',     moveType:'flying' },
  { id:'type-psychic',  label:'Twisted Spoon (Psychic ×1.2)', moveType:'psychic' },
  { id:'type-bug',      label:'Silver Powder (Bug ×1.2)',     moveType:'bug' },
  { id:'type-rock',     label:'Hard Stone (Rock ×1.2)',       moveType:'rock' },
  { id:'type-ghost',    label:'Spell Tag (Ghost ×1.2)',       moveType:'ghost' },
  { id:'type-dragon',   label:'Dragon Fang (Dragon ×1.2)',    moveType:'dragon' },
  { id:'type-dark',     label:'Black Glasses (Dark ×1.2)',    moveType:'dark' },
  { id:'type-steel',    label:'Metal Coat (Steel ×1.2)',      moveType:'steel' },
  { id:'type-fairy',    label:'Fairy Feather (Fairy ×1.2)',   moveType:'fairy' },
];

const DEF_ITEMS = [
  { id:'',             label:'None' },
  { id:'assault-vest', label:'Assault Vest (SpD ×1.5)' },
  { id:'eviolite',     label:'Eviolite (Def/SpD ×1.5)' },
];

const ATK_ABILITIES = [
  { id:'',             label:'None' },
  { id:'adaptability', label:'Adaptability (STAB ×2)' },
  { id:'huge-power',   label:'Huge Power (Atk ×2)' },
  { id:'pure-power',   label:'Pure Power (Atk ×2)' },
  { id:'technician',   label:'Technician (BP≤60 ×1.5)' },
  { id:'sheer-force',  label:'Sheer Force (secondary ×1.3)' },
  { id:'tough-claws',  label:'Tough Claws (contact ×1.3)' },
  { id:'iron-fist',    label:'Iron Fist (punch ×1.2)' },
  { id:'guts',         label:'Guts (statused Atk ×1.5)' },
];

const DEF_ABILITIES = [
  { id:'',              label:'None' },
  { id:'intimidate',    label:'Intimidate (Atk −1 stage)' },
  { id:'thick-fat',     label:'Thick Fat (Fire/Ice ×0.5)' },
  { id:'solid-rock',    label:'Solid Rock (SE ×0.75)' },
  { id:'filter',        label:'Filter (SE ×0.75)' },
  { id:'multiscale',    label:'Multiscale (full HP ×0.5)' },
  { id:'shadow-shield', label:'Shadow Shield (full HP ×0.5)' },
  { id:'fur-coat',      label:'Fur Coat (physical ×0.5)' },
  { id:'levitate',      label:'Levitate (Ground immune)' },
  { id:'flash-fire',    label:'Flash Fire (Fire immune)' },
  { id:'volt-absorb',   label:'Volt Absorb (Electric immune)' },
  { id:'water-absorb',  label:'Water Absorb (Water immune)' },
  { id:'storm-drain',   label:'Storm Drain (Water immune)' },
];

// ═══════════════════════════════════════════════════════════
//  DATA GLOBALS
// ═══════════════════════════════════════════════════════════
let PKMN      = {};  // pokemon-stats.json
let MOVES     = {};  // moves.json
let CHAMPIONS = new Set();  // lowercase keys of Champions Pokémon

// ═══════════════════════════════════════════════════════════
//  MATH — stat formulas (SP system, Champions)
// ═══════════════════════════════════════════════════════════

// Non-HP stats: SP is added inside nature multiplication
// Verified: Garchomp 130 Atk, 32 SP, Adamant → floor((145+5+32)*1.1) = 200
function calcStat(base, sp, nat) {
  return Math.floor((Math.floor((2 * base + 31) * 50 / 100) + 5 + sp) * nat);
}

// HP has no nature
// Verified: Garchomp 108 HP, 0 SP → 123+60 = 183 ✓ | 12 SP → 195 ✓
function calcHP(base, sp) {
  return Math.floor((2 * base + 31) * 50 / 100) + 60 + sp;
}

function getTypeEff(atkType, defTypes) {
  if (!atkType || !defTypes) return 1;
  const chart = TYPE_CHART[atkType] || {};
  let eff = 1;
  for (const dt of defTypes) eff = Math.floor(eff * (chart[dt] ?? 1) * 4096) / 4096;
  return eff;
}

function getTypeEffRaw(atkType, defTypes) {
  const chart = TYPE_CHART[atkType] || {};
  return (chart[defTypes[0]] ?? 1) * (defTypes[1] ? (chart[defTypes[1]] ?? 1) : 1);
}

function isSTAB(moveType, pkmnTypes) {
  return pkmnTypes && pkmnTypes.includes(moveType);
}

// 16 damage rolls (r = 85..100)
// Order: BASE → random → STAB → type (each floored)
function calcRolls(atkStat, defStat, bp, stabMult, atkType, defTypes) {
  if (!bp || !atkStat || !defStat) return new Array(16).fill(0);

  const chart = TYPE_CHART[atkType] || {};
  const typeEff1 = chart[defTypes[0]] ?? 1;
  const typeEff2 = defTypes[1] ? (chart[defTypes[1]] ?? 1) : 1;

  if (typeEff1 === 0 || typeEff2 === 0) return new Array(16).fill(0);

  const base = Math.floor(Math.floor(Math.floor(22 * bp * atkStat / defStat) / 50) + 2);
  const rolls = [];
  for (let r = 0; r < 16; r++) {
    let d = Math.floor(base * (85 + r) / 100);
    if (stabMult > 1) d = Math.floor(d * stabMult);
    d = Math.floor(d * typeEff1);
    d = Math.floor(d * typeEff2);
    rolls.push(d);
  }
  return rolls;
}

// ═══════════════════════════════════════════════════════════
//  READ STATE FROM DOM
// ═══════════════════════════════════════════════════════════
function spVal(id) { return parseInt(document.getElementById(id)?.value) || 0; }

function readState() {
  return {
    atkPkmn:    document.getElementById('atkPkmn').value.toLowerCase().trim(),
    atkMove:    document.getElementById('atkMove').value.trim(),
    atkNature:  document.getElementById('atkNature').value,
    atkHpSP:    spVal('atkHpSP'),
    atkAtkSP:   spVal('atkAtkSP'),
    atkDefSP:   spVal('atkDefSP'),
    atkSpaSP:   spVal('atkSpaSP'),
    atkSpdSP:   spVal('atkSpdSP'),
    atkSpeSP:   spVal('atkSpeSP'),
    atkItem:    document.getElementById('atkItem').value,
    atkAbility: document.getElementById('atkAbility').value,

    defPkmn:    document.getElementById('defPkmn').value.toLowerCase().trim(),
    defNature:  document.getElementById('defNature').value,
    defHpSP:    spVal('defHpSP'),
    defAtkSP:   spVal('defAtkSP'),
    defDefSP:   spVal('defDefSP'),
    defSpaSP:   spVal('defSpaSP'),
    defSpdSP:   spVal('defSpdSP'),
    defSpeSP:   spVal('defSpeSP'),
    defItem:    document.getElementById('defItem').value,
    defAbility: document.getElementById('defAbility').value,
  };
}

// ═══════════════════════════════════════════════════════════
//  MODIFIER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function buildAtkStat(s, moveData, isPhysical, defAbility) {
  const pkmnData = PKMN[s.atkPkmn];
  if (!pkmnData) return 0;
  const statKey = isPhysical ? 'atk' : 'spa';
  const sp      = isPhysical ? s.atkAtkSP : s.atkSpaSP;
  const nat     = getNatureMult(s.atkNature, statKey);
  let stat = calcStat(pkmnData[statKey], sp, nat);

  if (s.atkItem === 'choice-band'  && isPhysical)  stat = Math.floor(stat * 1.5);
  if (s.atkItem === 'choice-specs' && !isPhysical) stat = Math.floor(stat * 1.5);
  if (s.atkItem === 'muscle-band'  && isPhysical)  stat = Math.floor(stat * 1.1);
  if (s.atkItem === 'wise-glasses' && !isPhysical) stat = Math.floor(stat * 1.1);
  if (s.atkItem.startsWith('type-')) {
    const itemDef = ATK_ITEMS.find(i => i.id === s.atkItem);
    if (itemDef && itemDef.moveType === moveData.type) stat = Math.floor(stat * 1.2);
  }
  if ((s.atkAbility === 'huge-power' || s.atkAbility === 'pure-power') && isPhysical)
    stat = Math.floor(stat * 2);
  if (defAbility === 'intimidate' && isPhysical)
    stat = Math.floor(stat * 2 / 3);

  return stat;
}

function buildEffBP(s, moveData) {
  let bp = moveData.bp;
  if (s.atkAbility === 'technician' && bp <= 60) bp = Math.floor(bp * 1.5);
  return bp;
}

function buildStabMult(s, moveData, pkmnData) {
  if (!isSTAB(moveData.type, pkmnData.types)) return 1;
  return s.atkAbility === 'adaptability' ? 2 : 1.5;
}

function buildDefStat(s, moveData, isPhysical) {
  const pkmnData = PKMN[s.defPkmn];
  if (!pkmnData) return { hp: 1, def: 1 };
  const hp      = calcHP(pkmnData.hp, s.defHpSP);
  const statKey = isPhysical ? 'def' : 'spd';
  const sp      = isPhysical ? s.defDefSP : s.defSpdSP;
  const nat     = getNatureMult(s.defNature, statKey);
  let def = calcStat(pkmnData[statKey], sp, nat);

  if (s.defItem === 'assault-vest' && !isPhysical) def = Math.floor(def * 1.5);
  if (s.defItem === 'eviolite')                    def = Math.floor(def * 1.5);

  return { hp, def };
}

function applyPostMods(rolls, s, moveData, isPhysical, typeEff) {
  let r = rolls;
  if (s.defAbility === 'thick-fat' && (moveData.type === 'fire' || moveData.type === 'ice'))
    r = r.map(d => Math.floor(d * 0.5));
  if ((s.defAbility === 'solid-rock' || s.defAbility === 'filter') && typeEff > 1)
    r = r.map(d => Math.floor(d * 3 / 4));
  if (s.defAbility === 'multiscale' || s.defAbility === 'shadow-shield')
    r = r.map(d => Math.floor(d * 0.5));
  if (s.defAbility === 'fur-coat' && isPhysical)
    r = r.map(d => Math.floor(d * 0.5));
  if (s.atkAbility === 'sheer-force' && moveData.hasSecondary)
    r = r.map(d => Math.floor(d * 1.3));
  if (s.atkAbility === 'tough-claws' && moveData.makesContact)
    r = r.map(d => Math.floor(d * 1.3));
  if (s.atkAbility === 'iron-fist' && moveData.isPunch)
    r = r.map(d => Math.floor(d * 1.2));
  if (s.atkAbility === 'guts' && isPhysical)
    r = r.map(d => Math.floor(d * 1.5));
  if (s.atkItem === 'life-orb')  r = r.map(d => Math.floor(d * 1.3));
  if (s.atkItem === 'expert-belt' && typeEff > 1) r = r.map(d => Math.floor(d * 1.2));
  return r;
}

function isImmune(moveType, defAbility) {
  if (defAbility === 'levitate'    && moveType === 'ground')   return true;
  if (defAbility === 'flash-fire'  && moveType === 'fire')     return true;
  if (defAbility === 'volt-absorb' && moveType === 'electric') return true;
  if ((defAbility === 'water-absorb' || defAbility === 'storm-drain') && moveType === 'water') return true;
  return false;
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPUTE
// ═══════════════════════════════════════════════════════════
function computeAll() {
  const s = readState();
  const atkData  = PKMN[s.atkPkmn];
  const defData  = PKMN[s.defPkmn];
  const moveData = MOVES[s.atkMove];

  updateTypeBadges(s.atkPkmn, 'atkTypeRow');
  updateTypeBadges(s.defPkmn, 'defTypeRow');
  updateMoveCat(moveData);
  updateStatDisplays('atk', s, atkData, moveData);
  updateStatDisplays('def', s, defData, moveData);

  if (!atkData || !defData || !moveData || moveData.category === 'status') {
    document.getElementById('dmgBlock').innerHTML =
      '<p class="dmg-placeholder">Enter a Pokémon, move, and defender above to calculate damage.</p>';
    document.getElementById('optOutput').innerHTML = '';
    return;
  }

  const isPhysical = moveData.category === 'physical';
  const typeEff    = getTypeEffRaw(moveData.type, defData.types);

  if (isImmune(moveData.type, s.defAbility)) {
    document.getElementById('dmgBlock').innerHTML = renderImmune(moveData, defData, s.defAbility);
    document.getElementById('optOutput').innerHTML = '';
    return;
  }

  const atkStat  = buildAtkStat(s, moveData, isPhysical, s.defAbility);
  const effBP    = buildEffBP(s, moveData);
  const stabMult = buildStabMult(s, moveData, atkData);
  const { hp, def: defStat } = buildDefStat(s, moveData, isPhysical);

  let rolls = calcRolls(atkStat, defStat, effBP, stabMult, moveData.type, defData.types);
  rolls = applyPostMods(rolls, s, moveData, isPhysical, typeEff);

  document.getElementById('dmgBlock').innerHTML =
    renderDamage(rolls, hp, s, moveData, atkData, defData, atkStat, defStat, stabMult, typeEff, isPhysical);
  document.getElementById('optOutput').innerHTML = '';
}

// ═══════════════════════════════════════════════════════════
//  OPTIMIZATION
// ═══════════════════════════════════════════════════════════

window.findMinSurvive = function () {
  const s = readState();
  const atkData  = PKMN[s.atkPkmn];
  const defData  = PKMN[s.defPkmn];
  const moveData = MOVES[s.atkMove];
  if (!atkData || !defData || !moveData || moveData.category === 'status') return;

  const isPhysical = moveData.category === 'physical';
  const typeEff    = getTypeEffRaw(moveData.type, defData.types);
  if (isImmune(moveData.type, s.defAbility)) return;

  const atkStat  = buildAtkStat(s, moveData, isPhysical, s.defAbility);
  const effBP    = buildEffBP(s, moveData);
  const stabMult = buildStabMult(s, moveData, atkData);
  const statKey  = isPhysical ? 'def' : 'spd';

  const solutions = [];
  for (let hpSP = 0; hpSP <= 32; hpSP++) {
    for (let defSP = 0; defSP <= 32; defSP++) {
      const hp  = calcHP(defData.hp, hpSP);
      const nat = getNatureMult(s.defNature, statKey);
      let def   = calcStat(defData[statKey], defSP, nat);
      if (s.defItem === 'assault-vest' && !isPhysical) def = Math.floor(def * 1.5);
      if (s.defItem === 'eviolite')                    def = Math.floor(def * 1.5);

      let rolls = calcRolls(atkStat, def, effBP, stabMult, moveData.type, defData.types);
      rolls = applyPostMods(rolls, s, moveData, isPhysical, typeEff);
      if (rolls[0] < hp) solutions.push({ hpSP, defSP, total: hpSP + defSP, rolls, hp });
    }
  }
  solutions.sort((a, b) => a.total - b.total || a.defSP - b.defSP);

  const out = document.getElementById('optOutput');
  if (!solutions.length) {
    out.innerHTML = `<div class="opt-section">
      <div class="opt-title">🛡 Min SP to survive</div>
      <div class="opt-result opt-none">Cannot guarantee survival with up to 32 HP SP + 32 ${isPhysical?'Def':'SpD'} SP.</div>
    </div>`;
    return;
  }

  const best     = solutions[0];
  const koCount  = best.rolls.filter(r => r >= best.hp).length;
  const koLabel  = koCount === 0 ? '0%' : `${(koCount / 16 * 100).toFixed(2)}%`;
  const minPct   = (best.rolls[0] / best.hp * 100).toFixed(1);
  const maxPct   = (best.rolls[15] / best.hp * 100).toFixed(1);
  const defLabel = isPhysical ? 'Def' : 'SpD';

  out.innerHTML = `<div class="opt-section">
    <div class="opt-title">🛡 Min SP to survive</div>
    <div class="opt-result">
      <span class="opt-sp">+${best.hpSP} HP SP + ${best.defSP} ${defLabel} SP</span>
      <span style="color:var(--muted)"> (${best.total} SP total)</span><br>
      After: ${best.rolls[0]}–${best.rolls[15]} (${minPct}%–${maxPct}%)
      &nbsp;·&nbsp; ${koLabel} OHKO
    </div>
  </div>`;
};

window.findMinOHKO = function () {
  const s = readState();
  const atkData  = PKMN[s.atkPkmn];
  const defData  = PKMN[s.defPkmn];
  const moveData = MOVES[s.atkMove];
  if (!atkData || !defData || !moveData || moveData.category === 'status') return;

  const isPhysical = moveData.category === 'physical';
  const typeEff    = getTypeEffRaw(moveData.type, defData.types);
  if (isImmune(moveData.type, s.defAbility)) return;

  const effBP    = buildEffBP(s, moveData);
  const stabMult = buildStabMult(s, moveData, atkData);
  const { hp, def: defStat } = buildDefStat(s, moveData, isPhysical);
  const statKey  = isPhysical ? 'atk' : 'spa';
  const curSP    = isPhysical ? s.atkAtkSP : s.atkSpaSP;

  const THRESHOLDS = [
    { rolls: 1,  label: '6.25%  (1/16)',   pct: 6.25 },
    { rolls: 4,  label: '25%    (4/16)',    pct: 25 },
    { rolls: 8,  label: '50%    (8/16)',    pct: 50 },
    { rolls: 16, label: 'Guaranteed OHKO',  pct: 100 },
  ];

  const results = [];
  for (const thresh of THRESHOLDS) {
    let found = null;
    for (let sp = 0; sp <= 32; sp++) {
      const nat = getNatureMult(s.atkNature, statKey);
      let atkStat = calcStat(atkData[statKey], sp, nat);
      if (s.atkItem === 'choice-band'  && isPhysical)  atkStat = Math.floor(atkStat * 1.5);
      if (s.atkItem === 'choice-specs' && !isPhysical) atkStat = Math.floor(atkStat * 1.5);
      if (s.atkItem === 'muscle-band'  && isPhysical)  atkStat = Math.floor(atkStat * 1.1);
      if (s.atkItem === 'wise-glasses' && !isPhysical) atkStat = Math.floor(atkStat * 1.1);
      if (s.atkItem.startsWith('type-')) {
        const itemDef = ATK_ITEMS.find(i => i.id === s.atkItem);
        if (itemDef && itemDef.moveType === moveData.type) atkStat = Math.floor(atkStat * 1.2);
      }
      if ((s.atkAbility === 'huge-power' || s.atkAbility === 'pure-power') && isPhysical)
        atkStat = Math.floor(atkStat * 2);
      if (s.defAbility === 'intimidate' && isPhysical)
        atkStat = Math.floor(atkStat * 2 / 3);

      let rolls = calcRolls(atkStat, defStat, effBP, stabMult, moveData.type, defData.types);
      rolls = applyPostMods(rolls, s, moveData, isPhysical, typeEff);
      const koRolls = rolls.filter(r => r >= hp).length;
      if (koRolls >= thresh.rolls) { found = { sp, atkStat, koRolls, rolls }; break; }
    }
    results.push({ ...thresh, found });
  }

  const statLabel = isPhysical ? 'Atk' : 'SpA';
  const defLabel  = isPhysical ? 'Def' : 'SpD';

  let rows = '';
  for (const r of results) {
    const isCurrent = r.found && r.found.sp === curSP;
    rows += `<tr class="${isCurrent ? 'ohko-current' : ''}">
      <td>${r.label}</td>
      <td>${r.found ? r.found.sp + ' ' + statLabel + ' SP' : '—'}</td>
      <td>${r.found
        ? `${r.found.rolls[0]}–${r.found.rolls[15]} · ${(r.found.koRolls/16*100).toFixed(2)}% KO`
        : 'Cannot reach'}</td>
    </tr>`;
  }

  document.getElementById('optOutput').innerHTML = `<div class="opt-section">
    <div class="opt-title">⚔ Min SP to OHKO (defender: ${s.defHpSP} HP SP · ${isPhysical?s.defDefSP:s.defSpdSP} ${defLabel} SP)</div>
    <table class="ohko-table"><tbody>${rows}</tbody></table>
  </div>`;
};

// ═══════════════════════════════════════════════════════════
//  SWAP PANELS
// ═══════════════════════════════════════════════════════════
window.swapPanels = function () {
  function swapVals(id1, id2) {
    const a = document.getElementById(id1);
    const b = document.getElementById(id2);
    if (!a || !b) return;
    const tmp = a.value; a.value = b.value; b.value = tmp;
  }

  swapVals('atkPkmn', 'defPkmn');
  swapVals('atkNature', 'defNature');
  swapVals('atkItem', 'defItem');
  swapVals('atkAbility', 'defAbility');

  // Swap all 6 SP sliders and their display spans
  for (const id of STAT_IDS) {
    swapVals('atk' + id + 'SP', 'def' + id + 'SP');
    const aVal = document.getElementById('atk' + id + 'SPVal');
    const bVal = document.getElementById('def' + id + 'SPVal');
    if (aVal) aVal.textContent = document.getElementById('atk' + id + 'SP').value;
    if (bVal) bVal.textContent = document.getElementById('def' + id + 'SP').value;
  }

  // Update move datalist, ability selects, and sprites for the new roles
  const newAtkKey = document.getElementById('atkPkmn').value.toLowerCase().trim();
  const newDefKey = document.getElementById('defPkmn').value.toLowerCase().trim();
  updateMoveDatalist(newAtkKey);
  updateAbilitySelect('atk', newAtkKey);
  updateAbilitySelect('def', newDefKey);
  updateSprite('atk', newAtkKey);
  updateSprite('def', newDefKey);

  computeAll();
};

// ═══════════════════════════════════════════════════════════
//  DISPLAY
// ═══════════════════════════════════════════════════════════

function renderDamage(rolls, hp, s, moveData, atkData, defData, atkStat, defStat, stabMult, typeEff, isPhysical) {
  const minDmg = rolls[0], maxDmg = rolls[15];
  const minPct = (minDmg / hp * 100).toFixed(1);
  const maxPct = (maxDmg / hp * 100).toFixed(1);
  const koCount = rolls.filter(r => r >= hp).length;

  let koClass = 'ko-0', koText = '0% chance to OHKO';
  if (koCount === 16)     { koClass = 'ko-full'; koText = 'Guaranteed OHKO'; }
  else if (koCount >= 8)  { koClass = 'ko-high'; koText = `${(koCount/16*100).toFixed(2)}% chance to OHKO`; }
  else if (koCount >= 1)  { koClass = 'ko-low';  koText = `${(koCount/16*100).toFixed(2)}% chance to OHKO`; }

  let typeTag = '';
  if (typeEff === 0)        typeTag = '<span class="dmg-tag tag-imm">Immune</span>';
  else if (typeEff >= 4)    typeTag = `<span class="dmg-tag tag-se4">4× ${moveData.type}</span>`;
  else if (typeEff >= 2)    typeTag = `<span class="dmg-tag tag-se2">2× ${moveData.type}</span>`;
  else if (typeEff <= 0.5)  typeTag = `<span class="dmg-tag tag-nve">${typeEff}× ${moveData.type}</span>`;

  const stabTag = stabMult > 1
    ? `<span class="dmg-tag tag-stab">${stabMult === 2 ? 'Adaptability' : 'STAB'}</span>`
    : '';

  const cells = rolls.map(d =>
    `<div class="roll-cell${d >= hp ? ' ko' : ''}" title="${d}"></div>`
  ).join('');

  const isPhysLabel  = isPhysical ? 'Atk' : 'SpA';
  const defStatLabel = isPhysical ? 'Def' : 'SpD';
  const atkSPVal     = isPhysical ? s.atkAtkSP : s.atkSpaSP;
  const defSPVal     = isPhysical ? s.defDefSP : s.defSpdSP;
  const atkNatChar   = getNatureMult(s.atkNature, isPhysical ? 'atk' : 'spa') > 1 ? '＋'
                     : getNatureMult(s.atkNature, isPhysical ? 'atk' : 'spa') < 1 ? '−' : '●';
  const defNatChar   = getNatureMult(s.defNature, isPhysical ? 'def' : 'spd') > 1 ? '＋'
                     : getNatureMult(s.defNature, isPhysical ? 'def' : 'spd') < 1 ? '−' : '●';

  return `
    <div class="dmg-header">
      <span class="dmg-range">${s.atkMove} → <strong>${minDmg}–${maxDmg}</strong></span>
      <span class="dmg-pct">(${minPct}%–${maxPct}%)</span>
      <span class="dmg-ko ${koClass}">${koText}</span>
    </div>
    <div class="dmg-tags">${stabTag}${typeTag}</div>
    <div class="rolls-row">${cells}</div>
    <div class="dmg-stats">
      <strong>${atkData.displayName}</strong> ${isPhysLabel} <strong>${atkStat}</strong>
      (${atkSPVal} SP ${atkNatChar})
      &nbsp;→&nbsp;
      <strong>${defData.displayName}</strong> HP <strong>${hp}</strong>
      ${defStatLabel} <strong>${defStat}</strong>
      (${s.defHpSP} HP SP · ${defSPVal} ${defStatLabel} SP ${defNatChar})
    </div>
  `;
}

function renderImmune(moveData, defData, defAbility) {
  const abilityDef = DEF_ABILITIES.find(a => a.id === defAbility);
  return `<div class="dmg-header">
    <span class="dmg-range">No effect</span>
    <div class="dmg-tags"><span class="dmg-tag tag-imm">Immune — ${abilityDef?.label || defAbility}</span></div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════
//  STAT DISPLAYS (inline computed values + SP counter)
// ═══════════════════════════════════════════════════════════

function updateStatDisplays(prefix, s, pkmnData, moveData) {
  const nature = prefix === 'atk' ? s.atkNature : s.defNature;

  // Determine which stats are relevant for color coding in the context of the move
  // (attacker: offensive stat; defender: HP + defensive stat)
  const isPhysical = moveData?.category === 'physical';
  const relevantAtk = moveData ? (isPhysical ? 'atk' : 'spa') : null;
  const relevantDef = moveData ? (isPhysical ? 'def' : 'spd') : null;

  for (let i = 0; i < STAT_KEYS.length; i++) {
    const statKey = STAT_KEYS[i];
    const statId  = STAT_IDS[i];
    const spId    = prefix + statId + 'SP';
    const compId  = prefix + statId + 'Comp';
    const lblId   = prefix + 'Lbl' + statId;

    const sp    = spVal(spId);
    const compEl = document.getElementById(compId);
    const lblEl  = document.getElementById(lblId);
    if (!compEl) continue;

    if (!pkmnData) { compEl.textContent = '—'; compEl.className = 'stat-computed'; continue; }

    let val;
    if (statKey === 'hp') {
      val = calcHP(pkmnData.hp, sp);
    } else {
      val = calcStat(pkmnData[statKey], sp, getNatureMult(nature, statKey));
    }
    compEl.textContent = val;

    // Color code by nature boost/reduce
    const natMult = statKey === 'hp' ? 1 : getNatureMult(nature, statKey);
    compEl.className = 'stat-computed'
      + (natMult > 1 ? ' stat-boosted' : natMult < 1 ? ' stat-reduced' : '');

    // Bold the relevant offensive/defensive stat label
    if (lblEl) {
      const isRelevant = prefix === 'atk'
        ? (statKey === relevantAtk)
        : (statKey === 'hp' || statKey === relevantDef);
      lblEl.style.fontWeight = (moveData && isRelevant) ? '700' : '';
      lblEl.style.color = (moveData && isRelevant) ? 'var(--text)' : '';
    }
  }

  // Update SP total
  const total = STAT_IDS.reduce((sum, id) => sum + spVal(prefix + id + 'SP'), 0);
  const totalEl = document.getElementById(prefix + 'SpTotal');
  if (totalEl) {
    totalEl.textContent = total;
    totalEl.parentElement.className = 'sp-total-row' + (total > 66 ? ' sp-over' : '');
  }
}

function updateTypeBadges(pkmnKey, rowId) {
  const row  = document.getElementById(rowId);
  if (!row) return;
  const data = PKMN[pkmnKey];
  if (!data) { row.innerHTML = ''; return; }
  row.innerHTML = data.types
    .map(t => `<span class="type-badge type-${t}">${t}</span>`)
    .join('');
}

function updateMoveCat(moveData) {
  const badge = document.getElementById('moveCatBadge');
  if (!badge) return;
  if (!moveData) { badge.textContent = ''; badge.className = 'cat-badge'; return; }
  badge.textContent = moveData.category;
  badge.className = `cat-badge cat-${moveData.category}`;
}

// ═══════════════════════════════════════════════════════════
//  SPRITES  (same logic as main.js)
// ═══════════════════════════════════════════════════════════

function nameToSlug(name) {
  let n = name.trim();
  const rotomM = n.match(/^(Heat|Wash|Frost|Fan|Mow)\s+Rotom$/i);
  if (rotomM) return 'rotom-' + rotomM[1].toLowerCase();
  const megaM = n.match(/^Mega\s+(.+?)(?:\s+([XY]))?$/i);
  if (megaM) {
    const base = megaM[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/-$/, '');
    return base + '-mega' + (megaM[2] ? '-' + megaM[2].toLowerCase() : '');
  }
  const regionMap = { Alolan: 'alola', Hisuian: 'hisui', Galarian: 'galar', Paldean: 'paldea' };
  for (const [pfx, sfx] of Object.entries(regionMap)) {
    if (n.startsWith(pfx + ' ')) {
      const rest = n.slice(pfx.length + 1);
      return rest.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/-$/, '') + '-' + sfx;
    }
  }
  n = n.replace(/\s*\(([^)]+)\)\s*$/, (_, f) => '-' + f);
  return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function spriteQueue(name) {
  const slug  = nameToSlug(name);
  const parts = slug.split('-');
  const last  = parts.length > 1 ? parts.slice(0, -1).join('-') : null;
  const first = parts.length > 1 ? parts[0] : null;
  const pdb   = s => `https://img.pokemondb.net/sprites/home/normal/${s}.png`;
  const sd    = s => `https://play.pokemonshowdown.com/sprites/gen5/${s}.png`;
  const seen  = new Set([slug]);
  const q     = [pdb(slug), sd(slug)];
  if (last  && !seen.has(last))  { seen.add(last);  q.push(pdb(last),  sd(last));  }
  if (first && !seen.has(first)) { seen.add(first); q.push(pdb(first), sd(first)); }
  return q;
}

function nextSprite(img) {
  const q = img._spriteQ;
  if (!q || !q.length) { img.style.opacity = '0'; img.onerror = null; return; }
  img.onerror = () => nextSprite(img);
  img.src = q.shift();
}

function updateSprite(prefix, pkmnKey) {
  const img = document.getElementById(prefix + 'Sprite');
  if (!img) return;
  const pkmnData = PKMN[pkmnKey];
  if (!pkmnData) {
    img.style.display = 'none';
    img.src = '';
    return;
  }
  const q = spriteQueue(pkmnData.displayName);
  img._spriteQ = q.slice(1);
  img.onerror  = () => nextSprite(img);
  img.src      = q[0];
  img.style.display  = '';
  img.style.opacity  = '1';
}

// ═══════════════════════════════════════════════════════════
//  MOVE DATALIST FILTER
// ═══════════════════════════════════════════════════════════

function updateMoveDatalist(pkmnKey) {
  const moveList = document.getElementById('moveList');
  if (!moveList) return;
  const pkmnData = PKMN[pkmnKey];

  // If no Pokémon or no learnset data, show all moves
  if (!pkmnData || !pkmnData.moves || pkmnData.moves.length === 0) {
    const moveNames = Object.keys(MOVES).sort().map(m => `<option value="${m}">`);
    moveList.innerHTML = moveNames.join('');
    return;
  }

  // Filter to moves both in learnset AND in our MOVES damage table
  const learnable = new Set(pkmnData.moves);
  const moveNames = Object.keys(MOVES)
    .filter(m => learnable.has(m))
    .sort()
    .map(m => `<option value="${m}">`);
  moveList.innerHTML = moveNames.join('');
}

// ═══════════════════════════════════════════════════════════
//  DROPDOWN POPULATION
// ═══════════════════════════════════════════════════════════

function populateSelect(elId, items) {
  const sel = document.getElementById(elId);
  if (!sel) return;
  sel.innerHTML = items.map(i => `<option value="${i.id}">${i.label}</option>`).join('');
  sel.addEventListener('change', computeAll);
}

function populateNatureSelects() {
  const natures = Object.keys(NATURES).sort();
  const opts = natures.map(n => {
    const d = NATURES[n];
    const tag = d.b ? ` (+${d.b.toUpperCase()} / -${d.r.toUpperCase()})` : ' (neutral)';
    return `<option value="${n}">${n}${tag}</option>`;
  }).join('');

  ['atkNature', 'defNature'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = opts;
    // Default to Jolly for attacker, Hardy for defender
    el.value = id === 'atkNature' ? 'Jolly' : 'Hardy';
  });
}

function populateDataLists() {
  const pkmnList = document.getElementById('pkmnList');
  if (!pkmnList) return;

  // Filter to Champions Pokémon only
  const pkmnNames = Object.values(PKMN)
    .filter(p => CHAMPIONS.size === 0 || CHAMPIONS.has(p.displayName.toLowerCase()))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(p => `<option value="${p.displayName}">`);
  pkmnList.innerHTML = pkmnNames.join('');

  // Initial move list (all moves; filtered per Pokémon on selection)
  const moveList = document.getElementById('moveList');
  if (moveList) {
    const moveNames = Object.keys(MOVES).sort().map(m => `<option value="${m}">`);
    moveList.innerHTML = moveNames.join('');
  }
}

// Called when nature select changes
window.onNatureChange = function (prefix) {
  computeAll();
};

// ═══════════════════════════════════════════════════════════
//  ABILITY SELECT FILTER
// ═══════════════════════════════════════════════════════════

/**
 * Filter the ability <select> for a panel to only show abilities
 * that the selected Pokémon can actually have (plus "None").
 * Falls back to showing all abilities when no Pokémon is selected.
 */
function updateAbilitySelect(prefix, pkmnKey) {
  const sel = document.getElementById(prefix + 'Ability');
  if (!sel) return;

  const pkmnData   = PKMN[pkmnKey];
  const pkmnAbs    = pkmnData?.abilities ? new Set(pkmnData.abilities) : null;
  const allOptions = prefix === 'atk' ? ATK_ABILITIES : DEF_ABILITIES;

  // Keep "None" (id === '') always; keep ability if Pokémon has it or no data yet
  const filtered = allOptions.filter(a => !a.id || !pkmnAbs || pkmnAbs.has(a.id));

  const prevVal = sel.value;
  sel.innerHTML = filtered.map(a => `<option value="${a.id}">${a.label}</option>`).join('');

  // Restore previous selection if still available, else reset to None
  if (filtered.some(a => a.id === prevVal)) sel.value = prevVal;
  else sel.value = '';
}

// ═══════════════════════════════════════════════════════════
//  EVENT BINDING
// ═══════════════════════════════════════════════════════════

function bindEvents() {
  // Pokémon inputs
  ['atkPkmn', 'defPkmn'].forEach(id => {
    const prefix = id === 'atkPkmn' ? 'atk' : 'def';
    const el = document.getElementById(id);
    if (!el) return;

    // input: ONLY type badges — do NOT touch any datalist/select DOM or the
    // browser will dismiss the autocomplete dropdown while the user is typing
    el.addEventListener('input', () => {
      const key = el.value.toLowerCase().trim();
      updateTypeBadges(key, prefix + 'TypeRow');
    });

    // change: fires when user picks from datalist OR leaves the field
    el.addEventListener('change', () => {
      const key = el.value.toLowerCase().trim();
      if (prefix === 'atk') updateMoveDatalist(key);
      updateAbilitySelect(prefix, key);
      updateSprite(prefix, key);
      computeAll();
    });
  });

  // Move input
  const moveEl = document.getElementById('atkMove');
  if (moveEl) {
    moveEl.addEventListener('input', () => {
      const m = MOVES[moveEl.value.trim()];
      updateMoveCat(m);
      if (m) computeAll();
    });
    moveEl.addEventListener('change', computeAll);
  }

  // Bind all stat sliders for both panels
  for (const prefix of ['atk', 'def']) {
    for (const id of STAT_IDS) {
      const sliderId = prefix + id + 'SP';
      const valId    = prefix + id + 'SPVal';
      const slider   = document.getElementById(sliderId);
      const valSpan  = document.getElementById(valId);
      if (!slider) continue;
      slider.addEventListener('input', () => {
        if (valSpan) valSpan.textContent = slider.value;
        computeAll();
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════

async function loadData() {
  // Phase 1: critical data (Pokémon stats + moves)
  try {
    const [pkmnRes, movesRes] = await Promise.all([
      fetch('./pokemon-stats.json'),
      fetch('./moves.json'),
    ]);
    PKMN  = await pkmnRes.json();
    MOVES = await movesRes.json();
  } catch (err) {
    document.getElementById('loadMsg').textContent = 'Error loading data: ' + err.message;
    console.error(err);
    return;
  }

  // Phase 2: Champions filter (non-critical — fall back to all Pokémon if unavailable)
  try {
    const [pikalyticsRes, limitlessRes] = await Promise.all([
      fetch('./pikalytics.json'),
      fetch('./limitless.json'),
    ]);
    const pikalytics = await pikalyticsRes.json();
    const limitless  = await limitlessRes.json();

    CHAMPIONS = new Set();
    // Keys are display names ("Garchomp", "Incineroar") — lowercase to match PKMN filter
    Object.keys(pikalytics.pokemon || {}).forEach(k => CHAMPIONS.add(k.toLowerCase()));
    Object.keys((limitless.aggregate || {}).pokemon || {}).forEach(k => CHAMPIONS.add(k.toLowerCase()));
  } catch (err) {
    console.warn('Champions filter unavailable, showing all Pokémon:', err.message);
    CHAMPIONS = new Set(); // stays empty → populateDataLists shows all
  }

  // Show UI
  document.getElementById('loadMsg').style.display = 'none';
  document.getElementById('calcApp').style.display = '';

  populateSelect('atkItem',    ATK_ITEMS);
  populateSelect('atkAbility', ATK_ABILITIES);
  populateSelect('defItem',    DEF_ITEMS);
  populateSelect('defAbility', DEF_ABILITIES);
  populateDataLists();
  bindEvents();
}

// Populate natures immediately (they don't need fetched data)
populateNatureSelects();
loadData();
