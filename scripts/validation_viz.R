<<<<<<< HEAD
# =========================================================================
# Q1 Publication: SAR Water Validation Visualizations (2025)
# =========================================================================

# Load required libraries
if (!require("ggplot2")) install.packages("ggplot2")
if (!require("dplyr")) install.packages("dplyr")
if (!require("tidyr")) install.packages("tidyr")
if (!require("scales")) install.packages("scales")

library(ggplot2)
library(dplyr)
library(tidyr)
library(scales)

# 1. Load Data
# Get script directory (works with Rscript)
args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args[grep("--file=", args)])
if (length(script_path) > 0) {
  base_dir <- normalizePath(file.path(dirname(script_path), ".."))
} else {
  # Fallback: assume working directory is the project root
  base_dir <- normalizePath(getwd())
  message("Note: Could not determine script path, using working directory: ", base_dir)
}
data_path <- file.path(base_dir, "data", "Sample_Points", "Final_Binary_Field_Validation_2025.csv")
df <- read.csv(data_path)

# 2. Confusion Matrix Data
cm_data <- df %>%
  group_by(Field_Truth, class) %>%
  summarise(Count = n(), .groups = "drop") %>%
  mutate(
    Actual = ifelse(Field_Truth == 1, "Water (Ref)", "Land (Ref)"),
    Predicted = ifelse(class == 1, "Water (SAR)", "Land (SAR)")
  )

# Plot 1: Confusion Matrix Heatmap
p1 <- ggplot(cm_data, aes(x = Predicted, y = Actual, fill = Count)) +
  geom_tile(color = "white", lwd = 1) +
  geom_text(aes(label = Count), color = "white", fontface = "bold", size = 8) +
  scale_fill_gradient(low = "#91bfdb", high = "#4575b4") +
  theme_minimal() +
  labs(title = "Confusion Matrix: Field Validation 2025",
       subtitle = "SAR Water Classification vs. Field-Verified Truth (n=6,000)",
       x = "Predicted Class (SAR)",
       y = "Actual Class (Field-Truth)") +
  theme(plot.title = element_text(face = "bold", size = 16),
        axis.text = element_text(size = 12),
        legend.position = "none")

# Save Confusion Matrix
out_fig10 <- file.path(base_dir, "figures", "fig10_confusion_matrix_2025.png")
ggsave(out_fig10, p1, width = 8, height = 6, dpi = 300)

# 3. Monthly Accuracy Data
monthly_acc <- df %>%
  group_by(Month) %>%
  summarise(
    OA = sum(Field_Truth == class) / n() * 100,
    Points = n(),
    .groups = "drop"
  ) %>%
  mutate(Month_Name = month.abb[Month])

monthly_acc$Month_Name <- factor(monthly_acc$Month_Name, levels = month.abb)

# Plot 2: Monthly Accuracy Trend
p2 <- ggplot(monthly_acc, aes(x = Month_Name, y = OA, group = 1)) +
  geom_line(color = "#4575b4", linewidth = 1.2) +
  geom_point(aes(size = Points), color = "#d73027") +
  geom_text(aes(label = sprintf("%.1f%%", OA)), vjust = -1.5, size = 3.5, fontface = "bold") +
  scale_y_continuous(limits = c(80, 100), breaks = seq(80, 100, 5)) +
  theme_bw() +
  labs(title = "Monthly Classification Accuracy (2025)",
       subtitle = "Consistency across Bangladesh's Hydrological Seasons",
       x = "Month",
       y = "Overall Accuracy (%)",
       size = "Sample Size") +
  theme(plot.title = element_text(face = "bold", size = 16),
        axis.title = element_text(face = "bold"))

# Save Monthly Accuracy
out_fig11 <- file.path(base_dir, "figures", "fig11_monthly_accuracy_2025.png")
ggsave(out_fig11, p2, width = 10, height = 6, dpi = 300)

