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
var thresholds = {
    'January': -17, 'February': -16, 'March': -16, 'April': -15, 'May': -14, 'June': -13,
    'July': -13, 'August': -13, 'September': -14, 'October': -15, 'November': -16, 'December': -17
};
var yearList = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];

/* -------------------- Multi-band GeoTIFF Holders -------------------- */
var multiBandMonthlyImage = null;   // 12-band monthly water
var multiBandOccurrenceImage = null; // annual occurrence
var lastExportRegion = null;        // geometry for export
var lastExportRegionName = null;    // name for file naming
var lastExportYear = null;          // year for file naming

/* -------------------- Color Palettes for ArcMap-ready GeoTIFFs -------------------- */
var waterPalette = ['0000FF'];  // Single blue for monthly water (binary: 0/1)
var occurrencePalette = [
    'F7FBFF',  // 0 - No water (will be masked)
    'DEEBF7',  // 1 - Rare water
    'C6DBEF',  // 2
    '9ECAE1',  // 3
    '6BAED6',  // 4
    '4292C6',  // 5
    '2171B5',  // 6
    '08519C',  // 7
    '08306B',  // 8
    '041F4A',  // 9
    '031232',  // 10
    '020B1F',  // 11
    '000814'   // 12 - Permanent water
];

/* -------------------- Export Format Options -------------------- */
var exportFormats = ['Multi-band (Single File)', 'Single-band Split (13 Files)', 'Single-band with ColorMap'];
var selectedExportFormat = 'Multi-band (Single File)';

/* -------------------- Map settings -------------------- */
Map.setOptions('ROADMAP');

/* -------------------- UI: compact, updated widths -------------------- */
/* Main panel */
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

/* Small helpers */
function greyRow() {
    return ui.Panel({
        layout: ui.Panel.Layout.flow('vertical'),
        style: { width: '100%', backgroundColor: '#ececec', padding: '2px 3px', margin: '3px 0' }
    });
}
function contentRow() {
    return ui.Panel({ layout: ui.Panel.Layout.flow('horizontal'), style: { width: '100%' } });
}

/* Styles */
var selectStyle = { color: 'black', fontSize: '13px', padding: '2px 3px', margin: '2px' };
var buttonStyle = { backgroundColor: '#f3f3f3', color: 'black', fontSize: '13px', padding: '4px 6px', border: '0px' };

/* Title */
var titleRow = greyRow();
titleRow.add(ui.Label('SAR based Surface Water Explorer for Bangladesh', { fontWeight: 'bold', fontSize: '15px', margin: '2px' }));
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

/* --- RESULT BOX (defined early) --- */
var resultRow = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal'), style: { width: '100%', backgroundColor: '#ececec', padding: '2px 3px', margin: '3px 0' } });
resultRow.add(ui.Label('Result', { width: '140px' }));
var resultBox = ui.Label('', { width: '440px' });
resultRow.add(resultBox);

/* Monthly row */
var monthlyRow = greyRow();
var monthlyContent = contentRow();
var yearSelect = ui.Select({ items: yearList, value: '2023', style: selectStyle });
var monthsWithTotal = Object.keys(thresholds).slice(); monthsWithTotal.push('Total Occurrence');
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
var visMonthSelect = ui.Select({ items: Object.keys(thresholds), placeholder: 'Month', style: selectStyle });
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

/* Export Options row */
var exportRow = greyRow();
var exportContent = contentRow();
var exportFormatLabel = ui.Label('Export Format:', { fontSize: '12px', margin: '4px 4px 4px 2px' });
var exportFormatSelect = ui.Select({
    items: exportFormats,
    value: 'Multi-band (Single File)',
    style: selectStyle
});
exportFormatSelect.style().set({ width: '200px', margin: '2px' });
exportFormatSelect.onChange(function (v) { selectedExportFormat = v; });

var resolutionLabel = ui.Label('Resolution:', { fontSize: '12px', margin: '4px 4px 4px 8px' });
var resolutionSelect = ui.Select({
    items: ['10m', '30m', '100m'],
    value: '10m',
    style: selectStyle
});
resolutionSelect.style().set({ width: '70px', margin: '2px' });

