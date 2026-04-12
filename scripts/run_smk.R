library(trend)

base_dir <- normalizePath(file.path(dirname(sys.frame(1)$ofile), ".."))
file_path <- file.path(base_dir, "data", "GEE_data", "computed_results", "national_monthly_water_area_2015_2025.csv")
df <- read.csv(file_path)

# Full monthly dataset
df_full <- df

# Filter July for annual peak trend analysis
df_july <- subset(df, month == 7)

# Sort chronologically
df_july <- df_july[order(df_july$year), ]

cat("Total months:", nrow(df_full), "\n")
cat("July observations:", nrow(df_july), "\n")

# Create time series for full monthly data (for seasonal MK)
df_full <- df_full[order(df_full$year, df_full$month), ]
ts_data <- ts(df_full$water_area_calibrated_km2, start = c(2015, 1), frequency = 12)

# Perform Seasonal Mann-Kendall Test on full monthly series
smk <- smk.test(ts_data)
cat("\n--- Seasonal Mann-Kendall Test (Full Monthly) ---\n")
print(smk)

# Sen's Slope on full monthly series
sen <- sens.slope(ts_data)
cat("\n--- Sen's Slope (Full Monthly) ---\n")
print(sen)
cat("Sen's Slope (Annualized):", sen$estimates * 12, "km2/year\n")

# Mann-Kendall on July peak series (n=11)
cat("\n--- Mann-Kendall Test (July Peak, n=11) ---\n")
july_vals <- df_july$water_area_calibrated_km2
mk_july <- mk.test(july_vals)
print(mk_july)

sen_july <- sens.slope(ts(july_vals, start = 2015, frequency = 1))
cat("\nSen's Slope (July):", sen_july$estimates, "km2/year\n")
