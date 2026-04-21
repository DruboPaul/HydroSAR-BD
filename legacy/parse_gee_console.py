import re
import pandas as pd
import os
import glob

def parse_console_file(filepath):
    """
    Parses a GEE console dump and returns a DataFrame.
    Format: Year | Month | Water Area (km²)
    Format: Division | Year | July Water Area (km²)
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    national_pattern = re.compile(r'(\d{4}) \| (\w+) \| ([\d\.]+) km²')
    division_pattern = re.compile(r'(\w+) \| (\d{4}) \| ([\d\.]+) km²')
    
    rows = []
    
    month_map = {
        'January': 1, 'February': 2, 'March': 3, 'April': 4,
        'May': 5, 'June': 6, 'July': 7, 'August': 8,
        'September': 9, 'October': 10, 'November': 11, 'December': 12
    }

    # Part 1: National
    for match in national_pattern.finditer(content):
        year = int(match.group(1))
        month_name = match.group(2)
        area = float(match.group(3))
        if area > 0:
            rows.append({
                'Year': year,
                'Month': month_map.get(month_name, 0),
                'Class': 'Bangladesh',
                'Area_km2': area
            })

    # Part 2: Divisions
    for match in division_pattern.finditer(content):
        div = match.group(1)
        year = int(match.group(2))
        area = float(match.group(3))
        if area > 0:
            # Standardize to "Name_Division" as expected by get_stats.py
            div_class = f"{div}_Division"
            rows.append({
                'Year': year,
                'Month': 7, # Part 2 is always July in the GEE script
                'Class': div_class,
                'Area_km2': area
            })
            
    return pd.DataFrame(rows)

def main():
    gee_data_dir = r"data\GEE_data"
    txt_files = glob.glob(os.path.join(gee_data_dir, "gee_console_*.txt"))
    
    if not txt_files:
        print("No console text files found in data/GEE_data/")
        return

    for f in txt_files:
        print(f"Parsing {os.path.basename(f)}...")
        df = parse_console_file(f)
        if not df.empty:
            # Check for duplicates (GEE evaluate calls sometimes overlap in out-of-order console prints)
            df = df.drop_duplicates(subset=['Year', 'Month', 'Class'])
            
            year_tag = os.path.basename(f).replace('gee_console_', '').replace('.txt', '')
            out_name = f"Master_Dataset_Part_{year_tag}.csv"
            out_path = os.path.join(gee_data_dir, out_name)
            df.to_csv(out_path, index=False)
            print(f"  Saved {len(df)} rows to {out_name}")
        else:
            print("  No valid data found in this file.")

if __name__ == "__main__":
    main()
