<<<<<<< HEAD:legacy/calculate_kappa_gmm.py
import pandas as pd
import numpy as np
from sklearn.metrics import confusion_matrix, accuracy_score, cohen_kappa_score

# Configuration
csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "Sample_Points", "Final_Binary_Field_Validation_2025.csv")

def calculate_metrics():
    print("--- GMM Accuracy Assessment (Python Offline Analysis) ---")
    
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Error: {e}")
        return

    # Filter out any missing values
    df = df.dropna(subset=['class', 'Field_Truth'])
    
    y_true = df['Field_Truth'].astype(int)
    y_pred = df['class'].astype(int)

    # 1. Overall Metrics
    oa = accuracy_score(y_true, y_pred)
    kappa = cohen_kappa_score(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred)
    tp, fp, fn, tn = cm.ravel() if cm.size == 4 else (0,0,0,0)

    print(f"\nOVERALL RESULTS (N={len(df)}):")
    print(f"Overall Accuracy (OA): {oa*100:.2f}%")
    print(f"Kappa Coefficient (κ): {kappa:.4f}")
    print(f"Confusion Matrix: TP={tp}, FP={fp}, FN={fn}, TN={tn}")

    # 2. Monthly Breakdown
    monthly_stats = []
    print("\nMONTHLY BREAKDOWN:")
    for m in range(1, 13):
        m_df = df[df['Month'] == m]
        if len(m_df) == 0: continue
        
        m_true = m_df['Field_Truth']
        m_pred = m_df['class']
        
        m_oa = accuracy_score(m_true, m_pred)
        m_kappa = cohen_kappa_score(m_true, m_pred)
        
        print(f"Month {m:02d}: OA={m_oa*100:.2f}% | κ={m_kappa:.3f} | Points={len(m_df)}")
        monthly_stats.append({
            'Month': m,
            'OA_%': round(m_oa*100, 2),
            'Kappa': round(m_kappa, 4),
            'Points': len(m_df)
        })

    # Save report
    report_df = pd.DataFrame(monthly_stats)
    report_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "final_accuracy_report_2025.csv")
    report_df.to_csv(report_path, index=False)
    print(f"\nAccuracy report saved to: {report_path}")

if __name__ == "__main__":
    calculate_metrics()
=======
import pandas as pd
import numpy as np
from sklearn.metrics import confusion_matrix, accuracy_score, cohen_kappa_score

# Configuration
csv_path = r"data\Sample_Points\Final_Binary_Field_Validation_2025.csv"

def calculate_metrics():
    print("--- GMM Accuracy Assessment (Python Offline Analysis) ---")
    
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Error: {e}")
        return

    # Filter out any missing values
    df = df.dropna(subset=['class', 'Field_Truth'])
    
    y_true = df['Field_Truth'].astype(int)
    y_pred = df['class'].astype(int)

    # 1. Overall Metrics
    oa = accuracy_score(y_true, y_pred)
    kappa = cohen_kappa_score(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred)
    tp, fp, fn, tn = cm.ravel() if cm.size == 4 else (0,0,0,0)

    print(f"\nOVERALL RESULTS (N={len(df)}):")
    print(f"Overall Accuracy (OA): {oa*100:.2f}%")
    print(f"Kappa Coefficient (κ): {kappa:.4f}")
    print(f"Confusion Matrix: TP={tp}, FP={fp}, FN={fn}, TN={tn}")

    # 2. Monthly Breakdown
    monthly_stats = []
    print("\nMONTHLY BREAKDOWN:")
    for m in range(1, 13):
        m_df = df[df['Month'] == m]
        if len(m_df) == 0: continue
        
        m_true = m_df['Field_Truth']
        m_pred = m_df['class']
        
        m_oa = accuracy_score(m_true, m_pred)
        m_kappa = cohen_kappa_score(m_true, m_pred)
        
        print(f"Month {m:02d}: OA={m_oa*100:.2f}% | κ={m_kappa:.3f} | Points={len(m_df)}")
        monthly_stats.append({
            'Month': m,
            'OA_%': round(m_oa*100, 2),
            'Kappa': round(m_kappa, 4),
            'Points': len(m_df)
        })

    # Save report
    report_df = pd.DataFrame(monthly_stats)
    report_path = r"data\final_accuracy_report_2025.csv"
    report_df.to_csv(report_path, index=False)
    print(f"\n✅ Accuracy report saved to: {report_path}")

if __name__ == "__main__":
    calculate_metrics()
>>>>>>> 2f4a07f (Finalize methodologies, figures, datasets, and scripts for manuscript submission):scripts/calculate_kappa_gmm.py
