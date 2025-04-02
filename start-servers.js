import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get absolute path to server.js
const serverPath = path.join(__dirname, 'src', 'server', 'server.js');
console.log('Starting server from:', serverPath);

// Start the API server
const apiServer = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: true,
    env: {
        ...process.env,
        NODE_ENV: 'development',
        PORT: '3002'
    }
});

// Start the development server
const devServer = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
        ...process.env,
        NODE_ENV: 'development'
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down servers...');
    apiServer.kill();
    devServer.kill();
    process.exit();
});

// Handle server errors
apiServer.on('error', (err) => {
    console.error('Failed to start API server:', err);
    process.exit(1);
});

devServer.on('error', (err) => {
    console.error('Failed to start development server:', err);
    process.exit(1);
});

// Log server output
apiServer.stdout.on('data', (data) => {
    console.log(`API Server: ${data}`);
});

apiServer.stderr.on('data', (data) => {
    console.error(`API Server Error: ${data}`);
}); 