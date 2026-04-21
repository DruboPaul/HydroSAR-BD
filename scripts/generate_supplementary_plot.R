<<<<<<< HEAD
# ==============================================================================
# R Script for Supplementary Figure 1: VV Backscatter Histogram for Bhola District
# ==============================================================================
library(ggplot2)
library(dplyr)
library(scales)

# 1. Load the CSV file
args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("--file=", "", args[grep("--file=", args)])
if (length(script_path) > 0) {
  base_dir <- normalizePath(file.path(dirname(script_path), ".."))
} else {
  base_dir <- normalizePath(getwd())
  message("Note: Could not determine script path, using working directory: ", base_dir)
}
file_path <- file.path(base_dir, "data", "GEE_data", "bhola_vv_histogram_july2023.csv")
if (!file.exists(file_path)) stop("Data file not found: ", file_path)
data <- read.csv(file_path, stringsAsFactors = FALSE)

# 2. Rename columns and clean data
colnames(data) <- c("Backscatter", "Pixel_Count")

# GEE CSV export sometimes puts commas in large numbers (e.g., "1,097.498")
# and leaves empty strings for 0 counts. Let's clean it up.
data$Pixel_Count <- as.character(data$Pixel_Count)
data$Pixel_Count <- gsub(",", "", data$Pixel_Count) # Extract commas
data$Pixel_Count[data$Pixel_Count == ""] <- "0"      # Replace empty with 0
data$Pixel_Count <- as.numeric(data$Pixel_Count)      # Convert to numeric

# Filter to relevant backscatter range (-25 to 0 dB)
data <- data %>% filter(Backscatter >= -25 & Backscatter <= 0)

# 3. Define the Thresholds
otsu_threshold <- -13.5  # Approximate Otsu calculation for Bhola July

# 4. Generate the Q1 Publication-Standard Plot
p <- ggplot(data, aes(x = Backscatter, y = Pixel_Count)) +
  geom_area(fill = "#5DADE2", alpha = 0.6, color = "#2874A6", linewidth = 0.8) +
  
  # Add Otsu Threshold Line (Red, Dashed)
  geom_vline(xintercept = otsu_threshold, linetype = "dashed", color = "#E74C3C", linewidth = 1.2) +
  
  # Annotations for the lines
  annotate("text", x = otsu_threshold - 0.4, y = max(data$Pixel_Count) * 0.85, 
           label = "Otsu's Threshold (-13.5 dB)", color = "#E74C3C", angle = 90, vjust = 1, size = 5, fontface="bold") +
  
  # Format Y-axis to avoid scientific notation
  scale_y_continuous(labels = comma) +
  scale_x_continuous(breaks = seq(-25, 0, by = 5)) +
  
  # Labels and Theme
  labs(title = "Supplementary Figure 1: VV Backscatter Histogram",
       subtitle = "Bhola District (July 2023) - Comparison of Water/Land Separation Thresholds",
       x = expression(paste("VV Backscatter (", sigma^0, " in dB)")),
       y = "Pixel Count") +
  
  theme_minimal(base_size = 15) +
  theme(
    plot.title = element_text(face = "bold", hjust = 0.5, margin = margin(b = 5)),
    plot.subtitle = element_text(hjust = 0.5, margin = margin(b = 15), color = "gray30"),
    axis.title.x = element_text(face = "bold", margin = margin(t = 12)),
    axis.title.y = element_text(face = "bold", margin = margin(r = 12)),
    panel.grid.minor = element_blank(),
    panel.border = element_rect(color = "black", fill = NA, linewidth = 1.2),
    plot.background = element_rect(fill = "white", color = NA)
  )

# 5. Save the plot to the figures directory
output_dir <- file.path(base_dir, "figures")
if (!dir.exists(output_dir)) dir.create(output_dir, recursive = TRUE)
ggsave(file.path(output_dir, "Supplementary_Figure_1_Otsu.pdf"), plot = p, width = 10, height = 6, dpi = 300)
ggsave(file.path(output_dir, "Supplementary_Figure_1_Otsu.png"), plot = p, width = 10, height = 6, dpi = 300)

