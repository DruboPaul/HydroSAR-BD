import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import norm

# Simulate the data
np.random.seed(42)

# Optical NDWI Mask identifies two populations
# 1. True Water (NDWI > 0.0) -> Extract corresponding Sentinel-1 VV values
water_vv = np.random.normal(loc=-17.0, scale=2.4, size=20000)

# 2. True Land (NDWI <= 0.0) -> Extract corresponding Sentinel-1 VV values
land_vv = np.random.normal(loc=-8.5, scale=3.2, size=50000)

plt.figure(figsize=(10, 6))

# Plot histograms
plt.hist(water_vv, bins=100, range=(-30, 0), alpha=0.5, color='#1f77b4', density=True, label='Reference Water (NDWI > 0)')
plt.hist(land_vv, bins=100, range=(-30, 0), alpha=0.5, color='#ff7f0e', density=True, label='Reference Land (NDWI $\leq$ 0)')

# Fit Gaussian curves to represent Probability Density Functions (PDF)
mu_w, std_w = norm.fit(water_vv)
mu_l, std_l = norm.fit(land_vv)
x = np.linspace(-30, 0, 1000)

# Scale by the relative number of pixels (priors)
prior_w = len(water_vv) / (len(water_vv) + len(land_vv))
prior_l = len(land_vv) / (len(water_vv) + len(land_vv))

pdf_w = norm.pdf(x, mu_w, std_w) * prior_w
pdf_l = norm.pdf(x, mu_l, std_l) * prior_l

plt.plot(x, pdf_w, color='blue', linewidth=2, linestyle='--')
plt.plot(x, pdf_l, color='darkorange', linewidth=2, linestyle='--')

# Find intersection point
diff = np.abs(pdf_w - pdf_l)
# Restrict search range to plausible overlap area
search_mask = (x > -18) & (x < -10)
intersect_idx = np.argmin(diff[search_mask])
optimal_threshold = x[search_mask][intersect_idx]
intersect_y = pdf_w[search_mask][intersect_idx]

# Plot the optimal threshold line
plt.axvline(optimal_threshold, color='red', linestyle='-', linewidth=2.5, 
            label=f'Optimal Threshold (Intersection) $\\approx$ {optimal_threshold:.1f} dB')
plt.plot(optimal_threshold, float(intersect_y), 'ro', markersize=8)

# Annotations
plt.fill_between(x, 0, pdf_w, where=(x > optimal_threshold), color='red', alpha=0.3, label='False Negatives (Water missed)')
plt.fill_between(x, 0, pdf_l, where=(x < optimal_threshold), color='black', alpha=0.3, label='False Positives (Land misclassified)')

plt.title('Determining Optimal SAR VV Threshold using Optical NDWI as Reference', fontsize=14, pad=15, fontweight='bold')
plt.xlabel('Sentinel-1 VV Backscatter (dB)', fontsize=12)
plt.ylabel('Pixel Density (Scaled by Class Frequency)', fontsize=12)
plt.grid(True, alpha=0.3)
plt.xlim(-28, 0)
plt.legend(loc='upper right', framealpha=0.9)
plt.tight_layout()

output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "figures", "vv_ndwi_threshold.png")
plt.savefig(output_path, dpi=300)
print(output_path)
