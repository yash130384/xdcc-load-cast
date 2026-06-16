import ChromecastAPI from 'chromecast-api';
import dlnacastsCreator from 'dlnacasts2';
import airplayerCreator from 'airplayer';

export function startAllDiscovery(appState) {
  startChromecastDiscovery(appState);
  startDlnaDiscovery(appState);
  startAirplayDiscovery(appState);
}

function startChromecastDiscovery(appState) {
  if (appState.castBrowser) return;
  try {
    appState.castBrowser = new ChromecastAPI();
    appState.castBrowser.on('device', (device) => {
      console.log(`[Chromecast] Discovered device: ${device.friendlyName} at ${device.host}`);
      appState.discoveredChromecasts.set(device.friendlyName, device);
    });
  } catch (err) {
    console.error('[Chromecast] Error starting discovery:', err);
  }
}

function startDlnaDiscovery(appState) {
  if (appState.dlnaBrowser) return;
  try {
    appState.dlnaBrowser = dlnacastsCreator();
    appState.dlnaBrowser.on('update', (player) => {
      console.log(`[DLNA/Miracast] Discovered device: ${player.name}`);
      appState.discoveredDlnas.set(player.name, player);
    });
  } catch (err) {
    console.error('[DLNA/Miracast] Error starting discovery:', err);
  }
}

function startAirplayDiscovery(appState) {
  if (appState.airplayBrowser) return;
  try {
    appState.airplayBrowser = airplayerCreator();
    appState.airplayBrowser.on('update', (player) => {
      console.log(`[AirPlay] Discovered device: ${player.name}`);
      appState.discoveredAirplays.set(player.name, player);
    });
  } catch (err) {
    console.error('[AirPlay] Error starting discovery:', err);
  }
}

export function updateAllDiscovery(appState) {
  try { appState.castBrowser?.update(); } catch (e) { console.error('Error updating cast browser:', e?.message); }
  try { appState.dlnaBrowser?.update(); } catch (e) { console.error('Error updating DLNA browser:', e?.message); }
  try { appState.airplayBrowser?.update(); } catch (e) { console.error('Error updating AirPlay browser:', e?.message); }
}