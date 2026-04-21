/************************************************************
 ECOSYSTEM DROUGHT RESPONSE INTELLIGENCE PLATFORM
 Multi-Evidence Drought Analysis for Australia & Global
 
 Features:
 ─────────────────────────────────────────────────────
 1. NDVI Drought Anomaly (z-score)
 2. SPI — Standardized Precipitation Index
 3. Soil Moisture Anomaly (ERA5-Land)
 4. Evapotranspiration Anomaly (MODIS ET)
 5. Land Surface Temperature Anomaly (MODIS LST)
 6. Rainfall–NDVI Correlation
 7. Vegetation Trend & Resilience (Sen's slope)
 8. NDVI Recovery Rate (post-drought resilience)
 9. SAR Monthly Surface Water
 10. SAR Change Intensity
 11. Composite Drought Severity Index (CDSI)
 12. GeoTIFF Export
 
 PhD Topic: Analysing ecosystem drought responses
            using multiple lines of evidence
 Supervisors: Dr Clare Stephens, Dr Anna Ukkola,
              A/Prof Yi Liu — UNSW Sydney
************************************************************/

/* ================================
   1️⃣ REGION SETUP (Australia + Global)
================================ */

var auStates = ee.FeatureCollection("FAO/GAUL/2015/level1")
    .filter(ee.Filter.eq('ADM0_NAME', 'Australia'));

var stateNames = auStates.aggregate_array('ADM1_NAME').sort();
stateNames = ee.List([
    '── Australia ──',
    'Whole Australia'
]).cat(stateNames).cat(ee.List([
    '── Global Biomes ──',
    'Amazon Basin',
    'Sahel (West Africa)',
    'Southern Africa',
    'Indian Subcontinent',
    'Southeast Asia',
    'Mediterranean Europe'
]));

/* Global region bounding boxes */
var globalRegions = {
    'Amazon Basin': ee.Geometry.Rectangle([-75, -15, -45, 5]),
    'Sahel (West Africa)': ee.Geometry.Rectangle([-18, 10, 25, 20]),
    'Southern Africa': ee.Geometry.Rectangle([15, -35, 40, -10]),
    'Indian Subcontinent': ee.Geometry.Rectangle([68, 6, 97, 36]),
    'Southeast Asia': ee.Geometry.Rectangle([95, -10, 140, 25]),
    'Mediterranean Europe': ee.Geometry.Rectangle([-10, 30, 40, 48])
};

/* ================================
   2️⃣ UI DESIGN
================================ */

var panel = ui.Panel({
    style: { width: '460px', padding: '10px', backgroundColor: '#fafafa' }
});

/* Title */
panel.add(ui.Label('🌍 Ecosystem Drought Response Intelligence',
    { fontSize: '16px', fontWeight: 'bold', color: '#1a237e' }));
panel.add(ui.Label('Multi-evidence drought analysis | PhD Project — UNSW',
    { fontSize: '11px', color: '#666', margin: '0 0 8px 0' }));

/* Region */
panel.add(ui.Label('Region', { fontWeight: 'bold', fontSize: '12px' }));
var regionSelect = ui.Select({
    items: stateNames.getInfo(),
    value: 'Whole Australia',
    style: { width: '100%' }
});
panel.add(regionSelect);

