import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Define VV bins
vv_bins = np.arange(-20, -5, 1)

# Simulate pixel counts for Water (NDWI > 0) and Land (NDWI <= 0)
water_counts = [2, 10, 40, 90, 150, 120, 60, 20, 5, 2, 0, 0, 0, 0, 0]
land_counts =  [0, 0,  0,  2,   8,  25, 60, 100, 150, 180, 140, 80, 40, 15, 5]

df = pd.DataFrame({
    'VV_Bin(dB)': vv_bins,
    'True_Water': water_counts,
    'True_Land': land_counts
})

results = []
for t in vv_bins:
    # If VV < t => Predicted Water
    # If VV >= t => Predicted Land
    TP = df[df['VV_Bin(dB)'] < t]['True_Water'].sum()
    FN = df[df['VV_Bin(dB)'] >= t]['True_Water'].sum()
    TN = df[df['VV_Bin(dB)'] >= t]['True_Land'].sum()
    FP = df[df['VV_Bin(dB)'] < t]['True_Land'].sum()
    
    precision = TP / (TP + FP) if (TP + FP) > 0 else 0
    recall = TP / (TP + FN) if (TP + FN) > 0 else 0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
    
    results.append({
        'Threshold(dB)': t,
        'True Positives(TP)': int(TP), 
        'False Pos(FP)': int(FP), 
        'False Neg(FN)': int(FN),
        'Precision': round(precision, 2),
        'Recall': round(recall, 2),
        'F1-Score': round(f1, 2)
    })

res_df = pd.DataFrame(results)

print(df.to_markdown(index=False))
print("\n")
print(res_df.to_markdown(index=False))

# Graph
fig, ax1 = plt.subplots(figsize=(10, 6))

ax1.bar(df['VV_Bin(dB)'] - 0.2, df['True_Water'], width=0.4, color='#1f77b4', label='True Water Pixels (NDWI > 0)', alpha=0.8)
ax1.bar(df['VV_Bin(dB)'] + 0.2, df['True_Land'], width=0.4, color='#ff7f0e', label='True Land Pixels (NDWI <= 0)', alpha=0.8)
ax1.set_xlabel('Sentinel-1 VV Backscatter Threshold Candidate (dB)', fontsize=12)
ax1.set_ylabel('Number of Pixels', fontsize=12)
ax1.set_xlim(-20.5, -5.5)

ax2 = ax1.twinx()
ax2.plot(res_df['Threshold(dB)'], res_df['F1-Score'], marker='D', markersize=8, color='green', linewidth=2.5, label='F1-Score (Accuracy Curve)')
ax2.set_ylabel('F1-Score', fontsize=12, color='green')
ax2.set_ylim(0, 1.05)
ax2.tick_params(axis='y', labelcolor='green')

optimal_t = res_df.loc[res_df['F1-Score'].idxmax(), 'Threshold(dB)']
ax1.axvline(optimal_t, color='red', linestyle='--', linewidth=3, label=f'Optimal Threshold ({optimal_t} dB)')

lines_1, labels_1 = ax1.get_legend_handles_labels()
lines_2, labels_2 = ax2.get_legend_handles_labels()
ax1.legend(lines_1 + lines_2, labels_1 + labels_2, loc='upper left', framealpha=0.9)

plt.title('Finding the Optimal Single Threshold via F1-Score Maximization', fontsize=14, pad=15, fontweight='bold')
plt.grid(True, alpha=0.3)
plt.tight_layout()
output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "figures", "optimum_threshold_f1.png")
plt.savefig(output_path, dpi=300)
