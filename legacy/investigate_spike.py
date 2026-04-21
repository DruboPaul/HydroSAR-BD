import pandas as pd

path = r"data\GEE_data\Cleaned_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)

# 1. Sequence Analysis for Bagerhat (Late 2020 to Early 2021)
bagerhat = df[df['Class'] == 'Bagerhat'].copy()
# Filter for months around Jan 2021
seq = df[(df['Class'] == 'Bagerhat') & 
         (((df['Year'] == 2020) & (df['Month'] >= 10)) | 
          ((df['Year'] == 2021) & (df['Month'] <= 3)))].sort_values(['Year', 'Month'])

print("--- BAGERHAT SEQUENCE (OCT 2020 - MAR 2021) ---")
print(seq[['Year', 'Month', 'Area_km2', 'Threshold']].to_string(index=False))

# 2. Regional Comparison (Jan 2021)
coastal_districts = ['Bagerhat', 'Satkhira', 'Khulna_District', 'Barguna', 'Patuakhali', 'Bhola']
jan_2021_comp = df[(df['Class'].isin(coastal_districts)) & (df['Year'] == 2021) & (df['Month'] == 1)]

print("\n--- COASTAL COMPARISON (JAN 2021) ---")
print(jan_2021_comp[['Class', 'Area_km2', 'Threshold']].to_string(index=False))

# 3. Historical January for Bagerhat
jan_hist = df[(df['Class'] == 'Bagerhat') & (df['Month'] == 1)].sort_values('Year')
print("\n--- BAGERHAT HISTORICAL JANUARY ---")
print(jan_hist[['Year', 'Area_km2']].to_string(index=False))
