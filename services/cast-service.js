import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { appState, broadcastToClients } from '../state.js';
import { parseTimeStringToSeconds } from './file-utils.js';
import { getLocalIp } from './network.js';
import { checkAudioTranscodeNeeded } from './media-library.js';

export function attachDeviceStatusListeners(device, deviceName) {
  device.removeAllListeners('status');
  device.on('status', (status) => {
    console.log(`[Chromecast] Status update on ${deviceName}:`, status?.playerState);
    if (status && status.playerState === 'IDLE') {
      console.log(`[Chromecast] Playback IDLE on ${deviceName}. Clearing active cast.`);
      if (appState.activeCasts.has(deviceName)) {
        appState.activeCasts.delete(deviceName);
        broadcastActiveCasts();
      }
    }
  });

  if (device.client) {
    device.client.removeAllListeners('close');
    device.client.removeAllListeners('error');

    device.client.on('close', () => {
      console.log(`[Chromecast] Client connection closed for ${deviceName}`);
      if (appState.activeCasts.has(deviceName)) {
        appState.activeCasts.delete(deviceName);
        broadcastActiveCasts();
      }
    });

    device.client.on('error', (err) => {
      console.error(`[Chromecast] Client error on ${deviceName}:`, err.message);
      if (appState.activeCasts.has(deviceName)) {
        appState.activeCasts.delete(deviceName);
        broadcastActiveCasts();
      }
    });
  }
}

export function attachDlnaDeviceStatusListeners(device, deviceName) {
  device.removeAllListeners('status');
  device.on('status', (status) => {
    console.log(`[DLNA] Status update on ${deviceName}:`, status?.transportState);
    if (status) {
      const castInfo = appState.activeCasts.get(deviceName);
      if (castInfo) {
        let playerState = 'PLAYING';
        if (status.transportState === 'PAUSED_PLAYBACK') {
          playerState = 'PAUSED';
        } else if (status.transportState === 'STOPPED') {
          playerState = 'IDLE';
        }

        castInfo.playerState = playerState;
        if (status.relTime) {
          castInfo.currentTime = parseTimeStringToSeconds(status.relTime);
        }
        if (status.trackDuration) {
          castInfo.duration = parseTimeStringToSeconds(status.trackDuration);
        }
        if (status.volume !== undefined) {
          castInfo.volume = status.volume / 100;
        }

        appState.activeCasts.set(deviceName, castInfo);
        broadcastActiveCasts();

        if (playerState === 'IDLE') {
          console.log(`[DLNA] Playback STOPPED on ${deviceName}. Clearing active cast.`);
          appState.activeCasts.delete(deviceName);
          broadcastActiveCasts();
        }
      }
    }
  });
}

export function attachAirplayDeviceStatusListeners(device, deviceName) {
  device.removeAllListeners('event');
  device.on('event', (event) => {
    console.log(`[AirPlay] Status update on ${deviceName}:`, event);
    if (event) {
      const castInfo = appState.activeCasts.get(deviceName);
      if (castInfo) {
        if (event.state === 'playing') {
          castInfo.playerState = 'PLAYING';
        } else if (event.state === 'paused') {
          castInfo.playerState = 'PAUSED';
        } else if (event.state === 'stopped') {
          console.log(`[AirPlay] Playback STOPPED on ${deviceName}. Clearing active cast.`);
          appState.activeCasts.delete(deviceName);
          broadcastActiveCasts();
          return;
        }
        appState.activeCasts.set(deviceName, castInfo);
        broadcastActiveCasts();
      }
    }
  });
}

