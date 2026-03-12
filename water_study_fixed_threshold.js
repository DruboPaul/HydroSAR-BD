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

/* -------------------- Export State Tracking -------------------- */
var lastExportImage = null;       // the image to export
var lastExportRegion = null;      // geometry for clipping/export
var lastExportName = '';          // descriptive file name
var lastExportType = '';          // 'monthly', 'occurrence', 'change', 'seasonal'

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

/* GeoTIFF Export Options row */
var exportRow = greyRow();
var exportContent = contentRow();
var resolutionSelect = ui.Select({ items: ['10m', '30m', '100m'], value: '30m', style: selectStyle });
var exportFormatSelect = ui.Select({
  items: ['Multi-band (Single File)', 'Single-band (Current View)'],
  value: 'Multi-band (Single File)',
  style: selectStyle
});
var geoBtn = ui.Button({ label: 'Export GeoTIFF', style: buttonStyle });

resolutionSelect.style().set({ width: '80px', margin: '2px' });
exportFormatSelect.style().set({ width: '220px', margin: '2px' });
geoBtn.style().set({ width: '140px', margin: '2px' });

exportContent.add(resolutionSelect);
exportContent.add(exportFormatSelect);
exportContent.add(geoBtn);
exportRow.add(exportContent);
mainPanel.add(exportRow);

/* Actions row */
var actionsRow = greyRow();
var actionsContent = contentRow();
var genChartBtn = ui.Button({ label: 'Generate Chart', style: buttonStyle });
var aboutBtn = ui.Button({ label: 'About', style: buttonStyle });
var resetBtn = ui.Button({ label: 'Reset', style: buttonStyle });

genChartBtn.style().set({ width: '180px', margin: '2px' });
aboutBtn.style().set({ width: '140px', margin: '2px' });
resetBtn.style().set({ width: '140px', margin: '2px' });

actionsContent.add(genChartBtn);
actionsContent.add(aboutBtn);
actionsContent.add(resetBtn);
actionsRow.add(actionsContent);
mainPanel.add(actionsRow);

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
  if (!v) { districtSelect.items().reset([]); return; }
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
  if (selDistrict) return { feature: districts.filter(ee.Filter.eq('ADM2_NAME', selDistrict)).first(), name: selDistrict + '_District' };
  if (selDivision) return { feature: divisions.filter(ee.Filter.eq('ADM1_NAME', selDivision)).first(), name: selDivision + '_Division' };
  return { feature: bdBoundary.first(), name: 'Bangladesh' };
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
  return countImg.rename('occurrence');
}