/* Year */
var yearRow = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal') });
yearRow.add(ui.Label('Year:', { margin: '6px 6px 0 0', fontSize: '12px' }));
var yearSelect = ui.Select({
    items: ['2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
    value: '2023',
    style: { width: '80px' }
});
yearRow.add(yearSelect);

yearRow.add(ui.Label('Month:', { margin: '6px 6px 0 12px', fontSize: '12px' }));
var monthList = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
var monthSelect = ui.Select({ items: monthList, style: { width: '110px' } });
yearRow.add(monthSelect);
panel.add(yearRow);

/* Analysis mode */
panel.add(ui.Label('Analysis Mode', { fontWeight: 'bold', fontSize: '12px', margin: '6px 0 2px 0' }));
var modeSelect = ui.Select({
    items: [
        '── Drought Indicators ──',
        'NDVI Drought Anomaly',
        'SPI (Precip Index)',
        'Soil Moisture Anomaly',
        'ET Anomaly (Evapotranspiration)',
        'LST Anomaly (Surface Temp)',
        '── Correlation & Trend ──',
        'Rainfall–NDVI Correlation',
        'Vegetation Trend (Sen Slope)',
        'NDVI Recovery Rate (Resilience)',
        '── Composite ──',
        'Composite Drought Severity (CDSI)',
        '── SAR Water ──',
        'SAR Monthly Water',
        'SAR Change Intensity'
    ],
    value: 'NDVI Drought Anomaly',
    style: { width: '100%' }
});
panel.add(modeSelect);

/* Baseline period for anomaly */
var baseRow = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal') });
baseRow.add(ui.Label('Baseline:', { margin: '6px 4px 0 0', fontSize: '11px', color: '#555' }));
var baseStartSelect = ui.Select({ items: ['2017', '2018', '2019'], value: '2017', style: { width: '70px' } });
var baseEndSelect = ui.Select({ items: ['2020', '2021', '2022'], value: '2021', style: { width: '70px' } });
baseRow.add(baseStartSelect);
baseRow.add(ui.Label('to', { margin: '6px 4px 0 4px', fontSize: '11px' }));
baseRow.add(baseEndSelect);
panel.add(baseRow);

/* Status & Buttons */
var statusLabel = ui.Label('Ready', { fontSize: '12px', color: '#1565c0' });
panel.add(statusLabel);

var btnRow = ui.Panel({ layout: ui.Panel.Layout.flow('horizontal') });
var runButton = ui.Button({
    label: '▶ RUN ANALYSIS',
    style: { backgroundColor: '#1E88E5', color: 'white', fontWeight: 'bold', width: '160px' }
});
var exportButton = ui.Button({
    label: '📥 Export GeoTIFF',
    style: { width: '130px' }
});
var resetButton = ui.Button({
    label: '🔄 Reset',
    style: { width: '80px' }
});
btnRow.add(runButton);
btnRow.add(exportButton);
btnRow.add(resetButton);
panel.add(btnRow);

/* Chart area */
var chartPanel = ui.Panel({ style: { height: '260px', border: '1px solid #e0e0e0', margin: '6px 0' } });
panel.add(chartPanel);

/* Info area */
var infoPanel = ui.Panel({ style: { backgroundColor: '#f5f5f5', padding: '4px', margin: '2px 0' } });
panel.add(infoPanel);

ui.root.insert(0, panel);

/* ================================
   3️⃣ LOOKUP TABLES
================================ */

var monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04', 'May': '05', 'June': '06',
    'July': '07', 'August': '08', 'September': '09', 'October': '10', 'November': '11', 'December': '12'
};
var monthEndDays = {
    'January': '31', 'February': '28', 'March': '31', 'April': '30', 'May': '31', 'June': '30',
    'July': '31', 'August': '31', 'September': '30', 'October': '31', 'November': '30', 'December': '31'
};

var currentResultImage = null;
var currentRegion = null;
var currentRegionName = null;

/* ================================
   4️⃣ HELPER FUNCTIONS
================================ */

function getRegion(name) {
    if (name === 'Whole Australia') return auStates.geometry();
    if (globalRegions[name]) return globalRegions[name];
    if (name.indexOf('──') >= 0) return null;
    return auStates.filter(ee.Filter.eq('ADM1_NAME', name)).geometry();
}

/* Sentinel-2 NDVI collection builder */
function buildNDVI(region, startDate, endDate) {
    return ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate(startDate, endDate)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
        .map(function (img) {
            var ndvi = img.normalizedDifference(['B8', 'B4']).rename('NDVI');
            return ndvi.copyProperties(img, ['system:time_start']);
        });
}

/* CHIRPS monthly rainfall */
function buildMonthlyRainfall(region, startDate, endDate) {
    return ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY")
        .filterBounds(region)
        .filterDate(startDate, endDate);
}

