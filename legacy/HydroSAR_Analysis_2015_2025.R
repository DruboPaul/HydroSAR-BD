<<<<<<< HEAD:legacy/HydroSAR_Analysis_2015_2025.R
# ═══════════════════════════════════════════════════════════════════
# HydroSAR Bangladesh — Complete Statistical Analysis (2015-2025)
# Publication-Quality Figures & Trend Analysis
# ═══════════════════════════════════════════════════════════════════

# --- 0. Package Installation and Loading ---
required_pkgs <- c("ggplot2", "dplyr", "tidyr", "trend", "RColorBrewer", "scales", "viridis")
for (pkg in required_pkgs) {
  if (!require(pkg, character.only = TRUE)) install.packages(pkg)
  library(pkg, character.only = TRUE)
}

# --- 1. Data Loading ---
# Resolve project root from script location
args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args[grep("--file=", args)])
if (length(script_path) > 0) {
  base_dir <- normalizePath(file.path(dirname(script_path), ".."))
} else {
  base_dir <- normalizePath(getwd())
  message("Note: Could not determine script path, using working directory: ", base_dir)
}
file_path <- file.path(base_dir, "data", "GEE_data", "computed_results", "district_monthly_water_area_2015_2025.csv")
if (!file.exists(file_path)) stop("Master CSV not found: ", file_path)

df <- read.csv(file_path)
df$Year  <- as.integer(df$Year)
df$Month <- as.integer(df$Month)

# Add month names
month_names <- c("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")
df$MonthName <- factor(month_names[df$Month], levels = month_names)

# Determine region type
df$RegionType <- case_when(
  df$Scope == "National" ~ "National",
  grepl("_Division", df$Class) ~ "Division",
  grepl("_District", df$Class) ~ "District",
  TRUE ~ "Unknown"
)

# Clean labels for plotting
df$ClassLabel <- gsub("_Division|_District", "", df$Class)

# Remove duplicate rows (Division names might exist in District files)
df <- df %>% distinct(Year, Month, Class, .keep_all = TRUE)

cat("Data loaded:", nrow(df), "rows,", length(unique(df$Class)), "regions\n\n")

# Output folder
fig_dir <- "../figures/"
if (!dir.exists(fig_dir)) dir.create(fig_dir, recursive = TRUE)

# ═══════════════════════════════════════════════════════════════════
# 2. NATIONAL STATISTICS
# ═══════════════════════════════════════════════════════════════════
nat <- df %>% filter(Scope == "National")

cat("═══════════════════════════════════════════════\n")
cat("STATISTICAL ANALYSIS — SAR Surface Water Paper\n")
cat("Study Period: 2015-2025 (11 Years)\n")
cat("═══════════════════════════════════════════════\n\n")

# --- Monthly mean statistics ---
cat("── Monthly Statistics (2015-2025 Mean) ──\n\n")
monthly_stats <- nat %>%
  group_by(MonthName) %>%
  summarize(
    Mean = round(mean(Area_km2), 1),
    SD   = round(sd(Area_km2), 1),
    Min  = round(min(Area_km2), 1),
    Max  = round(max(Area_km2), 1),
    .groups = "drop"
  )
print(as.data.frame(monthly_stats), row.names = FALSE)

# --- Maximum and Minimum ---
peak <- nat[which.max(nat$Area_km2), ]
low  <- nat[which.min(nat$Area_km2), ]
cat(sprintf("\nPeak Water: %.0f km² (%s %d)\n", peak$Area_km2, month_names[peak$Month], peak$Year))
cat(sprintf("Lowest Water: %.0f km² (%s %d)\n\n", low$Area_km2, month_names[low$Month], low$Year))

# ═══════════════════════════════════════════════════════════════════
# 3. TREND ANALYSIS
# ═══════════════════════════════════════════════════════════════════
cat("── Trend Analysis (July Peak) ──\n\n")
july <- nat %>% filter(Month == 7) %>% arrange(Year) %>% pull(Area_km2)

# Mann-Kendall Test
mk_result <- mk.test(july)
cat(sprintf("Mann-Kendall Tau: %.4f\n", mk_result$estimates["tau"]))
cat(sprintf("p-value: %.4f\n", mk_result$p.value))
cat(sprintf("Trend: %s\n\n",
    ifelse(mk_result$p.value < 0.05,
           ifelse(mk_result$estimates["tau"] > 0, "Significant INCREASING", "Significant DECREASING"),
           "No significant trend")))