exportContent.add(exportFormatLabel);
exportContent.add(exportFormatSelect);
exportContent.add(resolutionLabel);
exportContent.add(resolutionSelect);
exportRow.add(exportContent);
mainPanel.add(exportRow);

/* Insert result row */
mainPanel.add(resultRow);

/* Chart area */
var chartPanel = ui.Panel({
    style: { width: '100%', height: '240px', padding: '6px 6px 0 6px', backgroundColor: '#fff', border: '1px solid #e8e8e8', margin: '6px 0 0 0' },
    layout: ui.Panel.Layout.flow('vertical')
});
mainPanel.add(chartPanel);

/* Add UI to map */
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

var occurrenceColors = ['#F7FBFF', '#CFEFF6', '#93CFE0', '#5EA6C1', '#2E7A9A', '#174F80', '#08306B'];
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
var legendChange = makeLegendPanel('Change Intensity', [{ color: '#FF0000', label: 'Lost' }, { color: '#0000FF', label: 'Stable' }, { color: '#00FF00', label: 'Gained' }]);

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
    // PRIORITY 1: Check for user-drawn geometry (from GEE drawing tools)
    // User draws polygon → GEE creates 'geometry' variable automatically
    try {
        if (typeof geometry !== 'undefined' && geometry !== null) {
            // User has drawn a custom polygon!
            var drawnGeom = geometry;
            // Check if it's a FeatureCollection or Feature
            if (drawnGeom.type && drawnGeom.type().getInfo() === 'FeatureCollection') {
                drawnGeom = drawnGeom.geometry();
            }
            return {
                feature: ee.Feature(drawnGeom),
                name: 'CustomArea',
                type: 'custom',
                geometry: drawnGeom
            };
        }
    } catch (e) {
        // No drawn geometry, continue with other options
    }

    // PRIORITY 2: Use selected district
    if (selDistrict) return { feature: districts.filter(ee.Filter.eq('ADM2_NAME', selDistrict)).first(), name: selDistrict + '_District', type: 'district' };

    // PRIORITY 3: Use selected division
    if (selDivision) return { feature: divisions.filter(ee.Filter.eq('ADM1_NAME', selDivision)).first(), name: selDivision + '_Division', type: 'division' };

    // PRIORITY 4: Use entire Bangladesh
    return { feature: bdBoundary.first(), name: 'Bangladesh', type: 'national' };
}

