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
- Quick-action cards for support, study findings, and reporting information
- A rotating study snapshot, one-tap emergency contacts, and tabbed support resources

The assistant uses local report data and a transparent keyword-scoring baseline. It is not connected to a hosted large language model or a clinical decision system.

The station-risk dashboard is not part of the assistant page. Use the standalone map at [`interactive_map/`](../interactive_map/) to explore GBV station data; its documentation is in [`interactive_map/README.md`](../interactive_map/README.md).

## Folder contents

| File | Purpose |
| --- | --- |
| `index.html` | Assistant interface and emergency contacts |
| `styles.css` | Dashboard typography, layout, responsive behavior, and component styling |
| `app.js` | Report loading, question answering, and support signals |
| `README.md` | Documentation for this interface |

## Data connections

The assistant loads the study report and optional conversational examples relative to this folder:

```text
../data/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt
../../text_data.txt
```

The report file is required and is parsed as comma-separated data with fields such as `section`, `indicator`, `value`, `value_type`, and `notes`. Conversational examples support simple follow-up exchanges but are optional; if they cannot be reached, study-based questions remain enabled.

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

1. `loadReport()` fetches the report and enables the composer when it is ready; conversational examples are loaded separately as an optional enhancement.
2. The report CSV is parsed into `state.records`.
3. `predictSupportSignals()` scores simple intent and emotion keywords.
4. `answerFor()` searches report fields for words from the question and returns the highest-scoring matches.
5. Emergency and support-related inputs receive dedicated safety responses before report lookup.
6. The assistant loads `../../text_data.txt` for conversational examples and keeps the last eight user turns in memory for greetings, thanks, and follow-up questions such as `tell me more`; refreshing the page clears this context.

The assistant does not save conversations. All processing in `app.js` occurs in the browser.

## Step-by-step build and tools

1. Create the assistant structure in `index.html` with the conversation panel, quick-action cards, emergency contacts, and support tabs.
2. Load the report and conversation examples with the browser Fetch API from the relative paths in **Data connections**.
3. Parse the report with the browser's JavaScript string/array APIs.
4. Normalize each question, score keyword-based intents and emotion signals, and search report fields for matching evidence.
5. Handle emergency language before report lookup and return South African support contacts without sending data to a server.
6. Store a short in-memory conversation context so greetings, thanks, and follow-up questions receive natural responses.
7. Render the user question, assistant reply, confidence metadata, and escaped report evidence into the message list.
8. Serve the folder with Python's static HTTP server and test loading, questions, emergency language, and follow-ups.

### Tools and APIs

| Tool/API | Use |
| --- | --- |
| Browser Fetch API | Loads the required local report and optional conversation examples. |
| JavaScript DOM API | Handles form submission, quick actions, resource tabs, message rendering, and in-memory conversation state. |
| Google Fonts CSS API | Loads Manrope and DM Mono typography. |
| Python `http.server` | Serves local files so browser Fetch requests work. |

No backend, API key, hosted AI model, or live SAPS API is used by the assistant. The chatbot is a transparent keyword-search baseline grounded in the repository report.

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
