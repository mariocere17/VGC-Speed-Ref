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
  // Type-resist berries: halve damage from a move of the matching type.
  // All berries except Chilan require the hit to be super-effective.
  { id:'berry-normal',   label:'Chilan Berry (Normal ×0.5)',      berryType:'normal' },
  { id:'berry-fire',     label:'Occa Berry (SE Fire ×0.5)',       berryType:'fire' },
  { id:'berry-water',    label:'Passho Berry (SE Water ×0.5)',    berryType:'water' },
  { id:'berry-electric', label:'Wacan Berry (SE Electric ×0.5)',  berryType:'electric' },
  { id:'berry-grass',    label:'Rindo Berry (SE Grass ×0.5)',     berryType:'grass' },
  { id:'berry-ice',      label:'Yache Berry (SE Ice ×0.5)',       berryType:'ice' },
  { id:'berry-fighting', label:'Chople Berry (SE Fighting ×0.5)', berryType:'fighting' },
  { id:'berry-poison',   label:'Kebia Berry (SE Poison ×0.5)',    berryType:'poison' },
  { id:'berry-ground',   label:'Shuca Berry (SE Ground ×0.5)',    berryType:'ground' },
  { id:'berry-flying',   label:'Coba Berry (SE Flying ×0.5)',     berryType:'flying' },
  { id:'berry-psychic',  label:'Payapa Berry (SE Psychic ×0.5)',  berryType:'psychic' },
  { id:'berry-bug',      label:'Tanga Berry (SE Bug ×0.5)',       berryType:'bug' },
  { id:'berry-rock',     label:'Charti Berry (SE Rock ×0.5)',     berryType:'rock' },
  { id:'berry-ghost',    label:'Kasib Berry (SE Ghost ×0.5)',     berryType:'ghost' },
  { id:'berry-dragon',   label:'Haban Berry (SE Dragon ×0.5)',    berryType:'dragon' },
  { id:'berry-dark',     label:'Colbur Berry (SE Dark ×0.5)',     berryType:'dark' },
  { id:'berry-steel',    label:'Babiri Berry (SE Steel ×0.5)',    berryType:'steel' },
  { id:'berry-fairy',    label:'Roseli Berry (SE Fairy ×0.5)',    berryType:'fairy' },
];

// Ordered by auto-select priority: the first matching ability is picked when the
// user selects a Pokémon. More impactful / unconditional abilities come first.
const ATK_ABILITIES = [
  { id:'',             label:'None' },
  { id:'huge-power',   label:'Huge Power (Atk ×2)' },
  { id:'pure-power',   label:'Pure Power (Atk ×2)' },
  { id:'adaptability', label:'Adaptability (STAB ×2)' },
  { id:'protean',      label:'Protean / Libero (all moves STAB)' },
  { id:'tinted-lens',  label:'Tinted Lens (NVE ×2)' },
  { id:'mold-breaker', label:'Mold Breaker (ignore def ability)' },
  { id:'tough-claws',  label:'Tough Claws (contact ×1.3)' },
  { id:'technician',   label:'Technician (BP≤60 ×1.5)' },
  { id:'iron-fist',    label:'Iron Fist (punch ×1.2)' },
  { id:'sheer-force',  label:'Sheer Force (secondary ×1.3)' },
  { id:'guts',         label:'Guts (statused Atk ×1.5)' },
  { id:'sniper',       label:'Sniper (crit ×2.25)' },
  // Type-changing (-ate, Liquid Voice, Permafrost Fist)
  { id:'pixilate',         label:'Pixilate (Normal → Fairy ×1.2)' },
  { id:'refrigerate',      label:'Refrigerate (Normal → Ice ×1.2)' },
  { id:'aerilate',         label:'Aerilate (Normal → Flying ×1.2)' },
  { id:'galvanize',        label:'Galvanize (Normal → Electric ×1.2)' },
  { id:'dragonize',        label:'Dragonize (Normal → Dragon ×1.2)' },
  { id:'liquid-voice',     label:'Liquid Voice (sound → Water)' },
  { id:'permafrost-fist',  label:'Permafrost Fist (punch → Ice ×1.3)' },
  // Weather-conditional
  { id:'sand-force',   label:'Sand Force (Rock/Ground/Steel ×1.3 in Sand)' },
  { id:'solar-power',  label:'Solar Power (SpA ×1.5 in Sun)' },
];

// Moves halved by Grassy Terrain (earthquake-family hits grounded Pokémon softer)
const GRASSY_HALVED_MOVES = new Set(['Earthquake', 'Bulldoze', 'Magnitude']);

// Moves that hit all adjacent foes in doubles (×0.75 spread penalty)
const SPREAD_MOVES = new Set([
  'Earthquake', 'Magnitude', 'Bulldoze',
  'Rock Slide', 'Diamond Storm', 'Thousand Arrows', 'Thousand Waves',
  'Surf', 'Muddy Water', 'Origin Pulse', 'Sparkling Aria',
  'Discharge', 'Electroweb',
  'Blizzard', 'Icy Wind', 'Glacial Lance', 'Freeze-Dry',
  'Heat Wave', 'Eruption', 'Lava Plume', 'Searing Shot', 'Burning Jealousy',
  'Sludge Wave',
  'Hyper Voice', 'Boomburst', 'Round', 'Tri Attack', 'Swift',
  'Dazzling Gleam', 'Moonblast',
  'Breaking Swipe', 'Dragon Energy',
  'Petal Blizzard', 'Pollen Puff',
  'Power Gem', 'Ancient Power',
]);

// localStorage key. Bump the suffix when the state schema changes incompatibly.
const STORAGE_KEY = 'champions-calc-state-v1';

