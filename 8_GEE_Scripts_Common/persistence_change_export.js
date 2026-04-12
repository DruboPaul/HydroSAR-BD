/************************************************************
 WATER PERSISTENCE & CHANGE DETECTION EXPORT
 
 PART 1: Persistence Classification (2023)
 - Permanent: Water in >= 10 months
 - Semi-permanent: Water in 5-9 months
 - Ephemeral: Water in 1-4 months
 
 PART 2: July Change Detection (2015 vs 2024)
 - Gained: Water in 2024 but not 2015
 - Stable: Water in both
 - Lost: Water in 2015 but not 2024
 
 HOW TO USE:
 1. Paste this into Google Earth Engine and click Run.
 2. Wait 5-10 minutes for results to appear in the Console.
 3. Copy results for analysis.
 ************************************************************/

var bdBoundary = ee.FeatureCollection('projects/ee-mbokshi45/assets/bdshp');
var bdGeom = bdBoundary.geometry();
var SCALE = 100; // 100m for processing speed

var monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
};
var monthEndDays = {
    'January': '31', 'February': '28', 'March': '31', 'April': '30',
    'May': '31', 'June': '30', 'July': '31', 'August': '31',
    'September': '30', 'October': '31', 'November': '30', 'December': '31'
};
var thresholds = {
    'January': -17, 'February': -16, 'March': -16, 'April': -15,
    'May': -14, 'June': -13, 'July': -13, 'August': -13,
    'September': -14, 'October': -15, 'November': -16, 'December': -17
};

function getMonthlyWater(year, monthName) {
    var mm = monthMap[monthName];
    var start = year + '-' + mm + '-01';
    var end = year + '-' + mm + '-' + monthEndDays[monthName];
    var col = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(bdGeom).filterDate(start, end)
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');
    var median = ee.Image(ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0))).clip(bdGeom);
    return median.lt(thresholds[monthName]);
}

/* ====================================================
   PART 1: WATER PERSISTENCE (2023)
   ==================================================== */
print('Starting PART 1: Persistence Classification (2023)...');

var year2023 = 2023;
var monthlyImages = Object.keys(monthMap).map(function (m) {
    return getMonthlyWater(year2023, m);
});
var countImage = ee.ImageCollection(monthlyImages).sum();

var permanent = countImage.gte(10);
var semiPermanent = countImage.gte(5).and(countImage.lt(10));
var ephemeral = countImage.gte(1).and(countImage.lt(5));
var land = countImage.eq(0);

function getArea(mask) {
    return ee.Image.pixelArea().multiply(mask).reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: bdGeom,
        scale: SCALE,
        maxPixels: 1e13,
        bestEffort: true
    }).values().get(0);
}

var pArea = getArea(permanent);
var sArea = getArea(semiPermanent);
var eArea = getArea(ephemeral);
var lArea = getArea(land);

ee.Dictionary({
    Permanent: pArea,
    SemiPermanent: sArea,
    Ephemeral: eArea,
    Land: lArea
}).evaluate(function (r, error) {
    if (error) { print('Part 1 Error: ' + error); return; }
    print('╔══════════════════════════════════════════╗');
    print('║  PART 1: WATER PERSISTENCE (2023)       ║');
    print('╚══════════════════════════════════════════╝');
    var total = r.Permanent + r.SemiPermanent + r.Ephemeral + r.Land;
    print('Permanent (>=10 months): ' + (r.Permanent / 1e6).toFixed(1) + ' km2 (' + (r.Permanent / total * 100).toFixed(1) + '%)');
    print('Semi-permanent (5-9): ' + (r.SemiPermanent / 1e6).toFixed(1) + ' km2 (' + (r.SemiPermanent / total * 100).toFixed(1) + '%)');
    print('Ephemeral (1-4): ' + (r.Ephemeral / 1e6).toFixed(1) + ' km2 (' + (r.Ephemeral / total * 100).toFixed(1) + '%)');
    print('No Water (0 months): ' + (r.Land / 1e6).toFixed(1) + ' km2');
});

/* ====================================================
   PART 2: JULY CHANGE DETECTION (2015 vs 2024)
   ==================================================== */
print('Starting PART 2: July Change Detection (2015 vs 2024)...');

var water2015 = getMonthlyWater(2015, 'July');
var water2024 = getMonthlyWater(2024, 'July');

var gained = water2024.and(water2015.not());
var lost = water2015.and(water2024.not());
var stable = water2015.and(water2024);

var gArea = getArea(gained);
var lAreaChange = getArea(lost);
var sAreaChange = getArea(stable);

ee.Dictionary({
    Gained: gArea,
    Lost: lAreaChange,
    Stable: sAreaChange
}).evaluate(function (r, error) {
    if (error) { print('Part 2 Error: ' + error); return; }
    print('╔══════════════════════════════════════════╗');
    print('║  PART 2: JULY CHANGE (2015 vs 2024)      ║');
    print('╚══════════════════════════════════════════╝');
    var totalWater = r.Gained + r.Lost + r.Stable;
    print('Gained Water: ' + (r.Gained / 1e6).toFixed(1) + ' km2 (' + (r.Gained / totalWater * 100).toFixed(1) + '%)');
    print('Stable Water: ' + (r.Stable / 1e6).toFixed(1) + ' km2 (' + (r.Stable / totalWater * 100).toFixed(1) + '%)');
    print('Lost Water:   ' + (r.Lost / 1e6).toFixed(1) + ' km2 (' + (r.Lost / totalWater * 100).toFixed(1) + '%)');
});
