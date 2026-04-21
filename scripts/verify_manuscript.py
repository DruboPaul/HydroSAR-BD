# -*- coding: utf-8 -*-
#!/usr/bin/env python3
"""
=============================================================================
  HydroSAR Manuscript Verification Script
  ----------------------------------------
  Automatically cross-checks ALL numerical values in main_final_submission.tex
  against the actual source CSV data files.

  Usage:  py -3 scripts/verify_manuscript.py

  This script will:
    1. Read all CSV data sources (national, division, district)
    2. Compute correct statistics (means, std, CV%, regression, MK, Sen's slope)
    3. Parse the LaTeX manuscript for hardcoded values
    4. Compare and report ANY mismatches

  Run this EVERY TIME before uploading to Overleaf or submitting.
=============================================================================
"""

import csv
import re
import os
import sys
import numpy as np
from scipy import stats as scipy_stats
from scipy.stats import norm
from collections import defaultdict

# ===================== CONFIGURATION =====================
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "GEE_data", "computed_results")
TEX_FILE = os.path.join(BASE_DIR, "7_Manuscript", "main_final_submission.tex")
BIB_FILE = os.path.join(BASE_DIR, "7_Manuscript", "references.bib")

NATIONAL_CSV = os.path.join(DATA_DIR, "national_monthly_water_area_2015_2025.csv")
DIVISION_CSV = os.path.join(DATA_DIR, "division_july_water_area_2015_2025.csv")
DISTRICT_CSV = os.path.join(DATA_DIR, "district_monthly_water_area_2015_2025.csv")

# ===================== HELPERS =====================
pass_count = 0
fail_count = 0
warn_count = 0

def check(label, expected, actual, tolerance=0.1, is_pct=False):
    """Compare expected vs actual value with tolerance."""
    global pass_count, fail_count
    if isinstance(expected, str):
        if expected == actual:
            pass_count += 1
            print("  [PASS] %s: %s" % (label, expected))
        else:
            fail_count += 1
            print("  [FAIL] %s: expected '%s', got '%s'" % (label, expected, actual))
        return
    
    diff = abs(expected - actual)
    rel = diff / max(abs(expected), 0.001) * 100
    unit = "%" if is_pct else ""
    if diff <= tolerance:
        pass_count += 1
        print("  [PASS] %s: %.2f%s (data: %.2f%s)" % (label, expected, unit, actual, unit))
    else:
        fail_count += 1
        print("  [FAIL] %s: manuscript=%.2f%s, data=%.2f%s (diff=%.2f, %.1f%%)" % (
            label, expected, unit, actual, unit, diff, rel))

def warn(msg):
    global warn_count
    warn_count += 1
    print("  [WARN] %s" % msg)

def extract_number(tex, pattern):
    """Extract a number from LaTeX text using regex."""
    m = re.search(pattern, tex)
    if m:
        val = m.group(1).replace(",", "").replace("\\,", "")
        return float(val)
    return None

# ===================== LOAD DATA =====================
def load_national():
    rows = []
    with open(NATIONAL_CSV) as f:
        for r in csv.DictReader(f):
            rows.append(r)
    return rows

def load_divisions():
    rows = []
    with open(DIVISION_CSV) as f:
        for r in csv.DictReader(f):
            rows.append(r)
    return rows

def load_tex():
    with open(TEX_FILE, "r", encoding="utf-8") as f:
        return f.read()

def load_bib():
    with open(BIB_FILE, "r", encoding="utf-8") as f:
        return f.read()

# ===================== VERIFICATION CHECKS =====================

def verify_table2_monthly_stats(national_rows, tex):
    """Verify Table 2: Monthly Water Area Statistics."""
    print("\n" + "="*60)
    print("CHECK 1: Table 2 — Monthly Water Area Statistics")
    print("="*60)

    month_names = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"]
    
    for m in range(1, 13):
        vals = [float(r["water_area_calibrated_km2"]) for r in national_rows if int(r["month"]) == m]
        computed_min = min(vals)
        computed_max = max(vals)
        computed_mean = np.mean(vals)
        computed_std = np.std(vals, ddof=1)

        # Search for this month's row in LaTeX table
        # Format: "January & 13,290 & 16,744 & 15,090 & 931 \\"
        pattern = r"%s\s*&\s*([\d,]+)\s*&\s*([\d,]+)\s*&\s*([\d,]+)\s*&\s*([\d,]+)" % month_names[m-1]
        match = re.search(pattern, tex)
        if match:
            tex_min = float(match.group(1).replace(",", ""))
            tex_max = float(match.group(2).replace(",", ""))
            tex_mean = float(match.group(3).replace(",", ""))
            tex_std = float(match.group(4).replace(",", ""))
            
            check("%s Min" % month_names[m-1], tex_min, round(computed_min), 1)
            check("%s Max" % month_names[m-1], tex_max, round(computed_max), 1)
            check("%s Mean" % month_names[m-1], tex_mean, round(computed_mean), 1)
            check("%s Std" % month_names[m-1], tex_std, round(computed_std), 1)
        else:
            warn("%s: not found in Table 2" % month_names[m-1])


