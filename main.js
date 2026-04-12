// Items get a different chip color
const ITEMS = new Set(['Choice Scarf']);

const DESC = {
  'Unburden':              'Doubles Speed when the held item is lost or consumed',
  'Chlorophyll':           'Doubles Speed in harsh sunlight',
  'Sand Rush':             'Doubles Speed in a sandstorm',
  'Speed Boost':           'Raises Speed by 1 stage at the end of each turn',
  'Choice Scarf':          'Boosts Speed ×1.5, but locks the holder into one move',
  'Quick Feet':            'Boosts Speed ×1.5 when the holder has a status condition',
  'Weak Armor':            'Physical hits raise Speed ×2 and lower Defense',
  'Swift Swim':            'Doubles Speed in rain',
  'Slush Rush':            'Doubles Speed in snow or hail',
  'Electric Engine':       'Doubles Speed when hit by an Electric-type move',
  'Steadfast':             'Raises Speed by 1 stage each time the holder flinches',
  'Surge Surfer':          'Doubles Speed on Electric Terrain',
  'Slush Rush / Swift Swim': 'Doubles Speed in snow/hail or rain (depending on form)',
};

function splitAbilities(raw) {
  return raw ? [raw.trim()] : [];
}

function abilityChips(abilities) {
  return abilities.map(a => {
    const cls = ITEMS.has(a) ? 'chip-item' : 'chip-ability';
    const tip = DESC[a] ? ` data-tip="${esc(DESC[a])}"` : '';
    return `<span class="chip ${cls}"${tip}>${esc(a)}</span>`;
  }).join('');
}

// ── Security: HTML escaping ──────────────────────────────────────
function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Name / Sprite helpers ────────────────────────────────────────
function nameToSlug(name) {
  let n = name.trim();

  // Rotom appliance forms: "Heat Rotom" → "rotom-heat"
  const rotomM = n.match(/^(Heat|Wash|Frost|Fan|Mow)\s+Rotom$/i);
  if (rotomM) return 'rotom-' + rotomM[1].toLowerCase();

  // Mega forms: "Mega Venusaur" → "venusaur-mega", "Mega Charizard X" → "charizard-mega-x"
  const megaM = n.match(/^Mega\s+(.+?)(?:\s+([XY]))?$/i);
  if (megaM) {
    const base = megaM[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/-$/, '');
    return base + '-mega' + (megaM[2] ? '-' + megaM[2].toLowerCase() : '');
  }

  // Regional forms: "Alolan X" → "x-alola", "Paldean X (Form)" → "x-paldea-form"
  const regionMap = { Alolan: 'alola', Hisuian: 'hisui', Galarian: 'galar', Paldean: 'paldea' };
  for (const [prefix, suffix] of Object.entries(regionMap)) {
    if (n.startsWith(prefix + ' ')) {
      const rest = n.slice(prefix.length + 1);
      const formM = rest.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (formM) {
        const base = formM[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const form = formM[2].toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return `${base}-${suffix}-${form}`;
      }
      return rest.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/-$/, '') + '-' + suffix;
    }
  }

  // Parenthetical form suffix: "Gourgeist (Small)" → "gourgeist-small"
  n = n.replace(/\s*\(([^)]+)\)\s*$/, (_, f) => '-' + f);

  return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function spriteQueue(name) {
  const slug  = nameToSlug(name);
  const parts = slug.split('-');
  const last  = parts.length > 1 ? parts.slice(0, -1).join('-') : null;
  const first = parts.length > 1 ? parts[0] : null;
  const pdb   = s => `https://img.pokemondb.net/sprites/home/normal/${s}.png`;
  const sd    = s => `https://play.pokemonshowdown.com/sprites/gen5/${s}.png`;
  const seen  = new Set([slug]);
  const q     = [pdb(slug), sd(slug)];
  if (last  && !seen.has(last))  { seen.add(last);  q.push(pdb(last),  sd(last));  }
  if (first && !seen.has(first)) { seen.add(first); q.push(pdb(first), sd(first)); }
  return q;
}

function nextSprite(img) {
  const q = img._spriteQ;
  if (!q || !q.length) { img.style.opacity = '0.12'; img.onerror = null; return; }
  img.onerror = () => nextSprite(img);
  img.src = q.shift();
}

