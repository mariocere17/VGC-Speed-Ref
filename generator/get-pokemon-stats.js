'use strict';
// generator/get-pokemon-stats.js
// Downloads base stats + types for all Pokémon from PokeAPI.
// Generates pokemon-stats.json used by the damage calculator.
// Run once: node generator/get-pokemon-stats.js

const fs   = require('fs');
const path = require('path');
const OUT  = path.join(__dirname, '..', 'pokemon-stats.json');
const POKEAPI  = 'https://pokeapi.co/api/v2';
const DELAY_MS = 50;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Convert PokeAPI name ("great-tusk", "charizard-mega-x") → display name, or null to skip */
function toDisplayName(name) {
  // Skip Gigantamax forms (not in Champions)
  if (name.includes('-gmax') || name.includes('-totem') || name.includes('-starter')) return null;
  // Skip cosmetic variants with no different stats (cap, original, partner, etc.)
  const skipSuffixes = ['-cap', '-original', '-partner', '-alola-totem', '-dusk-mane', '-dawn-wings'];
  if (skipSuffixes.some(s => name.endsWith(s))) return null;

  // Megas: "charizard-mega" or "charizard-mega-x" / "charizard-mega-y"
  const megaXY = name.match(/^(.+)-mega-([xy])$/);
  if (megaXY) {
    const base = words(megaXY[1]);
    return `Mega ${base} ${megaXY[2].toUpperCase()}`;
  }
  const mega = name.match(/^(.+)-mega$/);
  if (mega) return `Mega ${words(mega[1])}`;

  // Primal: "kyogre-primal" → "Primal Kyogre"
  const primal = name.match(/^(.+)-primal$/);
  if (primal) return `Primal ${words(primal[1])}`;

  // General: capitalize each word
  return words(name);
}

function words(s) {
  return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log('Fetching Pokémon list from PokeAPI...');
  const listData = await fetchJSON(`${POKEAPI}/pokemon?limit=2000`);
  const entries = listData.results;
  console.log(`Found ${entries.length} entries. Processing...`);

  const result = {};
  let done = 0;

  for (const entry of entries) {
    try {
      const displayName = toDisplayName(entry.name);
      if (!displayName) { done++; continue; }

      const pkmn = await fetchJSON(entry.url);

      const statsMap = {};
      for (const s of pkmn.stats) statsMap[s.stat.name] = s.base_stat;

      const types = pkmn.types
        .sort((a, b) => a.slot - b.slot)
        .map(t => t.type.name);

      const key = displayName.toLowerCase();
      result[key] = {
        displayName,
        hp:  statsMap['hp'],
        atk: statsMap['attack'],
        def: statsMap['defense'],
        spa: statsMap['special-attack'],
        spd: statsMap['special-defense'],
        spe: statsMap['speed'],
        types,
      };
    } catch (err) {
      console.warn(`  WARN: ${entry.name} — ${err.message}`);
    }

    done++;
    if (done % 100 === 0) console.log(`  ${done}/${entries.length}...`);
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(`\nDone! ${Object.keys(result).length} Pokémon written to pokemon-stats.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
