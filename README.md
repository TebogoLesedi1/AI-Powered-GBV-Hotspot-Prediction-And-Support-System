# AI-Powered-GBV-Hotspot-Prediction-And-Support-System


## 🧹 Data Preprocessing & Exploratory Data Analysis (EDA)

Before feeding raw data into machine learning algorithms (K-Means/DBSCAN clustering and XGBoost risk classification), we conducted an extensive Exploratory Data Analysis (EDA) and data cleaning pipeline on the official SAPS quarterly contact crime dataset (`2025-2026_-_4th_Quarter_WEB`).

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