// ── Data processing ──────────────────────────────────────────────
function processEntry(e) {
  const abilities = splitAbilities(e.ability || '');
  return {
    actual:      parseInt(e.actual) || 0,
    base:        e.base || 0,
    tier:        e.tier || 'none',
    mult:        e.mult || '',
    pokemon:     e.pokemon || '',
    dex_id:      e.dex_id || '',
    abilities,
    abilityText: abilities.map(a => a.toLowerCase()).join(' '),
  };
}

// ── State ────────────────────────────────────────────────────────
let ALL_DATA = [];
let filtered = [];
let PIKALYTICS = {};
let sortCol = 'actual';
let sortDir = 'desc';
let condition = null; // 'tailwind' | 'para' | null

// ── Compare state ────────────────────────────────────────────────
let compareA = null, compareB = null;
let cmpCondA = null, cmpCondB = null;
let cmpWeather = null; // 'sun' | 'rain' | 'sand' | 'snow' | null

const WEATHER_ABILITIES = {
  sun:  ['Chlorophyll'],
  rain: ['Swift Swim', 'Slush Rush / Swift Swim'],
  sand: ['Sand Rush'],
  snow: ['Slush Rush', 'Slush Rush / Swift Swim'],
};

function getWeatherAbility(r) {
  for (const [w, list] of Object.entries(WEATHER_ABILITIES)) {
    if (r.abilities.some(a => list.includes(a))) return w;
  }
  return null;
}

function isWeatherEntry(r) {
  return r.mult === '×2' && getWeatherAbility(r) !== null;
}

function calcFinalSpeedWeather(r, cond, weather) {
  let speed = r.actual;
  const abilityWeather = getWeatherAbility(r);
  if (abilityWeather) {
    const alreadyBoosted = isWeatherEntry(r);
    if (weather === abilityWeather && !alreadyBoosted) speed *= 2;
    if (weather !== abilityWeather && alreadyBoosted)  speed = Math.floor(speed / 2);
  }
  return calcFinalSpeed(speed, cond);
}

function setCmpWeather(w) {
  cmpWeather = w;
  ['None','Sun','Rain','Sand','Snow'].forEach(n => {
    const btn = document.getElementById('w' + n);
    if (btn) btn.classList.remove('active-weather');
  });
  const activeId = w ? 'w' + w.charAt(0).toUpperCase() + w.slice(1) : 'wNone';
  document.getElementById(activeId)?.classList.add('active-weather');
  renderCmpCols();
}

function toggleCondition(c) {
  condition = condition === c ? null : c;
  document.getElementById('btnTailwind').className = 'btn-toggle' + (condition === 'tailwind' ? ' active-tailwind' : '');
  document.getElementById('btnPara').className     = 'btn-toggle' + (condition === 'para'     ? ' active-para'     : '');
  render();
}

function applyCondition(speed) {
  if (condition === 'tailwind') return speed * 2;
  if (condition === 'para')     return Math.floor(speed / 2);
  return speed;
}