/* ERA5-Land Soil Moisture */
function buildSoilMoisture(region, startDate, endDate) {
    return ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY_AGGR")
        .filterBounds(region)
        .filterDate(startDate, endDate)
        .select('volumetric_soil_water_layer_1');
}

/* MODIS ET */
function buildET(region, startDate, endDate) {
    return ee.ImageCollection("MODIS/061/MOD16A2GF")
        .filterBounds(region)
        .filterDate(startDate, endDate)
        .select('ET');
}

/* MODIS LST */
function buildLST(region, startDate, endDate) {
    return ee.ImageCollection("MODIS/061/MOD11A2")
        .filterBounds(region)
        .filterDate(startDate, endDate)
        .select('LST_Day_1km')
        .map(function (img) {
            return img.multiply(0.02).subtract(273.15).rename('LST_C')
                .copyProperties(img, ['system:time_start']);
        });
}

/* Compute z-score anomaly */
function computeAnomaly(targetCol, baselineCol) {
    var baseMean = baselineCol.mean();
    var baseStd = baselineCol.reduce(ee.Reducer.stdDev());
    var targetMean = targetCol.mean();
    // Avoid division by zero
    var stdSafe = baseStd.where(baseStd.eq(0), 1);
    return targetMean.subtract(baseMean).divide(stdSafe);
}

/* ================================
   5️⃣ ANALYSIS FUNCTIONS
================================ */