export function broadcastActiveCasts() {
  const list = Array.from(appState.activeCasts.entries()).map(([device, info]) => ({
    device,
    ...info
  }));
  const message = JSON.stringify({ type: 'activeCasts', data: list });
  appState.wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

export async function startCasting(deviceName, filePath, deviceType, fileUrl) {
  let device = appState.discoveredChromecasts.get(deviceName);
  let isDlna = false;
  let isAirplay = false;
  if (!device) {
    device = appState.discoveredDlnas.get(deviceName);
    if (device) {
      isDlna = true;
    } else {
      device = appState.discoveredAirplays.get(deviceName);
      if (device) {
        isAirplay = true;
      } else {
        throw new Error(`Gerät "${deviceName}" nicht im Netzwerk gefunden. Bitte Suche aktualisieren.`);
      }
    }
  }

  const filename = path.basename(filePath);

  console.log(`[Cast] Casting "${filename}" to "${deviceName}" via ${fileUrl} (isDlna: ${isDlna}, isAirplay: ${isAirplay})`);

  let contentType = 'video/mp4';
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.mkv') {
    const needsTranscode = await checkAudioTranscodeNeeded(filePath);
    contentType = needsTranscode ? 'video/mp4' : 'video/x-matroska';
  } else if (ext === '.avi') {
    contentType = 'video/mp4';
  } else if (ext === '.mp3') {
    contentType = 'audio/mpeg';
  } else if (ext === '.wav') {
    contentType = 'audio/wav';
  }

  return new Promise((resolve, reject) => {
    let responded = false;

    if (isDlna) {
      const performPlay = () => {
        device.play(fileUrl, {
          title: filename,
          type: contentType,
          autoPlay: false
        }, (err) => {
          if (responded) return;
          if (err) {
            responded = true;
            console.error(`[DLNA] Fehler beim Laden auf ${deviceName}:`, err);
            reject(new Error(`Streaming-Fehler: ${err.message}`));
            return;
          }

          setTimeout(() => {
            device.resume((resumeErr) => {
              if (resumeErr) {
                console.error(`[DLNA] Fehler beim Starten (Resume) auf ${deviceName}:`, resumeErr);
              }
            });
          }, 1500);

          responded = true;
          appState.activeCasts.set(deviceName, {
            filename,
            deviceType: 'dlna',
            playerState: 'PLAYING',
            currentTime: 0,
            duration: 0,
            volume: 1,
            muted: false
          });
          attachDlnaDeviceStatusListeners(device, deviceName);
          broadcastActiveCasts();
          resolve({ success: true, deviceName, filename });
        });
      };

      if (device.client) {
        device.stop(() => {
          setTimeout(performPlay, 1000);
        });
      } else {
        performPlay();
      }
    } else if (isAirplay) {
      device.play(fileUrl, (err) => {
        if (responded) return;
        responded = true;
        if (err) {
          console.error(`[AirPlay] Fehler beim Abspielen auf ${deviceName}:`, err);
          reject(new Error(`Streaming-Fehler: ${err.message}`));
          return;
        }
        appState.activeCasts.set(deviceName, {
          filename,
          deviceType: 'airplay',
          playerState: 'PLAYING',
          currentTime: 0,
          duration: 0,
          volume: 1,
          muted: false
        });
        attachAirplayDeviceStatusListeners(device, deviceName);
        broadcastActiveCasts();
        resolve({ success: true, deviceName, filename });
      });
    } else {
      device.play(fileUrl, { contentType }, (err) => {
        if (responded) return;
        responded = true;
        if (err) {
          console.error(`[Chromecast] Fehler beim Abspielen auf ${deviceName}:`, err);
          reject(new Error(`Streaming-Fehler: ${err.message}`));
          return;
        }
        appState.activeCasts.set(deviceName, {
          filename,
          deviceType: 'chromecast',
          playerState: 'BUFFERING',
          currentTime: 0,
          duration: 0,
          volume: 1,
          muted: false
        });
        attachDeviceStatusListeners(device, deviceName);
        broadcastActiveCasts();
        resolve({ success: true, deviceName, filename });
      });
    }
  });
}

export function stopCasting(deviceName) {
  appState.activeCasts.delete(deviceName);
  broadcastActiveCasts();

  const device = appState.discoveredChromecasts.get(deviceName);
  if (device && typeof device.stop === 'function') {
    device.stop((err) => {
      if (err) {
        console.error(`[Chromecast] Fehler beim Hintergrund-Stoppen auf ${deviceName}:`, err.message);
      }
    });
  } else {
    const dlnaDevice = appState.discoveredDlnas.get(deviceName);
    if (dlnaDevice && dlnaDevice.client && typeof dlnaDevice.stop === 'function') {
      dlnaDevice.stop((err) => {
        if (err) {
          console.error(`[DLNA] Fehler beim Hintergrund-Stoppen auf ${deviceName}:`, err.message);
        }
      });
    } else {
      const airplayDevice = appState.discoveredAirplays.get(deviceName);
      if (airplayDevice && typeof airplayDevice.stop === 'function') {
        airplayDevice.stop((err) => {
          if (err) {
            console.error(`[AirPlay] Fehler beim Hintergrund-Stoppen auf ${deviceName}:`, err.message);
          }
        });
      } else {
        console.log(`[Cast] Gerät "${deviceName}" für Stop nicht in Entdeckungsliste oder nicht aktiv.`);
      }
    }
  }
}

