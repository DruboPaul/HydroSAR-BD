import pandas as pd
import numpy as np

path = r"data\GEE_data\Final_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)

# Filter for Bagerhat and January
bagerhat_jan = df[(df["Class"] == "Bagerhat") & (df["Month"] == 1)].sort_values("Year")

# Calculate stats
mean_area = bagerhat_jan["Area_km2"].mean()
spike_threshold = mean_area + 20
spikes = bagerhat_jan[bagerhat_jan["Area_km2"] > spike_threshold]
jan_2016 = bagerhat_jan[bagerhat_jan["Year"] == 2016]["Area_km2"].values

with open("bagerhat_report.txt", "w") as f:
    f.write("--- BAGERHAT JANUARY WATER AREA (2015-2025) ---\n")
    f.write(bagerhat_jan[["Year", "Area_km2", "Threshold"]].to_string(index=False))
    f.write(f"\n\nMean Area: {mean_area:.2f} km^2\n")
    
    if not spikes.empty:
        f.write("\n[!] SPIKE DETECTED (Absolute > Mean + 20km2):\n")
        f.write(spikes[["Year", "Area_km2"]].to_string(index=False))
    else:
        f.write("\nNo significant spikes detected.\n")

    if len(jan_2016) > 0 and jan_2016[0] == 0:
        f.write("\n[!] WARNING: January 2016 shows 0.0 km^2. Data Anomaly.\n")

print("Report saved to bagerhat_report.txt")
