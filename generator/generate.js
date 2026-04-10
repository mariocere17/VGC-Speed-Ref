const fs   = require('fs');
const path = require('path');

const POOL_FILE = path.join(__dirname, '..', 'champions', 'pool.json');
const OUT_FILE  = path.join(__dirname, '..', 'champions', 'data.json');

// Speed-boosting abilities recognised from PokeAPI ability slugs
const SPEED_ABILITIES = {
  'swift-swim':      { mult: '×2',   en: 'Swift Swim' },
  'chlorophyll':     { mult: '×2',   en: 'Chlorophyll' },
  'sand-rush':       { mult: '×2',   en: 'Sand Rush' },
  'slush-rush':      { mult: '×2',   en: 'Slush Rush' },
  'unburden':        { mult: '×2',   en: 'Unburden' },
  'speed-boost':     { mult: '×2',   en: 'Speed Boost' },
  'weak-armor':      { mult: '×2',   en: 'Weak Armor' },
  'surge-surfer':    { mult: '×2',   en: 'Surge Surfer' },
  'electric-engine': { mult: '×2',   en: 'Electric Engine' },
  'quick-feet':      { mult: '×1.5', en: 'Quick Feet' },
};

const TIERS = [
  { key: 'max',     evs: 252, nature: 1.1 },
  { key: 'neutral', evs: 252, nature: 1.0 },
  { key: 'none',    evs: 0,   nature: 1.0 },
];

const SCARF_MIN_BASE = 60; // Skip Choice Scarf for very slow Pokémon

// Level-50 speed formula (matching in-game calculation)
function calcSpeed(base, evs, nature) {
  return Math.floor(Math.floor((2 * base + 31 + Math.floor(evs / 4)) * 50 / 100 + 5) * nature);
}

function applyMult(speed, mult) {
  if (mult === '×2')   return speed * 2;
  if (mult === '×1.5') return Math.floor(speed * 1.5);
  return speed;
}

function capitalize(s) {
  return s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

// Fetch with simple retry on 5xx / network error
async function fetchWithRetry(url, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return r;
      if (r.status === 404) return null; // not found — caller handles
      if (r.status >= 500 && i < attempts - 1) { await new Promise(r => setTimeout(r, 1000 * (i + 1))); continue; }
      throw new Error(`HTTP ${r.status} for ${url}`);
    } catch (e) {
      if (i === attempts - 1) throw e;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

async function fetchPokemon(entry) {
  // Build PokeAPI URL: prefer numeric id, fall back to name-as-slug
  let apiId;
  if (entry.form !== undefined && entry.id) {
    // e.g. Calyrex-Ice → pokemon-species/{id} → variety[form]
    const r = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${entry.id}`);
    if (!r) { console.warn(`  ⚠ Species not found for ${entry.name}`); return null; }
    const species = await r.json();
    const variety = species.varieties[entry.form] ?? species.varieties[0];
    if (!variety) { console.warn(`  ⚠ No variety[${entry.form}] for ${entry.name}`); return null; }
    apiId = variety.pokemon.url.split('/').filter(Boolean).pop();
  } else if (entry.id) {
    apiId = entry.id;
  } else {
    // Slugify the display name for PokeAPI
    apiId = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
  }

  const r = await fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${apiId}`);
  if (!r) { console.warn(`  ⚠ Pokemon not found: ${apiId}`); return null; }
  return r.json();
}

async function processPokemon(entry) {
  console.log(`  → ${entry.name}`);
  const data = await fetchPokemon(entry);
  if (!data) return [];

  const base    = data.stats.find(s => s.stat.name === 'speed')?.base_stat;
  const dex_id  = String(data.id);
  const name    = entry.name; // Use display name from pool.json

  if (!base) { console.warn(`  ⚠ No speed stat for ${name}`); return []; }

  const abilities = data.abilities
    .filter(a => !a.is_hidden || true) // include hidden abilities
    .map(a => a.ability.name)
    .filter(slug => SPEED_ABILITIES[slug]);

  const rows = [];

  // --- Base tiers (no multiplier) ---
  for (const tier of TIERS) {
    rows.push({
      pokemon: name,
      dex_id,
      actual: calcSpeed(base, tier.evs, tier.nature),
      base,
      tier: tier.key,
      mult: '',
      ability: '',
    });
  }

  // --- Choice Scarf (×1.5) — max + neutral only, base ≥ threshold ---
  if (base >= SCARF_MIN_BASE) {
    for (const tier of TIERS.filter(t => t.key !== 'none')) {
      const raw = calcSpeed(base, tier.evs, tier.nature);
      rows.push({
        pokemon: name,
        dex_id,
        actual: applyMult(raw, '×1.5'),
        base,
        tier: tier.key,
        mult: '×1.5',
        ability: 'Choice Scarf',
      });
    }
  }

  // --- Speed-boosting abilities ---
  for (const slug of abilities) {
    const { mult, en } = SPEED_ABILITIES[slug];
    const tierList = mult === '×2' ? TIERS : TIERS.filter(t => t.key !== 'none');
    for (const tier of tierList) {
      const raw = calcSpeed(base, tier.evs, tier.nature);
      rows.push({
        pokemon: name,
        dex_id,
        actual: applyMult(raw, mult),
        base,
        tier: tier.key,
        mult,
        ability: en,
      });
    }
  }

  return rows;
}

async function generate() {
  const pool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
  console.log(`Pool: ${pool.pokemon.length} Pokémon (${pool.format})`);

  const all = [];
  for (const entry of pool.pokemon) {
    try {
      const rows = await processPokemon(entry);
      all.push(...rows);
    } catch (e) {
      console.warn(`  ⚠ Error processing ${entry.name}: ${e.message}`);
    }
  }

  // Sort by actual speed descending, then tier order (max > neutral > none), then name
  const TIER_ORDER = { max: 0, neutral: 1, none: 2 };
  all.sort((a, b) =>
    b.actual - a.actual ||
    (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) ||
    a.pokemon.localeCompare(b.pokemon)
  );

  const output = {
    updated: new Date().toISOString(),
    count: all.length,
    format: pool.format,
    data: all,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`✅ ${all.length} entries written to champions/data.json`);
}

generate().catch(e => { console.error(e); process.exit(1); });
