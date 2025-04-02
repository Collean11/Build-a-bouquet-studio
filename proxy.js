const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Proxy middleware configuration
app.use('/ar-models', createProxyMiddleware({
    target: 'https://firebasestorage.googleapis.com',
    changeOrigin: true,
    pathRewrite: {
        '^/ar-models': '/v0/b/build-a-bouquet-studio-34ba3.firebasestorage.app/o/ar-models'
    },
    onProxyRes: function(proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Content-Disposition';
        proxyRes.headers['Access-Control-Max-Age'] = '3600';
        proxyRes.headers['Access-Control-Expose-Headers'] = 'Content-Type, Content-Disposition';
    }
}));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
}); 