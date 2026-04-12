import pandas as pd
import json
from scipy import stats as sp_stats

# Path to the final imputed dataset
path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis GMM\data\GEE_data\Final_Interpolated_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)

# 1. Monthly Stats (Table 4)
nat = df[df['Class'] == 'Bangladesh'].copy()
month_names = ['January','February','March','April','May','June','July','August','September','October','November','December']

t4_data = []
for m in range(1, 13):
    data = nat[nat['Month'] == m]['Area_km2']
    t4_data.append({
        "Month": month_names[m-1],
        "Min": int(round(data.min())),
        "Max": int(round(data.max())),
        "Mean": int(round(data.mean())),
        "SD": int(round(data.std()))
    })

# 2. Seasonal Stats (Table 6)
def get_season(m):
    if m in [12, 1, 2]: return 'Dry Winter'
    if m in [3, 4, 5]: return 'Pre-Monsoon'
    if m in [6, 7, 8, 9]: return 'Monsoon'
    return 'Post-Monsoon'

nat['Season'] = nat['Month'].apply(get_season)
t6_data = []
for s in ['Dry Winter', 'Pre-Monsoon', 'Monsoon', 'Post-Monsoon']:
    data = nat[nat['Season'] == s]['Area_km2']
    t6_data.append({
        "Season": s,
        "Mean": int(round(data.mean())),
        "Max": int(round(data.max())),
        "Min": int(round(data.min()))
    })

# 3. Division-wise July Trend (Table 8)
# Use the new division labels from the cleaned dataset
divisions_clean = ['Barisal_Division', 'Chittagong_Division', 'Dhaka_Division', 'Khulna_Division', 'Rajshahi_Division', 'Rangpur_Division', 'Sylhet_Division', 'Mymensingh_Division']
t8_data = []
for div in divisions_clean:
    july = df[(df['Class'] == div) & (df['Month'] == 7)].sort_values('Year')
    if len(july) > 2:
        slope, intercept, r, p, se = sp_stats.linregress(july['Year'], july['Area_km2'])
        t8_data.append({
            "Class": div.replace('_Division', ''),
            "Slope": round(float(slope), 2),
            "R2": round(float(r**2), 3),
            "PVal": round(float(p), 3)
        })

# National Trend
july_nat = nat[nat['Month'] == 7].sort_values('Year')
slope, intercept, r, p, se = sp_stats.linregress(july_nat['Year'], july_nat['Area_km2'])
t8_data.append({
    "Class": "Bangladesh",
    "Slope": round(float(slope), 2),
    "R2": round(float(r**2), 3),
    "PVal": round(float(p), 3)
})

# Compile everything
final_stats = {
    "T4": t4_data,
    "T6": t6_data,
    "T8": t8_data
}

# Save to JSON
json_path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis GMM\data\extracted_stats.json"
with open(json_path, 'w') as f:
    json.dump(final_stats, f, indent=2)

print(f"Stats updated in {json_path}")

# Print Table 4 and 6 for quick review
print("\n--- TABLE 4 (RE-SYNCED) ---")
print(pd.DataFrame(t4_data).to_string(index=False))
print("\n--- TABLE 6 (RE-SYNCED) ---")
print(pd.DataFrame(t6_data).to_string(index=False))