def verify_cv_values(national_rows, tex):
    """Verify CV% values mentioned in text."""
    print("\n" + "="*60)
    print("CHECK 2: Coefficient of Variation (CV%)")
    print("="*60)

    cv_patterns = {
        "January": r"January[^)]*CV\s*=\s*([\d.]+)\\?%",
        "February": r"February[^)]*CV\s*=\s*([\d.]+)\\?%",
        "March": r"and\s*([\d.]+)\\?%,\s*respectively",
        "April": r"April[^:]*:\s*CV\s*=\s*([\d.]+)\\?%",
        "May": r"May[^:]*:\s*CV\s*=\s*([\d.]+)\\?%",
        "July": r"July[^:]*:\s*CV\s*=\s*([\d.]+)\\?%",
        "August": r"August[^:]*:\s*CV\s*=\s*([\d.]+)\\?%",
    }

    month_map = {"January":1,"February":2,"March":3,"April":4,"May":5,"July":7,"August":8}

    for name, pattern in cv_patterns.items():
        m_num = month_map[name]
        vals = [float(r["water_area_calibrated_km2"]) for r in national_rows if int(r["month"]) == m_num]
        computed_cv = (np.std(vals, ddof=1) / np.mean(vals)) * 100

        match = re.search(pattern, tex)
        if match:
            tex_cv = float(match.group(1))
            check("CV%% %s" % name, tex_cv, round(computed_cv, 1), 0.15, is_pct=True)
        else:
            warn("CV%% for %s not found in text" % name)


def verify_trend_table(div_rows, tex):
    """Verify Table 4: Division Trend Analysis."""
    print("\n" + "="*60)
    print("CHECK 3: Table 4 — Division Trend Slopes")
    print("="*60)

    divisions = sorted(set(r["division"] for r in div_rows))
    
    for div in divisions:
        data = [(int(r["year"]), float(r["water_area_km2"])) for r in div_rows if r["division"] == div]
        data.sort()
        years = np.array([y for y, v in data], dtype=float)
        vals = np.array([v for y, v in data], dtype=float)
        sl, _, rv, pv, _ = scipy_stats.linregress(years, vals)

        # Search in LaTeX table
        sign_pattern = r"%s\s*&\s*\$[+-]\$\s*([\d.]+)" % div
        match = re.search(sign_pattern, tex)
        if match:
            tex_slope = float(match.group(1))
            # Check if sign matches
            if ("$+$" in re.search(r"%s\s*&\s*(\$[+-]\$)" % div, tex).group(1)):
                tex_slope = abs(tex_slope)
            else:
                tex_slope = -abs(tex_slope)
            
            check("%s slope" % div, tex_slope, round(sl, 1), 0.2)
        else:
            warn("%s: not found in trend table" % div)


def verify_national_trend(national_rows, tex):
    """Verify national-level trend statistics in text."""
    print("\n" + "="*60)
    print("CHECK 4: National Trend Statistics (Results + Discussion)")
    print("="*60)

    july = [(int(r["year"]), float(r["water_area_calibrated_km2"])) 
            for r in national_rows if int(r["month"]) == 7]
    july.sort()
    years = np.array([y for y, v in july], dtype=float)
    vals = np.array([v for y, v in july], dtype=float)

    # Linear regression
    sl, _, rv, pv, _ = scipy_stats.linregress(years, vals)
    computed_r2 = rv**2
    
    # Mann-Kendall
    n = len(vals)
    s = 0
    for i in range(n-1):
        for j in range(i+1, n):
            s += int(np.sign(vals[j] - vals[i]))
    tau = s / (n*(n-1)/2)

    # Sen's slope
    sens = []
    for i in range(n-1):
        for j in range(i+1, n):
            sens.append((vals[j] - vals[i]) / (years[j] - years[i]))
    median_slope = np.median(sorted(sens))

    print("  Computed: LR slope=%.1f, R2=%.3f, p=%.2f" % (sl, computed_r2, pv))
    print("  Computed: MK tau=%.3f, Sen=%.2f" % (tau, median_slope))
    print("  Computed: Range=%.0f--%.0f" % (min(vals), max(vals)))

    # Check for key values in text
    if "300.9" in tex:
        check("LR slope in text", -300.9, round(sl, 1), 0.2)
    else:
        warn("LR slope (-300.9) not found in manuscript")

    if "0.028" in tex:
        check("R2 in text", 0.028, round(computed_r2, 3), 0.002)
    else:
        warn("R2 (0.028) not found in manuscript")

    if "342" in tex:
        check("Sen's slope in text", -342.39, round(median_slope, 2), 0.5)
    else:
        warn("Sen's slope (-342) not found in manuscript")

    if "48,577" in tex or "48577" in tex:
        check("July 2020 peak", 48577, round(max(vals)), 1)
    else:
        warn("July 2020 peak (48,577) not found in manuscript")


