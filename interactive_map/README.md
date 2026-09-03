# Interactive GBV Map

The interactive hotspot map is integrated into the dashboard at `chatbot/`.

## Run locally

From the repository root:

```bash
python3 -m http.server 4173
```

Open <http://localhost:4173/chatbot/>.

The map uses the station records in `extracted_datasets/GBV Dataset.csv`. It supports province and year filters, risk-colored station markers, clickable station details, and visible case totals.
