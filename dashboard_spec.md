# Power BI Dashboard — Implementation Spec

Build order matches the wireframe in your slides. Each page assumes the four
CSVs are imported and the relationships in `out/README.txt` are set up.

## Global model setup (do this first)

1. Mark `inform_latest[iso3]` and `joined_summary[iso3]` as **Country** data
   category (Modeling tab → Data Category → Country).
2. Build relationships in Model view:
   - `inform_latest[iso3]` → `emdat_events[iso3]` (1:many)
   - `inform_latest[iso3]` → `inform_trend[iso3]` (1:many)
3. Add a small "Region" lookup table if your INFORM file doesn't ship one
   (paste 200 rows of ISO3→region from the World Bank).
4. Create the DAX measures from `out/README.txt`.

## Page 1 — Global Overview

**Goal:** lets a user spot the highest-risk countries on a map and rank them.

| Visual          | Field                                              | Notes                                                                   |
| --------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| Filled Map      | Location = iso3, Color = `inform_risk`             | Color scale: low = #EAF3DE (light green), high = #E24B4A (red).         |
| Bar chart       | Y = `country`, X = `inform_risk`                   | Sort desc, show top 10. Constrains visual to one screen.                |
| Slicer          | `hazard_type` from emdat_events                    | Dropdown style.                                                         |
| Slicer          | `region`                                           | Tile style.                                                             |
| Slicer (date)   | `year` from inform_trend                           | Single-value, default = max.                                            |
| KPI cards (×3)  | Avg risk, # countries ≥ 7.0, # countries ≤ 3.0     | Use SUMMARIZE / COUNTROWS measures.                                     |

**Cross-filter direction:** map → bar chart → KPI cards. Slicers filter all.

## Page 2 — Country Profile

**Goal:** decompose the selected country's score and trend.

| Visual           | Field                                                        | Notes                                                       |
| ---------------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| Slicer           | `country` (single-select, drop-down)                          | Top of page.                                                |
| Card             | `inform_risk` (latest year)                                  | Big number, 36pt.                                           |
| Bar chart        | Three measures: H&E, Vulnerability, Coping                    | Horizontal, all in one chart via unpivoted helper table.    |
| Bar chart        | Four hazard-specific risks (flood, eq, cyclone, drought)      | Same pattern.                                               |
| Line chart       | Year on X, `inform_risk` on Y, country = colour               | From `inform_trend`. Add a comparison country (slicer).     |
| Donut            | Avg risk in same region for the selected year                 | "How does this country compare to its region?"              |

## Page 3 — Event History (EM-DAT)

**Goal:** the empirical side — what's actually happened.

| Visual              | Field                                                | Notes                                                |
| ------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Stacked area chart  | X = `year`, Y = COUNTROWS, Legend = `hazard_type`    | 1995–2025.                                           |
| Line chart          | X = `year`, Y = `[Total Deaths]`                     | Log scale on Y if available; otherwise linear.       |
| Stacked column      | X = `year`, Y = `[Total Affected]`, Legend = hazard  | Smaller, side-by-side with the deaths chart.         |
| Treemap             | Group = `hazard_type`, Value = `[Event Count]`       | Shows mix at a glance.                               |
| Table               | Top 20 events by deaths in the filtered window       | Use TOPN measure.                                    |

## Page 4 — Risk vs. Reality (the payoff)

**Goal:** the analytical insight that justifies pairing the two datasets.

| Visual             | Field                                                                          | Notes                                                                 |
| ------------------ | ------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Scatter chart      | X = `inform_risk_2026`, Y = `total_deaths_1995_2025` (log), Detail = `country`, Legend = `region`, Size = `total_affected` | This is the headline visual.                                          |
| Q&A visual         | "Which countries have higher INFORM risk than expected from their losses?"     | Use Power BI's Q&A — great for the demo, shows interactivity.         |
| Card               | Pearson correlation between `inform_risk` and `log(deaths+1)`                  | Use a calculated measure with CORREL-style logic.                     |
| Table              | "Outliers" — countries whose residual from the regression line is largest      | Compute residual as a measure, then TOPN both directions.             |

**Talking point for the demo:** Haiti and Bangladesh typically sit *above* the
diagonal (more deaths than INFORM alone would suggest, driven by event
clustering); Norway and Austria sit far below (low risk, low realised losses,
as expected); Japan is an interesting case — high realised losses despite
relatively low INFORM, because INFORM weights coping capacity heavily and
Japan scores well there even though it sees lots of earthquakes.

## Polish checklist before submission

- [ ] All visuals have titles in sentence case (no UPPERCASE).
- [ ] Tooltips show country name + ISO3 + hazard type where relevant.
- [ ] Page navigation buttons in a sidebar.
- [ ] A "Methodology" text box on Page 1 explaining INFORM's 0–10 scale.
- [ ] Date stamp + data version on the bottom-right of each page.
- [ ] One Bookmark per page for the live demo (in case a slicer gets stuck).
