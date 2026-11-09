/**
 * Rainfall alert map for Peru with GPM IMERG (Google Earth Engine).
 *
 * Accumulates IMERG precipitation over the last 24 and 48 hours before END_DATE,
 * classifies it into alert levels and summarizes the maximum level per region.
 * Paste into https://code.earthengine.google.com and run.
 */

// ---------- Settings ----------
var END_DATE = '2025-03-15T12:00:00';   // end of the accumulation window (UTC)
var COUNTRY = 'Peru';

// Thresholds in mm: [yellow, orange, red]
var THRESHOLDS = {
  24: [20, 40, 60],
  48: [35, 70, 100]
};

// ---------- Data ----------
var country = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.eq('ADM0_NAME', COUNTRY));
var regions = ee.FeatureCollection('FAO/GAUL/2015/level1')
  .filter(ee.Filter.eq('ADM0_NAME', COUNTRY));

// IMERG: half-hourly precipitation rate in mm/h
var imerg = ee.ImageCollection('NASA/GPM_L3/IMERG_V07').select('precipitation');
var end = ee.Date(END_DATE);

function accumulate(hours) {
  var col = imerg.filterDate(end.advance(-hours, 'hour'), end);
  print('IMERG images in ' + hours + ' h window:', col.size());
  // each image covers 0.5 h, so mm/h * 0.5 = mm
  return col.sum().multiply(0.5).rename('p' + hours + 'h').clip(country);
}

function alertLevel(precip, t) {
  // 0 = no alert, 1 = yellow, 2 = orange, 3 = red
  return precip.gte(t[0]).add(precip.gte(t[1])).add(precip.gte(t[2]))
    .rename('alert').toByte();
}

var p24 = accumulate(24);
var p48 = accumulate(48);
var alert = alertLevel(p24, THRESHOLDS[24])
  .max(alertLevel(p48, THRESHOLDS[48]))
  .clip(country);

// ---------- Map ----------
var rainVis = {min: 0, max: 100, palette: ['ffffff', 'c6dbef', '6baed6', '2171b5', '08306b']};
var alertVis = {min: 0, max: 3, palette: ['d9d9d9', 'ffd92f', 'fc8d62', 'd73027']};

Map.centerObject(country, 5);
Map.addLayer(p24, rainVis, 'Rainfall 24 h (mm)', false);
Map.addLayer(p48, rainVis, 'Rainfall 48 h (mm)', false);
Map.addLayer(alert.selfMask(), alertVis, 'Alert level');
Map.addLayer(ee.Image().paint(regions, 0, 1), {palette: ['333333']}, 'Regions');

// ---------- Summary per region ----------
var stats = alert.addBands(p24).addBands(p48).reduceRegions({
  collection: regions.select(['ADM1_NAME']),
  reducer: ee.Reducer.max(),
  scale: 11132   // IMERG native resolution (0.1 deg)
});
print('Max alert and rainfall per region', stats.sort('alert', false));

// ---------- Export ----------
Export.image.toDrive({
  image: alert,
  description: 'gpm_alert_' + END_DATE.slice(0, 10),
  region: country.geometry().bounds(),
  scale: 11132,
  maxPixels: 1e9
});
Export.table.toDrive({
  collection: stats,
  description: 'gpm_alert_regions_' + END_DATE.slice(0, 10),
  fileFormat: 'CSV'
});
