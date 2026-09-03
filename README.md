# AI-Powered GBV Hotspot Prediction and Support System

An exploratory research project for collecting, preprocessing, analyzing, and visualizing publicly available gender-based violence (GBV) data in South Africa. The project combines machine-learning notebooks with two browser interfaces:

- An interactive station hotspot map for geographic exploration
- A grounded GBV information and emotional-support chatbot

The project is intended for research, education, and prototype demonstration. It is not an emergency service, a clinical tool, a law-enforcement decision system, or an individual risk predictor.

## Project objectives

1. Collect and analyze publicly available GBV-related datasets.
2. Clean and prepare station, geographic, yearly-count, and report data.
3. Engineer features for clustering and supervised learning.
4. Explore hotspot detection using geographic and historical case features.
5. Explore risk classification using supervised machine-learning models.
6. Provide a user-friendly interface for map visualization and report exploration.
7. Present safety resources without storing user conversations.

## Repository structure

```text
.
├── chatbot/
│   ├── index.html       # Integrated chatbot and station-risk dashboard
│   ├── styles.css       # Chatbot and dashboard styling
│   ├── app.js           # Report search, support signals, and embedded map logic
│   └── README.md        # Chatbot and dashboard documentation
├── interactive_map/
│   ├── index.html       # Standalone map page
│   ├── styles.css       # Standalone map styling
│   ├── app.js           # Standalone map logic and embedded station data
│   └── README.md        # Standalone map documentation
├── datasets/
│   ├── 2020-2026-political-related-sexual-violence-incident-data (2).csv
│   └── full-report-the-first-south-african-national-gender-based-violence-study-2022.txt
├── extracted_datasets/
│   ├── 2025-2026_-_4th_Quarter_WEB.xlsx - Prov TOP30 stations.csv
│   ├── GBV Dataset.csv
│   └── gbv_data.xlsx - Sheet1.csv
├── python_notebooks/
│   ├── classification.ipynb
│   ├── emotional_support.ipynb
│   ├── GBV Model (3).ipynb
│   └── hotspot_detection.ipynb
└── iris_dataset_for_data_science_pratice.ipynb
```

## Data sources and scope

The project uses publicly available sources related to GBV, sexual violence, and South African crime statistics. The main sources include:

- [South African Police Service crime statistics](https://www.saps.gov.za/services/crimestats.php)
- [GBVF Response Fund SAPS data visualization](https://www.gbvfresponsefund1.org/dashboards/saps-data-visualisation/)
- [Conflict-related sexual violence data](https://data.humdata.org/dataset/conflict-related-sexual-violence)
- The First South African National Gender-Based Violence Study, 2022

The repository contains both source files and extracted/working CSV files. The current station map uses `extracted_datasets/GBV Dataset.csv`, a semicolon-delimited dataset with these fields:

| Field | Description |
| --- | --- |
| `Province` | South African province |
| `Station` | Police station name |
| `Latitude`, `Longitude` | Station coordinates |
| `Risk` | Source risk label, currently `High` or `Med-high` |
| `2022`–`2026` | Reported case count for each year |
| `TOTAL` | Combined count for the available years |

The map currently contains 30 usable station records. Province summary rows and national totals do not have station coordinates, so they are excluded from plotted markers.

## Data preprocessing and feature engineering

The project preprocessing work includes:

1. Removing report banners, metadata rows, empty layout columns, structural headers, and footer rows from exported SAPS tables.
2. Standardizing column names by stripping whitespace, converting to lowercase, and replacing spaces with underscores.
3. Removing duplicate records and rows without critical province or station values.
4. Converting comma-formatted strings into numeric case counts.
5. Coercing invalid or missing numeric values to usable values, with missing crime counts represented as zero where appropriate.
6. Cleaning latitude and longitude fields, including removal of stray `=` characters.
7. Reshaping yearly counts between wide and long formats for analysis and visualization.
8. Scaling numerical features with `StandardScaler` for distance-based clustering and model inputs.
9. Creating an ordinal risk target with quantile-based levels such as `Low Risk`, `Medium Risk`, and `High Risk` in the hotspot notebook.
10. Encoding categorical targets with `LabelEncoder` for supervised learning experiments.

The report-classification notebook additionally creates:

- A cleaned `notes` field
- A numeric representation of report values
- A combined text field from indicators and notes
- TF-IDF text features
- Imputed and scaled numerical features
- A combined feature matrix for a Random Forest classifier

## Machine-learning work

### Hotspot detection and clustering

`python_notebooks/hotspot_detection.ipynb` prepares station-level historical crime-period features for clustering and supervised experiments. The workflow includes data cleaning, feature scaling, quantile-based risk tiers, and train/test preparation for future K-Means, DBSCAN, and related analysis.

The current web map is a visualization of station records. It does not claim to generate live clustering predictions. Clustering outputs should be interpreted alongside the notebook preprocessing and evaluation work.

### Risk classification

`python_notebooks/GBV Model (3).ipynb` explores supervised classification of station risk labels using geographic coordinates and reported totals. The notebook compares models including:

- Logistic Regression
- K-Nearest Neighbours
- Decision Tree
- Random Forest
- Support Vector Machine
- Gaussian Naive Bayes
- Gradient Boosting
- Multi-layer Perceptron

It includes train/test splitting, feature scaling, model training, predictions, accuracy, precision, recall, F1 score, and comparison plots.

`python_notebooks/classification.ipynb` focuses on classifying sections of the national GBV study from text and numerical report content. It uses TF-IDF features, numeric imputation, scaling, a combined feature matrix, and a Random Forest demonstration.

## Browser interfaces

### 1. Standalone interactive map

The standalone map is in `interactive_map/` and is the recommended download for map demonstrations. It provides:

- Interactive station markers across South Africa
- High-risk and medium-high-risk marker colors
- Province filtering
- Year filtering for `2022` through `2026` and combined `TOTAL`
- Clickable station details
- Active station and case totals
- A reset control to refit the visible stations
- Responsive desktop and mobile layout

The standalone package is intentionally portable. `index.html`, `styles.css`, and `app.js` are sufficient to display the station records when downloaded together. The station records are embedded in `app.js`, so the page does not depend on a repository-relative CSV when opened directly from disk. When served from the repository, the source CSV remains available for data maintenance and comparison.

### 2. Ubuntu / GBV chatbot dashboard

The `chatbot/` interface combines:

- Report question lookup
- Evidence matches from the loaded report
- Basic keyword-based intent detection
- Basic emotion-signal detection
- Emergency escalation responses
- Support-resource signposting
- An embedded station-risk view
- Links to the standalone map

The assistant is a transparent browser-side baseline. It searches report fields and returns matching findings; it is not connected to a hosted large language model and should not be treated as professional advice.

## Run locally

Use a local web server so the browser can load the report and CSV files with `fetch()`. From the repository root:

```bash
python3 -m http.server 4173
```

Open the chatbot dashboard:

```text
http://localhost:4173/chatbot/
```

Open the standalone map:

```text
http://localhost:4173/interactive_map/
```

Stop the server with `Ctrl+C`.

### Downloaded standalone map

To run the standalone map on another computer:

1. Download `interactive_map/index.html`, `interactive_map/styles.css`, and `interactive_map/app.js`.
2. Put the three files in the same folder.
3. Open `index.html` in a browser.

The downloaded map includes embedded station data and a fallback renderer. Internet access improves the experience by loading Leaflet and OpenStreetMap tiles, but the station view remains available if those external resources are blocked. For the latest repository CSV rather than the embedded snapshot, run the project through the local server.

## Interface connections

### Chatbot dashboard

```text
chatbot/index.html
    ├── styles.css
    └── app.js
         ├── ../datasets/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt
         └── ../extracted_datasets/GBV Dataset.csv
```

### Standalone map

```text
interactive_map/index.html
    ├── styles.css
    └── app.js
         └── embedded station records
```

## Safety and ethics

The project follows a privacy-first prototype approach:

- No chat conversation is saved by the browser interface.
- The map displays aggregated station-level records, not personal information.
- The map is not an individual risk assessment.
- Report figures describe study populations and should not be generalized to every person.
- Model outputs may contain bias, uncertainty, and source-data limitations.
- Crime statistics may reflect reporting, recording, geographic, and temporal differences.

The interface provides these South African contacts for basic signposting:

- Police or emergency: `10111` or `112`
- GBV Command Centre: `0800 428 428`
- SMS / Please Call Me: `*120*7867#`

In an immediate emergency, contact local emergency services or move to a safer place if possible.

## External dependencies

The browser interfaces use:

- Leaflet `1.9.4` for map rendering when available
- OpenStreetMap tiles for the map background
- Google Fonts for interface typography
- The browser Fetch API for server-based data loading

No JavaScript package manager or build step is required. Python 3 is only needed for the recommended local static server. The notebooks require a Python environment with their referenced data-science libraries.

## Validation completed

The interfaces have been checked with:

```bash
node --check chatbot/app.js
node --check interactive_map/app.js
git diff --check
```

The map package has also been checked for:

- Correct local HTML-to-CSS and HTML-to-JavaScript references
- Reachable server-based dataset paths
- 30 embedded station records
- Valid station coordinates
- A fallback rendering path when Leaflet cannot initialize
- Clean editor error checks for the HTML, CSS, JavaScript, and README files

## Troubleshooting

### The map is blank when opening a downloaded file

Confirm that the three files are in the same folder and that the downloaded copy includes the latest `app.js`. The current standalone version embeds station data and should not need the repository CSV to render. Refresh the browser after replacing the files.

### The map tiles do not appear

Leaflet and OpenStreetMap tiles are external resources. Check the computer's internet connection or browser network restrictions. The fallback renderer can still show station markers without map tiles.

### The chatbot cannot load its report or station data

Start the server from the repository root, not from inside `chatbot/`:

```bash
python3 -m http.server 4173
```

Then use `http://localhost:4173/chatbot/` rather than opening the HTML with a `file://` URL.

### The CSV has been updated

Update the source CSV and refresh the server-based map. If the standalone downloaded map must contain the new records, update the embedded station records in `interactive_map/app.js` as well.

## Project status

Completed prototype work includes:

- Public dataset collection and repository organization
- Data cleaning and feature-engineering notebooks
- Baseline hotspot and risk-classification workflows
- Browser chatbot interface with safety-oriented responses
- Integrated station-risk dashboard view
- Standalone interactive map
- Download-compatible embedded station data
- Responsive HTML/CSS/JavaScript interfaces
- Documentation for the chatbot and map components
- GitHub publication on the `main` branch

The next development stage is to connect evaluated clustering and classification outputs to the interface, add model uncertainty and evaluation reporting, and improve reproducibility with a formal environment specification and automated tests.

## Related documentation

- [`chatbot/README.md`](chatbot/README.md) - chatbot and dashboard details
- [`interactive_map/README.md`](interactive_map/README.md) - standalone map details
- [`python_notebooks/`](python_notebooks/) - analysis and modeling notebooks
