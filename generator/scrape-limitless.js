'use strict';
const fs   = require('fs');
const path = require('path');

const BASE_URL  = 'https://play.limitlesstcg.com';
const OUT_FILE  = path.join(__dirname, '..', 'limitless.json');
const DELAY_MS  = 800;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'VGCSpeedRef/1.0 (educational tool)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// Extract text between two patterns (simple non-greedy helper)
function between(str, open, close, from = 0) {
  const s = str.indexOf(open, from);
  if (s === -1) return null;
  const e = str.indexOf(close, s + open.length);
  if (e === -1) return null;
  return str.substring(s + open.length, e);
}

// Scrape tournament list for a given date, return only Champions format (data-format="1") entries
async function getTournaments(date) {
  const url = `${BASE_URL}/tournaments/completed?game=VGC&time=${date}&show=30`;
  const html = await fetchHtml(url);

  const results = [];
  // Match every <tr> that contains data-format="1"
  const trRe = /<tr\b([^>]*data-format="1"[^>]*)>/g;
  let m;
  while ((m = trRe.exec(html)) !== null) {
    const attrs = m[1];
    // Extract tr attributes
    const id       = html.substring(m.index, m.index + 500).match(/href="\/tournament\/([a-f0-9]{24})\/standings"/)?.[1];
    const name     = attrs.match(/data-name="([^"]+)"/)?.[1];
    const players  = parseInt(attrs.match(/data-players="(\d+)"/)?.[1] || '0');
    const dateAttr = attrs.match(/data-date="([^"]+)"/)?.[1]?.split('T')?.[0];

    if (id && name && players > 0) {
      results.push({ id, name, date: dateAttr || date, total_teams: players });
    }
  }
  return results;
}

// Scrape metagame table for a tournament. Returns null if not Champions (M-A) format.
async function getMetagame(tournamentId) {
  const url = `${BASE_URL}/tournament/${tournamentId}/metagame`;
  const html = await fetchHtml(url);

  // Confirm this is the Champions (Regulation M-A) format
  const desc = html.match(/<meta name="description" content="([^"]+)"/)?.[1] || '';
  if (!desc.includes('M-A')) return null;

  const pokemon = {};
  // Each row has data-share and data-winrate attributes
  const rowRe = /data-share="([\d.]+)"\s+data-winrate="([\d.]+)">([\s\S]*?)<\/tr>/g;
  let m;
  while ((m = rowRe.exec(html)) !== null) {
    const rowHtml = m[3];

    // Pokemon name is in the <a href="...metagame/name">Name</a> link
    const name   = rowHtml.match(/<a [^>]+>([^<]+)<\/a>/)?.[1]?.trim();
    // Team count: first standalone numeric <td>
    const teams  = parseInt(rowHtml.match(/<td>(\d+)<\/td>/)?.[1] || '0');
    // W-L-D record: only "N - N - N" pattern in the row
    const record = rowHtml.match(/(\d+) - (\d+) - (\d+)/);

    if (!name || teams === 0 || !record) continue;

    pokemon[name] = {
      teams,
      wins:   parseInt(record[1]),
      losses: parseInt(record[2]),
      draws:  parseInt(record[3]),
    };
  }
  return pokemon;
}

// Re-compute aggregate stats from all stored tournaments
function buildAggregate(tournaments) {
  const totals = {};
  let total_teams = 0;

  for (const t of Object.values(tournaments)) {
    total_teams += t.total_teams;
    for (const [name, s] of Object.entries(t.pokemon)) {
      if (!totals[name]) totals[name] = { teams: 0, wins: 0, losses: 0, draws: 0 };
      totals[name].teams   += s.teams;
      totals[name].wins    += s.wins;
      totals[name].losses  += s.losses;
      totals[name].draws   += s.draws;
    }
  }

  const pokemon = {};
  for (const [name, t] of Object.entries(totals)) {
    const wl = t.wins + t.losses;
    pokemon[name] = {
      teams:     t.teams,
      usage_pct: total_teams > 0 ? parseFloat((t.teams / total_teams * 100).toFixed(2)) : 0,
      wins:      t.wins,
      losses:    t.losses,
      draws:     t.draws,
      win_rate:  wl > 0 ? parseFloat((t.wins / wl * 100).toFixed(2)) : 0,
    };
  }

  return { total_teams, tournament_count: Object.keys(tournaments).length, pokemon };
}

(async () => {
  // Date from CLI arg or default to yesterday UTC
  const date = process.argv[2] || (() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  console.log(`Fetching Champions tournaments for ${date}...`);

  // Load existing accumulated data
  let existing = { tournaments: {} };
  if (fs.existsSync(OUT_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')); } catch {}
  }
  const knownIds = new Set(Object.keys(existing.tournaments || {}));

  const found   = await getTournaments(date);
  const newOnes = found.filter(t => !knownIds.has(t.id));

  if (newOnes.length === 0) {
    console.log(`No new Champions tournaments found for ${date}. Nothing to do.`);
    process.exit(0);
  }

  console.log(`Found ${newOnes.length} new tournament(s)`);

  const allTournaments = { ...existing.tournaments };

  for (let i = 0; i < newOnes.length; i++) {
    const t = newOnes[i];
    process.stdout.write(`[${i + 1}/${newOnes.length}] ${t.name}... `);
    try {
      const pkmnData = await getMetagame(t.id);
      if (!pkmnData) { console.log('— skipped (not M-A format)'); continue; }
      allTournaments[t.id] = {
        name:        t.name,
        date:        t.date,
        total_teams: t.total_teams,
        pokemon:     pkmnData,
      };
      console.log(`✓ (${Object.keys(pkmnData).length} Pokémon)`);
    } catch (e) {
      console.log(`✗ ${e.message}`);
    }
    if (i < newOnes.length - 1) await sleep(DELAY_MS);
  }

  const aggregate = buildAggregate(allTournaments);

  fs.writeFileSync(OUT_FILE, JSON.stringify({
    updated:     new Date().toISOString(),
    format:      'championstournaments',
    tournaments: allTournaments,
    aggregate,
  }, null, 2));

  console.log(`\n✅ limitless.json: ${aggregate.tournament_count} tournaments, ${Object.keys(aggregate.pokemon).length} Pokémon, ${aggregate.total_teams} total teams`);
})();
