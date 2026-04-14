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