/* -------------------- Processing helpers -------------------- */
function computeS1AnnualOccurrence(regionGeom, year) {
    var months = Object.keys(thresholds);
    var countImg = ee.Image(0);
    months.forEach(function (m) {
        var mcol = ee.ImageCollection('COPERNICUS/S1_GRD')
            .filterBounds(regionGeom)
            .filterDate(year + '-' + monthMap[m] + '-01', year + '-' + monthMap[m] + '-' + monthEndDays[m])
            .filter(ee.Filter.eq('instrumentMode', 'IW'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
            .select('VV');
        var med = mcol.median();
        var mask = med.lt(ee.Number(thresholds[m]));
        countImg = countImg.add(mask.unmask(0));
    });
    return countImg.rename('Annual_Occurrence');
}

/* Build 12-band monthly water image */
function buildMultiBandMonthlyImage(regionGeom, year) {
    var months = Object.keys(thresholds);
    var monthlyBands = months.map(function (m) {
        var start = year + '-' + monthMap[m] + '-01';
        var end = year + '-' + monthMap[m] + '-' + monthEndDays[m];
        var col = ee.ImageCollection('COPERNICUS/S1_GRD')
            .filterBounds(regionGeom)
            .filterDate(start, end)
            .filter(ee.Filter.eq('instrumentMode', 'IW'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
            .select('VV');
        var med = ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0));
        med = ee.Image(med);
        return med.lt(ee.Number(thresholds[m])).rename(m);
    });
    return ee.ImageCollection.fromImages(monthlyBands).toBands().clip(regionGeom);
}

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

/* -------------------- Grid Tile Generator for National Export -------------------- */
function generateGridTiles(bounds, tileSize) {
    // tileSize in degrees (e.g., 0.5 = ~50km tiles)
    var coords = ee.List(bounds.coordinates().get(0));
    var xMin = ee.Number(ee.List(coords.get(0)).get(0));
    var yMin = ee.Number(ee.List(coords.get(0)).get(1));
    var xMax = ee.Number(ee.List(coords.get(2)).get(0));
    var yMax = ee.Number(ee.List(coords.get(2)).get(1));

    var tiles = [];
    var xStart = xMin.getInfo();
    var yStart = yMin.getInfo();
    var xEnd = xMax.getInfo();
    var yEnd = yMax.getInfo();

    var tileId = 0;
    for (var x = xStart; x < xEnd; x += tileSize) {
        for (var y = yStart; y < yEnd; y += tileSize) {
            var tile = ee.Geometry.Rectangle([x, y, x + tileSize, y + tileSize]);
            tiles.push({ geometry: tile, id: tileId });
            tileId++;
        }
    }
    return tiles;
}

/* -------------------- Operations -------------------- */
function runMonthly() {
    chartPanel.clear(); hideAllLegends();
    resultBox.setValue('');
    var selDiv = divisionSelect.getValue(); var selDist = districtSelect.getValue();
    var selYear = parseInt(yearSelect.getValue()); var selMonth = monthSelect.getValue();
    if (!selYear) { resultBox.setValue('Select year'); return; }
    if (!selMonth) { resultBox.setValue('Select month or Total'); return; }
    var regionInfo = getRegionFeature(selDist, selDiv);
    var regionGeom = ee.Feature(regionInfo.feature).geometry();

    // Show message if using custom drawn polygon
    if (regionInfo.type === 'custom') {
        resultBox.setValue('✏️ Using CUSTOM DRAWN polygon...');
    }

    // Store for export
    lastExportRegion = regionGeom;
    lastExportRegionName = regionInfo.name;
    lastExportYear = selYear;

    Map.clear(); Map.add(mainPanel);

    // Adjust zoom based on region type
    if (regionInfo.type === 'custom') {
        Map.centerObject(regionGeom, 10);  // Higher zoom for custom areas
    } else {
        Map.centerObject(regionGeom, 8);
    }

    try {
        // Build 12-band monthly image for export
        multiBandMonthlyImage = buildMultiBandMonthlyImage(regionGeom, selYear);

        if (selMonth === 'Total Occurrence') {
            var occ = computeS1AnnualOccurrence(regionGeom, selYear).clip(regionGeom);
            multiBandOccurrenceImage = occ;
            Map.addLayer(occ.updateMask(occ.gt(0)), { min: 1, max: 12, palette: occurrenceColors }, regionInfo.name + ' occurrence ' + selYear);
            Map.add(legendS1);
            drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
            var customMsg = regionInfo.type === 'custom' ? ' ✏️ CUSTOM AREA |' : '';
            resultBox.setValue(customMsg + ' Total occurrence: ' + selYear + ' | GeoTIFF ready!');
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
            var water = vvMedian.lt(ee.Number(thresholds[selMonth]));

            // Also compute occurrence for multi-band export
            multiBandOccurrenceImage = computeS1AnnualOccurrence(regionGeom, selYear).clip(regionGeom);

            Map.addLayer(water.updateMask(water), { palette: ['0000FF'] }, regionInfo.name + ' ' + selMonth + ' ' + selYear);
            drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
            var customMsgMonthly = regionInfo.type === 'custom' ? '✏️ CUSTOM AREA | ' : '';
            resultBox.setValue(customMsgMonthly + 'Water: ' + selMonth + ' ' + selYear + ' (S1: ' + count + ') | GeoTIFF ready!');
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
        if (c1 === 0) { resultBox.setValue('No images for Year1 (' + y1 + ') — result may be partial.'); }
        if (c2 === 0) { resultBox.setValue('No images for Year2 (' + y2 + ') — result may be partial.'); }

        var med1 = col1.median().clip(regionGeom);
        var med2 = col2.median().clip(regionGeom);
        var mask1 = med1.lt(ee.Number(thresholds[m]));
        var mask2 = med2.lt(ee.Number(thresholds[m]));
        var lost = mask1.and(mask2.not());
        var stable = mask1.and(mask2);
        var gained = mask2.and(mask1.not());

        var changeClass = ee.Image(0)
            .where(lost.eq(1), 1)
            .where(stable.eq(1), 2)
            .where(gained.eq(1), 3)
            .toUint8();

        Map.addLayer(changeClass.updateMask(changeClass.gt(0)), { min: 1, max: 3, palette: ['FF0000', '0000FF', '00FF00'] }, 'Change ' + y1 + '→' + y2 + ' ' + m);
        Map.add(legendChange);
        drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
        resultBox.setValue('Change displayed: ' + y1 + ' → ' + y2 + ' (' + m + ') — images (y1:' + c1 + ', y2:' + c2 + ')');
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
                var mask = med.lt(ee.Number(thresholds[mo]));
                unionMask = unionMask.max(mask.unmask(0));
            }
        });

        if (totalImages === 0) {
            resultBox.setValue('No Sentinel-1 images for the chosen season/year in this region.');
            return;
        }

        var unionMaskMasked = unionMask.updateMask(unionMask).clip(regionGeom);
        Map.addLayer(unionMaskMasked, { palette: ['0000FF'] }, regionInfo.name + ' ' + s + ' ' + y);
        drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
        resultBox.setValue('Seasonal union displayed: ' + s + ' ' + y + ' (images total: ' + totalImages + ')');
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
            med = ee.Image(med);
            return med.lt(ee.Number(thresholds[monthName]));
        }

        if (y1 && y2 && changeMonth) {
            chartPanel.add(ui.Label('Generating change chart...'));
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
                    title: 'Change water area (km²) — ' + changeMonth + ' (' + y1 + ' → ' + y2 + ')',
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

        if (seasonalY && seasonalS) {
            chartPanel.add(ui.Label('Generating seasonal chart...'));
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
                    var start = seasonalY + '-' + monthMap[mo] + '-01';
                    var end = seasonalY + '-' + monthMap[mo] + '-' + monthEndDays[mo];
                    var col = ee.ImageCollection('COPERNICUS/S1_GRD')
                        .filterBounds(regionGeom)
                        .filterDate(start, end)
                        .filter(ee.Filter.eq('instrumentMode', 'IW'))
                        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
                        .select('VV');
                    var med = ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0));
                    med = ee.Image(med);
                    var mask = med.lt(ee.Number(thresholds[mo]));
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
                    title: 'Seasonal water area (km²) — ' + seasonalY,
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

        if (monthlyY) {
            chartPanel.add(ui.Label('Generating monthly chart...'));
            var months = Object.keys(thresholds);
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
                    title: 'Monthly water area (km²) — ' + monthlyY,
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

        resultBox.setValue('Select Year/Month, Change params, or Season first.');
    } catch (err) {
        chartPanel.clear();
        resultBox.setValue('Chart error: ' + err.message);
    }
}

