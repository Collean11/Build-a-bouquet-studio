import express from 'express';
import { generateModel } from '../utils/modelGenerator.js';

const router = express.Router();

// Store configurations in memory (replace with database in production)
const configurations = new Map();

router.post('/save-configuration', async (req, res) => {
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

router.get('/get-model/:id', async (req, res) => {
    try {
        const configurationId = req.params.id;
        console.log('Fetching model for ID:', configurationId);
        
        const configuration = configurations.get(parseInt(configurationId));
        if (!configuration) {
            throw new Error('Configuration not found');
        }
        
        console.log('Found configuration:', configuration);

        // Generate the model
        const buffer = await generateModel(configuration);

        // Set response headers
        res.setHeader('Content-Type', 'model/gltf-binary');
        res.setHeader('Content-Disposition', `attachment; filename="model.glb"`);
        
        // Send the buffer
        res.send(buffer);
        console.log('Model sent successfully');
    } catch (error) {
        console.error('Error generating model:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router; 