/* Build a 12-band image (one band per month) for multi-band export */
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

  Map.clear(); Map.add(mainPanel);
  Map.centerObject(regionGeom, 8);

  try {
    if (selMonth === 'Total Occurrence') {
      var occ = computeS1AnnualOccurrence(regionGeom, selYear).clip(regionGeom);
      Map.addLayer(occ.updateMask(occ.gt(0)), { min: 1, max: 12, palette: occurrenceColors }, regionInfo.name + ' occurrence ' + selYear);
      Map.add(legendS1);
      drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
      resultBox.setValue('Total occurrence displayed: ' + selYear);

      // Store for export — multi-band (12 months) + occurrence band
      var multiBand = buildMultiBandMonthlyImage(regionGeom, selYear);
      lastExportImage = multiBand.addBands(occ);
      lastExportRegion = regionGeom;
      lastExportName = 'Water_Occurrence_' + regionInfo.name + '_' + selYear;
      lastExportType = 'occurrence';

    } else {
      var start = selYear + '-' + monthMap[selMonth] + '-01';
      var end = selYear + '-' + monthMap[selMonth] + '-' + monthEndDays[selMonth];
      var s1col = ee.ImageCollection('COPERNICUS/S1_GRD')
        .filterBounds(regionGeom).filterDate(start, end)
        .filter(ee.Filter.eq('instrumentMode', 'IW'))
        .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
        .select('VV');
      var count = s1col.size().getInfo();
      if (count === 0) { resultBox.setValue('No Sentinel-1 images for ' + selMonth + ' ' + selYear); return; }
      var vvMedian = s1col.median().clip(regionGeom);
      var water = vvMedian.lt(ee.Number(thresholds[selMonth]));
      Map.addLayer(water.updateMask(water), { palette: ['0000FF'] }, regionInfo.name + ' ' + selMonth + ' ' + selYear);
      drawRegionBoundaryOnly(regionInfo.feature, regionInfo.name + ' Boundary');
      resultBox.setValue('Monthly water displayed: ' + selMonth + ' ' + selYear + ' (S1 images: ' + count + ')');

      // Store for export — single month water mask
      lastExportImage = water.rename(selMonth + '_Water').clip(regionGeom);
      lastExportRegion = regionGeom;
      lastExportName = 'Water_' + selMonth + '_' + regionInfo.name + '_' + selYear;
      lastExportType = 'monthly';

      // Also build multi-band for multi-band export format
      var multiBandImg = buildMultiBandMonthlyImage(regionGeom, selYear);
      if (exportFormatSelect.getValue() === 'Multi-band (Single File)') {
        lastExportImage = multiBandImg;
        lastExportName = 'Water_Monthly_AllBands_' + regionInfo.name + '_' + selYear;
      }
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
    if (c1 === 0 && c2 === 0) { resultBox.setValue('No Sentinel-1 images for selected month in both years.'); return; }
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

    // Store for export — 3-band (Lost, Stable, Gained)
    var exportImg = lost.rename('Lost').addBands(stable.rename('Stable')).addBands(gained.rename('Gained')).clip(regionGeom);
    lastExportImage = exportImg;
    lastExportRegion = regionGeom;
    lastExportName = 'Water_Change_' + m + '_' + y1 + '_to_' + y2 + '_' + regionInfo.name;
    lastExportType = 'change';

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

    // Store for export — seasonal water mask
    var seasonShort = seasonKey.charAt(0).toUpperCase() + seasonKey.slice(1);
    lastExportImage = unionMaskMasked.rename('Seasonal_' + seasonShort + '_Water');
    lastExportRegion = regionGeom;
    lastExportName = 'Water_Seasonal_' + seasonShort + '_' + regionInfo.name + '_' + y;
    lastExportType = 'seasonal';

  } catch (err) {
    resultBox.setValue('Seasonal error: ' + err.message);
  }
}