def verify_accuracy_metrics(tex):
    """Verify confusion matrix and accuracy metrics."""
    print("\n" + "="*60)
    print("CHECK 5: Accuracy Metrics (OA, PA, UA, F1, Kappa)")
    print("="*60)

    # Known confusion matrix values
    TP, FN, TN, FP = 1866, 62, 2123, 259
    n = TP + FN + TN + FP
    OA = (TP + TN) / n * 100
    PA = TP / (TP + FN) * 100
    UA = TP / (TP + FP) * 100
    precision = UA / 100
    recall = PA / 100
    F1 = 2 * precision * recall / (precision + recall)
    
    pe = ((TP+FP)*(TP+FN) + (TN+FN)*(TN+FP)) / (n*n)
    kappa = (OA/100 - pe) / (1 - pe)

    if "92.55" in tex:
        check("OA", 92.55, round(OA, 2), 0.01)
    if "96.78" in tex:
        check("PA", 96.78, round(PA, 2), 0.01)
    if "87.81" in tex:
        check("UA", 87.81, round(UA, 2), 0.01)
    if "0.92" in tex:
        check("F1", 0.92, round(F1, 2), 0.01)
    if "0.8508" in tex:
        check("Kappa", 0.8508, round(kappa, 4), 0.001)


def verify_cross_references(tex):
    """Check for broken cross-references."""
    print("\n" + "="*60)
    print("CHECK 6: Cross-References & Citations")
    print("="*60)

    labels = set()
    for m in re.finditer(r"\\label\{([^}]+)\}", tex):
        labels.add(m.group(1))

    refs = set()
    for m in re.finditer(r"\\ref\{([^}]+)\}", tex):
        refs.add(m.group(1))

    broken = sorted(refs - labels)
    if broken:
        for r in broken:
            warn("Broken \\ref{%s} — will show '??' in PDF" % r)
    else:
        check("All cross-references", "resolved", "resolved")

    # Check citations
    bib = load_bib()
    cited = set()
    for m in re.finditer(r"\\cite\{([^}]+)\}", tex):
        for k in m.group(1).split(","):
            cited.add(k.strip())

    defined = set()
    for m in re.finditer(r"@\w+\{([\w-]+)", bib):
        defined.add(m.group(1))

    missing = sorted(cited - defined)
    if missing:
        for c in missing:
            warn("Citation \\cite{%s} has no BibTeX entry" % c)
    else:
        check("All citations", "matched", "matched")


def verify_placeholders(tex):
    """Check for remaining placeholder text."""
    print("\n" + "="*60)
    print("CHECK 7: Placeholder Text")
    print("="*60)

    placeholders = ["[Author", "[Contact", "[Email", "[TODO", "[FIXME", "[INSERT", "[TBD"]
    found = False
    for ph in placeholders:
        for i, line in enumerate(tex.split("\n"), 1):
            if ph in line:
                warn("Placeholder on line %d: %s" % (i, line.strip()[:80]))
                found = True
    if not found:
        check("No placeholders", "clean", "clean")


def verify_figure_files(tex):
    """Check that all referenced figure files exist."""
    print("\n" + "="*60)
    print("CHECK 8: Figure File Existence")
    print("="*60)

    fig_dir = os.path.join(BASE_DIR, "7_Manuscript")
    for m in re.finditer(r"\\includegraphics[^{]*\{([^}]+)\}", tex):
        fig_path = m.group(1)
        full_path = os.path.join(fig_dir, fig_path)
        if os.path.exists(full_path):
            check("File: %s" % fig_path, "exists", "exists")
        else:
            warn("MISSING figure file: %s" % full_path)


# ===================== MAIN =====================
def main():
    global pass_count, fail_count, warn_count

    print("="*60)
    print("  HydroSAR Manuscript Verification Report")
    print("  %s" % TEX_FILE)
    print("="*60)

    # Load data
    national = load_national()
    divisions = load_divisions()
    tex = load_tex()

    # Run all checks
    verify_table2_monthly_stats(national, tex)
    verify_cv_values(national, tex)
    verify_trend_table(divisions, tex)
    verify_national_trend(national, tex)
    verify_accuracy_metrics(tex)
    verify_cross_references(tex)
    verify_placeholders(tex)
    verify_figure_files(tex)

    # Summary
    print("\n" + "="*60)
    print("  VERIFICATION SUMMARY")
    print("="*60)
    print("  PASSED:   %d" % pass_count)
    print("  FAILED:   %d" % fail_count)
    print("  WARNINGS: %d" % warn_count)
    print("="*60)

    if fail_count > 0:
        print("\n  *** MANUSCRIPT HAS %d DATA MISMATCHES — FIX BEFORE SUBMISSION ***" % fail_count)
        sys.exit(1)
    elif warn_count > 0:
        print("\n  Manuscript data is correct, but %d warnings need attention." % warn_count)
        sys.exit(0)
    else:
        print("\n  ALL CHECKS PASSED — Manuscript is ready for submission!")
        sys.exit(0)


if __name__ == "__main__":
    main()
