import pandas as pd
from scipy import stats as sp_stats
import json

import os

# Use relative path for robustness
script_dir = os.path.dirname(__file__)
path = os.path.join(script_dir, "GEE_data", "Final_Master_Dataset_GMM_2015_2025.csv")

if not os.path.exists(path):
    print(f"ERROR: {path} not found. Please run merge_csv.py first.")
    exit()

df = pd.read_csv(path)
df = df.drop_duplicates(subset=['Year', 'Month', 'Class'])
nat = df[df['Class'] == 'Bangladesh'].copy()

month_names = ['January','February','March','April','May','June','July','August','September','October','November','December']

# Table 4 (Monthly Averages)
table4 = []
for m in range(1, 13):
    data = nat[nat['Month'] == m]['Area_km2']
    if not data.empty:
        val_min = data.min()
        val_max = data.max()
        val_mean = data.mean()
        val_std = data.std()
        
        table4.append({
            'Month': month_names[m-1],
            'Min': round(val_min) if pd.notnull(val_min) else 0,
            'Max': round(val_max) if pd.notnull(val_max) else 0,
            'Mean': round(val_mean) if pd.notnull(val_mean) else 0,
            'SD': round(val_std) if pd.notnull(val_std) else 0
        })
    else:
        table4.append({
            'Month': month_names[m-1],
            'Min': 0, 'Max': 0, 'Mean': 0, 'SD': 0
        })

# Table 6 (Seasonal)
def get_season(m):
    if m in [12, 1, 2]: return 'Dry Winter'
    if m in [3, 4, 5]: return 'Pre-Monsoon'
    if m in [6, 7, 8, 9]: return 'Monsoon'
    return 'Post-Monsoon'

nat['Season'] = nat['Month'].apply(get_season)
table6 = []
for s in ['Dry Winter', 'Pre-Monsoon', 'Monsoon', 'Post-Monsoon']:
    data = nat[nat['Season'] == s]['Area_km2']
    if not data.empty:
        val_mean = data.mean()
        val_max = data.max()
        val_min = data.min()
        table6.append({
            'Season': s,
            'Mean': round(val_mean) if pd.notnull(val_mean) else 0,
            'Max': round(val_max) if pd.notnull(val_max) else 0,
            'Min': round(val_min) if pd.notnull(val_min) else 0
        })
    else:
        table6.append({'Season': s, 'Mean': 0, 'Max': 0, 'Min': 0})

# Table 8 (Trend - Using New Naming Convention)
divisions = ['Barisal_Division','Chittagong_Division','Dhaka_Division','Khulna_Division','Rajshahi_Division','Rangpur_Division','Sylhet_Division']
table8 = []
for div in divisions:
    july = df[(df['Class'] == div) & (df['Month'] == 7)].sort_values('Year')
    if len(july) > 2:
        slope, intercept, r, p, se = sp_stats.linregress(july['Year'], july['Area_km2'])
        table8.append({
            'Class': div.replace('_Division', ''), 
            'Slope': round(slope, 1) if pd.notnull(slope) else 0.0, 
            'R2': round(r**2, 3) if pd.notnull(r) else 0.0, 
            'PVal': round(p, 3) if pd.notnull(p) else 1.0
        })

july_nat = nat[nat['Month'] == 7].sort_values('Year')
if len(july_nat) > 2:
    slope, intercept, r, p, se = sp_stats.linregress(july_nat['Year'], july_nat['Area_km2'])
    table8.append({
        'Class': 'Bangladesh', 
        'Slope': round(slope, 1) if pd.notnull(slope) else 0.0, 
        'R2': round(r**2, 3) if pd.notnull(r) else 0.0, 
        'PVal': round(p, 3) if pd.notnull(p) else 1.0
    })
else:
    table8.append({'Class': 'Bangladesh', 'Slope': 0.0, 'R2': 0.0, 'PVal': 1.0})

output = {'T4': table4, 'T6': table6, 'T8': table8}
output_json = os.path.join(script_dir, 'extracted_stats.json')
with open(output_json, 'w') as f:
    json.dump(output, f, indent=2)
print(f"SUCCESS: Stats saved to {output_json}")
