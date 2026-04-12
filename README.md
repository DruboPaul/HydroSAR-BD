# HydroSAR Bangladesh -- Spatiotemporally Adaptive SAR Water Detection

**Decadal Surface Water Dynamics in Bangladesh Using Sentinel-1 SAR (2015--2025)**

This repository contains all code, data, and analysis scripts for the
spatiotemporally adaptive Gaussian Mixture Model (ST-GMM) framework for surface
water detection using Sentinel-1 C-band SAR imagery across Bangladesh.

---

## Project Organization

```
HydroSAR-BD/
├── 7_Manuscript/            LaTeX source and supplementary materials
├── 8_GEE_Scripts_Common/    Google Earth Engine scripts (histogram export, validation)
├── data/                    Threshold lookup tables, GEE console exports, validation points
├── scripts/                 Python and R analysis scripts (GMM fitting, statistics, figures)
├── figures/                 Publication-quality plots and maps
├── legacy/                  Archived development utilities (not part of main pipeline)
├── 6_Accuracy_Assessment/   Accuracy assessment documentation
├── REPRODUCE.md             Step-by-step reproduction guide
├── LICENSE                  MIT License
└── requirements.txt         Python dependencies
```

## Key Results

| Metric               | Value       |
|:----------------------|:------------|
| Overall Accuracy (OA) | 94.24%      |
| Cohen's Kappa         | 0.8848      |
| Validation Points     | 6,000       |
| Study Period           | 2015--2025  |
| Spatial Coverage       | 64 districts, 8 divisions |

## Quick Start

```bash
# Install Python dependencies
pip install -r requirements.txt

# Reproduce GMM thresholds from GEE histograms
python scripts/batch_gmm_processor.py

# Compute water area time series
python scripts/compute_water_area_from_histograms.py

# Generate publication figures
python scripts/generate_all_figures.py
```

See [REPRODUCE.md](REPRODUCE.md) for the full five-stage reproduction pipeline.

## Data Sources

| Dataset             | Source               | Access                              |
|:--------------------|:---------------------|:------------------------------------|
| Sentinel-1 GRD      | ESA / Copernicus     | `COPERNICUS/S1_GRD` via GEE        |
| SRTM DEM            | NASA / USGS          | `USGS/SRTMGL1_003` via GEE         |
| Admin Boundaries    | FAO GAUL 2015        | `FAO/GAUL/2015/level2` via GEE     |
| JRC Global Surface Water | JRC / Pekel et al. 2016 | `JRC/GSW1_4/GlobalSurfaceWater` via GEE |
| Field Validation    | This study           | `data/Sample_Points/`               |

## License

MIT License. See [LICENSE](LICENSE).

## Citation

[To be added upon publication]
