/* ==================================================================================
   GLOBAL Sentinel-2 Vegetation & Water Explorer
   
   Instructions:
   1. Use GEE's drawing tools (top-left) to draw a polygon on any area
   2. Select a Year
   3. Click "Run Analysis"
   
   Metrics:
   1. NDVI: Yearly Median Vegetation Index.
   2. Water: Yearly Water Occurrence Frequency (%).
================================================================================== */

/* -------------------- Parameters -------------------- */
var yearList = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

/* -------------------- Variables -------------------- */
// Store layer references globally to avoid iteration errors
var ndviLayer = null;
var waterLayer = null;
// Store rendered images for snapshot
var currentNdviImage = null;
var currentWaterImage = null;
var currentGeometry = null;

/* -------------------- Color Palettes -------------------- */
// NDVI Palette (17 classes)
var ndviVis = {
    min: 0,
    max: 0.8,
    palette: ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901', '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01', '012E01', '011D01', '011301']
};

// Water Occurrence Palette (Blue Gradient)
var waterVis = {
    min: 0,
    max: 100,
    palette: ['ffffff', 'fffcff', 'eaf7ff', 'd5f0ff', 'c0e8ff', 'abe1ff', '96d9ff', '81d2ff', '6ccaff', '57c3ff', '42bbff', '2db4ff', '18acff', '03a5ff', '0096ea', '0087d5', '0078c0', '0069ab', '005a96', '004b81', '003c6c', '002d57', '001e42', '000f2d', '000018']
};

/* -------------------- Sentinel-2 Configuration -------------------- */
var S2_CONFIG = {
    cloudCover: 60,
    outputWidth: 2560,
    outputHeight: 1440,
    format: 'png'
};

/* -------------------- Sentinel-2 Processing Functions -------------------- */
function maskS2clouds(image) {
    var qa = image.select('QA60');
    var cloudBitMask = 1 << 10;
    var cirrusBitMask = 1 << 11;
    var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
        .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
    return image.updateMask(mask).divide(10000);
}

function computeNDVI(image) {
    var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
    return image.addBands(ndvi);
}

function computeNDWI(image) {
    var ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI'); // Green - NIR
    return image.addBands(ndwi);
}

/* -------------------- UI Setup -------------------- */
Map.setOptions('ROADMAP');

