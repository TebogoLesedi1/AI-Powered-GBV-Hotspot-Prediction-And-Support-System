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
- `auth.js`, `firebase-config.js`: Optional Firebase email/password accounts; all feature pages remain public.
- `app-accessibility.css`: Accessibility states and focus styling.

## Main Features

- Responsive navigation with a desktop menu and mobile hamburger menu, including a link to Peer Support.
- Homepage links to the chatbot and GBV hotspot map.
- Chatbot answers questions using the loaded GBV study report and provides safety-focused responses.
- Hotspot map displays station locations, dataset risk levels, province and year filters, station totals, and map markers.
- Emergency support details are shown throughout the relevant pages.
- Peer-support preview requires users to create or confirm a temporary alias before composing messages. It uses in-memory messages, local report/mute controls, limited text masking, and a quick exit. It is not a live room, moderation service, or confidential crisis service; hosting infrastructure may still receive connection metadata.
- The map uses Leaflet with Esri map tiles when available and falls back to a locally rendered SVG map.

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
2. Keep valid station coordinates and update the embedded station snapshot in `interactive_map/app.js` together with `data/GBV Dataset.csv`.
3. Create the controls and map container in `interactive_map/index.html`.
4. Populate filters and render station markers on the Leaflet map or the SVG fallback in `drawMap()`.
5. Use the selected year for totals and popups, and refit the map to the visible markers after filtering.
6. Keep the SVG fallback available so the map remains usable when external tile servers are blocked.
7. Serve the frontend over HTTP and test `hotspot.html` plus the standalone `/interactive_map/` page.

The map uses Leaflet and Esri World Gray tiles when available, with a browser SVG fallback. Its current station snapshot is embedded in `interactive_map/app.js`; the browser Fetch API loads `data/GBV Dataset.csv` only when that snapshot is removed. Google Fonts and the Leaflet/Esri services require internet access. The map is not a live crime-data feed.

## Data Notes

The chatbot loads the report from `data/full-report-the-first-south-african-national-gender-based-violence-study-2022.txt` and station data from `data/GBV Dataset.csv`. Keep these relative paths intact when moving files or deploying the frontend.

The map is a research visualization of reported station totals. It is not an individual risk prediction and should not be used as a substitute for emergency or professional support.

## Optional Accounts

All pages and features remain public; signing in is optional. The `signup.html` account page provides both sign-in and account creation and uses the shared Firebase Authentication setup. Firebase stores the account email and full name, manages the password, and keeps the sign-in session in the browser so it can be restored on later visits.

1. Create a Firebase project and add a Web app.
2. Enable **Email/Password** under **Authentication → Sign-in method**.
3. Copy the web app's `apiKey`, `authDomain`, `projectId`, and `appId` values into `firebase-config.js`.
4. Add the development and production site domains to **Authentication → Settings → Authorized domains**.
5. Serve the repository over HTTP, open the homepage, and create an account.

An account retains its email and full name in Firebase Authentication, and the browser keeps the sign-in session across visits. The site does not save peer-support messages, chatbot conversations, or other feature activity to an account; peer-support messages remain in the current tab's memory. Do not enter sensitive personal information into these previews.

## Peer-Support Preview Limits

The community page is available at `/community-chat.html` when serving the `frontend/` directory, or `/frontend/community-chat.html` when serving the repository root. Users must choose a temporary alias or generate a suggestion and confirm it before composing a message.

The page is a frontend prototype only. It does not connect people to a shared room, transmit reports to moderators, or provide server-side message filtering, crisis response, or IP-log controls. Before entering, the alias prompt warns users not to share names, contact details, or location information and explains that peer support is not counselling or confidential service. It includes an Exit peer support action, and Quick Exit remains available in the sticky page header. Messages and mute choices exist only in the current page memory and are cleared when the page is refreshed or exited. Client-side personal-information masking is best-effort and can miss identifying details. A production service requires a reviewed backend, privacy-preserving operational logging, moderation and escalation coverage, retention limits, and security testing before it is appropriate for sensitive peer support.