export function getActiveCasts() {
  return Array.from(appState.activeCasts.entries()).map(([device, info]) => ({
    device,
    ...info
  }));
}

export function playLocalFile(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      reject(new Error('Datei existiert nicht auf dem Datenträger'));
      return;
    }
    execFile('open', [filePath], (error) => {
      if (error) {
        console.error('[Playback] Fehler beim lokalen Öffnen der Datei:', error);
        reject(new Error(`Konnte die Datei nicht lokal abspielen: ${error.message}`));
        return;
      }
      resolve({ success: true });
    });
  });
}

// Periodic status check (every 8 seconds) to verify active casts are still playing
setInterval(() => {
  if (appState.activeCasts.size === 0) return;

  for (const [deviceName, castInfo] of appState.activeCasts.entries()) {
    const device = appState.discoveredChromecasts.get(deviceName);
    if (!device) {
      const dlnaDevice = appState.discoveredDlnas.get(deviceName);
      if (dlnaDevice) {
        dlnaDevice.status((err, status) => {
          if (err) {
            console.log(`[DLNA Check] Failed to get status for "${deviceName}": ${err.message}. Clearing active cast.`);
            appState.activeCasts.delete(deviceName);
            broadcastActiveCasts();
            return;
          }

          if (status) {
            const currentCast = appState.activeCasts.get(deviceName);
            if (currentCast) {
              let playerState = 'PLAYING';
              if (status.transportState === 'PAUSED_PLAYBACK') {
                playerState = 'PAUSED';
              } else if (status.transportState === 'STOPPED') {
                playerState = 'IDLE';
              }

              currentCast.playerState = playerState;
              if (status.relTime) {
                currentCast.currentTime = parseTimeStringToSeconds(status.relTime);
              }
              if (status.trackDuration) {
                currentCast.duration = parseTimeStringToSeconds(status.trackDuration);
              }
              if (status.volume !== undefined) {
                currentCast.volume = status.volume / 100;
              }

              if (playerState === 'IDLE') {
                appState.activeCasts.delete(deviceName);
              } else {
                appState.activeCasts.set(deviceName, currentCast);
              }
              broadcastActiveCasts();
            }
          }
        });
        return;
      }

      const airplayDevice = appState.discoveredAirplays.get(deviceName);
      if (airplayDevice) {
        airplayDevice.playbackInfo((err, resObj, body) => {
          if (err) {
            console.log(`[AirPlay Check] Failed to get status for "${deviceName}": ${err.message}. Clearing active cast.`);
            appState.activeCasts.delete(deviceName);
            broadcastActiveCasts();
            return;
          }
          if (body) {
            const currentCast = appState.activeCasts.get(deviceName);
            if (currentCast) {
              if (body.rate !== undefined) {
                currentCast.playerState = body.rate === 0 ? 'PAUSED' : 'PLAYING';
              }
              if (body.duration !== undefined) {
                currentCast.duration = body.duration;
              }
              if (body.position !== undefined) {
                currentCast.currentTime = body.position;
              }
              appState.activeCasts.set(deviceName, currentCast);
              broadcastActiveCasts();
            }
          } else {
            console.log(`[AirPlay Check] No status body for "${deviceName}". Clearing active cast.`);
            appState.activeCasts.delete(deviceName);
            broadcastActiveCasts();
          }
        });
        return;
      }

      console.log(`[Cast Check] Active device "${deviceName}" is no longer in discovered list. Clearing.`);
      appState.activeCasts.delete(deviceName);
      broadcastActiveCasts();
      return;
    }

    device.getStatus((err, status) => {
      if (err) {
        console.log(`[Chromecast Check] Failed to get status for "${deviceName}": ${err.message}. Clearing active cast.`);
        appState.activeCasts.delete(deviceName);
        broadcastActiveCasts();
        return;
      }

      if (!status || status.playerState === 'IDLE') {
        console.log(`[Chromecast Check] Device "${deviceName}" is IDLE or has no status. Clearing active cast.`);
        appState.activeCasts.delete(deviceName);
        broadcastActiveCasts();
      }
    });
  }
}, 8000);