/* ================================================================================
   ML-based Surface Water Detection for Sunamganj District
   Using Random Forest Classifier with Sentinel-1 SAR Data
   
   IMPORTANT: This script requires imported training points:
   - waterTraining: FeatureCollection with 'class' = 1
   - nonWaterTraining: FeatureCollection with 'class' = 0
   ================================================================================
*/

/* -------------------- Study Area: Sunamganj -------------------- */
var districts = ee.FeatureCollection('FAO/GAUL/2015/level2')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));
var sunamganj = districts.filter(ee.Filter.eq('ADM2_NAME', 'Sunamganj'));
var studyArea = sunamganj.geometry();

/* -------------------- Parameters -------------------- */
var analysisYear = 2023;
var analysisMonth = 'August'; // Peak monsoon for water detection
var monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
    'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
};
var monthEndDays = {
    'January': '31', 'February': '28', 'March': '31', 'April': '30', 'May': '31', 'June': '30',
    'July': '31', 'August': '31', 'September': '30', 'October': '31', 'November': '30', 'December': '31'
};

// Fixed threshold for comparison
var fixedThreshold = -13; // August threshold

/* -------------------- Get Sentinel-1 Data -------------------- */
var startDate = analysisYear + '-' + monthMap[analysisMonth] + '-01';
var endDate = analysisYear + '-' + monthMap[analysisMonth] + '-' + monthEndDays[analysisMonth];

var s1Collection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(studyArea)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'));

print('Sentinel-1 Image Count:', s1Collection.size());

// Create median composite
var s1Median = s1Collection.median().clip(studyArea);

// Select bands and create ratio
var vv = s1Median.select('VV');
var vh = s1Median.select('VH');
var ratio = vv.divide(vh).rename('VV_VH_ratio');

// Stack all features for ML
var mlImage = vv.addBands(vh).addBands(ratio);
print('ML Image Bands:', mlImage.bandNames());

/* ================================================================================
   TRAINING DATA - Using imported geometries from map
   - waterTraining: 185 points (class = 1)
   - nonWaterTraining: 71 points (class = 0)
   ================================================================================
*/

// Merge training data from imports
var trainingPoints = waterTraining.merge(nonWaterTraining);
print('Total Training Points:', trainingPoints.size());
print('Water Points:', waterTraining.size());
print('Non-Water Points:', nonWaterTraining.size());

/* -------------------- Extract Training Data -------------------- */
var trainingData = mlImage.sampleRegions({
    collection: trainingPoints,
    properties: ['class'],
    scale: 10
});

print('Training Samples:', trainingData.size());

/* -------------------- Train Random Forest Classifier -------------------- */
var classifier = ee.Classifier.smileRandomForest({
    numberOfTrees: 100,
    variablesPerSplit: null,
    minLeafPopulation: 1,
    bagFraction: 0.5,
    seed: 42
}).train({
    features: trainingData,
    classProperty: 'class',
    inputProperties: ['VV', 'VH', 'VV_VH_ratio']
});

// Print variable importance
var importance = classifier.explain();
print('Random Forest Model:', importance);

/* -------------------- Classify Image -------------------- */
var mlClassified = mlImage.classify(classifier);

/* -------------------- Fixed Threshold for Comparison -------------------- */
var fixedWater = vv.lt(fixedThreshold);

/* -------------------- Accuracy Assessment -------------------- */
// Split training data for validation (80% train, 20% test)
var withRandom = trainingData.randomColumn('random', 42);
var trainingSplit = withRandom.filter(ee.Filter.lt('random', 0.8));
var validationSplit = withRandom.filter(ee.Filter.gte('random', 0.8));

print('Training Split Size:', trainingSplit.size());
print('Validation Split Size:', validationSplit.size());

// Retrain with training split
var classifierForValidation = ee.Classifier.smileRandomForest(100).train({
    features: trainingSplit,
    classProperty: 'class',
    inputProperties: ['VV', 'VH', 'VV_VH_ratio']
});

// Validate
var validated = validationSplit.classify(classifierForValidation);
var confusionMatrix = validated.errorMatrix('class', 'classification');

print('');
print('=== ML ACCURACY ASSESSMENT ===');
print('');
print('Confusion Matrix:', confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());
print('Kappa Coefficient:', confusionMatrix.kappa());
print('Producer Accuracy:', confusionMatrix.producersAccuracy());
print('Consumer Accuracy:', confusionMatrix.consumersAccuracy());

/* -------------------- Calculate Area Statistics -------------------- */
var pixelArea = ee.Image.pixelArea();

