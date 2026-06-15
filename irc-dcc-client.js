import net from 'net';
import tls from 'tls';
import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

function intToIP(n) {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff
  ].join('.');
}

export class IrcDccDownloader extends EventEmitter {
  constructor(options) {
    super();
    this.id = options.id;
    this.server = options.server;
    this.port = options.port || 6667;
    this.useSSL = options.useSSL || false;
    this.channel = options.channel;
    this.botName = options.botName;
    this.packNumber = options.packNumber;
    this.downloadDir = options.downloadDir || path.join(process.cwd(), 'downloads');
    this.filename = options.filename;
    this.expectedSize = options.expectedSize || 0;
    this.isAuto = options.isAuto || false;

    this.ircSocket = null;
    this.dccSocket = null;
    this.fileStream = null;
    this.bytesReceived = 0;
    this.speed = 0;
    this.eta = 0;
    this.status = 'connecting'; // connecting, registering, joining, requesting, confirm_filename, dcc_negotiating, dcc_downloading, completed, error, cancelled, paused
    this.errorMessage = '';
    this.offeredFilename = '';
    this.speedHistory = [];
    this.elapsedTime = 0;
    this.downloadedBytes = 0;
    
    const prefixes = ['Alex', 'Chris', 'David', 'Emma', 'John', 'Lisa', 'Mark', 'Paul', 'Sarah', 'Tom', 'Yash', 'User', 'Client'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(100 + Math.random() * 900);
    this.nick = `${prefix}_${suffix}`;
    this.bytesInLastSecond = 0;
    this.speedInterval = null;
    this.localSize = 0;
    this.filePath = '';
    this.dccResumeNegotiated = false;
    this.useSsend = options.useSsend || false;
    this.isSecureDcc = false;
    this.isReconnecting = false;
    this.localAddress = options.localAddress;
  }

  log(msg) {
    console.log(`[XDCC Downloader][${this.id}] ${msg}`);
  }

  getNickFromSender(sender) {
    if (!sender) return '';
    const clean = sender.startsWith(':') ? sender.substring(1) : sender;
    const exclIndex = clean.indexOf('!');
    return exclIndex !== -1 ? clean.substring(0, exclIndex) : clean;
  }

  updateStatus(status, extra = {}) {
    this.status = status;
    this.emit('progress', {
      id: this.id,
      status: this.status,
      bytesReceived: this.bytesReceived,
      expectedSize: this.expectedSize,
      speed: this.speed,
      eta: this.eta,
      errorMessage: this.errorMessage,
      filename: this.filename,
      offeredFilename: this.offeredFilename,
      speedHistory: this.speedHistory ? [...this.speedHistory] : [],
      ...extra
    });
  }

  start() {
    this.log(`Starting download for ${this.filename} on ${this.server}:${this.port} (SSL: ${this.useSSL})`);
    
    // Ensure download directory exists
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }

    this.filePath = path.join(this.downloadDir, this.filename);
    
    // Check if file exists and we can resume
    if (fs.existsSync(this.filePath)) {
      const stats = fs.statSync(this.filePath);
      this.localSize = stats.size;
      this.bytesReceived = this.localSize;
      this.log(`Found existing file size: ${this.localSize} bytes.`);
      if (this.expectedSize && this.localSize >= this.expectedSize) {
        this.log(`File is already fully downloaded.`);
        this.bytesReceived = this.expectedSize;
        this.updateStatus('completed');
        return;
      }
    } else {
      this.localSize = 0;
      this.bytesReceived = 0;
      this.speedHistory = [];
      this.elapsedTime = 0;
      this.downloadedBytes = 0;
    }

    this.connectIrc();
  }

