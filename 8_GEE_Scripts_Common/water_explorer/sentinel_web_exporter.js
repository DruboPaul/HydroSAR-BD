/*
 * ============================================================================
 * SENTINEL-2 HIGH-RESOLUTION IMAGE EXPORTER FOR WEB BACKGROUNDS
 * ============================================================================
 * Purpose: Download stunning satellite imagery for website backgrounds
 * Output: PNG/JPG ready for web use (2560x1440 or higher)
 * Author: IGAS - Institute for GIS and AI Services
 * ============================================================================
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var CONFIG = {
    startDate: '2023-10-01',
    endDate: '2024-03-31',
    cloudCover: 10,
    outputWidth: 2560,
    outputHeight: 1440,
    format: 'png'
};

// ============================================================================
// DEFINE AREAS OF INTEREST
// ============================================================================

var AREAS = {
    confluence: {
        name: 'Padma_Meghna_Jamuna_Confluence',
        geometry: ee.Geometry.Rectangle([89.7, 23.4, 90.7, 24.2]),
        description: 'Three major rivers meeting - dramatic water patterns'
    },
    sundarbans: {
        name: 'Sundarbans_Delta',
        geometry: ee.Geometry.Rectangle([89.0, 21.7, 89.9, 22.5]),
        description: 'World largest mangrove forest'
    },
    dhaka: {
        name: 'Dhaka_Rivers',
        geometry: ee.Geometry.Rectangle([90.2, 23.6, 90.6, 24.0]),
        description: 'Capital city with rivers'
    },
    sylhet: {
        name: 'Sylhet_Haors',
        geometry: ee.Geometry.Rectangle([91.0, 24.6, 91.8, 25.2]),
        description: 'Vast wetlands'
    }
};

// ============================================================================
// SENTINEL-2 IMAGE PROCESSING
// ============================================================================

function createS2Composite(geometry) {
    var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(geometry)
        .filterDate(CONFIG.startDate, CONFIG.endDate)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CONFIG.cloudCover));

    function maskClouds(image) {
        var scl = image.select('SCL');
        var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
        return image.updateMask(mask);
    }

    var composite = s2.map(maskClouds).median();
    return composite.select(['B4', 'B3', 'B2']);
}

function enhanceForWeb(image) {
    return image.visualize({
        min: 200,
        max: 3500,
        gamma: 1.2
    });
}

function generateDownload(geometry, name, description) {
    var composite = createS2Composite(geometry);
    var enhanced = enhanceForWeb(composite);

    var thumbParams = {
        dimensions: CONFIG.outputWidth + 'x' + CONFIG.outputHeight,
        region: geometry,
        format: CONFIG.format
    };

    var url = enhanced.getThumbURL(thumbParams);

    // Clear and add layers
    Map.layers().reset();
    Map.addLayer(enhanced.clip(geometry), {}, name);
    Map.addLayer(geometry, { color: 'FF0000' }, 'Export Boundary', true, 0.5);
    Map.centerObject(geometry, 10);

    return url;
}

// ============================================================================
// UI PANEL
// ============================================================================

var mainPanel = ui.Panel({
    style: {
        width: '320px',
        padding: '15px',
        backgroundColor: '#1e3a5f'
    }
});

// Title
mainPanel.add(ui.Label('🛰️ Sentinel-2 Web Exporter', {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffd700',
    margin: '0 0 10px 0'
}));

// Resolution selector
mainPanel.add(ui.Label('📐 Resolution:', {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: 'bold',
    margin: '10px 0 5px 0'
}));

var resolutionSelect = ui.Select({
    items: [
        { label: '2K (2560x1440) ✓ Recommended', value: '2560x1440' },
        { label: 'Full HD (1920x1080)', value: '1920x1080' },
        { label: '4K (3840x2160)', value: '3840x2160' }
    ],
    value: '2560x1440',
    style: { stretch: 'horizontal' }
});
resolutionSelect.onChange(function (val) {
    var parts = val.split('x');
    CONFIG.outputWidth = parseInt(parts[0]);
    CONFIG.outputHeight = parseInt(parts[1]);
});
mainPanel.add(resolutionSelect);

// Format selector
mainPanel.add(ui.Label('🖼️ Format:', {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: 'bold',
    margin: '10px 0 5px 0'
}));

var formatSelect = ui.Select({
    items: ['png', 'jpg'],
    value: 'png',
    style: { stretch: 'horizontal' }
});
formatSelect.onChange(function (val) {
    CONFIG.format = val;
});
mainPanel.add(formatSelect);

// Divider
mainPanel.add(ui.Label('━━━━━━━━━━━━━━━━━━━━━━━━━━', {
    color: '#4a6fa5',
    margin: '15px 0'
}));

// ============================================================================
// CUSTOM AREA DRAWING
// ============================================================================

mainPanel.add(ui.Label('🎯 CUSTOM AREA:', {
    fontSize: '13px',
    color: '#ffd700',
    fontWeight: 'bold',
    margin: '0 0 8px 0'
}));

mainPanel.add(ui.Label('Draw a rectangle on the map to select your area', {
    fontSize: '11px',
    color: '#b0c4de',
    margin: '0 0 10px 0'
}));

// Drawing tools
var drawingTools = Map.drawingTools();
drawingTools.setShown(true);
drawingTools.setDrawModes(['rectangle']);

// Clear existing geometries
drawingTools.layers().reset();

// Add empty layer for drawing
var drawLayer = drawingTools.addLayer([], 'CustomArea', 'yellow');

// Status and URL panel
var statusLabel = ui.Label('', {
    fontSize: '11px',
    color: '#90ee90',
    margin: '5px 0'
});

var urlPanel = ui.Panel({ style: { margin: '5px 0' } });

// Download custom area button
var downloadCustomBtn = ui.Button({
    label: '⬇️ DOWNLOAD CUSTOM AREA',
    style: {
        stretch: 'horizontal',
        color: '#1e3a5f',
        fontWeight: 'bold'
    }
});

downloadCustomBtn.onClick(function () {
    var geometries = drawingTools.layers().get(0).geometries();

    if (geometries.length() === 0) {
        statusLabel.setValue('⚠️ Please draw a rectangle first!');
        statusLabel.style().set('color', '#ff6b6b');
        return;
    }

    statusLabel.setValue('⏳ Processing...');
    statusLabel.style().set('color', '#ffeb3b');
    urlPanel.clear();

    var geom = geometries.get(0);
    var url = generateDownload(geom, 'Custom_Area', 'User selected area');

    statusLabel.setValue('✅ Ready! Click link below:');
    statusLabel.style().set('color', '#90ee90');

    urlPanel.add(ui.Label('🔗 DOWNLOAD ' + CONFIG.format.toUpperCase(), {
        color: '#00bfff',
        fontSize: '13px',
        fontWeight: 'bold'
    }).setUrl(url));

    print('Custom Area Download URL:');
    print(url);
});

mainPanel.add(downloadCustomBtn);

// Clear drawing button
var clearBtn = ui.Button({
    label: '🗑️ Clear Drawing',
    style: { stretch: 'horizontal' }
});
clearBtn.onClick(function () {
    drawingTools.layers().get(0).geometries().reset();
    statusLabel.setValue('Drawing cleared');
    urlPanel.clear();
    Map.layers().reset();
});
mainPanel.add(clearBtn);

mainPanel.add(statusLabel);
mainPanel.add(urlPanel);

// Divider
mainPanel.add(ui.Label('━━━━━━━━━━━━━━━━━━━━━━━━━━', {
    color: '#4a6fa5',
    margin: '15px 0'
}));

// ============================================================================
// PRESET AREAS
// ============================================================================

mainPanel.add(ui.Label('📍 PRESET AREAS:', {
    fontSize: '13px',
    color: '#ffd700',
    fontWeight: 'bold',
    margin: '0 0 8px 0'
}));

// Create preset buttons
function addPresetButton(key, area) {
    var btn = ui.Button({
        label: area.name.replace(/_/g, ' '),
        style: {
            stretch: 'horizontal',
            margin: '3px 0'
        }
    });

    btn.onClick(function () {
        statusLabel.setValue('⏳ Processing ' + area.name + '...');
        statusLabel.style().set('color', '#ffeb3b');
        urlPanel.clear();

        var url = generateDownload(area.geometry, area.name, area.description);

        statusLabel.setValue('✅ Ready! Click link below:');
        statusLabel.style().set('color', '#90ee90');

        urlPanel.add(ui.Label('🔗 DOWNLOAD ' + CONFIG.format.toUpperCase(), {
            color: '#00bfff',
            fontSize: '13px',
            fontWeight: 'bold'
        }).setUrl(url));

        urlPanel.add(ui.Label(area.description, {
            color: '#b0c4de',
            fontSize: '10px',
            fontStyle: 'italic'
        }));

        print('Download URL for ' + area.name + ':');
        print(url);
    });

    mainPanel.add(btn);
}

// Add all preset buttons
Object.keys(AREAS).forEach(function (key) {
    addPresetButton(key, AREAS[key]);
});

// Instructions
mainPanel.add(ui.Label('━━━━━━━━━━━━━━━━━━━━━━━━━━', {
    color: '#4a6fa5',
    margin: '15px 0 10px 0'
}));

mainPanel.add(ui.Label('📋 How to use:', {
    fontSize: '12px',
    color: '#ffd700',
    fontWeight: 'bold'
}));

mainPanel.add(ui.Label(
    '1. Select resolution & format\n' +
    '2. Draw rectangle OR click preset\n' +
    '3. Click download button\n' +
    '4. Click blue link to open image\n' +
    '5. Right-click → Save As', {
    fontSize: '10px',
    color: '#b0c4de',
    whiteSpace: 'pre'
}));

// Add panel to UI
ui.root.insert(0, mainPanel);

// Initial map view
Map.setCenter(90.0, 23.5, 7);
Map.setOptions('SATELLITE');

print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
print('🛰️ SENTINEL-2 WEB BACKGROUND EXPORTER');
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
print('Draw a rectangle on the map to export any area!');
print('Or use the preset area buttons.');
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
