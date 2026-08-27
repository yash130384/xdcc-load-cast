import { describe, it, expect, beforeEach, vi } from "vitest";
import path from "path";
import express from "express";
import { appState, setWss, setApp } from "../state.js";
import { registerAllRoutes } from "../routes/index.js";
import { HttpDownloader } from "../http-downloader.js";

describe("HttpDownloader Queued Support", () => {
  it("initializes in queued state when initialStatus is queued", () => {
    const dl = new HttpDownloader({
      id: "test-dl-1",
      url: "http://example.com/stream/1.mp4",
      filename: "Test S01E01.mp4",
      initialStatus: "queued"
    });

    expect(dl.status).toBe("queued");
    expect(dl.isHttp).toBe(true);
  });

  it("can transition to queued with setQueued()", () => {
    const dl = new HttpDownloader({
      id: "test-dl-2",
      url: "http://example.com/stream/2.mp4",
      filename: "Test S01E02.mp4"
    });

    let lastProgress = null;
    dl.on("progress", (data) => {
      lastProgress = data;
    });

    dl.setQueued();
    expect(dl.status).toBe("queued");
    expect(lastProgress?.status).toBe("queued");
  });
});

describe("Batch Download and Sequential Queue", () => {
  let app;

  beforeEach(() => {
    appState.downloadQueue = new Map();
    appState.appConfig = { downloadDir: path.join(process.cwd(), 'downloads') };
    app = express();
    app.use(express.json());
    setApp(app);
    setWss({ clients: new Set() });
    registerAllRoutes(app);
  });

  it("rejects empty items array in /api/xtream/download-batch", async () => {
    let statusCode = 0;
    let jsonBody = null;
    const req = { body: { items: [] } };
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonBody = data; return res; }
    };

    const routeLayer = app._router.stack.find(
      (layer) => layer.route && layer.route.path === "/api/xtream/download-batch" && layer.route.methods.post
    );

    expect(routeLayer).toBeDefined();
    await routeLayer.route.stack[0].handle(req, res);

    expect(statusCode).toBe(400);
    expect(jsonBody.error).toBeDefined();
  });

  it("accepts multiple items in /api/xtream/download-batch and sets them in queue sequentially", async () => {
    let jsonBody = null;
    const req = {
      body: {
        items: [
          { url: "http://example.com/series/user/pass/101.mp4", title: "S01E01 - Pilot", seriesTitle: "Show" },
          { url: "http://example.com/series/user/pass/102.mp4", title: "S01E02 - Ep2", seriesTitle: "Show" },
          { url: "http://example.com/series/user/pass/103.mp4", title: "S01E03 - Ep3", seriesTitle: "Show" }
        ]
      }
    };
    const res = {
      status: () => res,
      json: (data) => { jsonBody = data; return res; }
    };

    const routeLayer = app._router.stack.find(
      (layer) => layer.route && layer.route.path === "/api/xtream/download-batch" && layer.route.methods.post
    );

    await routeLayer.route.stack[0].handle(req, res);

    expect(jsonBody.success).toBe(true);
    expect(jsonBody.count).toBe(3);
    expect(appState.downloadQueue.size).toBe(3);

    const queueItems = Array.from(appState.downloadQueue.values());
    // First item starts downloading or connecting
    expect(["connecting", "dcc_downloading"]).toContain(queueItems[0].downloader.status);
    // Subsequent items are queued
    expect(queueItems[1].downloader.status).toBe("queued");
    expect(queueItems[2].downloader.status).toBe("queued");

    // Clean up
    queueItems.forEach(item => item.downloader.cleanup());
  });
});
