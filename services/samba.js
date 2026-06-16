import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';

export function configureSambaShare(downloadDir) {
  const hostname = os.hostname();
  const SMB_CONF = '/etc/samba/smb.conf';
  const shareName = 'pulsecast';
  const marker = '# PulseCast Share (managed)';

  if (!fs.existsSync(SMB_CONF)) return;

  try {
    const content = fs.readFileSync(SMB_CONF, 'utf8');
    if (content.includes(marker)) return;

    const shareConfig = `
${marker}
[${shareName}]
   path = ${downloadDir}
   browseable = yes
   read only = no
   guest ok = yes
   create mask = 0777
   directory mask = 0777
`;
    fs.appendFileSync(SMB_CONF, shareConfig, 'utf8');
    console.log(`[Samba] Added ${shareName} share pointing to ${downloadDir}`);

    execFile('systemctl', ['restart', 'smbd'], (err) => {
      if (err) console.error('[Samba] Could not restart smbd:', err.message);
      else console.log('[Samba] Samba daemon restarted');
    });
  } catch (e) {
    console.error('[Samba] Error:', e.message);
  }
}