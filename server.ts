import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Parser from "rss-parser";
import axios from "axios";

const parser = new Parser();
const DATA_FILE = path.join(process.cwd(), "data.json");

// Initial data structure
const DEFAULT_DATA = {
  cities: [
    {
      id: "tucson",
      name: "Tucson, AZ",
      radioUrl: "https://www.broadcastify.com/webPlayer/22835",
      subtitle: "Dispatch",
      tagline: "Live Police, Interstate Traffic, and News",
      cameras: [
        "https://www.az511.gov/map/Cctv/789",
        "https://www.az511.gov/map/Cctv/790",
        "https://www.az511.gov/map/Cctv/791"
      ],
      feeds: [
        "https://www.kold.com/arc/outboundfeeds/rss/?outputType=xml",
        "https://www.kgun9.com/news.rss"
      ],
      theme: {
        primary: "#3b82f6",
        background: "#0f172a",
        text: "#f8fafc"
      }
    }
  ]
};

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
    return DEFAULT_DATA;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (e) {
    return DEFAULT_DATA;
  }
}

function saveData(data: any) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/config", (req, res) => {
    res.json(loadData());
  });

  app.post("/api/config", (req, res) => {
    saveData(req.body);
    res.json({ status: "ok" });
  });

  app.get("/api/news", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL required" });
    }
    try {
      const feed = await parser.parseURL(url);
      res.json(feed);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch feed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
