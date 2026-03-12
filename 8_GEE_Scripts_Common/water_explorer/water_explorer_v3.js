/* ==================================================================================
   GLOBAL SAR-based Surface Water Explorer v3
   Works anywhere in the world - just draw a polygon!
   
   Instructions:
   1. Use GEE's drawing tools (top-left) to draw a polygon on any area
   2. Select year and month
   3. Click "Monthly Surface Water" or select "Total Occurrence"
   
   No country boundary restrictions - works globally!
================================================================================== */

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
var yearList = ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

/* -------------------- Multi-band GeoTIFF Holders -------------------- */
var multiBandMonthlyImage = null;   // 12-band monthly water
var multiBandOccurrenceImage = null; // annual occurrence
var lastExportRegion = null;        // geometry for export
var lastExportRegionName = null;    // name for file naming
var lastExportYear = null;          // year for file naming

/* -------------------- Color Palettes for ArcMap-ready GeoTIFFs -------------------- */
var waterPalette = ['0000FF'];  // Single blue for monthly water (binary: 0/1)
var occurrencePalette = [
    'FFFFFF',  // 0 - No water (will be masked)
    'c6ecc6',  // 1 - Very rare water (light green)
    'a8e6a0',  // 2 - Rare water (green)
    '7dd87d',  // 3
    '52c569',  // 4 - Low-medium (yellow-green)
    '3dbfb8',  // 5 - Medium (teal/cyan)
    '40b0c0',  // 6
    '2f9ac4',  // 7 - Medium-high (light blue)
    '2171b5',  // 8
    '1565c0',  // 9 - High (blue)
    '0d47a1',  // 10
    '0a3d91',  // 11 - Very high (dark blue)
    '0000FF'   // 12 - Permanent water (solid blue)
];

/* -------------------- Export Format Options -------------------- */
var exportFormats = ['Multi-band (Single File)', 'Single-band Split (13 Files)', 'Single-band with ColorMap'];
var selectedExportFormat = 'Multi-band (Single File)';

/* -------------------- Sentinel-2 Background Image Config -------------------- */
var S2_CONFIG = {
    startDate: '2023-10-01',
    endDate: '2024-03-31',
    cloudCover: 10,
    outputWidth: 2560,
    outputHeight: 1440,
    format: 'png'
};

/* Sentinel-2 Processing Functions */
function createS2Composite(geometry) {
    var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(geometry)
        .filterDate(S2_CONFIG.startDate, S2_CONFIG.endDate)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', S2_CONFIG.cloudCover));

    function maskClouds(image) {
        var scl = image.select('SCL');
        var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
        return image.updateMask(mask);
    }

    var composite = s2.map(maskClouds).median();
    return composite.select(['B4', 'B3', 'B2']);
}

function enhanceS2ForWeb(image) {
    return image.visualize({
        min: 200,
        max: 3500,
        gamma: 1.2
    });
}

function generateS2DownloadURL(geometry) {
    var composite = createS2Composite(geometry);
    var enhanced = enhanceS2ForWeb(composite);

    var thumbParams = {
        dimensions: S2_CONFIG.outputWidth + 'x' + S2_CONFIG.outputHeight,
        region: geometry,
        format: S2_CONFIG.format
    };

    return enhanced.getThumbURL(thumbParams);
}

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
        width: '480px',
        height: '580px',
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
titleRow.add(ui.Label('🌍 Global SAR Surface Water Explorer', { fontWeight: 'bold', fontSize: '15px', margin: '2px' }));
mainPanel.add(titleRow);

/* Instructions row */
var instructionRow = greyRow();
instructionRow.add(ui.Label('📝 Draw a polygon using the tools (top-left), then click a button below.',
    { fontSize: '11px', margin: '2px', color: '#666' }));
mainPanel.add(instructionRow);

/* --- RESULT BOX (defined early) --- */
var resultRow = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal'), style: { width: '100%', backgroundColor: '#ececec', padding: '2px 3px', margin: '3px 0' } });
resultRow.add(ui.Label('Result', { width: '60px' }));
var resultBox = ui.Label('', { width: '400px' });
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

/* S2 Background & Water Map Download row */
var s2Row = greyRow();
var s2Content = contentRow();

var waterMapBtn = ui.Button({ label: '📥 Water Map', style: buttonStyle });
waterMapBtn.style().set({ width: '110px', margin: '2px' });

