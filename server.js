/* Simple Express backend for CSV CRUD */
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { stringify } = require("csv-stringify/sync");

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, "data");
const CSV_PATH = path.join(DATA_DIR, "items.csv");

app.use(cors());
app.use(express.json());

function ensureCsvExists() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CSV_PATH)) {
    const header = "id,name,price,quantity\n";
    const sample = [
      "1,Notebook,120,5",
      "2,Pen,15,100",
      "3,Backpack,1599,12"
    ].join("\n");
    fs.writeFileSync(CSV_PATH, header + sample + "\n", "utf8");
  }
}

function readCsv() {
  ensureCsvExists();
  const content = fs.readFileSync(CSV_PATH, "utf8");
  if (!content.trim()) return [];
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true
  });
  // Normalize types
  return records.map(r => ({
    id: String(r.id).trim(),
    name: String(r.name ?? "").trim(),
    price: Number(r.price ?? 0),
    quantity: Number(r.quantity ?? 0)
  }));
}

function writeCsv(items) {
  const data = stringify(items, {
    header: true,
    columns: ["id","name","price","quantity"]
  });
  fs.writeFileSync(CSV_PATH, data, "utf8");
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/items", (req, res) => {
  try {
    const items = readCsv();
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to read CSV." });
  }
});

app.get("/api/items/:id", (req, res) => {
  try {
    const items = readCsv();
    const item = items.find(i => i.id === String(req.params.id));
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to read CSV." });
  }
});

app.post("/api/items", (req, res) => {
  try {
    const items = readCsv();
    const body = req.body || {};
    // Generate next id if missing
    let id = String(body.id || "");
    if (!id) {
      const max = items.reduce((m, i) => Math.max(m, Number(i.id) || 0), 0);
      id = String(max + 1);
    } else if (items.some(i => i.id === id)) {
      return res.status(400).json({ error: "ID already exists" });
    }
    const newItem = {
      id,
      name: String(body.name || "").trim(),
      price: Number(body.price || 0),
      quantity: Number(body.quantity || 0)
    };
    items.push(newItem);
    writeCsv(items);
    res.status(201).json(newItem);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to write CSV." });
  }
});

app.put("/api/items/:id", (req, res) => {
  try {
    const items = readCsv();
    const id = String(req.params.id);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    const body = req.body || {};
    items[idx] = {
      id,
      name: String(body.name ?? items[idx].name).trim(),
      price: Number(body.price ?? items[idx].price),
      quantity: Number(body.quantity ?? items[idx].quantity)
    };
    writeCsv(items);
    res.json(items[idx]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to write CSV." });
  }
});

app.delete("/api/items/:id", (req, res) => {
  try {
    const items = readCsv();
    const id = String(req.params.id);
    const remaining = items.filter(i => i.id !== id);
    if (remaining.length === items.length) {
      return res.status(404).json({ error: "Not found" });
    }
    writeCsv(remaining);
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to write CSV." });
  }
});

app.listen(PORT, () => {
  ensureCsvExists();
  console.log(`CSV CRUD backend listening on http://localhost:${PORT}`);
});
