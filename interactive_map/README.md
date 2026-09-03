# Interactive GBV Hotspot Map

The `interactive_map` folder contains a standalone browser interface for exploring GBV station-level records in South Africa. It complements the conversational assistant in `chatbot/` by providing a geographic view of reported case totals and the risk labels included in the project dataset.

> This is a research visualization. It does not predict an individual's risk, identify victims, or replace emergency, medical, legal, or professional support services.

## Features

- Interactive Leaflet map centered on South Africa
- Risk-colored markers for stations classified as `High` or `Med-high`
- Province filter for narrowing the visible stations
- Year filter for `2022`, `2023`, `2024`, `2025`, `2026`, or the combined `TOTAL`
- Clickable markers with station, province, risk, and case-count details
- Automatic station and case totals for the active filters
- Reset control that fits the map to the currently visible stations
- Responsive layout for desktop and mobile screens
- Link back to the GBV support assistant

## Folder contents

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, controls, map container, and external Leaflet assets |
| `styles.css` | Responsive layout, map presentation, filters, statistics, and legend styles |
| `app.js` | Dataset loading, semicolon-delimited CSV parsing, marker rendering, filtering, and popups |

## Data source

The map loads the dataset at:

```text
../extracted_datasets/GBV Dataset.csv
```

The CSV uses semicolons as delimiters and contains these fields:

| Field | Description |
| --- | --- |
| `Province` | South African province for the station |
| `Station` | Police station name |
| `Latitude` | Station latitude |
| `Longitude` | Station longitude |
| `Risk` | Dataset risk label, currently `High` or `Med-high` |
| `2022`–`2026` | Reported cases for each year |
| `TOTAL` | Combined reported cases for the available years |

Rows without a station name or usable latitude and longitude are excluded from the map. Province summary rows and the national total are therefore not plotted as station markers.

## Run locally

Because the page uses `fetch()` to load the CSV, run it through a local web server instead of opening `index.html` directly from the filesystem.

From the repository root:

```bash
python3 -m http.server 4173
```

Open the standalone map at:

```text
http://localhost:4173/interactive_map/
```

The integrated dashboard remains available at:

```text
http://localhost:4173/chatbot/
```

Stop the server with `Ctrl+C` in the terminal.

## How to use the map

1. Open the standalone map URL.
2. Select a province, or leave `All provinces` selected.
3. Select the year or `Total · 2022–2026` from `Cases shown`.
4. Select a marker to view the station details.
5. Use the map controls to zoom and pan. Use the target button to refit the map to the active station selection.

The marker color represents the source dataset's risk label. The selected year changes the case count shown in popups and the total displayed above the map; it does not recalculate the risk label.

## Technical notes

- The page uses Leaflet `1.9.4` from the unpkg CDN and OpenStreetMap tiles.
- No build tool, package manager, or backend service is required.
- The app parses the semicolon-delimited CSV in the browser.
- Popup values are HTML-escaped before being inserted into the page.
- Internet access is required for Leaflet assets and map tiles. The station CSV is served locally by the Python server.

## Troubleshooting

### The map is blank

Confirm that the server was started from the repository root and that the URL includes `/interactive_map/`. Opening the HTML file directly with a `file://` URL prevents the browser from loading the CSV through `fetch()`.

### The station data does not load

Check that `extracted_datasets/GBV Dataset.csv` exists and that its path has not changed. The browser developer console will show `Station dataset unavailable` when the CSV request fails.

### The background map tiles do not appear

Check the browser's internet connection. Leaflet and OpenStreetMap tiles are external resources, while the station data itself is local.

## Scope and limitations

The map displays the records currently available in `GBV Dataset.csv`; it is not a live SAPS feed. Geographic clustering, supervised risk-model predictions, uncertainty estimates, and personal-level data are outside the scope of this interface. Interpret displayed totals alongside the project's preprocessing and modeling documentation.
