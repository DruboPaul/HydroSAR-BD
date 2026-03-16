/*******************************************************************************
 * GMM-BASED FIELD VALIDATION (2025)
 * Accuracy Assessment for HydroSAR-Bangladesh
 * 
 * Objectives:
 * 1. Compare GMM-thresholded SAR water masks against Optical Field Validation.
 * 2. Calculate Overall Accuracy (OA) and Kappa Coefficient (κ).
 * 3. Validate performance across all 12 months.
 * 
 * HOW TO USE:
 * 1. Upload 'Balanced_Validation_Points_2025_Full.csv' as a GEE Asset (Table).
 * 2. Update the 'POINTS_ASSET' path below with your asset ID.
 * 3. Run the script and check the Console for results.
 *******************************************************************************/

// 1. ASSET CONFIGURATION
var POINTS_ASSET = 'projects/intense-agency-476210-g0/assets/Balanced_Validation_Points_2025_Full'; // <-- UPDATE THIS
var bdBoundary = ee.FeatureCollection('projects/ee-mbokshi45/assets/bdshp');

// 2. GMM THRESHOLDS (Monthly Adaptive) - Defined as Server-side Dictionary
var thresholdsDic = ee.Dictionary({
  '1': -17.43, '2': -16.82, '3': -16.51, '4': -15.24,
  '5': -14.12, '6': -13.05, '7': -12.87, '8': -12.92,
  '9': -13.84, '10': -14.76, '11': -15.93, '12': -17.15
});

var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

var monthEndDays = ee.Dictionary({
  '1': '31', '2': '28', '3': '31', '4': '30', '5': '31', '6': '30',
  '7': '31', '8': '31', '9': '30', '10': '31', '11': '30', '12': '31'
});

// 3. LOAD DATA
var fieldPoints = ee.FeatureCollection(POINTS_ASSET);
print('Total Field Validation Points Loaded:', fieldPoints.size());

// 4. VALIDATION FUNCTION
function validateByMonth(m) {
  var monthNum = ee.Number(m);
  var threshold = ee.Number(thresholdsDic.get(monthNum.format('%d')));
  var endDay = ee.String(monthEndDays.get(monthNum.format('%d')));
  
  // Filter points for this month
  var monthPoints = fieldPoints.filter(ee.Filter.eq('Month', monthNum));
  
  var mStr = monthNum.format('%02d');
  var startDate = ee.String('2025-').cat(mStr).cat('-01');
  var endDate = ee.String('2025-').cat(mStr).cat('-').cat(endDay);
  
  // Load SAR Collection
  var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(bdBoundary)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .select('VV');
  
  var sarMedian = s1.median().clip(bdBoundary);
  
  // CLASS DETERMINATION - Using ee.Number to prevent "missing argument" error
  var sarClassification = sarMedian.lt(threshold).rename('SAR_Class');
  
  // Sample SAR values at Field Points
  var samples = sarClassification.sampleRegions({
    collection: monthPoints,
    properties: ['class'],
    scale: 30,
    geometries: false
  });
  
  var matrix = samples.errorMatrix('class', 'SAR_Class');
  
  return ee.Dictionary({
    'Month': ee.String(ee.List(monthNames).get(monthNum.subtract(1))),
    'OA': matrix.accuracy(),
    'Kappa': matrix.kappa(),
    'Count': monthPoints.size()
  });
}

// 5. RUN VALIDATION ACROSS MONTHS
print('🚀 Running GMM Accuracy Assessment...');

var monthList = ee.List.sequence(1, 12);
var results = monthList.map(function(m) {
  return validateByMonth(m);
});

// 6. DISPLAY RESULTS
results.evaluate(function(stats, error) {
  if (error) {
    print('❌ Error:', error);
    return;
  }
  
  var totalOA = 0;
  var totalKappa = 0;
  
  print('═════════════════════════════════════════════');
  print('   GMM ACCURACY REPORT (2025 FIELD DATA)     ');
  print('═════════════════════════════════════════════');
  
  stats.forEach(function(s) {
    print('📅 ' + s.Month + ': OA=' + (s.OA * 100).toFixed(2) + '% | κ=' + s.Kappa.toFixed(3) + ' | Points=' + s.Count);
    totalOA += s.OA;
    totalKappa += s.Kappa;
  });
  
  print('═════════════════════════════════════════════');
  print('🏆 ANNUAL AVERAGE:');
  print('   Overall Accuracy (OA): ' + ((totalOA / 12) * 100).toFixed(2) + '%');
  print('   Kappa Coefficient (κ): ' + (totalKappa / 12).toFixed(4));
  print('═════════════════════════════════════════════');
});