/* --- NDVI DROUGHT ANOMALY --- */
function runNDVIAnomaly(region, year, baseStart, baseEnd) {
    var targetNDVI = buildNDVI(region, year + '-01-01', year + '-12-31');
    var baseNDVI = buildNDVI(region, baseStart + '-01-01', baseEnd + '-12-31');
    var anomaly = computeAnomaly(targetNDVI, baseNDVI).rename('NDVI_Anomaly');

    Map.addLayer(anomaly.clip(region),
        { min: -2, max: 2, palette: ['8B0000', 'FF4500', 'FFA500', 'FFFACD', 'white', 'ADFF2F', '228B22', '006400'] },
        'NDVI Anomaly ' + year);

    // Monthly chart
    var months = ee.List.sequence(1, 12);
    var monthlyNDVI = months.map(function (m) {
        m = ee.Number(m);
        var mStart = ee.Date.fromYMD(year, m, 1);
        var mEnd = mStart.advance(1, 'month');
        var val = targetNDVI.filterDate(mStart, mEnd).mean()
            .reduceRegion({ reducer: ee.Reducer.mean(), geometry: region, scale: 10000, maxPixels: 1e10 });
        return ee.Feature(null, { month: m, NDVI: val.get('NDVI') });
    });

    var chart = ui.Chart.feature.byFeature(ee.FeatureCollection(monthlyNDVI), 'month', 'NDVI')
        .setChartType('LineChart')
        .setOptions({ title: 'Monthly NDVI — ' + year, vAxis: { title: 'NDVI' }, hAxis: { title: 'Month' }, lineWidth: 2, pointSize: 4, colors: ['#2E7D32'] });
    chartPanel.add(chart);

    infoPanel.clear();
    infoPanel.add(ui.Label('NDVI Drought Anomaly (z-score)', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('Red = drought stress | Green = above normal'));
    infoPanel.add(ui.Label('Baseline: ' + baseStart + '–' + baseEnd));

    return anomaly;
}

/* --- SPI (Standardized Precipitation Index) --- */
function runSPI(region, year, baseStart, baseEnd) {
    var targetRain = buildMonthlyRainfall(region, year + '-01-01', year + '-12-31');
    var baseRain = buildMonthlyRainfall(region, baseStart + '-01-01', baseEnd + '-12-31');

    var baseMean = baseRain.mean();
    var baseStd = baseRain.reduce(ee.Reducer.stdDev()).select(0);
    var stdSafe = baseStd.where(baseStd.eq(0), 1);

    var spi = targetRain.mean().subtract(baseMean).divide(stdSafe).rename('SPI');

    Map.addLayer(spi.clip(region),
        { min: -2.5, max: 2.5, palette: ['8B0000', 'FF0000', 'FF8C00', 'FFD700', 'FFFACD', 'white', 'E0FFE0', '90EE90', '32CD32', '006400', '003300'] },
        'SPI ' + year);

    infoPanel.clear();
    infoPanel.add(ui.Label('Standardized Precipitation Index (SPI)', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('< -2.0: Extreme drought | -1.5 to -2.0: Severe drought'));
    infoPanel.add(ui.Label('-1.0 to -1.5: Moderate drought | > 1.0: Wet conditions'));
    infoPanel.add(ui.Label('Baseline: ' + baseStart + '–' + baseEnd + ' | Data: CHIRPS'));

    return spi;
}

/* --- SOIL MOISTURE ANOMALY --- */
function runSoilMoisture(region, year, baseStart, baseEnd) {
    var targetSM = buildSoilMoisture(region, year + '-01-01', year + '-12-31');
    var baseSM = buildSoilMoisture(region, baseStart + '-01-01', baseEnd + '-12-31');
    var anomaly = computeAnomaly(targetSM, baseSM).rename('SM_Anomaly');

    Map.addLayer(anomaly.clip(region),
        { min: -2, max: 2, palette: ['8B4513', 'CD853F', 'F5DEB3', 'white', 'B0E0E6', '4682B4', '00008B'] },
        'Soil Moisture Anomaly ' + year);

    // Monthly chart
    var months = ee.List.sequence(1, 12);
    var monthlySM = months.map(function (m) {
        m = ee.Number(m);
        var mStart = ee.Date.fromYMD(year, m, 1);
        var mEnd = mStart.advance(1, 'month');
        var val = targetSM.filterDate(mStart, mEnd).mean()
            .reduceRegion({ reducer: ee.Reducer.mean(), geometry: region, scale: 10000, maxPixels: 1e10 });
        return ee.Feature(null, { month: m, SM: val.get('volumetric_soil_water_layer_1') });
    });

    var chart = ui.Chart.feature.byFeature(ee.FeatureCollection(monthlySM), 'month', 'SM')
        .setChartType('LineChart')
        .setOptions({ title: 'Monthly Soil Moisture — ' + year, vAxis: { title: 'm³/m³' }, hAxis: { title: 'Month' }, lineWidth: 2, pointSize: 4, colors: ['#1565C0'] });
    chartPanel.add(chart);

    infoPanel.clear();
    infoPanel.add(ui.Label('Soil Moisture Anomaly (ERA5-Land)', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('Brown = drier than normal | Blue = wetter than normal'));
    infoPanel.add(ui.Label('Variable: Volumetric soil water (Layer 1, 0–7 cm)'));

    return anomaly;
}

/* --- ET ANOMALY (Evapotranspiration) --- */
function runETAnomaly(region, year, baseStart, baseEnd) {
    var targetET = buildET(region, year + '-01-01', year + '-12-31');
    var baseET = buildET(region, baseStart + '-01-01', baseEnd + '-12-31');
    var anomaly = computeAnomaly(targetET, baseET).rename('ET_Anomaly');

    Map.addLayer(anomaly.clip(region),
        { min: -2, max: 2, palette: ['FF0000', 'FF8C00', 'FFFF00', 'white', '90EE90', '228B22', '006400'] },
        'ET Anomaly ' + year);

    infoPanel.clear();
    infoPanel.add(ui.Label('Evapotranspiration Anomaly (MODIS MOD16A2)', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('Red = reduced ET (water stress) | Green = increased ET'));
    infoPanel.add(ui.Label('Proxy for ecosystem carbon/water flux response'));

    return anomaly;
}

/* --- LST ANOMALY --- */
function runLSTAnomaly(region, year, baseStart, baseEnd) {
    var targetLST = buildLST(region, year + '-01-01', year + '-12-31');
    var baseLST = buildLST(region, baseStart + '-01-01', baseEnd + '-12-31');
    var anomaly = computeAnomaly(targetLST, baseLST).rename('LST_Anomaly');

    Map.addLayer(anomaly.clip(region),
        { min: -2, max: 2, palette: ['00008B', '4169E1', '87CEEB', 'white', 'FFD700', 'FF4500', '8B0000'] },
        'LST Anomaly ' + year);

    infoPanel.clear();
    infoPanel.add(ui.Label('Land Surface Temperature Anomaly (MODIS)', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('Red = hotter than normal | Blue = cooler'));
    infoPanel.add(ui.Label('Higher LST often coincides with drought and water stress'));

    return anomaly;
}

/* --- RAINFALL-NDVI CORRELATION --- */
function runCorrelation(region, baseStart, baseEnd) {
    var start = baseStart + '-01-01';
    var end = baseEnd + '-12-31';

    // Build monthly composites for proper joining
    var months = [];
    for (var y = parseInt(baseStart); y <= parseInt(baseEnd); y++) {
        for (var m = 1; m <= 12; m++) {
            months.push({ year: y, month: m });
        }
    }

    var paired = months.map(function (ym) {
        var mStart = ee.Date.fromYMD(ym.year, ym.month, 1);
        var mEnd = mStart.advance(1, 'month');

        var ndvi = buildNDVI(region, mStart, mEnd).mean().rename('NDVI');
        var rain = buildMonthlyRainfall(region, mStart, mEnd).sum().rename('precip');

        return ndvi.addBands(rain);
    });

    var pairedCol = ee.ImageCollection.fromImages(paired);
    var corr = pairedCol.reduce(ee.Reducer.pearsonsCorrelation());
    var corrImg = corr.select('correlation').rename('Correlation');

    Map.addLayer(corrImg.clip(region),
        { min: -0.5, max: 0.8, palette: ['8B4513', 'D2691E', 'F5DEB3', 'white', 'B0C4DE', '4682B4', '00008B'] },
        'Rainfall–NDVI Correlation');

    infoPanel.clear();
    infoPanel.add(ui.Label('Rainfall–NDVI Pearson Correlation', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('High r = vegetation strongly rain-dependent (drought-vulnerable)'));
    infoPanel.add(ui.Label('Low/negative r = vegetation decoupled from rainfall (resilient or irrigated)'));
    infoPanel.add(ui.Label('Period: ' + baseStart + '–' + baseEnd + ' (monthly composites)'));

    return corrImg;
}

/* --- VEGETATION TREND (Sen's Slope) --- */
function runVegTrend(region, baseStart, baseEnd) {
    var ndviCol = buildNDVI(region, baseStart + '-01-01', baseEnd + '-12-31');
    var trend = ndviCol.reduce(ee.Reducer.sensSlope());
    var slope = trend.select('slope').rename('NDVI_Trend');

    Map.addLayer(slope.clip(region),
        { min: -0.005, max: 0.005, palette: ['8B0000', 'FF4500', 'FFD700', 'FFFFF0', 'ADFF2F', '228B22', '006400'] },
        'Vegetation Trend ' + baseStart + '–' + baseEnd);

    infoPanel.clear();
    infoPanel.add(ui.Label("Vegetation Trend — Sen's Slope", { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('Green = greening (increasing NDVI) — ecosystem recovery'));
    infoPanel.add(ui.Label('Red = browning (decreasing NDVI) — degradation / drought impact'));
    infoPanel.add(ui.Label('Period: ' + baseStart + '–' + baseEnd));

    return slope;
}

/* --- NDVI RECOVERY RATE (Resilience) --- */
function runRecoveryRate(region, year) {
    // Concept: compare post-drought NDVI recovery
    // Pre-drought (prev year Oct-Dec) → Drought peak (target year Jan-Mar) → Recovery (target year Apr-Sep)
    var preDrought = buildNDVI(region, (year - 1) + '-10-01', (year - 1) + '-12-31').median();
    var droughtPeak = buildNDVI(region, year + '-01-01', year + '-03-31').median();
    var recovery = buildNDVI(region, year + '-04-01', year + '-09-30').median();

    // Drop magnitude
    var drop = preDrought.subtract(droughtPeak).rename('drop');
    // Recovery magnitude
    var recoverMag = recovery.subtract(droughtPeak).rename('recovery');
    // Recovery ratio (≥1 = full recovery)
    var recoverRatio = recoverMag.divide(drop.where(drop.eq(0), 0.001)).rename('Recovery_Ratio');

    // Clamp between -2 and 3
    recoverRatio = recoverRatio.clamp(-2, 3);

    Map.addLayer(recoverRatio.clip(region),
        { min: 0, max: 2, palette: ['8B0000', 'FF4500', 'FFA500', 'FFFF00', 'ADFF2F', '32CD32', '006400'] },
        'Recovery Rate ' + year);

    // Monthly NDVI to show drop + recovery
    var months = ee.List.sequence(1, 12);
    var monthlyNDVI = months.map(function (m) {
        m = ee.Number(m);
        var mStart = ee.Date.fromYMD(year, m, 1);
        var mEnd = mStart.advance(1, 'month');
        var val = buildNDVI(region, mStart, mEnd).mean()
            .reduceRegion({ reducer: ee.Reducer.mean(), geometry: region, scale: 10000, maxPixels: 1e10 });
        return ee.Feature(null, { month: m, NDVI: val.get('NDVI') });
    });

    var chart = ui.Chart.feature.byFeature(ee.FeatureCollection(monthlyNDVI), 'month', 'NDVI')
        .setChartType('LineChart')
        .setOptions({
            title: 'NDVI Trajectory — Drought Drop & Recovery (' + year + ')',
            vAxis: { title: 'NDVI' }, hAxis: { title: 'Month' },
            lineWidth: 3, pointSize: 5, colors: ['#D32F2F'],
            curveType: 'function'
        });
    chartPanel.add(chart);

    infoPanel.clear();
    infoPanel.add(ui.Label('NDVI Recovery Rate (Ecosystem Resilience)', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('Ratio > 1.0: Full recovery | < 1.0: Incomplete | < 0: Continued decline'));
    infoPanel.add(ui.Label('Method: (Post_NDVI - Drought_NDVI) / (Pre_NDVI - Drought_NDVI)'));
    infoPanel.add(ui.Label('Key metric for drought resilience in UNSW PhD research'));

    return recoverRatio;
}

/* --- COMPOSITE DROUGHT SEVERITY INDEX (CDSI) --- */
function runCDSI(region, year, baseStart, baseEnd) {
    statusLabel.setValue('Computing multi-indicator composite...');

    var ndviA = computeAnomaly(
        buildNDVI(region, year + '-01-01', year + '-12-31'),
        buildNDVI(region, baseStart + '-01-01', baseEnd + '-12-31')
    ).rename('ndvi_a');

    var spiVal = (function () {
        var targetRain = buildMonthlyRainfall(region, year + '-01-01', year + '-12-31');
        var baseRain = buildMonthlyRainfall(region, baseStart + '-01-01', baseEnd + '-12-31');
        var bm = baseRain.mean();
        var bs = baseRain.reduce(ee.Reducer.stdDev()).select(0);
        bs = bs.where(bs.eq(0), 1);
        return targetRain.mean().subtract(bm).divide(bs).rename('spi');
    })();

    var smA = computeAnomaly(
        buildSoilMoisture(region, year + '-01-01', year + '-12-31'),
        buildSoilMoisture(region, baseStart + '-01-01', baseEnd + '-12-31')
    ).rename('sm_a');

    var lstA = computeAnomaly(
        buildLST(region, year + '-01-01', year + '-12-31'),
        buildLST(region, baseStart + '-01-01', baseEnd + '-12-31')
    ).multiply(-1).rename('lst_a'); // Invert: higher temp = more stress = negative

    // Weighted composite: NDVI(0.30) + SPI(0.25) + SM(0.25) + LST_inv(0.20)
    var cdsi = ndviA.multiply(0.30)
        .add(spiVal.multiply(0.25))
        .add(smA.multiply(0.25))
        .add(lstA.multiply(0.20))
        .rename('CDSI');

    Map.addLayer(cdsi.clip(region),
        { min: -2.5, max: 2.5, palette: ['4A0000', '8B0000', 'FF0000', 'FF8C00', 'FFFF00', 'FFFFF0', 'ADFF2F', '32CD32', '228B22', '006400', '003300'] },
        'Composite Drought Severity ' + year);

    // Also add individual layers (hidden)
    Map.addLayer(ndviA.clip(region), { min: -2, max: 2, palette: ['red', 'white', 'green'] }, 'NDVI component', false);
    Map.addLayer(spiVal.clip(region), { min: -2, max: 2, palette: ['red', 'white', 'blue'] }, 'SPI component', false);
    Map.addLayer(smA.clip(region), { min: -2, max: 2, palette: ['brown', 'white', 'blue'] }, 'SM component', false);
    Map.addLayer(lstA.clip(region), { min: -2, max: 2, palette: ['red', 'white', 'blue'] }, 'LST component (inv)', false);

    infoPanel.clear();
    infoPanel.add(ui.Label('🔴 Composite Drought Severity Index (CDSI)', { fontWeight: 'bold', color: '#B71C1C' }));
    infoPanel.add(ui.Label('Formula: 0.30×NDVI + 0.25×SPI + 0.25×SM + 0.20×(-LST)'));
    infoPanel.add(ui.Label('Deep red = severe drought | Green = above-normal conditions'));
    infoPanel.add(ui.Label('Integrates: vegetation health + rainfall + soil moisture + temperature'));
    infoPanel.add(ui.Label('→ This is the "multiple lines of evidence" approach'));
    infoPanel.add(ui.Label('Individual layers visible in Layers panel (toggle on)'));

    return cdsi;
}

/* --- SAR MONTHLY WATER --- */
function runSARWater(region, year, month) {
    if (!month) { statusLabel.setValue('⚠️ Select a month'); return null; }

    var start = year + '-' + monthMap[month] + '-01';
    var end = year + '-' + monthMap[month] + '-' + monthEndDays[month];

    var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(region)
        .filterDate(start, end)
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');

    var water = s1.median().lt(-15).rename('SAR_Water');

    Map.addLayer(water.updateMask(water).clip(region),
        { palette: ['0066FF'] }, 'SAR Water ' + month + ' ' + year);

    infoPanel.clear();
    infoPanel.add(ui.Label('SAR Monthly Surface Water (Sentinel-1 VV)', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('Threshold: VV < -15 dB | Blue = water'));
    infoPanel.add(ui.Label('Scenes: ' + month + ' ' + year));

    return water;
}

/* --- SAR CHANGE INTENSITY --- */
function runSARChange(region, year, month) {
    if (!month) { statusLabel.setValue('⚠️ Select a month'); return null; }

    var y1 = year - 1;

    function getMask(y) {
        var start = y + '-' + monthMap[month] + '-01';
        var end = y + '-' + monthMap[month] + '-' + monthEndDays[month];
        return ee.ImageCollection('COPERNICUS/S1_GRD')
            .filterBounds(region).filterDate(start, end)
            .filter(ee.Filter.eq('instrumentMode', 'IW'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
            .select('VV').median().lt(-15);
    }

    var m1 = getMask(y1);
    var m2 = getMask(year);

    var change = ee.Image(0)
        .where(m1.and(m2.not()), 1)
        .where(m1.and(m2), 2)
        .where(m2.and(m1.not()), 3)
        .rename('SAR_Change');

    Map.addLayer(change.updateMask(change.gt(0)).clip(region),
        { min: 1, max: 3, palette: ['FF0000', '0000FF', '00FF00'] },
        'Water Change ' + y1 + '→' + year + ' ' + month);

    infoPanel.clear();
    infoPanel.add(ui.Label('SAR Water Change Intensity', { fontWeight: 'bold' }));
    infoPanel.add(ui.Label('Red = Lost | Blue = Stable | Green = Gained'));
    infoPanel.add(ui.Label('Period: ' + month + ' ' + y1 + ' → ' + year));

    return change;
}

/* ================================
   6️⃣ MAIN RUN
================================ */

runButton.onClick(function () {
    statusLabel.setValue('🔄 Processing...');
    chartPanel.clear();
    infoPanel.clear();
    Map.layers().reset();

    var regionName = regionSelect.getValue();
    if (!regionName || regionName.indexOf('──') >= 0) {
        statusLabel.setValue('⚠️ Select a valid region');
        return;
    }

    var region = getRegion(regionName);
    if (!region) { statusLabel.setValue('⚠️ Invalid region'); return; }

    currentRegion = region;
    currentRegionName = regionName;

    var year = parseInt(yearSelect.getValue());
    var month = monthSelect.getValue();
    var mode = modeSelect.getValue();
    var baseStart = baseStartSelect.getValue();
    var baseEnd = baseEndSelect.getValue();

    if (mode.indexOf('──') >= 0) {
        statusLabel.setValue('⚠️ Select a valid analysis mode');
        return;
    }

    Map.centerObject(region, regionName === 'Whole Australia' ? 4 : 6);
    Map.addLayer(ee.Image().paint(region, 0, 2), { palette: ['000000'] }, regionName, true, 0.6);

    try {
        if (mode === 'NDVI Drought Anomaly') {
            currentResultImage = runNDVIAnomaly(region, year, baseStart, baseEnd);
        } else if (mode === 'SPI (Precip Index)') {
            currentResultImage = runSPI(region, year, baseStart, baseEnd);
        } else if (mode === 'Soil Moisture Anomaly') {
            currentResultImage = runSoilMoisture(region, year, baseStart, baseEnd);
        } else if (mode === 'ET Anomaly (Evapotranspiration)') {
            currentResultImage = runETAnomaly(region, year, baseStart, baseEnd);
        } else if (mode === 'LST Anomaly (Surface Temp)') {
            currentResultImage = runLSTAnomaly(region, year, baseStart, baseEnd);
        } else if (mode === 'Rainfall–NDVI Correlation') {
            currentResultImage = runCorrelation(region, baseStart, baseEnd);
        } else if (mode === 'Vegetation Trend (Sen Slope)') {
            currentResultImage = runVegTrend(region, baseStart, baseEnd);
        } else if (mode === 'NDVI Recovery Rate (Resilience)') {
            currentResultImage = runRecoveryRate(region, year);
        } else if (mode === 'Composite Drought Severity (CDSI)') {
            currentResultImage = runCDSI(region, year, baseStart, baseEnd);
        } else if (mode === 'SAR Monthly Water') {
            currentResultImage = runSARWater(region, year, month);
        } else if (mode === 'SAR Change Intensity') {
            currentResultImage = runSARChange(region, year, month);
        }

        if (currentResultImage) {
            statusLabel.setValue('✅ ' + mode + ' — complete');
        }
    } catch (err) {
        statusLabel.setValue('Error: ' + err.message);
    }
});

/* ================================
   7️⃣ EXPORT
================================ */

exportButton.onClick(function () {
    if (!currentResultImage || !currentRegion) {
        statusLabel.setValue('⚠️ Run analysis first');
        return;
    }

    var regionName = currentRegionName || 'Region';
    var year = yearSelect.getValue();
    var mode = modeSelect.getValue().replace(/[^a-zA-Z0-9]/g, '_');
    var fileName = 'Drought_' + regionName.replace(/\s/g, '_') + '_' + mode + '_' + year;

    Export.image.toDrive({
        image: currentResultImage.clip(currentRegion).toFloat(),
        description: fileName,
        folder: 'GEE_Drought_Exports',
        fileNamePrefix: fileName,
        region: currentRegion,
        scale: 1000,
        maxPixels: 1e13,
        fileFormat: 'GeoTIFF'
    });

    statusLabel.setValue('✅ Export task created: ' + fileName + ' | Open Tasks tab → RUN');
});

/* ================================
   8️⃣ RESET
================================ */

resetButton.onClick(function () {
    Map.layers().reset();
    chartPanel.clear();
    infoPanel.clear();
    currentResultImage = null;
    currentRegion = null;
    statusLabel.setValue('🔄 Reset complete');
});