  connectIrc() {
    this.isReconnecting = false;
    this.updateStatus('connecting');
    this.log(`Connecting to IRC server ${this.server}:${this.port}...`);

    const connectionOptions = {
      host: this.server,
      port: this.port,
      rejectUnauthorized: false
    };
    if (this.localAddress) {
      connectionOptions.localAddress = this.localAddress;
    }

    try {
      if (this.useSSL) {
        this.ircSocket = tls.connect(connectionOptions, () => {
          this.log(`SSL Connection established.`);
          this.registerUser();
        });
      } else {
        this.ircSocket = net.createConnection(connectionOptions, () => {
          this.log(`TCP Connection established.`);
          this.registerUser();
        });
      }

      let dataBuffer = '';
      this.ircSocket.on('data', (data) => {
        dataBuffer += data.toString('utf8');
        let lines = dataBuffer.split('\r\n');
        dataBuffer = lines.pop(); // keep partial line

        for (let line of lines) {
          this.handleIrcLine(line);
        }
      });

      this.ircSocket.on('error', (err) => {
        if (this.isReconnecting) {
          this.log(`IRC Socket Error ignored during deliberate reconnect: ${err.message}`);
          return;
        }
        this.log(`IRC Socket Error: ${err.message}`);
        this.emit('message', {
          id: this.id,
          text: `[IRC Fehler] Code: ${err.code || 'UNKNOWN'}, Nachricht: ${err.message}, Server: ${this.server}:${this.port}`
        });
        this.handleError(`IRC-Verbindungsfehler: ${err.message} (${err.code || 'kein Code'})`);
      });

      this.ircSocket.on('close', () => {
        this.log(`IRC Connection closed. Current status: ${this.status}`);
        if (this.isReconnecting) {
          this.log(`Reconnecting flag is set, ignoring close event.`);
          return;
        }
        if (this.status !== 'completed' && this.status !== 'error' && this.status !== 'cancelled' && this.status !== 'paused' && this.status !== 'dcc_downloading') {
          this.handleError('IRC-Verbindung unerwartet geschlossen.');
        }
      });
    } catch (e) {
      this.handleError(`Konnte keine IRC-Verbindung herstellen: ${e.message}`);
    }
  }

  registerUser() {
    this.updateStatus('registering');
    this.log(`Registering with NICK ${this.nick}...`);
    this.ircSocket.write(`NICK ${this.nick}\r\n`);
    this.ircSocket.write(`USER ${this.nick} 0 * :XDCC Downloader App\r\n`);
  }

  sendPingPong(token) {
    if (this.ircSocket && this.ircSocket.writable) {
      this.ircSocket.write(`PONG :${token}\r\n`);
    }
  }

  handleIrcLine(line) {
    if (line.startsWith('PING')) {
      const token = line.split(' :')[1] || line.substring(5);
      this.sendPingPong(token);
      return;
    }

    const parts = line.split(' ');
    const sender = parts[0];
    const command = parts[1];

    const joinErrors = {
      '471': 'Channel ist voll (+l)',
      '473': 'Channel ist nur auf Einladung (+i)',
      '474': 'Du bist aus dem Channel gebannt (+b)',
      '475': 'Falsches Channel-Passwort (+k)',
      '477': 'Du musst registriert/identifiziert sein, um beizutreten (+r)'
    };

    if (joinErrors[command]) {
      const errChannel = parts[3] || 'Channel';
      const reason = line.substring(line.indexOf(' :', 1) + 2) || joinErrors[command];
      this.handleError(`Fehler beim Beitreten von ${errChannel}: ${reason}`);
      return;
    }

    if (command === '376' || command === '422') {
      if (parts[2]) {
        this.nick = parts[2];
      }
      if (this.server.toLowerCase().includes('abjects') || this.channel === '#moviegods') {
        this.log(`Registered successfully. Joining channel #moviegods and #mg-chat...`);
        this.updateStatus('joining');
        this.ircSocket.write(`JOIN #moviegods,#mg-chat\r\n`);
      } else {
        this.log(`Registered successfully. Joining channel ${this.channel}...`);
        this.updateStatus('joining');
        this.ircSocket.write(`JOIN ${this.channel}\r\n`);
      }
      return;
    }

    if (command === 'JOIN') {
      const senderNick = this.getNickFromSender(sender);
      const joinedChans = parts[2]?.replace(':', '').trim().toLowerCase().split(',');
      const targetChan = this.channel.toLowerCase();

      if (senderNick.toLowerCase() === this.nick.toLowerCase() && joinedChans.includes(targetChan)) {
        this.log(`Joined channel ${this.channel}. Requesting pack ${this.packNumber} from ${this.botName}...`);
        this.updateStatus('requesting');
        
        setTimeout(() => {
          if (this.ircSocket && this.ircSocket.writable) {
            const reqCmd = this.useSsend ? 'ssend' : 'send';
            this.ircSocket.write(`PRIVMSG ${this.botName} :xdcc ${reqCmd} ${this.packNumber}\r\n`);
          }
        }, 1000);
        return;
      }
    }

    if (command === 'NOTICE') {
      const noticeContent = line.substring(line.indexOf(' :', 1) + 2);
      this.log(`Notice received: ${noticeContent}`);
      
      const noticeLower = noticeContent.toLowerCase();
      if ((noticeLower.includes('ssend') || noticeLower.includes('secure ssl dcc') || noticeLower.includes('ssl dcc')) && !this.useSsend) {
        this.log(`Notice indicates secure SSL DCC Sends (SSEND) is required. Reconnecting and switching to xdcc ssend...`);
        this.useSsend = true;
        this.isReconnecting = true;
        this.emit('message', {
          id: this.id,
          text: `[Info] Server/Bot erfordert secure SSL DCC Sends. Reconnection und Wechsel zu xdcc ssend...`
        });
        
        if (this.ircSocket) {
          try {
            if (this.ircSocket.writable) {
              this.ircSocket.write('QUIT :Reconnecting for SSEND\r\n');
            }
            this.ircSocket.destroy();
          } catch (e) {}
          this.ircSocket = null;
        }

        setTimeout(() => {
          this.connectIrc();
        }, 2000);
      }

      if (sender.includes(this.botName)) {
        this.emit('message', {
          id: this.id,
          text: noticeContent
        });
        
        if (noticeContent.toLowerCase().includes('queue') || noticeContent.toLowerCase().includes('warten')) {
          this.updateStatus('queued', { message: noticeContent });
        }
      }
      return;
    }

    if (command === 'PRIVMSG' && parts[2] === this.nick) {
      const msgContent = line.substring(line.indexOf(' :', 1) + 2);
      if (msgContent.startsWith('\x01') && msgContent.endsWith('\x01')) {
        const ctcpContent = msgContent.substring(1, msgContent.length - 1);
        this.handleCtcp(sender, ctcpContent);
      }
      return;
    }
  }

