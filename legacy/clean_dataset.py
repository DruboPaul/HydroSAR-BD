import pandas as pd
import numpy as np

path = r"data\GEE_data\Final_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)

# 1. Identify collision regions
collision_names = ["Barisal", "Chittagong", "Dhaka", "Khulna", "Rajshahi", "Rangpur", "Sylhet", "Mymensingh"]

def fix_collisions(group):
    if len(group) == 2:
        # Sort by Area_km2 sum (Division will have much larger area)
        # However, we need to sort within each Year/Month pair
        pass
    return group

# Better approach: Group by Year, Month, Class
# If count > 1, the row with larger Area_km2 is Division
cleaned_rows = []
for (year, month, name), group in df.groupby(['Year', 'Month', 'Class']):
    if name in collision_names and len(group) > 1:
        # Sort by area descending
        sorted_group = group.sort_values(by='Area_km2', ascending=False)
        # Largest is Division
        div_row = sorted_group.iloc[0].copy()
        div_row['Class'] = f"{name}_Division"
        # Smallest is District
        dist_row = sorted_group.iloc[1].copy()
        dist_row['Class'] = f"{name}_District"
        cleaned_rows.append(div_row)
        cleaned_rows.append(dist_row)
    else:
        cleaned_rows.append(group.iloc[0])

df_clean = pd.DataFrame(cleaned_rows)

# 2. Add District/Division flag for easy filtering later
df_clean['Scope'] = 'District'
df_clean.loc[df_clean['Class'].str.contains('_Division'), 'Scope'] = 'Division'
df_clean.loc[df_clean['Class'] == 'Bangladesh', 'Scope'] = 'National'

# Change specific ones that are actually divisions but didn't have collisions
# (Likely not many, but just in case)
for col in collision_names:
    if col in df_clean['Class'].values and col not in [f"{c}_District" for c in collision_names]:
        # If it's a division name but no collision occurred in that specific month
        # We should still mark it as a division if it's the intended scale
        pass

# 3. Save cleaned dataset
output_path = r"data\GEE_data\Cleaned_Master_Dataset_2015_2025.csv"
df_clean.to_csv(output_path, index=False)

print(f"Cleaned dataset saved to {output_path}")
print(f"Total rows: {len(df_clean)}")
print(f"Unique regions: {df_clean['Class'].nunique()}")
print("\nNew Region Sample:")
print(df_clean[df_clean['Class'].str.contains('Barisal')]['Class'].unique())
