/************************************************************
 * FULL DATASET CSV EXPORT - SAR Analysis GMM
 * Corrected Script - Dynamic Division Names
 ************************************************************/

var bdBoundary = ee.FeatureCollection('projects/ee-mbokshi45/assets/bdshp');
var divisions = ee.FeatureCollection('FAO/GAUL/2015/level1')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));

var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
var monthEndDays = ['31', '28', '31', '30', '31', '30', '31', '31', '30', '31', '30', '31'];
var thresholds = [-17, -16, -16, -15, -14, -13, -13, -13, -14, -15, -16, -17];
var years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];

var SCALE = 100;

// Create a list to store features
var features = [];

// Helper to get area
function calculateArea(geom, year, monthIdx) {
    // Safety check for empty geometry
    if (!geom) return ee.Number(0);

    var start = year + '-' + months[monthIdx] + '-01';
    var end = year + '-' + months[monthIdx] + '-' + monthEndDays[monthIdx];

    var col = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(geom)
        .filterDate(start, end)
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');

    // Use a blank image if collection is empty
    var median = ee.Image(ee.Symbols.If(col.size().gt(0), col.median(), ee.Image(0))).clip(geom);
    var water = median.lt(ee.Number(thresholds[monthIdx]));

    var area = ee.Image.pixelArea().multiply(water).reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: geom,
        scale: SCALE,
        maxPixels: 1e13,
        bestEffort: true
    });

    var val = area.values().get(0);
    return ee.Number(ee.Symbols.If(val, val, 0)).divide(1e6); // km²
}

// 1. National Analysis
var bdGeom = bdBoundary.geometry();
print('Processing National Data...');

years.forEach(function (year) {
    months.forEach(function (m, idx) {
        var area = calculateArea(bdGeom, year, idx);
        var f = ee.Feature(null, {
            'Year': year,
            'Month': monthNames[idx],
            'Region': 'National',
            'Water_Area_km2': area
        });
        features.push(f);
    });
});

// 2. Division Analysis (Dynamically get names from GAUL)
print('Processing Division Data...');
var divCollection = divisions.getInfo();

if (divCollection.features.length > 0) {
    divCollection.features.forEach(function (feat) {
        var name = feat.properties.ADM1_NAME;
        var divGeom = ee.Feature(feat).geometry();

        years.forEach(function (year) {
            var area = calculateArea(divGeom, year, 6); // 6 is July
            var f = ee.Feature(null, {
                'Year': year,
                'Month': 'July',
                'Region': name,
                'Water_Area_km2': area
            });
            features.push(f);
        });
    });
} else {
    print('Warning: No divisions found in GAUL collection.');
}

var finalCollection = ee.FeatureCollection(features);

// Export to CSV
Export.table.toDrive({
    collection: finalCollection,
    description: 'SAR_Water_Area_Dataset_Bangladesh_2015_2024',
    fileFormat: 'CSV',
    folder: 'GEE_Water_Exports'
});

print('Export Task created. Please check the Tasks tab and Run.');
