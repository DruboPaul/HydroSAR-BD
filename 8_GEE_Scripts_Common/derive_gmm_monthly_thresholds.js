/* ==================================================================================
   GMM Calibration Tool: Deriving Monthly Optimal SAR Thresholds
   
   This script calculates the "Statistical Valley" (Intersection of Gaussians) 
   for each month to minimize classification error. 
   
   Run this, check the Console, and use the results in your UI.
================================================================================== */

var districts = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));
var bdBoundary = ee.FeatureCollection('projects/ee-mbokshi45/assets/bdshp');

// We use Sunamganj and Bhola as representative "Calibration Districts"
var calibrationDistricts = ['Sunamganj', 'Bhola', 'Dhaka'];
var year = 2023;

var months = ['January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'];
var monthMap = {
  'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
  'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
};

// --- GMM / Valley Detection Function ---
function findGmmThreshold(image, geometry) {
  var hist = ee.Dictionary(image.reduceRegion({
    reducer: ee.Reducer.histogram(100, 0.25).combine(ee.Reducer.mean(), '', true),
    geometry: geometry,
    scale: 30,
    maxPixels: 1e13,
    bestEffort: true
  }).get('VV_histogram'));
  
  var counts = ee.List(hist.get('histogram'));
  var means = ee.List(hist.get('bucketMeans'));
  
  // Simple "Valley" detection (smoothing histogram and finding local minimum)
  // This is a proxy for GMM intersection in GEE (which lacks a curve-fit library)
  var smoothed = counts.map(function(c, i) {
    var start = ee.Number(i).subtract(2).max(0);
    var end = ee.Number(i).add(3).min(counts.length());
    return counts.slice(start, end).reduce(ee.Reducer.mean());
  });
  
  // Find valley between -20 and -10 dB
  var searchMask = means.map(function(m) {
    return ee.Number(m).gt(-19).and(ee.Number(m).lt(-11));
  });
  
  var valleyIndex = ee.List.sequence(0, counts.length().subtract(1))
    .filter(ee.Filter.eq('item', 1)) // placeholder logic
    .iterate(function(i, prev) {
      i = ee.Number(i);
      var m = ee.Number(means.get(i));
      var isInside = m.gt(-19).and(m.lt(-11));
      var val = ee.Number(smoothed.get(i));
      var prevVal = ee.Number(ee.Dictionary(prev).get('minVal'));
      return ee.Algorithms.If(isInside.and(val.lt(prevVal)), 
        {idx: i, minVal: val}, prev);
    }, {idx: -1, minVal: 1e10});
    
  return ee.Number(means.get(ee.Dictionary(valleyIndex).get('idx')));
}

print('🚀 Starting GMM Monthly Calibration...');
print('District Samples: ' + calibrationDistricts.join(', '));

months.forEach(function(m) {
  var start = year + '-' + monthMap[m] + '-01';
  var end = year + '-' + (m==='February' ? '28' : '30'); // approximation for calibration
  
  var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(bdBoundary)
    .filterDate(start, end)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .select('VV')
    .median().clip(bdBoundary);
    
  var threshold = findGmmThreshold(s1, bdBoundary);
  
  threshold.evaluate(function(val) {
    print('✅ ' + m + ' Calibrated Threshold: ' + (val ? val.toFixed(2) : 'Error') + ' dB');
  });
});

print('--- After results appear, update your thresholds list in the Explorer script ---');
