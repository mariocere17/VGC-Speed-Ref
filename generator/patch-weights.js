'use strict';
// generator/patch-weights.js
// Adds weight_kg to every entry in pokemon-stats.json by fetching from PokeAPI.
// Run once: node generator/patch-weights.js

const fs   = require('fs');
const path = require('path');
const OUT  = path.join(__dirname, '..', 'pokemon-stats.json');
const POKEAPI = 'https://pokeapi.co/api/v2';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Must match toDisplayName() in get-pokemon-stats.js
function words(s) {
  return s.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function toDisplayName(name) {
  if (name.includes('-gmax') || name.includes('-totem') || name.includes('-starter')) return null;
  const skipSuffixes = ['-cap', '-original', '-partner', '-alola-totem', '-dusk-mane', '-dawn-wings'];
  if (skipSuffixes.some(s => name.endsWith(s))) return null;
  const megaXY = name.match(/^(.+)-mega-([xy])$/);
  if (megaXY) return `Mega ${words(megaXY[1])} ${megaXY[2].toUpperCase()}`;
  const mega = name.match(/^(.+)-mega$/);
  if (mega) return `Mega ${words(mega[1])}`;
  const primal = name.match(/^(.+)-primal$/);
  if (primal) return `Primal ${words(primal[1])}`;
  return words(name);
}

async function main() {
  const PKMN = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const total = Object.keys(PKMN).length;
  const needsWeight = Object.values(PKMN).filter(v => v.weight_kg === undefined).length;
  console.log(`Loaded ${total} Pokémon. ${needsWeight} need weight_kg.`);
  if (!needsWeight) { console.log('All already have weight. Done.'); return; }

  console.log('Fetching Pokémon list from PokeAPI...');
  const list = await fetchJSON(`${POKEAPI}/pokemon?limit=2000`);
  console.log(`Got ${list.results.length} API entries. Patching weights...`);

  let updated = 0, skipped = 0;

  for (const entry of list.results) {
    const displayName = toDisplayName(entry.name);
    if (!displayName) { skipped++; continue; }
    const key = displayName.toLowerCase();
    if (!PKMN[key]) { skipped++; continue; }
    if (PKMN[key].weight_kg !== undefined) { skipped++; continue; }

    try {
      const pkmn = await fetchJSON(entry.url);
      PKMN[key].weight_kg = Math.round(pkmn.weight) / 10; // hectograms → kg
      updated++;
    } catch (err) {
      console.warn(`  WARN ${entry.name}: ${err.message}`);
    }

    if ((updated + skipped) % 200 === 0)
      console.log(`  processed ${updated + skipped}/${list.results.length} (${updated} updated)...`);
    await sleep(20);
  }

  fs.writeFileSync(OUT, JSON.stringify(PKMN, null, 2));
  console.log(`\nDone! ${updated} entries updated with weight_kg.`);
}

main().catch(err => { console.error(err); process.exit(1); });