// ── Auto-load data.json + pikalytics.json ───────────────────────
(async function loadData() {
  const lastUpdated = document.getElementById('lastUpdated');
  try {
    const [dataRes, pikRes] = await Promise.all([
      fetch('./data.json'),
      fetch('./pikalytics.json').catch(() => null),
    ]);
    if (!dataRes.ok) throw new Error(`HTTP ${dataRes.status}`);
    const json = await dataRes.json();
    const rows = json.data || json;
    ALL_DATA = rows.map(processEntry);
    injectCustomSets();
    if (pikRes?.ok) {
      const pik = await pikRes.json();
      PIKALYTICS = pik.pokemon || {};
    }
    document.getElementById('mainContent').style.display = '';
    if (json.updated) {
      const d = new Date(json.updated);
      lastUpdated.textContent = `Updated ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
      lastUpdated.style.color = '#3fb950';
    }
    applyFilters();
    renderCustomSection();
  } catch (e) {
    lastUpdated.textContent = `Failed to load data: ${e.message}`;
    lastUpdated.style.color = '#f85149';
  }
})();

// ── Filters ──────────────────────────────────────────────────────
function applyFilters() {
  const pkmnQ  = document.getElementById('pkmnFilter').value.toLowerCase();
  const minS   = parseFloat(document.getElementById('minSpeed').value) || 0;
  const maxS   = parseFloat(document.getElementById('maxSpeed').value) || 9999;
  const baseF  = parseFloat(document.getElementById('baseFilter').value) || 0;
  const tier   = document.getElementById('tierFilter').value;
  const mult   = document.getElementById('multFilter').value;
  const abilQ  = document.getElementById('abilityFilter').value.toLowerCase();

  filtered = ALL_DATA.filter(r => {
    if (r.isCustom) return false;
    if (pkmnQ && !r.pokemon.toLowerCase().includes(pkmnQ)) return false;
    if (r.actual < minS || r.actual > maxS) return false;
    if (baseF && r.base !== baseF) return false;
    if (tier && r.tier !== tier) return false;
    if (mult === 'none' && r.mult !== '') return false;
    if (mult && mult !== 'none' && r.mult !== mult) return false;
    if (abilQ && !r.abilityText.includes(abilQ)) return false;
    return true;
  });

  doSort();
  render();
}

function resetFilters() {
  ['pkmnFilter','minSpeed','maxSpeed','baseFilter','abilityFilter'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('tierFilter').value = '';
  document.getElementById('multFilter').value = '';
  condition = null;
  document.getElementById('btnTailwind').className = 'btn-toggle';
  document.getElementById('btnPara').className     = 'btn-toggle';
  compareA = null; compareB = null;
  closeCmp();
  applyFilters();
}

// ── Sort ─────────────────────────────────────────────────────────
function sortBy(col) {
  if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  else { sortCol = col; sortDir = col === 'actual' ? 'desc' : 'asc'; }
  doSort();
  render();
}

function doSort() {
  const d = sortDir === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    if (sortCol === 'actual')  return (a.actual - b.actual) * d;
    if (sortCol === 'base')    return (a.base   - b.base)   * d;
    if (sortCol === 'pokemon') return a.pokemon.localeCompare(b.pokemon) * d;
    if (sortCol === 'mult') {
      const v = m => m === '×2' ? 2 : m === '×1.5' ? 1.5 : 1;
      return (v(a.mult) - v(b.mult)) * d;
    }
    return 0;
  });
  ['actual','base','pokemon','mult'].forEach(c => {
    const el = document.getElementById('th-' + c);
    if (el) el.className = c === sortCol ? ('sort-' + sortDir) : '';
  });
}

// ── Render ───────────────────────────────────────────────────────
function tierBadge(t) {
  if (t === 'max')    return '<span class="badge tier-max">Max Speed</span>';
  if (t === 'neutral') return '<span class="badge tier-near">Neutral</span>';
  if (t === 'minus')  return '<span class="badge tier-tr">Trick Room</span>';
  if (t === 'custom') return '<span class="badge tier-custom">Custom</span>';
  return '<span class="badge tier-none">No EVs</span>';
}

function multBadge(m) {
  if (m === '×2')   return '<span class="badge mult-x2">×2</span>';
  if (m === '×1.5') return '<span class="badge mult-x15">×1.5</span>';
  if (m === '×3')   return '<span class="badge mult-x3">×3</span>';
  return '<span class="badge mult-none">×1</span>';
}

function buildRow(r, onClickAttr) {
  const q = spriteQueue(r.pokemon);
  const firstSrc = q.shift();
  const hasMeta = !r.isCustom && !!PIKALYTICS[r.pokemon];
  const spriteCls = hasMeta ? 'pkmn-sprite has-meta' : 'pkmn-sprite';
  const spriteClick = r.pokemon ? `onclick="openMetaModal('${esc(r.pokemon)}',event)"` : '';
  const sprite = r.pokemon
    ? `<img class="${spriteCls}" src="${esc(firstSrc)}" alt="${esc(r.pokemon)}"
            data-queue='${esc(JSON.stringify(q))}'
            onerror="this._spriteQ=JSON.parse(this.dataset.queue||'[]');nextSprite(this)"
            loading="lazy" ${spriteClick}>`
    : `<div class="pkmn-sprite-placeholder"></div>`;
  const setLabel = r.isCustom && r.label ? `<div class="pkmn-set-label">${esc(r.label)}</div>` : '';
  const pkmn = r.pokemon
    ? `<div class="pkmn-name">${esc(r.pokemon)}</div>
       <div class="pkmn-dex">#${esc(r.dex_id)}</div>${setLabel}`
    : `<div class="pkmn-name" style="color:var(--muted)">—</div>`;
  const displaySpeed = applyCondition(r.actual);
  const speedCls = condition === 'tailwind' ? ' speed-modified' : condition === 'para' ? ' speed-modified para' : '';
  const selCls = compareA === r ? ' cmp-sel-a' : compareB === r ? ' cmp-sel-b' : '';
  const deleteBtn = r.isCustom
    ? `<button class="btn-delete-custom" onclick="deleteCustomSet('${r.customId}',event)" title="Delete custom set">×</button>`
    : '';
  return `<tr class="${selCls}" ${onClickAttr}>
    <td><div class="pkmn-cell">${sprite}<div>${pkmn}</div>${deleteBtn}</div></td>
    <td><span class="speed-val${speedCls}">${displaySpeed}</span></td>
    <td><span class="base-stat">${r.base}</span></td>
    <td>${tierBadge(r.tier)}</td>
    <td>${multBadge(r.mult)}</td>
    <td><div class="ability-list">${abilityChips(r.abilities)}</div></td>
  </tr>`;
}

function render() {
  document.getElementById('infoBar').innerHTML =
    `Showing <strong>${filtered.length}</strong> of <strong>${ALL_DATA.length}</strong> entries`;

  const tbody = document.getElementById('tableBody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty">
      <div class="empty-icon">🔍</div>No results — try adjusting filters.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((r, idx) =>
    buildRow(r, `onclick="selectForCompare(${idx})"`)
  ).join('');
}

// ── Wire filters ─────────────────────────────────────────────────
['pkmnFilter','minSpeed','maxSpeed','baseFilter','tierFilter','multFilter','abilityFilter']
  .forEach(id => document.getElementById(id).addEventListener('input', applyFilters));

// ── Compare logic ────────────────────────────────────────────────
function selectForCompare(idx) {
  const entry = filtered[idx];
  if (!entry) return;

  if (compareA === entry) { compareA = null; render(); renderCustomSection(); return; }
  if (compareB === entry) { compareB = null; render(); renderCustomSection(); return; }

  if (!compareA) compareA = entry;
  else compareB = entry;

  render();
  renderCustomSection();
  if (compareA && compareB) openCmp();
}

function calcFinalSpeed(actual, cond) {
  if (cond === 'tailwind') return actual * 2;
  if (cond === 'para')     return Math.floor(actual / 2);
  return actual;
}

function cmpToggle(side, cond) {
  if (side === 'A') cmpCondA = cmpCondA === cond ? null : cond;
  else              cmpCondB = cmpCondB === cond ? null : cond;
  renderCmpCols();
}

function renderCmpCol(r, side) {
  const cond     = side === 'A' ? cmpCondA : cmpCondB;
  const finalSpd = calcFinalSpeedWeather(r, cond, cmpWeather);
  const other    = side === 'A' ? compareB : compareA;
  const otherSpd = other ? calcFinalSpeedWeather(other, side === 'A' ? cmpCondB : cmpCondA, cmpWeather) : 0;
  const outcome  = finalSpd > otherSpd ? 'winner' : finalSpd < otherSpd ? 'loser' : 'draw';
  const outcomeLabel = outcome === 'winner' ? 'FASTER' : outcome === 'loser' ? 'SLOWER' : 'TIE';

  const abilityWeather = getWeatherAbility(r);
  let weatherBadge = '';
  if (abilityWeather && cmpWeather === abilityWeather) {
    weatherBadge = `<span class="cmp-boost-badge boost-active">⚡ ${cmpWeather.toUpperCase()} boost active</span>`;
  }

  const q = spriteQueue(r.pokemon);
  const src = q.shift();
  const sprite = `<img class="cmp-sprite" src="${esc(src)}"
    data-queue='${esc(JSON.stringify(q))}'
    onerror="this._spriteQ=JSON.parse(this.dataset.queue||'[]');nextSprite(this)"
    alt="${esc(r.pokemon)}">`;

  const tierLabel = r.isCustom
    ? `Custom (${r.statPoints}pts, ${r.nature})`
    : r.tier === 'max' ? 'Max Speed' : r.tier === 'neutral' ? 'Neutral' : r.tier === 'minus' ? 'Trick Room' : 'No EVs';
  const multLabel = r.mult === '×2' ? '×2' : r.mult === '×1.5' ? '×1.5' : r.mult === '×3' ? '×3' : '×1';
  const tw = cond === 'tailwind';
  const pa = cond === 'para';

  const currentIdx = ALL_DATA.indexOf(r);
  const variants = ALL_DATA.map((e, i) => ({ e, i })).filter(({ e }) => e.dex_id === r.dex_id);
  const variantSelect = variants.length > 1 ? `
    <select class="cmp-variant-select" onchange="changeCmpEntry('${side}', this.value)">
      ${variants.map(({ e, i }) => {
        const tl = e.isCustom ? (e.label || 'Custom') : e.tier === 'max' ? 'Max' : e.tier === 'neutral' ? 'Neutral' : e.tier === 'minus' ? 'TR Min' : 'No EVs';
        const ml = e.mult ? ' ' + e.mult : '';
        const al = e.abilities.join('+');
        const label = `${tl}${ml} → ${e.actual}${al ? ' · ' + al : ''}`;
        return `<option value="${i}" ${i === currentIdx ? 'selected' : ''}>${esc(label)}</option>`;
      }).join('')}
    </select>` : '';

  return `
    <div class="cmp-pkmn">
      ${sprite}
      <div class="cmp-pkmn-info">
        <div class="cmp-pkmn-name">${esc(r.pokemon)}</div>
        <div class="cmp-pkmn-dex">#${esc(r.dex_id)}${r.label ? ` · <span style="color:#4dd0e1;font-style:italic">${esc(r.label)}</span>` : ''}</div>
      </div>
    </div>
    ${variantSelect}
    ${weatherBadge}
    <div class="cmp-stats">
      <div class="cmp-row"><span class="cmp-label">Base Speed</span><span class="cmp-val">${r.base}</span></div>
      <div class="cmp-row"><span class="cmp-label">Investment</span><span class="cmp-val">${tierLabel}</span></div>
      <div class="cmp-row"><span class="cmp-label">Modifier</span><span class="cmp-val">${multLabel}</span></div>
      <div class="cmp-row"><span class="cmp-label">Actual Speed</span><span class="cmp-val">${r.actual}</span></div>
      <div class="cmp-row"><span class="cmp-label">Ability / Item</span><span class="cmp-val" style="font-size:.75rem">${abilityChips(r.abilities) || '—'}</span></div>
    </div>
    <hr class="cmp-divider">
    <div class="cmp-toggles">
      <button class="btn-toggle ${tw ? 'active-tailwind' : ''}" onclick="cmpToggle('${side}','tailwind')">Tailwind ×2</button>
      <button class="btn-toggle ${pa ? 'active-para'     : ''}" onclick="cmpToggle('${side}','para')">Paralysis ÷2</button>
    </div>
    <hr class="cmp-divider">
    <div class="cmp-final">
      <span class="cmp-final-speed ${outcome}">${finalSpd}</span>
      <span class="cmp-outcome ${outcome}">${outcomeLabel}</span>
    </div>`;
}

function renderCmpCols() {
  if (!compareA || !compareB) return;

  const finalA = calcFinalSpeedWeather(compareA, cmpCondA, cmpWeather);
  const finalB = calcFinalSpeedWeather(compareB, cmpCondB, cmpWeather);
  const colA = document.getElementById('cmpColA');
  const colB = document.getElementById('cmpColB');

  colA.innerHTML = renderCmpCol(compareA, 'A');
  colB.innerHTML = renderCmpCol(compareB, 'B');

  colA.className = 'cmp-col ' + (finalA > finalB ? 'winner' : finalA < finalB ? 'loser' : 'draw');
  colB.className = 'cmp-col ' + (finalB > finalA ? 'winner' : finalB < finalA ? 'loser' : 'draw');
}

function openCmp() {
  cmpCondA = null; cmpCondB = null; cmpWeather = null;
  ['None','Sun','Rain','Sand','Snow'].forEach(n => document.getElementById('w'+n)?.classList.remove('active-weather'));
  document.getElementById('wNone')?.classList.add('active-weather');
  renderCmpCols();
  document.getElementById('cmpOverlay').classList.add('open');
}

function changeCmpEntry(side, allDataIdx) {
  const entry = ALL_DATA[+allDataIdx];
  if (!entry) return;
  if (side === 'A') compareA = entry;
  else              compareB = entry;
  render();
  renderCmpCols();
}

function closeCmp() {
  document.getElementById('cmpOverlay').classList.remove('open');
}

function closeCmpOverlay(e) {
  if (e.target === document.getElementById('cmpOverlay')) closeCmp();
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCmp(); closeCustomModal(); closeMetaModal(); } });

// ── Meta modal (Pikalytics data) ─────────────────────────────────
function openMetaModal(name, event) {
  event.stopPropagation();
  const data = PIKALYTICS[name];
  const q = spriteQueue(name);
  const src = q.shift();
  document.getElementById('metaSprite').src = src;
  document.getElementById('metaSprite').dataset.queue = JSON.stringify(q);
  document.getElementById('metaName').textContent = name;

  const usageEl = document.getElementById('metaUsage');
  if (data) {
    usageEl.textContent = `${data.usage}% usage`;
    usageEl.style.display = '';
  } else {
    usageEl.style.display = 'none';
  }

  document.getElementById('metaBody').innerHTML = data
    ? buildMetaBody(data)
    : '<p class="meta-no-data">No tournament data available for this Pokémon (usage &lt;2%).</p>';

  document.getElementById('metaOverlay').classList.add('open');
}

function buildMetaBody(data) {
  let sectionIdx = 0;
  function section(title, entries) {
    if (!entries || !entries.length) return '';
    const id = `metaSec${sectionIdx++}`;
    const rows = entries.map(e =>
      `<div class="meta-row"><span>${esc(e.name)}</span><span class="meta-pct">${e.pct.toFixed(1)}%</span></div>`
    ).join('');
    return `<div class="meta-section">
      <div class="meta-section-title" onclick="toggleMetaSection('${id}')">
        <span>${title}</span><span class="meta-section-chevron" id="${id}chv">▾</span>
      </div>
      <div class="meta-section-body" id="${id}">${rows}</div>
    </div>`;
  }
  return section('Moves', data.moves) +
         section('Items', data.items) +
         section('Abilities', data.abilities);
}

function toggleMetaSection(id) {
  const body = document.getElementById(id);
  const chv  = document.getElementById(id + 'chv');
  if (!body) return;
  const collapsed = body.classList.toggle('collapsed');
  chv.classList.toggle('collapsed', collapsed);
}

function closeMetaModal() {
  document.getElementById('metaOverlay').classList.remove('open');
}

function closeMetaOverlay(event) {
  if (event.target === document.getElementById('metaOverlay')) closeMetaModal();
}

// ── Custom sets ──────────────────────────────────────────────────
const CUSTOM_KEY = 'champions_custom_sets';
function loadCustomSets() { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || '[]'); }
function saveCustomSets(sets) { localStorage.setItem(CUSTOM_KEY, JSON.stringify(sets)); }

function calcChampionsSpeed(base, statPoints, nature) {
  const mult = nature === 'plus' ? 1.1 : nature === 'minus' ? 0.9 : 1.0;
  return Math.floor(Math.floor((2 * base + 31) * 50 / 100 + 5) * mult) + Number(statPoints);
}

const ABILITY_MULTS = {
  'Swift Swim': '×2', 'Chlorophyll': '×2', 'Sand Rush': '×2', 'Slush Rush': '×2',
  'Unburden': '×2', 'Speed Boost': '×2', 'Weak Armor': '×2', 'Surge Surfer': '×2',
  'Electric Engine': '×2', 'Quick Feet': '×1.5',
};
// These abilities can stack with Choice Scarf (external condition, not item-based)
const SCARF_COMPATIBLE = new Set(['Swift Swim', 'Chlorophyll', 'Sand Rush', 'Slush Rush', 'Surge Surfer', 'Electric Engine']);

function buildCustomEntry(s) {
  let actual = calcChampionsSpeed(s.base, s.statPoints, s.nature);
  let mult = '';
  let abilities = [];
  if (s.speedAbility && s.useScarf && SCARF_COMPATIBLE.has(s.speedAbility)) {
    mult = '×3';
    abilities = [s.speedAbility, 'Choice Scarf'];
    actual = Math.floor(actual * 2 * 1.5);
  } else if (s.speedAbility) {
    const m = ABILITY_MULTS[s.speedAbility] || '×2';
    mult = m;
    abilities = [s.speedAbility];
    actual = m === '×2' ? actual * 2 : Math.floor(actual * 1.5);
  } else if (s.useScarf) {
    mult = '×1.5';
    abilities = ['Choice Scarf'];
    actual = Math.floor(actual * 1.5);
  }
  return {
    actual, base: s.base, tier: 'custom', mult,
    pokemon: s.pokemon, dex_id: s.dex_id,
    abilities,
    abilityText: abilities.map(a => a.toLowerCase()).join(' '),
    isCustom: true, customId: s.id,
    statPoints: s.statPoints, nature: s.nature, label: s.label || '',
  };
}

function injectCustomSets() {
  loadCustomSets().forEach(s => ALL_DATA.push(buildCustomEntry(s)));
}

// ── Custom sets section ──────────────────────────────────────────
const CUSTOM_SECTION_KEY = 'champions_custom_section_open';
let customSortCol = 'actual', customSortDir = 'desc';

function sortCustomBy(col) {
  if (customSortCol === col) customSortDir = customSortDir === 'asc' ? 'desc' : 'asc';
  else { customSortCol = col; customSortDir = col === 'actual' ? 'desc' : 'asc'; }
  renderCustomSection();
}

function renderCustomSection() {
  const customs = ALL_DATA.filter(r => r.isCustom);
  const section = document.getElementById('customSection');
  section.style.display = customs.length ? '' : 'none';
  if (!customs.length) return;
  document.getElementById('customCount').textContent = customs.length;

  // Sort
  const d = customSortDir === 'asc' ? 1 : -1;
  customs.sort((a, b) => {
    if (customSortCol === 'actual')  return (a.actual - b.actual) * d;
    if (customSortCol === 'base')    return (a.base   - b.base)   * d;
    if (customSortCol === 'pokemon') return a.pokemon.localeCompare(b.pokemon) * d;
    return 0;
  });

  // Sort header indicators
  ['pokemon','actual','base'].forEach(c => {
    const el = document.getElementById('cth-' + c);
    if (el) el.className = c === customSortCol ? ('sort-' + customSortDir) : '';
  });

  // Restore collapsed state (open by default)
  const isOpen = localStorage.getItem(CUSTOM_SECTION_KEY) !== '0';
  document.getElementById('customSectionBody').classList.toggle('collapsed', !isOpen);
  document.getElementById('customChevron').classList.toggle('collapsed', !isOpen);
  document.getElementById('customTableBody').innerHTML =
    customs.map(r => buildRow(r, `onclick="selectForCompareFromCustom('${r.customId}')"`)).join('');
}

function toggleCustomSection() {
  const body    = document.getElementById('customSectionBody');
  const chevron = document.getElementById('customChevron');
  const isOpen  = !body.classList.contains('collapsed');
  body.classList.toggle('collapsed', isOpen);
  chevron.classList.toggle('collapsed', isOpen);
  localStorage.setItem(CUSTOM_SECTION_KEY, isOpen ? '0' : '1');
}

function selectForCompareFromCustom(customId) {
  const entry = ALL_DATA.find(r => r.customId === customId);
  if (!entry) return;
  if (compareA === entry) { compareA = null; render(); renderCustomSection(); return; }
  if (compareB === entry) { compareB = null; render(); renderCustomSection(); return; }
  if (!compareA) compareA = entry;
  else           compareB = entry;
  render();
  renderCustomSection();
  if (compareA && compareB) openCmp();
}

// ── Custom modal state ───────────────────────────────────────────
let cmBase = 0, cmDexId = '';

function openCustomModal() {
  const names = [...new Set(ALL_DATA.filter(r => !r.isCustom).map(r => r.pokemon))].sort();
  document.getElementById('cmPkmnList').innerHTML = names.map(n => `<option value="${esc(n)}">`).join('');
  document.getElementById('cmPkmn').value = '';
  document.getElementById('cmLabel').value = '';
  document.getElementById('cmSlider').value = 0;
  document.getElementById('cmSPNum').value = 0;
  document.querySelector('input[name="cmNature"][value="neutral"]').checked = true;
  document.getElementById('cmScarf').checked = false;
  document.getElementById('cmScarf').disabled = false;
  document.getElementById('cmAbilityField').style.display = 'none';
  document.getElementById('cmAbilityList').innerHTML = '';
  document.getElementById('cmPreviewSpeed').textContent = '—';
  cmBase = 0; cmDexId = '';
  document.getElementById('customOverlay').classList.add('open');
}

function closeCustomModal() {
  document.getElementById('customOverlay').classList.remove('open');
}

function closeCustomOverlay(e) {
  if (e.target === document.getElementById('customOverlay')) closeCustomModal();
}

function cmOnPkmnChange() {
  const name = document.getElementById('cmPkmn').value.trim();
  const entry = ALL_DATA.find(r => !r.isCustom && r.pokemon === name);
  if (!entry) { cmBase = 0; cmDexId = ''; document.getElementById('cmPreviewSpeed').textContent = '—'; return; }
  cmBase = entry.base;
  cmDexId = entry.dex_id;

  const speedAbilities = [...new Set(
    ALL_DATA.filter(r => !r.isCustom && r.pokemon === name && r.abilities.length > 0 && !r.abilities.includes('Choice Scarf'))
            .flatMap(r => r.abilities)
  )];

  const abilityList = document.getElementById('cmAbilityList');
  abilityList.innerHTML =
    `<label class="ability-opt"><input type="radio" name="cmAbility" value="" checked onchange="cmUpdatePreview()"> None</label>` +
    speedAbilities.map(a => {
      const m = ABILITY_MULTS[a] ? ` ${ABILITY_MULTS[a]}` : '';
      return `<label class="ability-opt"><input type="radio" name="cmAbility" value="${esc(a)}" onchange="cmUpdatePreview()"> ${esc(a)}${m}</label>`;
    }).join('');

  document.getElementById('cmAbilityField').style.display = speedAbilities.length > 0 ? '' : 'none';
  cmUpdatePreview();
}

function cmOnSPChange(val) {
  const v = Math.max(0, Math.min(32, parseInt(val) || 0));
  document.getElementById('cmSlider').value = v;
  document.getElementById('cmSPNum').value = v;
  cmUpdatePreview();
}

function cmUpdatePreview() {
  if (!cmBase) return;
  const sp     = parseInt(document.getElementById('cmSPNum').value) || 0;
  const nature = document.querySelector('input[name="cmNature"]:checked')?.value || 'neutral';
  const ability = document.querySelector('input[name="cmAbility"]:checked')?.value || '';
  const scarf   = document.getElementById('cmScarf').checked;

  document.getElementById('cmScarf').disabled = !!ability && !SCARF_COMPATIBLE.has(ability);

  let speed = calcChampionsSpeed(cmBase, sp, nature);
  if (ability && scarf && SCARF_COMPATIBLE.has(ability)) {
    speed = Math.floor(speed * 2 * 1.5);
  } else if (ability) {
    speed = ABILITY_MULTS[ability] === '×1.5' ? Math.floor(speed * 1.5) : speed * 2;
  } else if (scarf) {
    speed = Math.floor(speed * 1.5);
  }
  document.getElementById('cmPreviewSpeed').textContent = speed;
}

function saveCustomSet() {
  const name = document.getElementById('cmPkmn').value.trim();
  if (!name || !cmBase) { alert('Please select a valid Pokémon.'); return; }
  const sp           = Math.max(0, Math.min(32, parseInt(document.getElementById('cmSPNum').value) || 0));
  const nature       = document.querySelector('input[name="cmNature"]:checked')?.value || 'neutral';
  const speedAbility = document.querySelector('input[name="cmAbility"]:checked')?.value || '';
  // useScarf: checked and not disabled (disabled when non-compatible ability selected)
  const useScarf     = document.getElementById('cmScarf').checked && !document.getElementById('cmScarf').disabled;
  const label        = document.getElementById('cmLabel').value.trim();
  const set = { id: String(Date.now()), pokemon: name, dex_id: cmDexId, base: cmBase, statPoints: sp, nature, speedAbility, useScarf, label };
  const sets = loadCustomSets();
  sets.push(set);
  saveCustomSets(sets);
  ALL_DATA.push(buildCustomEntry(set));
  applyFilters();
  renderCustomSection();
  closeCustomModal();
}

function deleteCustomSet(customId, event) {
  event.stopPropagation();
  saveCustomSets(loadCustomSets().filter(s => s.id !== customId));
  ALL_DATA = ALL_DATA.filter(r => r.customId !== customId);
  applyFilters();
  renderCustomSection();
}