  handleCtcp(sender, ctcpContent) {
    const senderNick = sender.startsWith(':') ? sender.substring(1, sender.indexOf('!')) : sender;
    if (senderNick.toLowerCase() !== this.botName.toLowerCase()) {
      this.log(`Ignoring CTCP from unknown sender: ${senderNick}`);
      return;
    }

    this.log(`CTCP Received from ${this.botName}: ${ctcpContent}`);

    if (ctcpContent.startsWith('DCC SEND ')) {
      this.isSecureDcc = this.useSsend || false;
      this.handleDccSend(ctcpContent);
    } else if (ctcpContent.startsWith('DCC SSEND ') || ctcpContent.startsWith('DCC TSEND ') || ctcpContent.startsWith('DCC TSSEND ') || ctcpContent.startsWith('DCC STSEND ')) {
      this.isSecureDcc = true;
      this.handleDccSend(ctcpContent);
    } else if (ctcpContent.startsWith('DCC ACCEPT ')) {
      this.handleDccAccept(ctcpContent);
    } else if (ctcpContent.startsWith('DCC SACCEPT ') || ctcpContent.startsWith('DCC TSACCEPT ')) {
      this.handleDccAccept(ctcpContent);
    } else if (ctcpContent.startsWith('ERR ')) {
      this.handleError(`Bot Fehler: ${ctcpContent.substring(4)}`);
    }
  }

