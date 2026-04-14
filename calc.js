'use strict';

// ═══════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════

// type effectiveness: TYPE_CHART[atkType][defType] = mult (1 if not listed)
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
let PKMN  = {};  // { 'garchomp': { hp, atk, def, spa, spd, spe, types, displayName } }
let MOVES = {};  // { 'Dragon Claw': { bp, type, category, makesContact, hasSecondary, isPunch } }

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

// Type effectiveness for a move against a defender's types
// Applies each type sequentially (accurate to game math)
function getTypeEff(atkType, defTypes) {
  if (!atkType || !defTypes) return 1;
  const chart = TYPE_CHART[atkType] || {};
  let eff = 1;
  for (const dt of defTypes) eff = Math.floor(eff * (chart[dt] ?? 1) * 4096) / 4096;
  // use integer approx of each step like game does
  return eff;
}

function isSTAB(moveType, pkmnTypes) {
  return pkmnTypes && pkmnTypes.includes(moveType);
}

// Compute 16 damage rolls (r = 85..100)
// Order: BASE → random → STAB → type (each applied with floor)
function calcRolls(atkStat, defStat, bp, stabMult, atkType, defTypes) {
  if (!bp || !atkStat || !defStat) return new Array(16).fill(0);

  const chart = TYPE_CHART[atkType] || {};
  const typeEff1 = chart[defTypes[0]] ?? 1;
  const typeEff2 = defTypes[1] ? (chart[defTypes[1]] ?? 1) : 1;

  // immunity check
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
function readState() {
  return {
    atkPkmn:     document.getElementById('atkPkmn').value.toLowerCase().trim(),
    atkMove:     document.getElementById('atkMove').value.trim(),
    atkNat:      parseFloat(document.querySelector('input[name="atkNat"]:checked')?.value || '1.0'),
    atkSP:       parseInt(document.getElementById('atkSP').value) || 0,
    atkItem:     document.getElementById('atkItem').value,
    atkAbility:  document.getElementById('atkAbility').value,
    defPkmn:     document.getElementById('defPkmn').value.toLowerCase().trim(),
    defNat:      parseFloat(document.querySelector('input[name="defNat"]:checked')?.value || '1.0'),
    defHpSP:     parseInt(document.getElementById('defHpSP').value) || 0,
    defSP:       parseInt(document.getElementById('defSP').value) || 0,
    defItem:     document.getElementById('defItem').value,
    defAbility:  document.getElementById('defAbility').value,
  };
}

// ═══════════════════════════════════════════════════════════
//  MODIFIER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function buildAtkStat(s, moveData, isPhysical, defAbility) {
  const pkmnData = PKMN[s.atkPkmn];
  const baseStat = isPhysical ? pkmnData.atk : pkmnData.spa;
  let stat = calcStat(baseStat, s.atkSP, s.atkNat);

  // Item modifiers
  if (s.atkItem === 'choice-band'  && isPhysical)  stat = Math.floor(stat * 1.5);
  if (s.atkItem === 'choice-specs' && !isPhysical) stat = Math.floor(stat * 1.5);
  if (s.atkItem === 'muscle-band'  && isPhysical)  stat = Math.floor(stat * 1.1);
  if (s.atkItem === 'wise-glasses' && !isPhysical) stat = Math.floor(stat * 1.1);
  if (s.atkItem.startsWith('type-')) {
    const itemDef = ATK_ITEMS.find(i => i.id === s.atkItem);
    if (itemDef && itemDef.moveType === moveData.type) stat = Math.floor(stat * 1.2);
  }

  // Ability modifiers
  if (s.atkAbility === 'huge-power' || s.atkAbility === 'pure-power') {
    if (isPhysical) stat = Math.floor(stat * 2);
  }

  // Intimidate from defender reduces attacker's Atk
  if (defAbility === 'intimidate' && isPhysical) {
    stat = Math.floor(stat * 2 / 3);  // -1 stage = ×2/3
  }

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

function buildDefStat(s, moveData, isPhysical, hpSP, defSP) {
  const pkmnData = PKMN[s.defPkmn];
  const hp = calcHP(pkmnData.hp, hpSP);
  const defBase = isPhysical ? pkmnData.def : pkmnData.spd;
  let def = calcStat(defBase, defSP, s.defNat);

  if (s.defItem === 'assault-vest' && !isPhysical) def = Math.floor(def * 1.5);
  if (s.defItem === 'eviolite')                    def = Math.floor(def * 1.5);

  return { hp, def };
}

// Returns rolls with post-calc ability modifiers applied
function applyPostMods(rolls, s, moveData, isPhysical, typeEff) {
  const { defAbility, atkAbility } = s;
  let r = rolls;

  // Defender abilities
  if (defAbility === 'thick-fat' && (moveData.type === 'fire' || moveData.type === 'ice'))
    r = r.map(d => Math.floor(d * 0.5));
  if ((defAbility === 'solid-rock' || defAbility === 'filter') && typeEff > 1)
    r = r.map(d => Math.floor(d * 3 / 4));
  if (defAbility === 'multiscale' || defAbility === 'shadow-shield')
    r = r.map(d => Math.floor(d * 0.5));
  if (defAbility === 'fur-coat' && isPhysical)
    r = r.map(d => Math.floor(d * 0.5));

  // Attacker abilities (post-roll multipliers)
  if (atkAbility === 'sheer-force' && moveData.hasSecondary)
    r = r.map(d => Math.floor(d * 1.3));
  if (atkAbility === 'tough-claws' && moveData.makesContact)
    r = r.map(d => Math.floor(d * 1.3));
  if (atkAbility === 'iron-fist' && moveData.isPunch)
    r = r.map(d => Math.floor(d * 1.2));
  if (atkAbility === 'guts' && isPhysical)
    r = r.map(d => Math.floor(d * 1.5));

  // Life Orb (post everything)
  if (s.atkItem === 'life-orb') r = r.map(d => Math.floor(d * 1.3));
  // Expert Belt (super effective only)
  if (s.atkItem === 'expert-belt' && typeEff > 1) r = r.map(d => Math.floor(d * 1.2));

  return r;
}

// Check immunity from defender ability
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

  // Update type badges and stat pills even with partial input
  updateTypeBadges(s.atkPkmn, 'atkTypeRow');
  updateTypeBadges(s.defPkmn, 'defTypeRow');
  updateMoveCat(moveData);
  updateAtkLabels(moveData);
  updateStatPills(s, moveData, atkData, defData);

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
  const { hp, def: defStat } = buildDefStat(s, moveData, isPhysical, s.defHpSP, s.defSP);

  let rolls = calcRolls(atkStat, defStat, effBP, stabMult, moveData.type, defData.types);
  rolls = applyPostMods(rolls, s, moveData, isPhysical, typeEff);

  document.getElementById('dmgBlock').innerHTML =
    renderDamage(rolls, hp, s.atkMove, atkStat, defStat, hp, stabMult, typeEff, moveData, atkData, defData, s, isPhysical);
  document.getElementById('optOutput').innerHTML = '';
}

