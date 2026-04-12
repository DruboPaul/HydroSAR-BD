"""
GMM-Based Optimal Threshold Determination for SAR Water Detection
=================================================================

This script applies Gaussian Mixture Model (GMM) to VV backscatter histogram 
data to statistically determine the optimal water/land separation threshold
and compares it with the Explorer's fixed threshold and Otsu's method.

Method:
  1. Reconstruct pixel-level data from histogram bins
  2. Fit 2-component GMM (water vs land)
  3. Find the intersection point = optimal threshold
  4. Compare with Otsu's method AND the Explorer fixed threshold
  5. Generate publication-quality comparison figure

Input:  ee-chart.csv (Band Value, VV Count)
        Data period: July 2020, Region: Bangladesh
        Note: CSV was exported from GEE with 10*log10() conversion applied
Output: Console stats + gmm_threshold_comparison.png
"""

import matplotlib
matplotlib.use('Agg')
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.mixture import GaussianMixture
from scipy.stats import norm
import os
import warnings
warnings.filterwarnings('ignore')

# ─── Config ──────────────────────────────────────────────────────────────────────
CSV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "GEE_data", "ee-chart.csv")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "figures")
N_COMPONENTS = 2  # Water + Land

# This CSV is from July 2020
DATA_MONTH = 'July'
DATA_YEAR = 2020

# ─── Step 1: Load and clean data ─────────────────────────────────────────────────
print("=" * 70)
print("  GMM vs OTSU THRESHOLD COMPARISON")
print(f"  Data: {DATA_MONTH} {DATA_YEAR} — Bangladesh")
print("=" * 70)

df = pd.read_csv(CSV_PATH)
df.columns = ['bin_center', 'count']
df['count'] = pd.to_numeric(df['count'], errors='coerce').fillna(0)
df = df[df['count'] > 0].reset_index(drop=True)

print(f"\n📂 Loaded: {CSV_PATH}")
print(f"   Bins with data: {len(df)}")
print(f"   VV range: {df['bin_center'].min():.1f} to {df['bin_center'].max():.1f}")
print(f"   Total pixel count: {df['count'].sum():.0f}")

# ─── Step 2: Reconstruct pixel-level data from histogram ─────────────────────────
samples = np.repeat(df['bin_center'].values, df['count'].astype(int).values)
print(f"   Reconstructed samples: {len(samples)}")

# ─── Step 3: Fit GMM ─────────────────────────────────────────────────────────────
print(f"\n🔬 Fitting {N_COMPONENTS}-component Gaussian Mixture Model...")

gmm = GaussianMixture(
    n_components=N_COMPONENTS,
    covariance_type='full',
    max_iter=500,
    n_init=10,
    random_state=42
)
gmm.fit(samples.reshape(-1, 1))

# Extract parameters, sorted by mean (water < land)
means = gmm.means_.flatten()
stds = np.sqrt(gmm.covariances_.flatten())
weights = gmm.weights_.flatten()
order = np.argsort(means)
means, stds, weights = means[order], stds[order], weights[order]

print(f"\n📊 GMM Components:")
print(f"   ┌──────────────┬────────────────┬────────────────┬────────────────┐")
print(f"   │  Component   │   Mean         │   Std          │    Weight      │")
print(f"   ├──────────────┼────────────────┼────────────────┼────────────────┤")
print(f"   │  Water       │  {means[0]:+10.3f}    │  {stds[0]:10.3f}    │  {weights[0]:10.4f}    │")
print(f"   │  Land        │  {means[1]:+10.3f}    │  {stds[1]:10.3f}    │  {weights[1]:10.4f}    │")
print(f"   └──────────────┴────────────────┴────────────────┴────────────────┘")

# ─── Step 4: Find GMM intersection (optimal threshold) ───────────────────────────
x_range = np.linspace(df['bin_center'].min() - 5, df['bin_center'].max() + 5, 10000)
pdf_water = weights[0] * norm.pdf(x_range, means[0], stds[0])
pdf_land  = weights[1] * norm.pdf(x_range, means[1], stds[1])

# Find intersection between the two means
mask = (x_range > means[0]) & (x_range < means[1])
x_between = x_range[mask]
diff = pdf_water[mask] - pdf_land[mask]
sign_changes = np.where(np.diff(np.sign(diff)))[0]

if len(sign_changes) > 0:
    gmm_threshold = x_between[sign_changes[0]]
else:
    gmm_threshold = (means[0] * stds[1] + means[1] * stds[0]) / (stds[0] + stds[1])

