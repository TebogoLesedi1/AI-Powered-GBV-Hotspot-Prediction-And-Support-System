# AI-Powered-GBV-Hotspot-Prediction-And-Support-System


**Project Overview**


An Al-powered system that predicts Gender-Based Violence
(GBV) hotspot areas in South Africa and provides real-time support through an intelligent chatbot.

* What It Does

• Predicts GBV high-risk zones using clustering algorithms

• Classifies locations into Low, Medium, or High risk levels

• Chatbot offers emotional support, guidance, and resource recommendations.

Ethics & Safety

• Privacy-first approach

• No personal data stored without consent

• Not a replacement for professional/legal advice

• Bias-aware modeling


Deliverables

• Source code + report

• Model evaluation metrics

• Interactive visualizations

• Working demo



## 🧹 Data Preprocessing & Exploratory Data Analysis (EDA)

Before feeding raw data into machine learning algorithms (K-Means/DBSCAN clustering and XGBoost risk classification), we conducted an extensive Exploratory Data Analysis (EDA) and data cleaning pipeline on the official SAPS quarterly contact crime dataset (`2025-2026_-_4th_Quarter_WEB`).


## 🌐 Data Source & Scope

This project utilizes official quarterly contact crime data published by the **South African Police Service (SAPS)**, focusing on gender-based violence and femicide (GBVF) metrics across South Africa.

* **Primary Sources:**
  * Official Portal: [SAPS Crime Statistics](https://www.saps.gov.za/services/crimestats.php)
  * Visualisation Partner: [GBVF Response Fund Dashboard](https://www.gbvfresponsefund1.org/dashboards/saps-data-visualisation/)
  * Conflict-Related (CRSV) or Political-Related Sexual Violence Data:  [Conflict-Related (CRSV)](https://data.humdata.org/dataset/conflict-related-sexual-violence)
  * 
* **Granularity:** Police Station, District, Province, and National levels.
* **Target GBVF Crime Categories:**
  * Rape
  * Sexual Offences
  * Sexual Offences detected as a result of police action
  * Sexual Assault
  * Attempted Sexual Offences
  * Contact Sexual Offences

---

### Key Preprocessing Steps Completed:

1. **Dataset Ingestion & Metadata Cleaning:**
   * Stripped official SAPS banner and layout rows (skipping raw metadata headers) to align police station entries correctly.
   * Extracted station-level granular observations from the `Province TOP 30 stations` sheet to support spatial hotspot mapping.

2. **Column Standardisation & Feature Cleansing:**
   * Standardised all column headers into clean, lower-case, programmatic names (e.g., `january_2026_to_march_2026`, `province`, `station`).
   * Automated the removal of Excel layout spacer columns (`Unnamed: 0`, `Unnamed: 1`, `Unnamed: 14`, `Unnamed: 15`).
   * Removed secondary structural SAPS code header rows (`P1`, `P2`, `Prov`).

3. **Data Type Conversion & Handling Missing Values:**
   * Processed string-formatted numerical fields by stripping commas (e.g., converting `"2,653"` to integer `2653`).
   * Addressed missing values by dropping non-informative structural footer rows and coercing missing crime metrics to `0`.
   * Verified data integrity and removed duplicate station entries.

4. **Feature Engineering & Target Categorisation:**
   * Formatted historical period features (`2022` through `2026`) to analyze quarter-on-quarter crime trajectories.
   * Engineered an ordinal target variable (`risk_level`) using quantile-based stratification (`Low Risk`, `Medium Risk`, `High Risk`) based on the latest quarterly crime volume.
   * Encoded categorical labels using `LabelEncoder` (`0`, `1`, `2`) for downstream supervised classification.

5. **Feature Scaling & Dataset Partitioning:**
   * Applied `StandardScaler` ($\mu=0, \sigma=1$) across all numeric crime features to prepare normalized distance vectors required for **K-Means** and **DBSCAN** spatial clustering.
   * Partitioned the dataset using stratified 80/20 train/test splitting (`train_test_split`) to evaluate baseline models without data leakage.

---

### ⏸️ Preprocessing Status: **PAUSED**
> **Current State:** The dataset has been fully cleaned, transformed, scaled, and split (`X_train`, `X_test`, `y_train`, `y_test`). The preprocessed data is saved and ready for **Step 4: Model Implementation & Hotspot Clustering (K-Means / DBSCAN / XGBoost Classifier)**.




# GBV Study Data Classification Notebook

## Project Overview
This notebook processes data from a Gender-Based Violence (GBV) study report, aiming to classify different sections of the report based on their textual and numerical content. The primary goal is to build a machine learning model that can predict the 'section' (e.g., 'PREVALENCE', 'INJURIES', 'RECOMMENDATIONS') of an entry within the report.

## Data Source
The data is loaded from a CSV file: `/content/drive/MyDrive/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt`.

## Methodology
The process involves several key stages:

1.  **Data Loading and Initial Inspection**: The raw data is loaded into a Pandas DataFrame, and initial checks are performed to understand its structure, data types, and missing values.

2.  **Data Preprocessing and Cleaning**: 
    *   Missing `notes` values are filled with empty strings.
    *   A `value_numeric` column is created by extracting numerical information from the `value` column, handling percentages and text-embedded numbers (e.g., "7,310,389 women"). Non-convertible values are coerced to `NaN`.
    *   A combined `text` column is generated from `indicator` and `notes` for natural language processing.

3.  **Feature Engineering**: 
    *   The `section` column is transformed into a numerical target variable (`y_encoded`) using `LabelEncoder`.
    *   Textual features (`X_text`) are created using `TfidfVectorizer`.
    *   Numerical features (`X_numeric_scaled`) are derived from `value_numeric`, with `SimpleImputer` handling `NaN`s (imputing with 0) and `StandardScaler` standardizing the values.
    *   All features are combined into a single feature matrix `X` using `hstack`. Robust type conversion and a final `SimpleImputer` step ensure `X` is a dense, NaN-free `float` NumPy array.

4.  **Data Splitting**: The data is split into training (70%), validation (15%), and testing (15%) sets. Special handling is implemented to address rare classes during splitting to avoid issues with `stratify` parameters.

5.  **Model Training**: 
    *   A `RandomForestClassifier` is initialized and trained on the `X_train` and `y_train` data.
    *   Extensive debug checks were added during the process to ensure `X_train` is free of `NaN`s and is of the correct data type (`float` NumPy array) before model fitting.

## Current Status
*   Data has been successfully loaded, cleaned, and features engineered.
*   The data has been split into training, validation, and test sets.
*   A `RandomForestClassifier` model has been trained on the processed training data without encountering `NaN` errors.
*   The cleaned DataFrame `df_clean` has been saved to `gbv_data_cleaned.csv`.
