/*************************************************
 MEAN-BASED OTSU WATER EXTRACTION
 Sentinel-1 VV
 PURPOSE:
 1) Compute OTSU threshold using class means
 2) Generate water mask
 3) Display and export result
**************************************************/

/* -------------------- STUDY AREA -------------------- */
var region = ee.FeatureCollection('FAO/GAUL/2015/level1')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'))
    .filter(ee.Filter.eq('ADM1_NAME', 'Dhaka'))
    .geometry();

Map.centerObject(region, 8);
Map.addLayer(region, { color: 'red' }, 'Selected Area');

/* -------------------- TIME PERIOD -------------------- */
var startDate = '2023-07-01';
var endDate = '2023-07-31';

/* -------------------- SENTINEL-1 DATA -------------------- */
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(region)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .select('VV');

print('Sentinel-1 image count:', s1.size());

/* -------------------- SAFE MEDIAN -------------------- */
var medianVV = ee.Image(
    ee.Algorithms.If(
        s1.size().gt(0),
        s1.median(),
        ee.Image(0)
    )
).clip(region);

Map.addLayer(
    medianVV,
    { min: -25, max: 0 },
    'Median VV'
);

/* -------------------- MEAN-BASED OTSU FUNCTION -------------------- */
function otsuThreshold_mean(image, geometry) {

    var hist = ee.Dictionary(
        image.reduceRegion({
            reducer: ee.Reducer.histogram(255),
            geometry: geometry,
            scale: 30,
            bestEffort: true,
            maxPixels: 1e13
        }).values().get(0)
    );

    var counts = ee.List(hist.get('histogram'));
    var means = ee.List(hist.get('bucketMeans'));

    var total = ee.Number(counts.reduce(ee.Reducer.sum()));

    // Global mean numerator
    var sum = ee.Number(
        counts.zip(means).map(function (p) {
            p = ee.List(p);
            return ee.Number(p.get(0)).multiply(p.get(1));
        }).reduce(ee.Reducer.sum())
    );

    // Between-class variance for all possible thresholds
    var betweenClassVariance = ee.List.sequence(1, counts.length().subtract(1))
        .map(function (i) {

            var w0 = ee.Number(counts.slice(0, i).reduce(ee.Reducer.sum()));
            var w1 = total.subtract(w0);

            var m0 = ee.Number(
                counts.slice(0, i).zip(means.slice(0, i))
                    .map(function (p) {
                        p = ee.List(p);
                        return ee.Number(p.get(0)).multiply(p.get(1));
                    }).reduce(ee.Reducer.sum())
            ).divide(w0);

            var m1 = sum.subtract(m0.multiply(w0)).divide(w1);

            // Otsu between-class variance
            return w0.multiply(w1).multiply(m0.subtract(m1).pow(2));
        });

    // Index of maximum variance
    var index = betweenClassVariance.indexOf(
        betweenClassVariance.reduce(ee.Reducer.max())
    );

    // Return mean value of optimal bin
    return ee.Number(means.get(index));
}

/* -------------------- COMPUTE MEAN-BASED OTSU -------------------- */
var otsuMean = otsuThreshold_mean(medianVV, region);
print(' MEAN-BASED OTSU threshold (VV):', otsuMean);

/* -------------------- WATER MASK USING MEAN-BASED OTSU -------------------- */
var water_mean = medianVV.lt(otsuMean);

/* -------------------- DISPLAY WATER -------------------- */
Map.addLayer(
    water_mean.updateMask(water_mean),
    { palette: ['0000FF'] },
    'Water (MEAN-BASED OTSU)'
);

/* -------------------- EXPORT MEAN-BASED OTSU WATER MASK -------------------- */
Export.image.toDrive({
    image: water_mean,
    description: 'MeanOTSU_Water_S1_VV_Dhaka_202307',
    folder: 'GEE_Exports',
    fileNamePrefix: 'mean_otsu_water_vv_dhaka_202307',
    region: region,
    scale: 10,
    crs: 'EPSG:4326',
    maxPixels: 1e13
});





















/*************************************************
 MAX-COUNT (MODE) BASED WATER EXTRACTION
 Sentinel-1 VV
 PURPOSE:
 1) Build histogram of VV
 2) Find max-count (mode) bin
 3) Use its value as threshold
 4) Extract water mask
**************************************************/

/* -------------------- STUDY AREA -------------------- */
var region = ee.FeatureCollection('FAO/GAUL/2015/level1')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'))
    .filter(ee.Filter.eq('ADM1_NAME', 'Dhaka'))
    .geometry();

Map.centerObject(region, 8);
Map.addLayer(region, { color: 'red' }, 'Selected Area');

/* -------------------- TIME PERIOD -------------------- */
var startDate = '2023-07-01';
var endDate = '2023-07-31';

/* -------------------- SENTINEL-1 DATA -------------------- */
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(region)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .select('VV');

print('Sentinel-1 image count:', s1.size());

/* -------------------- SAFE MEDIAN -------------------- */
var medianVV = ee.Image(
    ee.Algorithms.If(
        s1.size().gt(0),
        s1.median(),
        ee.Image(0)
    )
).clip(region);

Map.addLayer(
    medianVV,
    { min: -25, max: 0 },
    'Median VV'
);

/* -------------------- MAX-COUNT THRESHOLD FUNCTION -------------------- */
function maxCountThreshold(image, geometry) {

    var hist = ee.Dictionary(
        image.reduceRegion({
            reducer: ee.Reducer.histogram(255),
            geometry: geometry,
            scale: 30,
            bestEffort: true,
            maxPixels: 1e13
        }).values().get(0)
    );

    var counts = ee.List(hist.get('histogram'));
    var means = ee.List(hist.get('bucketMeans'));

    // Find maximum count
    var maxCount = counts.reduce(ee.Reducer.max());

    // Index of max-count bin (mode)
    var index = counts.indexOf(maxCount);

    // Return representative VV value of that bin
    return ee.Number(means.get(index));
}

/* -------------------- COMPUTE MAX-COUNT THRESHOLD -------------------- */
var maxThreshold = maxCountThreshold(medianVV, region);
print(' MAX-COUNT (MODE) threshold (VV):', maxThreshold);

/* -------------------- WATER MASK USING MAX-COUNT -------------------- */
var water_max = medianVV.lt(maxThreshold);

/* -------------------- DISPLAY WATER -------------------- */
Map.addLayer(
    water_max.updateMask(water_max),
    { palette: ['0000FF'] },
    'Water (MAX-COUNT Threshold)'
);

/* -------------------- EXPORT MAX-COUNT WATER MASK -------------------- */
Export.image.toDrive({
    image: water_max,
    description: 'MaxCount_Water_S1_VV_Dhaka_202307',
    folder: 'GEE_Exports',
    fileNamePrefix: 'maxcount_water_vv_dhaka_202307',
    region: region,
    scale: 10,
    crs: 'EPSG:4326',
    maxPixels: 1e13
});
