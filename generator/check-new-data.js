'use strict';
/**
 * check-new-data.js
 * Detects new Pokémon or formats in Pikalytics / Limitless that are NOT
 * yet reflected in our local pikalytics.json / limitless.json.
 * Run manually via the /check-new-data skill.
 */
const fs   = require('fs');
const path = require('path');

const ROOT          = path.join(__dirname, '..');
const PIK_FILE      = path.join(ROOT, 'pikalytics.json');
const LIM_FILE      = path.join(ROOT, 'limitless.json');
const PIK_INDEX_URL = 'https://www.pikalytics.com/ai/pokedex/championstournaments';
const LIM_URL       = 'https://play.limitlesstcg.com/tournaments/completed?game=VGC&time=';
const DELAY_MS      = 600;

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function get(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'VGCSpeedRef/1.0 (educational tool)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

// ── Pikalytics ─────────────────────────────────────────────────────────────
async function checkPikalytics() {
  console.log('\n── Pikalytics ─────────────────────────────────────────');
  const stored = fs.existsSync(PIK_FILE)
    ? new Set(Object.keys(JSON.parse(fs.readFileSync(PIK_FILE, 'utf8')).pokemon || {}))
    : new Set();

  const md = await get(PIK_INDEX_URL);
  const liveTop50 = [];
  for (const line of md.split('\n')) {
    const m = line.match(/^\| (\d+) \| \*\*(.+?)\*\* \| ([\d.]+)%/);
    if (m) liveTop50.push({ name: m[2], usage: parseFloat(m[3]) });
  }

  const newInTop50 = liveTop50.filter(p => !stored.has(p.name));
  if (newInTop50.length) {
    console.log(`🆕 ${newInTop50.length} new Pokémon in Pikalytics top-50 not in pikalytics.json:`);
    newInTop50.forEach(p => console.log(`   • ${p.name} (${p.usage}% ladder usage)`));
  } else {
    console.log(`✅ No new Pokémon in Pikalytics top-50`);
  }

  // Pokémon that DROPPED out of top-50 (were stored but no longer in index)
  const droppedFromTop50 = liveTop50.length > 0
    ? [...stored].filter(n => {
        const storedEntry = JSON.parse(fs.readFileSync(PIK_FILE, 'utf8')).pokemon[n];
        return storedEntry?.usage != null && !liveTop50.find(p => p.name === n);
      })
    : [];
  if (droppedFromTop50.length) {
    console.log(`📉 ${droppedFromTop50.length} Pokémon dropped out of Pikalytics top-50:`);
    droppedFromTop50.forEach(n => console.log(`   • ${n}`));
  }

  return newInTop50;
}

// ── Limitless ───────────────────────────────────────────────────────────────
async function checkLimitless() {
  console.log('\n── Limitless ───────────────────────────────────────────');
  const stored = fs.existsSync(LIM_FILE)
    ? JSON.parse(fs.readFileSync(LIM_FILE, 'utf8'))
    : { tournaments: {}, aggregate: { pokemon: {} } };

  const knownIds     = new Set(Object.keys(stored.tournaments || {}));
  const knownPokemon = new Set(Object.keys(stored.aggregate?.pokemon || {}));

  // Check last 7 days for new tournaments (deduplicate by ID across days)
  const newTournaments = [];
  const seenIds = new Set(knownIds); // start with already-known IDs
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().split('T')[0];
    const html = await get(`${LIM_URL}${date}&show=30`);

    const trRe = /<tr\b([^>]*data-format="1"[^>]*)>/g;
    let m;
    while ((m = trRe.exec(html)) !== null) {
      const attrs = m[1];
      const id   = html.substring(m.index, m.index + 500).match(/href="\/tournament\/([a-f0-9]{24})\/standings"/)?.[1];
      const name = attrs.match(/data-name="([^"]+)"/)?.[1];
      const dateAttr = attrs.match(/data-date="([^"]+)"/)?.[1]?.split('T')?.[0] || date;
      if (id && name && !seenIds.has(id)) {
        seenIds.add(id);
        newTournaments.push({ id, name, date: dateAttr });
      }
    }
    if (i < 6) await sleep(DELAY_MS);
  }

  if (newTournaments.length) {
    console.log(`🆕 ${newTournaments.length} new Champions tournament(s) not in limitless.json:`);
    newTournaments.forEach(t => console.log(`   • [${t.date}] ${t.name} (${t.id})`));
  } else {
    console.log(`✅ No new Champions tournaments in the last 7 days`);
  }

  return { newTournaments, knownPokemon };
}

// ── Showdown stats ──────────────────────────────────────────────────────────
async function checkShowdown() {
  console.log('\n── Showdown usage stats ────────────────────────────────');
  try {
    // Smogon publishes monthly stats at smogon.com/stats/YYYY-MM/
    const now    = new Date();
    // Try current month, fall back to previous
    const months = [
      `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`,
      `${now.getUTCFullYear()}-${String(now.getUTCMonth()).padStart(2, '0')}`,
    ];
    let statsHtml = null;
    let usedMonth = null;
    for (const month of months) {
      try {
        statsHtml = await get(`https://www.smogon.com/stats/${month}/`);
        usedMonth = month;
        break;
      } catch { /* try next */ }
    }
    if (!statsHtml) { console.log('⚠️  Smogon stats page not reachable'); return; }

    // Find Champions-format files (Reg M = regm, or fall back to current VGC regs)
    const allVgc = [...statsHtml.matchAll(/href="([^"]*vgc[^"]*\.txt)"/gi)].map(m => m[1]);
    const champFiles = allVgc.filter(f => /regm/i.test(f));
    const relevantFiles = champFiles.length ? champFiles : allVgc.filter(f => /regi/i.test(f));

    if (!allVgc.length) {
      console.log(`ℹ️  No VGC stat files found for ${usedMonth} on Smogon`);
    } else if (!relevantFiles.length) {
      console.log(`ℹ️  Smogon has VGC stats for ${usedMonth} but no Champions (Reg M) format yet`);
      console.log(`   Latest available: ${allVgc.slice(-2).join(', ')}`);
    } else {
      console.log(`📊 Smogon Champions stats available for ${usedMonth}:`);
      relevantFiles.forEach(f => console.log(`   • ${f}`));
      console.log(`   → Visit https://www.smogon.com/stats/${usedMonth}/ for full data`);
    }
  } catch (e) {
    console.log(`⚠️  Could not reach Smogon stats: ${e.message}`);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`🔍 Checking for new data (${new Date().toISOString().split('T')[0]})`);

  try {
    const [newPik] = await Promise.all([checkPikalytics()]);
    await sleep(DELAY_MS);
    const { newTournaments } = await checkLimitless();
    await sleep(DELAY_MS);
    await checkShowdown();

    console.log('\n── Summary ─────────────────────────────────────────────');
    const hasNew = newPik.length > 0 || newTournaments.length > 0;
    if (hasNew) {
      console.log('⚡ New data detected! Consider running:');
      if (newPik.length)          console.log('   • node generator/scrape-pikalytics.js');
      if (newTournaments.length)  console.log('   • node generator/scrape-limitless.js');
    } else {
      console.log('✅ Everything is up to date.');
    }
  } catch (e) {
    console.error('Fatal:', e.message);
    process.exit(1);
  }
})();
