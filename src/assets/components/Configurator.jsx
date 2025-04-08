import { useCustomization } from "../../contexts/Customization";
import { useState, useEffect, useRef, useMemo } from 'react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import BalloonBouquetV4 from './BalloonBouquetV4';
import { Suspense } from 'react';
// Import directly
// import ARView from './ARView';
// Note: We're using Three.js from both @react-three/fiber and @google/model-viewer
// This causes a warning about multiple instances, but it's necessary for our use case
// as we need both libraries for different features (3D editing and AR viewing)
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
import { MeshReflectorMaterial } from '@react-three/drei';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const balloonTypeOptions = [
    { name: 'Latex', value: 'A' },
    { name: 'Heart', value: 'B' },
    { name: 'Star', value: 'C' }
];

const backgroundOptions = [
    { 
        name: 'Black', 
        value: '#000000', 
        primaryColor: '#333333' 
    },
    { 
        name: 'White', 
        value: '#FFFFFF', 
        primaryColor: '#EEEEEE' 
    },
    { 
        name: 'Sunset', 
        value: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 50%, #FFD93D 100%)', 
        primaryColor: '#FF6B6B' 
    },
    { 
        name: 'Ocean', 
        value: 'linear-gradient(135deg, #4ECDC4 0%, #45B7AF 50%, #2C3E50 100%)', 
        primaryColor: '#4ECDC4' 
    },
    { 
        name: 'Lavender', 
        value: 'linear-gradient(135deg, #A8A4E6 0%, #D4B0F7 50%, #E6E6FA 100%)', 
        primaryColor: '#A8A4E6' 
    },
    { 
        name: 'Mint', 
        value: 'linear-gradient(135deg, #98D8AA 0%, #B5EAD7 50%, #C7CEEA 100%)', 
        primaryColor: '#98D8AA' 
    },
    { 
        name: 'Blush', 
        value: 'linear-gradient(135deg, #FFB5B5 0%, #FFD1D1 50%, #FFE4E1 100%)', 
        primaryColor: '#FFB5B5' 
    },
    { 
        name: 'Sky', 
        value: 'linear-gradient(135deg, #89CFF0 0%, #B0E0E6 50%, #E0FFFF 100%)', 
        primaryColor: '#89CFF0' 
    },
    { 
        name: 'Rose', 
        value: 'linear-gradient(135deg, #E91E63 0%, #FF80AB 50%, #FFC0CB 100%)',
        primaryColor: '#E91E63'
    },
    { 
        name: 'Forest', 
        value: 'linear-gradient(135deg, #98FB98 0%, #90EE90 50%, #E8F5E9 100%)', 
        primaryColor: '#98FB98' 
    }
];

