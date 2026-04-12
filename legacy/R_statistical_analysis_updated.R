# ======================================================================
# HydroSAR GMM Paper -- R Statistical Analysis & Figures
# ======================================================================
# Reads from: data/GEE_data/computed_results/
# Outputs: Figures + Console statistics for manuscript
#
# Run: Rscript scripts/R_statistical_analysis_updated.R
# ======================================================================

# --- Install if needed (uncomment first time) ---
# install.packages(c("trend", "ggplot2", "reshape2", "scales", "viridis"))

library(ggplot2)
library(trend)        # Mann-Kendall + Sen's slope
library(reshape2)
library(scales)

# --- PATHS ---
# Get script directory (works with Rscript)
args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args[grep("--file=", args)])
if (length(script_path) > 0) {
  base_dir <- normalizePath(file.path(dirname(script_path), ".."))
} else {
  # Fallback for interactive R
  base_dir <- normalizePath("c:/Users/Drubo/Documents/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM")
}
results_dir <- file.path(base_dir, "data", "GEE_data", "computed_results")
figures_dir <- file.path(base_dir, "figures")
dir.create(figures_dir, showWarnings = FALSE)

# --- LOAD DATA ---
cat("Loading computed data...\n")
national_df <- read.csv(file.path(results_dir, "national_monthly_water_area_2015_2025.csv"))
division_july_df <- read.csv(file.path(results_dir, "division_july_water_area_2015_2025.csv"))
district_df <- read.csv(file.path(results_dir, "district_monthly_water_area_2015_2025.csv"))
seasonal_df <- read.csv(file.path(results_dir, "table5_seasonal_water_area.csv"))

cat(sprintf("  National rows: %d\n", nrow(national_df)))
cat(sprintf("  District rows: %d\n", nrow(district_df)))

# --- Build wide-format national data ---
wide_data <- reshape(national_df[, c("year", "month", "water_area_calibrated_km2")],
                     idvar = "year", timevar = "month", direction = "wide")
colnames(wide_data) <- c("Year", "Jan","Feb","Mar","Apr","May","Jun",
                          "Jul","Aug","Sep","Oct","Nov","Dec")
data <- wide_data
months <- c("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")


# ======================================================================
# 1. JULY PEAK TREND ANALYSIS (National)
# ======================================================================
cat("\n", paste(rep("=", 55), collapse=""), "\n")
cat("  1. JULY PEAK WATER AREA -- Trend Analysis\n")
cat(paste(rep("=", 55), collapse=""), "\n\n")

july <- data$Jul

# Linear Regression
lm_model <- lm(july ~ data$Year)
summary_lm <- summary(lm_model)
cat("Linear Regression:\n")
cat(sprintf("  Slope: %+.2f km2/year\n", coef(lm_model)[2]))
cat(sprintf("  R2: %.4f\n", summary_lm$r.squared))
cat(sprintf("  p-value: %.4f\n", summary_lm$coefficients[2, 4]))
cat(sprintf("  Significant? %s\n\n",
    ifelse(summary_lm$coefficients[2, 4] < 0.05, "YES", "NO")))

# Mann-Kendall Test
mk_result <- mk.test(july)
cat("Mann-Kendall Test:\n")
cat(sprintf("  Tau: %.4f\n", mk_result$estimates["tau"]))
cat(sprintf("  S statistic: %.0f\n", mk_result$estimates["S"]))
cat(sprintf("  p-value: %.4f\n", mk_result$p.value))
cat(sprintf("  Trend: %s\n\n",
    ifelse(mk_result$p.value < 0.05,
           ifelse(mk_result$estimates["tau"] > 0, "INCREASING*", "DECREASING*"),
           "No significant trend")))

# Sen's Slope
sen_result <- sens.slope(july)
cat("Sen's Slope Estimator:\n")
cat(sprintf("  Slope: %+.2f km2/year\n", sen_result$estimates))
cat(sprintf("  95%% CI: [%.2f, %.2f] km2/year\n",
    sen_result$conf.int[1], sen_result$conf.int[2]))


