import pandas as pd
import numpy as np
import os

path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Imputed_Master_Dataset_2015_2025.csv"
if not os.path.exists(path):
    print("Cannot find dataset!")
    exit(1)

df = pd.read_csv(path)

# Identifying the 2016 Jan gap (originally 0.0, currently imputed with seasonal mean)
# We will recalibrate these points using Linear Interpolation between Dec 2015 and Feb 2016.

regions = df['Class'].unique()

print("Applying Linear Interpolation for January 2016...")

fixed_count = 0
for region in regions:
    # Get values for Dec 2015, Jan 2016, and Feb 2016
    v_dec15 = df[(df['Class'] == region) & (df['Year'] == 2015) & (df['Month'] == 12)]['Area_km2']
    v_jan16 = df[(df['Class'] == region) & (df['Year'] == 2016) & (df['Month'] == 1)]['Area_km2']
    v_feb16 = df[(df['Class'] == region) & (df['Year'] == 2016) & (df['Month'] == 2)]['Area_km2']
    
    if not v_dec15.empty and not v_feb16.empty:
        val_dec15 = v_dec15.values[0]
        val_feb16 = v_feb16.values[0]
        
        # Linear Interpolation: Jan = (Dec + Feb) / 2
        interpolated_val = (val_dec15 + val_feb16) / 2
        
        # Update Jan 2016
        idx = df[(df['Class'] == region) & (df['Year'] == 2016) & (df['Month'] == 1)].index
        if not idx.empty:
            df.at[idx[0], 'Area_km2'] = interpolated_val
            fixed_count += 1

print(f"Fixed {fixed_count} regions using linear interpolation.")

# Save to a new version to be safe
output_path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Interpolated_Master_Dataset_2015_2025.csv"
df.to_csv(output_path, index=False)

print(f"Final dataset saved to: {output_path}")
