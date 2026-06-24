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
