import pandas as pd
import numpy as np

# Load the cleaned dataset
path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Cleaned_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)

# Total 72 regions (64 Districts + 8 Divisions) + Bangladesh
regions = df['Class'].unique()

print(f"Original problematic records (Area=0 in Jan 2016): {len(df[(df['Year'] == 2016) & (df['Month'] == 1) & (df['Area_km2'] == 0)])}")

fixed_rows = []

for region in regions:
    region_df = df[df['Class'] == region].copy()
    
    # Check if Jan 2016 is 0
    jan_2016_idx = region_df[(region_df['Year'] == 2016) & (region_df['Month'] == 1)].index
    
    if len(jan_2016_idx) > 0:
        val_2016 = df.at[jan_2016_idx[0], 'Area_km2']
        
        if val_2016 == 0:
            # Calculate seasonal mean (Mean of all other Januaries)
            other_jans = region_df[(region_df['Month'] == 1) & (region_df['Year'] != 2016)]
            if not other_jans.empty:
                seasonal_mean = other_jans['Area_km2'].mean()
                # Update the value
                df.at[jan_2016_idx[0], 'Area_km2'] = seasonal_mean
                # Note: We keep the original threshold as it was already seasonal adaptive
                
print(f"Remaining problematic records: {len(df[(df['Year'] == 2016) & (df['Month'] == 1) & (df['Area_km2'] == 0)])}")

# Save the final version
final_path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Imputed_Master_Dataset_2015_2025.csv"
df.to_csv(final_path, index=False)

print(f"Final imputed dataset saved to {final_path}")