# Sen's Slope
sen_result <- sens.slope(july)
cat(sprintf("Sen's Slope: %+.2f km²/year\n", sen_result$estimates))
cat(sprintf("95%% CI: [%.2f, %.2f]\n\n", sen_result$conf.int[1], sen_result$conf.int[2]))

# Monthly trend analysis
cat("── Monthly Trend Tests (Mann-Kendall) ──\n\n")
cat(sprintf("  %-6s  %8s  %8s  %s\n", "Month", "Tau", "p-value", "Trend"))
cat(paste(rep("-", 50), collapse = ""), "\n")
for (m in 1:12) {
  ts_data <- nat %>% filter(Month == m) %>% arrange(Year) %>% pull(Area_km2)
  mk <- mk.test(ts_data)
  trend_label <- ifelse(mk$p.value < 0.05,
      ifelse(mk$estimates["tau"] > 0, "UP Increasing*", "DOWN Decreasing*"),
      "-- No trend")
  cat(sprintf("  %-6s  %+8.3f  %8.4f  %s\n",
      month_names[m], mk$estimates["tau"], mk$p.value, trend_label))
}
cat("\n  * = significant at alpha=0.05\n\n")

# --- Seasonal analysis ---
cat("── Seasonal Analysis ──\n\n")
seasonal <- nat %>%
  mutate(Season = case_when(
    Month %in% c(12,1,2) ~ "Dry/Winter",
    Month %in% c(3,4,5)  ~ "Pre-Monsoon",
    Month %in% c(6,7,8,9) ~ "Monsoon",
    Month %in% c(10,11)  ~ "Post-Monsoon"
  )) %>%
  group_by(Season) %>%
  summarize(Mean = round(mean(Area_km2),1), SD = round(sd(Area_km2),1), .groups="drop")
print(as.data.frame(seasonal), row.names = FALSE)

monsoon_mean <- seasonal$Mean[seasonal$Season == "Monsoon"]
dry_mean     <- seasonal$Mean[seasonal$Season == "Dry/Winter"]
cat(sprintf("\nSeasonal Expansion Ratio (Monsoon/Dry): %.2fx\n\n", monsoon_mean / dry_mean))

# ═══════════════════════════════════════════════════════════════════
# 4. PUBLICATION-QUALITY FIGURES
# ═══════════════════════════════════════════════════════════════════

# --- Fig 4: National Monthly Seasonality (Ribbon Plot) ---
ribbon_data <- nat %>%
  group_by(MonthName) %>%
  summarize(mean_area = mean(Area_km2), sd_area = sd(Area_km2), .groups = "drop")

