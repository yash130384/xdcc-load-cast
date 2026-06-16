# PulseCast — Domain Glossary & Architecture Context

## Domain

PulseCast is a self-hosted media center hub that:

- **Searches** IRC networks (Moviegods) and XDCC indexing sites (xdcc.eu) for media files
- **Downloads** files via the DCC protocol (XDCC bots) or HTTP (Xtream Codes streams)
- **Organizes** downloaded media (RAR/TAR extraction, file flattening, deduplication)
- **Streams** to local and cast devices (Chromecast, DLNA, AirPlay)
- **Records** live TV channels via Xtream Codes EPG/VCR scheduling
- **Automates** episode downloading via IMDb-based auto-download subscriptions

## Key Concepts

| Term | Definition |
|------|------------|
| **XDCC** | eXtended DCC — an IRC-based file transfer protocol extension used by file-sharing bots |
| **DCC** | Direct Client-to-Client — IRC protocol for direct file transfer between clients |
| **Pack** | A numbered file package on an XDCC bot, requested via `/msg BotName XDCC SEND N` |
| **Moviegods** | German IRC XDCC network (#moviegods on irc.abjects.net) for media files |
| **xdcc.eu** | Web-based XDCC search index that aggregates packs from multiple IRC networks |
| **Xtream** | Xtream Codes — a commercial IPTV management panel providing live TV, VOD, and series via API |
| **VCR** | Videorekorder — scheduled recording of live TV streams from Xtream sources |
| **EPG** | Electronic Program Guide — TV schedule listings for Xtream live channels |
| **Cast** | Streaming media to a playback device (Chromecast, DLNA, AirPlay) |
| **Auto-Download** | IMDb-based subscription that automatically searches and downloads new episodes |
| **Tailscale** | VPN/mesh network — the app can bypass Tailscale for IRC/DCC traffic |

## System Architecture

```
Browser (React SPA) ←→ WebSocket + REST API ←→ Express Server ←→ IRC/DCC/HTTP/XTREAM
                              ↓
                     Cast Devices (CC/DLNA/AirPlay)
```

## Technical Stack

- **Backend**: Node.js (ES Modules), Express.js, ws (WebSocket)
- **Frontend**: React (JSX), Vite, CSS (custom dark theme)
- **Streaming**: ffmpeg (on-the-fly transcoding), HTTP Range Requests
- **Discovery**: chromecast-api, dlnacasts2, airplayer