import os from 'os';

export function getNetworkDetails(appConfig) {
  const interfaces = os.networkInterfaces();
  const ips = [];
  let tailscaleIp = null;
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isTS = iface.address.startsWith('100.');
        ips.push({ interface: name, address: iface.address, isTailscale: isTS });
        if (isTS) tailscaleIp = iface.address;
      }
    }
  }
  return {
    localIp: getLocalIp(appConfig),
    allIps: ips,
    tailscaleDetected: !!tailscaleIp,
    tailscaleIp
  };
}

export function getLocalIp(appConfig) {
  if (appConfig.customLocalIp) return appConfig.customLocalIp;
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('100.')) {
          if (appConfig.allowTailscaleIp) return iface.address;
        } else {
          return iface.address;
        }
      }
    }
  }
  return '127.0.0.1';
}