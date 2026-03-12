# 📋 Research Paper Plan — Detailed Checklist

**Title:** Decadal Surface Water Dynamics in Bangladesh Using Sentinel-1 SAR: Seasonal Variability, Change Detection, and Trend Analysis (2015–2025)

**Estimated Timeline:** 8–12 weeks

---

## ✅ Phase 1: Data Preparation (Week 1–2)

### 1.1 GEE Data Download
- [ ] Select 3–5 districts for detailed analysis (Bhola, Sunamganj, Sylhet, Dhaka, Khulna)
- [ ] For EACH district, run "Monthly Surface Water" → "Total Occurrence" for years 2015–2025
- [ ] Export GeoTIFF using **"Single-band Split (13 Files)"** format at **10m** resolution
- [ ] Download files from Google Drive → organize by district/year
- [ ] Also run for ALL Bangladesh (takes longer, use 30m or 100m resolution)

### 1.2 Data Organization
```
final_paper/
├── data/
│   ├── raw_geotiff/
│   │   ├── Bhola_2015/ (13 files: 12 monthly + occurrence)
│   │   ├── Bhola_2016/
│   │   ├── ...
│   │   └── Bangladesh_2023/
│   ├── processed/
│   │   ├── monthly_area_km2.csv  (Month, Year, District, Area_km2)
│   │   └── seasonal_area_km2.csv
│   └── validation/
│       └── jrc_water_samples.csv
├── figures/
├── main.tex
├── references.bib
└── scripts/
    ├── extract_stats.py (or R)
    └── validation.js (GEE script)
```

### 1.3 Count S1 Scenes
- [ ] Run a GEE script to count total Sentinel-1 scenes per year for Bangladesh → fill Table 1 in paper

---

## ✅ Phase 2: Statistical Analysis (Week 2–4)

### 2.1 Monthly Water Area Calculation
- [ ] For each downloaded GeoTIFF, count water pixels (value=1) × pixel area (100 m²) = area in km²
- [ ] Create a CSV table: Year | Month | District | Water_Area_km2
- [ ] Calculate mean, min, max, std for each month across all years → fill Table in Results

**How to do this (ArcMap or Python):**
```
ArcMap: Spatial Analyst → Zonal Statistics as Table (each band)
Python: rasterio + numpy → count nonzero pixels × 100 / 1e6 = km²
```

### 2.2 Seasonal Water Area
- [ ] Group monthly data by season (4 seasons)
- [ ] Calculate seasonal aggregates → fill Seasonal Table

### 2.3 Change Detection Statistics
- [ ] Run GEE change detection for: 2015 vs 2020, 2015 vs 2025, 2019 vs 2023
- [ ] Export change maps as GeoTIFF
- [ ] Calculate Gained/Lost/Stable area (km²) → fill Change Table

### 2.4 Trend Analysis
- [ ] For each division, calculate annual peak water area (July) for 2015–2025
- [ ] Fit linear regression: y = slope × year + intercept
- [ ] Calculate R², p-value, slope (km²/year) → fill Trend Table
- [ ] Optional: Mann-Kendall test for non-parametric trend significance

---

## ✅ Phase 3: Validation / Accuracy Assessment (Week 4–5)

### 3.1 JRC Comparison (In GEE)
- [ ] Load JRC Global Surface Water: `JRC/GSW1_4/MonthlyHistory`
- [ ] For 3 selected districts × 3 months (Jan, Jul, Oct) × 2 years (2019, 2023):
  - Generate SAR water mask (your code)
  - Generate JRC water mask (from JRC dataset)
  - Create stratified random sample (1000–3000 points)
  - Compare: TP, TN, FP, FN
- [ ] Calculate: Overall Accuracy, Kappa, Producer's/User's Accuracy, F1
- [ ] Fill confusion matrix table in paper

### 3.2 Visual Validation
- [ ] Open Google Earth Pro
- [ ] Select 20 random locations in Bangladesh
- [ ] Compare SAR water detection with high-res satellite imagery
- [ ] Take screenshots for supplementary material

### 3.3 Known Flood Event Check
- [ ] Check SAR water maps for July 2017 (major Bangladesh flood)
- [ ] Check July 2020 (monsoon flood)
- [ ] Verify water extent matches known flood reports → cite reports

---

## ✅ Phase 4: Figures (Week 5–6)

- [ ] **Figure 1:** Study area location map (Bangladesh with divisions + rivers)
- [ ] **Figure 2:** Methodology flowchart (use draw.io or PowerPoint)
- [ ] **Figure 3:** Monthly water maps (July) for 4 selected years (2015, 2018, 2020, 2023)
- [ ] **Figure 4:** Monthly water area time series (line chart, 12 months × 10 years)
- [ ] **Figure 5:** Annual occurrence map (0–12 gradient) for 2023
- [ ] **Figure 6:** Seasonal water maps (4 seasons for 2023)
- [ ] **Figure 7:** Seasonal water area comparison (bar chart)
- [ ] **Figure 8:** Change detection map (2015 vs 2025, July)
- [ ] **Figure 9:** Decadal trend plot (annual peak water area with trend line)
- [ ] **Figure 10:** Accuracy assessment (confusion matrix + example locations)

---

## ✅ Phase 5: Paper Writing (Week 6–9)

### Writing Order (recommended):
1. [ ] **Methodology** (Section 4) — easiest, describe your GEE code logic
2. [ ] **Data** (Section 3) — list datasets, table of S1 specs
3. [ ] **Results** (Section 5) — fill tables with actual numbers, add figures
4. [ ] **Study Area** (Section 2) — standard description + location map
5. [ ] **Discussion** (Section 6) — interpret results, compare with literature
6. [ ] **Introduction** (Section 1) — research gap, objectives
7. [ ] **Conclusion** (Section 7) — summary of findings
8. [ ] **Abstract** — write LAST after everything is complete

### References
- [ ] Collect 30–50 references:
  - SAR water detection: Twele et al. (2016), Bioresita et al. (2018)
  - JRC GSW: Pekel et al. (2016)
  - Bangladesh floods: Uddin et al. (2019), Islam et al. (2020)
  - GEE: Gorelick et al. (2017)
  - Sentinel-1: Torres et al. (2012)
- [ ] Create `references.bib` file

---

## ✅ Phase 6: Review & Submit (Week 9–12)

- [ ] Self-review: check all tables have data, all figures are referenced
- [ ] Co-author review
- [ ] Grammar and formatting check
- [ ] Select target journal (Journal of Hydrology, Remote Sensing, or MDPI Water)
- [ ] Format paper according to journal template
- [ ] Submit

---

## 🔴 ML/DL Decision — RECOMMENDATION: SKIP FOR NOW

### Why Skip ML/DL?
1. The paper is already strong WITHOUT ML — decadal analysis + validation is sufficient
2. Adding ML increases work by 4–6 additional weeks
3. ML prediction of water occurrence is a separate research contribution → can be a 2nd paper
4. Journal reviewers may question why ML is needed when trend analysis already shows patterns

### If You WANT ML Later (2nd Paper):
- Use downloaded GeoTIFF data as training features
- Random Forest or LSTM for temporal prediction
- Train on 2015–2022, test on 2023–2025
- That becomes: "HydroSAR-Bangladesh Part II: ML-based Water Prediction"

---

## 📌 Immediate Next Steps (Today/Tomorrow)
1. [ ] Start downloading GeoTIFF data from GEE for 3–5 districts (2015–2025)
2. [ ] Write the Methodology section in LaTeX (it's just describing your code)
3. [ ] Create the study area location map
