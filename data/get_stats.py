import pandas as pd
from scipy import stats as sp_stats
import json

path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)
df = df.drop_duplicates(subset=['Year', 'Month', 'Class'])
nat = df[df['Class'] == 'Bangladesh'].copy()

month_names = ['January','February','March','April','May','June','July','August','September','October','November','December']

# Table 4
table4 = []
for m in range(1, 13):
    data = nat[nat['Month'] == m]['Area_km2']
    table4.append({
        'Month': month_names[m-1],
        'Min': round(data.min()),
        'Max': round(data.max()),
        'Mean': round(data.mean()),
        'SD': round(data.std())
    })

# Table 6
def get_season(m):
    if m in [12, 1, 2]: return 'Dry Winter'
    if m in [3, 4, 5]: return 'Pre-Monsoon'
    if m in [6, 7, 8, 9]: return 'Monsoon'
    return 'Post-Monsoon'

nat['Season'] = nat['Month'].apply(get_season)
table6 = []
for s in ['Dry Winter', 'Pre-Monsoon', 'Monsoon', 'Post-Monsoon']:
    data = nat[nat['Season'] == s]['Area_km2']
    table6.append({
        'Season': s,
        'Mean': round(data.mean()),
        'Max': round(data.max()),
        'Min': round(data.min())
    })

# Table 8 (Trend)
divisions = ['Barisal','Chittagong','Dhaka','Khulna','Rajshahi','Rangpur','Sylhet']
table8 = []
for div in divisions:
    july = df[(df['Class'] == div) & (df['Month'] == 7)].sort_values('Year')
    if len(july) > 2:
        slope, intercept, r, p, se = sp_stats.linregress(july['Year'], july['Area_km2'])
        table8.append({'Class': div, 'Slope': round(slope, 1), 'R2': round(r**2, 3), 'PVal': round(p, 3)})

july_nat = nat[nat['Month'] == 7].sort_values('Year')
slope, intercept, r, p, se = sp_stats.linregress(july_nat['Year'], july_nat['Area_km2'])
table8.append({'Class': 'Bangladesh', 'Slope': round(slope, 1), 'R2': round(r**2, 3), 'PVal': round(p, 3)})

output = {'T4': table4, 'T6': table6, 'T8': table8}
with open('extracted_stats.json', 'w') as f:
    json.dump(output, f, indent=2)
print("Stats saved to extracted_stats.json")
