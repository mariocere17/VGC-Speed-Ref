'use strict';
const fs   = require('fs');
const path = require('path');

const BASE_AI_URL    = 'https://www.pikalytics.com/ai/pokedex/championstournaments';
const LIMITLESS_FILE = path.join(__dirname, '..', 'limitless.json');
const OUT_FILE       = path.join(__dirname, '..', 'pikalytics.json');
// Min tournament usage % (from Limitless) to include supplementary Pokémon
const MIN_TOURNEY    = 0.5;
const DELAY_MS       = 500;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VGCSpeedRef/1.0 (educational tool)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Parse "## Section Title\n- **Name**: XX.XX%\n..." blocks
function parseSection(md, sectionTitle) {
  const re = new RegExp(`## ${sectionTitle}\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = md.match(re);
  if (!match) return [];
  const entries = [];
  for (const line of match[1].split('\n')) {
    const m = line.match(/^- \*\*(.+?)\*\*: ([\d.]+)%/);
    if (m) entries.push({ name: m[1], pct: parseFloat(m[2]) });
  }
  return entries;
}

// Returns [{name, usage}] — all Pokémon in the index (capped ~50 by Pikalytics)
async function scrapeIndex() {
  console.log('Fetching Pikalytics index (top ~50)...');
  const md = await fetchText(BASE_AI_URL);
  const pokemon = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\| (\d+) \| \*\*(.+?)\*\* \| ([\d.]+)%/);
    if (m) pokemon.push({ name: m[2], usage: parseFloat(m[3]) });
  }
  return pokemon;
}

// Returns {moves, items, abilities} from the individual AI page
async function scrapeIndividual(name) {
  const url = `${BASE_AI_URL}/${encodeURIComponent(name)}`;
  const md  = await fetchText(url);
  return {
    moves:     parseSection(md, 'Common Moves').slice(0, 8),
    items:     parseSection(md, 'Common Items').slice(0, 6),
    abilities: parseSection(md, 'Common Abilities').slice(0, 4),
  };
}

// Load extra Pokémon names from Limitless that aren't already in the index set
function loadLimitlessExtras(indexSet) {
  if (!fs.existsSync(LIMITLESS_FILE)) return [];
  try {
    const lim = JSON.parse(fs.readFileSync(LIMITLESS_FILE, 'utf8'));
    const agg = lim.aggregate?.pokemon || {};
    return Object.entries(agg)
      .filter(([name, d]) => !indexSet.has(name) && (d.usage_pct ?? 0) >= MIN_TOURNEY)
      .sort(([, a], [, b]) => b.usage_pct - a.usage_pct)
      .map(([name]) => ({ name, usage: null })); // usage % not available for extras
  } catch { return []; }
}

(async () => {
  try {
    const indexList = await scrapeIndex();
    console.log(`Pikalytics index: ${indexList.length} Pokémon with ladder usage %`);

    const indexSet = new Set(indexList.map(p => p.name));
    const extras   = loadLimitlessExtras(indexSet);
    console.log(`Limitless extras: ${extras.length} additional Pokémon (≥${MIN_TOURNEY}% tournament usage)`);

    const allPokemon = [...indexList, ...extras];
    console.log(`Total to scrape: ${allPokemon.length}`);

    const result = {};
    for (let i = 0; i < allPokemon.length; i++) {
      const { name, usage } = allPokemon[i];
      const label = usage != null ? `${usage}% ladder` : 'extra';
      process.stdout.write(`[${i + 1}/${allPokemon.length}] ${name} (${label})... `);
      try {
        const data = await scrapeIndividual(name);
        result[name] = { usage, ...data };
        console.log('✓');
      } catch (e) {
        console.log(`✗ ${e.message}`);
      }
      if (i < allPokemon.length - 1) await sleep(DELAY_MS);
    }

    const out = {
      updated: new Date().toISOString(),
      format:  'championstournaments',
      count:   Object.keys(result).length,
      pokemon: result,
    };
    fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
    console.log(`\n✅ ${out.count} Pokémon written to pikalytics.json`);
  } catch (e) {
    console.error('Fatal error:', e.message);
    process.exit(1);
  }
})();
