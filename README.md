# HydroSAR-BD: Decadal Surface Water Dynamics in Bangladesh Using Sentinel-1 SAR (2015–2025)

[![DOI](https://img.shields.io/badge/DOI-Pending-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GEE](https://img.shields.io/badge/Google%20Earth%20Engine-Ready-green)](https://earthengine.google.com)

---

## Overview

This repository contains the complete codebase and data for reproducing the results presented in:

> **[Author Names]**, "Decadal Surface Water Dynamics in Bangladesh Using Sentinel-1 SAR: Seasonal Variability, Change Detection, and Trend Analysis (2015–2025)," *Scientific Reports*, 2026. *(Under Review)*

The study presents an **11-year Sentinel-1 SAR time-series analysis** (7,891 radar scenes) of surface water dynamics across Bangladesh, using **seasonally adaptive VV backscatter thresholds** derived from a **Gaussian Mixture Model (GMM)** framework within Google Earth Engine (GEE).

### Key Results
- Mean surface water ranges from **~5,678 km²** (dry season) to **~23,269 km²** (peak monsoon July)
- **3.4%** permanent water, **29.2%** ephemeral water across the country
- **21.5%** of 2025 monsoon water extent is newly gained relative to 2015
- No statistically significant long-term trend detected (Mann-Kendall, p = 0.72)
- GMM-based classification accuracy: **OA = 92.55%, Kappa = 0.85**

---

## Repository Structure

```
HydroSAR-BD/
├── README.md
├── LICENSE
├── gee_scripts/           # Google Earth Engine JavaScript code
│   ├── monthly_water_export.js        # Core: Monthly water area computation
│   ├── gmm_threshold_derive.js        # GMM threshold calibration
│   ├── persistence_change_export.js   # Water persistence & change detection
│   └── field_validation.js            # Accuracy assessment pipeline
├── analysis/              # Statistical analysis scripts (R & Python)
│   ├── statistical_analysis.R         # Trend analysis (Mann-Kendall, Sen's slope)
│   ├── regional_trend_analysis.R      # Hydrological region-level trends
│   ├── gmm_threshold.py              # GMM fitting & threshold optimization
│   ├── plot_figures.py                # Publication figure generation
│   └── validation_analysis.R         # Accuracy metrics & confusion matrix
├── data/                  # Processed datasets
│   ├── GMM_Thresholds.csv             # Monthly GMM-derived thresholds
│   ├── Validation_Points_2025.csv     # 4,310 field-verified reference points
│   └── regional_trends/              # Per-region trend CSVs (7 regions)
└── figures/               # Publication-quality figures
    ├── (main text figures)
    └── regional_trends/              # Regional trend plots
```

---

## Requirements

### Google Earth Engine
- Active GEE account ([signup](https://signup.earthengine.google.com/))
- Scripts are self-contained and can be pasted directly into the [GEE Code Editor](https://code.earthengine.google.com/)

### Local Analysis
- **R** ≥ 4.0 with packages: `trend`, `ggplot2`, `dplyr`, `reshape2`
- **Python** ≥ 3.8 with packages: `pandas`, `numpy`, `scipy`, `matplotlib`

---

## Quick Start

### 1. Run GEE Water Mapping
Open `gee_scripts/monthly_water_export.js` in the GEE Code Editor and run for your desired year/month. Results export as CSV to Google Drive.

### 2. Derive GMM Thresholds
```bash
python analysis/gmm_threshold.py
```

### 3. Statistical Analysis
```r
source("analysis/statistical_analysis.R")
```

### 4. Generate Figures
```bash
python analysis/plot_figures.py
```

---

## Data Availability

| Dataset | Source | Access |
|---------|--------|--------|
| Sentinel-1 SAR | ESA via GEE | `ee.ImageCollection('COPERNICUS/S1_GRD')` |
| JRC Global Surface Water | JRC via GEE | `ee.Image('JRC/GSW1_4/GlobalSurfaceWater')` |
| Administrative Boundaries | FAO GAUL via GEE | `ee.FeatureCollection('FAO/GAUL/2015/level1')` |
| ERA5 Precipitation | ECMWF via GEE | `ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY')` |

---

## Citation

If you use this code or data, please cite:

```bibtex
@article{hydrosar_bd_2026,
  title={Decadal Surface Water Dynamics in Bangladesh Using Sentinel-1 SAR: Seasonal Variability, Change Detection, and Trend Analysis (2015--2025)},
  author={[Author Names]},
  journal={Scientific Reports},
  year={2026},
  note={Under Review}
}
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact

For questions regarding the code or data, please contact: **[Contact Email]**
