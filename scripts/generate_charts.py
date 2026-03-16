import pandas as pd
import matplotlib.pyplot as plt
import matplotlib
import numpy as np
import os

# ─── Data Access ──────────────────────────────────────────────────
DATA_PATH = r"d:\Drubo_IWm\Drubo_all\Project\Publication\Project_HydroSAR-Bangladesh\SAR Analysis GMM\data\Final_Interpolated_Master_Dataset_GMM.csv"
df_master = pd.read_csv(DATA_PATH)
nat_df = df_master[df_master['Scope'] == 'National'].copy()

# ─── Global Settings ───────────────────────────────────────────────
matplotlib.rcParams.update({
    'font.family': 'serif',
    'font.size': 11,
    'axes.labelsize': 12,
    'axes.titlesize': 13,
    'xtick.labelsize': 10,
    'ytick.labelsize': 10,
    'legend.fontsize': 10,
    'figure.dpi': 300,
    'savefig.dpi': 300,
    'savefig.bbox': 'tight',
})

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'figures')
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ═══════════════════════════════════════════════════════════════════
# FIGURE 4: Monthly Surface Water Area Time Series
# Data from Table 4 in main_final_submission.tex (lines 339–357)
# ═══════════════════════════════════════════════════════════════════
def fig4_monthly_timeseries():
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    stats = nat_df.groupby('Month')['Area_km2'].agg(['mean', 'std', 'min', 'max']).sort_index()
    
    mean_area = stats['mean'].tolist()
    std_dev   = stats['std'].tolist()
    min_area  = stats['min'].tolist()
    max_area  = stats['max'].tolist()

    x = np.arange(12)

    fig, ax = plt.subplots(figsize=(10, 5.5))

    # Shaded range (min–max)
    ax.fill_between(x, min_area, max_area, alpha=0.12, color='#1f77b4', label='Min–Max range')
    # Shaded ±1 SD
    ax.fill_between(x, [m - s for m, s in zip(mean_area, std_dev)],
                       [m + s for m, s in zip(mean_area, std_dev)],
                    alpha=0.25, color='#1f77b4', label='Mean ± 1 SD')
    # Mean line
    ax.plot(x, mean_area, 'o-', color='#1f77b4', linewidth=2.2, markersize=7,
            markerfacecolor='white', markeredgewidth=2, label='Mean', zorder=5)

    # Season background shading
    seasons = [(0, 2, '#E8F4FD', 'Dry Winter'),       # Dec–Feb (using Jan–Feb here)
               (2, 5, '#FFF8E1', 'Pre-Monsoon'),      # Mar–May
               (5, 9, '#FFEBEE', 'Monsoon'),           # Jun–Sep
               (9, 11, '#E8F5E9', 'Post-Monsoon')]     # Oct–Nov

    for start, end, color, name in seasons:
        ax.axvspan(start - 0.5, end - 0.5, alpha=0.15, color=color, zorder=0)
        mid = (start + end) / 2 - 0.5
        ax.text(mid, 44000, name, ha='center', fontsize=8, fontstyle='italic', color='#666666')

    ax.set_xticks(x)
    ax.set_xticklabels(months)
    ax.set_ylabel('Surface Water Area (km²)')
    ax.set_xlabel('Month')
    ax.set_title('Monthly Surface Water Area in Bangladesh (2015–2025)')
    ax.set_ylim(8000, 47000)
    ax.legend(loc='upper left', framealpha=0.9)
    ax.grid(True, alpha=0.2, linestyle='--')

    # Add annotation for peak
    peak_row = nat_df.loc[nat_df['Area_km2'].idxmax()]
    ax.annotate(f"Peak: {peak_row['Area_km2']:,} km²\n({peak_row['Area_km2']/147570*100:.1f}% of land)",
                xy=(peak_row['Month']-1, peak_row['Area_km2']), xytext=(8, 42000),
                fontsize=9, ha='center',
                arrowprops=dict(arrowstyle='->', color='#333'),
                bbox=dict(boxstyle='round,pad=0.3', facecolor='#fff3e0', edgecolor='#e65100'))

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig4_monthly_timeseries.png')
    plt.savefig(path)
    plt.close()
    print(f'✅ Saved: {path}')


