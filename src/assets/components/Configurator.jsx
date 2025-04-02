import { useCustomization } from "../../contexts/Customization";
import { useState, useEffect, useRef } from 'react';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import BalloonBouquetV4 from './BalloonBouquetV4';
import { Suspense } from 'react';

const balloonTypeOptions = [
    { name: 'Latex', value: 'A' },
    { name: 'Heart', value: 'B' },
    { name: 'Star', value: 'C' }
];

const backgroundOptions = [
    { name: 'Default', value: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' },
    { name: 'Sunset', value: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)' },
    { name: 'Ocean', value: 'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)' },
    { name: 'Forest', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { name: 'Lavender', value: 'linear-gradient(135deg, #e6b980 0%, #eacda3 100%)' },
    { name: 'Rose', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' }
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
        materialOptions,
        environments,
        selectedEnvironment,
        setSelectedEnvironment
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
                // Check if we're on iOS
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if (isIOS) {
                    console.log('iOS device detected, Quick Look AR available');
                    setArSupported(true);
                    return;
                }
                
                // Check if we're on Android
                const isAndroid = /Android/i.test(navigator.userAgent);
                if (isAndroid) {
                    console.log('Android device detected, Scene Viewer AR available');
                    setArSupported(true);
                    return;
                }

                // Check for WebXR support
                if (navigator.xr) {
                    const supported = await navigator.xr.isSessionSupported('immersive-ar');
                    setArSupported(supported);
                    if (!supported) {
                        console.log('WebXR AR not supported, checking for other AR modes');
                    }
                } else {
                    console.log('WebXR not available, checking for other AR modes');
                }

                // Always set AR supported to true to show the button
                setArSupported(true);
            } catch (error) {
                console.error('AR support check failed:', error);
                // Set AR supported to true even if check fails
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
                const handleLoad = () => {
                    console.log('Model loaded successfully');
                    
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
        if (!sceneRef.current) return;

        try {
            setIsLoading(true);
            const exporter = new GLTFExporter();
            const scene = sceneRef.current;

            exporter.parse(
                scene,
                (gltf) => {
                    const blob = new Blob([gltf], { type: 'application/octet-stream' });
                    const blobUrl = URL.createObjectURL(blob);
                    setModelBlobUrl(blobUrl);
                    setShowAR(true);
                    setIsLoading(false);
                },
                (error) => {
                    console.error('Export error:', error);
                    setArError('Error preparing model for AR view');
                    setIsLoading(false);
                },
                { binary: true }
            );
        } catch (error) {
            console.error('AR preparation error:', error);
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
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: selectedBackground,
                transition: 'background 0.3s ease',
                zIndex: 0
            }} />
            <Canvas
                camera={{ position: [0, 1, 4], fov: 75 }}
                shadows
                style={{
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <ambientLight intensity={0.8} />
                <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
                <Environment preset={selectedEnvironment} />
                
                <group position={[0, -2, 0]} ref={sceneRef}>
                    <Suspense fallback={null}>
                        <BalloonBouquetV4 
                            position={[0, 0, 0]}
                            scale={1.2}
                            userData={{ 
                                isBalloonBouquet: true,
                                isARViewable: true
                            }}
                        />
                    </Suspense>
                </group>
                <OrbitControls enablePan={false} />
            </Canvas>

            {!showAR && (
                <>
                    <div className="configurator-container" style={{
                        position: 'fixed',
                        top: isMobileView ? '60px' : '20px',
                        left: isMobileView && !showUI ? '-160px' : '20px',
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
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        transition: 'all 0.3s ease'
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
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: isMobileView ? '5px' : '12px',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%'
                                }}>
                                    {colorOptions.map((color) => (
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
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: isMobileView ? '5px' : '12px'
                                }}>
                                    {backgroundOptions.map((bg) => (
                                        <button
                                            key={bg.name}
                                            onClick={() => setSelectedBackground(bg.value)}
                                            style={{
                                                padding: isMobileView ? '5px 3px' : '12px',
                                                borderRadius: '6px',
                                                background: selectedBackground === bg.value ? '#E91E63' : 'rgba(255, 255, 255, 0.8)',
                                                color: selectedBackground === bg.value ? 'white' : '#1C1B1F',
                                                cursor: 'pointer',
                                                fontSize: isMobileView ? '10px' : '16px',
                                                fontWeight: '500',
                                                transition: 'all 0.2s ease',
                                                backdropFilter: 'blur(10px)',
                                                WebkitBackdropFilter: 'blur(10px)',
                                                border: selectedBackground === bg.value ? 
                                                        '1px solid #E91E63' : 
                                                        '1px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: selectedBackground === bg.value ? 
                                                        '0 2px 6px rgba(233, 30, 99, 0.2)' : 
                                                        '0 1px 3px rgba(0, 0, 0, 0.05)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                minWidth: 0
                                            }}
                                        >
                                            {bg.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
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
                            fontSize: '24px',
                            boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)'
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
                        <svg 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path 
                                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" 
                                fill="white"
                            />
                            <path 
                                d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" 
                                fill="white"
                            />
                        </svg>
                    </button>
                </>
            )}

            {showAR && modelBlobUrl && (
                <div id="ar-container" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    zIndex: 1004,
                    backgroundColor: 'transparent',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden'
                }}>
                    <button 
                        onClick={handleExitAR}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            zIndex: 1005,
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 20px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Exit AR
                    </button>
                    
                    {arError && (
                        <div style={{
                            position: 'fixed',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            zIndex: 1007,
                            textAlign: 'center',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)'
                        }}>
                            {arError}
                        </div>
                    )}
                    
                    <model-viewer
                        src={modelBlobUrl}
                        ar
                        ar-modes="scene-viewer webxr quick-look"
                        camera-controls
                        auto-rotate
                        camera-orbit="0deg 75deg 100%"
                        min-camera-orbit="auto auto 100%"
                        max-camera-orbit="auto auto 100%"
                        exposure="1"
                        environment-image="neutral"
                        shadow-intensity="1"
                        shadow-softness="1"
                        ar-button
                        ar-scale="fixed"
                        ar-placement="floor"
                        ar-button-style="default"
                        ar-button-position="bottom-right"
                        ar-button-scale="1"
                        ar-button-visibility="always"
                        ar-status="not-presenting"
                        ar-tracking="not-tracking"
                        ios-src={modelBlobUrl}
                        quick-look-browsers="safari chrome"
                        style={{
                            width: '100%',
                            height: '100%',
                            background: 'transparent',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            '--poster-color': 'transparent',
                            zIndex: 1004
                        }}
                    />
                    <style>
                        {`
                            model-viewer {
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
                                display: block !important;
                                opacity: 1 !important;
                                visibility: visible !important;
                                pointer-events: auto !important;
                                width: 48px !important;
                                height: 48px !important;
                                padding: 0 !important;
                                margin: 0 !important;
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
                            }
                            model-viewer::part(default-ar-button):hover,
                            model-viewer::part(ar-button):hover,
                            #ar-button:hover,
                            .ar-button:hover {
                                background-color: #FF1493 !important;
                                transform: scale(1.1) !important;
                                transition: all 0.3s ease !important;
                            }
                            model-viewer::part(default-ar-button):active,
                            model-viewer::part(ar-button):active,
                            #ar-button:active,
                            .ar-button:active {
                                transform: scale(0.95) !important;
                            }
                        `}
                    </style>
                </div>
            )}
        </>
    );
};

export default Configurator;