# ======================================================================
# 2. MONTHLY STATISTICS
# ======================================================================
cat("\n", paste(rep("=", 55), collapse=""), "\n")
cat("  2. Monthly Statistics (2015-2025)\n")
cat(paste(rep("=", 55), collapse=""), "\n\n")

monthly_means <- colMeans(data[, months])
monthly_sd <- apply(data[, months], 2, sd)
monthly_min <- apply(data[, months], 2, min)
monthly_max <- apply(data[, months], 2, max)
monthly_cv <- monthly_sd / monthly_means * 100

stats_table <- data.frame(
  Month = months,
  Mean = round(monthly_means, 1),
  SD = round(monthly_sd, 1),
  Min = round(monthly_min, 1),
  Max = round(monthly_max, 1),
  CV_pct = round(monthly_cv, 1)
)
print(stats_table, row.names = FALSE)


# ======================================================================
# 3. SEASONAL ANALYSIS + KRUSKAL-WALLIS
# ======================================================================
cat("\n", paste(rep("=", 55), collapse=""), "\n")
cat("  3. Seasonal Analysis\n")
cat(paste(rep("=", 55), collapse=""), "\n\n")

data$DryWinter <- rowMeans(data[, c("Dec", "Jan", "Feb")])
data$PreMonsoon <- rowMeans(data[, c("Mar", "Apr", "May")])
data$Monsoon <- rowMeans(data[, c("Jun", "Jul", "Aug", "Sep")])
data$PostMonsoon <- rowMeans(data[, c("Oct", "Nov")])

seasons <- c("DryWinter", "PreMonsoon", "Monsoon", "PostMonsoon")
for (s in seasons) {
  cat(sprintf("  %s: Mean=%.1f km2, SD=%.1f km2\n",
      s, mean(data[[s]]), sd(data[[s]])))
}
cat(sprintf("\n  Expansion ratio (Monsoon/DryWinter): %.2fx\n",
    mean(data$Monsoon) / mean(data$DryWinter)))

# Kruskal-Wallis
seasonal_long <- data.frame(
  Area = c(data$DryWinter, data$PreMonsoon, data$Monsoon, data$PostMonsoon),
  Season = rep(c("DryWinter", "PreMonsoon", "Monsoon", "PostMonsoon"), each = nrow(data))
)
kw_result <- kruskal.test(Area ~ Season, data = seasonal_long)
cat(sprintf("\n  Kruskal-Wallis: chi2=%.2f, df=%d, p=%.6f\n",
    kw_result$statistic, kw_result$parameter, kw_result$p.value))
cat(sprintf("  Seasons are %s different (alpha=0.05)\n",
    ifelse(kw_result$p.value < 0.05, "SIGNIFICANTLY", "NOT significantly")))


# ======================================================================
# 4. INTER-ANNUAL VARIABILITY (CV%)
# ======================================================================
cat("\n", paste(rep("=", 55), collapse=""), "\n")
cat("  4. Inter-annual Variability (CV%%)\n")
cat(paste(rep("=", 55), collapse=""), "\n\n")

for (m in months) {
  cv <- sd(data[[m]]) / mean(data[[m]]) * 100
  cat(sprintf("  %s: CV = %.1f%%\n", m, cv))
}


# ======================================================================
# 5. MONTHLY MANN-KENDALL TESTS
# ======================================================================
cat("\n", paste(rep("=", 55), collapse=""), "\n")
cat("  5. Monthly Trend Tests (Mann-Kendall)\n")
cat(paste(rep("=", 55), collapse=""), "\n\n")

cat(sprintf("  %-6s  %8s  %8s  %s\n", "Month", "Tau", "p-value", "Trend"))
cat(paste(rep("-", 50), collapse = ""), "\n")
for (m in months) {
  mk <- mk.test(data[[m]])
  trend_label <- ifelse(mk$p.value < 0.05,
      ifelse(mk$estimates["tau"] > 0, "INCREASING*", "DECREASING*"),
      "-- No trend")
  cat(sprintf("  %-6s  %+8.3f  %8.4f  %s\n",
      m, mk$estimates["tau"], mk$p.value, trend_label))
}
cat("  * = significant at alpha=0.05\n")