var s2Btn = ui.Button({ label: '🛰️ S2 Image', style: buttonStyle });
s2Btn.style().set({ width: '100px', margin: '2px' });

var s2ResLabel = ui.Label('Size:', { fontSize: '12px', margin: '4px 2px 4px 4px' });
var s2ResSelect = ui.Select({
    items: ['2560x1440 (2K)', '1920x1080 (FHD)', '3840x2160 (4K)', '4096x4096 (Max)'],
    value: '2560x1440 (2K)',
    style: selectStyle
});
s2ResSelect.style().set({ width: '130px', margin: '2px' });
s2ResSelect.onChange(function (v) {
    var parts = v.split(' ')[0].split('x');
    S2_CONFIG.outputWidth = parseInt(parts[0]);
    S2_CONFIG.outputHeight = parseInt(parts[1]);
});

var s2FormatLabel = ui.Label('Fmt:', { fontSize: '12px', margin: '4px 2px 4px 4px' });
var s2FormatSelect = ui.Select({
    items: ['png', 'jpg'],
    value: 'png',
    style: selectStyle
});
s2FormatSelect.style().set({ width: '55px', margin: '2px' });
s2FormatSelect.onChange(function (v) { S2_CONFIG.format = v; });

s2Content.add(waterMapBtn);
s2Content.add(s2Btn);
s2Content.add(s2ResLabel);
s2Content.add(s2ResSelect);
s2Content.add(s2FormatLabel);
s2Content.add(s2FormatSelect);
s2Row.add(s2Content);
mainPanel.add(s2Row);

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
Map.setCenter(90.4, 23.8, 5);  // Default view, user can navigate anywhere

