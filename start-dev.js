import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Start the Vite dev server
const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
});

// Start the proxy server
const proxy = spawn('node', ['src/server/proxy-server.js'], {
    stdio: 'inherit',
    shell: true
});

// Handle process termination
process.on('SIGINT', () => {
    vite.kill();
    proxy.kill();
    process.exit();
});

process.on('SIGTERM', () => {
    vite.kill();
    proxy.kill();
    process.exit();
}); 