import pandas as pd
import numpy as np

# Load the field validation data
file_path = r"D:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\Sample_Points\Water_Samples_2025_Full_Year.csv"
# Note: Use the file with NDWI column if available
ndwi_file = r"D:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis Paper\data\Sample_Points\SAR_Water_Validation_with_NDWI_2025_Robust.csv"

try:
    df = pd.read_csv(ndwi_file)
except FileNotFoundError:
    df = pd.read_csv(file_path)

# Decision Rule: NDWI > -0.1 is Water (True Positive for SAR)
# Relaxed from 0.0 to account for turbid/vegetated water common in Bangladesh
df['Field_Water'] = df['NDWI'] > -0.1
df['SAR_Water'] = True # Our sampling was SAR-positive

def calculate_metrics(data, label):
    tp = data['Field_Water'].sum()
    fp = (~data['Field_Water']).sum()
    total = len(data)
    
    oa = (tp / total) * 100 if total > 0 else 0
    ua = (tp / (tp + fp)) * 100 if (tp + fp) > 0 else 0
    
    # Since we only sampled SAR-water points, we primarily measure User's Accuracy (reliability)
    return {"Label": label, "Total": total, "Verified_Water": tp, "OA_%": round(oa, 2), "UA_%": round(ua, 2)}

# 1. Overall Metrics
overall = calculate_metrics(df, "Overall 2025")

# 2. Monthly Metrics
monthly_metrics = []
for m in range(1, 13):
    m_data = df[df['Month'] == m]
    monthly_metrics.append(calculate_metrics(m_data, f"Month {m}"))

# 3. Seasonal Metrics (Bangladesh)
seasons = {
    "Dry (Dec-Feb)": [12, 1, 2],
    "Pre-monsoon (Mar-May)": [3, 4, 5],
    "Monsoon (Jun-Sep)": [6, 7, 8, 9],
    "Post-monsoon (Oct-Nov)": [10, 11]
}

seasonal_metrics = []
for s_name, s_months in seasons.items():
    s_data = df[df['Month'].isin(s_months)]
    seasonal_metrics.append(calculate_metrics(s_data, s_name))

# Display Results
print("=== Q1 VALIDATION RESULTS Summary ===")
print(pd.DataFrame([overall]).to_string(index=False))
print("\n=== Seasonal Breakdown ===")
print(pd.DataFrame(seasonal_metrics).to_string(index=False))
print("\n=== Monthly Breakdown ===")
print(pd.DataFrame(monthly_metrics).to_string(index=False))

# Save to CSV for LaTeX Tables
pd.DataFrame(monthly_metrics).to_csv("accuracy_report_2025.csv", index=False)
print("\nAccuracy report saved as 'accuracy_report_2025.csv'")