const DEF_ABILITIES = [
  { id:'',              label:'None' },
  { id:'intimidate',    label:'Intimidate (Atk −1 stage)' },
  { id:'thick-fat',     label:'Thick Fat (Fire/Ice ×0.5)' },
  { id:'ice-scales',    label:'Ice Scales (special ×0.5)' },
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

// Combined item list used by both panels (bidirectional calc)
const ALL_ITEMS = [
  ATK_ITEMS[0], // None (single entry)
  ...ATK_ITEMS.slice(1),
  ...DEF_ITEMS.slice(1),
];

// Combined ability list used by both panels (bidirectional calc)
const ALL_ABILITIES = [
  ATK_ABILITIES[0], // None
  ...ATK_ABILITIES.slice(1),
  ...DEF_ABILITIES.slice(1),
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

// Stat stage multiplier: +1 = ×1.5, +2 = ×2, … +6 = ×4; -1 = ×2/3, -2 = ×1/2, … -6 = ×1/4
function getStageMult(stage) {
  if (!stage) return 1;
  return stage > 0 ? (2 + stage) / 2 : 2 / (2 - stage);
}

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

/** Returns [eff1, eff2] — each type applied separately (needed for floor-per-type in calcRolls).
 *  Handles Gravity (Ground hits Flying) and Strong Winds (SE vs Flying neutralised). */
function getTypeEffComponents(atkType, defTypes, s) {
  const chart = TYPE_CHART[atkType] || {};
  let eff1 = chart[defTypes[0]] ?? 1;
  let eff2 = defTypes[1] ? (chart[defTypes[1]] ?? 1) : 1;

  // Gravity: Ground moves no longer have 0 effectiveness against Flying types
  if (s?.gravity && atkType === 'ground') {
    if (defTypes[0] === 'flying' && eff1 === 0) eff1 = 1;
    if (defTypes[1] === 'flying' && eff2 === 0) eff2 = 1;
  }
  // Strong Winds: moves SE against Flying are neutralised to 1×
  if (s?.weather === 'strong-winds') {
    const flyingWeak = new Set(['electric', 'ice', 'rock']);
    if (flyingWeak.has(atkType)) {
      if (defTypes[0] === 'flying' && eff1 > 1) eff1 = 1;
      if (defTypes[1] === 'flying' && eff2 > 1) eff2 = 1;
    }
  }
  return [eff1, eff2];
}

function getTypeEffRaw(atkType, defTypes, s) {
  const [e1, e2] = getTypeEffComponents(atkType, defTypes, s);
  return e1 * e2;
}

// ── Type-changing abilities (-ate, Liquid Voice, Permafrost Fist) ──
const ATE_MAP = {
  'pixilate':    { from: 'normal', to: 'fairy' },
  'refrigerate': { from: 'normal', to: 'ice' },
  'aerilate':    { from: 'normal', to: 'flying' },
  'galvanize':   { from: 'normal', to: 'electric' },
  'dragonize':   { from: 'normal', to: 'dragon' },
};
const SOUND_MOVES = new Set([
  'Hyper Voice', 'Boomburst', 'Bug Buzz', 'Snarl', 'Round', 'Overdrive',
  'Disarming Voice', 'Clanging Scales', 'Uproar', 'Snore', 'Echoed Voice',
  'Relic Song', 'Sparkling Aria', 'Eerie Spell', 'Torch Song',
]);

/** Returns effective move type after ability conversion. */
function eMoveType(s, moveData) {
  if (!moveData) return '';
  const ate = ATE_MAP[s.atkAbility];
  if (ate && moveData.type === ate.from) return ate.to;
  if (s.atkAbility === 'permafrost-fist' && moveData.isPunch) return 'ice';
  if (s.atkAbility === 'liquid-voice' && SOUND_MOVES.has(s.atkMove)) return 'water';
  return moveData.type;
}

/** Returns BP multiplier from type-changing abilities. */
function ateBpMult(s, moveData) {
  const ate = ATE_MAP[s.atkAbility];
  if (ate && moveData.type === ate.from) return 1.2;
  if (s.atkAbility === 'permafrost-fist' && moveData.isPunch) return 1.3;
  return 1;
}

function isSTAB(moveType, pkmnTypes) {
  return pkmnTypes && pkmnTypes.includes(moveType);
}

// nHKO probability: fraction of all n-roll combinations where cumulative damage >= hp
// Early exit optimization: once sum >= hp, all remaining roll permutations are KOs
function calcNHKOChance(rolls, hp, n) {
  const total = Math.pow(16, n);
  let ko = 0;
  function recurse(depth, sum) {
    if (sum >= hp) { ko += Math.pow(16, n - depth); return; }
    if (depth === n) return;
    for (const r of rolls) recurse(depth + 1, sum + r);
  }
  recurse(0, 0);
  return ko / total;
}

// 16 damage rolls (r = 85..100)
// Order: BASE → random → STAB → type (each floored)
// Accepts pre-computed [typeEff1, typeEff2] from getTypeEffComponents to support Gravity/Strong Winds.
function calcRolls(atkStat, defStat, bp, stabMult, typeEff1, typeEff2) {
  if (!bp || !atkStat || !defStat) return new Array(16).fill(0);
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

function stageVal(id) { return parseInt(document.getElementById(id)?.value) || 0; }

// Override móvil: cuando el usuario clica uno de los botones de moves de un set,
// ese move se usa para el cálculo sin tocar el input (el input queda como 5ª opción)
window._moveOverride = window._moveOverride || { atk: null, def: null };

function readState() {
  return {
    atkPkmn:    document.getElementById('atkPkmn').value.toLowerCase().trim(),
    atkMove:    window._moveOverride.atk || document.getElementById('atkMove').value.trim(),
    atkNature:  document.getElementById('atkNature').value,
    atkHpSP:    spVal('atkHpSP'),
    atkAtkSP:   spVal('atkAtkSP'),
    atkDefSP:   spVal('atkDefSP'),
    atkSpaSP:   spVal('atkSpaSP'),
    atkSpdSP:   spVal('atkSpdSP'),
    atkSpeSP:   spVal('atkSpeSP'),
    atkAtkStage: stageVal('atkAtkStage'),
    atkDefStage: stageVal('atkDefStage'),
    atkSpaStage: stageVal('atkSpaStage'),
    atkSpdStage: stageVal('atkSpdStage'),
    atkSpeStage: stageVal('atkSpeStage'),
    atkItem:    document.getElementById('atkItem').value,
    atkAbility: document.getElementById('atkAbility').value,
    atkHPPct:   parseInt(document.getElementById('atkHPPctSlider')?.value) || 100,

    defPkmn:    document.getElementById('defPkmn').value.toLowerCase().trim(),
    defMove:    window._moveOverride.def || document.getElementById('defMove').value.trim(),
    defNature:  document.getElementById('defNature').value,
    defHpSP:    spVal('defHpSP'),
    defAtkSP:   spVal('defAtkSP'),
    defDefSP:   spVal('defDefSP'),
    defSpaSP:   spVal('defSpaSP'),
    defSpdSP:   spVal('defSpdSP'),
    defSpeSP:   spVal('defSpeSP'),
    defAtkStage: stageVal('defAtkStage'),
    defDefStage: stageVal('defDefStage'),
    defSpaStage: stageVal('defSpaStage'),
    defSpdStage: stageVal('defSpdStage'),
    defSpeStage: stageVal('defSpeStage'),
    defItem:    document.getElementById('defItem').value,
    defAbility: document.getElementById('defAbility').value,
    defHPPct:   parseInt(document.getElementById('defHPPctSlider')?.value) || 100,

    weather:     document.getElementById('fldWeather')?.value     || '',
    terrain:     document.getElementById('fldTerrain')?.value     || '',
    format:      document.querySelector('input[name="fldFormat"]:checked')?.value || 'doubles',
    // Field conditions
    gravity:     document.getElementById('fldGravity')?.checked    || false,
    magicRoom:   document.getElementById('fldMagicRoom')?.checked  || false,
    wonderRoom:  document.getElementById('fldWonderRoom')?.checked || false,
    // Atk-side modifiers (ally effects in doubles)
    helpingHand: document.getElementById('fldHelpingHand')?.checked || false,
    battery:     document.getElementById('fldBattery')?.checked    || false,
    // Def-side modifiers
    reflect:     document.getElementById('fldReflect')?.checked     || false,
    lightScreen: document.getElementById('fldLightScreen')?.checked || false,
    auroraVeil:  document.getElementById('fldAuroraVeil')?.checked  || false,
    friendGuard: document.getElementById('fldFriendGuard')?.checked || false,
    crit:        document.getElementById('fldCrit')?.checked        || false,
  };
}

// A Pokémon is "grounded" if it has no Flying type and no Levitate.
// Gravity grounds all Pokémon (Flying type and Levitate don't apply).
function isGrounded(pkmnData, ability, gravity) {
  if (!pkmnData) return false;
  if (gravity) return true;
  if (pkmnData.types.includes('flying')) return false;
  if (ability === 'levitate') return false;
  return true;
}

/** Build the state for the B→A direction by swapping all atk/def fields. */
function buildReversedState(s) {
  return {
    atkPkmn:    s.defPkmn,
    atkMove:    s.defMove,
    atkNature:  s.defNature,
    atkHpSP:    s.defHpSP,  atkAtkSP:  s.defAtkSP,  atkDefSP:  s.defDefSP,
    atkSpaSP:   s.defSpaSP, atkSpdSP:  s.defSpdSP,  atkSpeSP:  s.defSpeSP,
    atkAtkStage: s.defAtkStage, atkDefStage: s.defDefStage,
    atkSpaStage: s.defSpaStage, atkSpdStage: s.defSpdStage, atkSpeStage: s.defSpeStage,
    atkItem:    s.defItem,
    atkAbility: s.defAbility,  // B's ability used offensively
    atkHPPct:   s.atkHPPct,    // not used by reversed (it's A's HP%, but we pass it along)

    defPkmn:    s.atkPkmn,
    defMove:    s.atkMove,
    defNature:  s.atkNature,
    defHpSP:    s.atkHpSP,  defAtkSP:  s.atkAtkSP,  defDefSP:  s.atkDefSP,
    defSpaSP:   s.atkSpaSP, defSpdSP:  s.atkSpdSP,  defSpeSP:  s.atkSpeSP,
    defAtkStage: s.atkAtkStage, defDefStage: s.atkDefStage,
    defSpaStage: s.atkSpaStage, defSpdStage: s.atkSpdStage, defSpeStage: s.atkSpeStage,
    defItem:    s.atkItem,
    defAbility: s.atkAbility,  // A's ability used defensively
    defHPPct:   s.atkHPPct,    // A's current HP% (for Multiscale when B attacks A)

    weather: s.weather, terrain: s.terrain, format: s.format,
    gravity: s.gravity, magicRoom: s.magicRoom, wonderRoom: s.wonderRoom,
    helpingHand: s.helpingHand, battery: s.battery,
    reflect: s.reflect, lightScreen: s.lightScreen,
    auroraVeil: s.auroraVeil, friendGuard: s.friendGuard, crit: s.crit,
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

  const atkItem = s.magicRoom ? '' : s.atkItem; // Magic Room suppresses items
  if (atkItem === 'choice-band'  && isPhysical)  stat = Math.floor(stat * 1.5);
  if (atkItem === 'choice-specs' && !isPhysical) stat = Math.floor(stat * 1.5);
  if (atkItem === 'muscle-band'  && isPhysical)  stat = Math.floor(stat * 1.1);
  if (atkItem === 'wise-glasses' && !isPhysical) stat = Math.floor(stat * 1.1);
  if (atkItem.startsWith('type-')) {
    const itemDef = ATK_ITEMS.find(i => i.id === atkItem);
    if (itemDef && itemDef.moveType === eMoveType(s, moveData)) stat = Math.floor(stat * 1.2);
  }
  if ((s.atkAbility === 'huge-power' || s.atkAbility === 'pure-power') && isPhysical)
    stat = Math.floor(stat * 2);
  if (s.atkAbility === 'solar-power' && !isPhysical && s.weather === 'sun')
    stat = Math.floor(stat * 1.5);
  if (defAbility === 'intimidate' && isPhysical)
    stat = Math.floor(stat * 2 / 3);

  // Stat stage modifier (+6 to -6)
  // On a crit, negative attacker stages are ignored.
  let stage = isPhysical ? s.atkAtkStage : s.atkSpaStage;
  if (s.crit && stage < 0) stage = 0;
  if (stage) stat = Math.floor(stat * getStageMult(stage));

  return stat;
}

// ── Variable-power BP helpers ────────────────────────────────
/** Low Kick / Grass Knot: BP depends on defender's weight */
function weightBasedBP(defWeightKg) {
  if (defWeightKg === undefined) return 60; // fallback if weight missing
  if (defWeightKg <  10) return  20;
  if (defWeightKg <  25) return  40;
  if (defWeightKg <  50) return  60;
  if (defWeightKg < 100) return  80;
  if (defWeightKg < 200) return 100;
  return 120;
}

/** Heat Crash / Heavy Slam: BP depends on attacker weight / defender weight ratio */
function weightRatioBP(atkWeightKg, defWeightKg) {
  if (atkWeightKg === undefined || defWeightKg === undefined || defWeightKg === 0) return 60;
  const ratio = atkWeightKg / defWeightKg;
  if (ratio >= 5) return 120;
  if (ratio >= 4) return 100;
  if (ratio >= 3) return  80;
  if (ratio >= 2) return  60;
  return 40;
}

/** Gyro Ball / Electro Ball: BP = min(150, floor(25 × foe_spe / user_spe)) */
function speedBasedBP(atkSpe, defSpe) {
  if (!atkSpe) return 1;
  return Math.min(150, Math.floor(25 * defSpe / atkSpe));
}

/**
 * Returns the effective base power of a move given attacker + defender context.
 * Handles fixed BP, weight-based (Low Kick / Grass Knot / Heavy Slam / Heat Crash),
 * and speed-based (Gyro Ball / Electro Ball) moves.
 * Also applies Technician where eligible.
 */
function buildEffBP(s, moveData, atkData, defData) {
  let bp;

  if (moveData.weightBased === 'defender') {
    bp = weightBasedBP(defData?.weight_kg);
  } else if (moveData.weightBased === 'ratio') {
    bp = weightRatioBP(atkData?.weight_kg, defData?.weight_kg);
  } else if (moveData.speedBased) {
    // Compute actual speed stats (with nature, SP and stage)
    const rawAtkSpe = atkData ? calcStat(atkData.spe, s.atkSpeSP, getNatureMult(s.atkNature, 'spe')) : 1;
    const rawDefSpe = defData ? calcStat(defData.spe, s.defSpeSP, getNatureMult(s.defNature, 'spe')) : 1;
    const atkSpe = s.atkSpeStage ? Math.floor(rawAtkSpe * getStageMult(s.atkSpeStage)) : rawAtkSpe;
    const defSpe = s.defSpeStage ? Math.floor(rawDefSpe * getStageMult(s.defSpeStage)) : rawDefSpe;
    bp = speedBasedBP(atkSpe, defSpe);
  } else {
    bp = moveData.bp;
  }

  if (s.atkAbility === 'technician' && bp <= 60) bp = Math.floor(bp * 1.5);
  // -ate / Permafrost Fist BP boost
  const abMult = ateBpMult(s, moveData);
  if (abMult > 1) bp = Math.floor(bp * abMult);
  return bp;
}

function buildStabMult(s, moveData, pkmnData) {
  if (s.atkAbility === 'protean') return 1.5;
  const effType = eMoveType(s, moveData);
  if (!isSTAB(effType, pkmnData.types)) return 1;
  return s.atkAbility === 'adaptability' ? 2 : 1.5;
}

function buildDefStat(s, moveData, isPhysical) {
  const pkmnData = PKMN[s.defPkmn];
  if (!pkmnData) return { hp: 1, def: 1 };
  const hp = calcHP(pkmnData.hp, s.defHpSP);

  // Wonder Room swaps Def and SpD for all Pokémon
  const effectivePhysical = s.wonderRoom ? !isPhysical : isPhysical;
  const statKey = effectivePhysical ? 'def' : 'spd';
  const sp      = effectivePhysical ? s.defDefSP : s.defSpdSP;
  const nat     = getNatureMult(s.defNature, statKey);
  let def = calcStat(pkmnData[statKey], sp, nat);

  const defItem = s.magicRoom ? '' : s.defItem; // Magic Room suppresses items
  if (defItem === 'assault-vest' && !isPhysical) def = Math.floor(def * 1.5);
  if (defItem === 'eviolite')                    def = Math.floor(def * 1.5);

  // Weather-boosted stats (applied before stage mods, like items)
  if (s.weather === 'sand' && !isPhysical && pkmnData.types.includes('rock'))
    def = Math.floor(def * 1.5);
  if (s.weather === 'snow' && isPhysical && pkmnData.types.includes('ice'))
    def = Math.floor(def * 1.5);

  // Stat stage modifier (+6 to -6)
  // On a crit, positive defender stages are ignored.
  let defStage = isPhysical ? s.defDefStage : s.defSpdStage;
  if (s.crit && defStage > 0) defStage = 0;
  if (defStage) def = Math.floor(def * getStageMult(defStage));

  return { hp, def };
}

// Mold Breaker ignores damage-affecting defender abilities (not Intimidate,
// which already triggered on switch-in and is applied in buildAtkStat).
function effDefAbility(s) {
  return s.atkAbility === 'mold-breaker' ? '' : s.defAbility;
}

function applyPostMods(rolls, s, moveData, isPhysical, typeEff) {
  let r = rolls;
  const mType = eMoveType(s, moveData);
  const defAb = effDefAbility(s);
  if (defAb === 'thick-fat' && (mType === 'fire' || mType === 'ice'))
    r = r.map(d => Math.floor(d * 0.5));
  if (defAb === 'ice-scales' && !isPhysical)
    r = r.map(d => Math.floor(d * 0.5));
  if ((defAb === 'solid-rock' || defAb === 'filter') && typeEff > 1)
    r = r.map(d => Math.floor(d * 3 / 4));
  // Multiscale/Shadow Shield are bypassed on crits
  if ((defAb === 'multiscale' || defAb === 'shadow-shield') && s.defHPPct >= 100 && !s.crit)
    r = r.map(d => Math.floor(d * 0.5));
  if (defAb === 'fur-coat' && isPhysical)
    r = r.map(d => Math.floor(d * 0.5));
  if (s.atkAbility === 'tinted-lens' && typeEff > 0 && typeEff < 1)
    r = r.map(d => Math.floor(d * 2));
  if (s.atkAbility === 'sand-force' && s.weather === 'sand' &&
      ['rock', 'ground', 'steel'].includes(mType))
    r = r.map(d => Math.floor(d * 1.3));
  if (s.atkAbility === 'sheer-force' && moveData.hasSecondary)
    r = r.map(d => Math.floor(d * 1.3));
  if (s.atkAbility === 'tough-claws' && moveData.makesContact)
    r = r.map(d => Math.floor(d * 1.3));
  if (s.atkAbility === 'iron-fist' && moveData.isPunch)
    r = r.map(d => Math.floor(d * 1.2));
  if (s.atkAbility === 'guts' && isPhysical)
    r = r.map(d => Math.floor(d * 1.5));
  const atkItem = s.magicRoom ? '' : s.atkItem;
  const defItem = s.magicRoom ? '' : s.defItem;
  if (atkItem === 'life-orb')  r = r.map(d => Math.floor(d * 1.3));
  if (atkItem === 'expert-belt' && typeEff > 1) r = r.map(d => Math.floor(d * 1.2));

  // Type-resist berries: halve damage from a matching move type.
  // Non-Normal berries only activate on super-effective hits.
  if (defItem && defItem.startsWith('berry-')) {
    const itemDef = DEF_ITEMS.find(i => i.id === defItem);
    if (itemDef && itemDef.berryType === mType) {
      const activates = itemDef.berryType === 'normal' || typeEff > 1;
      if (activates) r = r.map(d => Math.floor(d * 0.5));
    }
  }

  // ── Weather ──
  if (s.weather === 'sun' || s.weather === 'harsh-sun') {
    if (mType === 'fire')  r = r.map(d => Math.floor(d * 1.5));
    if (mType === 'water' && s.weather === 'sun') r = r.map(d => Math.floor(d * 0.5));
    // harsh-sun: water already blocked by isImmune
  } else if (s.weather === 'rain' || s.weather === 'heavy-rain') {
    if (mType === 'water') r = r.map(d => Math.floor(d * 1.5));
    if (mType === 'fire' && s.weather === 'rain') r = r.map(d => Math.floor(d * 0.5));
    // heavy-rain: fire already blocked by isImmune
  }

  // ── Terrain (only affects grounded Pokémon) ──
  const atkData = PKMN[s.atkPkmn];
  const defData = PKMN[s.defPkmn];
  const atkGrounded = isGrounded(atkData, s.atkAbility, s.gravity);
  const defGrounded = isGrounded(defData, effDefAbility(s), s.gravity);
  if (atkGrounded) {
    if (s.terrain === 'electric' && mType === 'electric')
      r = r.map(d => Math.floor(d * 1.3));
    if (s.terrain === 'grassy'   && mType === 'grass')
      r = r.map(d => Math.floor(d * 1.3));
    if (s.terrain === 'psychic'  && mType === 'psychic')
      r = r.map(d => Math.floor(d * 1.3));
  }
  if (defGrounded) {
    if (s.terrain === 'grassy' && GRASSY_HALVED_MOVES.has(s.atkMove))
      r = r.map(d => Math.floor(d * 0.5));
    if (s.terrain === 'misty'  && mType === 'dragon')
      r = r.map(d => Math.floor(d * 0.5));
  }

  // ── Screens (VGC doubles: ×2732/4096 ≈ ×0.6670) ──
  // Screens are bypassed on crits.
  if (!s.crit) {
    const screenMult = 2732 / 4096;
    if (s.auroraVeil) {
      r = r.map(d => Math.floor(d * screenMult));
    } else {
      if (s.reflect && isPhysical)      r = r.map(d => Math.floor(d * screenMult));
      if (s.lightScreen && !isPhysical) r = r.map(d => Math.floor(d * screenMult));
    }
  }

  // ── Doubles: spread move penalty ──
  if (s.format === 'doubles' && SPREAD_MOVES.has(s.atkMove))
    r = r.map(d => Math.floor(d * 0.75));

  // ── Doubles: ally effects ──
  if (s.helpingHand)                   r = r.map(d => Math.floor(d * 1.5));
  if (s.battery && !isPhysical)        r = r.map(d => Math.floor(d * 1.3));
  if (s.friendGuard)                   r = r.map(d => Math.floor(d * 0.75));

  // ── Critical hit ──
  // Base damage ×1.5 (or ×2.25 with Sniper).
  if (s.crit) {
    const critMult = s.atkAbility === 'sniper' ? 2.25 : 1.5;
    r = r.map(d => Math.floor(d * critMult));
  }

  return r;
}

function isImmune(moveType, s) {
  const defAbility = effDefAbility(s);
  const defData    = PKMN[s.defPkmn];
  if (moveType === 'ground') {
    // Gravity removes Ground immunity from Levitate and Flying type
    if (!s.gravity) {
      if (defAbility === 'levitate') return true;
      if (defData?.types.includes('flying')) return true;
    }
  }
  if (defAbility === 'flash-fire'  && moveType === 'fire')     return true;
  if (defAbility === 'volt-absorb' && moveType === 'electric') return true;
  if ((defAbility === 'water-absorb' || defAbility === 'storm-drain') && moveType === 'water') return true;
  // Extreme weather: Water moves fail in Harsh Sunshine, Fire moves fail in Heavy Rain
  if (s.weather === 'harsh-sun'  && moveType === 'water') return true;
  if (s.weather === 'heavy-rain' && moveType === 'fire')  return true;
  return false;
}

// ═══════════════════════════════════════════════════════════
//  MAIN COMPUTE
// ═══════════════════════════════════════════════════════════

/** Compute one direction and render into dmgBlock{suffix} / optOutput{suffix}. */
function computeDirection(s, suffix) {
  const atkData  = PKMN[s.atkPkmn];
  const defData  = PKMN[s.defPkmn];
  const moveData = MOVES[s.atkMove];

  const dmgEl = document.getElementById('dmgBlock' + suffix);
  const optEl = document.getElementById('optOutput' + suffix);
  if (!dmgEl) return;

  if (!atkData || !defData || !moveData || moveData.category === 'status') {
    let msg = 'Enter Pokémon, move, and stats above.';
    if (atkData && defData && s.atkMove && !MOVES[s.atkMove])
      msg = `<strong>${s.atkMove}</strong> has variable or unknown base power — not supported.`;
    dmgEl.innerHTML = `<p class="dmg-placeholder">${msg}</p>`;
    if (optEl) optEl.innerHTML = '';
    return;
  }

  const isPhysical          = moveData.category === 'physical';
  const mType               = eMoveType(s, moveData);
  const [tEff1, tEff2]      = getTypeEffComponents(mType, defData.types, s);
  const typeEff             = tEff1 * tEff2;

  if (isImmune(mType, s)) {
    dmgEl.innerHTML = renderImmune(moveData, defData, s.defAbility, s);
    if (optEl) optEl.innerHTML = '';
    return;
  }

  const atkStat  = buildAtkStat(s, moveData, isPhysical, s.defAbility);
  const effBP    = buildEffBP(s, moveData, atkData, defData);
  const stabMult = buildStabMult(s, moveData, atkData);
  const { hp, def: defStat } = buildDefStat(s, moveData, isPhysical);
  const curHP    = Math.floor(hp * (s.defHPPct || 100) / 100);

  let rolls = calcRolls(atkStat, defStat, effBP, stabMult, tEff1, tEff2);
  rolls = applyPostMods(rolls, s, moveData, isPhysical, typeEff);

  dmgEl.innerHTML =
    renderDamage(rolls, hp, curHP, s, moveData, atkData, defData, atkStat, defStat, stabMult, typeEff, isPhysical, effBP);
  if (optEl) optEl.innerHTML = '';
}

function computeAll() {
  const s  = readState();
  const sr = buildReversedState(s);

  const atkData  = PKMN[s.atkPkmn];
  const defData  = PKMN[s.defPkmn];
  const moveAB   = MOVES[s.atkMove];

  updateTypeBadges(s.atkPkmn, 'atkTypeRow');
  updateTypeBadges(s.defPkmn, 'defTypeRow');
  updateMoveCat(moveAB);
  updateStatDisplays('atk', s, atkData, moveAB);
  updateStatDisplays('def', s, defData, moveAB);

  computeDirection(s,  'AB');
  computeDirection(sr, 'BA');

  saveState(s);
}

// ═══════════════════════════════════════════════════════════
//  PERSISTENCE (localStorage)
// ═══════════════════════════════════════════════════════════
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  catch (_) { /* quota / privacy mode — fail silently */ }
}

/**
 * Restore saved state into the DOM. Order matters because some selects are
 * rebuilt when the corresponding Pokémon changes (ability filter, move list).
 *
 * Flow per side:
 *   1. Set Pokémon input → triggers ability/move repopulation.
 *   2. Set ability (after the ability select has been repopulated).
 *   3. Set nature, item, SP sliders, stages.
 */
function restoreState() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch (_) { saved = null; }
  if (!saved) return;

  const setVal   = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  const setCheck = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
  const setSlider = (id, v, valSpanId) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = v;
    const valSpan = document.getElementById(valSpanId || (id + 'Val'));
    if (valSpan) valSpan.textContent = v;
  };
  const setStage = (id, v) => {
    const el = document.getElementById(id);
    if (!el) return;
    const n = parseInt(v) || 0;
    el.value = n;
    // Keep the colour class in sync (normally applied by onStageChange)
    el.className = 'stage-select' + (n > 0 ? ' pos' : n < 0 ? ' neg' : '');
  };

  // --- ATTACKER ---
  const atkPkmnEl = document.getElementById('atkPkmn');
  if (atkPkmnEl && saved.atkPkmn) {
    atkPkmnEl.value = PKMN[saved.atkPkmn]?.displayName || saved.atkPkmn;
    updateMoveDatalist('atk', saved.atkPkmn);
    updateAbilitySelect('atk', saved.atkPkmn);
    updateSprite('atk', saved.atkPkmn);
    updateTypeBadges(saved.atkPkmn, 'atkTypeRow');
  }
  if (saved.atkMove) setVal('atkMove', saved.atkMove);
  setVal('atkNature',  saved.atkNature  || 'Hardy');
  setVal('atkItem',    saved.atkItem    || '');
  setVal('atkAbility', saved.atkAbility || '');
  for (const stat of STAT_IDS) {
    setSlider('atk' + stat + 'SP', saved['atk' + stat + 'SP'] || 0);
    if (stat !== 'Hp') setStage('atk' + stat + 'Stage', saved['atk' + stat + 'Stage']);
  }
  updateHPPctVisibility('atk');
  if (saved.atkHPPct) setSlider('atkHPPctSlider', saved.atkHPPct, 'atkHPPctVal');

  // --- DEFENDER ---
  const defPkmnEl = document.getElementById('defPkmn');
  if (defPkmnEl && saved.defPkmn) {
    defPkmnEl.value = PKMN[saved.defPkmn]?.displayName || saved.defPkmn;
    updateMoveDatalist('def', saved.defPkmn);
    updateAbilitySelect('def', saved.defPkmn);
    updateSprite('def', saved.defPkmn);
    updateTypeBadges(saved.defPkmn, 'defTypeRow');
  }
  if (saved.defMove) setVal('defMove', saved.defMove);
  setVal('defNature',  saved.defNature  || 'Hardy');
  setVal('defItem',    saved.defItem    || '');
  setVal('defAbility', saved.defAbility || '');
  for (const stat of STAT_IDS) {
    setSlider('def' + stat + 'SP', saved['def' + stat + 'SP'] || 0);
    if (stat !== 'Hp') setStage('def' + stat + 'Stage', saved['def' + stat + 'Stage']);
  }

  // --- HP% sliders ---
  updateHPPctVisibility('def');
  if (saved.defHPPct) setSlider('defHPPctSlider', saved.defHPPct, 'defHPPctVal');

  // --- Field state ---
  setVal('fldWeather', saved.weather || '');
  setVal('fldTerrain', saved.terrain || '');
  // Format radio
  const fmtEl = document.querySelector(`input[name="fldFormat"][value="${saved.format || 'doubles'}"]`);
  if (fmtEl) fmtEl.checked = true;
  // Field conditions
  setCheck('fldGravity',     saved.gravity);
  setCheck('fldMagicRoom',   saved.magicRoom);
  setCheck('fldWonderRoom',  saved.wonderRoom);
  // Atk-side
  setCheck('fldHelpingHand', saved.helpingHand);
  setCheck('fldBattery',     saved.battery);
  // Def-side
  setCheck('fldReflect',     saved.reflect);
  setCheck('fldLightScreen', saved.lightScreen);
  setCheck('fldAuroraVeil',  saved.auroraVeil);
  setCheck('fldFriendGuard', saved.friendGuard);
  setCheck('fldCrit',        saved.crit);
}

// ═══════════════════════════════════════════════════════════
//  OPTIMIZATION
// ═══════════════════════════════════════════════════════════

window.findMinSurvive = function (dir) {
  const base = readState();
  const s = dir === 'BA' ? buildReversedState(base) : base;
  const atkData  = PKMN[s.atkPkmn];
  const defData  = PKMN[s.defPkmn];
  const moveData = MOVES[s.atkMove];
  if (!atkData || !defData || !moveData || moveData.category === 'status') return;

  const isPhysical         = moveData.category === 'physical';
  const mType              = eMoveType(s, moveData);
  const [tEff1s, tEff2s]   = getTypeEffComponents(mType, defData.types, s);
  const typeEff            = tEff1s * tEff2s;
  if (isImmune(mType, s)) return;

  const atkStat  = buildAtkStat(s, moveData, isPhysical, s.defAbility);
  const effBP    = buildEffBP(s, moveData, atkData, defData);
  const stabMult = buildStabMult(s, moveData, atkData);

  const solutions = [];
  for (let hpSP = 0; hpSP <= 32; hpSP++) {
    for (let defSP = 0; defSP <= 32; defSP++) {
      const sCopy = { ...s, defHpSP: hpSP };
      if (isPhysical) sCopy.defDefSP = defSP;
      else            sCopy.defSpdSP = defSP;
      const { hp, def } = buildDefStat(sCopy, moveData, isPhysical);

      let rolls = calcRolls(atkStat, def, effBP, stabMult, tEff1s, tEff2s);
      rolls = applyPostMods(rolls, sCopy, moveData, isPhysical, typeEff);

      // Survival is checked against current HP (HP% × max HP), not max HP
      const curHP = Math.floor(hp * (s.defHPPct || 100) / 100);
      if (rolls[0] < curHP) solutions.push({ hpSP, defSP, total: hpSP + defSP, rolls, hp, curHP });
    }
  }
  solutions.sort((a, b) => a.total - b.total || a.defSP - b.defSP);

  const out = document.getElementById('optOutput' + (dir || 'AB'));
  const defLabel = isPhysical ? 'Def' : 'SpD';

  // SP already spent in other stats — constrains the 66-SP budget.
  // For BA direction the "def" panel in state s is actually panel A's stats.
  const defStatKey = isPhysical ? 'Def' : 'Spd';
  const otherSP = STAT_IDS.reduce((sum, id) =>
    (id === 'Hp' || id === defStatKey) ? sum : sum + (s['def' + id + 'SP'] || 0), 0);
  const budget = 66 - otherSP;

  if (!solutions.length) {
    out.innerHTML = `<div class="opt-section">
      <div class="opt-title">🛡 Min SP to survive</div>
      <div class="opt-result opt-none">Cannot guarantee survival with up to 32 HP SP + 32 ${defLabel} SP.</div>
    </div>`;
    return;
  }

  function renderSurviveResult(sol, title) {
    // KO chance is computed against current HP (curHP), but % is shown vs max HP
    const koCount = sol.rolls.filter(r => r >= sol.curHP).length;
    const koLabel = koCount === 0 ? '0%' : `${(koCount / 16 * 100).toFixed(2)}%`;
    const minPct  = (sol.rolls[0]  / sol.hp * 100).toFixed(1);
    const maxPct  = (sol.rolls[15] / sol.hp * 100).toFixed(1);
    const koColor = koCount === 0 ? '#81c784' : '#ffd54f';
    const over    = sol.total > budget;
    const overWarn = over
      ? ` <span style="color:#ef5350" title="Excede el presupuesto de 66 SP dados los ${otherSP} SP ya usados en otras stats">⚠ excede budget</span>`
      : '';
    return `<div class="opt-section">
      <div class="opt-title">${title}</div>
      <div class="opt-result">
        <span class="opt-sp">+${sol.hpSP} HP SP + ${sol.defSP} ${defLabel} SP</span>
        <span style="color:var(--muted)"> (${sol.total} SP total)</span>${overWarn}<br>
        After: ${sol.rolls[0]}–${sol.rolls[15]} (${minPct}%–${maxPct}%)
        &nbsp;·&nbsp; <span style="color:${koColor}">${koLabel} OHKO</span>
      </div>
    </div>`;
  }

  const best = solutions[0];
  const safe = solutions.find(sol => sol.rolls[15] < sol.curHP) || null;

  // If best already guarantees 0% OHKO, show a single block
  if (safe && safe.hpSP === best.hpSP && safe.defSP === best.defSP) {
    out.innerHTML = renderSurviveResult(best, '🛡 Min SP to survive (0% OHKO)');
    return;
  }

  let html = renderSurviveResult(best, '🛡 Min SP to survive (any roll)');
  if (safe) {
    html += renderSurviveResult(safe, '🛡 Min SP for 0% OHKO (guaranteed survival)');
  } else {
    html += `<div class="opt-section">
      <div class="opt-title">🛡 Min SP for 0% OHKO (guaranteed survival)</div>
      <div class="opt-result opt-none">Cannot guarantee 0% OHKO with up to 32 HP SP + 32 ${defLabel} SP.</div>
    </div>`;
  }
  out.innerHTML = html;
};

window.findMinOHKO = function (dir) {
  const base = readState();
  const s = dir === 'BA' ? buildReversedState(base) : base;
  const atkData  = PKMN[s.atkPkmn];
  const defData  = PKMN[s.defPkmn];
  const moveData = MOVES[s.atkMove];
  if (!atkData || !defData || !moveData || moveData.category === 'status') return;

  const isPhysical         = moveData.category === 'physical';
  const mType              = eMoveType(s, moveData);
  const [tEff1o, tEff2o]   = getTypeEffComponents(mType, defData.types, s);
  const typeEff            = tEff1o * tEff2o;
  if (isImmune(mType, s)) return;

  const effBP    = buildEffBP(s, moveData, atkData, defData);
  const stabMult = buildStabMult(s, moveData, atkData);
  const { hp, def: defStat } = buildDefStat(s, moveData, isPhysical);
  const curHP    = Math.floor(hp * (s.defHPPct || 100) / 100);
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
      const sCopy = { ...s };
      if (isPhysical) sCopy.atkAtkSP = sp;
      else            sCopy.atkSpaSP = sp;
      const atkStat = buildAtkStat(sCopy, moveData, isPhysical, s.defAbility);

      let rolls = calcRolls(atkStat, defStat, effBP, stabMult, tEff1o, tEff2o);
      rolls = applyPostMods(rolls, s, moveData, isPhysical, typeEff);
      const koRolls = rolls.filter(r => r >= curHP).length;
      if (koRolls >= thresh.rolls) { found = { sp, atkStat, koRolls, rolls }; break; }
    }
    results.push({ ...thresh, found });
  }

  const statLabel = isPhysical ? 'Atk' : 'SpA';
  const defLabel  = isPhysical ? 'Def' : 'SpD';

  // Budget check: how much SP the attacker has already spent in OTHER stats
  const atkStatId  = isPhysical ? 'Atk' : 'Spa';
  const otherAtkSP = STAT_IDS.reduce((sum, id) =>
    id === atkStatId ? sum : sum + (s['atk' + id + 'SP'] || 0), 0);
  const atkBudget  = 66 - otherAtkSP;

  let rows = '';
  for (const r of results) {
    const isCurrent = r.found && r.found.sp === curSP;
    const over      = r.found && r.found.sp > atkBudget;
    const overMark  = over ? ' <span style="color:#ef5350" title="Excede 66 SP con el resto de stats">⚠</span>' : '';
    rows += `<tr class="${isCurrent ? 'ohko-current' : ''}">
      <td>${r.label}</td>
      <td>${r.found ? r.found.sp + ' ' + statLabel + ' SP' + overMark : '—'}</td>
      <td>${r.found
        ? `${r.found.rolls[0]}–${r.found.rolls[15]} · ${(r.found.koRolls/16*100).toFixed(2)}% KO`
        : 'Cannot reach'}</td>
    </tr>`;
  }

  document.getElementById('optOutput' + (dir || 'AB')).innerHTML = `<div class="opt-section">
    <div class="opt-title">⚔ Min SP to OHKO (defender: ${s.defHpSP} HP SP · ${isPhysical?s.defDefSP:s.defSpdSP} ${defLabel} SP)</div>
    <table class="ohko-table"><tbody>${rows}</tbody></table>
  </div>`;
};

