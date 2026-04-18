'use strict';
// generator/update-learnsets.js
// Replaces the `moves` array in pokemon-stats.json using Pokémon Showdown's
// learnsets.json (much more complete than PokeAPI's per-Pokémon `moves` field —
// PokeAPI was missing things like Sucker Punch on Kingambit). Walks the
// evolution chain so pre-evolution moves are inherited the same way Showdown
// does it.
//
// Run:  node generator/update-learnsets.js

const fs   = require('fs');
const path = require('path');

const STATS_PATH = path.join(__dirname, '..', 'pokemon-stats.json');
const MOVES_PATH = path.join(__dirname, '..', 'moves.json');
const LEARNSETS_URL = 'https://play.pokemonshowdown.com/data/learnsets.json';
const POKEDEX_URL   = 'https://play.pokemonshowdown.com/data/pokedex.json';

/** Lowercase + strip everything except a-z/0-9 — Showdown's key convention. */
function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Map our display-name keys ("Mega Garchomp", "Basculegion Male", etc.) to
 * Showdown's internal key ("garchompmega", "basculegion", ...).
 */
function ourNameToShowdownNorm(displayName) {
  let n = displayName;

  // "Mega X"   → "X Mega"
  // "Mega X Y" → "X Mega Y"   (preserves the X/Y suffix)
  const megaXY = n.match(/^Mega\s+(.+?)\s+([XY])$/i);
  if (megaXY) n = `${megaXY[1]} Mega ${megaXY[2]}`;
  else {
    const mega = n.match(/^Mega\s+(.+)$/i);
    if (mega) n = `${mega[1]} Mega`;
  }

  // "Primal X" → "X Primal"
  const primal = n.match(/^Primal\s+(.+)$/i);
  if (primal) n = `${primal[1]} Primal`;

  // "X Male" → "X" (Showdown uses the bare key for the male / default form)
  n = n.replace(/\s+Male$/i, '');
  // "X Female" → "X F"
  n = n.replace(/\s+Female$/i, ' F');

  return norm(n);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json();
}

async function main() {
  console.log('Reading existing data files...');
  const stats = JSON.parse(fs.readFileSync(STATS_PATH, 'utf8'));
  const moves = JSON.parse(fs.readFileSync(MOVES_PATH, 'utf8'));

  console.log('Fetching Showdown learnsets + pokedex...');
  const [learnsets, pokedex] = await Promise.all([
    fetchJSON(LEARNSETS_URL),
    fetchJSON(POKEDEX_URL),
  ]);

  // pokedex key → display name from Showdown's data; build a reverse map
  // norm(name) → showdownKey so we can look up our entries by normalised name.
  const showdownKeyByNorm = {};
  for (const [key, entry] of Object.entries(pokedex)) {
    if (entry?.name) showdownKeyByNorm[norm(entry.name)] = key;
  }

  // norm(displayMove) → displayMove   so we can map "suckerpunch" → "Sucker Punch".
  const displayMoveByNorm = {};
  for (const moveName of Object.keys(moves)) {
    displayMoveByNorm[norm(moveName)] = moveName;
  }

  /**
   * Walk a Pokémon's full evolution chain, unioning every learnable move.
   * Returns a Set of normalised move ids (Showdown format).
   */
  function gatherMoves(showdownKey, seen = new Set()) {
    if (!showdownKey || seen.has(showdownKey)) return new Set();
    seen.add(showdownKey);

    const out = new Set();
    const ls = learnsets[showdownKey]?.learnset;
    if (ls) for (const move of Object.keys(ls)) out.add(move);

    // Inherit from prevo (recurses up the chain — Pawniard → Bisharp → Kingambit)
    const prevoName = pokedex[showdownKey]?.prevo;
    if (prevoName) {
      const prevoKey = showdownKeyByNorm[norm(prevoName)];
      for (const m of gatherMoves(prevoKey, seen)) out.add(m);
    }

    // Megas/forms inherit from baseSpecies (Garchomp-Mega ← Garchomp)
    const baseSpecies = pokedex[showdownKey]?.baseSpecies;
    if (baseSpecies) {
      const baseKey = showdownKeyByNorm[norm(baseSpecies)];
      for (const m of gatherMoves(baseKey, seen)) out.add(m);
    }

    return out;
  }

  let updated = 0;
  let unmatchedPkmn = 0;
  let totalAdded = 0;
  let totalRemoved = 0;

  for (const [ourKey, entry] of Object.entries(stats)) {
    const sdNorm = ourNameToShowdownNorm(entry.displayName);
    const sdKey  = showdownKeyByNorm[sdNorm];
    if (!sdKey) {
      unmatchedPkmn++;
      continue; // leave existing moves untouched
    }

    const movesSet = gatherMoves(sdKey);

    // Translate Showdown ids → our display names, keeping only moves we have
    // damage data for in moves.json (status moves and unknown ones are dropped).
    const displayMoves = [];
    for (const m of movesSet) {
      const display = displayMoveByNorm[m];
      if (display) displayMoves.push(display);
    }
    displayMoves.sort();

    const before = new Set(entry.moves || []);
    const after  = new Set(displayMoves);
    let added = 0, removed = 0;
    for (const m of after)  if (!before.has(m)) added++;
    for (const m of before) if (!after.has(m)) removed++;
    totalAdded   += added;
    totalRemoved += removed;

    entry.moves = displayMoves;
    updated++;
  }

  fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2));
  console.log(`\nUpdated ${updated}/${Object.keys(stats).length} Pokémon.`);
  console.log(`  ${unmatchedPkmn} entries had no Showdown match (left untouched).`);
  console.log(`  Net moves added: ${totalAdded}, removed: ${totalRemoved}.`);

  // Sanity log: confirm the originally reported case is fixed
  const kg = stats['kingambit'];
  if (kg) console.log(`Kingambit Sucker Punch present? ${kg.moves.includes('Sucker Punch')}`);
}

main().catch(err => { console.error(err); process.exit(1); });
