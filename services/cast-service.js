// Cast service and server-side playback have been deactivated in favor of client-side VLC streaming.
// All media playback now happens natively in the client's VLC player via HTTP range streaming and M3U playlists.

export function broadcastActiveCasts() {}
export function getActiveCasts() { return []; }
export function stopCasting() {}
export function startCasting() { return Promise.reject(new Error('Cast service is disabled')); }
export function attachDeviceStatusListeners() {}
export function attachDlnaDeviceStatusListeners() {}
export function attachAirplayDeviceStatusListeners() {}