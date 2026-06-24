"""
preprocess.py — Build Power BI–ready CSVs from raw INFORM TREND + EM-DAT.

USAGE
-----
Put your downloaded files in ./raw/ :
  raw/INFORM_TREND_*.xlsx    (from drmkc.jrc.ec.europa.eu/inform-index)
  raw/public_emdat_*.xlsx    (from emdat.be — register and download)

Run:
  python preprocess.py

Outputs (./out/):
  inform_latest.csv          One row per country, latest INFORM year (wide)
  inform_trend.csv           One row per country-year (wide, all years)
  emdat_events.csv           Cleaned event-level table
  joined_summary.csv         INFORM (latest) + EM-DAT (30yr aggregates) on ISO3
  README.txt                 Power BI import notes
"""
from __future__ import annotations
from pathlib import Path
import pandas as pd
import sys

RAW = Path("raw")
OUT = Path("out")
OUT.mkdir(exist_ok=True)


# --------------------------------------------------------------------------
# INDICATORS: which INFORM IndicatorId codes we pull out, and what to call
# them in the output. The TREND file stores ~286 indicators in long format;
# we only need the top-level dimension scores and a few hazard-specific ones.
#
# If a code below isn't found in your file, the script prints a warning;
# edit this dict to match. Common variants to try if a hazard is missing:
#   HA.NAT.FL  vs  HA.NAT.FL.RAW   vs  HA.NAT.FL.NORM
# --------------------------------------------------------------------------
INDICATORS = {
    # Top-level scores
    "INFORM":     "inform_risk",
    "HA":         "hazard_exposure",
    "VU":         "vulnerability",
    "CC":         "lack_of_coping_capacity",
    # Natural-hazard category scores (all 0–10, ready for the dashboard)
    "HA.NAT.FL":  "risk_flood_river",
    "HA.NAT.CFL": "risk_flood_coastal",
    "HA.NAT.EQ":  "risk_earthquake",
    "HA.NAT.TC":  "risk_tropical_cyclone",
    "HA.NAT.DR":  "risk_drought",
    "HA.NAT.TS":  "risk_tsunami",
    "HA.NAT.EPI": "risk_epidemic",
}


