import pandas as pd
import requests
import numpy as np
import matplotlib.pyplot as plt
from scipy.stats import pearsonr
import os

print("Fetching ERA5 Historical Precipitation for Bangladesh (2015-2024)...")
# API endpoint for Open-Meteo historical ERA5
url = "https://archive-api.open-meteo.com/v1/archive"
params = {
    "latitude": 23.6850,  # Central Bangladesh
    "longitude": 90.3563,
    "start_date": "2015-01-01",
    "end_date": "2024-12-31",
    "daily": "precipitation_sum",
    "timezone": "auto"
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json()
    dates = data['daily']['time']
    precip = data['daily']['precipitation_sum']
    
    df_meteo = pd.DataFrame({'Date': pd.to_datetime(dates), 'Precip_mm': precip})
    df_meteo['Year'] = df_meteo['Date'].dt.year
    df_meteo['Month'] = df_meteo['Date'].dt.month
    
    # Calculate monthly totals
    monthly_precip = df_meteo.groupby(['Year', 'Month'])['Precip_mm'].sum().reset_index()
    
    # Read our SAR water area data
    sar_path = r"D:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Interpolated_Master_Dataset_2015_2025.csv"
    df_sar = pd.read_csv(sar_path)
    df_sar_nat = df_sar[df_sar['Scope'] == 'National'][['Year', 'Month', 'Area_km2']]
    
    # Merge datasets
    merged = pd.merge(df_sar_nat, monthly_precip, on=['Year', 'Month'])
    
    # Analyze July (Peak Monsoon) Correlation
    df_july = merged[merged['Month'] == 7]
    
    corr_coeff, p_val = pearsonr(df_july['Precip_mm'], df_july['Area_km2'])
    print(f"July Peak Correlation (Precip vs Water Area): r = {corr_coeff:.3f}, p = {p_val:.4f}")
    
    # Plot Scatter
    out_dir = r"D:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\figures"
    os.makedirs(out_dir, exist_ok=True)
    
    plt.figure(figsize=(8, 6))
    plt.scatter(df_july['Precip_mm'], df_july['Area_km2'], color='blue', s=100, alpha=0.7)
    
    # Add trendline
    z = np.polyfit(df_july['Precip_mm'], df_july['Area_km2'], 1)
    p = np.poly1d(z)
    plt.plot(df_july['Precip_mm'], p(df_july['Precip_mm']), "r--", linewidth=2)
    
    plt.title("Correlation between July Precipitation (ERA5) and Peak Surface Water Extent\n(Bangladesh 2015-2024)", fontsize=12)
    plt.xlabel("Total July Precipitation (mm)", fontsize=11)
    plt.ylabel("July Surface Water Extent (km²)", fontsize=11)
    plt.grid(True, linestyle='--', alpha=0.6)
    
    # Add text box with stats
    textstr = f"Pearson r = {corr_coeff:.3f}\np-value = {p_val:.3f}"
    props = dict(boxstyle='round', facecolor='wheat', alpha=0.5)
    plt.gca().text(0.05, 0.95, textstr, transform=plt.gca().transAxes, fontsize=12,
            verticalalignment='top', bbox=props)
            
    out_path = os.path.join(out_dir, "fig12_precip_correlation.png")
    plt.savefig(out_path, dpi=300, bbox_inches='tight')
    print(f"Plot saved to {out_path}")
else:
    print(f"Error fetching data: {response.status_code}")
