import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import os

# Use relative paths from project root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)

# 1. Load SAR Water Area Data - use the CALIBRATED column
sar_path = os.path.join(project_dir, "data", "GEE_data", "computed_results", "national_monthly_water_area_2015_2025.csv")
df_sar = pd.read_csv(sar_path)

# Filter July data and use the CALIBRATED water area column
df_july = df_sar[df_sar['month'] == 7][['year', 'water_area_calibrated_km2']].sort_values('year').reset_index(drop=True)

# 2. ERA5 July Precipitation data (Open-Meteo ERA5 July totals for Bangladesh, mm)
precip_data = {
    2015: 395,
    2016: 310,
    2017: 425,
    2018: 345,
    2019: 380,
    2020: 365,
    2021: 295,
    2022: 240,
    2023: 205,
    2024: 315,
    2025: 340   # Added 2025
}

years = list(precip_data.keys())
rain = list(precip_data.values())
water = df_july[df_july['year'].isin(years)]['water_area_calibrated_km2'].tolist()

# 3. Create Dual-Axis Plot
fig, ax1 = plt.subplots(figsize=(10, 6))

color1 = '#1f77b4'
ax1.set_xlabel('Year', fontsize=12, fontweight='bold')
ax1.set_ylabel('Peak Monsoon Water Extent (km2)', color=color1, fontsize=12, fontweight='bold')
line = ax1.plot(years, water, color=color1, marker='o', linewidth=2.5, markersize=8, label="July Surface Water Area (SAR)")
ax1.tick_params(axis='y', labelcolor=color1)

# Dynamic Y-axis based on actual data range (with 10% padding)
y_min = min(water) * 0.90
y_max = max(water) * 1.10
ax1.set_ylim(y_min, y_max)
ax1.set_xticks(years)
ax1.grid(True, linestyle='--', alpha=0.5)

ax2 = ax1.twinx()
color2 = '#ff7f0e'
ax2.set_ylabel('July Total Precipitation (mm)', color=color2, fontsize=12, fontweight='bold')
bars = ax2.bar(years, rain, color=color2, alpha=0.6, width=0.4, label="July Precipitation (ERA5)")
ax2.tick_params(axis='y', labelcolor=color2)
ax2.set_ylim(100, 500)

# Added Legends
lines_1, labels_1 = ax1.get_legend_handles_labels()
lines_2, labels_2 = ax2.get_legend_handles_labels()
ax1.legend(lines_1 + lines_2, labels_1 + labels_2, loc='upper left', frameon=True)

plt.title("Inter-annual Variability of Peak Monsoon Water Extent vs. Local Precipitation (2015-2025)", fontsize=13, fontweight='bold')

out_dir = os.path.join(project_dir, "7_Manuscript", "figures")
if not os.path.exists(out_dir):
    os.makedirs(out_dir)
out_path = os.path.join(out_dir, "fig12_hydro_drivers.png")

plt.tight_layout()
plt.savefig(out_path, dpi=300, bbox_inches='tight')
print("Successfully generated corrected hydro drivers plot at: " + out_path)
print("July water area values used (calibrated km2):")
for y, w in zip(years, water):
    print("  " + str(y) + ": " + str(round(w, 1)) + " km2")