message("Success: Q1 Validation Figures generated in the 'figures/' directory.")
=======
# =========================================================================
# Q1 Publication: SAR Water Validation Visualizations (2025)
# =========================================================================

# Load required libraries
if (!require("ggplot2")) install.packages("ggplot2")
if (!require("dplyr")) install.packages("dplyr")
if (!require("tidyr")) install.packages("tidyr")
if (!require("scales")) install.packages("scales")

library(ggplot2)
library(dplyr)
library(tidyr)
library(scales)

# 1. Load Data
# Get script directory (works with Rscript)
args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args[grep("--file=", args)])
if (length(script_path) > 0) {
  base_dir <- normalizePath(file.path(dirname(script_path), ".."))
} else {
  # Fallback
  base_dir <- normalizePath("c:/Users/Drubo/Documents/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM")
}
data_path <- file.path(base_dir, "data", "Sample_Points", "Final_Binary_Field_Validation_2025.csv")
df <- read.csv(data_path)

# 2. Confusion Matrix Data
cm_data <- df %>%
  group_by(Field_Truth, class) %>%
  summarise(Count = n(), .groups = "drop") %>%
  mutate(
    Actual = ifelse(Field_Truth == 1, "Water (Ref)", "Land (Ref)"),
    Predicted = ifelse(class == 1, "Water (SAR)", "Land (SAR)")
  )

# Plot 1: Confusion Matrix Heatmap
p1 <- ggplot(cm_data, aes(x = Predicted, y = Actual, fill = Count)) +
  geom_tile(color = "white", lwd = 1) +
  geom_text(aes(label = Count), color = "white", fontface = "bold", size = 8) +
  scale_fill_gradient(low = "#91bfdb", high = "#4575b4") +
  theme_minimal() +
  labs(title = "Confusion Matrix: Field Validation 2025",
       subtitle = "SAR Water Classification vs. Field-Verified Truth (n=6,000)",
       x = "Predicted Class (SAR)",
       y = "Actual Class (Field-Truth)") +
  theme(plot.title = element_text(face = "bold", size = 16),
        axis.text = element_text(size = 12),
        legend.position = "none")

# Save Confusion Matrix
out_fig10 <- file.path(base_dir, "figures", "fig10_confusion_matrix_2025.png")
ggsave(out_fig10, p1, width = 8, height = 6, dpi = 300)

# 3. Monthly Accuracy Data
monthly_acc <- df %>%
  group_by(Month) %>%
  summarise(
    OA = sum(Field_Truth == class) / n() * 100,
    Points = n(),
    .groups = "drop"
  ) %>%
  mutate(Month_Name = month.abb[Month])

monthly_acc$Month_Name <- factor(monthly_acc$Month_Name, levels = month.abb)

# Plot 2: Monthly Accuracy Trend
p2 <- ggplot(monthly_acc, aes(x = Month_Name, y = OA, group = 1)) +
  geom_line(color = "#4575b4", linewidth = 1.2) +
  geom_point(aes(size = Points), color = "#d73027") +
  geom_text(aes(label = sprintf("%.1f%%", OA)), vjust = -1.5, size = 3.5, fontface = "bold") +
  scale_y_continuous(limits = c(80, 100), breaks = seq(80, 100, 5)) +
  theme_bw() +
  labs(title = "Monthly Classification Accuracy (2025)",
       subtitle = "Consistency across Bangladesh's Hydrological Seasons",
       x = "Month",
       y = "Overall Accuracy (%)",
       size = "Sample Size") +
  theme(plot.title = element_text(face = "bold", size = 16),
        axis.title = element_text(face = "bold"))

# Save Monthly Accuracy
out_fig11 <- file.path(base_dir, "figures", "fig11_monthly_accuracy_2025.png")
ggsave(out_fig11, p2, width = 10, height = 6, dpi = 300)

message("Success: Q1 Validation Figures generated in the 'figures/' directory.")
>>>>>>> 2f4a07f (Finalize methodologies, figures, datasets, and scripts for manuscript submission)
