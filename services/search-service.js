import axios from 'axios';
import * as cheerio from 'cheerio';
import tls from 'tls';
import { appState } from '../state.js';
import { parseSizeToBytes } from './file-utils.js';

export function searchMoviegodsIRC(queryStr) {
  return new Promise((resolve, reject) => {
    const server = 'irc.abjects.net';
    const port = 6697;
    const prefixes = ['Alex', 'Chris', 'David', 'Emma', 'John', 'Lisa', 'Mark', 'Paul', 'Sarah', 'Tom', 'Yash', 'User', 'Client'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(100 + Math.random() * 900);
    const nick = `${prefix}_${suffix}`;
    const channel1 = '#moviegods';
    const channel2 = '#mg-chat';
    
    let socket;
    let buffer = '';
    const results = [];
    const isTopDl = queryStr.toLowerCase().startsWith('!topdl') || queryStr.toLowerCase().startsWith('.topdl');
    
    // Command to send
    let cmd = queryStr;
    if (cmd.startsWith('!')) {
      cmd = '.' + cmd.slice(1);
    } else if (!cmd.startsWith('.')) {
      cmd = `.s ${cmd}`;
    }

    const maxTimeout = (appState.appConfig.ircSearchTimeout || 24) * 1000;
    let timeoutTimer = setTimeout(() => {
      cleanup('Timeout bei der IRC-Suche');
    }, maxTimeout);

    let inactivityTimer = null;
    let cmdSent = false;
    let fallbackSendTimer = null;
    
    function resetInactivityTimer(ms = 1500) {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.log('Inactivity timeout reached, finishing search.');
        cleanup();
      }, ms);
    }

    function cleanup(errorMsg = null) {
      if (timeoutTimer) {
        clearTimeout(timeoutTimer);
        timeoutTimer = null;
      }
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
      }
      if (fallbackSendTimer) {
        clearTimeout(fallbackSendTimer);
        fallbackSendTimer = null;
      }
      if (socket) {
        try {
          if (socket.writable) {
            socket.write('QUIT :Search completed\r\n');
          }
          socket.destroy();
        } catch (e) {}
        socket = null;
      }
      if (errorMsg && results.length === 0) {
        reject(new Error(errorMsg));
      } else {
        resolve({
          type: isTopDl ? 'topdl' : 'search',
          results: results
        });
      }
    }

    function stripIrcColors(str) {
      return str
        .replace(/\x03(?:\d{1,2}(?:,\d{1,2})?)?/g, '')
        .replace(/[\x02\x0F\x16\x1D\x1F]/g, '');
    }

    try {
      console.log(`Connecting to ${server}:${port} for Moviegods search...`);
      socket = tls.connect({ host: server, port: port, rejectUnauthorized: false }, () => {
        console.log(`Connected to ${server}. Registering nick ${nick}...`);
        socket.write(`NICK ${nick}\r\n`);
        socket.write(`USER ${nick} 0 * :Search Client\r\n`);
      });

      socket.on('data', (data) => {
        buffer += data.toString('utf8');
        const lines = buffer.split('\r\n');
        buffer = lines.pop();

        for (const line of lines) {
          // PING-PONG
          if (line.startsWith('PING')) {
            const token = line.split(' :')[1] || line.substring(5);
            if (socket && socket.writable) {
              socket.write(`PONG :${token}\r\n`);
            }
            continue;
          }

          // Registration success
          if (line.includes(' 376 ') || line.includes(' 422 ')) {
            console.log(`Registered. Joining ${channel1} and ${channel2}...`);
            if (socket && socket.writable) {
              socket.write(`JOIN ${channel1},${channel2}\r\n`);
            }
            // Fallback safety timeout: send command after 5s if 366 didn't trigger
            fallbackSendTimer = setTimeout(() => {
              if (socket && socket.writable && !cmdSent) {
                cmdSent = true;
                console.log(`Fallback: Sending Moviegods search command: ${cmd}`);
                socket.write(`PRIVMSG ${channel2} :${cmd}\r\n`);
                resetInactivityTimer(3500);
              }
            }, 5000);
            continue;
          }

          // Fully joined #mg-chat
          if (line.includes(' 366 ') && line.includes(channel2)) {
            if (fallbackSendTimer) {
              clearTimeout(fallbackSendTimer);
              fallbackSendTimer = null;
            }
            if (!cmdSent) {
              cmdSent = true;
              console.log(`Fully joined ${channel2}. Sending Moviegods search command: ${cmd}`);
              if (socket && socket.writable) {
                socket.write(`PRIVMSG ${channel2} :${cmd}\r\n`);
                resetInactivityTimer(3500);
              }
            }
            continue;
          }

          // Listen for PRIVMSG/NOTICE search responses
          const privmsgMatch = line.match(/^:([^\s!]+)![^\s]+ (PRIVMSG|NOTICE) [^\s]+ :(.*)$/);
          if (privmsgMatch) {
            const senderNick = privmsgMatch[1];
            const rawMsg = privmsgMatch[3];
            const cleanMsg = stripIrcColors(rawMsg).trim();

            if (isTopDl) {
              // Parse topdl line: e.g. " 360x       Mortal.Kombat.II.2026.1080p.DCPRip.x264-FS.mkv (9.1G) ( 07  5d9h )"
              const topDlMatch = cleanMsg.match(/^\s*(\d+x)\s+([^\s(]+)\s+\(([^)]+)\)/);
              if (topDlMatch) {
                results.push({
                  gets: topDlMatch[1],
                  filename: topDlMatch[2],
                  sizeStr: topDlMatch[3]
                });
                resetInactivityTimer(1500);
              }
            } else {
              // Parse normal search result line
              // e.g. " 001 )   0x  |  5.3G  |  84.m2.2025.GERMAN.1080P.WEB.X264-WAYNE.mkv  |   /msg [MG]-Request|Bot|Snx6 XDCC SEND 72  |   Used: ..."
              const parts = cleanMsg.split(' | ');
              if (parts.length >= 4) {
                const firstPart = parts[0];
                const indexMatch = firstPart.match(/^\s*(\d+)\s*\)(.*)$/);
                if (indexMatch) {
                  const gets = indexMatch[2].trim() || '0x';
                  const sizeStr = parts[1].trim();
                  const filename = parts[2].trim();
                  const cmdPart = parts[3].trim();

                  // Extract botName and packNumber from command
                  const botCmdMatch = cmdPart.match(/(?:msg|privmsg)\s+([^\s]+)\s+xdcc\s+s?send\s+#?(\d+)/i);
                  if (botCmdMatch) {
                    const botName = botCmdMatch[1];
                    const packNumber = botCmdMatch[2];
                    results.push({
                      network: 'Abjects',
                      server: 'irc.abjects.net',
                      channel: '#moviegods',
                      botName: botName,
                      packNumber: packNumber,
                      fullCommand: `/msg ${botName} XDCC SEND ${packNumber}`,
                      gets: gets,
                      sizeStr: sizeStr,
                      sizeBytes: parseSizeToBytes(sizeStr),
                      filename: filename
                    });
                    resetInactivityTimer(1500);
                  }
                }
              }
              
              // Immediate completion if we see the summary line
              if (cleanMsg.includes('#MOVIEGODS - Found') && cleanMsg.includes('ONLINE Packs')) {
                console.log('Found summary line, finishing search immediately.');
                cleanup();
              }
            }
          }
        }
      });

      socket.on('error', (err) => {
        console.error('Moviegods IRC Search connection error:', err.message);
        cleanup(`Verbindungsfehler zu Moviegods IRC: ${err.message}`);
      });

      socket.on('close', () => {
        cleanup();
      });
    } catch (e) {
      cleanup(`IRC-Verbindungsfehler: ${e.message}`);
    }
  });
}

