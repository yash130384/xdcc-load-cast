import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mcpServerPath = path.resolve(__dirname, '../mcp-server/index.js');

describe('PulseCast MCP Server', () => {
  it('initializes and lists all 6 expected tools via stdio', async () => {
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
    expect(toolNames).toContain('pulsecast_start_download');
    expect(toolNames).toContain('pulsecast_control_download');
    expect(toolNames.length).toBe(6);
  });
});
