# SafeSouth Africa Frontend

This folder contains the static web frontend for the SafeSouth Africa GBV hotspot prediction and support system.

## What Is Included

- `index.html`: Homepage with project overview and links to the main tools.
- `hotspot.html`: Hotspot map page that embeds the interactive map.
- `contact.html`: Ubuntu GBV assistant page that embeds the chatbot.
- `resources.html`: GBV support resources and emergency contacts.
- `about.html`: Project purpose, methodology, and limitations.
- `chatbot/`: Chatbot interface and client-side report lookup logic.
- `community-chat.html`, `community-chat.css`, and `community-chat.js`: Local-only preview of anonymous, topic-based peer support.
- `interactive_map/`: Interactive station hotspot map and filters.
- `data/`: Report and station data loaded by the embedded tools.
- `style.css`, `contact.css`, `about.css`, and `resources.css`: Page styling.
- `script.js`: Shared responsive navigation menu behavior.
- `app-accessibility.css`: Accessibility states and focus styling.

## Main Features

- Responsive navigation with a desktop menu and mobile hamburger menu.
- Homepage links to the chatbot and GBV hotspot map.
- Chatbot answers questions using the loaded GBV study report and provides safety-focused responses.
- Hotspot map displays station locations, risk levels, province filters, year filters, station totals, and map markers.
- Emergency support details are shown throughout the relevant pages.
- Peer-support preview uses temporary aliases and in-memory messages, with local report/mute controls, limited text masking, and a quick exit. It is not a live room, moderation service, or confidential crisis service; hosting infrastructure may still receive connection metadata.
- The map uses a self-contained geographic SVG renderer and does not depend on third-party map tiles.

## Run Locally

Because the chatbot and map load local data with `fetch`, serve this folder through a local HTTP server instead of opening the HTML files directly.

From the repository root:

```bash
python3 -m http.server 8000 --directory frontend
```

Open the homepage at:

```text
http://localhost:8000/
```

Useful pages:

- `http://localhost:8000/hotspot.html`
- `http://localhost:8000/contact.html`
- `http://localhost:8000/chatbot/`
- `http://localhost:8000/community-chat.html`
- `http://localhost:8000/interactive_map/`

## Build Steps and APIs

1. Prepare the semicolon-delimited `data/GBV Dataset.csv` with province, station, coordinates, risk, yearly counts, and total fields.
2. Keep valid station coordinates and embed the current station snapshot in `interactive_map/app.js` for downloaded, offline-friendly use.
3. Create the controls and map container in `interactive_map/index.html`.
4. Populate filters and render accessible HTML markers over the local geographic SVG in `drawMap()`.
5. Use the selected year for totals and popups, and refit the map to the visible markers after filtering.
6. Keep the renderer local so the map remains visual when external tile servers are blocked.
7. Serve the frontend over HTTP and test `hotspot.html` plus the standalone `/interactive_map/` page.

The map uses browser SVG and DOM APIs for its geographic visualization and the browser Fetch API for the local CSV. Google Fonts supplies the interface fonts. No tile server, API key, backend, build tool, or live crime-data API is used; the map is driven by the repository dataset and embedded station snapshot.

## Data Notes

The chatbot loads the report from `data/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt` and station data from `data/GBV Dataset.csv`. Keep these relative paths intact when moving files or deploying the frontend.

The map is a research visualization of reported station totals. It is not an individual risk prediction and should not be used as a substitute for emergency or professional support.

## Peer-Support Preview Limits

The community page is a frontend prototype only. It does not connect people to a shared room, transmit reports to moderators, or provide server-side message filtering, crisis response, or IP-log controls. Messages and mute choices exist only in the current page memory and are cleared when the page is refreshed or exited. Client-side personal-information masking is best-effort and can miss identifying details. A production service requires a reviewed backend, privacy-preserving operational logging, moderation and escalation coverage, retention limits, and security testing before it is appropriate for sensitive peer support.
