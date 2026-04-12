import ee

# Initialize the Earth Engine object, using the authentication credentials.
try:
    ee.Initialize(project='intense-agency-476210-g0')
    print("EE Initialized successfully")
except Exception as e:
    print(f"EE Init Error: {e}")

# 1. Load the threshold feature collection
thresholdsFeature = ee.FeatureCollection("projects/intense-agency-476210-g0/assets/GMM_Threshold_Lookup_Table")
print(f"Loaded Table Size: {thresholdsFeature.size().getInfo()}")

# Let's inspect what is actually inside the table!
first_feat = thresholdsFeature.first().getInfo()
print("First feature properties:")
print(first_feat['properties'])

# Let's do a sample manual extraction like the JS code
year = 2015
monthName = 'July'
districtName = "Rajshahi" # Try an exact district

print(f"\n--- TESTING DISTRICT: {districtName} in {monthName} ---")

# A. Month Table
monthTable = thresholdsFeature.filter(ee.Filter.eq("month", monthName))
print(f"Month Table Size: {monthTable.size().getInfo()}")

# B. National Average
natMeanDict = monthTable.reduceColumns(ee.Reducer.mean(), ["threshold"])
natMean = ee.Number(natMeanDict.get("mean")).getInfo()
print(f"National Mean calculated: {natMean}")

# C. District Specific
distTable = monthTable.filter(ee.Filter.eq("district_name", districtName))
distSize = distTable.size().getInfo()
print(f"District Table Size: {distSize}")

if distSize > 0:
    distVal = distTable.first().get("threshold").getInfo()
    print(f"District Threshold extracted: {distVal}")
else:
    print("NO DISTRICT MATCH FOUND. Why?")
    
    # Print all unique district names in the FeatureCollection to see what they look like
    all_districts = thresholdsFeature.aggregate_array('district_name').distinct().getInfo()
    print("\nActual District Names in Asset:")
    print(all_districts[:10]) # Print first 10