/* -------------------- Legend helpers -------------------- */
function makeOccurrenceRamp(title, colors) {
    var p = ui.Panel({ style: { position: 'bottom-left', padding: '6px', backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.15)' } });
    p.add(ui.Label(title, { fontWeight: 'bold' }));
    var ramp = ui.Panel({ layout: ui.Panel.Layout.Flow('horizontal'), style: { margin: '6px 0 0 0' } });
    colors.forEach(function (c) {
        ramp.add(ui.Label('', { width: '18px', height: '12px', margin: '0 1px 0 0', backgroundColor: c }));
    });
    var caption = ui.Label('Low (Green) → High (Blue)', { margin: '6px 0 0 6px', fontSize: '11px' });
    var wrapper = ui.Panel({ layout: ui.Panel.Layout.Flow('horizontal') });
    wrapper.add(ramp);
    wrapper.add(caption);
    p.add(wrapper);
    return p;
}

// Green (low occurrence) → Cyan → Blue (high/permanent water) - matches reference image
var occurrenceColors = ['#c6ecc6', '#7dd87d', '#3dbfb8', '#40b0c0', '#2171b5', '#0d47a1', '#0000FF'];
var legendS1 = makeOccurrenceRamp('Water Occurrence', occurrenceColors);

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

/* Hide the cream-colored geometry overlay (but keep drawing tools visible) */
function hideGeometryOverlay() {
    try {
        // Only hide the geometry LAYERS (cream fill), NOT the drawing tools UI
        var layers = Map.drawingTools().layers();
        layers.forEach(function (layer) {
            layer.setShown(false);  // Hide the layer fill only
        });
    } catch (e) {
        // Ignore if drawing tools not available
    }
}

function hideAllLegends() {
    try { Map.remove(legendS1); } catch (e) { }
    try { Map.remove(legendChange); } catch (e) { }
    hideGeometryOverlay();  // Also hide geometry overlay
}

/* -------------------- Region helpers (GLOBAL - polygon only) -------------------- */
function drawRegionBoundaryOnly(regionFeat, label) {
    try {
        var styled = ee.Feature(regionFeat).style({ color: 'FF0000', width: 2, fillColor: '00000000' });
        Map.addLayer(styled, {}, label || 'Boundary', false);
    } catch (e) {
        // Ignore boundary drawing errors
    }
}

/* GLOBAL VERSION: Uses user-drawn geometry from imports OR drawing tools */
function getRegionFeature() {
    var drawnGeom = null;
    var sourceName = 'none';

    // Method 1: Check GEE imports (traditional way)
    try {
        drawnGeom = geometry;
        sourceName = 'geometry (import)';
    } catch (e) { }

    try {
        if (!drawnGeom) {
            drawnGeom = CustomArea;
            sourceName = 'CustomArea (import)';
        }
    } catch (e) { }

    // Method 2: Check Map.drawingTools() if no import found
    if (!drawnGeom) {
        try {
            var dtLayers = Map.drawingTools().layers();
            if (dtLayers.length() > 0) {
                var geometries = dtLayers.get(0).geometries();
                if (geometries.length() > 0) {
                    drawnGeom = geometries.get(0);
                    sourceName = 'drawingTools';
                }
            }
        } catch (e) { }
    }

    // DEBUG: Print which geometry source was found
    print('🔍 DEBUG: Geometry source = ' + sourceName);

    if (drawnGeom) {
        try {
            // Handle FeatureCollection
            var geomToUse = drawnGeom;
            try {
                if (drawnGeom.geometry) geomToUse = drawnGeom.geometry();
            } catch (e) { }

            // DEBUG: Print geometry info
            print('📐 DEBUG: Geometry bounds:');
            print(ee.Geometry(geomToUse).bounds());

            // Get name from centroid
            var areaName = 'DrawnArea';
            try {
                var coords = ee.Geometry(geomToUse).centroid().coordinates().getInfo();
                areaName = 'Area_' + coords[1].toFixed(2) + '_' + coords[0].toFixed(2);
                print('📍 DEBUG: Centroid = Lat: ' + coords[1].toFixed(4) + ', Lon: ' + coords[0].toFixed(4));
            } catch (e) { }

            // DEBUG: Print area (with 1m error margin for planar geometry)
            print('📏 DEBUG: Area (sq km):');
            print(ee.Geometry(geomToUse).area(1).divide(1e6));

            return {
                feature: ee.Feature(geomToUse),
                name: areaName,
                type: 'custom',
                geometry: geomToUse
            };
        } catch (e) {
            print('❌ Geometry error:', e);
        }
    }

    print('⚠️ DEBUG: No geometry found! Draw a polygon first.');
    return null;
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

    var selYear = parseInt(yearSelect.getValue());
    var selMonth = monthSelect.getValue();
    if (!selYear) { resultBox.setValue('⚠️ Select year'); return; }
    if (!selMonth) { resultBox.setValue('⚠️ Select month or Total'); return; }

    // Get region from drawn polygon
    var regionInfo = getRegionFeature();

    // Check if polygon was drawn
    if (!regionInfo) {
        resultBox.setValue('⚠️ Draw a polygon first! Use drawing tools (top-left corner)');
        return;
    }

    var regionGeom = ee.Feature(regionInfo.feature).geometry();
    resultBox.setValue('🔄 Processing ' + regionInfo.name + '...');

    // Store for export
    lastExportRegion = regionGeom;
    lastExportRegionName = regionInfo.name;
    lastExportYear = selYear;

    Map.clear(); Map.add(mainPanel);

    // HIDE the cream-colored geometry overlay from drawing tools
    try {
        Map.drawingTools().setShown(false);
    } catch (e) { }

    Map.centerObject(regionGeom, 10);

    try {
        // Build 12-band monthly image for export
        multiBandMonthlyImage = buildMultiBandMonthlyImage(regionGeom, selYear);

        if (selMonth === 'Total Occurrence') {
            var occ = computeS1AnnualOccurrence(regionGeom, selYear).clip(regionGeom);
            multiBandOccurrenceImage = occ;

            // DEBUG: Check if water was detected
            print('💧 DEBUG: Checking water occurrence values...');
            print('Max occurrence value:', occ.reduceRegion({
                reducer: ee.Reducer.max(),
                geometry: regionGeom,
                scale: 100,
                maxPixels: 1e9
            }));

            // Create TRUE white background using visualize (works in GEE map)
            var whiteBackground = ee.Image(1).visualize({
                palette: ['FFFFFF'],
                min: 0,
                max: 1
            }).clip(regionGeom);
            Map.addLayer(whiteBackground, {}, 'White Background', true);

            // Add occurrence layer on top - ONLY where water > 0
            var waterVis = occ.updateMask(occ.gt(0));
            Map.addLayer(waterVis, { min: 1, max: 12, palette: occurrenceColors }, regionInfo.name + ' occurrence ' + selYear);
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

    var y1 = parseInt(visYear1.getValue()); var y2 = parseInt(visYear2.getValue()); var m = visMonthSelect.getValue();
    if (!y1 || !y2) { resultBox.setValue('⚠️ Select Year1 and Year2'); return; }
    if (!m) { resultBox.setValue('⚠️ Select month'); return; }

    var regionInfo = getRegionFeature();
    if (!regionInfo) { resultBox.setValue('⚠️ Draw a polygon first!'); return; }
    var regionGeom = ee.Feature(regionInfo.feature).geometry();

    Map.clear(); Map.add(mainPanel);
    Map.centerObject(regionGeom, 10);

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

    var y = parseInt(seasonalYear.getValue()); var s = seasonSelect.getValue();
    if (!y) { resultBox.setValue('⚠️ Select year'); return; }
    if (!s) { resultBox.setValue('⚠️ Select season'); return; }

    var regionInfo = getRegionFeature();
    if (!regionInfo) { resultBox.setValue('⚠️ Draw a polygon first!'); return; }
    var regionGeom = ee.Feature(regionInfo.feature).geometry();

    Map.clear(); Map.add(mainPanel);
    Map.centerObject(regionGeom, 10);

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

    var regionInfo = getRegionFeature();
    if (!regionInfo) { resultBox.setValue('⚠️ Draw a polygon first!'); return; }
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

    var regionInfo = getRegionFeature();
    if (!regionInfo) {
        resultBox.setValue('⚠️ Draw a polygon and run "Monthly Surface Water" first!');
        return;
    }
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
    ap.add(ui.Label('🌍 Global SAR Surface Water Explorer v3', { fontWeight: 'bold', fontSize: '16px' }));
    ap.add(ui.Label(''));
    ap.add(ui.Label('How to Use:', { fontWeight: 'bold' }));
    ap.add(ui.Label('1. Draw a polygon anywhere in the world'));
    ap.add(ui.Label('2. Select year and month'));
    ap.add(ui.Label('3. Click "Monthly Surface Water"'));
    ap.add(ui.Label(''));
    ap.add(ui.Label('Features:', { fontWeight: 'bold' }));
    ap.add(ui.Label('• Works globally - no country restrictions'));
    ap.add(ui.Label('• Monthly water detection (Sentinel-1 VV)'));
    ap.add(ui.Label('• Total Occurrence with green→blue gradient'));
    ap.add(ui.Label('• Change detection between years'));
    ap.add(ui.Label('• Seasonal water analysis'));
    ap.add(ui.Label(''));
    ap.add(ui.Button('Close', function () { Map.remove(ap); }));
    Map.add(ap);
}

function resetAction() {
    yearSelect.setValue('2023'); monthSelect.setValue(null);
    visYear1.setValue('2019'); visYear2.setValue('2023'); visMonthSelect.setValue(null);
    seasonalYear.setValue('2023'); seasonSelect.setValue(null);
    chartPanel.clear(); resultBox.setValue('🔄 Reset complete. Draw a new polygon to start.');
    multiBandMonthlyImage = null;
    multiBandOccurrenceImage = null;
    lastExportRegion = null;
    lastExportRegionName = null;
    lastExportYear = null;
    Map.clear(); Map.add(mainPanel); hideAllLegends(); Map.setCenter(90.4, 23.8, 5);
}

/* Add mainPanel to map */
Map.clear(); Map.add(mainPanel);
Map.setCenter(90.4, 23.8, 5);  // Default view - user can navigate anywhere globally

/* Initialize drawing tools so users can draw polygons */
try {
    var drawingTools = Map.drawingTools();
    drawingTools.setShown(true);  // Show drawing tools in top-left
    drawingTools.setDrawModes(['polygon', 'rectangle']);  // Allow polygon and rectangle
    print('✏️ Drawing tools enabled! Use the polygon/rectangle icons (top-left) to draw your area.');
} catch (e) {
    print('Note: Draw a geometry using GEE import tools before running.');
}

/* -------------------- S2 Background Download Function -------------------- */
function runS2Download() {
    chartPanel.clear();
    resultBox.setValue('');

    var regionInfo = getRegionFeature();
    if (!regionInfo) {
        resultBox.setValue('⚠️ Draw a polygon first!');
        return;
    }

    var regionGeom = ee.Feature(regionInfo.feature).geometry();
    resultBox.setValue('🔄 Generating S2 background image...');

    try {
        var url = generateS2DownloadURL(regionGeom);

        chartPanel.add(ui.Label('🛰️ Sentinel-2 Background Image', { fontWeight: 'bold', fontSize: '14px' }));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('📐 Size: ' + S2_CONFIG.outputWidth + 'x' + S2_CONFIG.outputHeight));
        chartPanel.add(ui.Label('🖼️ Format: ' + S2_CONFIG.format.toUpperCase()));
        chartPanel.add(ui.Label('📅 Date range: ' + S2_CONFIG.startDate + ' to ' + S2_CONFIG.endDate));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('🔗 CLICK TO DOWNLOAD:', { fontWeight: 'bold', color: '#1e3a5f' }));
        chartPanel.add(ui.Label('Download ' + S2_CONFIG.format.toUpperCase() + ' Image', {
            color: '#0066cc',
            fontSize: '13px'
        }).setUrl(url));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('💡 Right-click link → Save As...', { fontSize: '11px', color: '#666' }));

        // Also print to console
        print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        print('🛰️ S2 Background Download URL:');
        print(url);
        print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        resultBox.setValue('✅ S2 image ready! Click link in chart area to download.');
    } catch (err) {
        resultBox.setValue('S2 error: ' + err.message);
    }
}

/* -------------------- Water Map Download Function -------------------- */
function runWaterMapDownload() {
    chartPanel.clear();
    resultBox.setValue('');

    if (!multiBandOccurrenceImage) {
        resultBox.setValue('⚠️ Run "Monthly Surface Water" with "Total Occurrence" first!');
        return;
    }

    var regionInfo = getRegionFeature();
    if (!regionInfo) {
        resultBox.setValue('⚠️ Draw a polygon first!');
        return;
    }

    var regionGeom = ee.Feature(regionInfo.feature).geometry();
    resultBox.setValue('🔄 Generating water map image...');

    try {
        // Create visualized water occurrence image with white background
        var occ = multiBandOccurrenceImage;

        // Create white background
        var whiteBackground = ee.Image.constant([255, 255, 255]).byte().clip(regionGeom);

        // Create water visualization with green-to-blue palette
        var waterVis = occ.updateMask(occ.gt(0)).visualize({
            min: 1,
            max: 12,
            palette: occurrenceColors
        }).clip(regionGeom);

        // Blend: white background with water on top
        var finalImage = ee.ImageCollection([
            whiteBackground.visualize({ min: 0, max: 255 }),
            waterVis
        ]).mosaic();

        var thumbParams = {
            dimensions: S2_CONFIG.outputWidth + 'x' + S2_CONFIG.outputHeight,
            region: regionGeom,
            format: S2_CONFIG.format
        };

        var url = finalImage.getThumbURL(thumbParams);

        chartPanel.add(ui.Label('📥 Water Occurrence Map', { fontWeight: 'bold', fontSize: '14px' }));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('📐 Size: ' + S2_CONFIG.outputWidth + 'x' + S2_CONFIG.outputHeight));
        chartPanel.add(ui.Label('🖼️ Format: ' + S2_CONFIG.format.toUpperCase()));
        chartPanel.add(ui.Label('🎨 Colors: Green (low) → Blue (high)'));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('🔗 CLICK TO DOWNLOAD:', { fontWeight: 'bold', color: '#1e3a5f' }));
        chartPanel.add(ui.Label('Download Water Map ' + S2_CONFIG.format.toUpperCase(), {
            color: '#0066cc',
            fontSize: '13px'
        }).setUrl(url));
        chartPanel.add(ui.Label(''));
        chartPanel.add(ui.Label('💡 Right-click link → Save As...', { fontSize: '11px', color: '#666' }));

        // Also print to console
        print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        print('📥 Water Map Download URL:');
        print(url);
        print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        resultBox.setValue('✅ Water map ready! Click link to download.');
    } catch (err) {
        resultBox.setValue('Water map error: ' + err.message);
    }
}

/* Wire the buttons */
monthlyBtn.onClick(runMonthly);
changeBtn.onClick(runChange);
seasonalBtn.onClick(runSeasonal);
genChartBtn.onClick(genChart);
geoBtn.onClick(runGeoTIFFExport);  // Smart export function
waterMapBtn.onClick(runWaterMapDownload);  // Water Map image download
s2Btn.onClick(runS2Download);  // S2 Background download
aboutBtn.onClick(aboutAction);
resetBtn.onClick(resetAction);

