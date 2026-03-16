# 🌊 HydroSAR Bangladesh - GMM Threshold Analysis
**(Seasonally Adaptive Per-District SAR Water Detection)**

---

## 🚩 PROJECT STATUS DASHBOARD
**Current Phase**: 🧬 Data Generation & Manuscript Sync (Phase 4 of 5)

| Metric | Status | Value |
| :--- | :--- | :--- |
| **GMM Accuracy (OA)** | ✅ Verified | **94.24%** |
| **GMM Kappa (κ)** | ✅ Verified | **0.8848** |
| **Field Validation** | ✅ Audited | 6,000 Points |
| **11-Year GEE Run** | 🔄 In-Progress | Waiting for Console Output |
| **Manuscript Tables** | 🔄 In-Progress | 2015 Baseline Synced |

---

## 📂 Project Organization

- **`7_Manuscript/`**: 📝 The LaTeX source for the publication.
- **`8_GEE_Scripts_Common/`**: 🛰️ Earth Engine scripts (History, Explorer, Validation).
- **`data/`**: 📊 Numerical data, threshold lookup tables, and GEE console exports.
- **`scripts/`**: 🐍 Python/R library for statistics, GMM fitting, and figure generation.
- **`figures/`**: 🖼️ Final publication-quality plots and maps.
- **`legacy/`**: 📦 Archived "Fixed Threshold" files and temporary analysis scripts.

---

## 🔄 How to Resume (New Monitor/Location)

If you are starting work from a different PC, follow these steps to see exactly where we are:

1.  **Check `task.md`**: This is our master checklist. Look for the `[/]` (In Progress) and `[ ]` (Pending) markers.
2.  **Verify GEE Console**: Open Earth Engine. If any `monthly_water_area` consoles have finished, save the text to `data/GEE_data/`.
3.  **Run Sync**: Use `scripts/parse_gee_console.py` and `data/get_stats.py` to update the local database.
4.  **Finalize Tables**: Check `7_Manuscript/main_final_submission.tex` for remaining `[TBD]` markers.

---
*Last Sync: March 16, 2026 (11-Year Dataset Baseline established with 2015 data)*