// ═══════════════════════════════════════════════════════════
//  RESET / CLEAR PANEL
// ═══════════════════════════════════════════════════════════

/** Clear SP, stages, nature, move, and set-move buttons for a panel.
 *  Does NOT touch the Pokémon input, sprite, or item. */
function clearPanelStats(prefix) {
  for (const stat of STAT_IDS) {
    const slider = document.getElementById(prefix + stat + 'SP');
    const valSpan = document.getElementById(prefix + stat + 'SPVal');
    if (slider)  slider.value = 0;
    if (valSpan) valSpan.textContent = 0;
  }
  for (const stat of ['Atk', 'Def', 'Spa', 'Spd', 'Spe']) {
    const stageEl = document.getElementById(prefix + stat + 'Stage');
    if (stageEl) { stageEl.value = 0; stageEl.className = 'stage-select'; }
  }
  const natureEl = document.getElementById(prefix + 'Nature');
  if (natureEl) natureEl.value = prefix === 'atk' ? 'Jolly' : 'Hardy';
  const moveEl = document.getElementById(prefix + 'Move');
  if (moveEl) moveEl.value = '';
  window._moveOverride[prefix] = null;
  if (prefix === 'atk') updateMoveCat(null);
  const setMovesEl = document.getElementById(prefix + 'SetMoves');
  if (setMovesEl) setMovesEl.innerHTML = '';
  updateHPPctVisibility(prefix);
}

