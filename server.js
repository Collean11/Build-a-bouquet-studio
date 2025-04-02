import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateModel } from './src/server/utils/modelGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

// Enable CORS for development
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store configurations in memory (in a real app, you'd use a database)
const configurations = new Map();

// Handle preflight requests
app.options('/api/save-configuration', cors());

app.post('/api/save-configuration', (req, res) => {
    try {
        const configuration = req.body;
        console.log('Received configuration:', JSON.stringify(configuration, null, 2));
        
        if (!configuration.balloonColors || !configuration.balloonMaterials || !configuration.balloonTypes) {
            console.error('Invalid configuration received:', configuration);
            return res.status(400).json({ error: 'Invalid configuration: missing required fields' });
        }

        const id = Date.now().toString();
        configurations.set(id, configuration);
        console.log('Saved configuration with ID:', id);
        res.json({ id });
    } catch (error) {
        console.error('Error saving configuration:', error);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

app.get('/api/get-model/:id', async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Fetching model for ID:', id);
        
        const configuration = configurations.get(id);
        if (!configuration) {
            console.error('Configuration not found for ID:', id);
            return res.status(404).json({ error: 'Configuration not found' });
        }
        console.log('Found configuration:', configuration);

        // Generate the model
        console.log('Generating 3D model...');
        const buffer = await generateModel(configuration);
        console.log('3D model generated successfully');

        // Send the buffer
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(buffer);
        console.log('Model sent successfully');
    } catch (error) {
        console.error('Detailed error in get-model endpoint:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack,
            details: 'Failed to generate or export 3D model'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('CORS enabled for:', ['http://localhost:5173', 'http://localhost:3000']);
}); 