p_ribbon <- ggplot(ribbon_data, aes(x = MonthName, y = mean_area, group = 1)) +
  geom_ribbon(aes(ymin = mean_area - sd_area, ymax = mean_area + sd_area),
              fill = "#2196F3", alpha = 0.25) +
  geom_line(color = "#1565C0", linewidth = 1.2) +
  geom_point(color = "#1565C0", size = 3) +
  scale_y_continuous(labels = scales::comma) +
  labs(title = "Seasonal Cycle of Surface Water in Bangladesh (2015-2025)",
       subtitle = "Shaded area = inter-annual standard deviation",
       x = "Month", y = expression("Mean Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1),
        plot.title = element_text(face = "bold"))

ggsave(paste0(fig_dir, "fig4_seasonal_ribbon.png"), p_ribbon, width = 10, height = 6, dpi = 300)
cat("Saved: fig4_seasonal_ribbon.png\n")

# --- Fig 5: July Peak Water Area Trend (2015-2025) ---
july_df <- nat %>% filter(Month == 7)

p_july <- ggplot(july_df, aes(x = Year, y = Area_km2)) +
  geom_bar(stat = "identity", fill = "#42A5F5", alpha = 0.7, width = 0.7) +
  geom_smooth(method = "lm", se = TRUE, color = "#D32F2F", linewidth = 1, linetype = "dashed") +
  scale_y_continuous(labels = scales::comma, limits = c(0, NA)) +
  scale_x_continuous(breaks = 2015:2025) +
  labs(title = "Annual Peak Monsoon (July) Surface Water Extent",
       subtitle = sprintf("Sen's Slope: %+.1f km²/year | Mann-Kendall p = %.3f",
                          sen_result$estimates, mk_result$p.value),
       x = "Year", y = expression("Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(plot.title = element_text(face = "bold"),
        axis.text.x = element_text(angle = 45, hjust = 1))

ggsave(paste0(fig_dir, "fig5_july_peak_trend.png"), p_july, width = 10, height = 6, dpi = 300)
cat("Saved: fig5_july_peak_trend.png\n")

# --- Fig 6: Division-wise July Heatmap ---
div_july <- df %>%
  filter(RegionType == "Division" & Month == 7)

p_heatmap <- ggplot(div_july, aes(x = as.factor(Year), y = ClassLabel, fill = Area_km2)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_viridis(option = "mako", direction = -1, name = expression("Area (km"^2*")"),
                     labels = scales::comma) +
  labs(title = "Divisional Peak Monsoon Water Extent (July)",
       subtitle = "2015-2025 Comparison",
       x = "Year", y = "Division") +
  theme_minimal(base_size = 14) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1),
        plot.title = element_text(face = "bold"))

ggsave(paste0(fig_dir, "fig6_divisional_heatmap.png"), p_heatmap, width = 12, height = 6, dpi = 300)
cat("Saved: fig6_divisional_heatmap.png\n")

# --- Fig 7: Annual Mean Water Area (All Months) ---
annual_mean <- nat %>%
  group_by(Year) %>%
  summarize(AnnualMean = mean(Area_km2), .groups = "drop")

p_annual <- ggplot(annual_mean, aes(x = Year, y = AnnualMean)) +
  geom_line(color = "#1565C0", linewidth = 1.2) +
  geom_point(color = "#1565C0", size = 3.5) +
  geom_smooth(method = "lm", se = TRUE, color = "#D32F2F", linetype = "dashed", alpha = 0.15) +
  scale_y_continuous(labels = scales::comma) +
  scale_x_continuous(breaks = 2015:2025) +
  labs(title = "Annual Mean Surface Water Area in Bangladesh",
       subtitle = "Average across all 12 months per year",
       x = "Year", y = expression("Mean Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(plot.title = element_text(face = "bold"),
        axis.text.x = element_text(angle = 45, hjust = 1))

ggsave(paste0(fig_dir, "fig7_annual_mean_trend.png"), p_annual, width = 10, height = 6, dpi = 300)
cat("Saved: fig7_annual_mean_trend.png\n")

# --- Fig 8: Monthly Boxplot Distribution ---
p_box <- ggplot(nat, aes(x = MonthName, y = Area_km2, fill = MonthName)) +
  geom_boxplot(alpha = 0.7, outlier.shape = 21) +
  scale_fill_viridis_d(option = "turbo") +
  scale_y_continuous(labels = scales::comma) +
  labs(title = "Monthly Water Area Distribution (2015-2025)",
       subtitle = "Boxplots showing inter-annual variability per month",
       x = "Month", y = expression("Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(legend.position = "none",
        axis.text.x = element_text(angle = 45, hjust = 1),
        plot.title = element_text(face = "bold"))

ggsave(paste0(fig_dir, "fig8_monthly_boxplot.png"), p_box, width = 10, height = 6, dpi = 300)
cat("Saved: fig8_monthly_boxplot.png\n")

# --- Fig 9: Top 10 Most Flood-Prone Districts ---
top10 <- df %>%
  filter(RegionType == "District" & Month == 7) %>%
  group_by(Class, ClassLabel) %>%
  summarize(MeanJuly = mean(Area_km2), .groups = "drop") %>%
  arrange(desc(MeanJuly)) %>%
  head(10)

p_top10 <- ggplot(top10, aes(x = reorder(ClassLabel, MeanJuly), y = MeanJuly, fill = MeanJuly)) +
  geom_col(width = 0.7) +
  coord_flip() +
  scale_fill_viridis(option = "plasma", direction = -1, name = expression("km"^2)) +
  scale_y_continuous(labels = scales::comma) +
  labs(title = "Top 10 Most Flood-Prone Districts (July Average)",
       subtitle = "Based on 11-year mean peak monsoon water extent",
       x = "", y = expression("Mean July Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(plot.title = element_text(face = "bold"))

ggsave(paste0(fig_dir, "fig9_top10_districts.png"), p_top10, width = 10, height = 6, dpi = 300)
cat("Saved: fig9_top10_districts.png\n")

# ═══════════════════════════════════════════════════════════════════
cat("\n═══════════════════════════════════════════════\n")
cat("All analyses complete! 6 figures saved to figures/\n")
cat("═══════════════════════════════════════════════\n")
=======
# ═══════════════════════════════════════════════════════════════════
# HydroSAR Bangladesh — Complete Statistical Analysis (2015-2025)
# Publication-Quality Figures & Trend Analysis
# ═══════════════════════════════════════════════════════════════════

# --- 0. প্যাকেজ ইনস্টল ও লোড ---
required_pkgs <- c("ggplot2", "dplyr", "tidyr", "trend", "RColorBrewer", "scales", "viridis")
for (pkg in required_pkgs) {
  if (!require(pkg, character.only = TRUE)) install.packages(pkg)
  library(pkg, character.only = TRUE)
}

# --- 1. ডেটা লোড ---
file_path <- "D:/Drubo_IWm/Drubo_all/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM/data/Final_Interpolated_Master_Dataset_GMM.csv"
if (!file.exists(file_path)) stop("Master CSV not found! Check the path.")

df <- read.csv(file_path)
df$Year  <- as.integer(df$Year)
df$Month <- as.integer(df$Month)

# মাসের নাম যোগ করা
month_names <- c("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")
df$MonthName <- factor(month_names[df$Month], levels = month_names)

# রিজিয়ন টাইপ নির্ধারণ করা
df$RegionType <- case_when(
  df$Scope == "National" ~ "National",
  grepl("_Division", df$Class) ~ "Division",
  grepl("_District", df$Class) ~ "District",
  TRUE ~ "Unknown"
)

# Clean labels for plotting
df$ClassLabel <- gsub("_Division|_District", "", df$Class)

# ডুপ্লিকেট রো বাদ দেওয়া (Division নাম District ফাইলেও থাকতে পারে)
df <- df %>% distinct(Year, Month, Class, .keep_all = TRUE)

cat("Data loaded:", nrow(df), "rows,", length(unique(df$Class)), "regions\n\n")

# আউটপুট ফোল্ডার
fig_dir <- "../figures/"
if (!dir.exists(fig_dir)) dir.create(fig_dir, recursive = TRUE)

# ═══════════════════════════════════════════════════════════════════
# 2. জাতীয় পর্যায়ের পরিসংখ্যান (NATIONAL STATISTICS)
# ═══════════════════════════════════════════════════════════════════
nat <- df %>% filter(Scope == "National")

cat("═══════════════════════════════════════════════\n")
cat("STATISTICAL ANALYSIS — SAR Surface Water Paper\n")
cat("Study Period: 2015-2025 (11 Years)\n")
cat("═══════════════════════════════════════════════\n\n")

# --- মাসিক গড় পরিসংখ্যান ---
cat("── Monthly Statistics (2015-2025 Mean) ──\n\n")
monthly_stats <- nat %>%
  group_by(MonthName) %>%
  summarize(
    Mean = round(mean(Area_km2), 1),
    SD   = round(sd(Area_km2), 1),
    Min  = round(min(Area_km2), 1),
    Max  = round(max(Area_km2), 1),
    .groups = "drop"
  )
print(as.data.frame(monthly_stats), row.names = FALSE)

# --- সর্বোচ্চ ও সর্বনিম্ন ---
peak <- nat[which.max(nat$Area_km2), ]
low  <- nat[which.min(nat$Area_km2), ]
cat(sprintf("\nPeak Water: %.0f km² (%s %d)\n", peak$Area_km2, month_names[peak$Month], peak$Year))
cat(sprintf("Lowest Water: %.0f km² (%s %d)\n\n", low$Area_km2, month_names[low$Month], low$Year))

# ═══════════════════════════════════════════════════════════════════
# 3. ট্রেন্ড অ্যানালাইসিস (TREND ANALYSIS)
# ═══════════════════════════════════════════════════════════════════
cat("── Trend Analysis (July Peak) ──\n\n")
july <- nat %>% filter(Month == 7) %>% arrange(Year) %>% pull(Area_km2)

# Mann-Kendall Test
mk_result <- mk.test(july)
cat(sprintf("Mann-Kendall Tau: %.4f\n", mk_result$estimates["tau"]))
cat(sprintf("p-value: %.4f\n", mk_result$p.value))
cat(sprintf("Trend: %s\n\n",
    ifelse(mk_result$p.value < 0.05,
           ifelse(mk_result$estimates["tau"] > 0, "Significant INCREASING", "Significant DECREASING"),
           "No significant trend")))

# Sen's Slope
sen_result <- sens.slope(july)
cat(sprintf("Sen's Slope: %+.2f km²/year\n", sen_result$estimates))
cat(sprintf("95%% CI: [%.2f, %.2f]\n\n", sen_result$conf.int[1], sen_result$conf.int[2]))

# প্রতিটি মাসের ট্রেন্ড
cat("── Monthly Trend Tests (Mann-Kendall) ──\n\n")
cat(sprintf("  %-6s  %8s  %8s  %s\n", "Month", "Tau", "p-value", "Trend"))
cat(paste(rep("-", 50), collapse = ""), "\n")
for (m in 1:12) {
  ts_data <- nat %>% filter(Month == m) %>% arrange(Year) %>% pull(Area_km2)
  mk <- mk.test(ts_data)
  trend_label <- ifelse(mk$p.value < 0.05,
      ifelse(mk$estimates["tau"] > 0, "UP Increasing*", "DOWN Decreasing*"),
      "-- No trend")
  cat(sprintf("  %-6s  %+8.3f  %8.4f  %s\n",
      month_names[m], mk$estimates["tau"], mk$p.value, trend_label))
}
cat("\n  * = significant at alpha=0.05\n\n")

# --- ঋতু বিশ্লেষণ ---
cat("── Seasonal Analysis ──\n\n")
seasonal <- nat %>%
  mutate(Season = case_when(
    Month %in% c(12,1,2) ~ "Dry/Winter",
    Month %in% c(3,4,5)  ~ "Pre-Monsoon",
    Month %in% c(6,7,8,9) ~ "Monsoon",
    Month %in% c(10,11)  ~ "Post-Monsoon"
  )) %>%
  group_by(Season) %>%
  summarize(Mean = round(mean(Area_km2),1), SD = round(sd(Area_km2),1), .groups="drop")
print(as.data.frame(seasonal), row.names = FALSE)

monsoon_mean <- seasonal$Mean[seasonal$Season == "Monsoon"]
dry_mean     <- seasonal$Mean[seasonal$Season == "Dry/Winter"]
cat(sprintf("\nSeasonal Expansion Ratio (Monsoon/Dry): %.2fx\n\n", monsoon_mean / dry_mean))

# ═══════════════════════════════════════════════════════════════════
# 4. ফিগার জেনারেশন (PUBLICATION-QUALITY FIGURES)
# ═══════════════════════════════════════════════════════════════════

# --- Fig 4: National Monthly Seasonality (Ribbon Plot) ---
ribbon_data <- nat %>%
  group_by(MonthName) %>%
  summarize(mean_area = mean(Area_km2), sd_area = sd(Area_km2), .groups = "drop")

p_ribbon <- ggplot(ribbon_data, aes(x = MonthName, y = mean_area, group = 1)) +
  geom_ribbon(aes(ymin = mean_area - sd_area, ymax = mean_area + sd_area),
              fill = "#2196F3", alpha = 0.25) +
  geom_line(color = "#1565C0", linewidth = 1.2) +
  geom_point(color = "#1565C0", size = 3) +
  scale_y_continuous(labels = scales::comma) +
  labs(title = "Seasonal Cycle of Surface Water in Bangladesh (2015-2025)",
       subtitle = "Shaded area = inter-annual standard deviation",
       x = "Month", y = expression("Mean Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1),
        plot.title = element_text(face = "bold"))

ggsave(paste0(fig_dir, "fig4_seasonal_ribbon.png"), p_ribbon, width = 10, height = 6, dpi = 300)
cat("Saved: fig4_seasonal_ribbon.png\n")

# --- Fig 5: July Peak Water Area Trend (2015-2025) ---
july_df <- nat %>% filter(Month == 7)

p_july <- ggplot(july_df, aes(x = Year, y = Area_km2)) +
  geom_bar(stat = "identity", fill = "#42A5F5", alpha = 0.7, width = 0.7) +
  geom_smooth(method = "lm", se = TRUE, color = "#D32F2F", linewidth = 1, linetype = "dashed") +
  scale_y_continuous(labels = scales::comma, limits = c(0, NA)) +
  scale_x_continuous(breaks = 2015:2025) +
  labs(title = "Annual Peak Monsoon (July) Surface Water Extent",
       subtitle = sprintf("Sen's Slope: %+.1f km²/year | Mann-Kendall p = %.3f",
                          sen_result$estimates, mk_result$p.value),
       x = "Year", y = expression("Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(plot.title = element_text(face = "bold"),
        axis.text.x = element_text(angle = 45, hjust = 1))

ggsave(paste0(fig_dir, "fig5_july_peak_trend.png"), p_july, width = 10, height = 6, dpi = 300)
cat("Saved: fig5_july_peak_trend.png\n")

# --- Fig 6: Division-wise July Heatmap ---
div_july <- df %>%
  filter(RegionType == "Division" & Month == 7)

p_heatmap <- ggplot(div_july, aes(x = as.factor(Year), y = ClassLabel, fill = Area_km2)) +
  geom_tile(color = "white", linewidth = 0.5) +
  scale_fill_viridis(option = "mako", direction = -1, name = expression("Area (km"^2*")"),
                     labels = scales::comma) +
  labs(title = "Divisional Peak Monsoon Water Extent (July)",
       subtitle = "2015-2025 Comparison",
       x = "Year", y = "Division") +
  theme_minimal(base_size = 14) +
  theme(axis.text.x = element_text(angle = 45, hjust = 1),
        plot.title = element_text(face = "bold"))

ggsave(paste0(fig_dir, "fig6_divisional_heatmap.png"), p_heatmap, width = 12, height = 6, dpi = 300)
cat("Saved: fig6_divisional_heatmap.png\n")

# --- Fig 7: Annual Mean Water Area (All Months) ---
annual_mean <- nat %>%
  group_by(Year) %>%
  summarize(AnnualMean = mean(Area_km2), .groups = "drop")

p_annual <- ggplot(annual_mean, aes(x = Year, y = AnnualMean)) +
  geom_line(color = "#1565C0", linewidth = 1.2) +
  geom_point(color = "#1565C0", size = 3.5) +
  geom_smooth(method = "lm", se = TRUE, color = "#D32F2F", linetype = "dashed", alpha = 0.15) +
  scale_y_continuous(labels = scales::comma) +
  scale_x_continuous(breaks = 2015:2025) +
  labs(title = "Annual Mean Surface Water Area in Bangladesh",
       subtitle = "Average across all 12 months per year",
       x = "Year", y = expression("Mean Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(plot.title = element_text(face = "bold"),
        axis.text.x = element_text(angle = 45, hjust = 1))

ggsave(paste0(fig_dir, "fig7_annual_mean_trend.png"), p_annual, width = 10, height = 6, dpi = 300)
cat("Saved: fig7_annual_mean_trend.png\n")

# --- Fig 8: Monthly Boxplot Distribution ---
p_box <- ggplot(nat, aes(x = MonthName, y = Area_km2, fill = MonthName)) +
  geom_boxplot(alpha = 0.7, outlier.shape = 21) +
  scale_fill_viridis_d(option = "turbo") +
  scale_y_continuous(labels = scales::comma) +
  labs(title = "Monthly Water Area Distribution (2015-2025)",
       subtitle = "Boxplots showing inter-annual variability per month",
       x = "Month", y = expression("Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(legend.position = "none",
        axis.text.x = element_text(angle = 45, hjust = 1),
        plot.title = element_text(face = "bold"))

ggsave(paste0(fig_dir, "fig8_monthly_boxplot.png"), p_box, width = 10, height = 6, dpi = 300)
cat("Saved: fig8_monthly_boxplot.png\n")

# --- Fig 9: Top 10 Most Flood-Prone Districts ---
top10 <- df %>%
  filter(RegionType == "District" & Month == 7) %>%
  group_by(Class, ClassLabel) %>%
  summarize(MeanJuly = mean(Area_km2), .groups = "drop") %>%
  arrange(desc(MeanJuly)) %>%
  head(10)

p_top10 <- ggplot(top10, aes(x = reorder(ClassLabel, MeanJuly), y = MeanJuly, fill = MeanJuly)) +
  geom_col(width = 0.7) +
  coord_flip() +
  scale_fill_viridis(option = "plasma", direction = -1, name = expression("km"^2)) +
  scale_y_continuous(labels = scales::comma) +
  labs(title = "Top 10 Most Flood-Prone Districts (July Average)",
       subtitle = "Based on 11-year mean peak monsoon water extent",
       x = "", y = expression("Mean July Water Area (km"^2*")")) +
  theme_minimal(base_size = 14) +
  theme(plot.title = element_text(face = "bold"))

ggsave(paste0(fig_dir, "fig9_top10_districts.png"), p_top10, width = 10, height = 6, dpi = 300)
cat("Saved: fig9_top10_districts.png\n")

# ═══════════════════════════════════════════════════════════════════
cat("\n═══════════════════════════════════════════════\n")
cat("All analyses complete! 6 figures saved to figures/\n")
cat("═══════════════════════════════════════════════\n")
>>>>>>> 2f4a07f (Finalize methodologies, figures, datasets, and scripts for manuscript submission):scripts/HydroSAR_Analysis_2015_2025.R
