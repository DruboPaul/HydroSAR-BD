/* -------------------- Datasets -------------------- */
var districts = ee.FeatureCollection('FAO/GAUL/2015/level2')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));
var divisions = ee.FeatureCollection('FAO/GAUL/2015/level1')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bangladesh'));
var bdBoundary = ee.FeatureCollection('projects/ee-mbokshi45/assets/bdshp');

/* -------------------- Parameters -------------------- */
var monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
    'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
};
var monthEndDays = {
    'January': '31', 'February': '28', 'March': '31', 'April': '30', 'May': '31', 'June': '30',
    'July': '31', 'August': '31', 'September': '30', 'October': '31', 'November': '30', 'December': '31'
};

var yearList = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];

/* -------------------- Map settings -------------------- */
Map.setOptions('ROADMAP');

/* -------------------- UI -------------------- */
var mainPanel = ui.Panel({
    style: {
        position: 'top-right',
        padding: '6px',
        backgroundColor: '#ffffff',
        color: '#000000',
        width: '550px',
        height: '640px',
        border: '1px solid #d0d0d0'
    },
    layout: ui.Panel.Layout.flow('vertical')
});

function greyRow() {
    return ui.Panel({
        layout: ui.Panel.Layout.flow('vertical'),
        style: { width: '100%', backgroundColor: '#ececec', padding: '2px 3px', margin: '3px 0' }
    });
}
function contentRow() {
    return ui.Panel({ layout: ui.Panel.Layout.flow('horizontal'), style: { width: '100%' } });
}

var selectStyle = { color: 'black', fontSize: '13px', padding: '2px 3px', margin: '2px' };
var buttonStyle = { backgroundColor: '#f3f3f3', color: 'black', fontSize: '13px', padding: '4px 6px', border: '0px' };

/* Title */
var titleRow = greyRow();
titleRow.add(ui.Label('SAR based Surface Water Explorer (Peak Mode)', { fontWeight: 'bold', fontSize: '14px', margin: '2px' }));
mainPanel.add(titleRow);

/* Division / District row */
var regionRow = greyRow();
var regionContent = contentRow();
var divisionSelect = ui.Select({ items: divisions.aggregate_array('ADM1_NAME').getInfo().sort(), placeholder: 'Division', style: selectStyle });
var districtSelect = ui.Select({ items: [], placeholder: 'District', style: selectStyle });
divisionSelect.style().set({ width: '250px', margin: '2px' });
districtSelect.style().set({ width: '250px', margin: '2px' });
regionContent.add(divisionSelect);
regionContent.add(districtSelect);
regionRow.add(regionContent);
mainPanel.add(regionRow);

/* --- RESULT BOX --- */
var resultRow = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal'), style: { width: '100%', backgroundColor: '#ececec', padding: '2px 3px', margin: '3px 0' } });
resultRow.add(ui.Label('Result', { width: '140px' }));
var resultBox = ui.Label('', { width: '440px' });
resultRow.add(resultBox);

/* Monthly row */
var monthlyRow = greyRow();
var monthlyContent = contentRow();
var yearSelect = ui.Select({ items: yearList, value: '2023', style: selectStyle });
var monthsList = Object.keys(monthMap);
var monthsWithTotal = monthsList.slice();
monthsWithTotal.push('Total Occurrence');
var monthSelect = ui.Select({ items: monthsWithTotal, placeholder: 'Month/Total', style: selectStyle });
var monthlyBtn = ui.Button({ label: 'Monthly Surface Water', style: buttonStyle });

yearSelect.style().set({ width: '234px', margin: '2px' });
monthSelect.style().set({ width: '120px', margin: '2px' });
monthlyBtn.style().set({ width: '140px', margin: '2px' });

monthlyContent.add(yearSelect);
monthlyContent.add(monthSelect);
monthlyContent.add(monthlyBtn);
monthlyRow.add(monthlyContent);
mainPanel.add(monthlyRow);

/* Change row */
var changeRow = greyRow();
var changeContent = contentRow();
var visYear1 = ui.Select({ items: yearList, value: '2019', style: selectStyle });
var visYear2 = ui.Select({ items: yearList, value: '2023', style: selectStyle });
var visMonthSelect = ui.Select({ items: monthsList, placeholder: 'Month', style: selectStyle });
var changeBtn = ui.Button({ label: 'Change Intensity', style: buttonStyle });