/** Full panel reset: Pokémon + sprite + type badges + stats + item + ability. */
window.resetPanel = function (prefix) {
  const pkmnEl = document.getElementById(prefix + 'Pkmn');
  if (pkmnEl) { pkmnEl.value = ''; pkmnEl.dataset.currentKey = ''; }
  updateSprite(prefix, '');
  updateTypeBadges('', prefix + 'TypeRow');
  updateMoveDatalist(prefix, '');
  updateAbilitySelect(prefix, '');
  document.getElementById(prefix + 'Item').value = '';
  const setEl = document.getElementById(prefix + 'Set');
  if (setEl) setEl.value = '';
  clearPanelStats(prefix);
  computeAll();
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
  swapVals('atkMove', 'defMove');
  // Swap move overrides
  const tmpOvr = window._moveOverride.atk;
  window._moveOverride.atk = window._moveOverride.def;
  window._moveOverride.def = tmpOvr;
  swapVals('atkNature', 'defNature');
  swapVals('atkItem', 'defItem');
  swapVals('atkAbility', 'defAbility');

  // Swap HP% sliders
  swapVals('atkHPPctSlider', 'defHPPctSlider');
  const atkPctVal = document.getElementById('atkHPPctVal');
  const defPctVal = document.getElementById('defHPPctVal');
  if (atkPctVal) atkPctVal.textContent = document.getElementById('atkHPPctSlider')?.value || 100;
  if (defPctVal) defPctVal.textContent = document.getElementById('defHPPctSlider')?.value || 100;

  // Swap all 6 SP sliders and their display spans
  for (const id of STAT_IDS) {
    swapVals('atk' + id + 'SP', 'def' + id + 'SP');
    const aVal = document.getElementById('atk' + id + 'SPVal');
    const bVal = document.getElementById('def' + id + 'SPVal');
    if (aVal) aVal.textContent = document.getElementById('atk' + id + 'SP').value;
    if (bVal) bVal.textContent = document.getElementById('def' + id + 'SP').value;
  }

  // Swap all stage selects (all except HP)
  for (const id of ['Atk', 'Def', 'Spa', 'Spd', 'Spe']) {
    swapVals('atk' + id + 'Stage', 'def' + id + 'Stage');
    for (const prefix of ['atk', 'def']) {
      const sel = document.getElementById(prefix + id + 'Stage');
      if (sel) {
        const v = parseInt(sel.value) || 0;
        sel.className = 'stage-select' + (v > 0 ? ' pos' : v < 0 ? ' neg' : '');
      }
    }
  }

  // Update move datalists, ability selects, sprites and HP% visibility for new roles
  const newAtkKey = document.getElementById('atkPkmn').value.toLowerCase().trim();
  const newDefKey = document.getElementById('defPkmn').value.toLowerCase().trim();
  updateMoveDatalist('atk', newAtkKey);
  updateMoveDatalist('def', newDefKey);
  updateAbilitySelect('atk', newAtkKey);
  updateAbilitySelect('def', newDefKey);
  updateSprite('atk', newAtkKey);
  updateSprite('def', newDefKey);
  updateHPPctVisibility('atk');
  updateHPPctVisibility('def');

  computeAll();
};