// ML Water Area
var mlWaterArea = mlClassified.eq(1).multiply(pixelArea).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e13
});
var mlAreaKm2 = ee.Number(mlWaterArea.get('classification')).divide(1e6);

// Fixed Threshold Water Area
var fixedWaterArea = fixedWater.multiply(pixelArea).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: studyArea,
    scale: 30,
    maxPixels: 1e13
});
var fixedAreaKm2 = ee.Number(fixedWaterArea.get('VV')).divide(1e6);

print('');
print('=== AREA COMPARISON ===');
print('');
print('ML Water Area (km²):', mlAreaKm2);
print('Fixed Threshold Water Area (km²):', fixedAreaKm2);

// Calculate difference
var areaDifference = mlAreaKm2.subtract(fixedAreaKm2);
print('Difference (ML - Fixed):', areaDifference);

/* -------------------- Visualization -------------------- */
Map.centerObject(studyArea, 10);

// Add layers
Map.addLayer(vv, { min: -25, max: 0, palette: ['black', 'white'] }, 'VV Backscatter', false);
Map.addLayer(vh, { min: -30, max: -5, palette: ['black', 'white'] }, 'VH Backscatter', false);

// Water Detection Results
Map.addLayer(fixedWater.updateMask(fixedWater), { palette: ['00BFFF'] }, 'Fixed Threshold Water (-13 dB)', true);
Map.addLayer(mlClassified.updateMask(mlClassified), { palette: ['0000FF'] }, 'ML (Random Forest) Water', true);

// Training Points
Map.addLayer(waterTraining, { color: 'cyan' }, 'Water Training Points (185)', true);
Map.addLayer(nonWaterTraining, { color: 'red' }, 'Non-Water Training Points (71)', true);

// Study Area Boundary
var boundary = ee.Image().byte().paint({
    featureCollection: sunamganj,
    color: 1,
    width: 3
});
Map.addLayer(boundary, { palette: ['FF0000'] }, 'Sunamganj Boundary');

/* -------------------- Legend -------------------- */
var legend = ui.Panel({
    style: {
        position: 'bottom-left',
        padding: '8px 15px',
        backgroundColor: 'rgba(255,255,255,0.9)'
    }
});

legend.add(ui.Label('Water Detection Comparison', { fontWeight: 'bold', fontSize: '14px' }));
legend.add(ui.Label('', { color: 'gray' }));

var makeRow = function (color, name) {
    var colorBox = ui.Label('', { color: color, fontSize: '16px', margin: '0 8px 0 0' });
    var description = ui.Label(name, { margin: '0 0 4px 0' });
    return ui.Panel([colorBox, description], ui.Panel.Layout.Flow('horizontal'));
};

legend.add(makeRow('00BFFF', 'Fixed Threshold (-13 dB)'));
legend.add(makeRow('0000FF', 'ML (Random Forest)'));
legend.add(makeRow('cyan', 'Water Training (185)'));
legend.add(makeRow('red', 'Non-Water Training (71)'));

Map.add(legend);

/* -------------------- Info Panel -------------------- */
var infoPanel = ui.Panel({
    style: {
        position: 'top-left',
        padding: '8px 15px',
        backgroundColor: 'rgba(255,255,255,0.9)',
        width: '300px'
    }
});

infoPanel.add(ui.Label('ML Water Detection', { fontWeight: 'bold', fontSize: '16px' }));
infoPanel.add(ui.Label('Sunamganj District', { fontSize: '14px', color: 'gray' }));
infoPanel.add(ui.Label('', { color: 'gray' }));
infoPanel.add(ui.Label(' ' + analysisMonth + ' ' + analysisYear));
infoPanel.add(ui.Label(' Random Forest (100 trees)'));
infoPanel.add(ui.Label(' Features: VV, VH, VV/VH'));
infoPanel.add(ui.Label('', { color: 'gray' }));
infoPanel.add(ui.Label('Training: 185 Water + 71 Non-Water'));
infoPanel.add(ui.Label('Total: 256 points'));

Map.add(infoPanel);

print('');
print('=== SCRIPT COMPLETE ===');
print('');
print(' Check Console for accuracy metrics');
print(' Toggle layers to compare ML vs Fixed Threshold');
print(' Use Inspector tool to verify results');

/* -------------------- Export Options -------------------- */
// Uncomment to export ML classification result
/*
Export.image.toDrive({
    image: mlClassified,
    description: 'ML_Water_Sunamganj_' + analysisMonth + '_' + analysisYear,
    folder: 'GEE_Exports',
    region: studyArea,
    scale: 30,
    maxPixels: 1e13
});
*/
