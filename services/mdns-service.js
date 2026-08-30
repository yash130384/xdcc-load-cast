import { Bonjour } from 'bonjour-service';

let bonjourInstance = null;
let publishedService = null;

export function startMdnsAdvertisement(port = 3000, name = 'PulseCast') {
  try {
    if (publishedService) {
      stopMdnsAdvertisement();
    }
    bonjourInstance = new Bonjour();
    publishedService = bonjourInstance.publish({
      name: name,
      type: 'pulsecast',
      protocol: 'tcp',
      port: port,
      txt: {
        version: '1.0.0',
        name: 'PulseCast Media Server',
        service: 'xdcc-iptv-stream'
      }
    });
    console.log(`[mDNS] Advertising PulseCast service (${name} on port ${port} type _pulsecast._tcp)...`);
  } catch (err) {
    console.error('[mDNS] Failed to start mDNS announcement:', err.message);
  }
}

export function stopMdnsAdvertisement() {
  try {
    if (publishedService) {
      publishedService.stop();
      publishedService = null;
    }
    if (bonjourInstance) {
      bonjourInstance.destroy();
      bonjourInstance = null;
    }
    console.log('[mDNS] Stopped mDNS announcement.');
  } catch (err) {
    console.error('[mDNS] Error stopping mDNS announcement:', err.message);
  }
}
