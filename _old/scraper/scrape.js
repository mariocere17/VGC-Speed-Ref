const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const TARGET_URL = 'https://mattari-kura.com/champ/speed/?rule=1';

function fmt(n) {
  return n.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

async function resolveNames(newIds, nameCache) {
  await Promise.all(newIds.map(async id => {
    try {
      if (!id.includes('-')) {
        const r = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        nameCache[id] = fmt((await r.json()).name);
      } else {
        const [base, idx] = id.split('-');
        const r = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${base}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const species = await r.json();
        const variety = species.varieties[+idx] ?? species.varieties[0];
        nameCache[id] = fmt(variety?.pokemon?.name || id);
      }
    } catch (e) {
      console.warn(`  ⚠ Failed to resolve ${id}: ${e.message}`);
      nameCache[id] = '#' + id;
    }
  }));
}

async function scrape() {
  // Load existing data for name cache
  let nameCache = {};
  try {
    const existing = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const rows = existing.data || existing; // handle both formats
    // Skip malformed names (fallback IDs like "666 18") so they get re-resolved
    rows.forEach(e => {
      if (e.dex_id && e.pokemon && !/^\d/.test(e.pokemon)) nameCache[e.dex_id] = e.pokemon;
    });
    console.log(`Loaded ${Object.keys(nameCache).length} cached names`);
  } catch {
    console.log('No existing data.json — starting fresh');
  }

  console.log(`Launching browser...`);
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  let raw;
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36');
    console.log(`Navigating to ${TARGET_URL}`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('table tr td', { timeout: 30000 });

    raw = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('table tr')].slice(1);
      const raw = [];
      rows.forEach(tr => {
        const cells = [...tr.querySelectorAll('td')];
        if (cells.length < 4) return;
        const actual  = cells[0]?.textContent?.trim();
        const base    = cells[1]?.textContent?.trim();
        const mult    = cells[2]?.textContent?.trim();
        // Take only first line of ability text (strips tooltip content)
        const ability = (cells[4]?.textContent?.trim() || '').split('\n')[0].trim();
        const imgs    = [...(cells[3]?.querySelectorAll('img') || [])];
        if (imgs.length === 0) {
          raw.push({ actual, base, mult, dex_id: '', ability });
        } else {
          imgs.forEach(img => {
            const dex_id = (img.src || '').split('/').pop().replace('.webp', '');
            raw.push({ actual, base, mult, dex_id, ability });
          });
        }
      });
      return raw;
    });
    console.log(`Extracted ${raw.length} rows from table`);
  } finally {
    await browser.close();
  }

  // Resolve new Pokemon names
  const uniqueIds = [...new Set(raw.map(r => r.dex_id).filter(Boolean))];
  const newIds    = uniqueIds.filter(id => !nameCache[id]);
  console.log(`Cache: ${uniqueIds.length - newIds.length} hits · PokeAPI: ${newIds.length} new`);

  if (newIds.length > 0) {
    await resolveNames(newIds, nameCache);
  }

  const result = raw.map(r => ({ ...r, pokemon: nameCache[r.dex_id] || '' }));

  const output = {
    updated: new Date().toISOString(),
    count: result.length,
    data: result,
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(output, null, 2));
  console.log(`✅ ${result.length} entries written to data.json`);
}

scrape().catch(e => { console.error(e); process.exit(1); });
