# HydroSAR-Bangladesh: Reproducibility Pipeline
# ================================================
# Spatiotemporally Adaptive SAR Water Detection using Gaussian Mixture Modeling (ST-GMM)
# 11-Year Sentinel-1 Analysis (2015-2025), Bangladesh

## Overview

This repository contains all code and data required to reproduce the results presented in:

> **[Paper Title]**, [Authors], [Journal], [Year].

The pipeline processes 7,891 Sentinel-1 GRD acquisitions via Google Earth Engine,
fits district-level Gaussian Mixture Models to derive adaptive water/land thresholds,
and produces all statistical analyses and publication figures.

---

## Repository Structure

```
SAR Analysis GMM/
├── requirements.txt                  # Python dependencies
├── REPRODUCE.md                      # This file
│
├── 8_GEE_Scripts_Common/             # Stage 1: Google Earth Engine scripts
│   ├── export_11yr_histograms.js     # Extract VV histograms (64 dist × 12 mo × 11 yr)
│   ├── monthly_water_area_export.js  # Compute water area (validation/cross-check)
│   ├── persistence_change_export.js  # Water persistence & change detection maps
│   ├── gmm_field_validation.js       # Accuracy assessment vs field data
│   ├── jrc_validation.js             # Cross-validation against JRC GSW
│   └── water_explorer/               # Interactive GEE web application
│
├── scripts/                          # Stages 2-5: Local analysis
│   ├── batch_gmm_processor.py        # Stage 2: Fit GMM → threshold lookup table
│   ├── compute_water_area_from_histograms.py  # Stage 3: Apply thresholds → water areas
│   ├── generate_all_figures.py       # Stage 5: Publication figures (Python)
│   ├── validation_viz.R              # Stage 5: Confusion matrix + monthly accuracy
│   ├── run_smk.R                     # Stage 4: Mann-Kendall + Sen's slope (R)
│   ├── generate_supplementary_plot.R # Stage 5: Regional trend plots
│   └── gmm_threshold.py             # Demo: GMM vs Otsu comparison
│
├── data/
│   ├── GEE_data/
│   │   ├── Bangladesh_District_VV_Histograms_2015_2025.csv  # Stage 1 output (57 MB)
│   │   └── computed_results/         # Stage 3 outputs
│   │       ├── national_monthly_water_area_2015_2025.csv
│   │       ├── district_monthly_water_area_2015_2025.csv
│   │       ├── division_july_water_area_2015_2025.csv
│   │       ├── table4_monthly_water_stats.csv
│   │       └── table5_seasonal_water_area.csv
│   ├── Master_GMM_Thresholds_BD.csv  # Stage 2 output
│   └── Sample_Points/
│       ├── Final_Binary_Field_Validation_2025.csv  # 6,000-point validation
│       └── Balanced_Validation_Points_2025_Full.csv
│
├── 7_Manuscript/                     # LaTeX source files
└── figures/                          # Generated figures
```

---

## Reproduction Steps

### Prerequisites

**Python** (3.7+):
```bash
pip install -r requirements.txt
```

**R** (4.0+):
```r
install.packages(c("trend", "ggplot2", "dplyr", "tidyr", "scales"))
```

**Google Earth Engine**: A GEE account is required for Stage 1.
Register at https://earthengine.google.com/

### Stage 1: GEE Data Extraction (Cloud)

> **Note**: Stage 1 outputs are already included in `data/GEE_data/`.
> You only need to run this if you want to regenerate from scratch.

1. Open [Google Earth Engine Code Editor](https://code.earthengine.google.com/)
2. Paste `8_GEE_Scripts_Common/export_11yr_histograms.js`
3. Click **Run**, then go to **Tasks** tab and click **Run** on the export task
4. Download the CSV from Google Drive → `data/GEE_data/`

### Stage 2: GMM Threshold Derivation

```bash
python scripts/batch_gmm_processor.py
```

**Input**: `data/GEE_data/Bangladesh_District_VV_Histograms_2015_2025.csv`
**Output**: `data/GMM_Threshold_Lookup_Table.csv`

### Stage 3: Water Area Computation

```bash
python scripts/compute_water_area_from_histograms.py
```

**Input**: Stage 1 histograms + Stage 2 thresholds
**Output**: 5 CSV files in `data/GEE_data/computed_results/`

### Stage 4: Statistical Analysis

```bash
Rscript scripts/run_smk.R
```

**Input**: Stage 3 national monthly water area
**Output**: Mann-Kendall test statistics, Sen's slope with 95% CI

### Stage 5: Figure Generation

```bash
python scripts/generate_all_figures.py
Rscript scripts/validation_viz.R
Rscript scripts/generate_supplementary_plot.R
```

**Output**: All publication figures in `figures/`

---

## Key Parameters

| Parameter | Value | Location |
|---|---|---|
| GMM components | 2 (water, land) | `batch_gmm_processor.py` L36 |
| Covariance type | `full` | `batch_gmm_processor.py` L36 |
| Max EM iterations | 200 | `batch_gmm_processor.py` L36 |
| Convergence tolerance | 1e-3 (sklearn default) | `batch_gmm_processor.py` L36 |
| Random state | 42 | `batch_gmm_processor.py` L36 |
| Pixel scale (GEE histogram) | 100 m | `export_11yr_histograms.js` L73 |
| Pixel scale (GEE water area) | 250 m | `monthly_water_area_export.js` L39 |
| Histogram bins | 200, min width 0.15 dB | `export_11yr_histograms.js` L69-70 |
| DEM slope mask | SRTM 30 m, slope > 15° excluded | Manuscript Section 4.2 |

## Calibration

A multiplicative calibration ratio corrects for the scale discrepancy between
histogram-derived areas (100 m pixel) and direct GEE reduction (250 m pixel).
The ratio is computed by comparing 5 reference months from 2015 (Jan, Feb, May,
Jul, Sep) against GEE console outputs. The ratio is computed automatically in
`compute_water_area_from_histograms.py` (Lines 243-261) and applied uniformly
to all computed water areas.

---

## Data Sources

| Dataset | Source | Access |
|---|---|---|
| Sentinel-1 GRD | ESA/Copernicus | `COPERNICUS/S1_GRD` via GEE |
| SRTM DEM | NASA/USGS | `USGS/SRTMGL1_003` via GEE |
| Admin boundaries | FAO GAUL 2015 | `FAO/GAUL/2015/level2` via GEE |
| JRC GSW | JRC/Pekel et al. 2016 | `JRC/GSW1_4/GlobalSurfaceWater` via GEE |
| Field validation | This study | `data/Sample_Points/` |

---

## License

[To be determined by authors]

## Citation

[To be added upon publication]
