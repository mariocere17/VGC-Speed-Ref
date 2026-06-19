'use strict';
const fs   = require('fs');
const path = require('path');

const FORMAT     = 'gen9championsvgc2026regmb';
const CUTOFF     = 1760;
const OUT_FILE   = path.join(__dirname, '..', 'smogon.json');
const MOVES_FILE = path.join(__dirname, '..', 'moves.json');
const STATS_FILE = path.join(__dirname, '..', 'pokemon-stats.json');

const MAX_SPREADS = 8;
const MAX_MOVES   = 8;
const MAX_ITEMS   = 6;
const MAX_ABIL    = 4;
const MIN_USAGE   = 0.005;

// ── Name normalisation helpers ──────────────────────────────────────────────
// Smogon chaos JSON stores move/item/ability names as lowercase slugs.

// Build ability + move slug maps from pokemon-stats.json
const statsJson    = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
const abilBySlug   = {};
const moveBySlug   = {};
for (const poke of Object.values(statsJson)) {
  for (const a of [...(poke.abilities?.normal || []), ...(poke.abilities?.hidden || [])]) {
    abilBySlug[a.toLowerCase().replace(/[^a-z0-9]/g, '')] = a;
  }
  for (const m of (poke.moves || [])) {
    const slug = m.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!moveBySlug[slug]) moveBySlug[slug] = m;
  }
}
// Also add damaging moves from moves.json (more authoritative casing for those)
const movesJson = JSON.parse(fs.readFileSync(MOVES_FILE, 'utf8'));
for (const name of Object.keys(movesJson)) {
  moveBySlug[name.toLowerCase().replace(/[^a-z0-9]/g, '')] = name;
}

// Moves whose canonical names use punctuation not captured by slug matching
const MOVE_CORRECTIONS = { 'willowisp': 'Will-O-Wisp', 'ominouswind': 'Ominous Wind' };

function normMove(s) {
  const slug = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return MOVE_CORRECTIONS[slug] || moveBySlug[slug] || s.replace(/\b\w/g, c => c.toUpperCase());
}
function normAbility(s) {
  return abilBySlug[s.toLowerCase()] || s.replace(/\b\w/g, c => c.toUpperCase());
}
function normItem(s) {
  // Insert space before known item-type suffixes, then title-case
  const r = s
    .replace(/berry$/, ' Berry').replace(/plate$/, ' Plate').replace(/gem$/, ' Gem')
    .replace(/drive$/, ' Drive').replace(/memory$/, ' Memory').replace(/scarf$/, ' Scarf')
    .replace(/band$/, ' Band').replace(/orb$/, ' Orb').replace(/goggles$/, ' Goggles')
    .replace(/vest$/, ' Vest').replace(/sash$/, ' Sash').replace(/glasses$/, ' Glasses')
    .replace(/charm$/, ' Charm').replace(/stone$/, ' Stone').replace(/seed$/, ' Seed')
    .replace(/herb$/, ' Herb').replace(/spray$/, ' Spray');
  return r.replace(/\b\w/g, c => c.toUpperCase());
}

// Normalise raw weighted counts to % and return top N sorted desc
function normalizeTop(rawObj, denominator, limit, normFn) {
  if (!rawObj || denominator <= 0) return [];
  return Object.entries(rawObj)
    .map(([k, count]) => ({ name: normFn(k), pct: +(count / denominator * 100).toFixed(2) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, limit);
}

// ── Network helpers ─────────────────────────────────────────────────────────
async function get(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VGCSpeedRef/1.0 (educational tool)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

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

function parseSpread(key) {
  const colon = key.indexOf(':');
  const nature = key.slice(0, colon);
  const sp     = key.slice(colon + 1).split('/').map(Number);
  return { nature, sp };
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    const month = await resolveMonth();

    if (fs.existsSync(OUT_FILE)) {
      const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
      if (existing.month === month) {
        console.log(`smogon.json already up to date for ${month} — nothing to do.`);
        process.exit(0);
      }
    }

    const url = `https://www.smogon.com/stats/${month}/chaos/${FORMAT}-${CUTOFF}.json`;
    console.log(`Fetching ${url} ...`);
    const raw  = await (await get(url)).json();

    const result = {};
    let count = 0;

    for (const [name, entry] of Object.entries(raw.data || {})) {
      if ((entry.usage ?? 0) < MIN_USAGE) continue;

      // All per-Pokémon counts share the same denominator: total weighted appearances.
      // Abilities always have 1 per appearance, so their sum = total appearances.
      const abilitiesRaw = entry.Abilities || {};
      const abilitiesSum = Object.values(abilitiesRaw).reduce((s, v) => s + v, 0);

      // Spreads use their own sum (handles "Other" catch-all entries)
      const spreadsRaw = entry.Spreads || {};
      const spreadsSum = Object.values(spreadsRaw).reduce((s, v) => s + v, 0);

      const spreads = Object.entries(spreadsRaw)
        .map(([key, count]) => ({ ...parseSpread(key), pct: spreadsSum > 0 ? +(count / spreadsSum * 100).toFixed(2) : 0 }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, MAX_SPREADS);

      result[name] = {
        usage:     +(entry.usage * 100).toFixed(2),
        moves:     normalizeTop(entry.Moves,    abilitiesSum, MAX_MOVES, normMove),
        items:     normalizeTop(entry.Items,    abilitiesSum, MAX_ITEMS, normItem),
        abilities: normalizeTop(abilitiesRaw,   abilitiesSum, MAX_ABIL,  normAbility),
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
