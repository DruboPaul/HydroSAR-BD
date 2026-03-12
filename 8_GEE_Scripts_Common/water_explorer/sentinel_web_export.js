/*
 * ============================================================================
 * SENTINEL-2 HIGH-RESOLUTION IMAGE EXPORTER FOR WEB BACKGROUNDS
 * ============================================================================
 * Author: IGAS - Institute for GIS and AI Services
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var CONFIG = {
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    cloudCover: 15,
    outputWidth: 1920,
    outputHeight: 1080,
    format: 'png'
};

// ============================================================================
// DEFINE PRESET AREAS (Smaller areas to avoid memory issues)
// ============================================================================

var AREAS = {
    confluence: {
        name: 'PadmaMeghnaConfluence',
        geometry: ee.Geometry.Rectangle([90.2, 23.5, 90.6, 23.9]),
        description: 'River confluence area'
    },
    sundarbans: {
        name: 'SundarbansCoast',
        geometry: ee.Geometry.Rectangle([89.3, 21.8, 89.7, 22.2]),
        description: 'Mangrove coastline'
    },
    dhaka: {
        name: 'DhakaRivers',
        geometry: ee.Geometry.Rectangle([90.3, 23.7, 90.5, 23.9]),
        description: 'Dhaka with rivers'
    },
    sylhet: {
        name: 'SylhetHaor',
        geometry: ee.Geometry.Rectangle([91.2, 24.8, 91.5, 25.1]),
        description: 'Haor wetlands'
    }
};

// ============================================================================
// IMAGE PROCESSING
// ============================================================================

function createS2Composite(geometry) {
    var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(geometry)
        .filterDate(CONFIG.startDate, CONFIG.endDate)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CONFIG.cloudCover))
        .select(['B4', 'B3', 'B2']);

    return s2.median();
}

function visualize(image) {
    return image.visualize({
        min: 300,
        max: 3000,
        gamma: 1.1
    });
}

// ============================================================================
// UI PANEL
// ============================================================================

var mainPanel = ui.Panel({
    style: { width: '300px', padding: '10px', backgroundColor: '#1a365d' }
});

mainPanel.add(ui.Label('Sentinel-2 Web Exporter', {
    fontSize: '16px', fontWeight: 'bold', color: '#ffd700'
}));

// Resolution
mainPanel.add(ui.Label('Resolution:', {
    fontSize: '11px', color: '#fff', margin: '10px 0 3px 0'
}));

var resSelect = ui.Select({
    items: [
        { label: 'HD (1920x1080)', value: '1920x1080' },
        { label: '2K (2560x1440)', value: '2560x1440' }
    ],
    value: '1920x1080',
    style: { stretch: 'horizontal' }
});
resSelect.onChange(function (val) {
    var p = val.split('x');
    CONFIG.outputWidth = parseInt(p[0]);
    CONFIG.outputHeight = parseInt(p[1]);
});
mainPanel.add(resSelect);

// Format
mainPanel.add(ui.Label('Format:', {
    fontSize: '11px', color: '#fff', margin: '8px 0 3px 0'
}));

var fmtSelect = ui.Select({
    items: ['png', 'jpg'],
    value: 'png',
    style: { stretch: 'horizontal' }
});
fmtSelect.onChange(function (val) { CONFIG.format = val; });
mainPanel.add(fmtSelect);

// Divider
mainPanel.add(ui.Label('─────────────────────────', { color: '#456' }));

// Status
var statusLabel = ui.Label('Select an area below', {
    fontSize: '11px', color: '#90ee90'
});
var urlPanel = ui.Panel();

// ============================================================================
// CUSTOM DRAWING
// ============================================================================

mainPanel.add(ui.Label('CUSTOM AREA:', {
    fontSize: '12px', color: '#ffd700', fontWeight: 'bold', margin: '10px 0 5px 0'
}));

mainPanel.add(ui.Label('1. Use rectangle tool on map\n2. Draw SMALL area\n3. Click Download button', {
    fontSize: '10px', color: '#b0c4de', whiteSpace: 'pre'
}));

var drawTools = Map.drawingTools();
drawTools.setShown(true);
drawTools.setDrawModes(['rectangle']);
drawTools.layers().reset();
drawTools.addLayer([], 'DrawArea', 'yellow');

var dlCustomBtn = ui.Button({
    label: 'Download Custom Area',
    style: { stretch: 'horizontal', margin: '5px 0' }
});

dlCustomBtn.onClick(function () {
    var geoms = drawTools.layers().get(0).geometries();
    if (geoms.length() === 0) {
        statusLabel.setValue('Draw a rectangle first!');
        statusLabel.style().set('color', '#ff6b6b');
        return;
    }

    statusLabel.setValue('Processing...');
    statusLabel.style().set('color', '#ffeb3b');
    urlPanel.clear();

    var geom = geoms.get(0);

    // Check area size
    var areaSqKm = geom.area().divide(1e6);
    areaSqKm.evaluate(function (area) {
        if (area > 2000) {
            statusLabel.setValue('Area too large! Draw smaller area (<2000 km2)');
            statusLabel.style().set('color', '#ff6b6b');
            return;
        }

        try {
            var composite = createS2Composite(geom);
            var vis = visualize(composite);

            Map.layers().reset();
            Map.addLayer(vis.clip(geom), {}, 'Preview');
            Map.centerObject(geom, 11);

            var url = vis.getThumbURL({
                dimensions: CONFIG.outputWidth + 'x' + CONFIG.outputHeight,
                region: geom,
                format: CONFIG.format
            });

            statusLabel.setValue('Ready! Click link:');
            statusLabel.style().set('color', '#90ee90');

            urlPanel.add(ui.Label('DOWNLOAD ' + CONFIG.format.toUpperCase(), {
                color: '#00bfff', fontSize: '12px', fontWeight: 'bold'
            }).setUrl(url));

            print('Download URL:', url);
        } catch (e) {
            statusLabel.setValue('Error: Try smaller area');
            statusLabel.style().set('color', '#ff6b6b');
        }
    });
});

mainPanel.add(dlCustomBtn);

var clearBtn = ui.Button({
    label: 'Clear',
    style: { stretch: 'horizontal' }
});
clearBtn.onClick(function () {
    drawTools.layers().get(0).geometries().reset();
    Map.layers().reset();
    urlPanel.clear();
    statusLabel.setValue('Cleared');
});
mainPanel.add(clearBtn);

mainPanel.add(statusLabel);
mainPanel.add(urlPanel);

// Divider
mainPanel.add(ui.Label('─────────────────────────', { color: '#456' }));

// ============================================================================
// PRESET BUTTONS
// ============================================================================

mainPanel.add(ui.Label('PRESET AREAS:', {
    fontSize: '12px', color: '#ffd700', fontWeight: 'bold', margin: '5px 0'
}));

function processPreset(area) {
    statusLabel.setValue('Processing ' + area.name + '...');
    statusLabel.style().set('color', '#ffeb3b');
    urlPanel.clear();

    var composite = createS2Composite(area.geometry);
    var vis = visualize(composite);

    Map.layers().reset();
    Map.addLayer(vis.clip(area.geometry), {}, area.name);
    Map.centerObject(area.geometry, 11);

    var url = vis.getThumbURL({
        dimensions: CONFIG.outputWidth + 'x' + CONFIG.outputHeight,
        region: area.geometry,
        format: CONFIG.format
    });

    statusLabel.setValue('Ready! Click link:');
    statusLabel.style().set('color', '#90ee90');

    urlPanel.add(ui.Label('DOWNLOAD ' + CONFIG.format.toUpperCase(), {
        color: '#00bfff', fontSize: '12px', fontWeight: 'bold'
    }).setUrl(url));

    urlPanel.add(ui.Label(area.description, {
        color: '#999', fontSize: '10px'
    }));

    print('Download URL for ' + area.name + ':', url);
}

Object.keys(AREAS).forEach(function (key) {
    var area = AREAS[key];
    var btn = ui.Button({
        label: area.name,
        style: { stretch: 'horizontal', margin: '2px 0' }
    });
    btn.onClick(function () { processPreset(area); });
    mainPanel.add(btn);
});

// ============================================================================
// DRIVE EXPORT SECTION
// ============================================================================

mainPanel.add(ui.Label('─────────────────────────', { color: '#456', margin: '10px 0' }));

mainPanel.add(ui.Label('LARGE AREA EXPORT:', {
    fontSize: '12px', color: '#ffd700', fontWeight: 'bold'
}));

mainPanel.add(ui.Label('For large areas, use Drive export.\nDraw area, then click button below.', {
    fontSize: '10px', color: '#b0c4de', whiteSpace: 'pre'
}));

var driveBtn = ui.Button({
    label: 'Export to Google Drive',
    style: { stretch: 'horizontal', margin: '5px 0' }
});

driveBtn.onClick(function () {
    var geoms = drawTools.layers().get(0).geometries();
    if (geoms.length() === 0) {
        statusLabel.setValue('Draw a rectangle first!');
        statusLabel.style().set('color', '#ff6b6b');
        return;
    }

    var geom = geoms.get(0);
    var composite = createS2Composite(geom);
    var vis = visualize(composite);

    Export.image.toDrive({
        image: vis,
        description: 'Sentinel2_WebBackground',
        folder: 'GEE_Exports',
        region: geom,
        scale: 10,
        maxPixels: 1e9,
        fileFormat: 'GeoTIFF'
    });

    statusLabel.setValue('Check Tasks tab to run export!');
    statusLabel.style().set('color', '#90ee90');
});

mainPanel.add(driveBtn);

// Add panel
ui.root.insert(0, mainPanel);
Map.setCenter(90.0, 23.5, 8);
Map.setOptions('SATELLITE');

print('=== SENTINEL WEB EXPORTER ===');
print('Draw small rectangles for direct download');
print('Use Drive export for large areas');
