import pandas as pd
import numpy as np
import pymannkendall as mk
import warnings
warnings.filterwarnings('ignore')

file_path = r"D:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\GEE_data\Final_Interpolated_Master_Dataset_2015_2025.csv"
df = pd.read_csv(file_path)

# Filter National Data
df_nat = df[df['Scope'] == 'National']

# Sort chronologically
df_nat = df_nat.sort_values(by=['Year', 'Month'])

# Display the series
print(f"Total months: {len(df_nat)}")

# Create a time series list
time_series = df_nat['Area_km2'].tolist()

try:
    # Perform Seasonal Mann-Kendall Test (period=12 for monthly data)
    res_smk = mk.seasonal_test(time_series, period=12)
    print("\n--- Seasonal Mann-Kendall Test ---")
    print(f"Trend: {res_smk.trend}")
    print(f"p-value: {res_smk.p}")
    print(f"Z-Score: {res_smk.z}")
    print(f"Tau: {res_smk.Tau}")
    print(f"Sen's Slope: {res_smk.slope} km2/month")
except Exception as e:
    print(f"Pymannkendall error: {e}")

try:
    # Let's also do a simple Sen's slope with confidence intervals using scipy or statsmodels if needed
    import scipy.stats as stats
    x = np.arange(len(time_series))
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, time_series)
    print(f"\nLinear Regression Slope (for reference): {slope*12:.2f} km2/year, p={p_value:.4f}")
except Exception as e:
    pass
