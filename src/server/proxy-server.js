import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = 5182; // Changed port number

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:5177', 'http://localhost:5180', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
    credentials: true
}));

app.get('/model/*', async (req, res) => {
    try {
        // Get the full path after /model/
        const modelPath = req.params[0];
        
        // Construct the Firebase Storage URL
        const storageUrl = `https://firebasestorage.googleapis.com/v0/b/build-a-bouquet-studio-34ba3.firebasestorage.app/o/${encodeURIComponent(modelPath)}?alt=media`;
        
        console.log('Fetching from:', storageUrl);
        
        const response = await fetch(storageUrl);
        
        if (!response.ok) {
            console.error('Storage response error:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Forward all headers from the Firebase response
        for (const [key, value] of response.headers) {
            res.set(key, value);
        }
        
        // Set additional CORS headers
        res.set({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept, Origin',
            'Access-Control-Expose-Headers': 'Content-Type, Content-Length',
            'Cross-Origin-Resource-Policy': 'cross-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin'
        });
        
        // Pipe the response
        response.body.pipe(res);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch model', details: error.message });
    }
});

// Add an error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
}); 