# ═══════════════════════════════════════════════════════════════════
# FIGURE 7: Seasonal Water Area Comparison (Bar Chart)
# Data from Table 6 in main_final_submission.tex (lines 391–401)
# ═══════════════════════════════════════════════════════════════════
def fig7_seasonal_bar():
    seasons_labels = ['Dry Winter\n(Dec–Feb)', 'Pre-Monsoon\n(Mar–May)',
                      'Monsoon\n(Jun–Sep)', 'Post-Monsoon\n(Oct–Nov)']
    
    def get_season(m):
        if m in [12, 1, 2]: return 'Dry Winter'
        if m in [3, 4, 5]: return 'Pre-Monsoon'
        if m in [6, 7, 8, 9]: return 'Monsoon'
        return 'Post-Monsoon'

    nat_df['Season'] = nat_df['Month'].apply(get_season)
    
    season_order = ['Dry Winter', 'Pre-Monsoon', 'Monsoon', 'Post-Monsoon']
    stats = nat_df.groupby('Season')['Area_km2'].agg(['mean', 'min', 'max']).reindex(season_order)
    
    mean_area = stats['mean'].tolist()
    max_area  = stats['max'].tolist()
    min_area  = stats['min'].tolist()

    x = np.arange(4)
    width = 0.55

    fig, ax = plt.subplots(figsize=(9, 5.5))

    # Main bars
    colors = ['#4393c3', '#92c5de', '#d6604d', '#fdae61']
    bars = ax.bar(x, mean_area, width, color=colors, edgecolor='#333',
                  linewidth=0.8, zorder=3)

    # Error bars showing min-max range
    yerr_lower = [m - mi for m, mi in zip(mean_area, min_area)]
    yerr_upper = [ma - m for m, ma in zip(mean_area, max_area)]
    ax.errorbar(x, mean_area, yerr=[yerr_lower, yerr_upper],
                fmt='none', ecolor='#333', capsize=5, capthick=1.5, linewidth=1.5, zorder=4)

    # Value labels
    for bar, val in zip(bars, mean_area):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 800,
                f'{val:,} km²', ha='center', va='bottom', fontsize=10, fontweight='bold')

    # Percentage of land area labels
    total_area = 147570  # Bangladesh total area
    for bar, val in zip(bars, mean_area):
        pct = val / total_area * 100
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() / 2,
                f'{pct:.1f}%', ha='center', va='center', fontsize=10,
                color='white', fontweight='bold')

    ax.set_xticks(x)
    ax.set_xticklabels(seasons_labels)
    ax.set_ylabel('Mean Water Area (km²)')
    ax.set_title('Seasonal Surface Water Extent in Bangladesh (2015–2025 Average)')
    ax.set_ylim(0, 50000)
    ax.grid(axis='y', alpha=0.2, linestyle='--', zorder=0)

    # Add expansion annotation
    expansion = (stat_monsoon - stat_dry) / stat_dry * 100 if 'stat_dry' in locals() else 0
    # (Simplified for now, will dynamicize after data is loaded)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig7_seasonal_bar.png')
    plt.savefig(path)
    plt.close()
    print(f'✅ Saved: {path}')


# ═══════════════════════════════════════════════════════════════════
# FIGURE 9: Decadal Trend Plot
# NOTE: Replace placeholder data with actual annual July values from GEE
# ═══════════════════════════════════════════════════════════════════
def fig9_decadal_trend():
    july_df = nat_df[nat_df['Month'] == 7].sort_values('Year')
    years = july_df['Year'].values
    july_area = july_df['Area_km2'].values

    # Linear regression
    coeffs = np.polyfit(years, july_area, 1)
    trend_line = np.polyval(coeffs, years)
    slope = coeffs[0]

    # R² calculation
    ss_res = np.sum((np.array(july_area) - trend_line) ** 2)
    ss_tot = np.sum((np.array(july_area) - np.mean(july_area)) ** 2)
    r_squared = 1 - ss_res / ss_tot

    fig, ax = plt.subplots(figsize=(10, 5.5))

    # Data points and connecting line
    ax.plot(years, july_area, '-', color='#1f77b4', alpha=0.4, linewidth=1.5)
    ax.scatter(years, july_area, color='#1f77b4', s=90, zorder=5, edgecolors='white', linewidth=1.5)

    # Trend line
    ax.plot(years, trend_line, '--', color='#d62728', linewidth=2.5,
            label=f'Linear trend: {slope:+.1f} km²/yr (R² = {r_squared:.3f})')

    # Mean line
    mean_val = np.mean(july_area)
    ax.axhline(y=mean_val, color='#666', linestyle=':', alpha=0.5, linewidth=1)
    ax.text(2025.3, mean_val, f'Mean: {mean_val:,.0f} km²', fontsize=9, color='#666', va='center')

    ax.set_xlabel('Year')
    ax.set_ylabel('Peak Water Area — July (km²)')
    ax.set_title('Decadal Trend in Peak Monsoon Water Extent (July, 2015–2025)')
    ax.legend(loc='upper left', fontsize=10, framealpha=0.9)
    ax.grid(True, alpha=0.2, linestyle='--')
    ax.set_xticks(years)
    ax.set_xlim(2014.5, 2025.8)

    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig9_decadal_trend.png')
    plt.savefig(path)
    plt.close()
    print(f'✅ Saved: {path}')


