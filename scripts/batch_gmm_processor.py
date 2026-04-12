import pandas as pd
import numpy as np
import os
from sklearn.mixture import GaussianMixture
from scipy.stats import norm
import warnings

warnings.filterwarnings('ignore')

# ─── Configuration ─────────────────────────────────────────────────────────────
# Path to the GEE-exported histogram CSV (User to provide this file)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INPUT_CSV = os.path.join(BASE_DIR, "data", "GEE_data", "Bangladesh_District_VV_Histograms_2015_2025.csv")
OUTPUT_LOOKUP = os.path.join(BASE_DIR, "data", "GMM_Threshold_Lookup_Table.csv")

def fit_gmm_and_find_threshold(row):
    """
    Fits a 2-component GMM to the histogram data and finds the intersection.
    Input row contains: 'hist' (list of counts), 'bins' (list of centers)
    """
    counts = np.array(row['hist'])
    bins = np.array(row['bins'])
    
    # Filter out empty bins
    mask = counts > 0
    counts = counts[mask]
    bins = bins[mask]
    
    if len(bins) < 5 or counts.sum() < 100:
        return np.nan # Not enough data for a robust fit

    # Reconstruct samples
    samples = np.repeat(bins, counts.astype(int))
    
    try:
        gmm = GaussianMixture(n_components=2, covariance_type='full', max_iter=200, random_state=42)
        gmm.fit(samples.reshape(-1, 1))
        
        means = gmm.means_.flatten()
        stds = np.sqrt(gmm.covariances_.flatten())
        weights = gmm.weights_.flatten()
        
        # Sort by mean (water < land)
        idx = np.argsort(means)
        means, stds, weights = means[idx], stds[idx], weights[idx]
        
        # Find intersection
        x_range = np.linspace(bins.min(), bins.max(), 1000)
        pdf_water = weights[0] * norm.pdf(x_range, means[0], stds[0])
        pdf_land = weights[1] * norm.pdf(x_range, means[1], stds[1])
        
        # Intersection search between peaks
        search_mask = (x_range > means[0]) & (x_range < means[1])
        if not any(search_mask):
             return (means[0] * stds[1] + means[1] * stds[0]) / (stds[0] + stds[1])
             
        diff = pdf_water[search_mask] - pdf_land[search_mask]
        sign_changes = np.where(np.diff(np.sign(diff)))[0]
        
        if len(sign_changes) > 0:
            return x_range[search_mask][sign_changes[0]]
        else:
            # Fallback to weighted mean if no clear intersection point found
            return (means[0] * stds[1] + means[1] * stds[0]) / (stds[0] + stds[1])
            
    except Exception:
        return np.nan

def main():
    if not os.path.exists(INPUT_CSV):
        print(f"Error: {INPUT_CSV} not found.")
        return

    print(f"📖 Reading {INPUT_CSV}...")
    df = pd.read_csv(INPUT_CSV)
    
    # GEE exports hist as a string like "[10, 20, 30]"
    import ast
    df['hist'] = df['histogram_counts'].apply(ast.literal_eval)
    
    # Assuming bins are fixed from -30 to 5 in 0.2 increments (standard for our script)
    # If the CSV has a 'bins' column, use it; otherwise generate it.
    if 'histogram_means' not in df.columns:
        df['bins'] = [np.linspace(-30, 5, len(h)) for h in df['hist']]
    else:
        df['bins'] = df['histogram_means'].apply(ast.literal_eval)

    print(f"Calculating GMM thresholds for {len(df)} district-months...")
    
    # Apply GMM
    df['threshold'] = df.apply(fit_gmm_and_find_threshold, axis=1)
    
    # Drop rows where GMM failed
    failed = df['threshold'].isna().sum()
    if failed > 0:
        print(f"Warning: GMM failed for {failed} rows (likely insufficient water data).")
    
    # Save the lookup table
    # We group by District and Month to get a clean lookup table
    lookup = df.groupby(['district_name', 'month'])['threshold'].mean().reset_index()
    
    # Interpolate missing months if any
    lookup['threshold'] = lookup.groupby('district_name')['threshold'].transform(lambda x: x.interpolate().bfill().ffill())
    
    lookup.to_csv(OUTPUT_LOOKUP, index=False)
    print(f"Success! Lookup table saved to: {OUTPUT_LOOKUP}")

if __name__ == "__main__":
    main()
