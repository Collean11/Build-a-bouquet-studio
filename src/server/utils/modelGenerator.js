import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { Scene } from 'three';
import { AmbientLight, DirectionalLight } from 'three';
import BalloonBouquetV4 from '../models/BalloonBouquetV4.js';
import { Circular } from '../models/Circular.js';
import { Color } from 'three';
import { Buffer } from 'buffer';

export async function generateModel(configuration) {
    // Create scene
    const scene = new Scene();
    scene.background = new Color(1, 1, 1);

    // Add lights
    const ambientLight = new AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.target.position.set(0, 0, -1);
    scene.add(directionalLight);

    // Add models
    const bouquet = new BalloonBouquetV4(configuration);
    scene.add(bouquet);

    const circular = new Circular();
    scene.add(circular);

    // Export to GLB
    console.log('Starting GLB export...');
    const exporter = new GLTFExporter();
    
    // Create a buffer to store the GLB data
    const buffer = await new Promise((resolve, reject) => {
        exporter.parse(
            scene,
            (glb) => {
                // Convert the GLB data to a Buffer
                const arrayBuffer = new Uint8Array(glb).buffer;
                resolve(Buffer.from(arrayBuffer));
            },
            (error) => {
                console.error('Export error:', error);
                reject(error);
            },
            { binary: true }
        );
    });

    return buffer;
} 