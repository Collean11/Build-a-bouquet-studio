import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enable CORS for all routes
app.use(cors({
    origin: true, // Allow all origins in development
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Store configurations in memory (replace with database in production)
const configurations = new Map();

// Save configuration endpoint
app.post('/api/save-configuration', (req, res) => {
    try {
        const configuration = req.body;
        const configurationId = Date.now();
        configurations.set(configurationId, configuration);
        console.log('Saved configuration with ID:', configurationId);
        res.json({ configurationId });
    } catch (error) {
        console.error('Error saving configuration:', error);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Get configuration endpoint
app.get('/api/get-configuration/:id', (req, res) => {
    try {
        const configurationId = req.params.id;
        const configuration = configurations.get(parseInt(configurationId));
        if (!configuration) {
            res.status(404).json({ error: 'Configuration not found' });
            return;
        }
        res.json(configuration);
    } catch (error) {
        console.error('Error getting configuration:', error);
        res.status(500).json({ error: 'Failed to get configuration' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
const port = 3002;
app.listen(port, () => {
    console.log(`\nServer running at http://localhost:${port}`);
    console.log('CORS enabled for all origins');
});