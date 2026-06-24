# Data Download Cheat Sheet

This is the manual step. Takes ~10 minutes total.

## 1. INFORM Risk Index (CC-BY-4.0, no signup)

**Source:** https://drmkc.jrc.ec.europa.eu/inform-index/INFORM-Risk/Results-and-data

What to download:

- **Latest INFORM Risk Excel** (the most recent yearly or mid-year update).
  Filename will look like `INFORM_Risk_2026_v0XX.xlsx` (~2 MB).
- **INFORM TREND Excel** (optional but recommended for Page 2).
  Filename like `INFORM_TREND_2015_2026_vXX.xlsx` (~16 MB). Contains the
  full historical series per indicator.

Save them as:

```
raw/INFORM_Risk_2026.xlsx
raw/INFORM_TREND_2015_2026.xlsx
```

If the JRC site is slow, the same files mirror to HDX:
https://data.humdata.org/dataset/inform-risk-index-2021

## 2. EM-DAT (free for academic use, signup required)

**Source:** https://www.emdat.be/

1. Click "Register" (top right) — use your JKU email (`k12337455@students.jku.at`)
   to be unambiguously academic.
2. Confirm via email link.
3. Log in → "Database" → "Custom request":
   - Disaster Classification: **Natural** (uncheck Technological)
   - From year: **1995**, To year: **2025**
   - All countries, all subgroups
4. Click "Download data" → choose Excel.

Save as:

```
raw/emdat_public.xlsx
```

> If registration is a hassle, the Our World in Data mirror has free CSV
> downloads of EM-DAT aggregates (no signup):
> https://ourworldindata.org/natural-disasters — but you lose the event-level
> detail, so the Page 3 stacked area becomes less rich. Prefer the real
> EM-DAT if you can.

## 3. (Optional) World map for Power BI

Power BI's built-in Map visual works out of the box once you mark `iso3` as
data category "Country" — no extra file needed.

If you want the prettier Filled Map (choropleth), enable it in Power BI:
File → Options → Security → "Use Map and Filled Map visuals" → tick.

## 4. Run the preprocessing

After downloads:

```bash
cd disasters
python preprocess.py
```

Outputs land in `out/`:

- `inform_latest.csv` — one row per country (current INFORM)
- `inform_trend.csv` — country-year long format (for trend line)
- `emdat_events.csv` — event-level disasters since 1995
- `joined_summary.csv` — INFORM + 30-year EM-DAT totals (Page 4)
- `README.txt` — Power BI import order and DAX measures

## 5. Build the dashboard

Open Power BI Desktop → Get Data → Text/CSV → import all four CSVs from
`out/`. Then follow the wireframe in the slides and the page spec in
`dashboard_spec.md`.