// ═══════════════════════════════════════════════════════════
//  DISPLAY
// ═══════════════════════════════════════════════════════════

function renderDamage(rolls, hp, curHP, s, moveData, atkData, defData, atkStat, defStat, stabMult, typeEff, isPhysical, effBP) {
  const minDmg = rolls[0], maxDmg = rolls[15];
  // Damage % is shown vs MAX HP (Showdown convention), but KO chances use CURRENT HP
  const minPct = (minDmg / hp * 100).toFixed(1);
  const maxPct = (maxDmg / hp * 100).toFixed(1);
  const koCount = rolls.filter(r => r >= curHP).length;

  let koClass = 'ko-0', koText = '0% chance to OHKO';
  if (koCount === 16)     { koClass = 'ko-full'; koText = 'Guaranteed OHKO'; }
  else if (koCount >= 8)  { koClass = 'ko-high'; koText = `${(koCount/16*100).toFixed(2)}% chance to OHKO`; }
  else if (koCount >= 1)  { koClass = 'ko-low';  koText = `${(koCount/16*100).toFixed(2)}% chance to OHKO`; }

  // nHKO suffix (2HKO → 3HKO → 4HKO), only when not guaranteed OHKO. Uses current HP.
  if (koCount < 16) {
    for (let n = 2; n <= 4; n++) {
      const chance = calcNHKOChance(rolls, curHP, n);
      if (chance >= 1) {
        koText += ` — Guaranteed ${n}HKO`;
        break;
      } else if (chance > 0) {
        koText += ` — ${(chance * 100).toFixed(2)}% chance to ${n}HKO`;
        break;
      }
    }
  }

  const mType = eMoveType(s, moveData);
  const ateConverted = mType !== moveData.type;
  let typeTag = '';
  if (typeEff === 0)        typeTag = '<span class="dmg-tag tag-imm">Immune</span>';
  else if (typeEff >= 4)    typeTag = `<span class="dmg-tag tag-se4">4× ${mType}</span>`;
  else if (typeEff >= 2)    typeTag = `<span class="dmg-tag tag-se2">2× ${mType}</span>`;
  else if (typeEff <= 0.5)  typeTag = `<span class="dmg-tag tag-nve">${typeEff}× ${mType}</span>`;

  const stabLabel = stabMult === 2 ? 'Adaptability'
                   : s.atkAbility === 'protean' ? 'Protean' : 'STAB';
  const stabTag = stabMult > 1
    ? `<span class="dmg-tag tag-stab">${stabLabel}</span>`
    : '';

  const critTag = s.crit
    ? `<span class="dmg-tag tag-crit">💥 ${s.atkAbility === 'sniper' ? 'Sniper Crit' : 'Crit'}</span>`
    : '';

  const ateTag = ateConverted
    ? `<span class="dmg-tag tag-ate">${moveData.type} → ${mType}</span>` : '';
  const hhTag  = s.helpingHand  ? '<span class="dmg-tag tag-hh">Helping Hand</span>'  : '';
  const batTag = s.battery && !isPhysical ? '<span class="dmg-tag tag-bat">Battery</span>' : '';
  const fgTag  = s.friendGuard  ? '<span class="dmg-tag tag-fg">Friend Guard</span>'  : '';
  const spreadTag = (s.format === 'doubles' && SPREAD_MOVES.has(s.atkMove))
    ? '<span class="dmg-tag tag-spread">Doubles spread ×0.75</span>' : '';
  const wrTag  = s.wonderRoom   ? '<span class="dmg-tag tag-wr">Wonder Room</span>'   : '';
  const mrTag  = s.magicRoom    ? '<span class="dmg-tag tag-mr">Magic Room</span>'    : '';

  const cells = rolls.map(d =>
    `<div class="roll-cell${d >= hp ? ' ko' : ''}" title="${d}"></div>`
  ).join('');

  const isPhysLabel  = isPhysical ? (s.wonderRoom ? 'SpD→Def' : 'Atk') : (s.wonderRoom ? 'Def→SpD' : 'SpA');
  const defStatLabel = isPhysical ? (s.wonderRoom ? 'SpD' : 'Def') : (s.wonderRoom ? 'Def' : 'SpD');
  const atkSPVal     = isPhysical ? s.atkAtkSP : s.atkSpaSP;
  const defSPVal     = isPhysical ? s.defDefSP : s.defSpdSP;
  const atkNatChar   = getNatureMult(s.atkNature, isPhysical ? 'atk' : 'spa') > 1 ? '＋'
                     : getNatureMult(s.atkNature, isPhysical ? 'atk' : 'spa') < 1 ? '−' : '●';
  const defNatChar   = getNatureMult(s.defNature, isPhysical ? 'def' : 'spd') > 1 ? '＋'
                     : getNatureMult(s.defNature, isPhysical ? 'def' : 'spd') < 1 ? '−' : '●';

  const copyText = `${atkData.displayName} ${s.atkMove} → ${minDmg}–${maxDmg} (${minPct}%–${maxPct}%) vs ${defData.displayName} ${koText}`.replace(/\s+/g, ' ').trim();

  return `
    <div class="dmg-header" onclick="copyDmgLine(this, '${copyText.replace(/'/g, "\\'")}')" title="Click to copy">
      <span class="dmg-range">${s.atkMove}${moveData.bp === null ? ` <span class="dmg-varbp">[${effBP} BP]</span>` : ''} → <strong>${minDmg}–${maxDmg}</strong></span>
      <span class="dmg-pct">(${minPct}%–${maxPct}%)</span>
      <span class="dmg-ko ${koClass}">${koText}</span>
    </div>
    <div class="dmg-tags">${ateTag}${stabTag}${typeTag}${critTag}${hhTag}${batTag}${fgTag}${spreadTag}${wrTag}${mrTag}</div>
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

window.copyDmgLine = function (el, text) {
  navigator.clipboard.writeText(text).then(() => {
    el.classList.add('dmg-copied');
    setTimeout(() => el.classList.remove('dmg-copied'), 800);
  });
};

function renderImmune(moveData, defData, defAbility, s) {
  let reason;
  const mType = eMoveType(s, moveData);
  if (s?.weather === 'harsh-sun'  && mType === 'water') reason = '☀️ Harsh Sunshine — Water moves fail';
  else if (s?.weather === 'heavy-rain' && mType === 'fire')  reason = '🌧️ Heavy Rain — Fire moves fail';
  else {
    const abilityDef = DEF_ABILITIES.find(a => a.id === defAbility);
    reason = abilityDef?.label || defAbility || 'type immunity';
  }
  return `<div class="dmg-header">
    <span class="dmg-range">No effect</span>
    <div class="dmg-tags"><span class="dmg-tag tag-imm">Immune — ${reason}</span></div>
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
      // Apply stage modifier to displayed value
      const stageEl = document.getElementById(prefix + statId + 'Stage');
      const stage   = stageEl ? parseInt(stageEl.value) || 0 : 0;
      if (stage) val = Math.floor(val * getStageMult(stage));
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

function updateMoveDatalist(prefix, pkmnKey) {
  const listId = prefix === 'def' ? 'defMoveList' : 'moveList';
  const moveList = document.getElementById(listId);
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
  // Listener bound centrally in bindEvents()
}

function populateStageSelects() {
  const opts = [];
  for (let s = 6; s >= -6; s--) {
    opts.push(`<option value="${s}"${s === 0 ? ' selected' : ''}>${s > 0 ? '+' + s : s}</option>`);
  }
  const html = opts.join('');
  document.querySelectorAll('.stage-select').forEach(sel => {
    sel.innerHTML = html;
    sel.value = '0';
  });
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

  // Initial move lists (all moves; filtered per Pokémon on selection)
  const allMoveOpts = Object.keys(MOVES).sort().map(m => `<option value="${m}">`).join('');
  for (const listId of ['moveList', 'defMoveList']) {
    const el = document.getElementById(listId);
    if (el) el.innerHTML = allMoveOpts;
  }
}

// Called when nature select changes
window.onNatureChange = function (prefix) {
  computeAll();
};

// Called when a stage select changes — update color + recalculate
window.onStageChange = function (sel) {
  const v = parseInt(sel.value) || 0;
  sel.className = 'stage-select' + (v > 0 ? ' pos' : v < 0 ? ' neg' : '');
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
  const allOptions = ALL_ABILITIES;

  // Keep "None" (id === '') always; keep ability if Pokémon has it or no data yet
  const filtered = allOptions.filter(a => !a.id || !pkmnAbs || pkmnAbs.has(a.id));

  const prevVal = sel.value;
  sel.innerHTML = filtered.map(a => `<option value="${a.id}">${a.label}</option>`).join('');

  if (prevVal && filtered.some(a => a.id === prevVal)) {
    // Restore a non-None ability that's still valid for this Pokémon
    sel.value = prevVal;
  } else {
    // Auto-select the first relevant ability for this Pokémon (skip 'None')
    const firstRelevant = filtered.find(a => a.id !== '');
    sel.value = firstRelevant ? firstRelevant.id : '';
  }

  // Show/hide Current HP slider for abilities that depend on full HP
  updateHPPctVisibility(prefix);
}

/** Show the "Current HP %" slider only for Multiscale / Shadow Shield. Works for both panels. */
function updateHPPctVisibility(prefix) {
  const ability = document.getElementById(prefix + 'Ability')?.value;
  const row     = document.getElementById(prefix + 'HPPctRow');
  if (!row) return;
  const needsHP = ability === 'multiscale' || ability === 'shadow-shield';
  row.style.display = needsHP ? '' : 'none';
  if (!needsHP) {
    const slider = document.getElementById(prefix + 'HPPctSlider');
    const val    = document.getElementById(prefix + 'HPPctVal');
    if (slider) slider.value = 100;
    if (val)    val.textContent = '100';
  }
}

/** Legacy wrapper — keep existing call sites working */
function updateDefHPPctVisibility() { updateHPPctVisibility('def'); }

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
      const prevKey = el.dataset.currentKey || '';
      // When switching to a different valid Pokémon, reset SP/stages/nature/move
      if (key !== prevKey && PKMN[key]) clearPanelStats(prefix);
      el.dataset.currentKey = key;
      // Deselect set selector when user manually changes the Pokémon
      const setEl = document.getElementById(prefix + 'Set');
      if (setEl) setEl.value = '';
      updateMoveDatalist(prefix, key);
      updateAbilitySelect(prefix, key);
      updateSprite(prefix, key);
      computeAll();
    });
  });

  // Move inputs (atk + def)
  const moveEl = document.getElementById('atkMove');
  if (moveEl) {
    moveEl.addEventListener('input', () => {
      window._moveOverride.atk = null;
      const row = document.getElementById('atkSetMoves');
      if (row) row.querySelectorAll('.btn-setmove').forEach(b => b.classList.remove('btn-setmove-active'));
      const m = MOVES[moveEl.value.trim()];
      updateMoveCat(m);
      if (m) computeAll();
    });
    moveEl.addEventListener('change', computeAll);
  }
  const defMoveEl = document.getElementById('defMove');
  if (defMoveEl) {
    defMoveEl.addEventListener('input', () => {
      window._moveOverride.def = null;
      const row = document.getElementById('defSetMoves');
      if (row) row.querySelectorAll('.btn-setmove').forEach(b => b.classList.remove('btn-setmove-active'));
      if (MOVES[defMoveEl.value.trim()]) computeAll();
    });
    defMoveEl.addEventListener('change', computeAll);
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

  // Item / ability selects
  for (const id of ['atkItem', 'defItem']) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', computeAll);
  }
  // Ability selects also update HP% slider visibility for their respective panel
  for (const prefix of ['atk', 'def']) {
    const abilityEl = document.getElementById(prefix + 'Ability');
    if (abilityEl) {
      abilityEl.addEventListener('change', () => {
        updateHPPctVisibility(prefix);
        computeAll();
      });
    }
  }

  // Field controls (weather / terrain / screens / crit)
  for (const id of ['fldWeather', 'fldTerrain', 'fldReflect', 'fldLightScreen', 'fldAuroraVeil', 'fldCrit']) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', computeAll);
  }

  // HP% sliders for both panels
  for (const prefix of ['atk', 'def']) {
    const slider = document.getElementById(prefix + 'HPPctSlider');
    const valEl  = document.getElementById(prefix + 'HPPctVal');
    if (slider) {
      slider.addEventListener('input', () => {
        if (valEl) valEl.textContent = slider.value;
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

  populateSelect('atkItem',    ALL_ITEMS);
  populateSelect('atkAbility', ALL_ABILITIES);
  populateSelect('defItem',    ALL_ITEMS);
  populateSelect('defAbility', ALL_ABILITIES);
  populateDataLists();
  bindEvents();

  // Populate set selectors from localStorage (sets persist across visits).
  refreshSetSelectors();

  // Restore the last saved session (if any) and compute once so the user
  // sees their previous calculation instead of the empty placeholder.
  restoreState();
  computeAll();
}

// Populate natures and stages immediately (no fetched data needed)
populateNatureSelects();
populateStageSelects();
loadData();

// ═══════════════════════════════════════════════════════════
//  SHOWDOWN SET PARSER
// ═══════════════════════════════════════════════════════════

/**
 * Normalise a species/move name from Showdown format to our PKMN key.
 * Showdown: "Rotom-Wash", "Urshifu-Rapid-Strike", "Garchomp-Mega"
 * Our keys: "rotom wash", "urshifu rapid strike", "mega garchomp"
 *
 * Strategy:
 *  1. Try exact lowercase+hyphen→space.
 *  2. Try Mega prefix swap ("X-Mega" → "Mega X", "X-Mega-Y" → "Mega X Y").
 *  3. Try Primal prefix swap.
 *  Otherwise return null.
 */
function normalisePkmnKey(raw) {
  if (!raw) return null;
  // Strip whitespace
  const s = raw.trim();

  // Direct: "Rotom-Wash" → "rotom wash"
  const direct = s.replace(/-/g, ' ').toLowerCase();
  if (PKMN[direct]) return direct;

  // Mega X / Mega X-Y  (Showdown: "Charizard-Mega-X" → us: "Mega Charizard X")
  const megaXY = s.match(/^(.+?)-Mega-([XY])$/i);
  if (megaXY) {
    const k = `mega ${megaXY[1].replace(/-/g, ' ').toLowerCase()} ${megaXY[2].toUpperCase()}`;
    if (PKMN[k]) return k;
  }
  const mega = s.match(/^(.+?)-Mega$/i);
  if (mega) {
    const k = `mega ${mega[1].replace(/-/g, ' ').toLowerCase()}`;
    if (PKMN[k]) return k;
  }

  // Primal
  const primal = s.match(/^(.+?)-Primal$/i);
  if (primal) {
    const k = `primal ${primal[1].toLowerCase()}`;
    if (PKMN[k]) return k;
  }

  return null;
}

/**
 * Parse EVs/SP line: "32 HP / 16 Def / 5 SpD / 13 Spe"
 * Returns { hp, atk, def, spa, spd, spe } with values clamped to 0-32.
 * Returns a `clamped` flag if any value exceeded 32.
 */
function parseEVs(line) {
  const sp = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const SD_MAP = { HP: 'hp', Atk: 'atk', Def: 'def', SpA: 'spa', SpD: 'spd', Spe: 'spe' };
  let clamped = false;
  const pairs = line.replace(/^EVs?:\s*/i, '').split('/');
  for (const pair of pairs) {
    const m = pair.trim().match(/^(\d+)\s+(\w+)$/);
    if (!m) continue;
    const key = SD_MAP[m[2]];
    if (!key) continue;
    const val = parseInt(m[1], 10);
    if (val > 32) clamped = true;
    sp[key] = Math.min(32, Math.max(0, val));
  }
  return { sp, clamped };
}

/**
 * Normalise an ability string to one of our ATK/DEF ability ids.
 * Returns the id if found, or the raw lowercase-hyphenated string (stored
 * for future use, rendered as "" in the select).
 */
function normaliseAbilityId(raw) {
  if (!raw) return '';
  const id = raw.trim().toLowerCase().replace(/\s+/g, '-');
  const all = [...ATK_ABILITIES, ...DEF_ABILITIES];
  return all.find(a => a.id === id) ? id : id; // always store, even if unknown
}

/**
 * Normalise an item string to one of our ATK/DEF item ids.
 * Returns the id if found, or the raw lowercase-hyphenated string.
 */
function normaliseItemId(raw) {
  if (!raw) return '';
  const id = raw.trim().toLowerCase().replace(/\s+/g, '-');
  const all = [...ATK_ITEMS, ...DEF_ITEMS];
  return all.find(i => i.id === id) ? id : id;
}

/**
 * Parse a single Showdown set block (no blank lines inside).
 * Returns a set object or null if the species cannot be resolved.
 */
function parseShowdownSet(block) {
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;

  // ── Line 1: [Nickname (]Species[)] [(Gender)] [@ Item] ──────
  let species = '', itemRaw = '', nickname = '';
  const firstLine = lines[0];

  // Split off item
  const atIdx = firstLine.indexOf(' @ ');
  const nameAndGender = atIdx >= 0 ? firstLine.slice(0, atIdx).trim() : firstLine.trim();
  itemRaw = atIdx >= 0 ? firstLine.slice(atIdx + 3).trim() : '';

  // Extract inner parens — could be gender (M/F), form, or species if nickname
  const parenMatch = nameAndGender.match(/^(.+?)\s*\(([^)]+)\)\s*(?:\([MF]\))?$/);
  if (parenMatch) {
    const outer = parenMatch[1].trim();
    const inner = parenMatch[2].trim();
    if (/^[MF]$/.test(inner)) {
      // gender marker only
      species = outer;
    } else {
      // "Nickname (Species)" format
      nickname = outer;
      species  = inner;
    }
  } else {
    // Strip trailing gender "(M)" / "(F)" if present
    species = nameAndGender.replace(/\s*\([MF]\)\s*$/, '').trim();
  }

  const pkmnKey = normalisePkmnKey(species);
  if (!pkmnKey) return null; // unknown species

  // ── Remaining lines ──────────────────────────────────────────
  let abilityRaw = '', nature = '', moves = [];
  let sp = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  let clamped = false;

  for (const line of lines.slice(1)) {
    if (line.startsWith('- ')) {
      const moveName = line.slice(2).replace(/\s*\(.*\)$/, '').trim(); // strip "(Hidden Power type)"
      if (moves.length < 4) moves.push(moveName);
    } else if (/^Ability:/i.test(line)) {
      abilityRaw = line.replace(/^Ability:\s*/i, '').trim();
    } else if (/^EVs:/i.test(line)) {
      const parsed = parseEVs(line);
      sp      = parsed.sp;
      clamped = parsed.clamped;
    } else if (/Nature$/.test(line)) {
      // "Bold Nature" or "Adamant Nature"
      nature = line.replace(/\s+Nature$/i, '').trim();
    }
    // Level, IVs, Tera Type — intentionally ignored
  }

  const pkmnDisplay = PKMN[pkmnKey]?.displayName || species;
  const label = (nickname || pkmnDisplay) + (nature ? ` ${nature}` : '') +
                (abilityRaw ? ` (${abilityRaw})` : '');

  return {
    id:       Date.now() + Math.random().toString(36).slice(2),
    label,
    pokemon:  pkmnKey,
    item:     normaliseItemId(itemRaw),
    ability:  normaliseAbilityId(abilityRaw),
    nature:   nature || 'Hardy',
    sp,
    moves,
    raw:      block.trim(),
    clamped,
  };
}

/**
 * Parse a text block that may contain multiple sets separated by blank lines.
 * Returns { sets: [...], warnings: [...] }.
 */
function parseShowdownText(text) {
  const blocks = text.trim().split(/\n\s*\n+/);
  const sets = [], warnings = [];
  for (const block of blocks) {
    const s = parseShowdownSet(block);
    if (!s) {
      const firstLine = block.trim().split('\n')[0];
      warnings.push(`Could not resolve species for: "${firstLine.slice(0, 40)}"`);
    } else {
      if (s.clamped) warnings.push(`${s.label}: some SP values exceeded 32 and were clamped.`);
      sets.push(s);
    }
  }
  return { sets, warnings };
}

// ═══════════════════════════════════════════════════════════
//  SET STORAGE
// ═══════════════════════════════════════════════════════════

const STORAGE_KEY_SETS = 'champions-calc-sets-v1';

function loadSets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SETS) || '[]'); }
  catch (_) { return []; }
}