// Raw product of type effectivenesses (for post-mod checks)
function getTypeEffRaw(atkType, defTypes) {
  const chart = TYPE_CHART[atkType] || {};
  return (chart[defTypes[0]] ?? 1) * (defTypes[1] ? (chart[defTypes[1]] ?? 1) : 1);
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

  const solutions = [];

  for (let hpSP = 0; hpSP <= 32; hpSP++) {
    for (let defSP = 0; defSP <= 32; defSP++) {
      const { hp, def } = buildDefStat(s, moveData, isPhysical, hpSP, defSP);
      let rolls = calcRolls(atkStat, def, effBP, stabMult, moveData.type, defData.types);
      rolls = applyPostMods(rolls, s, moveData, isPhysical, typeEff);
      if (rolls[0] < hp) {  // min roll doesn't KO → guaranteed survive
        solutions.push({ hpSP, defSP, total: hpSP + defSP, rolls, hp });
      }
    }
  }

  solutions.sort((a, b) => a.total - b.total || a.defSP - b.defSP);

  const out = document.getElementById('optOutput');
  if (!solutions.length) {
    out.innerHTML = `<div class="opt-section">
      <div class="opt-title">🛡 Min SP to survive</div>
      <div class="opt-result opt-none">Cannot guarantee survival with up to 32 HP SP + 32 Def SP.</div>
    </div>`;
    return;
  }

  const best = solutions[0];
  const koCount = best.rolls.filter(r => r >= best.hp).length;
  const koLabel = koCount === 0 ? '0%' : `${(koCount / 16 * 100).toFixed(2)}%`;
  const minPct = (best.rolls[0] / best.hp * 100).toFixed(1);
  const maxPct = (best.rolls[15] / best.hp * 100).toFixed(1);
  const isPhysLabel = isPhysical ? 'Def' : 'SpD';

  out.innerHTML = `<div class="opt-section">
    <div class="opt-title">🛡 Min SP to survive</div>
    <div class="opt-result">
      <span class="opt-sp">+${best.hpSP} HP SP + ${best.defSP} ${isPhysLabel} SP</span>
      <span style="color:var(--muted)"> (${best.total} SP total)</span><br>
      After: ${best.rolls[0]}-${best.rolls[15]} (${minPct}%-${maxPct}%)
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
  const { hp, def: defStat } = buildDefStat(s, moveData, isPhysical, s.defHpSP, s.defSP);

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
      // build atkStat with this sp
      const baseStat = isPhysical ? atkData.atk : atkData.spa;
      let atkStat = calcStat(baseStat, sp, s.atkNat);
      // apply items/abilities (keep same logic as buildAtkStat but with variable sp)
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
      if (koRolls >= thresh.rolls) {
        found = { sp, atkStat, koRolls, rolls };
        break;
      }
    }
    results.push({ ...thresh, found });
  }

  const isPhysLabel = isPhysical ? 'Atk' : 'SpA';
  const currentSP = s.atkSP;

  let rows = '';
  for (const r of results) {
    const isCurrent = r.found && r.found.sp === currentSP;
    rows += `<tr class="${isCurrent ? 'ohko-current' : ''}">
      <td>${r.label}</td>
      <td>${r.found ? r.found.sp + ' ' + isPhysLabel + ' SP' : '—'}</td>
      <td>${r.found
        ? `${r.found.rolls[0]}–${r.found.rolls[15]} · ${(r.found.koRolls/16*100).toFixed(2)}% KO`
        : 'Cannot reach'}</td>
    </tr>`;
  }

  document.getElementById('optOutput').innerHTML = `<div class="opt-section">
    <div class="opt-title">⚔ Min SP to OHKO (current defender: ${s.defHpSP} HP SP + ${s.defSP} ${isPhysical?'Def':'SpD'} SP)</div>
    <table class="ohko-table"><tbody>${rows}</tbody></table>
  </div>`;
};

// ═══════════════════════════════════════════════════════════
//  DISPLAY
// ═══════════════════════════════════════════════════════════

function renderDamage(rolls, hp, moveName, atkStat, defStat, defHP, stabMult, typeEff, moveData, atkData, defData, s, isPhysical) {
  const minDmg = rolls[0], maxDmg = rolls[15];
  const minPct = (minDmg / defHP * 100).toFixed(1);
  const maxPct = (maxDmg / defHP * 100).toFixed(1);
  const koCount = rolls.filter(r => r >= defHP).length;

  // KO label
  let koClass = 'ko-0', koText = '0% chance to OHKO';
  if (koCount === 16)      { koClass = 'ko-full'; koText = 'Guaranteed OHKO'; }
  else if (koCount >= 8)   { koClass = 'ko-high'; koText = `${(koCount/16*100).toFixed(2)}% chance to OHKO`; }
  else if (koCount >= 1)   { koClass = 'ko-low';  koText = `${(koCount/16*100).toFixed(2)}% chance to OHKO`; }

  // Type tag
  let typeTag = '';
  if (typeEff === 0) {
    typeTag = '<span class="dmg-tag tag-imm">Immune</span>';
  } else if (typeEff >= 4) {
    typeTag = `<span class="dmg-tag tag-se4">4× ${moveData.type}</span>`;
  } else if (typeEff >= 2) {
    typeTag = `<span class="dmg-tag tag-se2">2× ${moveData.type}</span>`;
  } else if (typeEff <= 0.5) {
    typeTag = `<span class="dmg-tag tag-nve">${typeEff}× ${moveData.type}</span>`;
  }

  const stabTag = stabMult > 1
    ? `<span class="dmg-tag tag-stab">${stabMult === 2 ? 'Adaptability' : 'STAB'}</span>`
    : '';

  // Rolls visualization (16 cells)
  const cells = rolls.map(d => {
    const isKO = d >= defHP;
    return `<div class="roll-cell${isKO ? ' ko' : ''}" title="${d}"></div>`;
  }).join('');

  // Stat summary
  const isPhysLabel = isPhysical ? 'Atk' : 'SpA';
  const defStatLabel = isPhysical ? 'Def' : 'SpD';
  const natChar = s.atkNat > 1 ? '＋' : s.atkNat < 1 ? '−' : '●';
  const defNatChar = s.defNat > 1 ? '＋' : s.defNat < 1 ? '−' : '●';
  const defHpVal = calcHP(defData.hp, s.defHpSP);
  const defStatVal = calcStat(isPhysical ? defData.def : defData.spd, s.defSP, s.defNat);

  return `
    <div class="dmg-header">
      <span class="dmg-range">${moveName} → <strong>${minDmg}–${maxDmg}</strong></span>
      <span class="dmg-pct">(${minPct}%–${maxPct}%)</span>
      <span class="dmg-ko ${koClass}">${koText}</span>
    </div>
    <div class="dmg-tags">${stabTag}${typeTag}</div>
    <div class="rolls-row">${cells}</div>
    <div class="dmg-stats">
      <strong>${atkData.displayName}</strong> ${isPhysLabel} <strong>${atkStat}</strong>
      (${s.atkSP} SP ${natChar})
      &nbsp;→&nbsp;
      <strong>${defData.displayName}</strong> HP <strong>${defHpVal}</strong>
      ${defStatLabel} <strong>${defStatVal}</strong>
      (${s.defHpSP} HP SP · ${s.defSP} ${defStatLabel} SP ${defNatChar})
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
//  UI UPDATES
// ═══════════════════════════════════════════════════════════

function updateTypeBadges(pkmnKey, rowId) {
  const row = document.getElementById(rowId);
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

function updateAtkLabels(moveData) {
  const isPhys = moveData?.category === 'physical';
  const isSp   = moveData?.category === 'special';
  const statName = isPhys ? 'Atk' : (isSp ? 'SpA' : 'Atk');
  const natName  = isPhys ? 'Atk' : (isSp ? 'SpA' : 'Atk');
  const defName  = isPhys ? 'Def' : (isSp ? 'SpD' : 'Def');

  const atkSpLbl  = document.getElementById('atkSpLbl');
  const atkNatLbl = document.getElementById('atkNatLbl');
  const defSpLbl  = document.getElementById('defSpLbl');
  const defNatLbl = document.getElementById('defNatLbl');
  if (atkSpLbl)  atkSpLbl.textContent  = statName + ' SP';
  if (atkNatLbl) atkNatLbl.textContent = natName + ' nature';
  if (defSpLbl)  defSpLbl.textContent  = defName + ' SP';
  if (defNatLbl) defNatLbl.textContent = defName + ' nature';
}

function updateStatPills(s, moveData, atkData, defData) {
  const atkPill = document.getElementById('atkStatPill');
  const defPill = document.getElementById('defStatPill');

  if (atkData && moveData && moveData.category !== 'status') {
    const isPhys = moveData.category === 'physical';
    const statLabel = isPhys ? 'Atk' : 'SpA';
    const baseStat  = isPhys ? atkData.atk : atkData.spa;
    const computed  = calcStat(baseStat, s.atkSP, s.atkNat);
    const spe = calcStat(atkData.spe, 0, 1.0); // base speed (0 SP neutral)
    atkPill.innerHTML = `<strong>${statLabel}:</strong> ${computed} &nbsp;·&nbsp; <strong>Spe:</strong> ${spe} base`;
  } else if (atkData) {
    atkPill.innerHTML = `HP: ${calcHP(atkData.hp, 0)} &nbsp;·&nbsp; Spe: ${calcStat(atkData.spe, 0, 1.0)} base`;
  } else {
    atkPill.innerHTML = '';
  }

  if (defData && moveData && moveData.category !== 'status') {
    const isPhys = moveData.category === 'physical';
    const defStatLabel = isPhys ? 'Def' : 'SpD';
    const defBase = isPhys ? defData.def : defData.spd;
    const defStat = calcStat(defBase, s.defSP, s.defNat);
    const hpVal   = calcHP(defData.hp, s.defHpSP);
    defPill.innerHTML = `<strong>HP:</strong> ${hpVal} &nbsp;·&nbsp; <strong>${defStatLabel}:</strong> ${defStat}`;
  } else if (defData) {
    defPill.innerHTML = `HP: ${calcHP(defData.hp, 0)} (0 SP)`;
  } else {
    defPill.innerHTML = '';
  }
}

// ═══════════════════════════════════════════════════════════
//  SLIDER VALUE DISPLAYS
// ═══════════════════════════════════════════════════════════

function bindSliderDisplay(sliderId, valId) {
  const slider = document.getElementById(sliderId);
  const val    = document.getElementById(valId);
  if (!slider || !val) return;
  slider.addEventListener('input', () => { val.textContent = slider.value; computeAll(); });
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

function populateDataLists() {
  const pkmnList = document.getElementById('pkmnList');
  const moveList = document.getElementById('moveList');
  if (!pkmnList || !moveList) return;

  // Sort by displayName for the datalist
  const pkmnNames = Object.values(PKMN)
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map(p => `<option value="${p.displayName}">`);
  pkmnList.innerHTML = pkmnNames.join('');

  const moveNames = Object.keys(MOVES)
    .sort()
    .map(m => `<option value="${m}">`);
  moveList.innerHTML = moveNames.join('');
}

// ═══════════════════════════════════════════════════════════
//  EVENT BINDING
// ═══════════════════════════════════════════════════════════

function bindEvents() {
  // Pokémon inputs (debounced to avoid firing on every keystroke)
  ['atkPkmn', 'defPkmn'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      // normalize to displayName key (lowercase)
      const key = el.value.toLowerCase().trim();
      if (PKMN[key]) computeAll();
      else {
        // partial match: wait for change event
        updateTypeBadges(key, id === 'atkPkmn' ? 'atkTypeRow' : 'defTypeRow');
      }
    });
    el.addEventListener('change', computeAll);
  });

  // Move input
  const moveEl = document.getElementById('atkMove');
  if (moveEl) {
    moveEl.addEventListener('input', () => {
      const m = MOVES[moveEl.value.trim()];
      updateMoveCat(m);
      updateAtkLabels(m);
      if (m) computeAll();
    });
    moveEl.addEventListener('change', computeAll);
  }

  // Sliders
  bindSliderDisplay('atkSP',   'atkSPVal');
  bindSliderDisplay('defHpSP', 'defHpSPVal');
  bindSliderDisplay('defSP',   'defSPVal');

  // Nature radios
  document.querySelectorAll('input[name="atkNat"], input[name="defNat"]')
    .forEach(r => r.addEventListener('change', computeAll));
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════

async function loadData() {
  try {
    const [pkmnRes, movesRes] = await Promise.all([
      fetch('./pokemon-stats.json'),
      fetch('./moves.json'),
    ]);
    PKMN  = await pkmnRes.json();
    MOVES = await movesRes.json();

    document.getElementById('loadMsg').style.display = 'none';
    document.getElementById('calcApp').style.display = '';

    populateSelect('atkItem',    ATK_ITEMS);
    populateSelect('defItem',    DEF_ITEMS);
    populateSelect('atkAbility', ATK_ABILITIES);
    populateSelect('defAbility', DEF_ABILITIES);
    populateDataLists();
    bindEvents();
  } catch (err) {
    document.getElementById('loadMsg').textContent = 'Error loading data: ' + err.message;
    console.error(err);
  }
}

loadData();
