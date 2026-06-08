import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';
import axios from 'axios';

export class HttpDownloader extends EventEmitter {
  constructor(options) {
    super();
    this.id = options.id;
    this.url = options.url;
    this.filename = options.filename;
    this.downloadDir = options.downloadDir || path.join(process.cwd(), 'downloads');
    this.expectedSize = options.expectedSize || 0;
    this.isAuto = false;
    this.isHttp = true;

    // Extract basic details from URL for compatibility with getDownloadDetails
    try {
      const parsedUrl = new URL(this.url);
      this.server = parsedUrl.hostname;
      this.port = parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80');
      this.useSSL = parsedUrl.protocol === 'https:';
    } catch (e) {
      this.server = 'HTTP';
      this.port = '';
      this.useSSL = false;
    }
    this.channel = 'Xtream';
    this.botName = 'HTTP';
    this.packNumber = '';
    this.offeredFilename = this.filename;

    this.fileStream = null;
    this.bytesReceived = 0;
    this.speed = 0;
    this.eta = 0;
    this.status = 'connecting'; // connecting, dcc_downloading, completed, error, cancelled, paused
    this.errorMessage = '';

    this.bytesInLastSecond = 0;
    this.speedInterval = null;
    this.localSize = 0;
    this.filePath = path.join(this.downloadDir, this.filename);
    
    this.abortController = null;
  }

  log(msg) {
    console.log(`[HTTP Downloader][${this.id}] ${msg}`);
    this.emit('message', {
      id: this.id,
      text: msg
    });
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
      isHttp: true,
      ...extra
    });
  }

  async start() {
    this.log(`Starting HTTP download for ${this.filename} from ${this.url}`);
    
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }

    // Check if file already exists on disk
    if (fs.existsSync(this.filePath)) {
      const stats = fs.statSync(this.filePath);
      this.localSize = stats.size;
      this.bytesReceived = this.localSize;
      this.log(`Found existing file size: ${this.localSize} bytes.`);
    } else {
      this.localSize = 0;
      this.bytesReceived = 0;
    }

    this.updateStatus('connecting');
    this.abortController = new AbortController();

    try {
      const headers = {};
      if (this.localSize > 0) {
        headers['Range'] = `bytes=${this.localSize}-`;
      }

      const response = await axios({
        method: 'get',
        url: this.url,
        responseType: 'stream',
        headers,
        signal: this.abortController.signal,
        timeout: 30000
      });

      const isRangeResponse = response.status === 206;
      let writeFlags = 'w';
      
      if (isRangeResponse) {
        this.log('Server supports resume (206 Partial Content).');
        writeFlags = 'a';
        this.bytesReceived = this.localSize;
      } else {
        this.log('Server does not support range or returned full content (200 OK). Starting from scratch.');
        this.localSize = 0;
        this.bytesReceived = 0;
      }

      // Get expected size
      if (response.headers['content-length']) {
        const length = parseInt(response.headers['content-length'], 10);
        this.expectedSize = isRangeResponse ? length + this.localSize : length;
      }

      if (this.expectedSize && this.bytesReceived >= this.expectedSize) {
        this.log('File already fully downloaded.');
        this.updateStatus('completed');
        return;
      }

      this.fileStream = fs.createWriteStream(this.filePath, { flags: writeFlags });
      const stream = response.data;

      this.updateStatus('dcc_downloading');
      this.startSpeedCalculator();

      stream.on('data', (chunk) => {
        this.bytesReceived += chunk.length;
        this.bytesInLastSecond += chunk.length;
        if (this.fileStream) {
          this.fileStream.write(chunk);
        }
      });

      stream.on('end', () => {
        this.log('Stream end reached.');
        this.completeDownload();
      });

      stream.on('error', (err) => {
        if (this.status !== 'cancelled' && this.status !== 'paused') {
          this.handleError(`Download stream error: ${err.message}`);
        }
      });

    } catch (err) {
      if (axios.isCancel(err) || err.name === 'CanceledError') {
        this.log('Download canceled.');
      } else {
        this.handleError(`HTTP request failed: ${err.message}`);
      }
    }
  }

  startSpeedCalculator() {
    let lastTime = Date.now();
    this.speedInterval = setInterval(() => {
      const now = Date.now();
      const timeDiffSec = (now - lastTime) / 1000;
      
      if (timeDiffSec > 0) {
        this.speed = Math.round(this.bytesInLastSecond / timeDiffSec);
        this.bytesInLastSecond = 0;
        lastTime = now;
        
        const remainingBytes = this.expectedSize - this.bytesReceived;
        if (this.speed > 0 && remainingBytes > 0) {
          this.eta = Math.round(remainingBytes / this.speed);
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
    this.status = 'completed';
    this.stopSpeedCalculator();
    this.cleanup();
    if (this.expectedSize) {
      this.bytesReceived = this.expectedSize;
    }
    this.speed = 0;
    this.eta = 0;
    this.updateStatus('completed');
  }

  handleError(msg) {
    this.log(`Error: ${msg}`);
    this.status = 'error';
    this.stopSpeedCalculator();
    this.cleanup();
    this.errorMessage = msg;
    this.updateStatus('error');
  }

  pause() {
    this.log('Pausing download...');
    this.status = 'paused';
    this.stopSpeedCalculator();
    if (this.abortController) {
      this.abortController.abort();
    }
    this.cleanup();
    this.updateStatus('paused');
  }

  cancel() {
    this.log('Cancelling download...');
    this.status = 'cancelled';
    this.stopSpeedCalculator();
    if (this.abortController) {
      this.abortController.abort();
    }
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
    if (this.fileStream) {
      try {
        this.fileStream.end();
      } catch (e) {}
      this.fileStream = null;
    }
  }
}