function saveSetsToStorage(sets) {
  try { localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(sets)); }
  catch (_) { /* quota / privacy mode */ }
}

function addSets(newSets) {
  const sets = loadSets();
  sets.push(...newSets);
  saveSetsToStorage(sets);
  return sets;
}

function removeSet(id) {
  const sets = loadSets().filter(s => s.id !== id);
  saveSetsToStorage(sets);
  return sets;
}

function renameSet(id, newLabel) {
  const sets = loadSets().map(s => s.id === id ? { ...s, label: newLabel } : s);
  saveSetsToStorage(sets);
  return sets;
}

// ═══════════════════════════════════════════════════════════
//  SET → PANEL
// ═══════════════════════════════════════════════════════════

/**
 * Load a saved set into the attacker or defender panel.
 * @param {'atk'|'def'} prefix
 * @param {string} setId
 */
window.loadSetIntoPanel = function (prefix, setId) {
  if (!setId) return; // blank selection — do nothing
  const set = loadSets().find(s => s.id === setId);
  if (!set) return;

  const pkmnEl = document.getElementById(prefix + 'Pkmn');
  if (pkmnEl) {
    pkmnEl.value = PKMN[set.pokemon]?.displayName || set.pokemon;
    updateMoveDatalist(prefix, set.pokemon);
    updateAbilitySelect(prefix, set.pokemon);
    updateSprite(prefix, set.pokemon);
    updateTypeBadges(set.pokemon, prefix + 'TypeRow');
  }

  document.getElementById(prefix + 'Nature').value = set.nature;

  // SP sliders
  const statMap = { Hp: 'hp', Atk: 'atk', Def: 'def', Spa: 'spa', Spd: 'spd', Spe: 'spe' };
  for (const [id, key] of Object.entries(statMap)) {
    const slider = document.getElementById(prefix + id + 'SP');
    const valSpan = document.getElementById(prefix + id + 'SPVal');
    const val = set.sp[key] || 0;
    if (slider)  slider.value = val;
    if (valSpan) valSpan.textContent = val;
  }

  // Item (ALL_ITEMS available on both panels)
  const itemEl = document.getElementById(prefix + 'Item');
  if (itemEl) {
    const matched = ALL_ITEMS.find(i => i.id === set.item);
    itemEl.value = matched ? set.item : '';
  }

  // Ability (ALL_ABILITIES available on both panels)
  const abilityEl = document.getElementById(prefix + 'Ability');
  if (abilityEl) {
    const opt = abilityEl.querySelector(`option[value="${CSS.escape(set.ability)}"]`);
    abilityEl.value = opt ? set.ability : '';
  }

  updateHPPctVisibility(prefix);

  // Set first move as active override (no toca el input — queda como 5ª opción independiente)
  if (set.moves.length) {
    window._moveOverride[prefix] = set.moves[0];
    if (prefix === 'atk') updateMoveCat(MOVES[set.moves[0]]);
  } else {
    window._moveOverride[prefix] = null;
  }
  renderSetMoveButtons(prefix, set.moves);

  computeAll();
};

