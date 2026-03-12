# HydroSAR-BD: Decadal Surface Water Dynamics in Bangladesh

This repository contains the code and dataset samples for the comprehensive decadal analysis (2015-2025) of surface water dynamics in Bangladesh using Sentinel-1 SAR imagery processed entirely on Google Earth Engine (GEE). 

## Repository Structure

The repository is organized to ensure reproducibility and clarity in the data processing pipeline:

### `01_GEE_Code/`
Contains JavaScript codes executed within the Google Earth Engine Code Editor.
*   **`water_study_fixed_threshold.js`**: The primary algorithm for processing 11 years of Sentinel-1 imagery. This script automatically computes and outputs the total Sentinel-1 image collection count (e.g., the 7,891 scenes) used during the monthly classification processes.
*   **`jrc_validation.js`**: Cross-validation script comparing our SAR-derived results with the JRC Global Surface Water dataset.
*   **`monthly_water_area_export.js`**: Script to compute and export the monthly spatial extent of surface water across the defined hydrological regions.

### `02_Python_Processing/`
Contains Python scripts used for local data cleaning, auditing, and preparation of the master dataset.
*   **`Data_Preparation/`**: A sub-directory containing crucial scripts (e.g., `clean_dataset.py`, `merge_csv.py`, `apply_interp.py`, `full_dataset_audit.py`) responsible for synthesizing the raw GEE CSV outputs into the final 11-year gap-filled interpolated master dataset.
*   **`calculate_accuracy_metrics.py`, `calculate_final_accuracy.py`**: Scripts to calculate the user's accuracy (UA), producer's accuracy (PA), overall accuracy (OA), and Kappa coefficient based on the 4,310 field-verified points.

### `03_R_Statistical_Analysis/`
Contains R scripts for conducting advanced statistical analysis and generating publication-quality figures.
*   **`HydroSAR_Analysis_2015_2025.R`**: Performs the main Kruskal-Wallis, Mann-Kendall, and coefficient of variation (CV) statistical tests to identify long-term trends and seasonal stability.
*   **`Regional_Trend_Analysis.R`**: Computes the 11-year monthly trends disaggregated by the seven core Hydrological Regions (NW, NE, NC, SC, SW, SE, EH).
*   **`advanced_statistical_plots.R`, `validation_viz.R`**: Generates the faceted charts, confusion matrices, and peak-trend plots used in the manuscript.

### `data/`
Contains the core analytical datasets synthesized from the raw GEE output. (Note: Large 10m resolution `.tif` rasters are excluded due to size constraints).
*   **`Final_Interpolated_Master_Dataset_2015_2025.csv`**: The complete, cleaned country-wide administrative dataset documenting national and divisional monthly water extents.
*   **`regional_trends/`**: Contains the 7 CSV files representing the 11-year monthly trend data for each of the 7 Hydrological Regions in Bangladesh.

## System Requirements
*   **GEE Scripts:** Active Google Earth Engine Account.
*   **Python:** Python 3.8+ with `pandas`, `scipy`, and `scikit-learn`.
*   **R:** R Version 4.0+ with `ggplot2`, `dplyr`, `tidyr`, and `Kendall` packages.

## License
MIT License. Please cite the associated manuscript when using this code or dataset.
