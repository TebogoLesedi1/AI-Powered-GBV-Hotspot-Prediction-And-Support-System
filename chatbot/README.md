# Ubuntu/GBV Chatbot

A browser-based GBV information and emotional-support chatbot grounded in the South African National Gender-Based Violence Study.

## Run locally

From the repository root:

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173/chatbot/>.

The app loads the report from `../datasets/` and station risk data from `../extracted_datasets/`. It includes report search, intent and emotion detection, emergency escalation, support resources, and station risk exploration.