/**
 * Render 4 quick-pick move buttons below the Move input for the given panel.
 * If moves is empty or null, hide the row.
 */
function renderSetMoveButtons(prefix, moves) {
  const row = document.getElementById(prefix + 'SetMoves');
  if (!row) return;
  if (!moves || !moves.length) { row.innerHTML = ''; return; }
  const active = window._moveOverride[prefix];
  row.innerHTML = moves.map(m => {
    const known = MOVES[m];
    const cls   = known ? (known.category === 'physical' ? 'btn-setmove-p' :
                           known.category === 'special'  ? 'btn-setmove-s' : 'btn-setmove-t')
                        : 'btn-setmove-u';
    const activeCls = (m === active) ? ' btn-setmove-active' : '';
    const safe  = m.replace(/'/g, "\\'");
    // Moves not in the damage database (e.g. Low Kick, Grass Knot — variable BP)
    // are rendered disabled so the user knows they can't be calculated.
    if (!known) {
      return `<button class="btn-setmove btn-setmove-u btn-setmove-disabled"
        title="${m}: variable or unknown base power — not supported" disabled>${m}</button>`;
    }
    return `<button class="btn-setmove ${cls}${activeCls}" onclick="pickSetMove('${safe}','${prefix}')">${m}</button>`;
  }).join('');
}

window.pickSetMove = function (moveName, prefix) {
  prefix = prefix || 'atk';
  window._moveOverride[prefix] = moveName;
  if (prefix === 'atk') updateMoveCat(MOVES[moveName]);
  // Highlight active button
  const row = document.getElementById(prefix + 'SetMoves');
  if (row) row.querySelectorAll('.btn-setmove').forEach(b =>
    b.classList.toggle('btn-setmove-active', b.textContent === moveName));
  computeAll();
};

// ═══════════════════════════════════════════════════════════
//  SETS MODAL (open / close / import / render list)
// ═══════════════════════════════════════════════════════════

function refreshSetSelectors() {
  const sets  = loadSets();
  const blank = '<option value="">— blank set —</option>';
  const opts  = sets.map(s =>
    `<option value="${s.id}">${s.label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</option>`
  ).join('');
  for (const id of ['atkSet', 'defSet']) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = blank + opts;
  }
}