export async function testXdccEuReachability() {
  try {
    const start = Date.now();
    await axios.get('https://www.xdcc.eu/search.php?searchkey=test', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });
    const duration = Date.now() - start;
    return { success: true, duration };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function testMoviegodsIRCReachability() {
  return new Promise((resolve) => {
    const server = 'irc.abjects.net';
    const port = 6697;
    const prefixes = ['Alex', 'Chris', 'David', 'Emma', 'John', 'Lisa', 'Mark', 'Paul', 'Sarah', 'Tom', 'Yash', 'User', 'Client'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(100 + Math.random() * 900);
    const nick = `${prefix}_${suffix}`;
    const channel1 = '#moviegods';
    const channel2 = '#mg-chat';
    
    let socket;
    let buffer = '';
    let resolved = false;
    const start = Date.now();
    
    const timeoutTimer = setTimeout(() => {
      finish(false, 'Timeout connecting to Abjects IRC server');
    }, 15000);
    
    function finish(success, errorMsg = null) {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutTimer);
      
      if (socket) {
        try {
          if (socket.writable) {
            socket.write('QUIT :Startup check complete\r\n');
          }
          socket.destroy();
        } catch (e) {}
        socket = null;
      }
      
      const duration = Date.now() - start;
      if (success) {
        resolve({ success: true, duration });
      } else {
        resolve({ success: false, error: errorMsg });
      }
    }
    
    try {
      socket = tls.connect({ host: server, port: port, rejectUnauthorized: false }, () => {
        socket.write(`NICK ${nick}\r\n`);
        socket.write(`USER ${nick} 0 * :Startup Check Client\r\n`);
      });
      
      socket.on('data', (data) => {
        buffer += data.toString('utf8');
        const lines = buffer.split('\r\n');
        buffer = lines.pop();
        
        for (const line of lines) {
          if (line.startsWith('PING')) {
            const token = line.split(' :')[1] || line.substring(5);
            if (socket && socket.writable) {
              socket.write(`PONG :${token}\r\n`);
            }
            continue;
          }
          
          if (line.includes(' 376 ') || line.includes(' 422 ')) {
            if (socket && socket.writable) {
              socket.write(`JOIN ${channel1},${channel2}\r\n`);
            }
            continue;
          }
          
          if (line.includes(' 366 ') && line.includes(channel2)) {
            finish(true);
            return;
          }
          
          const parts = line.split(' ');
          const command = parts[1];
          if (command === '474') {
            finish(false, 'Banned from channels (+b)');
            return;
          } else if (command === '473') {
            finish(false, 'Invite-only (+i)');
            return;
          } else if (command === '477') {
            finish(false, 'Registration required (+r)');
            return;
          }
        }
      });
      
      socket.on('error', (err) => {
        finish(false, `Socket connection error: ${err.message}`);
      });
      
      socket.on('close', () => {
        finish(false, 'Connection closed by remote host');
      });
    } catch (e) {
      finish(false, `Unexpected error: ${e.message}`);
    }
  });
}

export async function runStartupTests() {
  console.log('[Startup-Checks] Starting connectivity checks for search sources...');
  
  const [xdccResult, moviegodsResult] = await Promise.all([
    testXdccEuReachability(),
    testMoviegodsIRCReachability()
  ]);
  
  if (xdccResult.success && moviegodsResult.success) {
    console.log('[Startup-Checks] ✅ All startup connectivity checks passed successfully!');
    console.log(`[Startup-Checks] - xdcc.eu search: REACHABLE (duration: ${xdccResult.duration}ms)`);
    console.log(`[Startup-Checks] - Moviegods IRC: REACHABLE (duration: ${moviegodsResult.duration}ms)`);
  } else {
    console.error('[Startup-Checks] ⚠️ STARTUP CONNECTIVITY CHECK FAILED!');
    console.error(`[Startup-Checks] - xdcc.eu search: ${xdccResult.success ? `REACHABLE (duration: ${xdccResult.duration}ms)` : `UNREACHABLE (Reason: ${xdccResult.error})`}`);
    console.error(`[Startup-Checks] - Moviegods IRC: ${moviegodsResult.success ? `REACHABLE (duration: ${moviegodsResult.duration}ms)` : `UNREACHABLE (Reason: ${moviegodsResult.error})`}`);
  }
}

export async function searchXdccEu(queryStr) {
  try {
    console.log(`Searching xdcc.eu for: ${queryStr}`);
    const response = await axios.get(`https://www.xdcc.eu/search.php`, {
      params: { searchkey: queryStr },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $('tr').each((idx, el) => {
      const infoLink = $(el).find('a[data-s]');
      if (infoLink.length === 0) return;

      const serverAddress = infoLink.attr('data-s');
      const channelName = infoLink.attr('data-c');
      const fullCommand = infoLink.attr('data-p');

      if (!serverAddress || !fullCommand) return;

      const commandParts = fullCommand.split(' ');
      const botName = commandParts[0];
      const packCommand = commandParts.slice(1).join(' ');

      const packNumberMatch = packCommand.match(/#?(\d+)/);
      const packNumber = packNumberMatch ? packNumberMatch[1] : '';

      const tds = $(el).find('td');
      if (tds.length < 7) return;

      const network = $(tds[0]).text().trim();
      const gets = $(tds[4]).text().trim();
      const sizeStr = $(tds[5]).text().trim();
      const filename = $(tds[6]).text().trim();

      results.push({
        network,
        server: serverAddress,
        channel: channelName,
        botName,
        packNumber,
        fullCommand,
        gets,
        sizeStr,
        sizeBytes: parseSizeToBytes(sizeStr),
        filename
      });
    });

    return results;
  } catch (error) {
    console.error('Search xdcc.eu error:', error.message);
    return [];
  }
}