# ═══════════════════════════════════════════════════════════════════
# Advanced Statistical Graphics — SAR Analysis GMM
# ═══════════════════════════════════════════════════════════════════

# 1. Setup
if (!require("ggplot2")) install.packages("ggplot2")
if (!require("ggdist")) install.packages("ggdist") # For raincloud plots
if (!require("dplyr")) install.packages("dplyr")
if (!require("tidyr")) install.packages("tidyr")
if (!require("RColorBrewer")) install.packages("RColorBrewer")

library(ggplot2)
library(ggdist)
library(dplyr)
library(tidyr)
library(RColorBrewer)

# 2. Load Data
# Assuming the user has downloaded the V2 CSV to the statistics folder
file_path <- "D:/Drubo_IWm/Drubo_all/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM/data/Final_Interpolated_Master_Dataset_GMM.csv"

# Safety check for file existence
if (!file.exists(file_path)) {
  stop("CSV file not found! Please download 'HydroSAR_Bangladesh_Full_Dataset_V2_Corrected.csv' to data/statistics/ first.")
}

df <- read.csv(file_path)

# Ensure Month is an ordered factor
df$Month <- factor(df$Month, levels = c("January", "February", "March", "April", "May", "June", 
                                        "July", "August", "September", "October", "November", "December"))

# 3. 🌧️ Plot 1: Raincloud Plot (Monthly Distribution)
# Shows the distribution, density, and actual data points for each month across 10 years
p1 <- ggplot(df %>% filter(Region_Type == "National"), aes(x = Month, y = Area_km2, fill = Month)) +
  stat_halfeye(adjust = .5, width = .6, justification = -.2, .width = 0, point_colour = NA) +
  geom_boxplot(width = .12, outlier.shape = NA, alpha = 0.5) +
  stat_dots(side = "left", justification = 1.1, binwidth = NA) +
  labs(title = "Monthly Surface Water Distribution (2015-2024)",
       subtitle = "Raincloud plot showing density and inter-annual variability",
       y = "Water Area (km²)", x = "") +
  theme_minimal() +
  theme(legend.position = "none", axis.text.x = element_text(angle = 45, hjust = 1)) +
  scale_fill_viridis_d(option = "mako")

ggsave("../figures/R_raincloud_distribution.png", p1, width = 10, height = 6, dpi = 300)

# 4. 📈 Plot 2: Seasonal Ribbon Plot
# Shows the mean water area with a shaded ribbon for Standard Deviation
seasonal_stats <- df %>%
  filter(Region_Type == "National") %>%
  group_by(Month) %>%
  summarize(mean_area = mean(Area_km2), sd_area = sd(Area_km2))

p2 <- ggplot(seasonal_stats, aes(x = Month, y = mean_area, group = 1)) +
  geom_ribbon(aes(ymin = mean_area - sd_area, ymax = mean_area + sd_area), fill = "#3498db", alpha = 0.2) +
  geom_line(color = "#2980b9", size = 1.2) +
  geom_point(color = "#2980b9", size = 3) +
  labs(title = "Decadal Seasonal Cycle with Variability (SD Shading)",
       subtitle = "Shaded area represents inter-annual standard deviation",
       y = "Mean Water Area (km²)", x = "") +
  theme_light() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))

ggsave("../figures/R_seasonal_ribbon.png", p2, width = 10, height = 5, dpi = 300)

# 5. 🔥 Plot 3: Divisional Change Heatmap
# Heatmap of July (Peak) Water Area by Division vs Year
p3 <- ggplot(df %>% filter(Region_Type == "Division" & Month == "July"), 
             aes(x = as.factor(Year), y = Region_Name, fill = Area_km2)) +
  geom_tile(color = "white") +
  scale_fill_gradientn(colors = brewer.pal(9, "YlGnBu"), name = "Area (km²)") +
  labs(title = "Divisional Peak Monsoon Intensity (July)",
       subtitle = "Comparison of water extent across years and divisions",
       x = "Year", y = "Division") +
  theme_minimal() +
  theme(axis.text.x = element_text(angle = 0))

ggsave("../figures/R_divisional_heatmap.png", p3, width = 12, height = 6, dpi = 300)

cat("Success! 3 plots saved to the figures/ directory.\n")
cat("1. R_raincloud_distribution.png\n")
2. R_seasonal_ribbon.png\n")
3. R_divisional_heatmap.png\n")
