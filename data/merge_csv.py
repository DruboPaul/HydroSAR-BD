"""
Merge all GEE CSV parts into one Final Master Dataset.
"""
import pandas as pd
import glob
import os

# Folder path
gee_folder = os.path.join(os.path.dirname(__file__), "GEE_data")
output_file = os.path.join(os.path.dirname(__file__), "GEE_data", "Final_Master_Dataset_GMM_2015_2025.csv")

# Find all CSV files
csv_files = sorted(glob.glob(os.path.join(gee_folder, "Master_Dataset_Part*.csv")))

print(f"Found {len(csv_files)} CSV files to merge:")
for f in csv_files:
    print(f"  - {os.path.basename(f)}")

# Aggregate all files
all_dfs = []
for f in csv_files:
    df = pd.read_csv(f)
    all_dfs.append(df)
    print(f"  Loaded {os.path.basename(f)}: {len(df)} rows")

# Merge
master = pd.concat(all_dfs, ignore_index=True)

# Convert Year and Month to Integer
master['Year'] = master['Year'].astype(int)
master['Month'] = master['Month'].astype(int)

# Sorting (Year -> Month -> Class)
master = master.sort_values(['Class', 'Year', 'Month']).reset_index(drop=True)

# Save
master.to_csv(output_file, index=False)

# Show summary
print(f"\n{'='*60}")
print(f"MERGE COMPLETE!")
print(f"{'='*60}")
print(f"Total Rows: {len(master)}")
print(f"Unique Regions (Class): {master['Class'].nunique()}")
print(f"Regions: {sorted(master['Class'].unique())}")
print(f"Year Range: {master['Year'].min()} - {master['Year'].max()}")
print(f"Output: {output_file}")
print(f"{'='*60}")
