import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm
import os

# --- Parameters ---
# Simulate a Monsoon month (e.g., July)
np.random.seed(42)
TOTAL_PIXELS = 100000
water_fraction = 0.4
water_mu, water_sigma = -18.2, 1.8
land_mu, land_sigma = -10.5, 2.5

# Generate data
water_samples = np.random.normal(water_mu, water_sigma, int(TOTAL_PIXELS * water_fraction))
land_samples = np.random.normal(land_mu, land_sigma, int(TOTAL_PIXELS * (1 - water_fraction)))
all_vv = np.concatenate([water_samples, land_samples])

# --- 1. Fixed Threshold (User's Present Method) ---
fixed_threshold = -14.0 

# --- 2. GMM Statistical Method (Proposed) ---
# Fit Gaussians
mu_w, std_w = norm.fit(water_samples)
mu_l, std_l = norm.fit(land_samples)
x = np.linspace(-30, 0, 1000)

# PDFs scaled by priors
pdf_w = norm.pdf(x, mu_w, std_w) * water_fraction
pdf_l = norm.pdf(x, mu_l, std_l) * (1 - water_fraction)

# Find Intersection
diff = np.abs(pdf_w - pdf_l)
search_range = (x > -18) & (x < -10)
gmm_threshold = x[search_range][np.argmin(diff[search_range])]

# --- 3. Result Comparison ---
# Classification
fixed_water_mask = all_vv < fixed_threshold
gmm_water_mask = all_vv < gmm_threshold

# Agreement/Disagreement
disagreement = np.logical_xor(fixed_water_mask, gmm_water_mask)
diss_pixels = np.sum(disagreement)
diss_percent = (diss_pixels / TOTAL_PIXELS) * 100

# Area Calculation (Simulated km2)
pixel_size_m = 10
area_fixed = np.sum(fixed_water_mask) * (pixel_size_m**2) / 1e6
area_gmm = np.sum(gmm_water_mask) * (pixel_size_m**2) / 1e6

# --- 4. Plotting ---
plt.figure(figsize=(12, 7))

# Histogram
count, bins, _ = plt.hist(all_vv, bins=100, range=(-30, 0), color='lightgray', alpha=0.7, label='Total VV Distribution')

# Vertical Lines
plt.axvline(fixed_threshold, color='blue', linestyle='--', linewidth=2, label=f'Fixed Threshold ({fixed_threshold} dB)')
plt.axvline(gmm_threshold, color='red', linestyle='-', linewidth=2.5, label=f'GMM Threshold ({gmm_threshold:.2f} dB)')

# Highlight Disagreement Zone
plt.axvspan(min(fixed_threshold, gmm_threshold), max(fixed_threshold, gmm_threshold), 
            color='yellow', alpha=0.3, label=f'Conflict Zone ({diss_percent:.1f}% of pixels)')

plt.title(f'Comparison: Fixed vs. GMM Thresholding (Monsoon Scenario)\nDisagreement: {diss_percent:.1f}% of Landscape', fontsize=14, fontweight='bold')
plt.xlabel('SAR VV Backscatter (dB)')
plt.ylabel('Pixel Count')
plt.legend(loc='upper left')
plt.grid(True, alpha=0.3)

# Save Plot
out_dir = r"D:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\figures"
os.makedirs(out_dir, exist_ok=True)
plot_path = os.path.join(out_dir, "fixed_vs_gmm_comparison.png")
plt.savefig(plot_path, dpi=300)

# Print Summary Table
print("-" * 50)
print(f"{'Metric':<25} | {'Fixed (Present)':<15} | {'GMM (Proposed)':<15}")
print("-" * 50)
print(f"{'Threshold (dB)':<25} | {fixed_threshold:<15} | {gmm_threshold:<15.2f}")
print(f"{'Detected Water Area (km2)':<25} | {area_fixed:<15.2f} | {area_gmm:<15.2f}")
print(f"{'Difference in Area (km2)':<25} | {'N/A':<15} | {abs(area_fixed - area_gmm):<15.2f}")
print("-" * 50)
print(f"Total Pixels in Disagreement: {diss_pixels} ({diss_percent:.2f}%)")
print(f"Plot saved to: {plot_path}")
