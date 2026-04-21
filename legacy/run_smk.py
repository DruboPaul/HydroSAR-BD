import pandas as pd
import numpy as np
import pymannkendall as mk
import warnings
warnings.filterwarnings('ignore')

import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
file_path = os.path.join(BASE_DIR, "data", "GEE_data", "computed_results", "national_monthly_water_area_2015_2025.csv")
df = pd.read_csv(file_path)

# Filter July (peak monsoon) for annual trend analysis
df_july = df[df['month'] == 7].sort_values('year')

# Sort chronologically
df_nat = df.sort_values(by=['year', 'month'])

print("Total months: %d" % len(df_nat))
print("July observations: %d" % len(df_july))

# Create a time series list (July peak for trend)
time_series_july = df_july['water_area_calibrated_km2'].tolist()
# Full monthly series for seasonal MK
time_series_monthly = df_nat['water_area_calibrated_km2'].tolist()

try:
    # Mann-Kendall test on July peak series (n=11 annual values)
    res_mk = mk.original_test(time_series_july)
    print("\n--- Mann-Kendall Test (July Peak) ---")
    print("Trend: %s" % res_mk.trend)
    print("p-value: %.4f" % res_mk.p)
    print("Z-Score: %.4f" % res_mk.z)
    print("Tau: %.4f" % res_mk.Tau)
    print("Sen's Slope: %.2f km2/year" % res_mk.slope)
    print("Sen's Intercept: %.2f" % res_mk.intercept)
except Exception as e:
    print("Pymannkendall error: %s" % str(e))

try:
    # Seasonal Mann-Kendall on full monthly series
    res_smk = mk.seasonal_test(time_series_monthly, period=12)
    print("\n--- Seasonal Mann-Kendall Test (Full Monthly) ---")
    print("Trend: %s" % res_smk.trend)
    print("p-value: %.4f" % res_smk.p)
    print("Tau: %.4f" % res_smk.Tau)
    print("Sen's Slope: %.2f km2/month" % res_smk.slope)
except Exception as e:
    print("Seasonal MK error: %s" % str(e))

try:
    import scipy.stats as stats
    x = np.arange(len(time_series_july))
    slope, intercept, r_value, p_value, std_err = stats.linregress(x, time_series_july)
    print("\nLinear Regression Slope (for reference): %.2f km2/year, p=%.4f" % (slope, p_value))
except Exception as e:
    pass