/* -------------------- GeoTIFF Export -------------------- */
function runGeoTIFFExport() {
  chartPanel.clear();

  // Check if any analysis has been run
  if (!lastExportImage) {
    resultBox.setValue('⚠ Run an analysis first (Monthly / Change / Seasonal) before exporting.');
    return;
  }

  var res = resolutionSelect.getValue();
  var scale = parseInt(res.replace('m', ''));
  var format = exportFormatSelect.getValue();

  var fileName = lastExportName + '_' + res;
  // Clean filename (replace spaces with underscores)
  fileName = fileName.replace(/ /g, '_');

  try {
    if (format === 'Multi-band (Single File)') {
      // For monthly/occurrence: export multi-band (12 months + occurrence)
      // For change: export 3-band (Lost, Stable, Gained)
      // For seasonal: export single-band
      Export.image.toDrive({
        image: lastExportImage,
        description: fileName,
        folder: 'GEE_Water_Exports',
        fileNamePrefix: fileName,
        region: lastExportRegion,
        scale: scale,
        maxPixels: 1e13,
        crs: 'EPSG:4326'
      });

      chartPanel.add(ui.Label('📦 GeoTIFF Export Queued', { fontWeight: 'bold', fontSize: '14px', margin: '4px' }));
      chartPanel.add(ui.Label('File: ' + fileName + '.tif', { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('Format: ' + format, { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('Resolution: ' + res, { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('Type: ' + lastExportType, { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('Folder: GEE_Water_Exports (Google Drive)', { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('→ Go to Tasks tab (top-right) and click RUN to start the export.', { fontWeight: 'bold', fontSize: '12px', margin: '6px 2px', color: '#1a3a5c' }));
      resultBox.setValue('Export queued: ' + fileName + ' — Open Tasks tab to run.');

    } else {
      // Single-band (Current View) — export only the displayed result
      var singleBandImage = lastExportImage;

      // If multi-band, select just the first band for single-band export
      var bandNames = lastExportImage.bandNames().getInfo();
      if (bandNames.length > 1) {
        singleBandImage = lastExportImage.select(bandNames[0]);
        fileName = fileName + '_band_' + bandNames[0];
      }

      Export.image.toDrive({
        image: singleBandImage,
        description: fileName,
        folder: 'GEE_Water_Exports',
        fileNamePrefix: fileName,
        region: lastExportRegion,
        scale: scale,
        maxPixels: 1e13,
        crs: 'EPSG:4326'
      });

      chartPanel.add(ui.Label('📦 GeoTIFF Export Queued', { fontWeight: 'bold', fontSize: '14px', margin: '4px' }));
      chartPanel.add(ui.Label('File: ' + fileName + '.tif', { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('Format: Single-band', { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('Resolution: ' + res, { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('Folder: GEE_Water_Exports (Google Drive)', { fontSize: '12px', margin: '2px' }));
      chartPanel.add(ui.Label('→ Go to Tasks tab (top-right) and click RUN to start the export.', { fontWeight: 'bold', fontSize: '12px', margin: '6px 2px', color: '#1a3a5c' }));
      resultBox.setValue('Export queued: ' + fileName + ' — Open Tasks tab to run.');
    }
  } catch (err) {
    resultBox.setValue('Export error: ' + err.message);
  }
}

/* -------------------- Chart / About / Reset -------------------- */
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
      var col = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(regionGeom).filterDate(start, end)
        .filter(ee.Filter.eq('instrumentMode', 'IW')).filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')).select('VV');
      var med = ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0));
      return ee.Image(med).lt(ee.Number(thresholds[monthName]));
    }

    // Change chart
    if (y1 && y2 && changeMonth) {
      chartPanel.add(ui.Label('Generating change chart for ' + changeMonth + ' — ' + y1 + ' → ' + y2));
      var med1 = monthlyMaskFor(y1, changeMonth);
      var med2 = monthlyMaskFor(y2, changeMonth);
      var lost = med1.and(med2.not());
      var stable = med1.and(med2);
      var gained = med2.and(med1.not());
      var chart = ui.Chart.array.values(
        ee.Array([imageAreaKm2(lost, regionGeom, SCALE), imageAreaKm2(stable, regionGeom, SCALE), imageAreaKm2(gained, regionGeom, SCALE)]),
        0, ee.List(['Lost', 'Stable', 'Gained']))
        .setChartType('ColumnChart')
        .setOptions({ title: 'Change water area (km²) — ' + changeMonth + ' (' + y1 + ' → ' + y2 + ') — ' + regionInfo.name, vAxis: { title: 'Area (km²)' }, legend: { position: 'none' }, fontSize: 12 });
      chartPanel.clear(); chartPanel.add(chart);
      resultBox.setValue('Change chart generated: Lost/Stable/Gained areas (km²).');
      return;
    }

    // Seasonal chart
    if (seasonalY && seasonalS) {
      chartPanel.add(ui.Label('Generating seasonal chart for ' + seasonalY + ' — ' + regionInfo.name));
      var seasonMonthsMap = {
        'Dry Winter (Dec–Feb)': ['December', 'January', 'February'],
        'Pre-Monsoon (Mar–May)': ['March', 'April', 'May'],
        'Monsoon (Jun–Sep)': ['June', 'July', 'August', 'September'],
        'Post-Monsoon (Oct–Nov)': ['October', 'November']
      };
      var seasonNames = ['Dry Winter (Dec–Feb)', 'Pre-Monsoon (Mar–May)', 'Monsoon (Jun–Sep)', 'Post-Monsoon (Oct–Nov)'];
      var seasonAreas = seasonNames.map(function (snm) {
        var mos = seasonMonthsMap[snm];
        var uMask = ee.Image(0);
        mos.forEach(function (mo) {
          var start = seasonalY + '-' + monthMap[mo] + '-01';
          var end = seasonalY + '-' + monthMap[mo] + '-' + monthEndDays[mo];
          var col = ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(regionGeom).filterDate(start, end)
            .filter(ee.Filter.eq('instrumentMode', 'IW')).filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')).select('VV');
          var med = ee.Algorithms.If(col.size().gt(0), col.median(), ee.Image(0));
          var mask = ee.Image(med).lt(ee.Number(thresholds[mo]));
          uMask = uMask.max(mask.unmask(0));
        });
        return imageAreaKm2(uMask.updateMask(uMask).clip(regionGeom), regionGeom, SCALE);
      });
      var chart = ui.Chart.array.values(ee.Array(ee.List(seasonAreas)), 0, ee.List(seasonNames))
        .setChartType('ColumnChart')
        .setOptions({ title: 'Seasonal water area (km²) — ' + seasonalY + ' — ' + regionInfo.name, vAxis: { title: 'Area (km²)' }, legend: { position: 'none' }, fontSize: 12 });
      chartPanel.clear(); chartPanel.add(chart);
      resultBox.setValue('Seasonal chart generated for ' + seasonalY + '.');
      return;
    }

    // Monthly chart
    if (monthlyY) {
      chartPanel.add(ui.Label('Generating monthly chart for ' + monthlyY + ' — ' + regionInfo.name));
      var months = Object.keys(thresholds);
      var monthAreas = months.map(function (m) {
        var mask = monthlyMaskFor(monthlyY, m);
        return imageAreaKm2(mask.updateMask(mask).clip(regionGeom), regionGeom, SCALE);
      });
      var chart = ui.Chart.array.values(ee.Array(ee.List(monthAreas)), 0, ee.List(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']))
        .setChartType('ColumnChart')
        .setOptions({ title: 'Monthly water area (km²) — ' + monthlyY + ' — ' + regionInfo.name, vAxis: { title: 'Area (km²)' }, legend: { position: 'none' }, fontSize: 11, bar: { groupWidth: '60%' } });
      chartPanel.clear(); chartPanel.add(chart);
      resultBox.setValue('Monthly chart generated for ' + monthlyY + '.');
      return;
    }

    resultBox.setValue('Select parameters and try again.');
  } catch (err) {
    chartPanel.clear();
    resultBox.setValue('Chart error: ' + err.message);
  }
}

function aboutAction() {
  var ap = ui.Panel({ style: { position: 'top-center', padding: '6px', backgroundColor: '#fff', border: '1px solid #ccc' } });
  ap.add(ui.Label('About SAR-based Surface Water Explorer', { fontWeight: 'bold' }));
  ap.add(ui.Label('Sentinel-1 (VV) threshold-based monthly, change and seasonal views.'));
  ap.add(ui.Label('Export analysis results as GeoTIFF to Google Drive.'));
  ap.add(ui.Button('Close', function () { Map.remove(ap); }));
  Map.add(ap);
}

function resetAction() {
  divisionSelect.setValue(null); districtSelect.items().reset([]);
  yearSelect.setValue('2023'); monthSelect.setValue(null);
  visYear1.setValue('2019'); visYear2.setValue('2023'); visMonthSelect.setValue(null);
  seasonalYear.setValue('2023'); seasonSelect.setValue(null);
  chartPanel.clear(); resultBox.setValue('');
  lastExportImage = null; lastExportRegion = null; lastExportName = ''; lastExportType = '';
  Map.clear(); Map.add(mainPanel); hideAllLegends(); Map.centerObject(bdBoundary, 7);
}

/* -------------------- Initialize -------------------- */
Map.clear(); Map.add(mainPanel);
Map.centerObject(bdBoundary, 7);

/* Wire the buttons */
monthlyBtn.onClick(runMonthly);
changeBtn.onClick(runChange);
seasonalBtn.onClick(runSeasonal);
genChartBtn.onClick(genChart);
geoBtn.onClick(runGeoTIFFExport);
aboutBtn.onClick(aboutAction);
resetBtn.onClick(resetAction);