/* -------------------- GeoTIFF EXPORT (Enhanced with Format Options) -------------------- */
function runGeoTIFFExport() {
    chartPanel.clear();

    if (!multiBandMonthlyImage) {
        resultBox.setValue('⚠️ Run "Monthly Surface Water" first to prepare data for export.');
        return;
    }

    var selDiv = divisionSelect.getValue();
    var selDist = districtSelect.getValue();
    var regionInfo = getRegionFeature(selDist, selDiv);
    var regionGeom = ee.Feature(regionInfo.feature).geometry();
    var year = lastExportYear || yearSelect.getValue();

    // Get selected resolution
    var resolutionStr = resolutionSelect.getValue() || '10m';
    var scale = parseInt(resolutionStr.replace('m', ''));

    // Get selected export format
    var format = exportFormatSelect.getValue() || 'Multi-band (Single File)';

    var months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    var monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // ============ FORMAT 1: Multi-band (Single File) ============
    if (format === 'Multi-band (Single File)') {
        var exportImage = multiBandOccurrenceImage
            ? multiBandMonthlyImage.addBands(multiBandOccurrenceImage)
            : multiBandMonthlyImage;

        var fileName = 'SurfaceWater_' + regionInfo.name + '_' + year + '_' + resolutionStr + '_MultiB';

        Export.image.toDrive({
            image: exportImage,
            description: fileName,
            folder: 'GEE_Water_Exports',
            fileNamePrefix: fileName,
            region: regionGeom,
            scale: scale,
            maxPixels: 1e13,
            fileFormat: 'GeoTIFF'
        });

        chartPanel.add(ui.Label('📦 Multi-band GeoTIFF Export', { fontWeight: 'bold' }));
        chartPanel.add(ui.Label('Format: 13 bands in single file'));
        chartPanel.add(ui.Label('Region: ' + regionInfo.name));
        chartPanel.add(ui.Label('Resolution: ' + resolutionStr));
        chartPanel.add(ui.Label('Bands: 12 monthly + Occurrence'));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('👉 Open Tasks tab → Click RUN', { color: 'blue' }));
        resultBox.setValue('✅ Multi-band export @ ' + resolutionStr + ' | Check Tasks');
    }

    // ============ FORMAT 2: Single-band Split (13 Files) ============
    else if (format === 'Single-band Split (13 Files)') {
        chartPanel.add(ui.Label('📦 Single-band Split Export', { fontWeight: 'bold' }));
        chartPanel.add(ui.Label('Creating 13 separate GeoTIFF files...'));
        chartPanel.add(ui.Label(''));

        // Export each monthly band separately
        months.forEach(function (month, i) {
            var bandName = i + '_' + month;
            var monthlyBand = multiBandMonthlyImage.select(bandName);
            var fileName = 'Water_' + regionInfo.name + '_' + year + '_' + monthShort[i] + '_' + resolutionStr;

            Export.image.toDrive({
                image: monthlyBand.toByte(),
                description: fileName,
                folder: 'GEE_Water_Split_' + year,
                fileNamePrefix: fileName,
                region: regionGeom,
                scale: scale,
                maxPixels: 1e13,
                fileFormat: 'GeoTIFF'
            });
        });

        // Export occurrence band
        if (multiBandOccurrenceImage) {
            var occFileName = 'Water_' + regionInfo.name + '_' + year + '_Occurrence_' + resolutionStr;
            Export.image.toDrive({
                image: multiBandOccurrenceImage.toByte(),
                description: occFileName,
                folder: 'GEE_Water_Split_' + year,
                fileNamePrefix: occFileName,
                region: regionGeom,
                scale: scale,
                maxPixels: 1e13,
                fileFormat: 'GeoTIFF'
            });
        }

        chartPanel.add(ui.Label('✅ Created 13 export tasks!', { color: 'green', fontWeight: 'bold' }));
        chartPanel.add(ui.Label('Files: 12 monthly + 1 occurrence'));
        chartPanel.add(ui.Label('Folder: GEE_Water_Split_' + year));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('👉 Open Tasks tab → Click RUN ALL', { color: 'blue' }));
        resultBox.setValue('✅ 13 single-band files @ ' + resolutionStr + ' | Check Tasks');
    }

    // ============ FORMAT 3: Single-band with ColorMap (ArcMap-ready) ============
    else if (format === 'Single-band with ColorMap') {
        chartPanel.add(ui.Label('🎨 ArcMap-ready ColorMap Export', { fontWeight: 'bold' }));
        chartPanel.add(ui.Label('Creating colored GeoTIFF files...'));
        chartPanel.add(ui.Label(''));

        // Export monthly bands as RGB visualized images
        months.forEach(function (month, i) {
            var bandName = i + '_' + month;
            var monthlyBand = multiBandMonthlyImage.select(bandName);

            // Create RGB visualization (blue for water)
            var visualized = monthlyBand.visualize({
                min: 0,
                max: 1,
                palette: ['FFFFFF', '0066FF']  // White = no water, Blue = water
            });

            var fileName = 'WaterRGB_' + regionInfo.name + '_' + year + '_' + monthShort[i] + '_' + resolutionStr;

            Export.image.toDrive({
                image: visualized,
                description: fileName,
                folder: 'GEE_Water_ColorMap_' + year,
                fileNamePrefix: fileName,
                region: regionGeom,
                scale: scale,
                maxPixels: 1e13,
                fileFormat: 'GeoTIFF'
            });
        });

        // Export occurrence with color ramp
        if (multiBandOccurrenceImage) {
            var occVisualized = multiBandOccurrenceImage.visualize({
                min: 0,
                max: 12,
                palette: occurrencePalette
            });

            var occFileName = 'WaterRGB_' + regionInfo.name + '_' + year + '_Occurrence_' + resolutionStr;
            Export.image.toDrive({
                image: occVisualized,
                description: occFileName,
                folder: 'GEE_Water_ColorMap_' + year,
                fileNamePrefix: occFileName,
                region: regionGeom,
                scale: scale,
                maxPixels: 1e13,
                fileFormat: 'GeoTIFF'
            });
        }

        chartPanel.add(ui.Label('✅ Created 13 colored GeoTIFF tasks!', { color: 'green', fontWeight: 'bold' }));
        chartPanel.add(ui.Label('Format: RGB (3-band) ready for ArcMap/QGIS'));
        chartPanel.add(ui.Label('Monthly: Blue = Water, White = No Water'));
        chartPanel.add(ui.Label('Occurrence: Light→Dark Blue gradient'));
        chartPanel.add(ui.Label('Folder: GEE_Water_ColorMap_' + year));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('👉 Open Tasks tab → Click RUN ALL', { color: 'blue' }));
        resultBox.setValue('✅ 13 colored GeoTIFFs @ ' + resolutionStr + ' | Ready for ArcMap!');
    }
}

