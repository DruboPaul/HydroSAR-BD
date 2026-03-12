import pandas as pd

path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)
df = df.drop_duplicates(subset=['Year', 'Month', 'Class'])

nat = df[df['Class'] == 'Bangladesh'].copy()

month_names = ['January','February','March','April','May','June','July','August','September','October','November','December']

print("=" * 60)
print("TABLE 4: Monthly Surface Water Stats (2015-2025)")
print("=" * 60)
print(f"{'Month':<12} {'Min':>8} {'Max':>8} {'Mean':>8} {'SD':>8}")
print("-" * 50)
for m in range(1, 13):
    data = nat[nat['Month'] == m]['Area_km2']
    print(f"{month_names[m-1]:<12} {data.min():>8,.0f} {data.max():>8,.0f} {data.mean():>8,.0f} {data.std():>8,.0f}")

print()
print("=" * 60)
print("TABLE 6: Seasonal Stats (2015-2025)")
print("=" * 60)

def get_season(m):
    if m in [12, 1, 2]: return 'Dry Winter'
    if m in [3, 4, 5]: return 'Pre-Monsoon'
    if m in [6, 7, 8, 9]: return 'Monsoon'
    return 'Post-Monsoon'

nat['Season'] = nat['Month'].apply(get_season)
print(f"{'Season':<25} {'Mean':>8} {'Max':>8} {'Min':>8}")
print("-" * 50)
for s in ['Dry Winter', 'Pre-Monsoon', 'Monsoon', 'Post-Monsoon']:
    data = nat[nat['Season'] == s]['Area_km2']
    print(f"{s:<25} {data.mean():>8,.0f} {data.max():>8,.0f} {data.min():>8,.0f}")

print()
print("=" * 60)
print("TABLE 8: Division-wise July Trend (2015-2025)")
print("=" * 60)
from scipy import stats as sp_stats

divisions = ['Barisal','Chittagong','Dhaka','Khulna','Rajshahi','Rangpur','Sylhet']
print(f"{'Division':<15} {'Slope':>12} {'R2':>8} {'p-value':>10}")
print("-" * 50)
for div in divisions:
    july = df[(df['Class'] == div) & (df['Month'] == 7)].sort_values('Year')
    if len(july) > 2:
        slope, intercept, r, p, se = sp_stats.linregress(july['Year'], july['Area_km2'])
        print(f"{div:<15} {slope:>+12.1f} {r**2:>8.3f} {p:>10.3f}")

# National
july_nat = nat[nat['Month'] == 7].sort_values('Year')
slope, intercept, r, p, se = sp_stats.linregress(july_nat['Year'], july_nat['Area_km2'])
print(f"{'Bangladesh':<15} {slope:>+12.1f} {r**2:>8.3f} {p:>10.3f}")