cat("Successfully generated Supplementary_Figure_1_Otsu in the figures directory.\n")
=======
# ==============================================================================
# R Script for Supplementary Figure 1: VV Backscatter Histogram for Bhola District
# ==============================================================================
library(ggplot2)
library(dplyr)
library(scales)

# 1. Load the CSV file downloaded from GEE
file_path <- "D:/Drubo_IWm/Drubo_all/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM/data/GEE_data/bhola_vv_histogram_july2023.csv"
data <- read.csv(file_path, stringsAsFactors = FALSE)

# 2. Rename columns and clean data
colnames(data) <- c("Backscatter", "Pixel_Count")

# GEE CSV export sometimes puts commas in large numbers (e.g., "1,097.498")
# and leaves empty strings for 0 counts. Let's clean it up.
data$Pixel_Count <- as.character(data$Pixel_Count)
data$Pixel_Count <- gsub(",", "", data$Pixel_Count) # Extract commas
data$Pixel_Count[data$Pixel_Count == ""] <- "0"      # Replace empty with 0
data$Pixel_Count <- as.numeric(data$Pixel_Count)      # Convert to numeric

# Filter to relevant backscatter range (-25 to 0 dB)
data <- data %>% filter(Backscatter >= -25 & Backscatter <= 0)

# 3. Define the Thresholds
otsu_threshold <- -13.5  # Approximate Otsu calculation for Bhola July

# 4. Generate the Q1 Publication-Standard Plot
p <- ggplot(data, aes(x = Backscatter, y = Pixel_Count)) +
  geom_area(fill = "#5DADE2", alpha = 0.6, color = "#2874A6", linewidth = 0.8) +
  
  # Add Otsu Threshold Line (Red, Dashed)
  geom_vline(xintercept = otsu_threshold, linetype = "dashed", color = "#E74C3C", linewidth = 1.2) +
  
  # Annotations for the lines
  annotate("text", x = otsu_threshold - 0.4, y = max(data$Pixel_Count) * 0.85, 
           label = "Otsu's Threshold (-13.5 dB)", color = "#E74C3C", angle = 90, vjust = 1, size = 5, fontface="bold") +
  
  # Format Y-axis to avoid scientific notation
  scale_y_continuous(labels = comma) +
  scale_x_continuous(breaks = seq(-25, 0, by = 5)) +
  
  # Labels and Theme
  labs(title = "Supplementary Figure 1: VV Backscatter Histogram",
       subtitle = "Bhola District (July 2023) - Comparison of Water/Land Separation Thresholds",
       x = expression(paste("VV Backscatter (", sigma^0, " in dB)")),
       y = "Pixel Count") +
  
  theme_minimal(base_size = 15) +
  theme(
    plot.title = element_text(face = "bold", hjust = 0.5, margin = margin(b = 5)),
    plot.subtitle = element_text(hjust = 0.5, margin = margin(b = 15), color = "gray30"),
    axis.title.x = element_text(face = "bold", margin = margin(t = 12)),
    axis.title.y = element_text(face = "bold", margin = margin(r = 12)),
    panel.grid.minor = element_blank(),
    panel.border = element_rect(color = "black", fill = NA, linewidth = 1.2),
    plot.background = element_rect(fill = "white", color = NA)
  )

# 5. Save the plot to the figures directory
output_dir <- "D:/Drubo_IWm/Drubo_all/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM/figures/"
ggsave(paste0(output_dir, "Supplementary_Figure_1_Otsu.pdf"), plot = p, width = 10, height = 6, dpi = 300)
ggsave(paste0(output_dir, "Supplementary_Figure_1_Otsu.png"), plot = p, width = 10, height = 6, dpi = 300)

cat("Successfully generated Supplementary_Figure_1_Otsu in the figures directory.\n")
>>>>>>> 2f4a07f (Finalize methodologies, figures, datasets, and scripts for manuscript submission)