/* -------------------- About / Reset -------------------- */
function aboutAction() {
    var ap = ui.Panel({ style: { position: 'top-center', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc', width: '420px' } });
    ap.add(ui.Label('SAR-based Surface Water Explorer', { fontWeight: 'bold', fontSize: '16px' }));
    ap.add(ui.Label(''));
    ap.add(ui.Label('Features:', { fontWeight: 'bold' }));
    ap.add(ui.Label('• Monthly water detection using Sentinel-1 VV'));
    ap.add(ui.Label('• Change detection between years'));
    ap.add(ui.Label('• Seasonal water analysis'));
    ap.add(ui.Label('• Interactive charts'));
    ap.add(ui.Label(''));
    ap.add(ui.Label('Export Formats:', { fontWeight: 'bold' }));
    ap.add(ui.Label('• Multi-band: Single file with 13 bands'));
    ap.add(ui.Label('• Single-band Split: 13 separate files'));
    ap.add(ui.Label('• ColorMap: ArcMap/QGIS ready (RGB)'));
    ap.add(ui.Label(''));
    ap.add(ui.Label('Resolution Options:', { fontWeight: 'bold' }));
    ap.add(ui.Label('• 10m (high detail, slower export)'));
    ap.add(ui.Label('• 30m (balanced)'));
    ap.add(ui.Label('• 100m (fast, regional analysis)'));
    ap.add(ui.Label(''));
    ap.add(ui.Button('Close', function () { Map.remove(ap); }));
    Map.add(ap);
}

function resetAction() {
    divisionSelect.setValue(null); districtSelect.items().reset([]);
    yearSelect.setValue('2023'); monthSelect.setValue(null);
    visYear1.setValue('2019'); visYear2.setValue('2023'); visMonthSelect.setValue(null);
    seasonalYear.setValue('2023'); seasonSelect.setValue(null);
    chartPanel.clear(); resultBox.setValue('');
    multiBandMonthlyImage = null;
    multiBandOccurrenceImage = null;
    lastExportRegion = null;
    lastExportRegionName = null;
    lastExportYear = null;
    Map.clear(); Map.add(mainPanel); hideAllLegends(); Map.centerObject(bdBoundary, 7);
}

/* Add mainPanel to map */
Map.clear(); Map.add(mainPanel);
Map.centerObject(bdBoundary, 7);

/* Wire the buttons */
monthlyBtn.onClick(runMonthly);
changeBtn.onClick(runChange);
seasonalBtn.onClick(runSeasonal);
genChartBtn.onClick(genChart);
geoBtn.onClick(runGeoTIFFExport);  // NEW: Smart export function
aboutBtn.onClick(aboutAction);
resetBtn.onClick(resetAction);