# ─── Step 5: Otsu's method ──────────────────────────────────────────────────────
def otsu_from_histogram(bin_centers, counts):
    total = counts.sum()
    if total == 0:
        return np.nan
    cum_sum = np.cumsum(counts)
    cum_mean = np.cumsum(counts * bin_centers)
    best_thresh, best_var = bin_centers[0], 0
    for i in range(len(bin_centers) - 1):
        w0 = cum_sum[i] / total
        w1 = 1 - w0
        if w0 == 0 or w1 == 0:
            continue
        mu0 = cum_mean[i] / cum_sum[i]
        mu1 = (cum_mean[-1] - cum_mean[i]) / (total - cum_sum[i])
        var = w0 * w1 * (mu0 - mu1) ** 2
        if var > best_var:
            best_var = var
            best_thresh = bin_centers[i]
    return best_thresh

otsu_threshold = otsu_from_histogram(df['bin_center'].values, df['count'].values)

# ─── Step 6: Classification comparison for ALL three thresholds ──────────────────
print(f"\n{'─' * 70}")
print(f"  THRESHOLD COMPARISON — {DATA_MONTH} {DATA_YEAR}")
print(f"{'─' * 70}")

total_pixels = df['count'].sum()
thresholds_to_compare = {
    'GMM (data-driven)': gmm_threshold,
    "Otsu's method": otsu_threshold,
}

print(f"\n   {'Method':<25} {'Threshold':>10} {'Water %':>10} {'Land %':>10}")
print(f"   {'─'*25} {'─'*10} {'─'*10} {'─'*10}")

comparison_data = {}
for name, thresh in thresholds_to_compare.items():
    water = df[df['bin_center'] <= thresh]['count'].sum()
    land = df[df['bin_center'] > thresh]['count'].sum()
    w_pct = (water / total_pixels) * 100
    l_pct = (land / total_pixels) * 100
    comparison_data[name] = {'threshold': thresh, 'water_pct': w_pct, 'land_pct': l_pct}
    print(f"   {name:<25} {thresh:>+10.2f} {w_pct:>9.1f}% {l_pct:>9.1f}%")

# ─── Step 7: Scale note ─────────────────────────────────────────────────────────
print(f"\n⚠️  SCALE NOTE:")
print(f"   The histogram CSV was generated with 10×log10() applied to raw S1 VV.")
print(f"   GMM threshold ({gmm_threshold:+.2f}) and Otsu ({otsu_threshold:+.2f}) are in this transformed space.")

# ─── Step 8: Publication-quality 3-panel figure ──────────────────────────────────
print(f"\n🎨 Generating comparison figure...")
os.makedirs(OUTPUT_DIR, exist_ok=True)

fig, axes = plt.subplots(3, 1, figsize=(14, 14), 
                         gridspec_kw={'height_ratios': [3, 1, 1.5]})
fig.patch.set_facecolor('white')

ax1, ax2, ax3 = axes

# ── Panel 1: Histogram + GMM + all thresholds ──
bar_colors = ['#2171b5' if b <= gmm_threshold else '#78c679' for b in df['bin_center']]
ax1.bar(df['bin_center'], df['count'], width=0.45, color=bar_colors, alpha=0.65, 
        edgecolor='none', label='VV Histogram')

scale_factor = df['count'].sum() * 0.5
ax1.plot(x_range, pdf_water * scale_factor, 'b-', linewidth=2.5, 
         label=f'Water (μ={means[0]:.1f}, σ={stds[0]:.1f})')
ax1.plot(x_range, pdf_land * scale_factor, 'g-', linewidth=2.5, 
         label=f'Land (μ={means[1]:.1f}, σ={stds[1]:.1f})')
pdf_combined = (pdf_water + pdf_land) * scale_factor
ax1.plot(x_range, pdf_combined, 'k--', linewidth=1.2, alpha=0.5, label='Combined GMM')

# Two threshold lines
ax1.axvline(x=gmm_threshold, color='red', linewidth=2.5, linestyle='-', 
            label=f'GMM: {gmm_threshold:.2f}')
ax1.axvline(x=otsu_threshold, color='orange', linewidth=2.5, linestyle='--', 
            label=f"Otsu: {otsu_threshold:.2f}")

# Overlap zone
overlap_mask = (x_range > means[0]) & (x_range < means[1])
ax1.fill_between(x_range[overlap_mask], 0, 
                 np.minimum(pdf_water[overlap_mask], pdf_land[overlap_mask]) * scale_factor,
                 alpha=0.12, color='red', label='Overlap zone')

ax1.set_xlabel('VV Backscatter Value', fontsize=13, fontweight='bold')
ax1.set_ylabel('Pixel Count', fontsize=13, fontweight='bold')
ax1.set_title(f'GMM-Based Threshold vs Otsu Automatic — {DATA_MONTH} {DATA_YEAR}, Bangladesh', 
              fontsize=15, fontweight='bold', pad=15)
