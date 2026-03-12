import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import gaussian_kde
import os

# Create figure directory if it doesn't exist
out_dir = r"D:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\figures"
os.makedirs(out_dir, exist_ok=True)

# Set plotting style
plt.rcParams.update({'font.size': 12, 'font.family': 'sans-serif'})

# Create figure with 2 subplots (Dry Season vs Monsoon)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5), sharey=True)

# Generate synthetic data for Dry Season (January)
np.random.seed(42)
water_dry = np.random.normal(-21, 1.8, 15000)
land_dry = np.random.normal(-10, 2.5, 85000)
all_dry = np.concatenate([water_dry, land_dry])

# Generate synthetic data for Monsoon Season (July)
water_monsoon = np.random.normal(-17, 2.0, 35000)
land_monsoon = np.random.normal(-8.5, 2.8, 65000)
all_monsoon = np.concatenate([water_monsoon, land_monsoon])

# Utility function for KDE plotting
def plot_kde(ax, data, color, label, linestyle="-", fill=False):
    kde = gaussian_kde(data, bw_method=0.3)
    x = np.linspace(-30, 0, 300)
    y = kde(x)
    ax.plot(x, y, color=color, label=label, linestyle=linestyle, linewidth=2)
    if fill:
        ax.fill_between(x, y, alpha=0.2, color=color)

# Plot Dry Season (January)
plot_kde(ax1, all_dry, color="gray", label="Overall Distribution", fill=True)
plot_kde(ax1, water_dry, color="blue", label="Water Class", linestyle="--")
plot_kde(ax1, land_dry, color="green", label="Non-Water Class", linestyle="--")
ax1.axvline(-17, color="red", linestyle="-", linewidth=2.5, label="Optimal Threshold (-17 dB)")

ax1.set_title("(a) Dry Season (January)", fontsize=14, fontweight="bold")
ax1.set_xlabel("VV Backscatter (dB)")
ax1.set_ylabel("Density")
ax1.set_xlim(-30, 0)
ax1.grid(True, linestyle='--', alpha=0.7)
ax1.legend(loc="upper left")

# Plot Monsoon Season (July)
plot_kde(ax2, all_monsoon, color="gray", label="Overall Distribution", fill=True)
plot_kde(ax2, water_monsoon, color="blue", label="Water Class", linestyle="--")
plot_kde(ax2, land_monsoon, color="green", label="Non-Water Class", linestyle="--")
ax2.axvline(-13, color="red", linestyle="-", linewidth=2.5, label="Optimal Threshold (-13 dB)")

ax2.set_title("(b) Monsoon Season (July)", fontsize=14, fontweight="bold")
ax2.set_xlabel("VV Backscatter (dB)")
ax2.set_xlim(-30, 0)
ax2.grid(True, linestyle='--', alpha=0.7)
ax2.legend(loc="upper left")

plt.tight_layout()
out_path = os.path.join(out_dir, "fig_threshold_histogram.png")
plt.savefig(out_path, dpi=300, bbox_inches='tight')
print(f"Histogram successfully generated at: {out_path}")
