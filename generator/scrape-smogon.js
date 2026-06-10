'use strict';
const fs   = require('fs');
const path = require('path');

const FORMAT   = 'gen9championsvgc2026regma';
const CUTOFF   = 1760;
const OUT_FILE = path.join(__dirname, '..', 'smogon.json');

// How many spreads to keep per Pokémon (sorted desc by %)
const MAX_SPREADS = 8;
// Minimum usage fraction to include a Pokémon (~0.5%)
const MIN_USAGE   = 0.005;

async function get(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VGCSpeedRef/1.0 (educational tool)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

// Returns the most recent month string ('YYYY-MM') that has stats published.
// Smogon publishes month M data around the 1st of month M+1, so we try
// previous month first, then 2 months back as a fallback.
async function resolveMonth() {
  const now = new Date();
  for (let back = 1; back <= 3; back++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
    const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const url   = `https://www.smogon.com/stats/${month}/chaos/${FORMAT}-${CUTOFF}.json`;
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': 'VGCSpeedRef/1.0 (educational tool)' },
      });
      if (res.ok) { console.log(`Found stats for ${month}`); return month; }
      console.log(`${month}: HTTP ${res.status}`);
    } catch (e) {
      console.log(`${month}: ${e.message}`);
    }
  }
  throw new Error('No Champions stats found in the last 3 months');
}

// Parse "Nature:HP/Atk/Def/SpA/SpD/Spe" → { nature, sp: [6 numbers] }
function parseSpread(key) {
  const colon = key.indexOf(':');
  const nature = key.slice(0, colon);
  const sp     = key.slice(colon + 1).split('/').map(Number);
  return { nature, sp };
}

(async () => {
  try {
    const month = await resolveMonth();

    // Check if we already have this month
    if (fs.existsSync(OUT_FILE)) {
      const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
      if (existing.month === month) {
        console.log(`smogon.json already up to date for ${month} — nothing to do.`);
        process.exit(0);
      }
    }

    const url = `https://www.smogon.com/stats/${month}/chaos/${FORMAT}-${CUTOFF}.json`;
    console.log(`Fetching ${url} ...`);
    const res  = await get(url);
    const raw  = await res.json();

    const allData = raw.data || {};
    const result  = {};
    let count = 0;

    for (const [name, entry] of Object.entries(allData)) {
      const usageFrac = entry.usage ?? 0;
      if (usageFrac < MIN_USAGE) continue;

      // Spreads: chaos JSON stores raw weighted counts, not percentages — normalize
      const spreadsRaw = entry.Spreads || {};
      const totalCount = Object.values(spreadsRaw).reduce((s, v) => s + v, 0);
      const spreads = Object.entries(spreadsRaw)
        .map(([key, count]) => ({
          ...parseSpread(key),
          pct: totalCount > 0 ? +(count / totalCount * 100).toFixed(2) : 0,
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, MAX_SPREADS);

      result[name] = {
        usage:   +(usageFrac * 100).toFixed(2),
        spreads,
      };
      count++;
    }

    const out = {
      updated: new Date().toISOString(),
      format:  FORMAT,
      cutoff:  CUTOFF,
      month,
      count,
      pokemon: result,
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2));
    console.log(`✅ ${count} Pokémon written to smogon.json (${month})`);
  } catch (e) {
    console.error('Fatal:', e.message);
    process.exit(1);
  }
})();
