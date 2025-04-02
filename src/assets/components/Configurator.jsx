import { useCustomization } from "../../contexts/Customization";
import { useState, useEffect, useRef } from 'react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import BalloonBouquetV4 from './BalloonBouquetV4';
import { Suspense } from 'react';
// Note: We're using Three.js from both @react-three/fiber and @google/model-viewer
// This causes a warning about multiple instances, but it's necessary for our use case
// as we need both libraries for different features (3D editing and AR viewing)
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
import { MeshReflectorMaterial } from '@react-three/drei';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

const balloonTypeOptions = [
    { name: 'Latex', value: 'A' },
    { name: 'Heart', value: 'B' },
    { name: 'Star', value: 'C' }
];

const backgroundOptions = [
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
        value: 'linear-gradient(135deg, #FF9A9E 0%, #FAD0C4 50%, #FFE4E1 100%)', 
        primaryColor: '#FF9A9E' 
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
    const [isMobileView, setIsMobileView] = useState(false);
    const [showUI, setShowUI] = useState(true);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const carouselRef = useRef(null);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

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
                        modelViewer.src = modelBlobUrl;
                    } catch (error) {
                        console.error('Error preloading model:', error);
                        // Set the model source directly even if preload fails
                        modelViewer.src = modelBlobUrl;
                    }
                };

                preloadModel();

                const handleLoad = () => {
                    // Force AR button to be visible
                    const arButton = modelViewer.shadowRoot?.querySelector('#ar-button');
                    if (arButton) {
                        arButton.style.display = 'block';
                        arButton.style.opacity = '1';
                        arButton.style.visibility = 'visible';
                        arButton.style.position = 'fixed';
                        arButton.style.bottom = '20px';
                        arButton.style.right = '20px';
                        arButton.style.zIndex = '1006';
                    }

                    // Always set AR supported to true
                    setArSupported(true);
                };

                modelViewer.addEventListener('load', handleLoad);
                
                // Cleanup
                return () => {
                    modelViewer.removeEventListener('load', handleLoad);
                };
            }
        }
    }, [showAR, modelBlobUrl]);

    const handleArView = async () => {
        if (!sceneRef.current) {
            console.error('AR: Scene not ready');
            return;
        }

        try {
            setArError(null);
            setIsLoading(true);
            console.log('AR: Starting model export...');
            
            const exporter = new GLTFExporter();
            const scene = sceneRef.current;

            // Optimize scene for export without modifying geometries
            scene.traverse((object) => {
                if (object.isMesh) {
                    object.castShadow = true;
                    object.receiveShadow = true;
                }
            });

            // Export the scene to binary GLTF with optimized settings
            const gltf = await new Promise((resolve, reject) => {
                exporter.parse(
                    scene,
                    (gltf) => {
                        console.log('AR: Model exported successfully');
                        resolve(gltf);
                    },
                    (error) => {
                        console.error('AR: Export error:', error);
                        reject(error);
                    },
                    { 
                        binary: true,
                        includeCustomExtensions: true,
                        maxTextureSize: 512,
                        forceIndices: true,
                        onlyVisible: true,
                        embedImages: true,
                        optimize: true,
                        optimizeVertices: true,
                        optimizeMaterials: true,
                        optimizeMeshes: true,
                        optimizeTextures: true,
                        optimizeAnimations: true,
                        optimizeAccessors: true,
                        optimizeBufferViews: true,
                        optimizeBuffers: true,
                        maxVertexCount: 65536,
                        maxIndexCount: 65536,
                        maxMaterialCount: 32,
                        maxTextureCount: 16,
                        maxAnimationCount: 8,
                        maxAccessorCount: 64,
                        maxBufferViewCount: 32,
                        maxBufferCount: 8
                    }
                );
            });

            // Create a unique filename with timestamp
            const timestamp = Date.now();
            const filename = `ar-model-${timestamp}.glb`;
            
            // Upload to Firebase Storage
            const storageRef = ref(storage, `ar-models/${filename}`);
            const blob = new Blob([gltf], { type: 'model/gltf-binary' });
            
            console.log('AR: Uploading to Firebase Storage...');
            
            // Upload the file with metadata
            await uploadBytes(storageRef, blob, {
                contentType: 'model/gltf-binary',
                cacheControl: 'public, max-age=31536000',
                customMetadata: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, HEAD, PUT, POST, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Content-Disposition, Origin, Accept',
                    'Access-Control-Max-Age': '3600',
                    'Access-Control-Expose-Headers': 'Content-Type, Content-Disposition'
                }
            });
            
            console.log('AR: Upload complete');
            
            // Get the download URL
            const downloadUrl = await getDownloadURL(storageRef);
            console.log('AR: Model URL created:', downloadUrl);
            
            // Extract the model path from the Firebase URL
            const modelPath = `ar-models/${filename}`;
            
            // Use our proxy server URL
            const proxyUrl = `http://localhost:5182/model/${modelPath}`;
            console.log('AR: Using proxy URL:', proxyUrl);
            
            // Store the URL in state
            setModelBlobUrl(proxyUrl);
            setShowAR(true);
            setIsLoading(false);
            console.log('AR: Model ready for viewing');
        } catch (error) {
            console.error('AR: Export failed', error);
            setArError('Error preparing AR view. Please try again.');
            setIsLoading(false);
        }
    };

    const handleExitAR = () => {
        setShowAR(false);
        if (modelBlobUrl) {
            URL.revokeObjectURL(modelBlobUrl);
            setModelBlobUrl(null);
        }
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
            zIndex: 1000
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
            <p>Preparing AR View...</p>
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
                backgroundImage: selectedBackground,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0,
                pointerEvents: 'auto',
                transition: 'background-image 0.3s ease',
                margin: 0,
                padding: 0,
                overflow: 'hidden'
            }} />
            {!showAR && (
                <Canvas
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
                    
                    <mesh 
                        rotation={[-Math.PI / 2, 0, 0]} 
                        position={[0, -1, 0]} 
                        receiveShadow
                    >
                        <planeGeometry args={[50, 50]} />
                        <MeshReflectorMaterial
                            color={backgroundOptions.find(bg => bg.value === selectedBackground)?.primaryColor || '#FF6B6B'}
                            mirror={0.4}
                            blur={[200, 200]}
                            resolution={1024}
                            mixBlur={0.8}
                            mixStrength={1.2}
                            minDepthThreshold={0.2}
                            maxDepthThreshold={1}
                            depthScale={0.8}
                        />
                    </mesh>
                    
                    <group position={[0, -1, 0]} ref={sceneRef}>
                        <Suspense fallback={null}>
                            <BalloonBouquetV4 
                                position={[0, 0, 0]}
                                scale={[1.2, 1.2, 1.2]}
                                userData={{ 
                                    isBalloonBouquet: true,
                                    isARViewable: true
                                }}
                                castShadow
                                receiveShadow
                                onClick={(event) => {
                                    // Get the clicked balloon ID from the event
                                    const balloonId = event.object.userData.balloonId;
                                    if (balloonId) {
                                        console.log('Clicked balloon:', balloonId);
                                        setSelectedBalloon(balloonId);
                                    }
                                }}
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
                                right: '140px'
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

                    {/* Help Button */}
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

                    {/* AR Button */}
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
                    >
                        AR
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
                                // --- Mobile View (Card Carousel Implementation) ---
                                <div style={{ // Main container for mobile cards + nav
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%', // Use full available height
                                    width: '100%'
                                }}>
                                    {/* Mobile Navigation Controls (Smaller) */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '4px 8px', // Reduced padding
                                        borderBottom: '1px solid rgba(0,0,0,0.1)',
                                        flexShrink: 0
                                    }}>
                                        <button 
                                            onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentCardIndex === 0}
                                            style={{ /* Adapted styles for mobile */
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
                                                opacity: currentCardIndex === 0 ? 0.5 : 1,
                                                transition: 'background 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => { if (currentCardIndex !== 0) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            {'<'}
                                        </button>
                                        <h3 style={{ margin: 0, fontSize: '14px', textAlign: 'center', flexGrow: 1 }}>
                                            {carouselCards[currentCardIndex].title}
                                        </h3>
                                        <button 
                                            onClick={() => setCurrentCardIndex(prev => Math.min(carouselCards.length - 1, prev + 1))}
                                            disabled={currentCardIndex === carouselCards.length - 1}
                                            style={{ /* Adapted styles for mobile */
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
                                                opacity: currentCardIndex === carouselCards.length - 1 ? 0.5 : 1,
                                                transition: 'background 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => { if (currentCardIndex !== carouselCards.length - 1) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            {'>'}
                                        </button>
                                    </div>

                                    {/* Dot Indicators (Mobile - Small) */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        padding: '6px 0', // Adjusted padding
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

                                    {/* Active Card Content Area (Scrollable - Mobile) */}
                                    <div style={{
                                        flex: 1, // Take remaining space
                                        overflowY: 'auto', // Allow content to scroll
                                        padding: '8px', // Mobile padding
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        WebkitOverflowScrolling: 'touch', // Keep smooth scroll for touch
                                        scrollbarWidth: 'none', // Hide scrollbar
                                        msOverflowStyle: 'none',
                                        '&::-webkit-scrollbar': { display: 'none' } // Hide scrollbar (webkit)
                                    }}>
                                        {/* Render only the current card's content */}
                                        {carouselCards[currentCardIndex].content({
                                            selectedBalloon, setSelectedBalloon, balloonTypes, toggleBalloonType,
                                            balloonColors, setColor, balloonMaterials, setMaterial, colorOptions,
                                            materialOptions, balloonTypeOptions, backgroundOptions,
                                            selectedBackground, setSelectedBackground, balloonPositions
                                        })}
                                    </div>
                                </div>
                            ) : (
                                // --- Desktop View --- 
                                // Add parent div to manage height distribution
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '100%', // Fill the outer container's height
                                    width: '100%'
                                }}>
                                    {/* Desktop Navigation Controls */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px 20px',
                                        borderBottom: '1px solid rgba(0,0,0,0.1)',
                                        flexShrink: 0 
                                    }}>
                                        <button 
                                            onClick={() => setCurrentCardIndex(prev => Math.max(0, prev - 1))}
                                            disabled={currentCardIndex === 0}
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
                                            onClick={() => setCurrentCardIndex(prev => Math.min(carouselCards.length - 1, prev + 1))}
                                            disabled={currentCardIndex === carouselCards.length - 1}
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

                                    {/* Dot Indicators (Desktop) */}
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

                                    {/* Active Card Content Area (Scrollable) */}
                                    <div style={{
                                        flex: 1, // Takes remaining space within the new parent
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
                                </div> // Closes the new parent div
                            )}
                        </div>
                    )}
                </>
            )}

            {showAR && modelBlobUrl && (
                <div className="ar-container" style={{ 
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    zIndex: 1000,
                    background: 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                    {isLoading && <LoadingIndicator />}
                    <button 
                        className="exit-ar-button" 
                        onClick={handleExitAR}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            zIndex: 1001,
                            padding: '10px 20px',
                            backgroundColor: '#ff69b4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                    >
                        Exit AR
                    </button>
                    {arError && (
                        <div className="ar-error" style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(255, 0, 0, 0.8)',
                            color: 'white',
                            padding: '20px',
                            borderRadius: '10px',
                            zIndex: 1002
                        }}>
                            {arError}
                        </div>
                    )}
                    <style>
                        {`
                            @keyframes spin {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            model-viewer {
                                width: 100%;
                                height: 100%;
                                background-color: transparent;
                                --poster-color: transparent;
                                position: fixed;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                --ar-button-background: #FF69B4;
                                --ar-button-border-radius: 50%;
                                --ar-button-color: white;
                                --ar-button-shadow: 0 4px 12px rgba(0,0,0,0.2);
                            }
                            
                            model-viewer::part(default-ar-button),
                            model-viewer::part(ar-button),
                            #ar-button,
                            .ar-button {
                                background-color: #FF69B4 !important;
                                border-radius: 50% !important;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
                                position: fixed !important;
                                bottom: 20px !important;
                                right: 20px !important;
                                z-index: 1006 !important;
                                display: flex !important;
                                align-items: center !important;
                                justify-content: center !important;
                                opacity: 1 !important;
                                visibility: visible !important;
                                pointer-events: auto !important;
                                width: 60px !important;
                                height: 60px !important;
                                padding: 0 !important;
                                margin: 0 !important;
                                backdropFilter: blur(10px) !important;
                                WebkitBackdropFilter: blur(10px) !important;
                                border: none !important;
                                cursor: pointer !important;
                                transition: all 0.2s ease !important;
                            }
                            model-viewer::part(default-ar-button)::before,
                            model-viewer::part(ar-button)::before,
                            #ar-button::before,
                            .ar-button::before {
                                content: '' !important;
                                display: block !important;
                                width: 24px !important;
                                height: 24px !important;
                                background-size: contain !important;
                                background-repeat: no-repeat !important;
                                background-position: center !important;
                                position: absolute !important;
                                top: 50% !important;
                                left: 50% !important;
                                transform: translate(-50%, -50%) !important;
                                margin: 0 !important;
                                padding: 0 !important;
                            }
                            model-viewer::part(default-ar-button):hover,
                            model-viewer::part(ar-button):hover,
                            #ar-button:hover,
                            .ar-button:hover {
                                background-color: #FF1493 !important;
                                transform: scale(1.1) !important;
                                box-shadow: 0 6px 16px rgba(0,0,0,0.3) !important;
                            }
                            model-viewer::part(default-ar-button):active,
                            model-viewer::part(ar-button):active,
                            #ar-button:active,
                            .ar-button:active {
                                transform: scale(0.95) !important;
                            }
                        `}
                    </style>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        {isLoading && <LoadingIndicator />}
                        {showAR && (
                            <model-viewer
                                src={modelBlobUrl}
                                alt="AR Balloon Bouquet"
                                ar
                                ar-modes="scene-viewer webxr quick-look"
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
                                onError={(error) => {
                                    console.error('Model viewer error:', error);
                                    setArError('Failed to load AR model. Please try again.');
                                }}
                                onLoad={() => {
                                    console.log('AR: Model loaded successfully');
                                    setIsLoading(false);
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Configurator;
