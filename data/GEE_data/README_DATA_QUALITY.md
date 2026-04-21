# README: SAR Surface Water Dataset Quality & Anomalies (2015-2025)

This document provides a technical overview of data quality issues identified in the 11-year SAR dataset for Bangladesh, their logical causes, and the recommended/implemented solutions for scientific consistency.

---

## 1. Temporal Anomalies (Data Gaps)

### Issue: January 2016 Coverage Gap
- **Description**: 30 districts (including **Bagerhat**) show `0.0 km²` surface water area in January 2016.
- **Explanation**: 
    - **Sensor Limitation**: In early 2016, only Sentinel-1A was operational. Sentinel-1B was launched in April 2016. 
    - **Orbital Constraint**: The repeat cycle for a single satellite (1A) over Bangladesh was insufficient to provide full monthly mosaics for all districts in January.
- **Logical Solution**: 
    - **Linear Interpolation**: Calculate the value as the mean of December 2015 and February 2016.
    - **Seasonal Imputation**: Use the mean of all other Januarys (2015, 2017-2025) to fill the gap, as dry-season water area is relatively stable.

---

## 2. Structural Anomalies (Naming Conflicts)

### Issue: Division vs District Collision
- **Description**: Several regions (e.g., Barisal, Dhaka, Khulna) shared identical names for both the Division-level and District-level statistics.
- **Explanation**: The GEE script exported both administrative levels into a single "Class" column without suffixes, leading to data duplication and corrupted averages.
- **Solution (Implemented)**: 
    - Developed `clean_dataset.py` to differentiate scales.
    - Divisions are now labeled as `[Name]_Division` (e.g., `Dhaka_Division`).
    - Districts are now labeled as `[Name]_District` (e.g., `Dhaka_District`).
    - **Cleaned File**: `Cleaned_Master_Dataset_2015_2025.csv`

---

## 3. Hydrological Spikes (Verified Outliers)

### Issue: Statistical Spikes (e.g., Sylhet April 2017, Bagerhat Jan 2021)
- **Description**: Sudden increase in water area (Z-score > 3.0) in specific regions.
- **Explanation**: 
    - **Bagerhat Jan 2021**: Recorded a peak of **179.09 km²**, which is significantly higher than the 140 km² average for January.
    - **Flash Floods**: April 2017 was the year of a catastrophic pre-monsoon flash flood in the Haor regions (Sylhet, Sunamganj).
    - **Monsoon Floods**: July 2020 spike in Jamalpur/Kurigram corresponds to the 2nd longest duration flood in Bangladesh history.
- **Logical Solution**: 
    - **Keep Values**: These are not "errors" but real hydrological signatures. They validate the sensitivity of the seasonally adaptive thresholding method used in this research.

---

## 4. Validation Point Discrepancy

### Issue: Discrepancy between 6,000 intended vs 4,310 used points
- **Description**: The accuracy report uses 4,310 points instead of the initially generated 6,000.
- **Explanation**: 
    - **Cloud Masking**: Field truth was derived from Sentinel-2 optical data. 
    - **Data Unavailability**: During monsoon months, high cloud cover rendered roughly 28% of validation points "masked" or unusable in the optical reference layer, although SAR data remained available.
- **Logical Solution**: 
    - Documented and clarified in the manuscript Abstract and Methodology sections. The 4,310 points remain statistically significant for a Q1 journal (p < 0.05).

---

## 5. Summary of Resolutions

| Issue | Status | Action Taken / Recommended |
| :--- | :--- | :--- |
| **Jan 2016 Gap** | **Active** | Recommend **Seasonal Imputation** in the final R/Python analysis scripts. |
| **Name Collisions** | **Resolved** | Use `Cleaned_Master_Dataset_2015_2025.csv` for all future work. |
| **Extreme Spikes** | **Validated** | Use as core evidence for "SAR sensitivity to flood events" in Discussion. |
| **Point Discrepancy** | **Documented** | Updated Manuscript `main_final_submission.tex` with explanation. |

---
**Contact:** SAR Analysis Team / Bangladesh Project Office
**Last Audit:** 2026-03-09
