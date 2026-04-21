# Q1 Publication Quality Validation Visuals (R)
# Purpose: Create high-end statistical plots for SAR Accuracy Assessment

library(ggplot2)
library(dplyr)
library(tidyr)
library(RColorBrewer)

# 1. Load Data
# Updated path to your official NDWI validation file
data_path <- "D:/Drubo_IWm/Drubo_all/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM/data/Sample_Points/SAR_Water_Validation_with_NDWI_2025_Robust.csv"
df <- read.csv(data_path)

# Prepare seasons and months
df$Season <- case_when(
  df$Month %in% c(12, 1, 2) ~ "Dry",
  df$Month %in% c(3, 4, 5) ~ "Pre-monsoon",
  df$Month %in% c(6, 7, 8, 9) ~ "Monsoon",
  df$Month %in% c(10, 11) ~ "Post-monsoon"
)
df$Season <- factor(df$Season, levels=c("Dry", "Pre-monsoon", "Monsoon", "Post-monsoon"))
df$MonthName <- factor(month.abb[df$Month], levels=month.abb)

# 2. Calculation Monthly Accuracy
accuracy_summary <- df %>%
  group_by(MonthName) %>%
  summarise(
    Total = n(),
    Verified = sum(NDWI > -0.1, na.rm = TRUE),
    Accuracy = (Verified / Total) * 100
  )

# --- VISUAL 1: Monthly Accuracy Trend (Q1 Standard) ---
p1 <- ggplot(accuracy_summary, aes(x=MonthName, y=Accuracy, group=1)) +
  geom_line(color="#2c7fb8", size=1.2) +
  geom_point(color="#2c7fb8", size=3, fill="white", shape=21) +
  geom_hline(yintercept=mean(accuracy_summary$Accuracy), linetype="dashed", color="red") +
  annotate("text", x=1.5, y=mean(accuracy_summary$Accuracy)+2, label="Mean Accuracy", color="red", size=3) +
  labs(title="Monthly Classification Reliability (2025)",
       subtitle="Cross-verified with Field Validation Points (NDWI > -0.1)",
       x="Month", y="User's Accuracy (%)") +
  theme_minimal() +
  ylim(0, 100)

ggsave("monthly_accuracy_trend.png", p1, width=8, height=5, dpi=300)

# --- VISUAL 2: Seasonal NDWI Distribution (Raincloud-style Boxplot) ---
p2 <- ggplot(df, aes(x=Season, y=NDWI, fill=Season)) +
  geom_boxplot(width=0.4, alpha=0.7, outlier.shape=NA) +
  geom_jitter(width=0.2, alpha=0.05, size=0.5) +
  geom_hline(yintercept=-0.1, linetype="solid", color="black", size=0.8) +
  scale_fill_brewer(palette="Set2") +
  labs(title="Distribution of NDWI at SAR-Detected Water Points",
       subtitle="Values > -0.1 indicate verified water presence",
       x="Season", y="NDWI Value") +
  theme_classic() +
  theme(legend.position="none")

ggsave("seasonal_ndwi_distribution.png", p2, width=8, height=6, dpi=300)

print("Visualizations saved as 'monthly_accuracy_trend.png' and 'seasonal_ndwi_distribution.png'")
print("Summary Statistics:")
print(accuracy_summary)