def load_inform() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (inform_trend wide, inform_latest wide)."""
    p = next(iter(RAW.glob("INFORM_TREND*.xlsx")), None) \
        or next(iter(RAW.glob("*TREND*.xlsx")), None)
    if not p:
        print("WARN: no INFORM TREND Excel found in raw/. Skipping INFORM outputs.")
        return pd.DataFrame(), pd.DataFrame()

    print(f"Loading INFORM TREND from {p}")
    df = pd.read_excel(p, sheet_name=0)
    print(f"  raw rows: {len(df):,}")

    df = df.rename(columns={
        "Iso3": "iso3",
        "IndicatorId": "indicator_id",
        "IndicatorScore": "score",
        "INFORMYear": "year",
    })

    wanted = df[df["indicator_id"].isin(INDICATORS.keys())].copy()
    print(
        f"  rows after filtering to {len(INDICATORS)} indicators: {len(wanted):,}")

    found = sorted(wanted["indicator_id"].unique())
    missing = sorted(set(INDICATORS) - set(found))
    print(f"  ✓ found: {found}")
    if missing:
        print(f"  ! MISSING (absent from output): {missing}")
        print(f"    → Check the file's actual codes and edit the INDICATORS dict.")

    wanted["score"] = pd.to_numeric(wanted["score"], errors="coerce")
    wanted = wanted.dropna(subset=["iso3", "year", "score"])
    wanted = wanted[wanted["iso3"].astype(str).str.len() == 3]
    wanted["year"] = wanted["year"].astype(int)

    # Long → wide: rows = (iso3, year), cols = indicator
    wide = wanted.pivot_table(
        index=["iso3", "year"],
        columns="indicator_id",
        values="score",
        aggfunc="mean",
    ).reset_index()
    wide.columns.name = None

    wide = wide.rename(columns=INDICATORS)
    ordered = ["iso3", "year"] + \
        [v for v in INDICATORS.values() if v in wide.columns]
    wide = wide[ordered]
    # Round to 2dp to match INFORM's display precision
    score_cols = [c for c in wide.columns if c not in ("iso3", "year")]
    wide[score_cols] = wide[score_cols].round(2)

    print(
        f"  → trend: {len(wide)} country-year rows across {wide['year'].nunique()} years")

    latest_year = wide["year"].max()
    latest = wide[wide["year"] == latest_year].copy()
    print(f"  → latest (year={latest_year}): {len(latest)} countries")

    return wide, latest


def load_emdat() -> pd.DataFrame:
    p = next(iter(RAW.glob("public_emdat*.xlsx")), None) \
        or next(iter(RAW.glob("emdat*.xlsx")), None) \
        or next(iter(RAW.glob("*EM-DAT*.xlsx")), None)
    if not p:
        print("WARN: no EM-DAT Excel found in raw/. Skipping.")
        return pd.DataFrame()

    print(f"Loading EM-DAT from {p}")
    df = pd.read_excel(p, sheet_name=0)

    if "Disaster Group" in df.columns:
        df = df[df["Disaster Group"].astype(str).str.lower() == "natural"]

    keep_map = {
        "ISO":             "iso3",
        "Country":         "country",
        "Region":          "region",
        "Start Year":      "year",
        "Disaster Type":   "hazard_type",
        "Total Deaths":    "deaths",
        "Total Affected":  "affected",
        "Total Damage ('000 US$)":           "damages_kusd",
        "Total Damage, Adjusted ('000 US$)": "damages_adj_kusd",
    }
    cols_present = {k: v for k, v in keep_map.items() if k in df.columns}
    df = df[list(cols_present.keys())].rename(columns=cols_present)

    df["year"] = pd.to_numeric(df["year"], errors="coerce")
    for c in ("deaths", "affected", "damages_kusd", "damages_adj_kusd"):
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    if "damages_adj_kusd" in df.columns:
        df["damages_musd"] = df["damages_adj_kusd"] / 1000.0
        df = df.drop(columns=["damages_adj_kusd"])
        if "damages_kusd" in df.columns:
            df = df.drop(columns=["damages_kusd"])
    elif "damages_kusd" in df.columns:
        df["damages_musd"] = df["damages_kusd"] / 1000.0
        df = df.drop(columns=["damages_kusd"])

    df = df.dropna(subset=["iso3", "year"])
    df["year"] = df["year"].astype(int)
    print(f"  → {len(df):,} disaster events")
    return df


def main() -> None:
    if not RAW.exists():
        print("ERROR: create a ./raw/ directory and put downloaded files in it.")
        sys.exit(1)

    trend, latest = load_inform()
    emdat = load_emdat()

    if not latest.empty:
        latest.to_csv(OUT / "inform_latest.csv", index=False)
        print(f"✓ Wrote out/inform_latest.csv")
    if not trend.empty:
        trend.to_csv(OUT / "inform_trend.csv", index=False)
        print(f"✓ Wrote out/inform_trend.csv")
    if not emdat.empty:
        emdat.to_csv(OUT / "emdat_events.csv", index=False)
        print(f"✓ Wrote out/emdat_events.csv")

    if not latest.empty and not emdat.empty:
        recent = emdat[emdat["year"] >= 1995]
        agg_dict = {
            "total_events":   ("year", "count"),
            "total_deaths":   ("deaths", "sum"),
            "total_affected": ("affected", "sum"),
        }
        if "damages_musd" in recent.columns:
            agg_dict["total_damages_musd"] = ("damages_musd", "sum")

        agg = recent.groupby("iso3").agg(**agg_dict).reset_index()
        joined = latest.merge(agg, on="iso3", how="left").fillna(
            {"total_events": 0, "total_deaths": 0,
             "total_affected": 0, "total_damages_musd": 0}
        )
        joined.to_csv(OUT / "joined_summary.csv", index=False)
        print(f"✓ Wrote out/joined_summary.csv ({len(joined)} rows)")

    (OUT / "README.txt").write_text("""\
Power BI import order:

1. Get Data → Text/CSV → inform_latest.csv
   - Mark 'iso3' as data category: Country (Modeling tab)
2. Get Data → Text/CSV → inform_trend.csv
3. Get Data → Text/CSV → emdat_events.csv
4. Get Data → Text/CSV → joined_summary.csv

Relationships (Model view):
   inform_latest[iso3]  →  emdat_events[iso3]    (1:many)
   inform_latest[iso3]  →  inform_trend[iso3]    (1:many)

DAX measures:
   Total Deaths       = SUM(emdat_events[deaths])
   Total Affected     = SUM(emdat_events[affected])
   Total Damages USDm = SUM(emdat_events[damages_musd])
   Event Count        = COUNTROWS(emdat_events)
""")
    print(f"✓ Wrote out/README.txt")


if __name__ == "__main__":
    main()
