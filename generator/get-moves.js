'use strict';
// generator/get-moves.js
// Downloads all damaging moves from PokeAPI.
// Generates moves.json used by the damage calculator.
// Run once: node generator/get-moves.js

const fs   = require('fs');
const path = require('path');
const OUT  = path.join(__dirname, '..', 'moves.json');
const POKEAPI  = 'https://pokeapi.co/api/v2';
const DELAY_MS = 50;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function toDisplayName(name) {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Moves whose "contact" flag we know about (for Tough Claws ability)
// PokeAPI includes this in metadata but we'll store it too
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// Moves with secondary effects (for Sheer Force)
// We'll detect these by checking if effect_entries contain secondary chance
// PokeAPI has a "meta" field with stat_chance, flinch_chance, etc.
// We'll store hasSecondary as a flag

async function main() {
  console.log('Fetching move list from PokeAPI...');
  const listData = await fetchJSON(`${POKEAPI}/move?limit=2000`);
  const entries = listData.results;
  console.log(`Found ${entries.length} moves. Processing damaging moves only...`);

  const result = {};
  let done = 0;
  let skipped = 0;

  for (const entry of entries) {
    try {
      const move = await fetchJSON(entry.url);

      // Skip status moves and zero/null power
      if (!move.power || move.power <= 0) { skipped++; done++; continue; }
      if (move.damage_class.name === 'status') { skipped++; done++; continue; }

      const displayName = toDisplayName(move.name);

      // Determine if move makes contact (for Tough Claws, Rough Skin, etc.)
      const makesContact = move.meta?.flags?.contact ?? false;
      // Check meta for secondary effects (for Sheer Force)
      const hasSecondary = !!(
        (move.meta?.stat_chance > 0) ||
        (move.meta?.flinch_chance > 0) ||
        (move.meta?.ailment_chance > 0)
      );

      // Check if it's a punching move (for Iron Fist) — look for "punch" in flags
      const isPunch = (move.name.includes('punch') ||
        move.name === 'ice-punch' || move.name === 'fire-punch' ||
        move.name === 'thunder-punch' || move.name === 'mach-punch' ||
        move.name === 'shadow-punch' || move.name === 'bullet-punch' ||
        move.name === 'drain-punch' || move.name === 'focus-punch' ||
        move.name === 'sky-uppercut' || move.name === 'sucker-punch');

      result[displayName] = {
        bp: move.power,
        type: move.type.name,
        category: move.damage_class.name, // "physical" or "special"
        makesContact,
        hasSecondary,
        isPunch,
      };
    } catch (err) {
      console.warn(`  WARN: ${entry.name} — ${err.message}`);
    }

    done++;
    if (done % 100 === 0) console.log(`  ${done}/${entries.length}...`);
    await sleep(DELAY_MS);
  }

  // Sort alphabetically
  const sorted = Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b))
  );

  fs.writeFileSync(OUT, JSON.stringify(sorted, null, 2));
  console.log(`\nDone! ${Object.keys(sorted).length} moves written to moves.json (${skipped} status/zero skipped)`);
}

main().catch(err => { console.error(err); process.exit(1); });
