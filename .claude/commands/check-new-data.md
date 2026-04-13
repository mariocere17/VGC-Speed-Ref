# Check for new meta data

Runs the data-freshness check script and reports what's new in Pikalytics,
Limitless and Showdown that isn't yet in our local JSON files.

## Steps

1. Run the check script:
   ```
   node generator/check-new-data.js
   ```

2. Read the output carefully and report to the user:
   - **Pikalytics**: new Pokémon that entered the top-50 ladder index
   - **Limitless**: new Champions-format tournaments from the last 7 days
   - **Showdown**: whether Smogon has published new monthly VGC stats

3. If new data is found, ask the user whether they want to run the relevant
   scraper(s) now:
   - `node generator/scrape-pikalytics.js` — updates pikalytics.json
   - `node generator/scrape-limitless.js` — updates limitless.json (pass a date
     arg like `2026-04-13` to backfill a specific day)

4. If the user confirms, run the scraper(s), then commit and push the updated
   JSON files with a descriptive message.

Do NOT run scrapers automatically — always confirm with the user first.
