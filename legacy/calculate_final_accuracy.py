import pandas as pd
import numpy as np

import os

# Load data
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
file_path = os.path.join(base_dir, 'data', 'Sample_Points', 'Final_Binary_Field_Validation_2025.csv')
df = pd.read_csv(file_path)

# Drop rows with NaNs if any (GEE sometimes outputs them if pixels are masked)
df = df.dropna(subset=['class', 'Field_Truth'])

# Calculate metrics
y_true = df['Field_Truth'].astype(int)
y_pred = df['class'].astype(int)

# Total points
n = len(df)
tp = np.sum((y_true == 1) & (y_pred == 1))
tn = np.sum((y_true == 0) & (y_pred == 0))
fp = np.sum((y_true == 0) & (y_pred == 1))
fn = np.sum((y_true == 1) & (y_pred == 0))

oa = (tp + tn) / n
pa = tp / (tp + fn) if (tp + fn) > 0 else 0
ua = tp / (tp + fp) if (tp + fp) > 0 else 0
f1 = 2 * (pa * ua) / (pa + ua) if (pa + ua) > 0 else 0

# Kappa calculation
pe = ((tp + fp) * (tp + fn) + (tn + fp) * (tn + fn)) / (n * n)
kappa = (oa - pe) / (1 - pe) if (1 - pe) > 0 else 0

print(f"--- FINAL ACCURACY METRICS 2025 ---")
print(f"Total Validation Points: {n}")
print(f"Overall Accuracy (OA): {oa*100:.2f}%")
print(f"Kappa Coefficient: {kappa:.4f}")
print(f"Producer's Accuracy (PA): {pa*100:.2f}%")
print(f"User's Accuracy (UA): {ua*100:.2f}%")
print(f"F1-Score: {f1*100:.2f}%")
print(f"Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")

# Monthly Statistics
print("\n--- MONTHLY BREAKDOWN ---")
for month in sorted(df['Month'].unique()):
    m_df = df[df['Month'] == month]
    m_n = len(m_df)
    m_y_true = m_df['Field_Truth']
    m_y_pred = m_df['class']
    m_tp = np.sum((m_y_true == 1) & (m_y_pred == 1))
    m_tn = np.sum((m_y_true == 0) & (m_y_pred == 0))
    m_oa = (m_tp + m_tn) / m_n
    print(f"Month {int(month):02d}: OA={m_oa*100:.2f}% | Points={m_n}")
