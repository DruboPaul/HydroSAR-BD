import pandas as pd

path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Imputed_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)

# Identify any remaining zeros
zeros = df[df['Area_km2'] == 0]
print(f"Remaining zeros found: {len(zeros)}")

for idx, row in zeros.iterrows():
    region = row['Class']
    month = row['Month']
    year = row['Year']
    
    # Calculate seasonal mean for this region/month (excluding zero years)
    region_month_df = df[(df['Class'] == region) & (df['Month'] == month) & (df['Area_km2'] > 0)]
    
    if not region_month_df.empty:
        s_mean = region_month_df['Area_km2'].mean()
        df.at[idx, 'Area_km2'] = s_mean
        print(f"Fixed {region} {month}/{year} using Mean: {s_mean:.2f}")

# Save back to same file
df.to_csv(path, index=False)
print("All zeros resolved.")
