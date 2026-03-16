import pandas as pd
import numpy as np
import json

file_path = r"D:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis GMM\data\Sample_Points\Balanced_Validation_Points_2025_Full.csv"

def audit_points(path):
    print(f"--- Auditing: {path} ---")
    try:
        df = pd.read_csv(path)
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    total = len(df)
    print(f"Total points: {total}")

    # 1. Missing Values
    missing = df.isnull().sum()
    print("\nMissing values per column:")
    print(missing)

    # 2. Class Distribution
    if 'class' in df.columns:
        print("\nClass Distribution:")
        print(df['class'].value_counts())
    
    # 3. Time Distribution
    if 'Month' in df.columns:
        print("\nPoints per Month:")
        print(df['Month'].value_counts().sort_index())
    
    if 'Year' in df.columns:
        print("\nPoints per Year:")
        print(df['Year'].value_counts().sort_index())

    # 4. Spatial Validation (Coordinate Extraction)
    print("\nExtracting coordinates for spatial check...")
    lats = []
    lons = []
    invalid_geo = 0
    
    for geo_str in df['.geo']:
        try:
            geo_dict = json.loads(geo_str)
            coords = geo_dict['coordinates']
            lons.append(coords[0])
            lats.append(coords[1])
        except (json.JSONDecodeError, KeyError, TypeError):
            invalid_geo += 1
    
    if invalid_geo > 0:
        print(f"Invalid .geo formats found: {invalid_geo}")
    
    if lats and lons:
        print(f"Latitude range: {min(lats):.4f} to {max(lats):.4f}")
        print(f"Longitude range: {min(lons):.4f} to {max(lons):.4f}")
        
        # Bangladesh bounds approx: 20N-27N, 88E-93E
        out_of_bounds = 0
        for lat, lon in zip(lats, lons):
            if not (20 <= lat <= 27) or not (88 <= lon <= 93):
                out_of_bounds += 1
        print(f"Points outside Bangladesh bounds (approx): {out_of_bounds}")

    # 5. Duplicates
    duplicates = df.duplicated().sum()
    print(f"\nExact duplicate rows: {duplicates}")

    # 6. Recommendation
    if missing.sum() == 0 and invalid_geo == 0 and out_of_bounds == 0 and duplicates == 0:
        print("\n✅ CLEAN DATA: No immediate issues found.")
    else:
        print("\n⚠️ ISSUES FOUND: Cleaning suggested.")

if __name__ == "__main__":
    audit_points(file_path)
