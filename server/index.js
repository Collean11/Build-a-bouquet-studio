import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Store balloon configurations in memory
const balloonConfigs = new Map();

// Create a basic balloon mesh
function createBalloonMesh(color, scale = 1) {
    try {
        const geometry = new THREE.SphereGeometry(0.5 * scale, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(color),
            metalness: 0.5,
            roughness: 0.5
        });
        return new THREE.Mesh(geometry, material);
    } catch (error) {
        console.error('Error creating balloon mesh:', error);
        throw error;
    }
}

// Create a scene from configuration
function createSceneFromConfig(config) {
    try {
        if (!config || !config.balloonColors || !config.balloonTypes || !config.balloonMaterials) {
            throw new Error('Invalid configuration object');
        }

        const scene = new THREE.Scene();
        
        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);

        // Create balloon group
        const balloonGroup = new THREE.Group();
        
        // Add balloons based on configuration
        Object.entries(config.balloonColors).forEach(([id, color]) => {
            try {
                const scale = config.balloonTypes[id] === 'B' ? 0.7 : 1;
                const balloon = createBalloonMesh(color, scale);
                
                // Position balloons based on their ID
                switch(id) {
                    case 'top':
                        balloon.position.set(0, 2, 0);
                        break;
                    case 'middle1':
                        balloon.position.set(-0.5, 1.5, 0);
                        break;
                    case 'middle2':
                        balloon.position.set(0, 1.5, 0);
                        break;
                    case 'middle3':
                        balloon.position.set(0.5, 1.5, 0);
                        break;
                    case 'bottom1':
                        balloon.position.set(-0.5, 1, 0);
                        break;
                    case 'bottom2':
                        balloon.position.set(0, 1, 0);
                        break;
                    case 'bottom3':
                        balloon.position.set(0.5, 1, 0);
                        break;
                }
                
                // Apply material properties
                if (config.balloonMaterials[id] === 'metallic') {
                    balloon.material.metalness = 0.9;
                    balloon.material.roughness = 0.1;
                } else if (config.balloonMaterials[id] === 'pearl') {
                    balloon.material.metalness = 0.3;
                    balloon.material.roughness = 0.7;
                }
                
                balloonGroup.add(balloon);
            } catch (error) {
                console.error(`Error creating balloon ${id}:`, error);
                throw error;
            }
        });
        
        scene.add(balloonGroup);
        return scene;
    } catch (error) {
        console.error('Error creating scene:', error);
        throw error;
    }
}

app.post('/api/save-config', async (req, res) => {
    try {
        const { modelData, configId } = req.body;
        console.log('Saving configuration:', { configId, modelData });
        
        if (!modelData || !configId) {
            throw new Error('Missing required data');
        }
        
        balloonConfigs.set(configId, modelData);
        
        res.json({ 
            success: true, 
            configId,
            message: 'Configuration saved successfully'
        });
    } catch (error) {
        console.error('Error saving configuration:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to save configuration' 
        });
    }
});

app.get('/api/model/:configId', async (req, res) => {
    const { configId } = req.params;
    console.log('Fetching model for config:', configId);
    
    try {
        const config = balloonConfigs.get(configId);
        console.log('Found configuration:', config);
        
        if (!config) {
            return res.status(404).json({ 
                success: false, 
                error: 'Configuration not found' 
            });
        }

        // Create scene from configuration
        const scene = createSceneFromConfig(config);
        
        // Export scene to GLB
        const exporter = new GLTFExporter();
        const glb = await new Promise((resolve, reject) => {
            exporter.parse(
                scene,
                (buffer) => resolve(buffer),
                (error) => reject(error),
                { 
                    binary: true,
                    embedImages: true,
                    forceIndices: true,
                    includeCustomExtensions: true
                }
            );
        });
        
        // Clean up Three.js resources
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        
        // Send GLB data directly
        res.set('Content-Type', 'model/gltf-binary');
        res.send(Buffer.from(glb));
        
    } catch (error) {
        console.error('Error generating model:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to generate model' 
        });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