ax1.legend(loc='upper left', fontsize=9.5, framealpha=0.9, ncol=2)
ax1.set_xlim(-35, 15)
ax1.grid(True, alpha=0.3)
ax1.tick_params(labelsize=11)

# ── Panel 2: Posterior probability ──
posterior_water = pdf_water / (pdf_water + pdf_land + 1e-10)
posterior_land = pdf_land / (pdf_water + pdf_land + 1e-10)

ax2.fill_between(x_range, 0, posterior_water, alpha=0.5, color='#2171b5', label='P(Water | VV)')
ax2.fill_between(x_range, 0, posterior_land, alpha=0.5, color='#78c679', label='P(Land | VV)')
ax2.axvline(x=gmm_threshold, color='red', linewidth=2.5, linestyle='-')
ax2.axvline(x=otsu_threshold, color='orange', linewidth=2, linestyle='--')
ax2.axhline(y=0.5, color='gray', linewidth=1, linestyle=':', alpha=0.5)

ax2.set_xlabel('VV Backscatter Value', fontsize=13, fontweight='bold')
ax2.set_ylabel('P(class|VV)', fontsize=12, fontweight='bold')
ax2.set_title('Class Membership Probability', fontsize=13, fontweight='bold', pad=8)
ax2.legend(loc='center right', fontsize=10)
ax2.set_xlim(-35, 15)
ax2.set_ylim(0, 1.05)
ax2.grid(True, alpha=0.3)
ax2.tick_params(labelsize=11)

# ── Panel 3: Comparison bar chart ──
methods = list(comparison_data.keys())
water_pcts = [comparison_data[m]['water_pct'] for m in methods]
land_pcts = [comparison_data[m]['land_pct'] for m in methods]
thresh_vals = [comparison_data[m]['threshold'] for m in methods]
bar_x = np.arange(len(methods))
bar_w = 0.35

bars_water = ax3.bar(bar_x - bar_w/2, water_pcts, bar_w, color='#2171b5', 
                     alpha=0.8, label='Water %', edgecolor='white')
bars_land = ax3.bar(bar_x + bar_w/2, land_pcts, bar_w, color='#78c679', 
                    alpha=0.8, label='Land %', edgecolor='white')

# Add value labels on bars
for bar in bars_water:
    h = bar.get_height()
    ax3.text(bar.get_x() + bar.get_width()/2., h + 0.5, f'{h:.1f}%', 
             ha='center', va='bottom', fontsize=10, fontweight='bold', color='#2171b5')
for bar in bars_land:
    h = bar.get_height()
    ax3.text(bar.get_x() + bar.get_width()/2., h + 0.5, f'{h:.1f}%', 
             ha='center', va='bottom', fontsize=10, fontweight='bold', color='#2f7d32')

# Add threshold value below each group
for i, (m, t) in enumerate(zip(methods, thresh_vals)):
    ax3.text(i, -6, f'T = {t:+.1f}', ha='center', va='top', fontsize=11, 
             fontweight='bold', color='#333', 
             bbox=dict(boxstyle='round,pad=0.3', facecolor='#f0f0f0', edgecolor='#ccc'))

ax3.set_ylabel('Percentage (%)', fontsize=13, fontweight='bold')
ax3.set_title('Water/Land Classification Comparison Across Thresholds', 
              fontsize=13, fontweight='bold', pad=10)
ax3.set_xticks(bar_x)
ax3.set_xticklabels([m.replace(' ', '\n') for m in methods], fontsize=11)
ax3.legend(loc='upper right', fontsize=11)
ax3.set_ylim(0, max(land_pcts) + 12)
ax3.grid(True, alpha=0.2, axis='y')
ax3.tick_params(labelsize=11)

plt.tight_layout(h_pad=3)

output_path = os.path.join(OUTPUT_DIR, 'gmm_threshold_comparison.png')
fig.savefig(output_path, dpi=300, bbox_inches='tight', facecolor='white')
print(f"   Saved: {output_path}")

# ─── Final Summary ───────────────────────────────────────────────────────────────
print(f"\n{'=' * 70}")
print(f"  FINAL SUMMARY — {DATA_MONTH} {DATA_YEAR}")
print(f"{'=' * 70}")
print(f"  GMM Threshold:        {gmm_threshold:+.2f}  (data-driven, statistically optimal)")
print(f"  Otsu Threshold:       {otsu_threshold:+.2f}  (inter-class variance maximization)")
print(f"")
print(f"  Water μ = {means[0]:+.2f},  Land μ = {means[1]:+.2f}")
print(f"  Separation = {abs(means[1] - means[0]):.2f} (distance between peaks)")
print(f"{'=' * 70}")