# ======================================================================
# 6. DIVISION-LEVEL TREND ANALYSIS (July)
# ======================================================================
cat("\n", paste(rep("=", 55), collapse=""), "\n")
cat("  6. Division-Level July Trend (Mann-Kendall + Sen)\n")
cat(paste(rep("=", 55), collapse=""), "\n\n")

divisions <- unique(division_july_df$division)
for (div in sort(divisions)) {
  sub <- division_july_df[division_july_df$division == div, ]
  sub <- sub[order(sub$year), ]
  ts_data <- sub$water_area_km2

  if (length(ts_data) >= 3) {
    mk <- mk.test(ts_data)
    sen <- sens.slope(ts_data)
    lm_div <- lm(ts_data ~ sub$year)
    s_lm <- summary(lm_div)

    cat(sprintf("  %s:\n", div))
    cat(sprintf("    LR Slope: %+.1f km2/yr, R2=%.3f, p=%.3f\n",
        coef(lm_div)[2], s_lm$r.squared, s_lm$coefficients[2,4]))
    cat(sprintf("    MK Tau=%.3f, p=%.3f | Sen Slope=%+.1f [%.1f, %.1f]\n\n",
        mk$estimates["tau"], mk$p.value,
        sen$estimates, sen$conf.int[1], sen$conf.int[2]))
  }
}


# ======================================================================
# FIGURE: Regional Trend Plots (ggplot2)
# ======================================================================
cat("\n", paste(rep("=", 55), collapse=""), "\n")
cat("  7. Generating R Figures...\n")
cat(paste(rep("=", 55), collapse=""), "\n\n")

# Regional trend plots per division
regional_dir <- file.path(figures_dir, "regional_trends")
dir.create(regional_dir, showWarnings = FALSE)

for (div in sort(divisions)) {
  sub <- division_july_df[division_july_df$division == div, ]
  sub <- sub[order(sub$year), ]

  p <- ggplot(sub, aes(x = year, y = water_area_km2)) +
    geom_line(color = "#1f77b4", linewidth = 0.8, alpha = 0.5) +
    geom_point(color = "#1f77b4", size = 3) +
    geom_smooth(method = "lm", se = TRUE, color = "#d62728",
                linetype = "dashed", linewidth = 1.2, alpha = 0.2) +
    scale_x_continuous(breaks = seq(2015, 2025, 1)) +
    scale_y_continuous(labels = comma) +
    labs(title = paste0(div, " Division - July Water Area Trend (2015-2025)"),
         x = "Year", y = "Water Area (km2)") +
    theme_minimal(base_size = 12) +
    theme(plot.title = element_text(face = "bold", size = 13),
          panel.grid.minor = element_blank())

  # Add MK result annotation
  mk <- mk.test(sub$water_area_km2)
  sen <- sens.slope(sub$water_area_km2)
  annotation <- sprintf("MK tau=%.3f, p=%.3f\nSen slope=%+.1f km2/yr",
                         mk$estimates["tau"], mk$p.value, sen$estimates)
  p <- p + annotate("text", x = 2021, y = max(sub$water_area_km2) * 0.95,
                    label = annotation, hjust = 0.5, size = 3.5,
                    fontface = "italic", color = "#666")

  fname <- paste0("Plot_", gsub(" ", "_", div), ".png")
  ggsave(file.path(regional_dir, fname), p, width = 9, height = 5, dpi = 300)
  cat(sprintf("  Saved: regional_trends/%s\n", fname))
}

cat("\n", paste(rep("=", 55), collapse=""), "\n")
cat("  R Analysis Complete!\n")
cat(paste(rep("=", 55), collapse=""), "\n")
