#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const PULSECAST_URL = (process.env.PULSECAST_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

function formatBytes(bytes) {
  if (!bytes || bytes === 0 || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function apiRequest(endpoint, options = {}) {
  const url = `${PULSECAST_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const errMsg = data?.error || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errMsg);
    }

    return data;
  } catch (err) {
    if (err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
      throw new Error(`PulseCast Server unter ${PULSECAST_URL} nicht erreichbar. Bitte sicherstellen, dass pulsecast.service läuft.`);
    }
    throw err;
  }
}

// MCP Server Initialisierung
const server = new McpServer({
  name: 'pulsecast-mcp-server',
  version: '1.0.0'
});

/**
 * TOOL 1: pulsecast_get_downloads
 * Listet aktive, wartende und abgeschlossene Downloads mit Status, Speed und Fortschritt auf.
 */
server.tool(
  'pulsecast_get_downloads',
  'Listet aktive, wartende und abgeschlossene Downloads von PulseCast mit aktuellem Status, Download-Geschwindigkeit, Fortschritt und ETA auf.',
  {
    filter: z.enum(['all', 'active', 'completed', 'queued', 'error'])
      .optional()
      .describe('Optionaler Filter nach Download-Status: all (Standard), active, completed, queued, error')
  },
  async ({ filter = 'all' }) => {
    try {
      const rawList = await apiRequest('/api/downloads');
      const allDownloads = Array.isArray(rawList) ? rawList : [];

      const activeStatuses = ['downloading', 'dcc_downloading', 'extracting', 'connecting', 'registering', 'joining', 'requesting'];
      const queuedStatuses = ['queued', 'dcc_negotiating'];
      const completedStatuses = ['completed'];
      const errorStatuses = ['error', 'cancelled'];

      let totalSpeedBytes = 0;
      const formattedList = allDownloads.map(dl => {
        const received = dl.bytesReceived || 0;
        const total = dl.expectedSize || 0;
        const speed = dl.speed || 0;
        const eta = dl.eta || null;

        if (activeStatuses.includes(dl.status)) {
          totalSpeedBytes += speed;
        }

        const progressPercent = total > 0 ? ((received / total) * 100).toFixed(1) + '%' : (dl.status === 'completed' ? '100%' : '0%');

        return {
          id: dl.id,
          filename: dl.filename || 'Unbenannt',
          status: dl.status,
          isHttp: !!dl.isHttp,
          isAuto: !!dl.isAuto,
          speedBytesPerSec: speed,
          speedFormatted: speed > 0 ? `${formatBytes(speed)}/s` : '0 B/s',
          etaSeconds: eta,
          etaFormatted: eta !== null && eta >= 0 ? `${Math.floor(eta / 60)}m ${eta % 60}s` : null,
          bytesReceived: received,
          expectedSize: total,
          progress: progressPercent,
          sizeReceivedFormatted: formatBytes(received),
          sizeExpectedFormatted: formatBytes(total),
          server: dl.server,
          channel: dl.channel,
          botName: dl.botName,
          packNumber: dl.packNumber,
          errorMessage: dl.errorMessage || null
        };
      });

      let filtered = formattedList;
      if (filter === 'active') {
        filtered = formattedList.filter(d => activeStatuses.includes(d.status));
      } else if (filter === 'completed') {
        filtered = formattedList.filter(d => completedStatuses.includes(d.status));
      } else if (filter === 'queued') {
        filtered = formattedList.filter(d => queuedStatuses.includes(d.status));
      } else if (filter === 'error') {
        filtered = formattedList.filter(d => errorStatuses.includes(d.status));
      }

      const summary = {
        total: allDownloads.length,
        filteredCount: filtered.length,
        activeCount: formattedList.filter(d => activeStatuses.includes(d.status)).length,
        queuedCount: formattedList.filter(d => queuedStatuses.includes(d.status)).length,
        completedCount: formattedList.filter(d => completedStatuses.includes(d.status)).length,
        errorCount: formattedList.filter(d => errorStatuses.includes(d.status)).length,
        totalSpeed: `${formatBytes(totalSpeedBytes)}/s`,
        downloads: filtered
      };

      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, ...summary }, null, 2) }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }]
      };
    }
  }
);

/**
 * TOOL 2: pulsecast_get_categories
 * Liefert alle Kategorien für Filme und Serien.
 */
server.tool(
  'pulsecast_get_categories',
  'Liefert alle verfügbaren Kategorien, Quellen und Genres für Filme und Serien aus dem PulseCast-Katalog.',
  {
    type: z.enum(['all', 'movies', 'series'])
      .optional()
      .describe('Filter nach Medientyp: all (Standard), movies, series')
  },
  async ({ type = 'all' }) => {
    try {
      const data = await apiRequest('/api/media/categories');

      let result = {
        counts: data.counts || {},
        mainCategories: [
          { id: 'all', label: 'Alle Medien' },
          { id: 'Filme', label: 'Filme (Stream)' },
          { id: 'Serien', label: 'Serien (Stream)' },
          { id: 'Lokal_Filme', label: 'Lokale Filme' },
          { id: 'Lokal_Serien', label: 'Lokale Serien' },
          { id: 'Live TV', label: 'Live TV' },
          { id: 'Musik', label: 'Musik' },
          { id: 'Hörbücher', label: 'Hörbücher' },
          { id: 'Favoriten', label: 'Favoriten' }
        ]
      };

      if (type === 'all' || type === 'movies') {
        result.movies = data.movies || { categories: [], count: 0 };
      }
      if (type === 'all' || type === 'series') {
        result.series = data.series || { categories: [], count: 0 };
      }
      if (type === 'all') {
        result.liveTv = data.liveTv || { categories: [], count: 0 };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify({ success: true, ...result }, null, 2) }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }]
      };
    }
  }
);

/**
 * TOOL 3: pulsecast_search_catalog
 * Durchsucht den VOD/Media-Katalog (Filme/Serien) nach Stichwort, Typ oder Kategorie.
 */
server.tool(
  'pulsecast_search_catalog',
  'Durchsucht den VOD- und Medienkatalog (Filme, Serien, lokale Medien) nach Stichwort, Typ oder Kategorie/Genre.',
  {
    query: z.string().optional().describe('Suchbegriff (z.B. Filmtitel, Serienname, Schauspieler, Dateiname)'),
    category: z.enum(['all', 'Filme', 'Serien', 'Lokal_Filme', 'Lokal_Serien', 'Live TV', 'Musik', 'Hörbücher', 'Favoriten'])
      .optional()
      .describe('Hauptkategorie (Standard: all)'),
    genre: z.string().optional().describe('Subkategorie oder Genre (z.B. Action, Komödie, Drama, Sci-Fi)'),
    limit: z.number().min(1).max(100).optional().describe('Maximale Anzahl Treffer (Standard: 25)'),
    page: z.number().min(1).optional().describe('Seitennummer für Paginierung (Standard: 1)')
  },
  async ({ query = '', category = 'all', genre = 'all', limit = 25, page = 1 }) => {
    try {
      const params = new URLSearchParams({
        search: query.trim(),
        category,
        subcategory: genre,
        limit: String(limit),
        page: String(page)
      });

      const data = await apiRequest(`/api/media-library?${params}`);
      const items = (data.items || []).map(item => {
        const isSeries = item.isGroup || item.category === 'Serien' || item.type === 'series';
        return {
          title: item.title || item.metadata?.title || item.filename,
          type: isSeries ? 'series' : (item.category === 'Filme' || item.type === 'movie' ? 'movie' : 'media'),
          isXtream: !!item.isXtream,
          streamId: item.streamId || item.xtreamSeriesId || item.metadata?.xtreamStreamId || null,
          category: item.category || item.metadata?.category || 'Sonstige',
          genre: item.metadata?.subcategory || item.subcategory || null,
          year: item.year || item.metadata?.year || null,
          cast: item.cast || item.metadata?.cast || null,
          imdbId: item.imdbId || item.metadata?.imdbId || null,
          filesCount: Array.isArray(item.files) ? item.files.length : 1,
          sizeBytes: item.sizeBytes || null,
          sizeFormatted: item.sizeBytes ? formatBytes(item.sizeBytes) : null,
          filename: item.filename || null
        };
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            query,
            category,
            genre,
            totalItems: data.totalItems || items.length,
            totalPages: data.totalPages || 1,
            currentPage: data.currentPage || page,
            resultsCount: items.length,
            items
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }]
      };
    }
  }
);

/**
 * TOOL 4: pulsecast_search_xdcc
 * Führt eine klassische XDCC-Suche durch und liefert Bot/Pack-Ergebnisse.
 */
server.tool(
  'pulsecast_search_xdcc',
  'Führt eine klassische XDCC-Suche über xdcc.eu und/oder das IRC-Netzwerk Moviegods durch und liefert Bot-Namen und Pack-Nummern für direkte Downloads.',
  {
    query: z.string().describe('Suchbegriff für XDCC (z.B. Release-Name, Film, Doku)'),
    source: z.enum(['both', 'xdcc', 'moviegods'])
      .optional()
      .describe('Suchquelle: xdcc (xdcc.eu), moviegods (IRC #moviegods) oder both (Standard: both)')
  },
  async ({ query, source = 'both' }) => {
    try {
      let results = [];

      if (source === 'both' || source === 'xdcc') {
        try {
          const xdccData = await apiRequest(`/api/search?q=${encodeURIComponent(query)}&source=xdcc`);
          const items = Array.isArray(xdccData?.results) ? xdccData.results : (Array.isArray(xdccData) ? xdccData : []);
          results.push(...items.map(r => ({
            source: 'xdcc.eu',
            server: r.server || 'irc.abjects.net',
            channel: r.channel || '#moviegods',
            botName: r.bot || r.botName || r.nick,
            packNumber: String(r.pack || r.packNumber || r.number || ''),
            filename: r.name || r.filename || '',
            size: r.size || '',
            gets: r.gets || null
          })));
        } catch (err) {
          if (source === 'xdcc') throw err;
        }
      }

      if (source === 'both' || source === 'moviegods') {
        try {
          const mgData = await apiRequest(`/api/search?q=${encodeURIComponent(query)}&source=moviegods`);
          const items = Array.isArray(mgData?.results) ? mgData.results : (Array.isArray(mgData) ? mgData : []);
          results.push(...items.map(r => ({
            source: 'Moviegods (IRC)',
            server: r.server || 'irc.abjects.net',
            channel: r.channel || '#moviegods',
            botName: r.bot || r.botName || r.nick,
            packNumber: String(r.pack || r.packNumber || r.number || ''),
            filename: r.name || r.filename || '',
            size: r.size || '',
            gets: r.gets || null
          })));
        } catch (err) {
          if (source === 'moviegods') throw err;
        }
      }

      // Valid results with packNumber and botName
      const validResults = results.filter(r => r.botName && r.packNumber && r.filename);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            query,
            source,
            totalFound: validResults.length,
            results: validResults
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }]
      };
    }
  }
);

/**
 * TOOL 5: pulsecast_start_download
 * Startet einen Download für einen VOD-Stream (stream_id / title / type) oder ein XDCC-Paket (bot, pack).
 */
server.tool(
  'pulsecast_start_download',
  'Startet einen Download in PulseCast: entweder für einen VOD-Stream (Xtream Codes VOD / Serie) oder für ein klassisches IRC-XDCC-Paket (Bot & Pack-Nummer).',
  {
    downloadType: z.enum(['vod', 'xdcc'])
      .describe('Typ des Downloads: vod (für Stream/Xtream) oder xdcc (für IRC-Dateien)'),
    // VOD parameters
    title: z.string().optional().describe('Titel des Films oder der Folge (erforderlich bei vod)'),
    stream_id: z.union([z.string(), z.number()]).optional().describe('Stream-ID aus dem Xtream VOD-Katalog (empfohlen bei vod)'),
    type: z.enum(['movie', 'series_episode']).optional().describe('Typ des VOD-Inhalts (movie oder series_episode)'),
    series_title: z.string().optional().describe('Serientitel (falls VOD-Episode einer Serie)'),
    stream_url: z.string().optional().describe('Direkte HTTP Stream-URL (optional)'),
    // XDCC parameters
    bot: z.string().optional().describe('IRC-Bot Name (z.B. MG-Movie-01, erforderlich bei xdcc)'),
    pack: z.union([z.string(), z.number()]).optional().describe('Pack-Nummer auf dem Bot (erforderlich bei xdcc)'),
    filename: z.string().optional().describe('Dateiname des Pakets (erforderlich bei xdcc)'),
    server: z.string().optional().describe('IRC-Server (Standard: irc.abjects.net)'),
    channel: z.string().optional().describe('IRC-Channel (Standard: #moviegods)'),
    use_ssl: z.boolean().optional().describe('SSL-Verbindung für IRC verwenden (Standard: true)')
  },
  async (params) => {
    try {
      if (params.downloadType === 'vod') {
        if (!params.title && !params.stream_id && !params.stream_url) {
          throw new Error('Für einen VOD-Download muss mindestens title oder stream_id angegeben werden.');
        }

        const payload = {
          title: params.title || `Stream_${params.stream_id}`,
          seriesTitle: params.series_title || undefined,
          streamUrl: params.stream_url || undefined,
          xtreamStreamId: params.stream_id ? String(params.stream_id) : undefined,
          isXtream: true
        };

        const res = await apiRequest('/api/media/download-stream', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'VOD-Download erfolgreich gestartet oder in die Warteschlange eingereiht.',
              downloadId: res.id,
              filename: res.filename,
              status: res.status,
              duplicate: !!res.duplicate
            }, null, 2)
          }]
        };
      } else if (params.downloadType === 'xdcc') {
        if (!params.bot || params.pack === undefined || !params.filename) {
          throw new Error('Für einen XDCC-Download sind bot, pack und filename erforderlich.');
        }

        const payload = {
          server: params.server || 'irc.abjects.net',
          channel: params.channel || '#moviegods',
          botName: params.bot,
          packNumber: String(params.pack),
          filename: params.filename,
          useSSL: params.use_ssl !== false
        };

        const res = await apiRequest('/api/download', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'XDCC-Download erfolgreich gestartet.',
              downloadId: res.id,
              status: res.status
            }, null, 2)
          }]
        };
      } else {
        throw new Error(`Unbekannter downloadType: ${params.downloadType}`);
      }
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }]
      };
    }
  }
);

/**
 * TOOL 6: pulsecast_control_download
 * Steuert Downloads (action: 'pause' | 'resume' | 'cancel', id: string).
 */
server.tool(
  'pulsecast_control_download',
  'Steuert bestehende Downloads in PulseCast: pausieren (pause), fortsetzen (resume) oder abbrechen/entfernen (cancel).',
  {
    id: z.string().describe('Die ID des Downloads (z.B. aus pulsecast_get_downloads)'),
    action: z.enum(['pause', 'resume', 'cancel']).describe('Aktion: pause, resume oder cancel')
  },
  async ({ id, action }) => {
    try {
      const res = await apiRequest(`/api/download/${encodeURIComponent(id)}/${action}`, {
        method: 'POST'
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            id,
            action,
            message: `Download '${id}' erfolgreich mit Aktion '${action}' ausgeführt.`
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({ success: false, error: error.message }) }]
      };
    }
  }
);

// Stdio Transport starten
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[PulseCast MCP Server] Läuft über StdioServerTransport.');
}

main().catch(err => {
  console.error('[PulseCast MCP Server] Fataler Fehler beim Start:', err);
  process.exit(1);
});
