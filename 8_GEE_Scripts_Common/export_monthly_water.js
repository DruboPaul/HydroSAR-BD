/*
 * HydroSAR-Bangladesh: Monthly Water Export Script
 * 
 * This script exports monthly surface water masks for Bangladesh
 * from Sentinel-1 SAR data (2015-2025).
 * 
 * Run this in Google Earth Engine Code Editor.
 */

// ==================== Configuration ====================
var START_YEAR = 2015;
var END_YEAR = 2025;
var EXPORT_SCALE = 30;  // meters
var EXPORT_FOLDER = 'HydroSAR_Bangladesh';

// ==================== Datasets ====================
var bdBoundary = ee.FeatureCollection('FAO/GAUL/2015/level0')
  .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));

// ==================== Thresholds ====================
var thresholds = {
  'January': -17, 'February': -16, 'March': -16, 'April': -15,
  'May': -14, 'June': -13, 'July': -13, 'August': -13,
  'September': -14, 'October': -15, 'November': -16, 'December': -17
};

var monthMap = {
  'January':'01', 'February':'02', 'March':'03', 'April':'04',
  'May':'05', 'June':'06', 'July':'07', 'August':'08',
  'September':'09', 'October':'10', 'November':'11', 'December':'12'
};

var monthEndDays = {
  'January':'31', 'February':'28', 'March':'31', 'April':'30',
  'May':'31', 'June':'30', 'July':'31', 'August':'31',
  'September':'30', 'October':'31', 'November':'30', 'December':'31'
};

// ==================== Functions ====================

/**
 * Get monthly water mask for a specific year and month
 */
function getMonthlyWater(year, monthName) {
  var monthNum = monthMap[monthName];
  var endDay = monthEndDays[monthName];
  var threshold = thresholds[monthName];
  
  var startDate = year + '-' + monthNum + '-01';
  var endDate = year + '-' + monthNum + '-' + endDay;
  
  var s1Collection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(bdBoundary)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .select('VV');
  
  // Check if collection is empty
  var count = s1Collection.size();
  
  // Compute median and apply threshold
  var median = s1Collection.median();
  var waterMask = median.lt(threshold).rename('water');
  
  // Clip to Bangladesh boundary
  waterMask = waterMask.clip(bdBoundary);
  
  // Set properties
  waterMask = waterMask.set({
    'year': year,
    'month': monthName,
    'month_num': parseInt(monthNum),
    'threshold': threshold,
    'image_count': count
  });
  
  return waterMask;
}

/**
 * Export a single monthly water mask
 */
function exportMonthlyWater(year, monthName) {
  var waterMask = getMonthlyWater(year, monthName);
  var monthNum = monthMap[monthName];
  
  var filename = 'water_' + year + '_' + monthNum;
  
  Export.image.toDrive({
    image: waterMask.toUint8(),
    description: filename,
    folder: EXPORT_FOLDER + '/monthly/' + year,
    fileNamePrefix: filename,
    region: bdBoundary.geometry(),
    scale: EXPORT_SCALE,
    crs: 'EPSG:4326',
    maxPixels: 1e13
  });
  
  print('Queued export:', filename);
}

// ==================== Main Export Loop ====================

// Export all months for all years
var months = Object.keys(thresholds);

for (var year = START_YEAR; year <= END_YEAR; year++) {
  for (var i = 0; i < months.length; i++) {
    exportMonthlyWater(year, months[i]);
  }
}

print('Total exports queued:', (END_YEAR - START_YEAR + 1) * 12);
print('Check Tasks tab to run exports.');

// ==================== Preview ====================
// Display a sample month for verification
var sampleWater = getMonthlyWater(2023, 'July');
Map.centerObject(bdBoundary, 7);
Map.addLayer(sampleWater.updateMask(sampleWater), {palette: ['0000FF']}, 'Water July 2023');
Map.addLayer(bdBoundary, {color: 'red'}, 'Bangladesh Boundary', false);