  handleDccSend(ctcpContent) {
    this.updateStatus('dcc_negotiating');
    
    let prefixLength = 9; // "DCC SEND "
    if (ctcpContent.startsWith('DCC SSEND ')) prefixLength = 10;
    else if (ctcpContent.startsWith('DCC TSEND ')) prefixLength = 10;
    else if (ctcpContent.startsWith('DCC TSSEND ')) prefixLength = 11;
    else if (ctcpContent.startsWith('DCC STSEND ')) prefixLength = 11;

    const payload = ctcpContent.substring(prefixLength);
    
    let filename, ipInt, port, size;
    const cleanPayload = payload.trim();
    
    // Check if the payload starts with a quote
    if (cleanPayload.startsWith('"')) {
      const secondQuote = cleanPayload.indexOf('"', 1);
      if (secondQuote !== -1) {
        filename = cleanPayload.slice(1, secondQuote);
        const rest = cleanPayload.slice(secondQuote + 1).trim();
        const parts = rest.split(/\s+/);
        if (parts.length >= 3) {
          ipInt = parseInt(parts[0], 10);
          port = parseInt(parts[1], 10);
          size = parseInt(parts[2], 10);
        }
      }
    }
    
    // If not parsed yet (e.g. no quote, or invalid/partial quote, or parsing failed)
    if (filename === undefined || isNaN(ipInt) || isNaN(port) || isNaN(size)) {
      // Find the last 3 space-separated parts which must be ip, port, size
      const parts = cleanPayload.split(/\s+/);
      if (parts.length >= 4) {
        size = parseInt(parts[parts.length - 1], 10);
        port = parseInt(parts[parts.length - 2], 10);
        ipInt = parseInt(parts[parts.length - 3], 10);
        
        // The filename is everything before the last 3 parts
        filename = parts.slice(0, parts.length - 3).join(' ');
        // Strip quotes if they were left
        if (filename.startsWith('"') && filename.endsWith('"')) {
          filename = filename.slice(1, -1);
        }
      }
    }
    
    // Verify we successfully parsed the required DCC parameters
    if (filename === undefined || isNaN(ipInt) || isNaN(port) || isNaN(size)) {
      this.handleError('Ungültiges DCC SEND-Format empfangen.');
      return;
    }

    this.ipInt = ipInt;
    this.dccPort = port;
    this.offeredFilename = filename;
    this.expectedSize = size;
    
    this.log(`Parsed DCC SEND: filename="${filename}", IP=${intToIP(ipInt)} (${ipInt}), port=${port}, size=${size}`);

    if (port === 0) {
      this.handleError('Passive/Reverse DCC wird derzeit nicht unterstützt (Port 0 erhalten).');
      return;
    }

    // Verify if offered filename matches the expected filename (case-insensitive)
    const originalFilename = this.filename;
    const isFilenameMatch = filename.toLowerCase() === originalFilename.toLowerCase();

    if (!isFilenameMatch) {
      this.log(`WARNUNG: Dateiname weicht ab! Gesucht: "${originalFilename}", angeboten: "${filename}"`);
      if (this.isAuto) {
        this.handleError(`Dateiname weicht ab (Auto-Download abgebrochen): Gesucht: "${originalFilename}", angeboten: "${filename}"`);
        return;
      }
      this.updateStatus('confirm_filename', {
        offeredFilename: filename,
        originalFilename: originalFilename
      });
      return; // Wait for user confirmation
    }

    this.proceedWithDownload();
  }

  confirmFilename() {
    this.log(`User confirmed filename mismatch. Using offered: "${this.offeredFilename}"`);
    this.filename = this.offeredFilename;
    this.status = 'dcc_negotiating';
    this.proceedWithDownload();
  }

  proceedWithDownload() {
    this.filePath = path.join(this.downloadDir, this.filename);

    // Recheck local size based on the final filename
    if (fs.existsSync(this.filePath)) {
      const stats = fs.statSync(this.filePath);
      this.localSize = stats.size;
      this.bytesReceived = this.localSize;
      this.log(`Found existing file size for confirmed filename: ${this.localSize} bytes.`);
      if (this.expectedSize && this.localSize >= this.expectedSize) {
        this.log(`File is already fully downloaded.`);
        this.bytesReceived = this.expectedSize;
        this.updateStatus('completed');
        this.cleanup();
        return;
      }
    } else {
      this.localSize = 0;
      this.bytesReceived = 0;
      this.speedHistory = [];
      this.elapsedTime = 0;
      this.downloadedBytes = 0;
    }

    if (this.localSize > 0 && this.localSize < this.expectedSize) {
      this.log(`Requesting DCC RESUME for "${this.filename}" at port ${this.dccPort} and position ${this.localSize}...`);
      if (this.ircSocket && this.ircSocket.writable) {
        const resumeVerb = this.isSecureDcc ? 'DCC SRESUME' : 'DCC RESUME';
        this.ircSocket.write(`PRIVMSG ${this.botName} :\x01${resumeVerb} "${this.filename}" ${this.dccPort} ${this.localSize}\x01\r\n`);
        
        this.resumeTimeout = setTimeout(() => {
          this.log('Resume negotiation timed out. Starting download from scratch.');
          this.localSize = 0;
          this.bytesReceived = 0;
          this.speedHistory = [];
          this.elapsedTime = 0;
          this.downloadedBytes = 0;
          this.startDccConnection(this.ipInt, this.dccPort);
        }, 5000);
      } else {
        this.startDccConnection(this.ipInt, this.dccPort);
      }
    } else {
      this.localSize = 0;
      this.bytesReceived = 0;
      this.speedHistory = [];
      this.elapsedTime = 0;
      this.downloadedBytes = 0;
      this.startDccConnection(this.ipInt, this.dccPort);
    }
  }

