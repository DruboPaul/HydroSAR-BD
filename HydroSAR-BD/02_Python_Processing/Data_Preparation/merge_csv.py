"""
Merge all GEE CSV parts into one Final Master Dataset.
"""
import pandas as pd
import glob
import os

# ফোল্ডার পাথ
gee_folder = os.path.join(os.path.dirname(__file__), "GEE_data")
output_file = os.path.join(os.path.dirname(__file__), "GEE_data", "Final_Master_Dataset_2015_2025.csv")

# সব CSV ফাইল খুঁজে বের করা
csv_files = sorted(glob.glob(os.path.join(gee_folder, "Master_Dataset_Part*.csv")))

print(f"Found {len(csv_files)} CSV files to merge:")
for f in csv_files:
    print(f"  - {os.path.basename(f)}")

# সব ফাইল একত্রিত করা
all_dfs = []
for f in csv_files:
    df = pd.read_csv(f)
    all_dfs.append(df)
    print(f"  Loaded {os.path.basename(f)}: {len(df)} rows")

# মার্জ করা
master = pd.concat(all_dfs, ignore_index=True)

# Year এবং Month কে Integer এ রূপান্তর করা
master['Year'] = master['Year'].astype(int)
master['Month'] = master['Month'].astype(int)

# সাজানো (Year → Month → Class)
master = master.sort_values(['Class', 'Year', 'Month']).reset_index(drop=True)

# সেভ করা
master.to_csv(output_file, index=False)

# সামারি দেখানো
print(f"\n{'='*60}")
print(f"MERGE COMPLETE!")
print(f"{'='*60}")
print(f"Total Rows: {len(master)}")
print(f"Unique Regions (Class): {master['Class'].nunique()}")
print(f"Regions: {sorted(master['Class'].unique())}")
print(f"Year Range: {master['Year'].min()} - {master['Year'].max()}")
print(f"Output: {output_file}")
print(f"{'='*60}")
