'use strict';
const fs   = require('fs');
const path = require('path');

const BASE_AI_URL = 'https://www.pikalytics.com/ai/pokedex/championstournaments';
const MIN_USAGE   = 1.0;
const DELAY_MS    = 500;
const OUT_FILE    = path.join(__dirname, '..', 'pikalytics.json');

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

async function scrapeIndex() {
  console.log('Fetching Pikalytics index...');
  const md = await fetchText(BASE_AI_URL);
  const pokemon = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\| (\d+) \| \*\*(.+?)\*\* \| ([\d.]+)%/);
    if (!m) continue;
    const usage = parseFloat(m[3]);
    if (usage > MIN_USAGE) pokemon.push({ name: m[2], usage });
  }
  return pokemon;
}

async function scrapeIndividual(name) {
  const url = `${BASE_AI_URL}/${encodeURIComponent(name)}`;
  const md  = await fetchText(url);
  return {
    moves:     parseSection(md, 'Common Moves').slice(0, 8),
    items:     parseSection(md, 'Common Items').slice(0, 6),
    abilities: parseSection(md, 'Common Abilities').slice(0, 4),
  };
}

(async () => {
  try {
    const list = await scrapeIndex();
    console.log(`Found ${list.length} Pokémon above ${MIN_USAGE}% usage`);

    const result = {};
    for (let i = 0; i < list.length; i++) {
      const { name, usage } = list[i];
      process.stdout.write(`[${i + 1}/${list.length}] ${name} (${usage}%)... `);
      try {
        const data = await scrapeIndividual(name);
        result[name] = { usage, ...data };
        console.log('✓');
      } catch (e) {
        console.log(`✗ ${e.message}`);
      }
      if (i < list.length - 1) await sleep(DELAY_MS);
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
