# SafeSouth Africa Frontend Handoff Guide

## Recommended presentation flow

1. Open `index.html` and introduce SafeSouth Africa.
2. Select **View Hotspot Map**. This opens `hotspot.html`, which embeds `interactive_map/`.
3. Demonstrate the map filters, station markers, and GBV dataset view.
4. Return home and select **S.H.E Assistant**. This opens `contact.html`, which embeds `chatbot/`.
5. Demonstrate a question, the grounded response, source references, and the assistant's station-risk panel.
6. Finish with Resources and About Us to explain the support context and project purpose.

## File connection map

### Main site

- `index.html` is the entry page. It links to `hotspot.html`, `resources.html`, `about.html`, and `contact.html`.
- `hotspot.html` embeds `interactive_map/index.html` through an iframe at `interactive_map/`.
- `contact.html` embeds `chatbot/index.html` through an iframe at `chatbot/`.
- `resources.html`, `about.html`, and `contact.html` use `script.js` for the shared menu behavior.
- The main pages use `style.css` for shared layout and `app-accessibility.css` for accessibility behavior.
- `resources.html` adds `resources.css`; `about.html` adds `about.css`; `contact.html` adds `contact.css`.

### Interactive map

- `interactive_map/index.html` loads `interactive_map/styles.css`, `../app-accessibility.css`, Leaflet from the CDN, and `interactive_map/app.js`.
- `interactive_map/app.js` loads `../data/GBV Dataset.csv` and renders the map and station-risk information.

### S.H.E chatbot

- `chatbot/index.html` loads `chatbot/styles.css`, `../app-accessibility.css`, Leaflet from the CDN, and `chatbot/app.js`.
- `chatbot/app.js` loads `../data/GBV Dataset.csv` and `../data/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt`.
- The chatbot uses the local report for grounded answers and the local CSV for station and risk information.

## Which archive to give a third party

- `frontend-complete.zip`: the complete working frontend. Use this for evaluation or deployment.
- `frontend-main-site.zip`: the main HTML pages, shared styles/scripts, both embedded apps, and their data dependencies.
- `frontend-chatbot.zip`: the chatbot page, chatbot assets, shared accessibility CSS, and the data files it reads.
- `frontend-interactive-map.zip`: the map page, map assets, shared accessibility CSS, and the dataset it reads.

For the simplest presentation, give the third party `frontend-complete.zip` and this guide. The smaller archives are useful when demonstrating one component separately.

## Run locally

From the directory containing the extracted `frontend/` folder, run:

```bash
python3 -m http.server 8000 --directory frontend
```

Open `http://localhost:8000` in a browser. A local server is required because the chatbot and map load CSV and text files with `fetch()`.

## Important handoff note

The navigation currently contains links to `donate.html`, but that file is not present in the frontend folder. Those links should be completed or removed before a production presentation.

The Leaflet CSS and JavaScript libraries are loaded from `unpkg.com`, so the map and chatbot map panel require internet access unless Leaflet is later bundled locally.
