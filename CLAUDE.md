# VGC Speed Reference — Project Notes for Claude

## Sistema de stats: SP (Stat Points) — NO EVs tradicionales

Este proyecto es una herramienta para el formato **Pokémon Champions** (el juego oficial de Switch),
que usa un sistema de inversión en stats completamente diferente al VGC convencional:

| Sistema | Total | Máx por stat | Juego |
|---------|-------|--------------|-------|
| **SP (Stat Points)** | 66 | 32 | Pokémon Champions (Switch) ← **ESTE PROYECTO** |
| EVs tradicionales | 510 | 252 | VGC / Scarlet-Violet |

**Reglas:**
- Cuando el usuario hable de "EVs", "inversión", "reparto de stats" o "spreads", se refiere **siempre** al sistema SP de Pokémon Champions: 0–32 por stat, 66 en total.
- No asumir nunca el sistema de 252/510 EVs.
- El slider en la UI de "Add Custom Set" ya refleja esto: rango 0–32.
- Cuando se busquen o muestren datos de naturalezas y spreads, el formato correcto es SP, no EVs.

## Fuentes de datos

| Dato | Fuente | Método |
|------|--------|--------|
| Uso % en ladder | Pikalytics `/ai/pokedex/championstournaments` | Scraper diario (GitHub Action) |
| Uso % en torneos + win rate | Limitless TCG (`data-format="1"`, Reg M-A) | Scraper diario (GitHub Action) |
| Moves / Items / Abilities | Pikalytics páginas individuales | Scraper diario (GitHub Action) |
| SP spreads / Naturalezas | **Pendiente** — Smogon publicará `gen9vgc2026regm-1760.json` cuando haya suficientes datos | `/check-new-data` lo monitoriza |

## Arquitectura de datos

- `data.json` — velocidades base y cálculos de speed tiers (generado por `generator/generate.js`)
- `pikalytics.json` — uso en ladder + moves/items/abilities (81 Pokémon)
- `limitless.json` — uso en torneos Champions + win rate acumulado (incrementa diariamente)

## Contexto del formato

- Formato: **Pokémon Champions** — Reg M-A (Regulation M, Series A)
- El juego tiene Mega Evoluciones disponibles
- Los torneos en Limitless filtrados por `data-format="1"` + verificación "M-A" en descripción
- Pikalytics usa el nombre de formato `championstournaments`

## Modificadores de campo — global vs. per-side

La sección Field de `calc.html` está dividida en dos bloques:

| Bloque | Qué incluye | Cómo afecta al cálculo |
|--------|-------------|------------------------|
| **Globales** | Format, Weather, Terrain, Gravity, Magic Room, Wonder Room, Critical hit | Aplican a ambos lados a la vez — un solo control. |
| **Per-side** (Screens / Hazards / Support) | Reflect, Light Screen, Aurora Veil, Friend Guard, Helping Hand, Battery, Stealth Rock, Spikes | Cada modificador tiene **dos botones `.side-tag` (ATK / DEF)** que se activan independientemente. |

**Reglas para añadir per-side modifiers nuevos:**
- HTML: dos `<button class="side-tag side-tag-atk">ATK</button>` + `side-tag-def">DEF</button>` con IDs `atk<Mod>Btn` / `def<Mod>Btn`. Para selectores numéricos (Spikes 0–3) usar dos `.hazard-select` con IDs `fldAtkX` / `fldDefX`.
- `readState`: leer ambos lados (`atkX`, `defX`) usando el helper `sideOn(btnId)`.
- Cálculo: usar SOLO el lado que aplica para la dirección atk→def — `defReflect/LightScreen/AuroraVeil/FriendGuard/StealthRock/Spikes` reducen daño/chip al defensor; `atkHelpingHand/Battery` boostean al atacante. El otro lado se guarda para que swap y el panel D→A funcionen.
- `buildReversedState`: TRANSPONER atk↔def para todos los per-side modifiers (necesario para que el segundo panel D→A aplique las screens del que ahora ataca).
- `swapPanels`: usar `swapTags(atkBtn, defBtn)` para los toggles y `swapVals` para los selects de Spikes.
- `restoreFormState`: aceptar la clave legacy sin prefijo (`saved.reflect ?? saved.defReflect`) para mantener compatibilidad con localStorage de antes del split.

## Convenciones de UI — selectores en `calc.html`

Los `<select>` nativos NO se usan visiblemente en la calculadora porque su popup es controlado por el navegador (Chrome puede abrirlos hacia arriba si no hay sitio debajo, y el `<datalist>` no refiltra al abrirse con clic). Hay dos helpers en `calc.js` que reemplazan a los nativos por dropdowns custom — **úsalos siempre que añadas un selector nuevo**:

| Caso | Helper | HTML que espera |
|------|--------|-----------------|
| Lista cerrada de opciones (Nature, Set, Item, Ability…) | `setupChoice(selectEl)` | `<select id="..." onchange="...">…</select>` (queda oculto, se inyecta `.choice-btn` + `.choice-list`) |
| Autocompletar contra una lista grande (Pokémon, Move) | `setupCombo(inputId, getOptions)` | `<div class="combo-wrap"><input id="..." class="pkmn-input" autocomplete="off"></div>` |

**Reglas:**
- Cualquier dropdown nuevo debe abrirse **hacia abajo** y compartir el look de `.choice-btn` (con chevron SVG ▾ a la derecha). No introducir `<select>` visible ni `<datalist>` nativo.
- `setupChoice` mantiene el `<select>` oculto como fuente de verdad (intercepta el setter de `.value` para sincronizar el botón) — así `el.value`, `change`, `swapVals`, `setVal`, etc. siguen funcionando sin tocar nada.
- Si el caller reconstruye `innerHTML` del select (como `refreshSetSelectors`), debe llamar `el._syncChoice?.()` después para refrescar el label.
- `setupChoice` hereda `title` y `oncontextmenu` del select original — útil para patrones tipo "right-click para borrar".
