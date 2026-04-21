# Statistical Analysis for SAR Analysis GMM (Per-District)
# Using R for rigorous trend analysis and hypothesis testing
# ═══════════════════════════════════════════════════════════════════
# Install packages if needed:
install.packages(c("trend", "ggplot2", "reshape2", "Kendall"))

library(ggplot2)
library(trend)      # For Mann-Kendall test & Sen's slope
library(reshape2)

# ─── 1. DATA FROM GEE CSV EXPORTS ──────────────────────────────
# Monthly water area (km²) for Bangladesh, 2015–2025
# Source: GEE Sentinel-1 SAR analysis (GMM Method)

file_path <- "D:/Drubo_IWm/Drubo_all/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM/data/Final_Interpolated_Master_Dataset_GMM.csv"
df_master <- read.csv(file_path)

# Prepare national-level monthly columns
nat_df <- subset(df_master, Scope == "National")
wide_data <- reshape(nat_df[, c("Year", "Month", "Area_km2")], 
                    idvar = "Year", timevar = "Month", direction = "wide")
colnames(wide_data) <- c("Year", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
data <- wide_data


cat("═══════════════════════════════════════════════\n")
cat("STATISTICAL ANALYSIS — SAR Surface Water Paper\n")
cat("═══════════════════════════════════════════════\n\n")

# ─── 2. ANNUAL PEAK (JULY) TREND ANALYSIS ─────────────────────
cat("── 2. JULY PEAK WATER AREA — Trend Analysis ──\n\n")
july <- data$Jul

# Linear Regression
lm_model <- lm(july ~ data$Year)
summary_lm <- summary(lm_model)
cat("Linear Regression:\n")
cat(sprintf("  Slope: %+.2f km²/year\n", coef(lm_model)[2]))
cat(sprintf("  R²: %.4f\n", summary_lm$r.squared))
cat(sprintf("  p-value: %.4f\n", summary_lm$coefficients[2, 4]))
cat(sprintf("  Significant at α=0.05? %s\n\n",
    ifelse(summary_lm$coefficients[2, 4] < 0.05, "YES ✓", "NO")))

# Mann-Kendall Test (non-parametric trend test)
mk_result <- mk.test(july)
cat("Mann-Kendall Test:\n")
cat(sprintf("  Tau: %.4f\n", mk_result$estimates["tau"]))
cat(sprintf("  S statistic: %.0f\n", mk_result$estimates["S"]))
cat(sprintf("  p-value: %.4f\n", mk_result$p.value))
cat(sprintf("  Trend: %s\n",
    ifelse(mk_result$p.value < 0.05,
           ifelse(mk_result$estimates["tau"] > 0, "Significant INCREASING", "Significant DECREASING"),
           "No significant trend")))
cat("\n")

# Sen's Slope (robust trend estimator)
sen_result <- sens.slope(july)
cat("Sen's Slope Estimator:\n")
cat(sprintf("  Slope: %+.2f km²/year\n", sen_result$estimates))
cat(sprintf("  95%% CI: [%.2f, %.2f] km²/year\n",
    sen_result$conf.int[1], sen_result$conf.int[2]))
cat("\n")

# ─── 3. MONTHLY STATISTICS ─────────────────────────────────────
cat("── 3. Monthly Statistics (2015–2024 Mean) ──\n\n")
months <- c("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")
monthly_means <- colMeans(data[, months])
monthly_sd <- apply(data[, months], 2, sd)
monthly_min <- apply(data[, months], 2, min)
monthly_max <- apply(data[, months], 2, max)

stats_table <- data.frame(
  Month = months,
  Mean = round(monthly_means, 1),
  SD = round(monthly_sd, 1),
  Min = round(monthly_min, 1),
  Max = round(monthly_max, 1)
)
print(stats_table, row.names = FALSE)
cat("\n")

# ─── 4. SEASONAL ANALYSIS ───────────────────────────────────────
cat("── 4. Seasonal Analysis ──\n\n")
data$DryWinter <- rowMeans(data[, c("Dec", "Jan", "Feb")])
data$PreMonsoon <- rowMeans(data[, c("Mar", "Apr", "May")])
data$Monsoon <- rowMeans(data[, c("Jun", "Jul", "Aug", "Sep")])
data$PostMonsoon <- rowMeans(data[, c("Oct", "Nov")])

seasons <- c("DryWinter", "PreMonsoon", "Monsoon", "PostMonsoon")
for (s in seasons) {
  cat(sprintf("  %s: Mean=%.1f km², SD=%.1f km²\n", s,
      mean(data[[s]]), sd(data[[s]])))
}
cat(sprintf("\n  Seasonal expansion ratio (Monsoon/DryWinter): %.2fx\n\n",
    mean(data$Monsoon) / mean(data$DryWinter)))

# ─── 5. KRUSKAL-WALLIS TEST — Seasonal Differences ─────────────
cat("── 5. Kruskal-Wallis Test — Are seasons significantly different? ──\n\n")
seasonal_long <- data.frame(
  Area = c(data$DryWinter, data$PreMonsoon, data$Monsoon, data$PostMonsoon),
  Season = rep(c("DryWinter", "PreMonsoon", "Monsoon", "PostMonsoon"), each = 10)
)
kw_result <- kruskal.test(Area ~ Season, data = seasonal_long)
cat(sprintf("  Chi-squared: %.2f, df: %d, p-value: %.6f\n",
    kw_result$statistic, kw_result$parameter, kw_result$p.value))
cat(sprintf("  Interpretation: Seasons are %s different (α=0.05)\n\n",
    ifelse(kw_result$p.value < 0.05, "SIGNIFICANTLY", "NOT significantly")))

# ─── 6. INTER-ANNUAL VARIABILITY ────────────────────────────────
cat("── 6. Inter-annual Variability (CV%) ──\n\n")
for (m in months) {
  cv <- sd(data[[m]]) / mean(data[[m]]) * 100
  cat(sprintf("  %s: CV = %.1f%%\n", m, cv))
}
cat("\n")

# ─── 7. MANN-KENDALL FOR EACH MONTH ─────────────────────────────
cat("── 7. Monthly Trend Tests (Mann-Kendall) ──\n\n")
cat(sprintf("  %-6s  %8s  %8s  %s\n", "Month", "Tau", "p-value", "Trend"))
cat(paste(rep("-", 45), collapse = ""), "\n")
for (m in months) {
  mk <- mk.test(data[[m]])
  trend_label <- ifelse(mk$p.value < 0.05,
      ifelse(mk$estimates["tau"] > 0, "↑ Increasing*", "↓ Decreasing*"),
      "— No trend")
  cat(sprintf("  %-6s  %+8.3f  %8.4f  %s\n",
      m, mk$estimates["tau"], mk$p.value, trend_label))
}
cat("\n  * = significant at α=0.05\n")

# ─── 8. SAVE RESULTS ────────────────────────────────────────────
cat("\n═══════════════════════════════════════════════\n")
cat("Analysis complete! Results printed above.\n")
cat("═══════════════════════════════════════════════\n")
