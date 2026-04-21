import pandas as pd
import numpy as np

path = r"data\GEE_data\Final_Master_Dataset_2015_2025.csv"
df = pd.read_csv(path)

# 1. Duplicate Check
duplicates = df[df.duplicated(subset=['Year', 'Month', 'Class'], keep=False)]

# 2. Zero Value Check
zero_values = df[df['Area_km2'] == 0]
zero_summary = zero_values.groupby(['Year', 'Month']).size().reset_index(name='Count')

# 3. Outlier Detection (Z-score per Class/Month)
# Since rainfall/flood varies by month, we compare same months across years
def detect_outliers(group):
    mean = group['Area_km2'].mean()
    std = group['Area_km2'].std()
    if std == 0: return pd.Series([False]*len(group), index=group.index)
    z_scores = (group['Area_km2'] - mean) / std
    return z_scores.abs() > 3.0 # Standard 3-sigma outlier

df['Is_Outlier'] = df.groupby(['Class', 'Month'])['Area_km2'].transform(lambda x: detect_outliers(pd.DataFrame({'Area_km2': x})))
outliers = df[df['Is_Outlier']]

# 4. Generate Report
with open("full_audit_report.txt", "w") as f:
    f.write("====================================================\n")
    f.write("FULL DATASET QUALITY AUDIT (2015-2025)\n")
    f.write("====================================================\n\n")

    f.write(f"Total Records: {len(df)}\n")
    f.write(f"Unique Regions: {df['Class'].nunique()}\n\n")

    f.write("--- 1. DUPLICATE RECORDS ---\n")
    if not duplicates.empty:
        f.write(duplicates.to_string(index=False))
    else:
        f.write("None found.\n")
    f.write("\n")

    f.write("--- 2. ZERO VALUE ANOMALIES (Area = 0.0) ---\n")
    if not zero_summary.empty:
        f.write("Summary per Year/Month:\n")
        f.write(zero_summary.to_string(index=False))
        f.write("\n\nDetailed Zero Records (Sample of top 20):\n")
        f.write(zero_values.head(20).to_string(index=False))
    else:
        f.write("None found.\n")
    f.write("\n")

    f.write("--- 3. STATISTICAL OUTLIERS (Z-score > 3.0) ---\n")
    f.write("These represent extreme spikes compared to historical average for that month.\n")
    if not outliers.empty:
        f.write(outliers[['Year', 'Month', 'Class', 'Area_km2']].sort_values(by='Area_km2', ascending=False).to_string(index=False))
    else:
        f.write("None found.\n")
    f.write("\n")

    f.write("--- 4. MISSING YEARS/MONTHS CHECK ---\n")
    expected_rows = 11 * 12 * df['Class'].nunique()
    if len(df) == expected_rows:
        f.write(f"Verified: All {expected_rows} expected records are present.\n")
    else:
        f.write(f"MISMATCH: Expected {expected_rows}, but found {len(df)}.\n")

print("Audit complete. Report saved to full_audit_report.txt")