var mainPanel = ui.Panel({
    style: {
        position: 'top-right',
        padding: '6px',
        backgroundColor: '#ffffff',
        color: '#000000',
        width: '380px',
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
var checkboxStyle = { fontSize: '12px', margin: '6px 4px' };

/* Title */
var titleRow = greyRow();
titleRow.add(ui.Label('🌱💧 Vegetation & Water Explorer', { fontWeight: 'bold', fontSize: '15px', margin: '2px' }));
mainPanel.add(titleRow);

/* Instructions */
var instructionRow = greyRow();
instructionRow.add(ui.Label('📝 Draw a polygon, select Year, then Run.',
    { fontSize: '11px', margin: '2px', color: '#666' }));
mainPanel.add(instructionRow);

/* Result Box */
var resultRow = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal'), style: { width: '100%', backgroundColor: '#ececec', padding: '2px 3px', margin: '3px 0' } });
resultRow.add(ui.Label('Status:', { width: '50px', fontWeight: 'bold' }));
var resultBox = ui.Label('Ready', { width: '280px' });
resultRow.add(resultBox);

/* Controls Row */
var controlsRow = greyRow();
var controlsContent = contentRow();
var yearSelect = ui.Select({ items: yearList, value: '2023', style: selectStyle });
var bgCheckbox = ui.Checkbox({ label: 'White Bg', value: false, style: checkboxStyle });
var runBtn = ui.Button({ label: 'Run Analysis', style: buttonStyle });
var resetBtn = ui.Button({ label: 'Reset', style: buttonStyle });

yearSelect.style().set({ width: '80px', margin: '2px' });
runBtn.style().set({ width: '100px', margin: '2px', fontWeight: 'bold' });
resetBtn.style().set({ width: '60px', margin: '2px' });

controlsContent.add(yearSelect);
controlsContent.add(bgCheckbox);
controlsContent.add(runBtn);
controlsContent.add(resetBtn);
controlsRow.add(controlsContent);
mainPanel.add(controlsRow);

/* Layer Toggles */
var layerRow = greyRow();
var layerContent = contentRow();
var showVeg = ui.Checkbox({ label: 'Show NDVI', value: true, style: checkboxStyle });
var showWater = ui.Checkbox({ label: 'Show Water', value: true, style: checkboxStyle });

// Update layer visibility using direct references
var updateLayers = function () {
    if (ndviLayer) {
        ndviLayer.setShown(showVeg.getValue());
    }
    if (waterLayer) {
        waterLayer.setShown(showWater.getValue());
    }
};

showVeg.onChange(updateLayers);
showWater.onChange(updateLayers);

layerContent.add(ui.Label('Layers:', { fontWeight: 'bold', margin: '6px 4px' }));
layerContent.add(showVeg);
layerContent.add(showWater);
layerRow.add(layerContent);
mainPanel.add(layerRow);

/* Snapshot/Export Row */
var exportRow = greyRow();
var exportContent = contentRow();

var exportBtn = ui.Button({ label: '� Export to Drive', style: buttonStyle });
exportBtn.style().set({ width: '110px', margin: '2px', fontWeight: 'bold' });

var scaleSelect = ui.Select({
    items: ['10m (High)', '30m (Medium)', '100m (Fast)'],
    value: '30m (Medium)',
    style: selectStyle
});
scaleSelect.style().set({ width: '100px', margin: '2px' });

exportContent.add(exportBtn);
exportContent.add(ui.Label('Scale:', { fontSize: '12px', margin: '6px 2px' }));
exportContent.add(scaleSelect);
exportRow.add(exportContent);
mainPanel.add(exportRow);

/* Download Link Panel */
var downloadPanel = ui.Panel({
    style: { width: '100%', backgroundColor: '#f9f9f9', padding: '4px', margin: '3px 0' }
});
mainPanel.add(downloadPanel);

mainPanel.add(resultRow);

/* Add to Map */
Map.clear(); Map.add(mainPanel);
Map.setCenter(0, 0, 3);

/* -------------------- Legends -------------------- */
function makeLegend(title, entries) {
    var p = ui.Panel({ style: { position: 'bottom-left', padding: '6px', backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid rgba(0,0,0,0.15)', margin: '0 0 4px 0' } });
    p.add(ui.Label(title, { fontWeight: 'bold', fontSize: '12px' }));
    for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var r = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal') });
        r.add(ui.Label('', { width: '14px', height: '12px', margin: '0 6px 0 0', backgroundColor: e.color }));
        r.add(ui.Label(e.label, { fontSize: '11px' }));
        p.add(r);
    }
    return p;
}

var vegLegend = makeLegend('NDVI', [
    { color: '#004C00', label: 'Dense (> 0.6)' },
    { color: '#74A901', label: 'Moderate (0.3 - 0.6)' },
    { color: '#FCD163', label: 'Sparse (0.1 - 0.3)' },
    { color: '#FFFFFF', label: 'None (< 0.1)' }
]);

var waterLegend = makeLegend('Water (%)', [
    { color: '#000018', label: 'Permanent (100%)' },
    { color: '#0069ab', label: 'Seasonal (50%)' },
    { color: '#abe1ff', label: 'Rare (10%)' }
]);

/* -------------------- Helper -------------------- */
function getRegionFeature() {
    var drawnGeom = null;
    try { drawnGeom = geometry; } catch (e) { } // Imports
    if (!drawnGeom) {
        try {
            var dt = Map.drawingTools().layers();
            if (dt.length() > 0) drawnGeom = dt.get(0).geometries().get(0);
        } catch (e) { }
    }

    if (drawnGeom) {
        return { feature: ee.Feature(drawnGeom), geometry: ee.Feature(drawnGeom).geometry() };
    }
    resultBox.setValue('⚠️ Draw a polygon first!');
    return null;
}

function hideAllLegends() {
    try { Map.remove(vegLegend); } catch (e) { }
    try { Map.remove(waterLegend); } catch (e) { }
}

function hideGeometry() {
    // Robustly hide all drawing layers without iteration if possible
    try {
        var dt = Map.drawingTools();
        dt.setShown(false); // Hide the toolbar

        // To hide the actual shapes, we must iterate, but let's try a safer loop
        var layers = dt.layers();
        var len = layers.length();
        for (var i = 0; i < len; i++) {
            var layer = layers.get(i);
            layer.setShown(false);
        }
    } catch (e) {
        // Ignore errors here to prevent crashing
        print('Warning: Could not hide geometry layers.');
    }
}

/* -------------------- Core Logic -------------------- */

function runAnalysis() {
    hideAllLegends();
    resultBox.setValue('');
    Map.layers().reset(); // Clear previous layers

    // Reset references
    ndviLayer = null;
    waterLayer = null;

    hideGeometry();

    var year = yearSelect.getValue();

    var info = getRegionFeature();
    if (!info) return;

    resultBox.setValue('Processing ' + year + '...');

    // Add White Background if selected
    if (bgCheckbox.getValue()) {
        var whiteImg = ee.Image(1).visualize({ palette: ['FFFFFF'] }).clip(info.geometry);
        Map.addLayer(whiteImg, {}, 'White Background');
    }

    var start = year + '-01-01';
    var end = year + '-12-31';

    // 1. Base Collection
    var s2col = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(info.geometry)
        .filterDate(start, end)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', S2_CONFIG.cloudCover))
        .map(maskS2clouds);

    // 2. Yearly Vegetation (NDVI Median)
    var ndviCol = s2col.map(computeNDVI);
    var ndviMedian = ndviCol.select('NDVI').median().clip(info.geometry);

    // 3. Water Occurrence (NDWI Frequency) - use stricter threshold
    var waterCol = s2col.map(computeNDWI);
    // Define water as NDWI > 0.1 (stricter to avoid false positives)
    var waterBinary = waterCol.map(function (img) {
        return img.select('NDWI').gt(0.1).rename('water').copyProperties(img, ['system:time_start']);
    });

    // Calculate Frequency: Sum / Count * 100
    var waterSum = waterBinary.sum();
    var validCount = waterBinary.count();
    var waterFreq = waterSum.divide(validCount).multiply(100).rename('water_occurrence').clip(info.geometry);

    // Water mask: where water occurs at least 5% of the time
    var waterMask = waterFreq.gte(5);

    // NDVI: Show only vegetation (NDVI > 0.1), exclude water areas completely
    var ndviMasked = ndviMedian.updateMask(ndviMedian.gt(0.1).and(waterMask.not()));

    // Water: Show only actual water (occurrence > 5%)
    var waterMasked = waterFreq.updateMask(waterMask);

    // Store for snapshot
    currentNdviImage = ndviMasked;
    currentWaterImage = waterMasked;
    currentGeometry = info.geometry;

    Map.centerObject(info.geometry);

    // Add Layers and Store References
    // IMPORTANT: Add Water FIRST, then NDVI on top
    var showVegVal = !!showVeg.getValue();
    var showWaterVal = !!showWater.getValue();

    waterLayer = Map.addLayer(waterMasked, waterVis, 'Water ' + year, showWaterVal);
    ndviLayer = Map.addLayer(ndviMasked, ndviVis, 'NDVI ' + year, showVegVal);

    // Add Legends
    Map.add(vegLegend);
    Map.add(waterLegend);

    resultBox.setValue('✅ Analysis Complete for ' + year);
}

/* -------------------- Export to Drive -------------------- */
function runExport() {
    downloadPanel.clear();

    if (!currentGeometry) {
        resultBox.setValue('⚠️ Run analysis first!');
        return;
    }

    resultBox.setValue('Preparing export...');

    try {
        // Create white background
        var finalImage = ee.Image(1).visualize({ palette: ['FFFFFF'] }).clip(currentGeometry);

        // Add Water layer if enabled
        if (showWater.getValue() && currentWaterImage) {
            var waterViz = currentWaterImage.visualize(waterVis);
            finalImage = finalImage.blend(waterViz);
        }

        // Add NDVI layer on top if enabled
        if (showVeg.getValue() && currentNdviImage) {
            var ndviViz = currentNdviImage.visualize(ndviVis);
            finalImage = finalImage.blend(ndviViz);
        }

        // Get scale from dropdown
        var scaleStr = scaleSelect.getValue();
        var scale = 30;
        if (scaleStr.indexOf('10m') !== -1) scale = 10;
        else if (scaleStr.indexOf('100m') !== -1) scale = 100;

        var year = yearSelect.getValue();
        var timestamp = Date.now();
        var filename = 'VegWater_' + year + '_' + timestamp;

        // Export to Google Drive
        Export.image.toDrive({
            image: finalImage,
            description: filename,
            folder: 'GEE_Exports',
            fileNamePrefix: filename,
            region: currentGeometry,
            scale: scale,
            maxPixels: 1e13
        });

        downloadPanel.add(ui.Label('� Export Task Created!', { fontWeight: 'bold', fontSize: '12px', color: '#228B22' }));
        downloadPanel.add(ui.Label('File: ' + filename, { fontSize: '11px' }));
        downloadPanel.add(ui.Label('Scale: ' + scale + 'm | Folder: GEE_Exports', { fontSize: '11px', color: '#666' }));
        downloadPanel.add(ui.Label('➡️ Go to Tasks tab (top-right) and click RUN', { fontSize: '11px', color: '#0066cc' }));

        resultBox.setValue('✅ Export ready! Check Tasks tab.');

    } catch (e) {
        resultBox.setValue('❌ Error: ' + e.message);
    }
}

function resetAction() {
    Map.clear(); Map.add(mainPanel); hideAllLegends();
    downloadPanel.clear();
    currentNdviImage = null;
    currentWaterImage = null;
    currentGeometry = null;
    try { Map.drawingTools().setShown(true); } catch (e) { }
    resultBox.setValue('Reset.');
}

/* Wire Buttons */
runBtn.onClick(runAnalysis);
resetBtn.onClick(resetAction);
snapshotBtn.onClick(runSnapshot);

/* Init Drawing Tools */
var drawingTools = Map.drawingTools();
drawingTools.setShown(true);
drawingTools.setDrawModes(['polygon', 'rectangle']);
print('Running Vegetation & Water Explorer...');