visYear1.style().set({ width: '140px', margin: '2px' });
visYear2.style().set({ width: '140px', margin: '2px' });
visMonthSelect.style().set({ width: '110px', margin: '2px' });
changeBtn.style().set({ width: '120px', margin: '2px' });

changeContent.add(visYear1);
changeContent.add(visYear2);
changeContent.add(visMonthSelect);
changeContent.add(changeBtn);
changeRow.add(changeContent);
mainPanel.add(changeRow);

/* Seasonal row */
var seasonRow = greyRow();
var seasonContent = contentRow();
var seasonalYear = ui.Select({ items: yearList, value: '2023', style: selectStyle });
var seasonSelect = ui.Select({ items: ['Dry Winter (Dec–Feb)', 'Pre-Monsoon (Mar–May)', 'Monsoon (Jun–Sep)', 'Post-Monsoon (Oct–Nov)'], placeholder: 'Season', style: selectStyle });
var seasonalBtn = ui.Button({ label: 'Seasonal Variance', style: buttonStyle });

seasonalYear.style().set({ width: '140px', margin: '2px' });
seasonSelect.style().set({ width: '170px', margin: '2px' });
seasonalBtn.style().set({ width: '120px', margin: '2px' });

seasonContent.add(seasonalYear);
seasonContent.add(seasonSelect);
seasonContent.add(seasonalBtn);
seasonRow.add(seasonContent);
mainPanel.add(seasonRow);

/* Actions row */
var actionsRow = greyRow();
var actionsContent = contentRow();
var genChartBtn = ui.Button({ label: 'Generate Chart', style: buttonStyle });
var geoBtn = ui.Button({ label: 'GeoTIFF Download', style: buttonStyle });
var aboutBtn = ui.Button({ label: 'About', style: buttonStyle });
var resetBtn = ui.Button({ label: 'Reset', style: buttonStyle });

genChartBtn.style().set({ width: '140px', margin: '2px' });
geoBtn.style().set({ width: '160px', margin: '2px' });
aboutBtn.style().set({ width: '100px', margin: '2px' });
resetBtn.style().set({ width: '100px', margin: '2px' });

actionsContent.add(genChartBtn);
actionsContent.add(geoBtn);
actionsContent.add(aboutBtn);
actionsContent.add(resetBtn);
actionsRow.add(actionsContent);
mainPanel.add(actionsRow);

mainPanel.add(resultRow);

/* Chart area */
var chartPanel = ui.Panel({
    style: { width: '100%', height: '240px', padding: '6px 6px 0 6px', backgroundColor: '#fff', border: '1px solid #e8e8e8', margin: '6px 0 0 0' },
    layout: ui.Panel.Layout.flow('vertical')
});
mainPanel.add(chartPanel);

Map.clear(); Map.add(mainPanel);
Map.centerObject(bdBoundary, 7);