# ═══════════════════════════════════════════════════════════════════
# FIGURE 10: Accuracy Assessment — Per-District Confusion Matrices
# Data from Table 9 in main_final_submission.tex (lines 461–475)
# ═══════════════════════════════════════════════════════════════════
def fig10_accuracy():
    # Individual district-season validation results
    scenarios = [
        ('Bhola – Jan',     1459,  2,   41, 1498),  # TP, FP, FN, TN (TN = 3000-TP-FP-FN)
        ('Bhola – Oct',     1474, 23,   26, 1477),
        ('Sunamganj – Jan',  974, 13,  526, 1487),
        ('Sunamganj – Oct', 1311, 60,  189, 1440),
        ('Dhaka – Jan',     1267, 14,  233, 1486),
        ('Dhaka – Oct',     1212, 46,  288, 1454),
    ]

    fig, axes = plt.subplots(2, 3, figsize=(14, 8))

    for idx, (name, tp, fp, fn, tn) in enumerate(scenarios):
        ax = axes[idx // 3, idx % 3]
        matrix = np.array([[tp, fn], [fp, tn]])
        total = tp + fp + fn + tn
        oa = (tp + tn) / total * 100

        # Color map
        im = ax.imshow(matrix, cmap='Blues', aspect='auto', vmin=0, vmax=1600)

        # Labels
        labels = ['Water', 'Non-Water']
        ax.set_xticks([0, 1])
        ax.set_yticks([0, 1])
        ax.set_xticklabels(labels, fontsize=9)
        ax.set_yticklabels(labels, fontsize=9)

        # Annotate cells
        for i in range(2):
            for j in range(2):
                val = matrix[i, j]
                color = 'white' if val > 800 else 'black'
                ax.text(j, i, f'{val}', ha='center', va='center',
                        fontsize=14, fontweight='bold', color=color)

        ax.set_title(f'{name}\nOA = {oa:.1f}%', fontsize=10, fontweight='bold')
        ax.set_xlabel('Predicted (SAR)', fontsize=9)
        ax.set_ylabel('Reference (JRC)', fontsize=9)

    plt.suptitle('Validation Results: SAR-Derived Water Maps vs JRC GSW Reference (2020)',
                 fontsize=13, fontweight='bold', y=1.02)
    plt.tight_layout()
    path = os.path.join(OUTPUT_DIR, 'fig10_accuracy.png')
    plt.savefig(path)
    plt.close()
    print(f'✅ Saved: {path}')


# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════
if __name__ == '__main__':
    print('=' * 60)
    print('Generating publication figures for SAR Analysis GMM')
    print('=' * 60)
    print()

    fig4_monthly_timeseries()
    fig7_seasonal_bar()
    fig9_decadal_trend()
    fig10_accuracy()

    print()
    print('=' * 60)
    print('Done! Check the figures/ directory.')
    print()
    print('Remaining figures that need manual work:')
    print('  Fig 1  — Study Area Map          (ArcGIS Pro)')
    print('  Fig 2  — Methodology Flowchart   (draw.io / PowerPoint)')
    print('  Fig 3  — July Water Maps ×4      (GEE screenshots)')
    print('  Fig 5  — Occurrence Map 2023     (GEE screenshot)')
    print('  Fig 6  — Seasonal Maps ×4        (GEE screenshots)')
    print('  Fig 8  — Change Detection Map    (GEE screenshot)')
    print('  Fig 9  — ⚠️  UPDATE with real GEE data (currently placeholder)')
    print('=' * 60)
