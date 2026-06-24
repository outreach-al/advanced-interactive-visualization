# Risk Fingerprints

*Where the INFORM Risk Index misses.*

An interactive visualization (JKU Linz, Interactive Visualization — Assignment 3)
that puts a model's **prediction** and the world's **observed reality** on the
same screen. The [INFORM Risk Index](https://drmkc.jrc.ec.europa.eu/inform-index)
forecasts each country's disaster risk; [EM-DAT](https://www.emdat.be/) records
the deaths that actually happened (1995–2025). The gap between the two — the
**signed residual** — is the finding, and it is the principle the whole page is
sorted by.

> Built on the data from Assignment 2 (a Power BI dashboard). This is a custom,
> hand-built SVG/D3 visualization — no chart libraries.

## The three views

1. **Fingerprint grid** (centerpiece) — ~191 country glyphs, each a 7-petal
   radial mark, **sorted top-to-bottom by signed residual**. Countries where
   actual losses *exceed* the model's prediction sit at the top; those *below*
   sit at the bottom, split by an "expected" divider line.
   - *petal length* = that hazard's INFORM risk score (0–10)
   - *petal saturation* = log-scaled total deaths from that hazard (EM-DAT)
2. **Scatter** — INFORM risk (x) vs. log deaths (y), one dot per country,
   colored by **region**, sized by event count, with an explicit OLS line and
   labeled outliers.
3. **Event timeline** — when a country is selected, its individual EM-DAT
   disasters over time, colored by hazard type.

The views are linked by hover / click / brush selection:

- **Hover** a glyph or scatter dot → highlights the matching mark in the other
  view and shows a tooltip.
- **Click** a glyph or dot → loads that country into the timeline (persists).
- **Drag a box** on the scatter → filters the grid to the brushed countries.
- **Focus a hazard** (chips beside the scatter) → re-sorts both the grid and the
  scatter by that *single* hazard's model error (a per-hazard OLS residual, the
  same residual logic applied per hazard — directly serves task T1). Coastal
  flood and tsunami are disabled: EM-DAT here records no deaths for them.
- **Esc** (or the *Clear ✕* button) → resets selection, brush, and hazard focus.

The scatter also draws **residual sticks** — each dot's vertical distance to the
OLS line — so the quantity the grid is sorted by is shown explicitly, and the
two views visibly encode the same thing.

Everything after the initial JSON load is client-side, so linking is instant.

> A standalone design page at **`/glyph-test`** renders a single country's
> fingerprint at 60 / 90 / 120 / 200 px with the full encoding legend — handy
> for inspecting the glyph in isolation.

## Encoding, honestly

The seven petals sit in a **fixed angular order** so the same hazard appears at
the same angle on every glyph — that's what makes fingerprints comparable at a
glance. Petals: river flood · coastal flood · earthquake · tropical cyclone ·
drought · tsunami · epidemic.

EM-DAT's hazard categories don't line up one-to-one with INFORM's seven petals,
so the petal **saturation** (the deaths channel) is mapped as follows:

| INFORM petal       | EM-DAT `hazard_type` summed into it          |
| ------------------ | -------------------------------------------- |
| `flood_river`      | `Flood`, `Glacial lake outburst flood`       |
| `flood_coastal`    | — (no coastal-specific subtype in the data)  |
| `earthquake`       | `Earthquake`                                 |
| `tropical_cyclone` | `Storm`                                      |
| `drought`          | `Drought`                                    |
| `tsunami`          | — (no tsunami subtype in the data)           |
| `epidemic`         | `Epidemic`                                   |

**Caveats (also noted on the slides):**

- EM-DAT does not split river vs. coastal flood here, so **all** flood deaths go
  to `flood_river`; the `flood_coastal` and `tsunami` saturation channels stay
  at 0. Their *petal length* (INFORM risk) is still shown — only the deaths
  channel is empty.
- EM-DAT hazard types with no INFORM petal (extreme temperature, wildfire, mass
  movement, volcanic activity, …) are **excluded from petal saturation** but
  **kept in the timeline**, bucketed as "Other."

## Data pipeline

Two source CSVs (carried over from A2, in `data/`) are preprocessed at build time
by [`scripts/build-data.mjs`](scripts/build-data.mjs) into two JSON files the
client fetches:

```
data/joined_summary.csv   ┐                       ┌─ public/data/countries.json
                          ├─► build-data.mjs ────►┤
data/emdat_events.csv     ┘                       └─ public/data/events.json
```

- **`countries.json`** — one object per country: INFORM scores, per-hazard
  deaths (joined from events), totals, and the OLS-derived
  `residual = log10(total_deaths+1) − predicted`. Pre-sorted by residual.
- **`events.json`** — events grouped by `iso3` for fast timeline lookup.

The script is **dependency-free** and runs automatically via npm's `prebuild`
and `predev` hooks (and `npm run data` on its own). It's idempotent; re-run it
whenever the CSVs change.

```bash
npm run data   # regenerate public/data/*.json from data/*.csv
```

## Running it

### Local dev (Docker, hot-reload) — recommended

```bash
docker compose up
```

→ http://localhost:3000. Source is bind-mounted, so edits reload live.

### Production image (Next.js standalone)

```bash
docker compose -f docker-compose.prod.yml up --build
```

→ http://localhost:3000, served from a minimal multi-stage runtime image.

### Without Docker

```bash
npm install
npm run dev      # predev regenerates the data, then starts Next on :3000
# or
npm run build && npm start
```

## Stack

Next.js 14 (App Router) · TypeScript · D3 v7 · Tailwind (layout/type only — all
visualization is hand-built SVG/D3). `next.config.js` uses `output: 'standalone'`
for a lean production container.

## Data sources

- **INFORM Risk Index 2026** — JRC, CC-BY-4.0.
- **EM-DAT** — Centre for Research on the Epidemiology of Disasters (CRED),
  UCLouvain; natural disasters 1995–2025, academic use.
