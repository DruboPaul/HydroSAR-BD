# 1. Package setup
required_pkgs <- c("ggplot2", "dplyr", "tidyr")
for (pkg in required_pkgs) {
  if (!require(pkg, character.only = TRUE)) install.packages(pkg, repos = "http://cran.us.r-project.org")
  library(pkg, character.only = TRUE)
}

# 2. Load the Interpolated Master Dataset
file_path <- "D:/Drubo_IWm/Drubo_all/Project/Publication/Project_HydroSAR-Bangladesh/SAR Analysis GMM/data/Final_Interpolated_Master_Dataset_GMM.csv"
data <- read.csv(file_path, stringsAsFactors = FALSE)

# 3. Filter only District Level Data
district_data <- data %>% filter(Scope == "District")

# 4. Define Hydrological Regions
nw_dists <- c("Panchagarh", "Thakurgaon", "Dinajpur", "Nilphamari", "Lalmonirhat", 
              "Rangpur_District", "Kurigram", "Gaibandha", "Bogra", "Joypurhat", 
              "Naogaon", "Nawabganj", "Rajshahi_District", "Natore", "Sirajganj", "Pabna")
ne_dists <- c("Sylhet_District", "Maulvibazar", "Habiganj", "Sunamganj", "Kishoreganj", "Netrakona", "Sherpur")
nc_dists <- c("Dhaka_District", "Narayanganj", "Narsingdi", "Manikganj", "Munshiganj", "Mymensingh", "Jamalpur", "Tangail", "Gazipur")
sc_dists <- c("Bhola", "Faridpur", "Madaripur", "Shariatpur", "Barisal_District", "Jhalokati", "Patuakhali", "Pirojpur", "Barguna")
sw_dists <- c("Khulna_District", "Bagerhat", "Satkhira", "Jessore", "Narail", "Jhenaidah", "Magura", "Kushtia", "Chuadanga", "Meherpur", "Gopalganj", "Rajbari")
se_dists <- c("Feni", "Noakhali", "Lakshmipur", "Comilla", "Brahamanbaria", "Chandpur")
eh_dists <- c("Chittagong_District", "Cox's Bazar", "Rangamati", "Bandarban", "Khagrachhari")

# 5. Map Districts to Regions
district_data <- district_data %>%
  mutate(Region = case_when(
    Class %in% nw_dists ~ "NW (Northwest)",
    Class %in% ne_dists ~ "NE (Northeast)",
    Class %in% nc_dists ~ "NC (North-Central)",
    Class %in% sc_dists ~ "SC (South-Central)",
    Class %in% sw_dists ~ "SW (Southwest)",
    Class %in% se_dists ~ "SE (Southeast)",
    Class %in% eh_dists ~ "EH (Eastern Hills)",
    TRUE ~ "Unknown"
  ))

# 6. Summarize Total Area by Region, Year, and Month
regional_summary <- district_data %>%
  group_by(Region, Year, Month) %>%
  summarize(Total_Area_km2 = sum(Area_km2, na.rm = TRUE), .groups = "drop") %>%
  mutate(Month_Name = month.name[Month]) %>%
  mutate(Month_Name = factor(Month_Name, levels = month.name))

# 7. Create Output Directories
dir.create("../data/regional_trends", showWarnings = FALSE)
dir.create("../figures/regional_trends", showWarnings = FALSE)

# 8. Generate CSV and ggplot for each Region
regions <- unique(regional_summary$Region)

for (reg in regions) {
  reg_data <- regional_summary %>% filter(Region == reg)
  
  # A. EXPORT REGIONAL CSV
  reg_wide <- reg_data %>%
    select(Year, Month_Name, Total_Area_km2) %>%
    pivot_wider(names_from = Month_Name, values_from = Total_Area_km2)
  
  safe_name <- gsub("[^A-Za-z0-9]", "_", reg)
  csv_path <- paste0("../data/regional_trends/Trend_", safe_name, ".csv")
  write.csv(reg_wide, file = csv_path, row.names = FALSE)
  
  # B. GENERATE REGIONAL PLOT
  p <- ggplot(reg_data, aes(x = Year, y = Total_Area_km2)) +
    geom_line(color = "dodgerblue4", linewidth = 1) +
    geom_point(color = "darkred", size = 2, alpha = 0.7) +
    geom_smooth(method = "lm", color = "black", linetype = "dashed", linewidth = 0.6, se = FALSE) + 
    facet_wrap(~ Month_Name, scales = "free_y", ncol = 4) + 
    scale_x_continuous(breaks = seq(2015, 2025, 2)) +
    labs(
      title = paste("11-Year Surface Water Trend:", reg, "Region"),
      subtitle = "Monthly variation of total water extent from 2015 to 2025",
      x = "Year",
      y = expression("Total Water Area ("*km^2*")")
    ) +
    theme_minimal() +
    theme(
      plot.title = element_text(face = "bold", size = 16, hjust = 0.5),
      plot.subtitle = element_text(size = 12, hjust = 0.5, color = "gray30"),
      strip.background = element_rect(fill = "lightblue", color = "white"),
      strip.text = element_text(face = "bold", size = 11),
      axis.text.x = element_text(angle = 45, hjust = 1)
    )
  
  plot_path <- paste0("../figures/regional_trends/Plot_", safe_name, ".png")
  ggsave(plot_path, plot = p, width = 14, height = 10, dpi = 300)
}

print("All 7 CSVs and 7 Graphs have been successfully generated!")
