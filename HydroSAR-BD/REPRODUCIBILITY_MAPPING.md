# Reproducibility Mapping Guide for Reviewers

This document provides a direct mapping between the figures, tables, and statistics presented in the manuscript and the specific scripts within this repository used to generate them. It serves as an audit trail to ensure 100% reproducibility of the findings.

---

## 1. Methodology & Data Preparation

| Paper Item / Description | Generating Tool | Script Path in Repository |
| :--- | :--- | :--- |
| **Sentinel-1 Scene Count (7,891 scenes)** | GEE JavaScript | `01_GEE_Code/water_study_fixed_threshold.js` (Inline `size().getInfo()`) |
| **Otsu Method Histogram Thresholding** | GEE JavaScript | `01_GEE_Code/water_study_otsu.js` & `01_GEE_Code/sample_otsu.js` |
| **Raw Timeseries Data Extraction** | GEE JavaScript | `01_GEE_Code/monthly_water_area_export.js` |
| **Master Dataset Creation (Interpolation/Cleaning)** | Python | `02_Python_Processing/Data_Preparation/` (Sequence: `clean_dataset.py` &rarr; `merge_csv.py` &rarr; `apply_interp.py`) |

---

## 2. Accuracy Assessment & Validation

| Paper Item (Figures/Tables) | Generating Tool | Script Path in Repository |
| :--- | :--- | :--- |
| **Table 2 & 3: Overall Accuracy Metrics (OA=92.5%)** | Python | `02_Python_Processing/calculate_final_accuracy.py` |
| **Figure 4: Confusion Matrix (2025 Field Data)** | Python / R | Computed via `02_Python_Processing/calculate_accuracy_metrics.py`, Visualized via `03_R_Statistical_Analysis/validation_viz.R` |
| **Figure 5: Monthly Accuracy Trend** | R | `03_R_Statistical_Analysis/validation_viz.R` |
| **JRC Cross-Validation Comparison** | GEE JavaScript | `01_GEE_Code/jrc_validation.js` |

---

## 3. Results: Seasonal Dynamics & Occurrences

| Paper Item (Figures/Tables) | Generating Tool | Script Path in Repository |
| :--- | :--- | :--- |
| **Figure 6: Monthly Surface Water Extent (Boxplot/Line)** | R | `03_R_Statistical_Analysis/advanced_statistical_plots.R` |
| **Table 5: Water Occurrence Statistics (Permanent vs Ephemeral)** | GEE & Python | `01_GEE_Code/persistence_change_export.js` & `02_Python_Processing/Data_Preparation/get_stats.py` |
| **Annual Water Occurrence Maps (TIFF Downloads)** | GEE JavaScript | `01_GEE_Code/water_study_fixed_threshold.js` (Maps generated externally in ArcGIS Pro using these raw TIFFs) |

---

## 4. Results: Decadal Trend Analysis

| Paper Item (Figures/Tables) | Generating Tool | Script Path in Repository |
| :--- | :--- | :--- |
| **Figure 7 \& Table 6: Annual Peak Trend & Divsional Trends** | R | `03_R_Statistical_Analysis/HydroSAR_Analysis_2015_2025.R` |
| **Figure 8: Annual Mean Trend** | R | `03_R_Statistical_Analysis/HydroSAR_Analysis_2015_2025.R` |
| **Table 7 \& 8: Mann-Kendall Tests & Coefficient of Variation** | R | `03_R_Statistical_Analysis/HydroSAR_Analysis_2015_2025.R` |
| **Figure 9: Top 10 Flood-Prone Districts** | R | `03_R_Statistical_Analysis/advanced_statistical_plots.R` |
| **Section 5.3: Regional 11-Year Faceted Trend Graphs** | R | `03_R_Statistical_Analysis/Regional_Trend_Analysis.R` |
| **Discussion: Localized Spikes (e.g., Bagerhat Jan 2021)** | Python | `02_Python_Processing/Data_Preparation/investigate_spike.py` |
