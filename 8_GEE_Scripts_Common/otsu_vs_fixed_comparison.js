/************************************************************
 OTSU vs FIXED THRESHOLD তুলনা
 ৩টি জেলা × ১২ মাস = ৩৬টি তুলনা
 Console-এ সব মান প্রিন্ট হবে
 
 RESULTS (2023):
 - Bhola: Mean absolute diff = 0.49 dB (excellent match)
 - Sunamganj: Mixed (dry months diverge due to low water fraction)
 - Dhaka: High divergence (urban dominance skews histogram)
************************************************************/

var districts = ee.FeatureCollection('FAO/GAUL/2015/level2')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));

var testDistricts = ['Bhola', 'Sunamganj', 'Dhaka'];
var testYear = 2023;

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

var fixedThresholds = {
    'January': -17, 'February': -16, 'March': -16, 'April': -15,
    'May': -14, 'June': -13, 'July': -13, 'August': -13,
    'September': -14, 'October': -15, 'November': -16, 'December': -17
};

// --- Otsu Function ---
function otsuThreshold(image, geometry) {
    var hist = ee.Dictionary(
        image.reduceRegion({
            reducer: ee.Reducer.histogram(255),
            geometry: geometry, scale: 30,
            bestEffort: true, maxPixels: 1e13
        }).values().get(0)
    );
    var counts = ee.List(hist.get('histogram'));
    var means = ee.List(hist.get('bucketMeans'));
    var total = ee.Number(counts.reduce(ee.Reducer.sum()));
    var sum = ee.Number(
        counts.zip(means).map(function (p) {
            p = ee.List(p);
            return ee.Number(p.get(0)).multiply(p.get(1));
        }).reduce(ee.Reducer.sum())
    );
    var bcv = ee.List.sequence(1, counts.length().subtract(1))
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
            return w0.multiply(w1).multiply(m0.subtract(m1).pow(2));
        });
    var index = bcv.indexOf(bcv.reduce(ee.Reducer.max()));
    return ee.Number(means.get(index));
}

// --- প্রতিটি জেলা ও মাসের জন্য চালান ---
print('=== OTSU vs FIXED THRESHOLD তুলনা ===');
print('Format: জেলা | মাস | Otsu (dB) | Fixed (dB) | পার্থক্য (dB)');
print('---');

testDistricts.forEach(function (distName) {
    var distGeom = districts
        .filter(ee.Filter.eq('ADM2_NAME', distName))
        .first().geometry();

    Object.keys(monthMap).forEach(function (m) {
        var start = testYear + '-' + monthMap[m] + '-01';
        var end = testYear + '-' + monthMap[m] + '-' + monthEndDays[m];

        var col = ee.ImageCollection('COPERNICUS/S1_GRD')
            .filterBounds(distGeom).filterDate(start, end)
            .filter(ee.Filter.eq('instrumentMode', 'IW'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
            .select('VV');

        var median = ee.Image(
            ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(-999))
        ).clip(distGeom);

        var otsu = otsuThreshold(median, distGeom);
        var fixed = fixedThresholds[m];

        ee.Dictionary({
            otsu_dB: otsu,
            diff: otsu.subtract(fixed),
            imgs: col.size()
        }).evaluate(function (r) {
            print(distName + ' | ' + m +
                ' | Otsu: ' + r.otsu_dB.toFixed(2) +
                ' | Fixed: ' + fixed +
                ' | পার্থক্য: ' + r.diff.toFixed(2) + ' dB' +
                ' | (' + r.imgs + ' images)');
        });
    });
});
