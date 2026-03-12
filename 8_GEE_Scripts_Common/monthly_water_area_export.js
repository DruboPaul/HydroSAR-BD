/************************************************************
 MONTHLY WATER AREA DATA EXPORT
 Bangladesh National + 8 Divisions
 2015-2024, all 12 months
 
 OUTPUT: Console-এ সব data প্রিন্ট হবে
 - National: 12 months × 10 years = 120 values
 - Division: 8 divisions × July × 10 years = 80 values
 
 HOW TO USE:
 1. GEE-তে পেস্ট করে Run করুন
 2. Console-এ ফলাফল আসতে ১০-২০ মিনিট লাগবে
 3. Console থেকে কপি করে Excel-এ পেস্ট করুন
************************************************************/

/* -------------------- Datasets -------------------- */
var bdBoundary = ee.FeatureCollection('projects/ee-mbokshi45/assets/bdshp');
var divisions = ee.FeatureCollection('FAO/GAUL/2015/level1')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));

/* -------------------- Parameters -------------------- */
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

var years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
var months = Object.keys(monthMap);
var SCALE = 100;  // 100m scale for faster processing (national level)

/* -------------------- Helper Function -------------------- */
function getWaterAreaKm2(regionGeom, year, monthName) {
    var mm = monthMap[monthName];
    var start = year + '-' + mm + '-01';
    var end = year + '-' + mm + '-' + monthEndDays[monthName];

    var col = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(regionGeom)
        .filterDate(start, end)
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');

    var median = ee.Image(
        ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0))
    ).clip(regionGeom);

    var water = median.lt(ee.Number(thresholds[monthName]));

    var area = ee.Image.pixelArea().multiply(water)
        .reduceRegion({
            reducer: ee.Reducer.sum(),
            geometry: regionGeom,
            scale: SCALE,
            maxPixels: 1e13,
            bestEffort: true,
            tileScale: 4
        });

    var vals = ee.Dictionary(area);
    var val = ee.Algorithms.If(vals.size().gt(0), ee.Number(vals.values().get(0)), 0);
    return ee.Number(val).divide(1e6);  // km²
}

/* ====================================================
   PART 1: NATIONAL MONTHLY WATER AREA
   (12 months × 10 years = 120 values)
   This fills Table: Monthly Surface Water (Section 5.2)
   ==================================================== */

print('╔══════════════════════════════════════════╗');
print('║  PART 1: NATIONAL MONTHLY WATER AREA     ║');
print('║  Bangladesh | 2015-2024 | 12 months       ║');
print('╚══════════════════════════════════════════╝');
print('Format: Year | Month | Water Area (km²)');
print('---');

var bdGeom = bdBoundary.geometry();

years.forEach(function (year) {
    months.forEach(function (m) {
        var area = getWaterAreaKm2(bdGeom, year, m);
        area.evaluate(function (a) {
            print(year + ' | ' + m + ' | ' + a.toFixed(1) + ' km²');
        });
    });
});

/* ====================================================
   PART 2: DIVISION-LEVEL JULY PEAK WATER AREA
   (8 divisions × 10 years = 80 values)
   This fills Table: Trend Analysis (Section 5.5)
   ==================================================== */

print('');
print('╔══════════════════════════════════════════╗');
print('║  PART 2: DIVISION JULY WATER AREA         ║');
print('║  8 Divisions | 2015-2024 | July only       ║');
print('╚══════════════════════════════════════════╝');
print('Format: Division | Year | July Water Area (km²)');
print('---');

var divNames = divisions.aggregate_array('ADM1_NAME').sort();

divNames.evaluate(function (names) {
    names.forEach(function (divName) {
        var divGeom = divisions
            .filter(ee.Filter.eq('ADM1_NAME', divName))
            .first().geometry();

        years.forEach(function (year) {
            var area = getWaterAreaKm2(divGeom, year, 'July');
            area.evaluate(function (a) {
                print(divName + ' | ' + year + ' | ' + a.toFixed(1) + ' km²');
            });
        });
    });
});

/* ====================================================
   PART 3: SENTINEL-1 SCENE COUNT PER YEAR
   This fills Table: S1 Count (Section 3.1)
   ==================================================== */

print('');
print('╔══════════════════════════════════════════╗');
print('║  PART 3: S1 SCENE COUNT PER YEAR          ║');
print('╚══════════════════════════════════════════╝');

years.forEach(function (year) {
    var count = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(bdGeom)
        .filterDate(year + '-01-01', year + '-12-31')
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .size();

    count.evaluate(function (n) {
        print('S1 Scenes ' + year + ': ' + n);
    });
});