const Configurator = () => {
    console.log("Configurator component rendering START");

    const [showAR, setShowAR] = useState(false);
    const [modelBlobUrl, setModelBlobUrl] = useState(null);
    const [arSupported, setArSupported] = useState(false);
    const [arError, setArError] = useState(null);
    const [selectedBackground, setSelectedBackground] = useState(backgroundOptions[0].value);
    const [showWelcome, setShowWelcome] = useState(false);
    const { 
        selectedBalloon,
        setSelectedBalloon,
        balloonTypes,
        toggleBalloonType,
        balloonColors,
        setColor,
        balloonMaterials,
        setMaterial,
        colorOptions,
        materialOptions
    } = useCustomization();
    const [isLoading, setIsLoading] = useState(false);
    const sceneRef = useRef();
    const bouquetGroupRef = useRef();
    const [isMobileView, setIsMobileView] = useState(false);
    const [showUI, setShowUI] = useState(true);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const carouselRef = useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // --- Add State and Effect for AR Loading Indicator --- 
    const [isViewerLoading, setIsViewerLoading] = useState(false); // Initially false

    useEffect(() => {
        let timer = null;
        if (showAR && modelBlobUrl) {
             // Reset loading state when AR starts
            setIsViewerLoading(true);
            // Force hide loading indicator after a delay (e.g., 2 seconds)
            timer = setTimeout(() => {
                console.log('Configurator (AR Inline): Forcing loading indicator off after timeout.');
                setIsViewerLoading(false);
            }, 2000); // 2000 milliseconds = 2 seconds
        }
        // Cleanup the timer if the component unmounts or AR closes before timeout
        return () => { 
            if (timer) clearTimeout(timer); 
            setIsViewerLoading(false); // Ensure loading is false on cleanup
        }
    }, [showAR, modelBlobUrl]); 
    // --- End AR Loading Indicator Logic ---

    // Add useEffect for welcome message
    useEffect(() => {
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (!hasSeenWelcome) {
            setShowWelcome(true);
            localStorage.setItem('hasSeenWelcome', 'true');
        }
    }, []);

    // Add useEffect for responsive detection
    useEffect(() => {
        const checkMobile = () => {
            const isMobile = window.innerWidth <= 768;
            setIsMobileView(isMobile);
        };

        // Initial check
        checkMobile();

        // Add event listener for window resize
        window.addEventListener('resize', checkMobile);

        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Check AR support on component mount
    useEffect(() => {
        const checkAR = async () => {
            try {
                // Always set AR supported to true to show the button
                setArSupported(true);
                
                // Log platform for debugging
                const userAgent = navigator.userAgent;
                const platform = navigator.platform;
                console.log('AR: Device platform:', platform);
                console.log('AR: User agent:', userAgent);
            } catch (error) {
                console.error('AR: Error checking support:', error);
                // Still set AR supported to true even if check fails
                setArSupported(true);
            }
        };

        checkAR();
    }, []);

    // Update the useEffect for model-viewer initialization
    useEffect(() => {
        if (showAR && modelBlobUrl) {
            const modelViewer = document.querySelector('model-viewer');
            if (modelViewer) {
                // Preload the model with CORS handling
                const preloadModel = async () => {
                    try {
                        const response = await fetch(modelBlobUrl, {
                            mode: 'cors',
                            credentials: 'omit',
                            headers: {
                                'Accept': 'model/gltf-binary'
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        
                        const blob = await response.blob();
                        const cache = await caches.open('model-cache');
                        await cache.put(modelBlobUrl, new Response(blob, {
                            headers: {
                                'Content-Type': 'model/gltf-binary',
                                'Access-Control-Allow-Origin': '*'
                            }
                        }));
                        
                        // Set the model source directly
                        console.log('AR: Preload complete, setting model-viewer src.')
                        modelViewer.src = modelBlobUrl;
                    } catch (error) {
                        console.error('Error preloading model:', error);
                        // Set the model source directly even if preload fails
                        modelViewer.src = modelBlobUrl;
                    }
                };

                preloadModel();

                // No cleanup needed for load listener
                // return () => { ... }; 
            }
        }
    }, [showAR, modelBlobUrl]);

    // Preload the model for AR export (optional but good practice)
    useGLTF.preload('/models/balloon_bouquet_v4_condensed.glb');

    // Memoize materials specifically for export generation
    const exportMaterialsCache = useRef({}); // Use a ref to persist cache across renders

    useEffect(() => {
        // This effect creates/updates materials needed for export based on current state
        // It tries to cache them in exportMaterialsCache.current
        const updatedCache = { ...exportMaterialsCache.current }; // Start with existing cache
        let changed = false;

        // Balloon Materials
        Object.keys(balloonColors).forEach(balloonId => {
            const color = balloonColors[balloonId];
            const materialType = balloonMaterials[balloonId];
            const key = `${balloonId}-${color}-${materialType}`;

            if (!updatedCache[key]) { // Only create if not in cache
                console.log(`AR Export Prep: Creating material for key: ${key}`);
                let newMaterial;
                if (materialType === 'metallic') {
                    newMaterial = new THREE.MeshStandardMaterial({
                        color: color,
                        metalness: 1.0,
                        roughness: 0.1,
                        name: key
                    });
                } else if (materialType === 'matte') {
                    newMaterial = new THREE.MeshStandardMaterial({
                        color: color,
                        metalness: 0.1,
                        roughness: 0.9,
                        name: key
                    });
                } else { // Default to standard/glossy
                    newMaterial = new THREE.MeshStandardMaterial({
                        color: color,
                        metalness: 0.3,
                        roughness: 0.3,
                        name: key
                    });
                }
                updatedCache[key] = newMaterial;
                changed = true;
            }
        });

        // String Material (ensure single-sided)
        const stringKey = 'whiteStringMat-singleSided';
        if (!updatedCache[stringKey]) {
            console.log(`AR Export Prep: Creating single-sided string material: ${stringKey}`);
            updatedCache[stringKey] = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.8,
                metalness: 0.1,
                name: stringKey,
                side: THREE.FrontSide // Ensure single-sided
            });
            changed = true;
        }

        if (changed) {
            exportMaterialsCache.current = updatedCache;
             console.log('AR Export Prep: Updated material cache:', exportMaterialsCache.current);
        }

    }, [balloonColors, balloonMaterials]); // Re-run only when colors or material types change

    const handleArView = async () => {
        // No longer relies on bouquetGroupRef.current for export

        try {
            setArError(null);
            setIsLoading(true);
            console.log('AR: Starting independent model preparation for export...');

            // 1. Load the base GLB model data specifically for export
            const gltfData = await new Promise((resolve, reject) => {
                 const loader = new GLTFLoader(); 
                 loader.load(
                     '/models/balloon_bouquet_v4_condensed.glb',
                     (loadedGltf) => {
                          console.log('AR Export: Base GLB loaded successfully.');
                          resolve(loadedGltf);
                     },
                     undefined, // Progress callback (optional)
                     (error) => {
                         console.error('AR Export: Error loading base GLB:', error);
                         reject(new Error("Failed to load base model for AR."));
                     }
                 );
            });
            
            const sceneToExport = gltfData.scene.clone(true); // Clone the scene graph
            console.log('AR Export: Cloned base scene graph.'); // Add root object log maybe?

            // 2. Apply customizations (visibility, materials) to the cloned scene
            sceneToExport.traverse((node) => {
                if (node.isMesh) {
                    // console.log(`AR Export Prep: Processing node: ${node.name}`); // Verbose log
                    const parts = node.name.split('_'); // e.g., balloon_top_A, string_top

                    if (parts.length >= 2 && parts[0] === 'balloon') {
                        const balloonId = parts[1]; // e.g., 'top', 'middle1'
                        const balloonShape = parts.length > 2 ? parts[2] : 'A'; // Default 'A'

                        // Visibility based on selected type for this position
                        const targetType = balloonTypes[balloonId] || 'A'; // Fallback if ID not found
                        node.visible = (balloonShape === targetType);
                        // console.log(`AR Export Prep: [${node.name}] ID: ${balloonId}, Shape: ${balloonShape}, Target: ${targetType}, Visible: ${node.visible}`); // Verbose log

                        // Apply Material only if visible
                        if (node.visible) {
                            const color = balloonColors[balloonId];
                            const materialType = balloonMaterials[balloonId];
                            const materialKey = `${balloonId}-${color}-${materialType}`;
                            
                            if (exportMaterialsCache.current[materialKey]) {
                                node.material = exportMaterialsCache.current[materialKey];
                                // console.log(`AR Export Prep: Applied material ${materialKey} to ${node.name}`); // Verbose log
                            } else {
                                console.warn(`AR Export Prep: Material key ${materialKey} not found in cache for ${node.name}. Using original material.`);
                                // Fallback: Use the material already on the node (from the loaded GLB)
                                // Ensure it's cloned if necessary? GLTFExporter might handle this.
                                // For safety, let's leave the original material from the clone.
                            }
                        }
                    } else if (node.name.startsWith('string_')) {
                         const balloonId = parts[1]; // e.g., 'top'
                         const targetType = balloonTypes[balloonId] || 'A'; // Fallback
                         
                         // String visibility should match the visibility of the corresponding 'A' (Latex) balloon type
                         // Check if the *currently selected* type for this position is 'A'
                         node.visible = (targetType === 'A');
                         // console.log(`AR Export Prep: [${node.name}] ID: ${balloonId}, Target Type: ${targetType}, Visible: ${node.visible}`); // Verbose log

                         if (node.visible) {
                            // Apply the cached single-sided string material
                            const stringKey = 'whiteStringMat-singleSided';
                            if (exportMaterialsCache.current[stringKey]) {
                                node.material = exportMaterialsCache.current[stringKey];
                                // console.log(`AR Export Prep: Applied single-sided string material to ${node.name}`); // Verbose log
                            } else {
                                 console.warn(`AR Export Prep: Cached string material not found for ${node.name}. Forcing original material to single-sided.`);
                                 // Fallback: Force the original material to be single-sided
                                 if (node.material && node.material.isMaterial) {
                                     node.material.side = THREE.FrontSide;
                                 } else {
                                     console.error(`AR Export Prep: Cannot set side property on non-material for ${node.name}`);
                                 }
                            }
                         }
                    }
                    
                    // General cleanup for invisible nodes (optional, but might help)
                    // if (!node.visible) {
                    //     node.material = null; // Remove material reference?
                    //     // geometry cleanup? maybe too much
                    // }
                }
            });

            console.log('AR Export Prep: Customizations applied to cloned scene.');

            // 3. Export the prepared scene
            const exporter = new GLTFExporter();
            console.log('AR DEBUG: Starting exporter.parse with prepared scene...');

            let gltf;
            gltf = await new Promise((resolve, reject) => {
                exporter.parse(
                    sceneToExport, // Use the prepared scene object
                    (gltfDataResult) => {
                        console.log('AR DEBUG: GLTFExporter.parse successful for prepared scene.', gltfDataResult);
                        resolve(gltfDataResult);
                    },
                    (error) => {
                        console.error('AR: GLTFExporter parse error for prepared scene', error);
                        reject(error); // Use the actual error object
                    },
                    {
                        binary: true,
                        trs: false, // Transforms should be baked in the original model
                        embedImages: true, // Necessary if model has textures (unlikely here)
                        maxTextureSize: 1024, // Keep reasonable limit
                        // onlyVisible: false // We manually set visibility, export the structure
                    }
                );
            });

            // --- Check result and proceed with upload ---
            if (!(gltf instanceof ArrayBuffer)) {
                 console.error('AR Error: Export did not produce ArrayBuffer');
                 throw new Error("GLTFExporter failed to produce valid data.");
             }

            console.log(`AR DEBUG: Exported Prepared Scene GLB size (ArrayBuffer): ${gltf.byteLength} bytes`);
            const blob = new Blob([gltf], { type: 'model/gltf-binary' });
            console.log(`AR DEBUG: Prepared Scene Blob size before upload: ${blob.size} bytes`);

            // --- Upload to Firebase Storage ---
             const timestamp = Date.now();
             const filename = `ar-model-${timestamp}.glb`; 
             const storageRef = ref(storage, `ar-models/${filename}`);

            console.log('AR: Uploading Prepared Scene GLB to Firebase Storage...');
            await uploadBytes(storageRef, blob);
            console.log('AR: Prepared Scene Upload complete');

            const downloadURL = await getDownloadURL(storageRef);
            console.log('AR: Prepared Scene Model URL created:', downloadURL);

            setModelBlobUrl(downloadURL); // Set the URL for model-viewer
            setShowAR(true);              // Show the AR overlay
            console.log('AR: Setting showAR to true.');

        } catch (error) {
            console.error('AR: Export or Preparation failed', error);
            // Use optional chaining and provide a default message
            const errorMessage = error?.message || 'An unknown error occurred during AR preparation/export.';
            setArError(`AR Error: ${errorMessage}`);
        } finally {
            setIsLoading(false); // Ensure loading indicator stops
            console.log('AR: Preparation & Export process finished (or failed).');
        }
    };

    const handleExitAR = () => {
        console.log('AR: Exiting AR view.');
        setShowAR(false);
        setModelBlobUrl(null); // Clear the URL
        setArError(null);     // Clear any errors
        setIsViewerLoading(false); // Ensure loading indicator is off
    };

    const handleARButtonClick = () => {
        const modelViewer = document.querySelector('model-viewer');
        if (modelViewer && modelViewer.arButton) {
            modelViewer.arButton.click();
        } else {
            setArError('AR button not available');
        }
    };

    // Add a loading indicator component
    const LoadingIndicator = () => (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1000,
            color: 'white' // Ensure text is visible
        }}>
            <div style={{
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #FF69B4',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 10px'
            }} />
            <p>Loading 3D Model...</p>
        </div>
    );

    // Add balloon positions array
    const balloonPositions = [
        { id: 'top', name: 'Top Balloon' },
        { id: 'middle1', name: 'Middle Front' },
        { id: 'middle2', name: 'Middle Right' },
        { id: 'middle3', name: 'Middle Left' },
        { id: 'bottom1', name: 'Bottom Front' },
        { id: 'bottom2', name: 'Bottom Right' },
        { id: 'bottom3', name: 'Bottom Left' }
    ];

    // Add function to show welcome message
    const showWelcomeMessage = () => {
        setShowWelcome(true);
    };

    // Define carousel cards with categories
    const carouselCards = [
        {
            id: 'balloon-selection',
            title: 'Select Balloon',
            icon: '🎈',
            content: ({ balloonPositions, selectedBalloon, setSelectedBalloon }) => (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    width: '100%'
                }}>
                    {balloonPositions.map((balloon) => (
                        <button
                            key={balloon.id}
                            onClick={() => setSelectedBalloon(balloon.id)}
                            style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: selectedBalloon === balloon.id ? '#E91E63' : 'rgba(255, 255, 255, 0.8)',
                                color: selectedBalloon === balloon.id ? 'white' : '#1C1B1F',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                border: selectedBalloon === balloon.id ? '2px solid #E91E63' : '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: selectedBalloon === balloon.id ? '0 4px 12px rgba(233, 30, 99, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            {balloon.name}
                        </button>
                    ))}
                </div>
            )
        },
        {
            id: 'balloon-type',
            title: 'Balloon Type',
            icon: '🎯',
            content: ({ balloonTypes, toggleBalloonType, selectedBalloon, balloonTypeOptions }) => {
                const typeContent = (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '8px',
                        width: '100%'
                    }}>
                        {balloonTypeOptions.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => toggleBalloonType(selectedBalloon || 'top', type.value)}
                                style={{
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background: balloonTypes[selectedBalloon || 'top'] === type.value ? '#E91E63' : 'rgba(255, 255, 255, 0.8)',
                                    color: balloonTypes[selectedBalloon || 'top'] === type.value ? 'white' : '#1C1B1F',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    transition: 'all 0.2s ease',
                                    border: balloonTypes[selectedBalloon || 'top'] === type.value ? '2px solid #E91E63' : '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: balloonTypes[selectedBalloon || 'top'] === type.value ? '0 4px 12px rgba(233, 30, 99, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                {type.name}
                            </button>
                        ))}
                    </div>
                );

                return (
                    // Wrap the type content in the scrollable div
                    <div style={{
                        overflowY: 'auto',
                        maxHeight: isMobileView ? '100px' : '150px',
                        paddingRight: '5px'
                    }}>
                        {typeContent}
                    </div>
                );
            }
        },
        {
            id: 'colors',
            title: 'Colors',
            icon: '🎨',
            content: ({ balloonColors, setColor, selectedBalloon, colorOptions }) => {
                const colorContent = (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: '100%'
                    }}>
                        {['Pastel', 'Rich', 'Classic', 'Vibrant', 'Metallic'].map((category, categoryIndex) => (
                            <div key={category} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                width: '100%'
                            }}>
                                <h4 style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    marginBottom: '6px'
                                }}>{category}</h4>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                                    gap: '8px',
                                    justifyItems: 'center',
                                    alignItems: 'center'
                                }}>
                                    {colorOptions.slice(categoryIndex * 6, (categoryIndex + 1) * 6).map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setColor(selectedBalloon || 'top', color.value)}
                                            style={{
                                                boxSizing: 'border-box',
                                                width: '32px',
                                                height: '32px',
                                                minWidth: '32px',
                                                minHeight: '32px',
                                                maxWidth: '32px',
                                                maxHeight: '32px',
                                                padding: 0,
                                                borderRadius: '50%',
                                                border: 'none',
                                                background: color.value,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                position: 'relative'
                                            }}
                                        >
                                            {balloonColors[selectedBalloon || 'top'] === color.value && (
                                                <div style={{ position: 'absolute', top: '-1px', left: '-1px', right: '-1px', bottom: '-1px', borderRadius: '50%', border: '1px solid #E91E63', animation: 'pulse 2s infinite' }} />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
                
                return (
                    <div style={{
                        overflowY: 'auto',
                        maxHeight: isMobileView ? '100px' : '150px',
                        paddingRight: '5px'
                    }}>
                        {colorContent}
                    </div>
                );
            }
        },
        {
            id: 'materials',
            title: 'Materials',
            icon: '✨',
            content: ({ balloonMaterials, setMaterial, selectedBalloon, materialOptions }) => (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    width: '100%'
                }}>
                    {materialOptions.map((material) => (
                        <button
                            key={material.value}
                            onClick={() => setMaterial(selectedBalloon || 'top', material.value)}
                            style={{
                                padding: '8px',
                                borderRadius: '8px',
                                background: balloonMaterials[selectedBalloon || 'top'] === material.value ? '#E91E63' : 'rgba(255, 255, 255, 0.8)',
                                color: balloonMaterials[selectedBalloon || 'top'] === material.value ? 'white' : '#1C1B1F',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                border: balloonMaterials[selectedBalloon || 'top'] === material.value ? '2px solid #E91E63' : '1px solid rgba(255, 255, 255, 0.2)',
                                boxShadow: balloonMaterials[selectedBalloon || 'top'] === material.value ? '0 4px 12px rgba(233, 30, 99, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            {material.name}
                        </button>
                    ))}
                </div>
            )
        },
        {
            id: 'background',
            title: 'Background',
            icon: '🌈',
            content: ({ backgroundOptions, selectedBackground, setSelectedBackground }) => {
                const backgroundGrid = (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '6px',
                        width: '100%'
                    }}>
                        {backgroundOptions.map((bg) => (
                            <button
                                key={bg.name}
                                onClick={() => setSelectedBackground(bg.value)}
                                style={{
                                    aspectRatio: '1',
                                    borderRadius: '8px',
                                    background: bg.value,
                                    border: selectedBackground === bg.value ? '2px solid #E91E63' : '2px solid rgba(255, 255, 255, 0.8)',
                                    boxShadow: selectedBackground === bg.value ? '0 4px 12px rgba(233, 30, 99, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                                    transform: selectedBackground === bg.value ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    padding: 0,
                                    width: '100%'
                                }}
                            >
                                <span style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    padding: '4px',
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    color: 'white',
                                    fontSize: '10px',
                                    textAlign: 'center',
                                    backdropFilter: 'blur(4px)',
                                    WebkitBackdropFilter: 'blur(4px)',
                                    borderBottomLeftRadius: '6px',
                                    borderBottomRightRadius: '6px'
                                }}>
                                    {bg.name}
                                </span>
                            </button>
                        ))}
                    </div>
                );

                return (
                    // Wrap the grid in the scrollable div
                    <div style={{
                        display: 'flex',
                        overflowY: 'auto',
                        maxHeight: isMobileView ? '80px' : '150px', 
                        paddingRight: '5px' 
                    }}>
                        {backgroundGrid}
                    </div>
                );
            }
        }
    ];

    // Touch handling functions
    const handleTouchStart = (e) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const diff = touchStart - touchEnd;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentCardIndex < carouselCards.length - 1) {
                setCurrentCardIndex(prev => prev + 1);
            } else if (diff < 0 && currentCardIndex > 0) {
                setCurrentCardIndex(prev => prev - 1);
            }
        }
        setTouchStart(null);
        setTouchEnd(null);
    };

    const handleCanvasClick = () => {
        console.log('Canvas BACKGROUND clicked, deselecting balloon.');
        setSelectedBalloon(null);
    };

    console.log("Configurator component rendering RETURN");
    return (
        <>
            {showWelcome && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    zIndex: 1004,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        padding: isMobileView ? '24px' : '32px',
                        borderRadius: '24px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                        maxWidth: isMobileView ? '90%' : '480px',
                        width: '90%',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        animation: 'slideUp 0.5s ease'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: isMobileView ? '20px' : '28px'
                        }}>
                            <span style={{
                                fontSize: isMobileView ? '48px' : '56px',
                                animation: 'bounce 2s infinite'
                            }}>🎈</span>
                        </div>
                        <h2 style={{
                            color: '#1C1B1F',
                            fontSize: isMobileView ? '24px' : '32px',
                            marginBottom: isMobileView ? '16px' : '20px',
                            textAlign: 'center',
                            fontWeight: '600',
                            animation: 'fadeIn 0.5s ease 0.2s both'
                        }}>
                            Welcome to Balloon Studio
                        </h2>
                        <div style={{
                            color: '#49454F',
                            fontSize: isMobileView ? '15px' : '17px',
                            lineHeight: isMobileView ? '1.6' : '1.7',
                            marginBottom: isMobileView ? '24px' : '32px',
                            animation: 'fadeIn 0.5s ease 0.4s both'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: isMobileView ? '16px' : '20px',
                                gap: '12px'
                            }}>
                                <span style={{ 
                                    fontSize: '24px',
                                    opacity: 0.9
                                }}>👆</span>
                                <span>Tap any balloon to select it</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: isMobileView ? '16px' : '20px',
                                gap: '12px'
                            }}>
                                <span style={{ 
                                    fontSize: '24px',
                                    opacity: 0.9
                                }}>🎨</span>
                                <span>Customize colors, types, and materials</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginBottom: isMobileView ? '16px' : '20px',
                                gap: '12px'
                            }}>
                                <span style={{ 
                                    fontSize: '24px',
                                    opacity: 0.9
                                }}>🌈</span>
                                <span>Try different background styles</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <span style={{ 
                                    fontSize: '24px',
                                    opacity: 0.9
                                }}>📱</span>
                                <span>View your bouquet in AR</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowWelcome(false)}
                            style={{
                                backgroundColor: '#E91E63',
                                color: 'white',
                                border: 'none',
                                padding: isMobileView ? '12px 24px' : '14px 28px',
                                borderRadius: '8px',
                                fontSize: isMobileView ? '16px' : '18px',
                                cursor: 'pointer',
                                width: '100%',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 6px rgba(233, 30, 99, 0.2)',
                                animation: 'fadeIn 0.5s ease 0.6s both'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(233, 30, 99, 0.2)';
                            }}
                        >
                            Let's Start Creating! ✨
                        </button>
                    </div>
                    <style>
                        {`
                            @keyframes fadeIn {
                                from { opacity: 0; }
                                to { opacity: 1; }
                            }
                            @keyframes slideUp {
                                from { 
                                    transform: translateY(20px);
                                    opacity: 0;
                                }
                                to { 
                                    transform: translateY(0);
                                    opacity: 1;
                                }
                            }
                            @keyframes bounce {
                                0%, 20%, 50%, 80%, 100% { 
                                    transform: translateY(0);
                                }
                                40% { 
                                    transform: translateY(-20px);
                                }
                                60% { 
                                    transform: translateY(-10px);
                                }
                            }
                        `}
                    </style>
                </div>
            )}
            <style>
                {`
                    .background-options {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 8px;
                        padding: 10px;
                    }

                    .background-option {
                        position: relative;
                        width: 100%;
                        aspect-ratio: 1;
                        border-radius: 12px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        overflow: hidden;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }

                    .background-option:hover {
                        transform: scale(1.05);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }

                    .background-option.active {
                        border: 2px solid #E91E63;
                        box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
                    }

                    @media (max-width: 768px) {
                        .background-options {
                            grid-template-columns: repeat(4, 1fr);
                            gap: 4px;
                            padding: 5px;
                        }
                    }
                `}
            </style>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                ...(selectedBackground.startsWith('linear-gradient') ? 
                    { backgroundImage: selectedBackground } : 
                    { backgroundColor: selectedBackground }),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0,
                pointerEvents: 'auto',
                transition: 'background-color 0.3s ease, background-image 0.3s ease', 
                margin: 0,
                padding: 0,
                overflow: 'hidden'
            }} />
            {!showAR && (
                <Canvas
                    ref={sceneRef}
                    camera={{ position: [0, 1, 2], fov: 60 }}
                    style={{
                        background: 'transparent',
                        width: '100vw',
                        height: '100vh',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 1,
                        pointerEvents: 'auto'
                    }}
                    gl={{
                        antialias: true,
                        alpha: true,
                        powerPreference: "high-performance",
                        stencil: false,
                        depth: true,
                        shadows: true
                    }}
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight 
                        position={[5, 5, 5]} 
                        intensity={1.5} 
                        castShadow 
                        shadow-mapSize-width={2048} 
                        shadow-mapSize-height={2048} 
                        shadow-camera-far={50}
                        shadow-camera-left={-10}
                        shadow-camera-right={10}
                        shadow-camera-top={10}
                        shadow-camera-bottom={-10}
                    />
                    <directionalLight 
                        position={[-5, 3, -5]} 
                        intensity={0.8} 
                        castShadow
                    />
                    <pointLight 
                        position={[0, 10, 0]} 
                        intensity={0.5} 
                        castShadow
                    />
                    
                    { (() => {
                      const floorColor = backgroundOptions.find(bg => bg.value === selectedBackground)?.primaryColor || '#CCCCCC';
                      console.log('[Floor Color] Calculated for MeshReflectorMaterial:', floorColor, ' (Selected BG:', selectedBackground, ')');
                      return null;
                    })() }

                     <mesh 
                         position={[0, 0, -5]}
                         onClick={handleCanvasClick}
                     >
                         <planeGeometry args={[100, 100]} />
                         <meshBasicMaterial transparent opacity={0} depthWrite={false} />
                     </mesh>
                     <mesh 
                         rotation={[-Math.PI / 2, 0, 0]} 
                         position={[0, -1, 0]} 
                         receiveShadow
                     >
                         <planeGeometry args={[50, 50]} />
                         <MeshReflectorMaterial
                             blur={[300, 100]}
                             resolution={1024}
                             mixBlur={1}
                             mixStrength={5}
                             roughness={1}
                             depthScale={1.2}
                             minDepthThreshold={0.4}
                             maxDepthThreshold={1.4}
                             color={backgroundOptions.find(bg => bg.value === selectedBackground)?.primaryColor || '#CCCCCC'}
                             metalness={0}
                             mirror={0}
                        />
                     </mesh>
                     <group 
                        ref={bouquetGroupRef}
                        position={[0, -1, 0]}
                     >
                         <Suspense fallback={null}>
                             <BalloonBouquetV4 
                                 position={[0, 0, 0]}
                             />
                         </Suspense>
                     </group>
                    <OrbitControls 
                         enablePan={false} 
                         minDistance={1}
                         maxDistance={20}
                         minPolarAngle={Math.PI / 4}
                         maxPolarAngle={Math.PI / 2}
                         enableDamping
                         dampingFactor={0.05}
                         target={[0, 0, 0]}
                     />
                    <Environment preset="studio" background={false} />
                </Canvas>
            )}

            {!showAR && (
                <>
                    <button 
                        onClick={() => setShowUI(!showUI)}
                        style={{
                            position: 'fixed',
                            ...(isMobileView ? {
                                top: '20px',
                                left: '20px'
                            } : {
                                top: '20px',
                                right: '20px'
                            }),
                            zIndex: 1002,
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#E91E63',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '24px',
                            boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            padding: 0,
                            paddingBottom: '4px',
                            margin: 0,
                            boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(233, 30, 99, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.3)';
                        }}
                    >
                        {showUI ? '×' : '☰'}
                    </button>

                    <button 
                        onClick={showWelcomeMessage}
                        style={{
                            position: 'fixed',
                            ...(isMobileView ? {
                                top: '20px',
                                right: '90px'
                            } : {
                                top: '20px',
                                right: '70px'
                            }),
                            zIndex: 1002,
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#E91E63',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '24px',
                            boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            padding: 0,
                            paddingBottom: '3px',
                            margin: 0,
                            boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(233, 30, 99, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.3)';
                        }}
                    >
                        ?
                    </button>

                    <button
                        onClick={handleArView}
                        style={{
                            position: 'fixed',
                            ...(isMobileView ? {
                                top: '20px',
                                right: '20px'
                            } : {
                                bottom: '20px',
                                right: '20px'
                            }),
                            zIndex: 1003,
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: '#E91E63',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '20px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            padding: 0,
                            margin: 0
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(233, 30, 99, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.3)';
                        }}
                        disabled={isLoading}
                        title="View in AR"
                    >
                        {isLoading ? <div style={{ border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid white', borderRadius: '50%', width: '20px', height: '20px', animation: 'spin 1s linear infinite' }}></div> : 'AR'}
                    </button>

                    {showUI && (
                        <div className="configurator-container" style={{
                            position: 'fixed',
                            ...(isMobileView ? {
                                bottom: '20px',
                                left: '60px',
                                right: '60px',
                                top: 'auto',
                                width: 'auto',
                                maxHeight: '30vh',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                minWidth: 'min-content'
                            } : {
                                top: '20px',
                                left: '20px',
                                width: '300px',
                                maxHeight: '90vh',
                                minWidth: '300px',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }),
                            zIndex: 1001,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            color: '#1C1B1F',
                            padding: isMobileView ? '4px' : '20px',
                            borderRadius: '16px',
                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}>
                            <div style={{
                                marginBottom: isMobileView ? '4px' : '24px',
                                textAlign: 'center',
                                flexShrink: 0
                            }}>
                                <h2 style={{
                                    color: '#1C1B1F',
                                    fontSize: isMobileView ? '12px' : '28px',
                                    fontWeight: '600',
                                    marginBottom: isMobileView ? '2px' : '8px',
                                    background: 'linear-gradient(135deg, #E91E63, #FF4081)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    Customize Your Bouquet
                                </h2>
                                <p style={{
                                    color: '#49454F',
                                    fontSize: isMobileView ? '10px' : '16px',
                                    lineHeight: isMobileView ? '12px' : '24px',
                                    margin: 0
                                }}>
                                    Create your perfect balloon arrangement
                                </p>
                            </div>

                            {isMobileView ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    width: '100%'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        borderBottom: '1px solid rgba(0,0,0,0.1)',
                                        flexShrink: 0
                                    }}>
                                        <button 
                                            onClick={() => setCurrentCardIndex(prev => (prev - 1 + carouselCards.length) % carouselCards.length)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                padding: 0,
                                                boxSizing: 'border-box',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                textAlign: 'center',
                                                color: '#333',
                                                transition: 'background 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            {'<'}
                                        </button>
                                        <h3 style={{ margin: 0, fontSize: '14px', textAlign: 'center', flexGrow: 1 }}>
                                            {carouselCards[currentCardIndex].title}
                                        </h3>
                                        <button 
                                            onClick={() => setCurrentCardIndex(prev => (prev + 1) % carouselCards.length)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '28px',
                                                height: '28px',
                                                padding: 0,
                                                boxSizing: 'border-box',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                textAlign: 'center',
                                                color: '#333',
                                                transition: 'background 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            {'>'}
                                        </button>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        padding: '6px 0',
                                        flexShrink: 0
                                    }}>
                                        {carouselCards.map((card, index) => (
                                            <button
                                                key={card.id}
                                                onClick={() => setCurrentCardIndex(index)}
                                                style={{
                                                    width: '6px',
                                                    height: '6px',
                                                    borderRadius: '50%',
                                                    background: currentCardIndex === index ? '#E91E63' : 'rgba(0, 0, 0, 0.2)',
                                                    transition: 'all 0.3s ease',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    margin: '0 3px' 
                                                }}
                                                aria-label={`Go to card ${index + 1}`}
                                            />
                                        ))}
                                    </div>

                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '8px',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        WebkitOverflowScrolling: 'touch',
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                    }}>
                                        {carouselCards[currentCardIndex].content({
                                            selectedBalloon, setSelectedBalloon, balloonTypes, toggleBalloonType,
                                            balloonColors, setColor, balloonMaterials, setMaterial, colorOptions,
                                            materialOptions, balloonTypeOptions, backgroundOptions,
                                            selectedBackground, setSelectedBackground, balloonPositions
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%',
                                    width: '100%'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 20px',
                                        borderBottom: '1px solid rgba(0,0,0,0.1)',
                                        flexShrink: 0 
                                    }}>
                                        <button 
                                            onClick={() => setCurrentCardIndex(prev => (prev - 1 + carouselCards.length) % carouselCards.length)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                padding: 0, 
                                                boxSizing: 'border-box',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                opacity: currentCardIndex === 0 ? 0.3 : 1,
                                                transition: 'background 0.2s ease',
                                                outline: 'none'
                                            }}
                                            onMouseEnter={(e) => { if (currentCardIndex !== 0) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <span style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -55%)',
                                                fontSize: '22px',
                                                color: '#555'
                                            }}>
                                                {'‹'}
                                            </span> 
                                        </button>
                                        <h3 style={{ margin: 0, fontSize: '18px', textAlign: 'center', flexGrow: 1 }}>
                                            {carouselCards[currentCardIndex].title}
                                        </h3>
                                        <button 
                                            onClick={() => setCurrentCardIndex(prev => (prev + 1) % carouselCards.length)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                padding: 0, 
                                                boxSizing: 'border-box',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                opacity: currentCardIndex === carouselCards.length - 1 ? 0.3 : 1, 
                                                transition: 'background 0.2s ease',
                                                outline: 'none'
                                            }}
                                            onMouseEnter={(e) => { if (currentCardIndex !== carouselCards.length - 1) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <span style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -55%)',
                                                fontSize: '22px',
                                                color: '#555'
                                            }}>
                                                {'›'}
                                            </span> 
                                        </button>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        padding: '10px 0',
                                        flexShrink: 0
                                    }}>
                                        {carouselCards.map((card, index) => (
                                            <button
                                                key={card.id}
                                                onClick={() => setCurrentCardIndex(index)}
                                                style={{
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    background: currentCardIndex === index ? '#E91E63' : 'rgba(0, 0, 0, 0.2)',
                                                    transition: 'all 0.3s ease',
                                                    border: 'none',
                                                    padding: 0,
                                                    cursor: 'pointer',
                                                    margin: '0 4px'
                                                }}
                                                aria-label={`Go to card ${index + 1}`}
                                            />
                                        ))}
                                    </div>

                                    <div style={{
                                        flex: 1,
                                        overflowY: 'auto',
                                        padding: '20px',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}>
                                        {carouselCards[currentCardIndex].content({
                                            selectedBalloon, setSelectedBalloon, balloonTypes, toggleBalloonType,
                                            balloonColors, setColor, balloonMaterials, setMaterial, colorOptions,
                                            materialOptions, balloonTypeOptions, backgroundOptions,
                                            selectedBackground, setSelectedBackground, balloonPositions
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* --- INLINE AR VIEW JSX --- */}
            {showAR && modelBlobUrl && (
                 <div className="ar-container" style={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    zIndex: 1000,
                    background: 'rgba(0, 0, 0, 0.7)', // Darker background for focus
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {/* Use Configurator's isViewerLoading state */}
                    {isViewerLoading && <LoadingIndicator />}
                    
                    {/* Exit Button */}
                    <button 
                        className="exit-ar-button" 
                        onClick={handleExitAR}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            zIndex: 1001,
                            padding: '10px 20px',
                            backgroundColor: 'rgba(255, 105, 180, 0.8)', // Slightly transparent
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                    >
                        Exit AR
                    </button>

                    {/* Error Display */}
                    {arError && (
                        <div className="ar-error" style={{
                            position: 'fixed',
                            bottom: '80px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(255, 0, 0, 0.8)',
                            color: 'white',
                            padding: '10px 15px',
                            borderRadius: '5px',
                            zIndex: 1002,
                            textAlign: 'center'
                        }}>
                            {arError}
                        </div>
                    )}

                    {/* Style Tag for model-viewer */} 
                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            model-viewer#balloon-ar-viewer { 
                                width: 100%;
                                height: 100%;
                                background-color: transparent;
                                --poster-color: transparent;
                                position: absolute; 
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                --ar-button-background: #FF69B4;
                                --ar-button-border-radius: 50%;
                                --ar-button-color: white;
                                --ar-button-shadow: 0 4px 12px rgba(0,0,0,0.2);
                            }
                            model-viewer#balloon-ar-viewer::part(default-ar-button) {
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                padding: 0 !important;
                                position: absolute !important; 
                                top: 20px !important;
                                left: 20px !important;
                            }
                        `}
                    </style>

                    {/* Model Viewer (absolute position within the relative container) */} 
                    <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
                         {modelBlobUrl && (
                            <model-viewer
                                id="balloon-ar-viewer" 
                                src={modelBlobUrl}
                                alt="AR Balloon Bouquet"
                                ar
                                ar-modes="webxr quick-look scene-viewer" 
                                camera-controls
                                shadow-intensity="1"
                                auto-rotate
                                camera-orbit="45deg 55deg 2.5m"
                                min-camera-orbit="auto auto 0.1m"
                                max-camera-orbit="auto auto 10m"
                                loading="eager"
                                crossOrigin="anonymous"
                                style={{ 
                                    width: '100%', 
                                    height: '100%',
                                    backgroundColor: 'transparent'
                                }}
                                onError={(event) => {
                                    console.error('Configurator (AR Inline): Model viewer error:', event.detail);
                                    setArError('Failed to load 3D model.');
                                    setIsViewerLoading(false); 
                                }}
                                onLoad={() => {
                                    console.log('Configurator (AR Inline): Model loaded successfully (onLoad event)');
                                    setIsViewerLoading(false); 
                                }}
                            >
                            </model-viewer>
                         )} 
                    </div>
                </div>
            )}
            {/* --- END INLINE AR VIEW JSX --- */}
        </>
    );
};

export default Configurator;