function renderSetsList() {
  const sets = loadSets();
  const listEl = document.getElementById('setsModalList');
  if (!listEl) return;
  if (!sets.length) {
    listEl.innerHTML = '<p class="sets-empty">No saved sets yet. Paste Showdown text above and click Import.</p>';
    return;
  }
  listEl.innerHTML = sets.map(s => {
    const pkmnData = PKMN[s.pokemon];
    const spriteUrl = pkmnData ? spriteUrl_for(s.pokemon) : '';
    const safeLabel = s.label.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
    const safeId    = s.id.replace(/'/g, "\\'");
    return `
      <div class="set-row" data-id="${s.id}">
        ${spriteUrl ? `<img class="set-sprite" src="${spriteUrl}" data-pkmn="${s.pokemon}" onerror="window._setSpriteFallback(this)" alt="">` : '<span class="set-sprite-placeholder"></span>'}
        <input class="set-label-input" value="${safeLabel}" title="Click to rename"
          onblur="window.renameSetInline('${safeId}', this.value)"
          onkeydown="if(event.key==='Enter'){this.blur();event.preventDefault()}">
        <button class="btn-set-delete" onclick="window.deleteSetFromModal('${safeId}')" title="Delete">×</button>
      </div>
    `;
  }).join('');
}

// Returns the primary sprite URL for a Pokémon key, using the same nameToSlug
// logic as updateSprite so that Mega/regional names resolve correctly.
function spriteUrl_for(pkmnKey) {
  const display = PKMN[pkmnKey]?.displayName || '';
  if (!display) return '';
  return `https://img.pokemondb.net/sprites/home/normal/${nameToSlug(display)}.png`;
}

// Fallback handler for set-list sprites: tries remaining URLs from spriteQueue
// (same logic as updateSprite) instead of simply hiding the image.
window._setSpriteFallback = function (img) {
  if (!img._spriteQ) {
    const display = PKMN[img.dataset.pkmn]?.displayName || '';
    img._spriteQ  = display ? spriteQueue(display).slice(1) : [];
  }
  nextSprite(img);
};

window.openSetsModal = function () {
  renderSetsList();
  document.getElementById('setsOverlay').style.display = 'flex';
};

window.closeSetsModal = function () {
  document.getElementById('setsOverlay').style.display = 'none';
};

window.closeSetsOverlay = function (e) {
  if (e.target === document.getElementById('setsOverlay')) window.closeSetsModal();
};

window.importSets = function () {
  const textarea  = document.getElementById('setsImportText');
  const labelInput = document.getElementById('setsImportLabel');
  if (!textarea || !textarea.value.trim()) return;
  const { sets, warnings } = parseShowdownText(textarea.value);
  const resultEl = document.getElementById('setsImportResult');
  if (!sets.length && !warnings.length) {
    resultEl.textContent = 'Nothing imported.';
    return;
  }
  // If the user provided a mote, apply it as label.
  // Single set: the mote IS the full label.
  // Multiple sets: append " — N" suffix so they stay distinguishable.
  const mote = labelInput?.value.trim() || '';
  if (mote) {
    sets.forEach((s, i) => {
      s.label = sets.length === 1 ? mote : `${mote} — ${i + 1}`;
    });
  }
  addSets(sets);
  textarea.value = '';
  if (labelInput) labelInput.value = '';
  refreshSetSelectors();
  renderSetsList();
  let msg = sets.length ? `Imported ${sets.length} set${sets.length > 1 ? 's' : ''}.` : '';
  if (warnings.length) msg += ' ⚠ ' + warnings.join(' ');
  resultEl.textContent = msg;
};

window.deleteSetFromModal = function (id) {
  removeSet(id);
  refreshSetSelectors();
  renderSetsList();
};

window.renameSetInline = function (id, newLabel) {
  const trimmed = newLabel.trim();
  if (!trimmed) return; // don't allow blank label
  renameSet(id, trimmed);
  refreshSetSelectors();
  // Don't re-render the list — would lose focus and feel jumpy
};