  handleDccAccept(ctcpContent) {
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }

    this.log(`DCC ACCEPT received: ${ctcpContent}`);
    let prefixLength = 11; // "DCC ACCEPT "
    if (ctcpContent.startsWith('DCC SACCEPT ')) prefixLength = 12;
    else if (ctcpContent.startsWith('DCC TSACCEPT ')) prefixLength = 13;

    const parts = ctcpContent.substring(prefixLength).split(' ');
    const position = parseInt(parts[parts.length - 1], 10);
    const port = parseInt(parts[parts.length - 2], 10);

    this.log(`Resume accepted at position ${position} on port ${port}.`);
    this.dccResumeNegotiated = true;
    this.bytesReceived = position;

    this.startDccConnection(this.ipInt, port);
  }

  startDccConnection(ipInt, port) {
    const ip = intToIP(ipInt);
    this.log(`Connecting to DCC socket ${ip}:${port}...`);
    this.updateStatus('dcc_downloading');

    const writeFlags = this.dccResumeNegotiated ? 'a' : 'w';
    this.fileStream = fs.createWriteStream(this.filePath, { flags: writeFlags });

    const connectionOptions = {
      host: ip,
      port: port
    };
    if (this.localAddress) {
      connectionOptions.localAddress = this.localAddress;
    }

    if (this.isSecureDcc) {
      this.dccSocket = tls.connect({ ...connectionOptions, rejectUnauthorized: false }, () => {
        this.log(`Secure DCC Connected (SSL/TLS). Starting file write...`);
        this.startSpeedCalculator();
      });
    } else {
      this.dccSocket = net.createConnection(connectionOptions, () => {
        this.log(`DCC Connected. Starting file write...`);
        this.startSpeedCalculator();
      });
    }

    this.dccSocket.on('data', (chunk) => {
      this.bytesReceived += chunk.length;
      this.bytesInLastSecond += chunk.length;
      
      this.fileStream.write(chunk);

      // Send ack back to the bot
      // If the file is > 4GB (0xffffffff bytes), we use a 64-bit (8-byte) big-endian integer.
      // Otherwise, we use a 32-bit (4-byte) big-endian integer.
      let ack;
      if (this.expectedSize > 0xffffffff) {
        ack = Buffer.alloc(8);
        ack.writeBigUInt64BE(BigInt(this.bytesReceived));
      } else {
        ack = Buffer.alloc(4);
        ack.writeUInt32BE(this.bytesReceived >>> 0);
      }
      this.dccSocket.write(ack);
    });

    this.dccSocket.on('end', () => {
      this.log(`DCC socket ended.`);
      this.completeDownload();
    });

    this.dccSocket.on('error', (err) => {
      this.log(`DCC Socket Error: ${err.message}`);
      
      // Emit detailed message to the UI logs
      this.emit('message', {
        id: this.id,
        text: `[DCC Fehler] Code: ${err.code || 'UNKNOWN'}, Nachricht: ${err.message}, IP/Port: ${ip}:${port}, Bytes erhalten: ${this.bytesReceived}/${this.expectedSize}`
      });

      // If we received ECONNRESET but already have all bytes, complete it instead of failing
      if ((err.code === 'ECONNRESET' || err.message.includes('ECONNRESET')) && this.expectedSize && this.bytesReceived >= this.expectedSize) {
        this.log('ECONNRESET received but file is fully downloaded. Completing download.');
        this.completeDownload();
      } else {
        this.handleError(`DCC-Übertragungsfehler: ${err.message} (${err.code || 'kein Code'})`);
      }
    });

    this.dccSocket.on('close', () => {
      this.log(`DCC Socket closed. Current status: ${this.status}`);
      if (this.status === 'dcc_downloading') {
        if (this.bytesReceived >= this.expectedSize) {
          this.completeDownload();
        } else {
          this.handleError(`DCC-Verbindung abgebrochen before completion. (${this.bytesReceived}/${this.expectedSize} bytes)`);
        }
      }
    });
  }

  startSpeedCalculator() {
    this.speedHistory = this.speedHistory || [];
    let lastTime = Date.now();
    let lastBytes = this.bytesReceived;
    
    this.speedInterval = setInterval(() => {
      const now = Date.now();
      const timeDiffSec = (now - lastTime) / 1000;
      
      if (timeDiffSec > 0) {
        this.speed = Math.round(this.bytesInLastSecond / timeDiffSec);
        this.bytesInLastSecond = 0;
        lastTime = now;
        
        // Record speed history
        this.speedHistory.push(this.speed);
        
        // Downsample speedHistory if it gets too large (> 2000 points) to prevent memory bloating
        if (this.speedHistory.length >= 2000) {
          const newHistory = [];
          for (let i = 0; i < this.speedHistory.length; i += 2) {
            const val1 = this.speedHistory[i];
            const val2 = i + 1 < this.speedHistory.length ? this.speedHistory[i + 1] : val1;
            newHistory.push(Math.round((val1 + val2) / 2));
          }
          this.speedHistory = newHistory;
        }
        
        // Track cumulative active time and bytes for average speed calculation
        this.elapsedTime = (this.elapsedTime || 0) + timeDiffSec;
        const deltaBytes = this.bytesReceived - lastBytes;
        this.downloadedBytes = (this.downloadedBytes || 0) + deltaBytes;
        lastBytes = this.bytesReceived;
        
        // Compute average speed of the entire download run so far
        const averageSpeed = this.elapsedTime > 0 ? (this.downloadedBytes / this.elapsedTime) : 0;
        
        const remainingBytes = this.expectedSize - this.bytesReceived;
        if (averageSpeed > 0 && remainingBytes > 0) {
          this.eta = Math.round(remainingBytes / averageSpeed);
        } else {
          this.eta = 0;
        }

        this.updateStatus('dcc_downloading');
      }
    }, 1000);
  }

  stopSpeedCalculator() {
    if (this.speedInterval) {
      clearInterval(this.speedInterval);
      this.speedInterval = null;
    }
  }

  completeDownload() {
    this.log(`Download completed for ${this.filename}`);
    this.status = 'completed'; // Set status first
    this.stopSpeedCalculator();
    this.cleanup();
    this.bytesReceived = this.expectedSize;
    this.speed = 0;
    this.eta = 0;
    this.updateStatus('completed');
  }

  handleError(msg) {
    this.log(`Error: ${msg}`);
    this.status = 'error'; // Set status first to prevent event close races
    this.stopSpeedCalculator();
    this.cleanup();
    this.errorMessage = msg;
    this.updateStatus('error');
  }

  pause() {
    this.log(`Pausing download...`);
    this.status = 'paused'; // Set status first to prevent event close races
    this.stopSpeedCalculator();
    this.cleanup();
    this.updateStatus('paused');
  }

  cancel() {
    this.log(`Cancelling download...`);
    this.status = 'cancelled'; // Set status first to prevent event close races
    this.stopSpeedCalculator();
    this.cleanup();
    
    if (fs.existsSync(this.filePath)) {
      try {
        fs.unlinkSync(this.filePath);
        this.log(`Deleted partial file ${this.filePath}`);
      } catch (e) {
        this.log(`Could not delete partial file: ${e.message}`);
      }
    }
    
    this.bytesReceived = 0;
    this.updateStatus('cancelled');
  }

  cleanup() {
    if (this.resumeTimeout) {
      clearTimeout(this.resumeTimeout);
      this.resumeTimeout = null;
    }

    if (this.ircSocket) {
      try {
        if (this.ircSocket.writable) {
          this.ircSocket.write('QUIT :XDCC Downloader quit\r\n');
        }
        this.ircSocket.destroy();
      } catch (e) {}
      this.ircSocket = null;
    }

    if (this.dccSocket) {
      try {
        this.dccSocket.destroy();
      } catch (e) {}
      this.dccSocket = null;
    }

    if (this.fileStream) {
      try {
        this.fileStream.end();
      } catch (e) {}
      this.fileStream = null;
    }
  }
}