/* -------------------- Legend helpers -------------------- */
function makeOccurrenceRamp(title, colors) {
    var p = ui.Panel({ style: { position: 'bottom-left', padding: '6px', backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.15)' } });
    p.add(ui.Label(title, { fontWeight: 'bold' }));
    var ramp = ui.Panel({ layout: ui.Panel.Layout.Flow('horizontal'), style: { margin: '6px 0 0 0' } });
    colors.forEach(function (c) {
        ramp.add(ui.Label('', { width: '18px', height: '12px', margin: '0 1px 0 0', backgroundColor: c }));
    });
    var caption = ui.Label('Low → High', { margin: '6px 0 0 6px', fontSize: '11px' });
    var wrapper = ui.Panel({ layout: ui.Panel.Layout.Flow('horizontal') });
    wrapper.add(ramp);
    wrapper.add(caption);
    p.add(wrapper);
    return p;
}

var occurrenceColors = ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494'];
var legendS1 = makeOccurrenceRamp('Occurrence', occurrenceColors);

function makeLegendPanel(title, entries) {
    var p = ui.Panel({ style: { position: 'bottom-left', padding: '6px', backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.15)' } });
    p.add(ui.Label(title, { fontWeight: 'bold' }));
    entries.forEach(function (e) {
        var r = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal') });
        r.add(ui.Label('', { width: '14px', height: '12px', margin: '0 6px 0 0', backgroundColor: e.color }));
        r.add(ui.Label(e.label));
        p.add(r);
    });
    return p;
}

var legendChange = makeLegendPanel('Change Intensity', [{ color: '#fc8d59', label: 'Lost' }, { color: '#e0e0e0', label: 'Stable' }, { color: '#91bfdb', label: 'Gained' }]);

function hideAllLegends() { try { Map.remove(legendS1); } catch (e) { }; try { Map.remove(legendChange); } catch (e) { }; }

/* -------------------- Region helpers -------------------- */
function drawRegionBoundaryOnly(regionFeat, label) {
    try {
        var styled = ee.Feature(regionFeat).style({ color: 'FF0000', width: 3, fillColor: '00000000' });
        Map.addLayer(styled, {}, label || 'Boundary', false);
    } catch (e) {
        Map.addLayer(ee.Feature(regionFeat), { color: 'FF0000', width: 3, fillColor: '00000000' }, label || 'Boundary', false);
    }
}

divisionSelect.onChange(function (v) {
    if (!v) {
        districtSelect.items().reset([]);
        return;
    }
    var filtered = districts.filter(ee.Filter.eq('ADM1_NAME', v));
    districtSelect.items().reset(filtered.aggregate_array('ADM2_NAME').getInfo().sort());

    try {
        var divFeat = divisions.filter(ee.Filter.eq('ADM1_NAME', v)).first();
        Map.clear(); Map.add(mainPanel);
        drawRegionBoundaryOnly(divFeat, v + ' Division');
        Map.centerObject(divFeat.geometry(), 8);
    } catch (err) { }
});

districtSelect.onChange(function (v) {
    if (!v) {
        var div = divisionSelect.getValue();
        if (div) {
            var divFeat = divisions.filter(ee.Filter.eq('ADM1_NAME', div)).first();
            Map.clear(); Map.add(mainPanel);
            drawRegionBoundaryOnly(divFeat, div + ' Division');
            Map.centerObject(divFeat.geometry(), 8);
        }
        return;
    }
    try {
        var distFeat = districts.filter(ee.Filter.eq('ADM2_NAME', v)).first();
        Map.clear(); Map.add(mainPanel);
        drawRegionBoundaryOnly(distFeat, v + ' District');
        Map.centerObject(distFeat.geometry(), 9);
    } catch (err) { }
});

function getRegionFeature(selDistrict, selDivision) {
    if (selDistrict) return { feature: districts.filter(ee.Filter.eq('ADM2_NAME', selDistrict)).first(), name: selDistrict + ' District' };
    if (selDivision) return { feature: divisions.filter(ee.Filter.eq('ADM1_NAME', selDivision)).first(), name: selDivision + ' Division' };
    return { feature: bdBoundary.first(), name: 'Bangladesh (country)' };
}

/* -------------------- FIND PEAK (Highest Pixel Count in Water Range) FUNCTION -------------------- */
function findPeakMask(image, geometry) {
    // Get histogram
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
    var numBins = counts.length();
    var bucketWidth = ee.Number(hist.get('bucketWidth'));

    // Find the index of the maximum count ONLY in water range (< -12 dB)
    var indices = ee.List.sequence(0, numBins.subtract(1));

    var result = indices.iterate(function (i, acc) {
        i = ee.Number(i);
        acc = ee.Dictionary(acc);
        var currentMean = ee.Number(means.get(i));
        var currentCount = ee.Number(counts.get(i));
        var bestCount = ee.Number(acc.get('bestCount'));

        // Only consider bins where mean < -12 dB (water range)
        var isWaterRange = currentMean.lt(-12);
        var isBetter = currentCount.gt(bestCount);
        var shouldUpdate = isWaterRange.and(isBetter);

        return ee.Dictionary({
            bestCount: ee.Algorithms.If(shouldUpdate, currentCount, bestCount),
            peakIndex: ee.Algorithms.If(shouldUpdate, i, acc.get('peakIndex')),
            peakDb: ee.Algorithms.If(shouldUpdate, currentMean, acc.get('peakDb'))
        });
    }, ee.Dictionary({ bestCount: 0, peakIndex: -1, peakDb: -20 }));

    var peakDb = ee.Number(ee.Dictionary(result).get('peakDb'));
    var peakIndex = ee.Number(ee.Dictionary(result).get('peakIndex'));

    // Check if we found a valid peak
    var hasPeak = peakIndex.gte(0);

    // Create mask: only pixels within this single bucket (Peak ± half bucket width)
    var halfWidth = bucketWidth.divide(2);
    var lower = peakDb.subtract(halfWidth);
    var upper = peakDb.add(halfWidth);

    // If no water peak found, return empty mask
    var mask = ee.Image(ee.Algorithms.If(hasPeak,
        image.gte(lower).and(image.lte(upper)),
        ee.Image(0)
    ));

    return {
        mask: mask,
        peak: peakDb,
        lower: lower,
        upper: upper,
        hasPeak: hasPeak
    };
}

/* -------------------- Processing helpers -------------------- */
function imageAreaKm2(binaryImage, regionGeom, scale, tileScale) {
    scale = scale || 30;
    tileScale = tileScale || 4;
    var areaImage = ee.Image.pixelArea().multiply(ee.Image(binaryImage));
    var sum = areaImage.reduceRegion({
        reducer: ee.Reducer.sum(),
        geometry: regionGeom,
        scale: scale,
        maxPixels: 1e13,
        tileScale: tileScale
    });
    var vals = ee.Dictionary(sum);
    var val = ee.Algorithms.If(vals.size().gt(0), ee.Number(vals.values().get(0)), 0);
    return ee.Number(val).divide(1e6);
}

/* -------------------- Operations (Peak Mode) -------------------- */
function runMonthly() {
    chartPanel.clear(); hideAllLegends();
    resultBox.setValue('');
    var selDiv = divisionSelect.getValue(); var selDist = districtSelect.getValue();
    var selYear = parseInt(yearSelect.getValue()); var selMonth = monthSelect.getValue();

    if (!selYear) { resultBox.setValue('Select year'); return; }
    if (!selMonth) { resultBox.setValue('Select month or Total'); return; }
    var regionInfo = getRegionFeature(selDist, selDiv);
    var regionGeom = ee.Feature(regionInfo.feature).geometry();

    Map.clear(); Map.add(mainPanel);
    Map.centerObject(regionGeom, 8);

    try {
        if (selMonth === 'Total Occurrence') {
            var months = Object.keys(monthMap);
            var countImg = ee.Image(0);

            months.forEach(function (m) {
                var start = selYear + '-' + monthMap[m] + '-01';
                var end = selYear + '-' + monthMap[m] + '-' + monthEndDays[m];
                var mcol = ee.ImageCollection('COPERNICUS/S1_GRD')
                    .filterBounds(regionGeom)
                    .filterDate(start, end)
                    .filter(ee.Filter.eq('instrumentMode', 'IW'))
                    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
                    .select('VV');

                var safeMed = ee.Image(ee.Algorithms.If(mcol.size().gt(0), mcol.median(), ee.Image(0))).clip(regionGeom);
                var result = findPeakMask(safeMed, regionGeom);
                countImg = countImg.add(result.mask.unmask(0));
            });

            Map.addLayer(countImg.updateMask(countImg.gt(0)), { min: 1, max: 12, palette: occurrenceColors }, regionInfo.name + ' occurrence ' + selYear);
            Map.add(legendS1);
            drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
            resultBox.setValue('Total occurrence (Peak Mode): ' + selYear);

        } else {
            var start = selYear + '-' + monthMap[selMonth] + '-01';
            var end = selYear + '-' + monthMap[selMonth] + '-' + monthEndDays[selMonth];
            var s1col = ee.ImageCollection('COPERNICUS/S1_GRD')
                .filterBounds(regionGeom)
                .filterDate(start, end)
                .filter(ee.Filter.eq('instrumentMode', 'IW'))
                .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
                .select('VV');

            var count = s1col.size().getInfo();
            if (count === 0) {
                resultBox.setValue('No Sentinel-1 images for ' + selMonth + ' ' + selYear + ' in selected region.');
                return;
            }

            var vvMedian = s1col.median().clip(regionGeom);
            var result = findPeakMask(vvMedian, regionGeom);

            Map.addLayer(result.mask.updateMask(result.mask), { palette: ['0000FF'] }, regionInfo.name + ' ' + selMonth + ' ' + selYear);
            drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');

            ee.Dictionary({ peak: result.peak, lower: result.lower, upper: result.upper }).evaluate(function (res) {
                resultBox.setValue('Peak: ' + res.peak.toFixed(2) + ' dB [' + res.lower.toFixed(2) + ' to ' + res.upper.toFixed(2) + '] — ' + selMonth + ' ' + selYear);
            });
        }
    } catch (err) {
        resultBox.setValue('Monthly error: ' + err.message);
    }
}

function runChange() {
    chartPanel.clear(); hideAllLegends();
    resultBox.setValue('');
    var selDiv = divisionSelect.getValue(); var selDist = districtSelect.getValue();
    var y1 = parseInt(visYear1.getValue()); var y2 = parseInt(visYear2.getValue()); var m = visMonthSelect.getValue();

    if (!y1 || !y2) { resultBox.setValue('Select Year1 and Year2'); return; }
    if (!m) { resultBox.setValue('Select month'); return; }
    var regionInfo = getRegionFeature(selDist, selDiv);
    var regionGeom = ee.Feature(regionInfo.feature).geometry();

    Map.clear(); Map.add(mainPanel);
    Map.centerObject(regionGeom, 8);

    try {
        var start1 = y1 + '-' + monthMap[m] + '-01'; var end1 = y1 + '-' + monthMap[m] + '-' + monthEndDays[m];
        var start2 = y2 + '-' + monthMap[m] + '-01'; var end2 = y2 + '-' + monthMap[m] + '-' + monthEndDays[m];
        var col1 = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(regionGeom).filterDate(start1, end1)
            .filter(ee.Filter.eq('instrumentMode', 'IW')).filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')).select('VV');
        var col2 = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(regionGeom).filterDate(start2, end2)
            .filter(ee.Filter.eq('instrumentMode', 'IW')).filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')).select('VV');
        var c1 = col1.size().getInfo(); var c2 = col2.size().getInfo();
        if (c1 === 0 && c2 === 0) {
            resultBox.setValue('No Sentinel-1 images for selected month in both years in this region.');
            return;
        }

        var med1 = col1.median().clip(regionGeom);
        var med2 = col2.median().clip(regionGeom);

        var result1 = findPeakMask(med1, regionGeom);
        var result2 = findPeakMask(med2, regionGeom);

        var mask1 = result1.mask;
        var mask2 = result2.mask;

        var lost = mask1.and(mask2.not());
        var stable = mask1.and(mask2);
        var gained = mask2.and(mask1.not());

        var changeClass = ee.Image(0)
            .where(lost.eq(1), 1)
            .where(stable.eq(1), 2)
            .where(gained.eq(1), 3)
            .toUint8();

        Map.addLayer(changeClass.updateMask(changeClass.gt(0)), { min: 1, max: 3, palette: ['#fc8d59', '#e0e0e0', '#91bfdb'] }, 'Change ' + y1 + '→' + y2 + ' ' + m);
        Map.add(legendChange);
        drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
        resultBox.setValue('Change (Peak Mode) — ' + y1 + ' → ' + y2 + ' in ' + m);

    } catch (err) {
        resultBox.setValue('Change error: ' + err.message);
    }
}

function runSeasonal() {
    chartPanel.clear(); hideAllLegends();
    resultBox.setValue('');
    var selDiv = divisionSelect.getValue(); var selDist = districtSelect.getValue();
    var y = parseInt(seasonalYear.getValue()); var s = seasonSelect.getValue();

    if (!y) { resultBox.setValue('Select year'); return; }
    if (!s) { resultBox.setValue('Select season'); return; }
    var regionInfo = getRegionFeature(selDist, selDiv);
    var regionGeom = ee.Feature(regionInfo.feature).geometry();

    Map.clear(); Map.add(mainPanel);
    Map.centerObject(regionGeom, 8);

    try {
        var seasonKey = s.indexOf('Dry') === 0 ? 'dry' : s.indexOf('Pre') === 0 ? 'pre' : s.indexOf('Monsoon') === 0 ? 'mon' : 'post';
        var seasonMonths = { 'dry': ['December', 'January', 'February'], 'pre': ['March', 'April', 'May'], 'mon': ['June', 'July', 'August', 'September'], 'post': ['October', 'November'] };
        var months = seasonMonths[seasonKey];

        var unionMask = ee.Image(0);
        var totalImages = 0;

        months.forEach(function (mo) {
            var start = y + '-' + monthMap[mo] + '-01';
            var end = y + '-' + monthMap[mo] + '-' + monthEndDays[mo];
            var col = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(regionGeom).filterDate(start, end)
                .filter(ee.Filter.eq('instrumentMode', 'IW')).filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')).select('VV');
            var cnt = col.size().getInfo();
            totalImages += cnt;
            if (cnt > 0) {
                var med = col.median().clip(regionGeom);
                var result = findPeakMask(med, regionGeom);
                unionMask = unionMask.max(result.mask.unmask(0));
            }
        });

        if (totalImages === 0) {
            resultBox.setValue('No Sentinel-1 images for the chosen season/year in this region.');
            return;
        }

        var unionMaskMasked = unionMask.updateMask(unionMask).clip(regionGeom);
        Map.addLayer(unionMaskMasked, { palette: ['0000FF'] }, regionInfo.name + ' ' + s + ' ' + y);
        drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
        resultBox.setValue('Seasonal (Peak Mode): ' + s + ' ' + y);
    } catch (err) {
        resultBox.setValue('Seasonal error: ' + err.message);
    }
}

/* -------------------- Chart -------------------- */
function genChart() {
    chartPanel.clear();
    resultBox.setValue('');

    var SCALE = 1000;

    var selDiv = divisionSelect.getValue(); var selDist = districtSelect.getValue();
    var regionInfo = getRegionFeature(selDist, selDiv);
    var regionGeom = ee.Feature(regionInfo.feature).geometry();

    try {
        var y1 = visYear1.getValue() ? parseInt(visYear1.getValue()) : null;
        var y2 = visYear2.getValue() ? parseInt(visYear2.getValue()) : null;
        var changeMonth = visMonthSelect.getValue();

        var seasonalY = seasonalYear.getValue() ? parseInt(seasonalYear.getValue()) : null;
        var seasonalS = seasonSelect.getValue();

        var monthlyY = yearSelect.getValue() ? parseInt(yearSelect.getValue()) : null;

        function monthlyMaskFor(year, monthName) {
            var start = year + '-' + monthMap[monthName] + '-01';
            var end = year + '-' + monthMap[monthName] + '-' + monthEndDays[monthName];
            var col = ee.ImageCollection('COPERNICUS/S1_GRD')
                .filterBounds(regionGeom)
                .filterDate(start, end)
                .filter(ee.Filter.eq('instrumentMode', 'IW'))
                .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
                .select('VV');

            var med = ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0));
            med = ee.Image(med).clip(regionGeom);

            var result = findPeakMask(med, regionGeom);
            return result.mask;
        }

        // === Change chart ===
        if (y1 && y2 && changeMonth) {
            chartPanel.add(ui.Label('Generating change chart (Peak Mode) for ' + changeMonth + ' — ' + y1 + ' → ' + y2));

            var med1 = monthlyMaskFor(y1, changeMonth).rename('mask1');
            var med2 = monthlyMaskFor(y2, changeMonth).rename('mask2');

            var lost = med1.and(med2.not()).rename('lost');
            var stable = med1.and(med2).rename('stable');
            var gained = med2.and(med1.not()).rename('gained');

            var lostArea = imageAreaKm2(lost, regionGeom, SCALE);
            var stableArea = imageAreaKm2(stable, regionGeom, SCALE);
            var gainedArea = imageAreaKm2(gained, regionGeom, SCALE);

            var areasList = ee.List([lostArea, stableArea, gainedArea]);
            var labels = ee.List(['Lost', 'Stable', 'Gained']);

            var arr = ee.Array(areasList);
            var chart = ui.Chart.array.values(arr, 0, labels)
                .setChartType('ColumnChart')
                .setOptions({
                    title: 'Change water area (km²) — ' + changeMonth + ' (' + y1 + ' → ' + y2 + ') — ' + regionInfo.name,
                    vAxis: { title: 'Area (km²)' },
                    hAxis: { title: 'Change class' },
                    legend: { position: 'none' },
                    fontSize: 12
                });

            chartPanel.clear();
            chartPanel.add(chart);
            resultBox.setValue('Change chart generated.');
            return;
        }

        // === Seasonal chart ===
        if (seasonalY && seasonalS) {
            chartPanel.add(ui.Label('Generating seasonal chart (Peak Mode) for ' + seasonalY + ' — ' + regionInfo.name));

            var seasonMonthsMap = {
                'Dry Winter (Dec–Feb)': ['December', 'January', 'February'],
                'Pre-Monsoon (Mar–May)': ['March', 'April', 'May'],
                'Monsoon (Jun–Sep)': ['June', 'July', 'August', 'September'],
                'Post-Monsoon (Oct–Nov)': ['October', 'November']
            };

            var seasonNames = ['Dry Winter (Dec–Feb)', 'Pre-Monsoon (Mar–May)', 'Monsoon (Jun–Sep)', 'Post-Monsoon (Oct–Nov)'];
            var seasonAreas = seasonNames.map(function (snm) {
                var months = seasonMonthsMap[snm];
                var unionMask = ee.Image(0);
                months.forEach(function (mo) {
                    var mask = monthlyMaskFor(seasonalY, mo);
                    unionMask = unionMask.max(mask.unmask(0));
                });
                var unionMaskClipped = unionMask.updateMask(unionMask).clip(regionGeom);
                return imageAreaKm2(unionMaskClipped, regionGeom, SCALE);
            });

            var seasonAreasEE = ee.List(seasonAreas);
            var seasonArr = ee.Array(seasonAreasEE);
            var chart = ui.Chart.array.values(seasonArr, 0, ee.List(seasonNames))
                .setChartType('ColumnChart')
                .setOptions({
                    title: 'Seasonal water area (km²) — ' + seasonalY + ' — ' + regionInfo.name,
                    vAxis: { title: 'Area (km²)' },
                    hAxis: { title: 'Season' },
                    legend: { position: 'none' },
                    fontSize: 12
                });

            chartPanel.clear();
            chartPanel.add(chart);
            resultBox.setValue('Seasonal chart generated.');
            return;
        }

        // === Monthly chart ===
        if (monthlyY) {
            chartPanel.add(ui.Label('Generating monthly chart (Peak Mode) for ' + monthlyY + ' — ' + regionInfo.name));

            var months = Object.keys(monthMap);

            var monthAreas = months.map(function (m) {
                var mask = monthlyMaskFor(monthlyY, m);
                var clipped = mask.updateMask(mask).clip(regionGeom);
                return imageAreaKm2(clipped, regionGeom, SCALE);
            });

            var monthAreasEE = ee.List(monthAreas);
            var monthArr = ee.Array(monthAreasEE);
            var monthLabels = ee.List(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);

            var chart = ui.Chart.array.values(monthArr, 0, monthLabels)
                .setChartType('ColumnChart')
                .setOptions({
                    title: 'Monthly water area (km²) — ' + monthlyY + ' — ' + regionInfo.name,
                    vAxis: { title: 'Area (km²)' },
                    hAxis: { title: 'Month' },
                    legend: { position: 'none' },
                    fontSize: 11,
                    bar: { groupWidth: '60%' }
                });

            chartPanel.clear();
            chartPanel.add(chart);
            resultBox.setValue('Monthly chart generated.');
            return;
        }

        resultBox.setValue('Select either: a Year (for Monthly), or Year1+Year2+Month (for Change), or Season+Year (for Seasonal) and try again.');
    } catch (err) {
        chartPanel.clear();
        resultBox.setValue('Chart error: ' + err.message);
    }
}

function aboutAction() {
    var ap = ui.Panel({ style: { position: 'top-center', padding: '6px', backgroundColor: '#fff', border: '1px solid #ccc' } });
    ap.add(ui.Label('About SAR-based Surface Water Explorer', { fontWeight: 'bold' }));
    ap.add(ui.Label('Sentinel-1 (VV) Peak Mode: Shows only the highest pixel count point.'));
    ap.add(ui.Label('This method shows the most dominant backscatter value in the image.'));
    ap.add(ui.Button('Close', function () { Map.remove(ap); }));
    Map.add(ap);
}
function resetAction() {
    divisionSelect.setValue(null); districtSelect.items().reset([]);
    yearSelect.setValue('2023'); monthSelect.setValue(null);
    visYear1.setValue('2019'); visYear2.setValue('2023'); visMonthSelect.setValue(null);
    seasonalYear.setValue('2023'); seasonSelect.setValue(null);
    chartPanel.clear(); resultBox.setValue('');
    Map.clear(); Map.add(mainPanel); hideAllLegends(); Map.centerObject(bdBoundary, 7);
}

Map.clear(); Map.add(mainPanel);
Map.centerObject(bdBoundary, 7);

monthlyBtn.onClick(runMonthly);
changeBtn.onClick(runChange);
seasonalBtn.onClick(runSeasonal);
genChartBtn.onClick(genChart);
geoBtn.onClick(function () { chartPanel.clear(); chartPanel.add(ui.Label('GeoTIFF export not implemented')); });
aboutBtn.onClick(aboutAction);
resetBtn.onClick(resetAction);
