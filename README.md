# HydroSAR Bangladesh - GMM Threshold Analysis

This repository contains the updated methodology and scripts for the **HydroSAR Bangladesh** project, specifically transitioning from fixed SAR backscatter thresholds to statistically optimal **Gaussian Mixture Model (GMM)** derived thresholds.

This workspace was cloned from the original "SAR Analysis Paper" directory to provide a clean environment for implementing the per-district GMM methodology for a Q1 journal publication.

## 🚀 How to Continue the Study (from another PC)

Once you clone this repository to your new PC, follow these steps to resume the work:

### Phase 1: Data Extraction (Google Earth Engine)
1. Open [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Copy the contents of `8_GEE_Scripts_Common/export_11yr_histograms.js`.
3. Set `var EXPORT_MODE = 'ALL';` at the top of the script.
4. Run the script and execute the Task to export `Bangladesh_District_VV_Histograms_2015_2025.csv` to your Google Drive.
5. Download this CSV from Google Drive and place it in the `data/` folder of this repository on your local PC.

### Phase 2: Batch Analysis (Python)
1. Ensure you have Python installed with the necessary libraries (`pandas`, `numpy`, `scikit-learn`, `matplotlib`, `scipy`).
2. We will need to write the `batch_gmm_processor.py` script. The goal of this script is to:
   - Load the master CSV you just downloaded.
   - Loop through all 64 districts and 12 months.
   - Apply the GMM algorithm to find the optimal threshold for each district/month.
   - Save the results into a new "Threshold Lookup Table" CSV.

### Phase 3: Update GEE Explorer App
1. Once we have the "Threshold Lookup Table" CSV, we will either upload it as a GEE Asset or hardcode the dictionary into your main explorer script.
2. We will modify the Explorer app to read from this table instead of using the old fixed values (like `-13 dB`).

## 📂 Directory Structure Highlights
* `8_GEE_Scripts_Common/`: Contains the crucial dual-mode histogram export script.
* `scripts/`: Contains the `gmm_threshold.py` script used for the initial proof-of-concept on a single month's data.
* `data/`: Where you should place the downloaded master CSV from GEE.
* `figures/`: Proof-of-concept visual comparisons of GMM vs. Fixed thresholds.

---
*Note: Large binary files (.tif, .zip) and Python environments are excluded via `.gitignore` to keep the repository lightweight.*
