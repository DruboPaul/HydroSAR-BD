import rasterio
import numpy as np
import os

folder = r"data\rasters"

# --- TABLE 5: Persistence Analysis ---
occ_path = os.path.join(folder, "Water_Occurrence_2015_2025.tif")
with rasterio.open(occ_path) as src:
    data = src.read(1)
    pixel_area = 0.01 
    
    # 132 months total
    # Permanent: >80% (F >= 105)
    # Seasonal/Semi-perm: 30-80% (40-104)
    # Ephemeral: 1-30% (1-39)
    
    perm_count = np.sum(data >= 105)
    semi_count = np.sum((data >= 40) & (data < 105))
    eph_count = np.sum((data >= 1) & (data < 40))
    
    bd_area_km2 = 147570 # Approximate area of Bangladesh
    
    print("="*40)
    print("TABLE 5: PERSISTENCE (2015-2025)")
    print("="*40)
    
    classes = [
        ("Permanent", perm_count),
        ("Semi-permanent", semi_count),
        ("Ephemeral", eph_count)
    ]
    
    water_total_area = 0
    for name, count in classes:
        area = count * pixel_area
        perc = (area / bd_area_km2) * 100
        print(f"{name:<20} {area:>12,.1f} {perc:>8.1f}")
        water_total_area += area
    
    no_water_area = bd_area_km2 - water_total_area
    print(f"{'No Water':<20} {no_water_area:>12,.1f} {(no_water_area/bd_area_km2)*100:>8.1f}")

# --- TABLE 7: Change Analysis ---
change_path = os.path.join(folder, "Water_Change_2015_2025.tif")
with rasterio.open(change_path) as src:
    data = src.read(1)
    # 1: Stable, 2: Gained, 3: Lost
    stable_count = np.sum(data == 1)
    gained_count = np.sum(data == 2)
    lost_count = np.sum(data == 3)
    
    total_july_2025 = (stable_count + gained_count) * pixel_area
    
    print("\n" + "="*40)
    print("TABLE 7: CHANGE (July 2015 vs July 2025)")
    print("="*40)
    
    change_classes = [
        ("Gained", gained_count),
        ("Stable", stable_count),
        ("Lost", lost_count)
    ]
    for name, count in change_classes:
        area = count * pixel_area
        # Percentage of the 2025 July water area? 
        # Usually it's percentage of the total water area (Stable + Gained + Lost)
        total_relative = (stable_count + gained_count + lost_count)
        perc = (count / total_relative) * 100
        print(f"{name:<20} {area:>12,.1f} {perc:>10.1f}")
