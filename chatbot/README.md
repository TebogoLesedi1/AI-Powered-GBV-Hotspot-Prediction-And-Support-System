# Ubuntu / GBV Chatbot and Research Dashboard

This folder contains the browser-based user interface for the AI-Powered GBV Hotspot Prediction and Support System. It combines a grounded report assistant with a station-level research view for exploring reported GBV-related case totals in South Africa.

The interface is designed for research and educational use. It does not diagnose, predict an individual's risk, identify victims, or replace emergency, medical, legal, or professional support.

## What is included

### Report assistant

The assistant provides a lightweight, browser-based way to search findings from the South African National Gender-Based Violence Study. It supports:

- Natural-language questions about the loaded report
- Evidence matches showing the relevant report indicators and notes
- Basic intent detection for report lookup, resources, emotional support, and emergencies
- Basic emotion signals for fear, distress, and anxiety
- Safety-first responses for urgent language
- South African emergency and GBV support contacts
- Quick prompts for common research topics

The assistant uses local report data and a transparent keyword-scoring baseline. It is not connected to a hosted large language model or a clinical decision system.

### Embedded station-risk view

The right-hand panel includes a research visualization of station records from the GBV dataset. It provides:

- Risk-colored station markers
- Province filtering
- Year filtering for `2022` through `2026` and the combined `TOTAL`
- Clickable marker details
- Visible station and case totals
- A short ranked list of stations for the active filter

The full-screen version is available in [`interactive_map/`](../interactive_map/). Its complete documentation is in [`interactive_map/README.md`](../interactive_map/README.md).

## Folder contents

| File | Purpose |
| --- | --- |
| `index.html` | Dashboard layout, assistant interface, safety panel, and embedded station view |
| `styles.css` | Dashboard typography, layout, responsive behavior, and component styling |
| `app.js` | Report loading, CSV parsing, question answering, support signals, station filtering, and map rendering |
| `README.md` | Documentation for this interface |

## Data connections

The application loads both sources relative to this folder:

```text
../datasets/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt
../extracted_datasets/GBV Dataset.csv
```

The report file is parsed as comma-separated data and is expected to contain fields such as `section`, `indicator`, `value`, `value_type`, and `notes`. The station file is semicolon-delimited and contains:

| Field | Description |
| --- | --- |
| `Province` | Province containing the station |
| `Station` | Police station name |
| `Latitude` / `Longitude` | Station coordinates |
| `Risk` | Source risk label, currently `High` or `Med-high` |
| `2022`–`2026` | Reported yearly case totals |
| `TOTAL` | Combined cases for the available years |

Station summary rows without coordinates are excluded from plotted markers. The page uses the station dataset as provided; it does not recalculate the source risk labels.

## Run locally

Use a local web server because the browser must load the report and station files with `fetch()`. Opening `index.html` directly from the filesystem can cause browser security errors.

From the repository root:

```bash
python3 -m http.server 4173
```

Open the dashboard at:

```text
http://localhost:4173/chatbot/
```

Open the standalone map at:

```text
http://localhost:4173/interactive_map/
```

Stop the server with `Ctrl+C` in the terminal.

## How the assistant works

1. `loadReport()` fetches the report and station files.
2. The report CSV is parsed into `state.records`.
3. The station data is parsed into `state.stations`.
4. `predictSupportSignals()` scores simple intent and emotion keywords.
5. `answerFor()` searches report fields for words from the question and returns the highest-scoring matches.
6. Emergency and support-related inputs receive dedicated safety responses before report lookup.
7. `renderStations()` filters station records and renders the embedded map, markers, popup details, totals, and ranked list.

The assistant does not save conversations. All processing in `app.js` occurs in the browser.

## Safety information

The interface includes the following South African contacts:

- Police or emergency: `10111` or `112`
- GBV Command Centre: `0800 428 428`
- SMS / Please Call Me: `*120*7867#`

These contacts are shown for basic signposting. In an immediate emergency, contact local emergency services or move to a safer place if possible.

## External resources

The interface uses the following external browser resources:

- Leaflet `1.9.4` for interactive map rendering
- OpenStreetMap tiles for the map background
- Google Fonts for the interface typography

The station and report data are served locally from this repository. Leaflet and map tiles require internet access. If Leaflet cannot initialize, the standalone map includes a data-backed fallback renderer so station records and filters can still be displayed.

## Troubleshooting

### The page does not load the report or stations

Make sure the server was started from the repository root, not from inside `chatbot/`. Confirm that both files exist at the paths listed in **Data connections**.

### The map area is blank

Refresh the page after the server starts and check the browser console. Confirm that the station CSV is reachable at:

```text
http://localhost:4173/extracted_datasets/GBV%20Dataset.csv
```

The standalone map has a fallback renderer for cases where Leaflet or its map tiles cannot initialize. A network connection is still needed for external Leaflet assets unless they are cached by the browser.

### The page is opened with a `file://` URL

Use the Python server URL instead. Local browser security rules commonly block `fetch()` requests from files opened directly from disk.

## Scope and limitations

This is a prototype research interface. The report assistant uses keyword matching rather than a trained language model. The station view visualizes supplied records rather than producing new clustering or supervised-model predictions. The displayed data is not live, may contain source-data limitations, and should be interpreted with the project's preprocessing, modeling, and ethics documentation.

## Related project areas

- [`interactive_map/`](../interactive_map/) - standalone station hotspot map
- [`python_notebooks/`](../python_notebooks/) - preprocessing, classification, emotional-support, and hotspot-analysis notebooks
- [`datasets/`](../datasets/) - source report and related datasets
- [`extracted_datasets/`](../extracted_datasets/) - processed CSV datasets used by the interfaces
