import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mcpServerPath = path.resolve(__dirname, '../mcp-server/index.js');

describe('PulseCast MCP Server', () => {
  it('initializes and lists all 7 expected tools via stdio', async () => {
    const proc = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdoutData = '';
    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    const initMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'vitest-client', version: '1.0' }
      }
    }) + '\n';

    const listMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    }) + '\n';

    proc.stdin.write(initMsg);
    proc.stdin.write(listMsg);

    // Wait for responses
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (stdoutData.includes('"id":2')) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 3000);
    });

    proc.kill();

    const lines = stdoutData.trim().split('\n').filter(l => l.startsWith('{'));
    expect(lines.length).toBeGreaterThanOrEqual(2);

    const initRes = JSON.parse(lines[0]);
    expect(initRes.result?.serverInfo?.name).toBe('pulsecast-mcp-server');

    const listRes = JSON.parse(lines[1]);
    expect(listRes.result?.tools).toBeDefined();

    const toolNames = listRes.result.tools.map(t => t.name);
    expect(toolNames).toContain('pulsecast_get_downloads');
    expect(toolNames).toContain('pulsecast_get_categories');
    expect(toolNames).toContain('pulsecast_search_catalog');
    expect(toolNames).toContain('pulsecast_search_xdcc');
    expect(toolNames).toContain('pulsecast_get_top_downloads');
    expect(toolNames).toContain('pulsecast_start_download');
    expect(toolNames).toContain('pulsecast_control_download');
    expect(toolNames.length).toBe(7);
  });

  it('executes pulsecast_get_top_downloads with structured response', async () => {
    let lastUrl = '';
    const mockHttp = http.createServer((req, res) => {
      lastUrl = req.url;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      if (req.url.includes('german')) {
        res.end(JSON.stringify({
          type: 'topdl',
          results: [
            { gets: '450x', filename: 'Film.1.German.1080p.mkv', sizeStr: '6.2G' },
            { gets: '320x', filename: 'Film.2.German.720p.mkv', sizeStr: '3.1G' }
          ]
        }));
      } else {
        res.end(JSON.stringify({
          type: 'topdl',
          results: [
            { gets: '999x', filename: 'Top.Global.Movie.1080p.mkv', sizeStr: '8.5G' }
          ]
        }));
      }
    });

    await new Promise((resolve) => mockHttp.listen(0, '127.0.0.1', resolve));
    const port = mockHttp.address().port;

    const proc = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PULSECAST_URL: `http://127.0.0.1:${port}` }
    });

    let stdoutData = '';
    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    const initMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'vitest-client', version: '1.0' }
      }
    }) + '\n';

    const callMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'pulsecast_get_top_downloads',
        arguments: { filter: 'german' }
      }
    }) + '\n';

    proc.stdin.write(initMsg);
    proc.stdin.write(callMsg);

    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (stdoutData.includes('"id":2')) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 3000);
    });

    proc.kill();
    await new Promise((resolve) => mockHttp.close(resolve));

    const lines = stdoutData.trim().split('\n').filter(l => l.startsWith('{'));
    const callResLine = lines.find(l => {
      try {
        return JSON.parse(l).id === 2;
      } catch {
        return false;
      }
    });
    expect(callResLine).toBeDefined();

    const callRes = JSON.parse(callResLine);
    expect(callRes.result?.content?.[0]?.text).toBeDefined();

    const resultData = JSON.parse(callRes.result.content[0].text);
    expect(resultData.success).toBe(true);
    expect(resultData.filter).toBe('german');
    expect(resultData.totalFound).toBe(2);
    expect(resultData.topDownloads).toHaveLength(2);
    expect(resultData.topDownloads[0]).toEqual({
      rank: 1,
      gets: '450x',
      filename: 'Film.1.German.1080p.mkv',
      size: '6.2G',
      sizeStr: '6.2G'
    });
    expect(resultData.topDownloads[1]).toEqual({
      rank: 2,
      gets: '320x',
      filename: 'Film.2.German.720p.mkv',
      size: '3.1G',
      sizeStr: '3.1G'
    });
    expect(lastUrl).toBe('/api/search?q=!topdl%20german&source=moviegods');
  });

  it('executes pulsecast_get_top_downloads without filter (default !topdl)', async () => {
    let lastUrl = '';
    const mockHttp = http.createServer((req, res) => {
      lastUrl = req.url;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        type: 'topdl',
        results: [
          { gets: '999x', filename: 'Top.Movie.Global.1080p.mkv', sizeStr: '10.5G' }
        ]
      }));
    });

    await new Promise((resolve) => mockHttp.listen(0, '127.0.0.1', resolve));
    const port = mockHttp.address().port;

    const proc = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PULSECAST_URL: `http://127.0.0.1:${port}` }
    });

    let stdoutData = '';
    proc.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    const initMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'vitest-client', version: '1.0' }
      }
    }) + '\n';

    const callMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'pulsecast_get_top_downloads',
        arguments: {}
      }
    }) + '\n';

    proc.stdin.write(initMsg);
    proc.stdin.write(callMsg);

    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (stdoutData.includes('"id":2')) {
          clearInterval(check);
          resolve();
        }
      }, 50);
      setTimeout(() => {
        clearInterval(check);
        resolve();
      }, 3000);
    });

    proc.kill();
    await new Promise((resolve) => mockHttp.close(resolve));

    const lines = stdoutData.trim().split('\n').filter(l => l.startsWith('{'));
    const callResLine = lines.find(l => {
      try {
        return JSON.parse(l).id === 2;
      } catch {
        return false;
      }
    });
    expect(callResLine).toBeDefined();

    const callRes = JSON.parse(callResLine);
    expect(callRes.result?.content?.[0]?.text).toBeDefined();

    const resultData = JSON.parse(callRes.result.content[0].text);
    expect(resultData.success).toBe(true);
    expect(resultData.filter).toBeNull();
    expect(resultData.query).toBe('!topdl');
    expect(resultData.totalFound).toBe(1);
    expect(resultData.topDownloads[0]).toEqual({
      rank: 1,
      gets: '999x',
      filename: 'Top.Movie.Global.1080p.mkv',
      size: '10.5G',
      sizeStr: '10.5G'
    });
    expect(lastUrl).toBe('/api/search?q=!topdl&source=moviegods');
  });
});
