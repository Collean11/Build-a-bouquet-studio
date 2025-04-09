import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
// Important: If your base GLB uses Draco compression, you MUST uncomment
// and configure the DRACOLoader here as well.
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

// --- Draco Loader Setup (Only if needed) ---
const dracoLoader = new DRACOLoader();
// Set path relative to the worker's location OR pass the full path from main thread
dracoLoader.setDecoderPath('/draco/'); // Adjust if necessary
// -----------------------------------------

const exporter = new GLTFExporter();
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

self.onmessage = async (event) => {
  const { balloonTypes, balloonColors, balloonMaterials, modelPath } = event.data;
  console.log('[Worker] Received state:', { balloonTypes, balloonColors, balloonMaterials });
  console.log('[Worker] Model path:', modelPath);
  // console.log('[Worker] Draco path:', dracoDecoderPath); // If passed

  try {
    console.log('[Worker] Starting model loading...');

    // 1. Load the base GLB model data
    const gltf = await new Promise((resolve, reject) => {
        loader.load(
            modelPath, // Use the path passed from the main thread
            resolve,
            undefined, // Progress callback (optional)
            reject
        );
    });
    console.log('[Worker] Base model loaded.');

    const sceneToExport = gltf.scene.clone(true);
    console.log('[Worker] Cloned base scene graph.');

    // 2. Prepare Materials specific to this export (simplified version)
    // Note: A more robust solution might share the material logic or pass
    //       pre-generated material data from the main thread if needed.
    const exportMaterials = {};
    Object.keys(balloonColors).forEach(balloonId => {
      const color = balloonColors[balloonId];
      const materialType = balloonMaterials[balloonId];
      const key = `${balloonId}-${color}-${materialType}`; // Unique key

       let newMaterial;
       if (materialType === 'metallic') {
         newMaterial = new THREE.MeshStandardMaterial({
           color: color, metalness: 1.0, roughness: 0.1, name: key
         });
       } else if (materialType === 'matte') {
          newMaterial = new THREE.MeshStandardMaterial({
           color: color, metalness: 0.1, roughness: 0.9, name: key
         });
       } else { // Default to standard/glossy
         newMaterial = new THREE.MeshStandardMaterial({
           color: color, metalness: 0.3, roughness: 0.3, name: key
         });
       }
       exportMaterials[key] = newMaterial;
    });
    // Single-sided string material
    exportMaterials['whiteStringMat-singleSided'] = new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.8, metalness: 0.1, name: 'whiteStringMat-singleSided', side: THREE.FrontSide
    });
    console.log('[Worker] Materials prepared for export.');


    // 3. Apply customizations (visibility, materials) to the cloned scene
    sceneToExport.traverse((node) => {
        if (node.isMesh) {
            // --- Balloon Logic ---
            const match = node.name.match(/^(Top|Middle1|Middle2|Middle3|Bottom1|Bottom2|Bottom3)([ABC])?$/);
            if (match) {
                const positionCamelCase = match[1];
                const balloonShape = match[2] || 'A';

                if (node.name.includes(positionCamelCase)) {
                    const targetType = balloonTypes[positionCamelCase] || 'A';
                    node.visible = (targetType === 'A');

                    if (node.visible) {
                        const materialKey = `${positionCamelCase}-${balloonShape}-${balloonShape}`;
                        if (exportMaterials[materialKey]) {
                            node.material = exportMaterials[materialKey];
                        } else {
                            console.warn(`[Worker] Material Warning: Key ${materialKey} not found for ${node.name}. Using original.`);
                        }
                    }
                }
            }
            // --- String Logic ---
            // Updated check for Strings to include variations like 'BodyStrings'
            else if (node.name.includes('String')) {
                const stringPosMatch = node.name.match(/(Top|Middle1|Middle2|Middle3|Bottom1|Bottom2|Bottom3)/);
                 if (stringPosMatch) {
                     const positionCamelCase = stringPosMatch[1];
                     const positionMap = { 'Top': 'top', 'Middle1': 'middle1', 'Middle2': 'middle2', 'Middle3': 'middle3', 'Bottom1': 'bottom1', 'Bottom2': 'bottom2', 'Bottom3': 'bottom3' };
                     const balloonId = positionMap[positionCamelCase];

                     if(balloonId) {
                        const targetType = balloonTypes[balloonId] || 'A'; // Assume strings relate to balloon type 'A'
                        node.visible = (targetType === 'A'); // Strings only visible for type A

                        if (node.visible) {
                            const stringKey = 'whiteStringMat-singleSided';
                            if (exportMaterials[stringKey]) {
                                node.material = exportMaterials[stringKey];
                            } else {
                                 console.warn(`[Worker] String Material Warning: Key ${stringKey} not found for ${node.name}. Using original.`);
                            }
                        }
                    }
                }
            }
        }
    });
    console.log('[Worker] Customizations applied to cloned scene.');


    // 4. Export the prepared scene
    const exportedData = await exporter.parse(sceneToExport, { binary: true });
    console.log('[Worker] Scene exported.');

    self.postMessage(exportedData);
  } catch (error) {
    console.error('[Worker] Error:', error);
    self.postMessage(null);
  }
};

