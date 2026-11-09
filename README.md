# GPM Rainfall Alert – Peru

A Google Earth Engine script that turns NASA GPM IMERG satellite precipitation into a simple rainfall alert map for Peru.

It accumulates rainfall over the last 24 and 48 hours, assigns an alert level to every pixel and reports the highest level reached in each region. The idea comes from my work on early warning for rainfall-triggered hazards (floods, landslides, debris flows).

## How it works

1. Loads half-hourly IMERG V07 precipitation (`NASA/GPM_L3/IMERG_V07`, 0.1°).
2. Sums the rainfall for the 24 h and 48 h windows before `END_DATE`.
3. Classifies each window with its own thresholds and keeps the highest level:

| Level | 24 h (mm) | 48 h (mm) |
|---|---|---|
| Yellow | ≥ 20 | ≥ 35 |
| Orange | ≥ 40 | ≥ 70 |
| Red | ≥ 60 | ≥ 100 |

4. Computes the maximum alert level and rainfall per region (FAO GAUL level 1).
5. Exports the alert raster (GeoTIFF) and the regional table (CSV) to Google Drive.

The thresholds are illustrative. For operational use they should be calibrated with local rain-gauge records and historical events, and the result is more useful when crossed with a hazard susceptibility map.

## Usage

1. Open the [Earth Engine Code Editor](https://code.earthengine.google.com).
2. Paste `gpm_rainfall_alert.js`.
3. Set `END_DATE` and, if needed, `THRESHOLDS` or `COUNTRY`.
4. Click **Run**, then start the exports from the **Tasks** tab.

## Data

- GPM IMERG V07, NASA / JAXA
- FAO GAUL 2015 administrative boundaries

All data are open. No institutional data are included in this repository.

## License

MIT
