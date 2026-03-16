/************************************************************
 MAP FIGURES EXPORT FOR ARCGIS PRO
 
 এই স্ক্রিপ্টটি ৩টি প্রধান ম্যাপ লেয়ার জিওটিফ (GeoTIFF) হিসেবে এক্সপোর্ট করবে:
 ৫. Monthly Peak Map (July 2025)
 ৬. Water Persistence Map (2025)
 ৭. Change Detection Map (2015 vs 2025 July)
 
 HOW TO USE:
 ১. GEE-তে Run করুন।
 ২. ডানদিকের 'Tasks' ট্যাব থেকে ৩টি টাস্ক 'Run' এ ক্লিক করুন।
 ৩. ডাউনলোড হলে ArcGIS Pro-তে অ্যাড করে Symbology ঠিক করুন।
************************************************************/

var bdBoundary = ee.FeatureCollection('projects/ee-mbokshi45/assets/bdshp');
var bdGeom = bdBoundary.geometry();
var EXPORT_SCALE = 30; // 30m resolution is standard for publication

var thresholds = {
    'January': -17, 'February': -16, 'March': -16, 'April': -15,
    'May': -14, 'June': -13, 'July': -13, 'August': -13,
    'September': -14, 'October': -15, 'November': -16, 'December': -17
};

function getMonthlyWater(year, monthName) {
    var mm = (monthName === 'July') ? '07' : '01'; // Simplified for this script
    var endDay = (monthName === 'July') ? '31' : '31';
    var start = year + '-' + mm + '-01';
    var end = year + '-' + mm + '-' + endDay;

    var col = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(bdGeom).filterDate(start, end)
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');

    var median = ee.Image(ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0))).clip(bdGeom);
    return median.lt(thresholds[monthName]).unmask(0);
}

// --- 1. Monthly Peak Map (July 2025) ---
var peakWater2025 = getMonthlyWater(2025, 'July').clip(bdGeom).byte();

Export.image.toDrive({
    image: peakWater2025,
    description: 'Water_Peak_July_2025',
    scale: EXPORT_SCALE,
    region: bdGeom,
    maxPixels: 1e11,
    crs: 'EPSG:4326',
    fileFormat: 'GeoTIFF'
});

// --- 2. Persistence Map (2023) ---
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var monthImages = months.map(function (m) {
    // Use thresholds object properly
    var start = '2025-' + (months.indexOf(m) + 1 < 10 ? '0' + (months.indexOf(m) + 1) : months.indexOf(m) + 1) + '-01';
    var col = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(bdGeom).filterDate(start, ee.Date(start).advance(1, 'month'))
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');
    var med = ee.Image(ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0)));
    return med.lt(thresholds[m]);
});

var freq = ee.ImageCollection(monthImages).sum();

// Reclassify: 1=Ephemeral (1-4), 2=Semi-permanent (5-9), 3=Permanent (10-12)
var persistence = ee.Image(0)
    .where(freq.gte(1).and(freq.lt(5)), 1)
    .where(freq.gte(5).and(freq.lt(10)), 2)
    .where(freq.gte(10), 3)
    .clip(bdGeom).byte();

Export.image.toDrive({
    image: persistence,
    description: 'Water_Persistence_2025',
    scale: EXPORT_SCALE,
    region: bdGeom,
    maxPixels: 1e11,
    crs: 'EPSG:4326',
    fileFormat: 'GeoTIFF'
});

// --- 3. July Change Detection (2015 vs 2025) ---
var water2015 = getMonthlyWater(2015, 'July');
var water2025 = getMonthlyWater(2025, 'July');

// 1=Lost, 2=Stable, 3=Gained
var change = ee.Image(0)
    .where(water2015.eq(1).and(water2025.eq(0)), 1)
    .where(water2015.eq(1).and(water2025.eq(1)), 2)
    .where(water2015.eq(0).and(water2025.eq(1)), 3)
    .clip(bdGeom).byte();

Export.image.toDrive({
    image: change,
    description: 'Water_Change_July_2015_2025',
    scale: EXPORT_SCALE,
    region: bdGeom,
    maxPixels: 1e11,
    crs: 'EPSG:4326',
    fileFormat: 'GeoTIFF'
});

print('টাস্কগুলো জেনারেট হয়েছে। ডানদিকের "Tasks" ট্যাব থেকে ডাউনলোড শুরু করুন।');
