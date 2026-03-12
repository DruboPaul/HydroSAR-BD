/************************************************************
 JRC GSW VALIDATION — ALL 6 COMBINATIONS
 SAR-derived water mask vs JRC Global Surface Water
 
 3 Districts × 2 Months = 6 Runs (one at a time)
 
 VALIDATED RESULTS (2020):
 ═══════════════════════════════════════
 Bhola      | January | τ=-17 | OA=98.6% | κ=0.971 | F1=98.5%
 Bhola      | October | τ=-15 | OA=98.4% | κ=0.967 | F1=98.4%
 Sunamganj  | January | τ=-17 | OA=82.0% | κ=0.641 | F1=78.3%
 Sunamganj  | October | τ=-15 | OA=91.7% | κ=0.834 | F1=91.3%
 Dhaka      | January | τ=-17 | OA=91.8% | κ=0.835 | F1=91.1%
 Dhaka      | October | τ=-15 | OA=88.9% | κ=0.777 | F1=87.9%
 ═══════════════════════════════════════
 Average: OA=91.9% | κ=0.838 | F1=90.9%
 
 NOTE: July (monsoon) validation not feasible — JRC GSW lacks
 monsoon-season data for Bangladesh due to Landsat cloud cover.
************************************************************/

var allDistricts = ee.FeatureCollection('FAO/GAUL/2015/level2')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));

var testYear = 2020;

var combos = [
    { district: 'Bhola', monthNum: 1, monthName: 'January', threshold: -17 },
    { district: 'Bhola', monthNum: 10, monthName: 'October', threshold: -15 },
    { district: 'Sunamganj', monthNum: 1, monthName: 'January', threshold: -17 },
    { district: 'Sunamganj', monthNum: 10, monthName: 'October', threshold: -15 },
    { district: 'Dhaka', monthNum: 1, monthName: 'January', threshold: -17 },
    { district: 'Dhaka', monthNum: 10, monthName: 'October', threshold: -15 }
];

function runValidation(c) {
    var distGeom = allDistricts
        .filter(ee.Filter.eq('ADM2_NAME', c.district))
        .first().geometry();

    var mm = c.monthNum < 10 ? '0' + c.monthNum : '' + c.monthNum;

    var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(distGeom)
        .filterDate(testYear + '-' + mm + '-01', testYear + '-' + mm + '-31')
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');

    var sarWater = s1.median().clip(distGeom)
        .lt(c.threshold).toInt().rename('classification');

    var jrc = ee.ImageCollection('JRC/GSW1_4/MonthlyHistory')
        .filter(ee.Filter.calendarRange(testYear, testYear, 'year'))
        .filter(ee.Filter.calendarRange(c.monthNum, c.monthNum, 'month'))
        .first()
        .clip(distGeom);

    var jrcWater = jrc.eq(2).toInt().rename('reference');
    var jrcValid = jrc.gt(0);

    var combined = jrcWater.addBands(sarWater).updateMask(jrcValid);

    var samples = combined.stratifiedSample({
        numPoints: 1500,
        classBand: 'reference',
        region: distGeom,
        scale: 30,
        seed: 42,
        geometries: false
    });

    var cm = samples.errorMatrix('reference', 'classification');

    ee.Dictionary({
        matrix: cm.array(),
        oa: cm.accuracy(),
        kappa: cm.kappa(),
        count: s1.size()
    }).evaluate(function (r, error) {
        if (error) {
            print('❌ ' + c.district + ' | ' + c.monthName + ' — Error: ' + error);
            return;
        }
        print('═══════════════════════════════════════');
        print('📊 ' + c.district + ' | ' + c.monthName + ' ' + testYear +
            ' | τ=' + c.threshold + ' dB | S1=' + r.count + ' images');
        print('   OA = ' + (r.oa * 100).toFixed(1) + '%');
        print('   Kappa = ' + r.kappa.toFixed(3));
        if (r.matrix && r.matrix.length > 1 && r.matrix[1]) {
            var tn = r.matrix[0][0], fp = r.matrix[0][1];
            var fn = r.matrix[1][0], tp = r.matrix[1][1];
            var prec = tp / (tp + fp);
            var rec = tp / (tp + fn);
            var f1 = 2 * prec * rec / (prec + rec);
            print('   F1 = ' + (f1 * 100).toFixed(1) + '%');
            print('   TP=' + tp + ' TN=' + tn + ' FP=' + fp + ' FN=' + fn);
        }
        print('═══════════════════════════════════════');
    });
}

// === Run all 6 combinations ===
combos.forEach(runValidation);
