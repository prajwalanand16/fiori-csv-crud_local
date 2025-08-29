# CSV CRUD Fiori Sample

A minimal SAPUI5 (Fiori) front-end with a Node.js/Express backend that performs CRUD on a local CSV file (`data/items.csv`).

## Prereqs
- Node.js 18+
- VS Code
- (Optional) UI5 CLI globally: `npm i -g @ui5/cli`

## Setup
```bash
cd fiori-csv-crud
npm install
```

## Run (two services in one command)
```bash
npm start
```
- Backend: http://localhost:3000/api
- UI5 app: http://localhost:8080/index.html

If you prefer, run them separately in two terminals:
```bash
npm run server   # starts Express backend on :3000
npm run ui       # starts UI5 tooling dev server on :8080
```

## CSV
Initial data is at `data/items.csv` with headers `id,name,price,quantity`. The server will auto-create it if missing.

## Notes
- CORS is enabled; the UI calls the API directly at `http://localhost:3000`.
- IDs for new items are auto-generated if left empty.
- This is a demo; for production you'd add validation, logging, locking, etc.
