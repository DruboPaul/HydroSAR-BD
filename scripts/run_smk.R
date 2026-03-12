library(trend)

file_path <- "D:/Drubo_IWm/Drubo_all/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis Paper/data/GEE_data/Final_Interpolated_Master_Dataset_2015_2025.csv"
df <- read.csv(file_path)

# Filter National Data
df_nat <- subset(df, Scope == "National")

# Sort chronologically by year and month
df_nat <- df_nat[order(df_nat$Year, df_nat$Month), ]

cat("Total months:", nrow(df_nat), "\n")

# Create a time series object for the area (frequency = 12 months)
ts_data <- ts(df_nat$Area_km2, start = c(2015, 1), frequency = 12)

# Perform Seasonal Mann-Kendall Test
smk <- smk.test(ts_data)
cat("\n--- Seasonal Mann-Kendall Test ---\n")
print(smk)

# Perform Sen's Slope
sen <- sens.slope(ts_data)
cat("\n--- Sen's Slope ---\n")
print(sen)
cat("Sen's Slope (Annualized):", sen$estimates * 12, "km2/year\n")
