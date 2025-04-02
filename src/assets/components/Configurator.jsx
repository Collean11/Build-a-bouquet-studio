import { useCustomization } from "../../contexts/Customization";
import { useState, useEffect, useRef } from 'react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import BalloonBouquetV4 from './BalloonBouquetV4';
import { Suspense } from 'react';
import * as THREE from 'three';
import { Environment } from '@react-three/drei';
import { MeshReflectorMaterial } from '@react-three/drei';

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
    const [showAR, setShowAR] = useState(false);
    const [modelBlobUrl, setModelBlobUrl] = useState(null);
    const [arSupported, setArSupported] = useState(false);
    const [arError, setArError] = useState(null);
    const [selectedBackground, setSelectedBackground] = useState(backgroundOptions[0].value);
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
                // Check platform detection
                const userAgent = navigator.userAgent;
                const platform = navigator.platform;
                
                // Check if we're on iOS
                const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
                if (isIOS) {
                    console.log('AR: iOS device');
                    setArSupported(true);
                    return;
                }
                
                // Check if we're on macOS
                const isMac = /Mac/.test(platform);
                if (isMac) {
                    console.log('AR: MacOS device');
                    const hasAR = await checkWebXRSupport();
                    setArSupported(hasAR);
                    return;
                }
                
                // Check if we're on Android
                const isAndroid = /Android/.test(userAgent);
                if (isAndroid) {
                    console.log('AR: Android device');
                    setArSupported(true);
                    return;
                }

                // Check for WebXR support
                const hasWebXR = await checkWebXRSupport();
                setArSupported(hasWebXR);
            } catch (error) {
                console.error('AR: Not supported');
                setArSupported(false);
            }
        };

        const checkWebXRSupport = async () => {
            if (!navigator.xr) return false;
            try {
                return await navigator.xr.isSessionSupported('immersive-ar');
            } catch (error) {
                return false;
            }
        };

        checkAR();
    }, []);

    // Update the useEffect for model-viewer initialization
    useEffect(() => {
        if (showAR && modelBlobUrl) {
            const modelViewer = document.querySelector('model-viewer');
            if (modelViewer) {
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

    const handleViewInAR = async () => {
        if (!sceneRef.current) {
            console.error('AR: Scene not ready');
            return;
        }

        try {
            setIsLoading(true);
            const exporter = new GLTFExporter();
            const scene = sceneRef.current;

            // Export the scene to GLTF
            const gltf = await new Promise((resolve, reject) => {
                exporter.parse(
                    scene,
                    (gltf) => {
                        // Create a JSON blob for the GLTF
                        const jsonBlob = new Blob([JSON.stringify(gltf)], { type: 'model/gltf+json' });
                        const jsonUrl = URL.createObjectURL(jsonBlob);
                        resolve(jsonUrl);
                    },
                    (error) => {
                        reject(error);
                    },
                    { binary: false }
                );
            });

            setModelBlobUrl(gltf);
            setShowAR(true);
            setIsLoading(false);
        } catch (error) {
            console.error('AR: Export failed');
            setArError('Error preparing AR view');
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

    return (
        <>
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

            {!showAR && (
                <>
                    <button 
                        onClick={() => setShowUI(!showUI)}
                        style={{
                            position: 'fixed',
                            top: isMobileView ? '10px' : '20px',
                            right: '20px',
                            zIndex: 1002,
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#E91E63',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '24px',
                            lineHeight: '1',
                            boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            padding: 0,
                            margin: 0,
                            textAlign: 'center',
                            verticalAlign: 'middle'
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
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%'
                        }}>
                            {showUI ? '×' : '☰'}
                        </span>
                    </button>

                    {/* AR Button */}
                    <button
                        onClick={handleViewInAR}
                        style={{
                            position: 'fixed',
                            bottom: '20px',
                            right: '20px',
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
                            top: isMobileView ? '60px' : '20px',
                            left: '20px',
                            zIndex: 1001,
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            color: '#1C1B1F',
                            padding: isMobileView ? '10px' : '20px',
                            borderRadius: '16px',
                            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.1)',
                            width: isMobileView ? '140px' : '300px',
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            border: '1px solid rgba(255, 255, 255, 0.3)'
                        }}>
                            <div style={{
                                marginBottom: isMobileView ? '10px' : '24px',
                                textAlign: 'center'
                            }}>
                                <h2 style={{
                                    color: '#1C1B1F',
                                    fontSize: isMobileView ? '14px' : '28px',
                                    fontWeight: '600',
                                    marginBottom: isMobileView ? '3px' : '8px',
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

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: isMobileView ? '10px' : '24px'
                            }}>
                                {/* Balloon Types Section */}
                                <div>
                                    <h3 style={{
                                        color: '#1C1B1F',
                                        fontSize: isMobileView ? '11px' : '20px',
                                        fontWeight: '500',
                                        marginBottom: isMobileView ? '5px' : '16px'
                                    }}>
                                        Balloon Types
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: isMobileView ? '5px' : '12px'
                                    }}>
                                        {balloonTypeOptions.map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() => toggleBalloonType(selectedBalloon || 'top', type.value)}
                                                style={{
                                                    padding: isMobileView ? '5px 3px' : '12px',
                                                    borderRadius: '6px',
                                                    background: balloonTypes[selectedBalloon || 'top'] === type.value ? '#E91E63' : 'rgba(255, 255, 255, 0.8)',
                                                    color: balloonTypes[selectedBalloon || 'top'] === type.value ? 'white' : '#1C1B1F',
                                                    cursor: 'pointer',
                                                    fontSize: isMobileView ? '10px' : '16px',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s ease',
                                                    backdropFilter: 'blur(10px)',
                                                    WebkitBackdropFilter: 'blur(10px)',
                                                    border: balloonTypes[selectedBalloon || 'top'] === type.value ? 
                                                            '1px solid #E91E63' : 
                                                            '1px solid rgba(255, 255, 255, 0.2)',
                                                    boxShadow: balloonTypes[selectedBalloon || 'top'] === type.value ? 
                                                            '0 2px 6px rgba(233, 30, 99, 0.2)' : 
                                                            '0 1px 3px rgba(0, 0, 0, 0.05)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    minWidth: 0
                                                }}
                                            >
                                                {type.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Colors Section */}
                                <div>
                                    <h3 style={{
                                        color: '#1C1B1F',
                                        fontSize: isMobileView ? '11px' : '20px',
                                        fontWeight: '500',
                                        marginBottom: isMobileView ? '5px' : '16px'
                                    }}>
                                        Colors
                                    </h3>
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: isMobileView ? '8px' : '12px'
                                    }}>
                                        {/* Pastel Colors */}
                                        <div>
                                            <h4 style={{
                                                fontSize: isMobileView ? '9px' : '14px',
                                                color: '#666',
                                                marginBottom: isMobileView ? '3px' : '6px'
                                            }}>Pastel</h4>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: isMobileView ? '4px' : '8px'
                                            }}>
                                                {colorOptions.slice(0, 6).map((color) => (
                                                    <button
                                                        key={color.name}
                                                        onClick={() => setColor(selectedBalloon || 'top', color.value)}
                                                        style={{
                                                            width: isMobileView ? '20px' : '36px',
                                                            height: isMobileView ? '20px' : '36px',
                                                            minWidth: isMobileView ? '20px' : '36px',
                                                            minHeight: isMobileView ? '20px' : '36px',
                                                            maxWidth: isMobileView ? '20px' : '36px',
                                                            maxHeight: isMobileView ? '20px' : '36px',
                                                            borderRadius: '50%',
                                                            border: 'none',
                                                            background: color.value,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                            position: 'relative',
                                                            margin: '0 auto',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {balloonColors[selectedBalloon || 'top'] === color.value && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '-1px',
                                                                left: '-1px',
                                                                right: '-1px',
                                                                bottom: '-1px',
                                                                borderRadius: '50%',
                                                                border: '1px solid #E91E63',
                                                                animation: 'pulse 2s infinite'
                                                            }} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Rich Colors */}
                                        <div>
                                            <h4 style={{
                                                fontSize: isMobileView ? '9px' : '14px',
                                                color: '#666',
                                                marginBottom: isMobileView ? '3px' : '6px'
                                            }}>Rich</h4>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: isMobileView ? '4px' : '8px'
                                            }}>
                                                {colorOptions.slice(6, 12).map((color) => (
                                                    <button
                                                        key={color.name}
                                                        onClick={() => setColor(selectedBalloon || 'top', color.value)}
                                                        style={{
                                                            width: isMobileView ? '20px' : '36px',
                                                            height: isMobileView ? '20px' : '36px',
                                                            minWidth: isMobileView ? '20px' : '36px',
                                                            minHeight: isMobileView ? '20px' : '36px',
                                                            maxWidth: isMobileView ? '20px' : '36px',
                                                            maxHeight: isMobileView ? '20px' : '36px',
                                                            borderRadius: '50%',
                                                            border: 'none',
                                                            background: color.value,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                            position: 'relative',
                                                            margin: '0 auto',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {balloonColors[selectedBalloon || 'top'] === color.value && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '-1px',
                                                                left: '-1px',
                                                                right: '-1px',
                                                                bottom: '-1px',
                                                                borderRadius: '50%',
                                                                border: '1px solid #E91E63',
                                                                animation: 'pulse 2s infinite'
                                                            }} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Classic Colors */}
                                        <div>
                                            <h4 style={{
                                                fontSize: isMobileView ? '9px' : '14px',
                                                color: '#666',
                                                marginBottom: isMobileView ? '3px' : '6px'
                                            }}>Classic</h4>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: isMobileView ? '4px' : '8px'
                                            }}>
                                                {colorOptions.slice(12, 18).map((color) => (
                                                    <button
                                                        key={color.name}
                                                        onClick={() => setColor(selectedBalloon || 'top', color.value)}
                                                        style={{
                                                            width: isMobileView ? '20px' : '36px',
                                                            height: isMobileView ? '20px' : '36px',
                                                            minWidth: isMobileView ? '20px' : '36px',
                                                            minHeight: isMobileView ? '20px' : '36px',
                                                            maxWidth: isMobileView ? '20px' : '36px',
                                                            maxHeight: isMobileView ? '20px' : '36px',
                                                            borderRadius: '50%',
                                                            border: 'none',
                                                            background: color.value,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                            position: 'relative',
                                                            margin: '0 auto',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {balloonColors[selectedBalloon || 'top'] === color.value && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '-1px',
                                                                left: '-1px',
                                                                right: '-1px',
                                                                bottom: '-1px',
                                                                borderRadius: '50%',
                                                                border: '1px solid #E91E63',
                                                                animation: 'pulse 2s infinite'
                                                            }} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Vibrant Colors */}
                                        <div>
                                            <h4 style={{
                                                fontSize: isMobileView ? '9px' : '14px',
                                                color: '#666',
                                                marginBottom: isMobileView ? '3px' : '6px'
                                            }}>Vibrant</h4>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: isMobileView ? '4px' : '8px'
                                            }}>
                                                {colorOptions.slice(18, 24).map((color) => (
                                                    <button
                                                        key={color.name}
                                                        onClick={() => setColor(selectedBalloon || 'top', color.value)}
                                                        style={{
                                                            width: isMobileView ? '20px' : '36px',
                                                            height: isMobileView ? '20px' : '36px',
                                                            minWidth: isMobileView ? '20px' : '36px',
                                                            minHeight: isMobileView ? '20px' : '36px',
                                                            maxWidth: isMobileView ? '20px' : '36px',
                                                            maxHeight: isMobileView ? '20px' : '36px',
                                                            borderRadius: '50%',
                                                            border: 'none',
                                                            background: color.value,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                            position: 'relative',
                                                            margin: '0 auto',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {balloonColors[selectedBalloon || 'top'] === color.value && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '-1px',
                                                                left: '-1px',
                                                                right: '-1px',
                                                                bottom: '-1px',
                                                                borderRadius: '50%',
                                                                border: '1px solid #E91E63',
                                                                animation: 'pulse 2s infinite'
                                                            }} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Metallic Colors */}
                                        <div>
                                            <h4 style={{
                                                fontSize: isMobileView ? '9px' : '14px',
                                                color: '#666',
                                                marginBottom: isMobileView ? '3px' : '6px'
                                            }}>Metallic</h4>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: isMobileView ? '4px' : '8px'
                                            }}>
                                                {colorOptions.slice(24).map((color) => (
                                                    <button
                                                        key={color.name}
                                                        onClick={() => setColor(selectedBalloon || 'top', color.value)}
                                                        style={{
                                                            width: isMobileView ? '20px' : '36px',
                                                            height: isMobileView ? '20px' : '36px',
                                                            minWidth: isMobileView ? '20px' : '36px',
                                                            minHeight: isMobileView ? '20px' : '36px',
                                                            maxWidth: isMobileView ? '20px' : '36px',
                                                            maxHeight: isMobileView ? '20px' : '36px',
                                                            borderRadius: '50%',
                                                            border: 'none',
                                                            background: color.value,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s ease',
                                                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                                            position: 'relative',
                                                            margin: '0 auto',
                                                            padding: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {balloonColors[selectedBalloon || 'top'] === color.value && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                top: '-1px',
                                                                left: '-1px',
                                                                right: '-1px',
                                                                bottom: '-1px',
                                                                borderRadius: '50%',
                                                                border: '1px solid #E91E63',
                                                                animation: 'pulse 2s infinite'
                                                            }} />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Materials Section */}
                                <div>
                                    <h3 style={{
                                        color: '#1C1B1F',
                                        fontSize: isMobileView ? '11px' : '20px',
                                        fontWeight: '500',
                                        marginBottom: isMobileView ? '5px' : '16px'
                                    }}>
                                        Materials
                                    </h3>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                        gap: isMobileView ? '5px' : '12px'
                                    }}>
                                        {materialOptions.map((material) => (
                                            <button
                                                key={material.value}
                                                onClick={() => setMaterial(selectedBalloon || 'top', material.value)}
                                                style={{
                                                    padding: isMobileView ? '5px 3px' : '12px',
                                                    borderRadius: '6px',
                                                    background: balloonMaterials[selectedBalloon || 'top'] === material.value ? '#E91E63' : 'rgba(255, 255, 255, 0.8)',
                                                    color: balloonMaterials[selectedBalloon || 'top'] === material.value ? 'white' : '#1C1B1F',
                                                    cursor: 'pointer',
                                                    fontSize: isMobileView ? '10px' : '16px',
                                                    fontWeight: '500',
                                                    transition: 'all 0.2s ease',
                                                    backdropFilter: 'blur(10px)',
                                                    WebkitBackdropFilter: 'blur(10px)',
                                                    border: balloonMaterials[selectedBalloon || 'top'] === material.value ? 
                                                            '1px solid #E91E63' : 
                                                            '1px solid rgba(255, 255, 255, 0.2)',
                                                    boxShadow: balloonMaterials[selectedBalloon || 'top'] === material.value ? 
                                                            '0 2px 6px rgba(233, 30, 99, 0.2)' : 
                                                            '0 1px 3px rgba(0, 0, 0, 0.05)',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    minWidth: 0
                                                }}
                                            >
                                                {material.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Background Colors Section */}
                                <div>
                                    <h3 style={{
                                        color: '#1C1B1F',
                                        fontSize: isMobileView ? '11px' : '20px',
                                        fontWeight: '500',
                                        marginBottom: isMobileView ? '5px' : '16px'
                                    }}>
                                        Background
                                    </h3>
                                    <div className="background-options">
                                        {backgroundOptions.map((bg) => (
                                            <button 
                                                key={bg.name}
                                                className={`background-option ${selectedBackground === bg.value ? 'active' : ''}`}
                                                onClick={() => {
                                                    console.log('Setting background to:', bg.value);
                                                    setSelectedBackground(bg.value);
                                                }}
                                                style={{
                                                    background: bg.value,
                                                    border: selectedBackground === bg.value ? '2px solid #E91E63' : '2px solid rgba(255, 255, 255, 0.8)',
                                                    boxShadow: selectedBackground === bg.value ? 
                                                        '0 4px 12px rgba(233, 30, 99, 0.3)' : 
                                                        '0 2px 4px rgba(0,0,0,0.1)',
                                                    transform: selectedBackground === bg.value ? 'scale(1.05)' : 'scale(1)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                <span className="background-name" style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    padding: '4px',
                                                    background: 'rgba(0, 0, 0, 0.6)',
                                                    color: 'white',
                                                    fontSize: isMobileView ? '10px' : '12px',
                                                    textAlign: 'center',
                                                    backdropFilter: 'blur(4px)',
                                                    WebkitBackdropFilter: 'blur(4px)'
                                                }}>
                                                    {bg.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
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
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
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
                            
                            /* Target all possible AR button selectors */
                            model-viewer::part(default-ar-button),
                            model-viewer::part(ar-button),
                            #ar-button {
                                background-color: #FF69B4 !important;
                                border-radius: 50% !important;
                                position: fixed !important;
                                bottom: 20px !important;
                                right: 20px !important;
                                z-index: 1006 !important;
                                display: block !important;
                                opacity: 1 !important;
                                visibility: visible !important;
                                pointer-events: auto !important;
                            }
                        `}
                    </style>
                    <model-viewer
                        id="ar-model-viewer"
                        src={modelBlobUrl}
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        auto-rotate
                        camera-orbit="45deg 55deg 4m"
                        min-camera-orbit="auto auto 1.5m"
                        max-camera-orbit="auto auto 15m"
                        shadow-intensity="1"
                        ar-button
                        ar-button-style="default"
                        ar-button-position="bottom-right"
                        ar-button-scale="1"
                        ar-button-visibility="always"
                        ar-scale="fixed"
                        ar-placement="floor"
                        ios-src={modelBlobUrl}
                        quick-look-browsers="safari chrome"
                        style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'transparent',
                            '--poster-color': 'transparent',
                            '--ar-button-display': 'block',
                            '--ar-button-position': 'fixed',
                            '--ar-button-bottom': '20px',
                            '--ar-button-right': '20px',
                            '--ar-button-z-index': '1006',
                            '--ar-button-background-color': '#FF69B4',
                            '--ar-button-border-radius': '50%',
                            '--ar-button-width': '48px',
                            '--ar-button-height': '48px',
                            '--ar-button-padding': '0',
                            '--ar-button-margin': '0'
                        }}
                        onError={(error) => {
                            console.error('Model viewer error:', error);
                            setArError('Error loading AR model. Please try again.');
                            if (error.detail) {
                                console.error('Error details:', error.detail);
                            }
                        }}
                        onLoad={() => {
                            console.log('AR model loaded successfully');
                            setArError(null);
                            const modelViewer = document.querySelector('#ar-model-viewer');
                            if (modelViewer) {
                                modelViewer.style.display = 'block';
                                modelViewer.style.visibility = 'visible';
                                modelViewer.style.opacity = '1';
                                
                                // Force AR button to be visible
                                const arButton = modelViewer.shadowRoot?.querySelector('#ar-button');
                                if (arButton) {
                                    arButton.style.cssText = `
                                        background-color: #FF69B4 !important;
                                        border-radius: 50% !important;
                                        width: 48px !important;
                                        height: 48px !important;
                                        padding: 0 !important;
                                        margin: 0 !important;
                                        position: fixed !important;
                                        bottom: 20px !important;
                                        right: 20px !important;
                                        z-index: 1006 !important;
                                        display: block !important;
                                        opacity: 1 !important;
                                        visibility: visible !important;
                                        transform: none !important;
                                        pointer-events: auto !important;
                                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
                                    `;
                                }
                                
                                // Also try to find and style the default AR button
                                const defaultArButton = modelViewer.shadowRoot?.querySelector('#default-ar-button');
                                if (defaultArButton) {
                                    defaultArButton.style.cssText = `
                                        background-color: #FF69B4 !important;
                                        border-radius: 50% !important;
                                        width: 48px !important;
                                        height: 48px !important;
                                        padding: 0 !important;
                                        margin: 0 !important;
                                        position: fixed !important;
                                        bottom: 20px !important;
                                        right: 20px !important;
                                        z-index: 1006 !important;
                                        display: block !important;
                                        opacity: 1 !important;
                                        visibility: visible !important;
                                        transform: none !important;
                                        pointer-events: auto !important;
                                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
                                    `;
                                }
                                
                                console.log('Model viewer state:', {
                                    display: modelViewer.style.display,
                                    visibility: modelViewer.style.visibility,
                                    opacity: modelViewer.style.opacity,
                                    src: modelViewer.src,
                                    hasARButton: !!arButton,
                                    hasDefaultARButton: !!defaultArButton
                                });
                            }
                        }}
                    />
                </div>
            )}
        </>
    );
};

export default Configurator;
