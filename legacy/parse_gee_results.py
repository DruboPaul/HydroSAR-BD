import re

content = """
Barisal | 2016 | 3305.6 km²
Barisal | 2020 | 2602.4 km²
S1 Scenes 2016: 357
2023 | February | 0.0 km² (No Data)
2024 | June | 0.0 km² (No Data)
Chittagong | 2015 | 0.0 km² (No Data)
Barisal | 2016 | 3305.6 km²
Rangpur | 2016 | 4649.4 km²
Dhaka | 2019 | 7484.3 km²
2015 | March | 0.0 km² (No Data)
2021 | May | 0.0 km² (No Data)
Rangpur | 2022 | 1722.8 km²
Chittagong | 2019 | 3909.1 km²
2016 | November | 0.0 km² (No Data)
2015 | June | 0.0 km² (No Data)
Sylhet | 2015 | 4206.5 km²
Sylhet | 2023 | 5426.4 km²
Sylhet | 2024 | 6634.2 km²
2018 | February | 0.0 km² (No Data)
Dhaka | 2016 | 8264.9 km²
2018 | September | 0.0 km² (No Data)
2015 | January | 0.0 km² (No Data)
Rajshahi | 2016 | 6139.1 km²
2015 | August | 0.0 km² (No Data)
2015 | August | 0.0 km² (No Data)
Chittagong | 2016 | 3993.3 km²
Dhaka | 2016 | 8264.9 km²
2020 | March | 0.0 km² (No Data)
2019 | March | 0.0 km² (No Data)
2021 | October | 0.0 km² (No Data)
2016 | July | 0.0 km² (No Data)
2016 | July | 0.0 km² (No Data)
2019 | June | 0.0 km² (No Data)
2018 | August | 0.0 km² (No Data)
2022 | July | 0.0 km² (No Data)
2023 | December | 0.0 km² (No Data)
2015 | October | 0.0 km² (No Data)
2020 | January | 0.0 km² (No Data)
Rangpur | 2019 | 4273.9 km²
2015 | May | 0.0 km² (No Data)
Dhaka | 2020 | 9439.8 km²
2016 | February | 0.0 km² (No Data)
2015 | November | 0.0 km² (No Data)
2016 | January | 0.0 km² (No Data)
2017 | November | 0.0 km² (No Data)
2016 | December | 0.0 km² (No Data)
2015 | September | 0.0 km² (No Data)
2018 | January | 0.0 km² (No Data)
2022 | May | 0.0 km² (No Data)
2016 | October | 0.0 km² (No Data)
2016 | October | 0.0 km² (No Data)
Sylhet | 2016 | 5679.8 km²
2017 | July | 0.0 km² (No Data)
Sylhet | 2016 | 5679.8 km²
Sylhet | 2022 | 6375.8 km²
Rangpur | 2024 | 3229.3 km²
Sylhet | 2017 | 5583.0 km²
2015 | May | 0.0 km² (No Data)
Rangpur | 2018 | 2064.2 km²
Barisal | 2019 | 3039.7 km²
Khulna | 2016 | 4194.7 km²
"""

national_pattern = re.compile(r'(\d{4}) \| (\w+) \| ([\d\.]+|0\.0) km²')
division_pattern = re.compile(r'(\w+) \| (\d{4}) \| ([\d\.]+|0\.0) km²')

nat_data = {}
div_data = {}

for line in content.strip().split('\n'):
    line = line.strip()
    nm = national_pattern.search(line)
    if nm:
        year = nm.group(1)
        month = nm.group(2)
        val = float(nm.group(3))
        if val > 0:
            nat_data[f"{year}_{month}"] = val
        continue
    dm = division_pattern.search(line)
    if dm:
        div = dm.group(1)
        year = dm.group(2)
        val = float(dm.group(3))
        if val > 0:
            div_data[f"{div}_{year}"] = val

print("--- SUMMARY OF SUCCESSFUL DATA ---")
print(f"National Months with Data: {len(nat_data)}")
for k, v in sorted(nat_data.items()):
    print(f"  {k.replace('_', ' ')}: {v} km2")

print(f"\nDivision Data Points: {len(div_data)}")
for k, v in sorted(div_data.items()):
    print(f"  {k.replace('_', ' ')}: {v} km2")

print("\n--- ISSUES IDENTIFIED ---")
if len(nat_data) == 0:
    print("WARNING: All National data in this snippet is 0.0. This is likely due to Server Timeout.")
    print("Recommendation: Run only ONE year at a time by setting var years = [2016];")
