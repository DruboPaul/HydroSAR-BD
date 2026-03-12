import pandas as pd

path = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)

print("Total Rows:", len(df))
print("Unique Regions:", df["Class"].nunique())
print("Year Range:", df["Year"].min(), "-", df["Year"].max())
print("Columns:", list(df.columns))
print()
print("All Regions:")
for r in sorted(df["Class"].unique()):
    count = len(df[df["Class"] == r])
    print(f"  {r}: {count} rows")
