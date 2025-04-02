import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ARView = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [modelUrl, setModelUrl] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get the model URL from the location state
        if (location.state && location.state.modelUrl) {
            console.log('Received model URL:', location.state.modelUrl);
            setModelUrl(location.state.modelUrl);
        } else {
            console.error('No model URL provided in location state');
            setError('No model URL provided');
            setIsLoading(false);
            // Don't navigate away immediately to show the error
        }
    }, [location]);

    useEffect(() => {
        // Add event listener for model-viewer errors
        const handleError = (event) => {
            console.error('Model Viewer Error:', event.detail);
            setError(event.detail);
            setIsLoading(false);
        };

        const handleLoad = () => {
            console.log('Model loaded successfully');
            setIsLoading(false);
        };

        window.addEventListener('model-viewer-error', handleError);
        window.addEventListener('model-viewer-load', handleLoad);

        return () => {
            window.removeEventListener('model-viewer-error', handleError);
            window.removeEventListener('model-viewer-load', handleLoad);
        };
    }, []);

    if (isLoading) {
        return (
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                Loading 3D model...
            </div>
        );
    }

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh', 
            margin: 0, 
            padding: 0,
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{
                padding: '16px',
                background: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: 0 }}>View in AR</h2>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: '#E91E63',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                    }}
                >
                    Back
                </button>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                {modelUrl ? (
                    <model-viewer
                        id="ar-model"
                        alt="Balloon Bouquet"
                        src={modelUrl}
                        ar
                        ar-modes="webxr scene-viewer quick-look"
                        camera-controls
                        auto-rotate
                        camera-orbit="45deg 55deg 2.5m"
                        min-camera-orbit="auto auto 0.1m"
                        max-camera-orbit="auto auto 10m"
                        shadow-intensity="1"
                        environment-image="neutral"
                        exposure="1"
                        auto-rotate-delay="0"
                        rotation-per-second="30deg"
                        interaction-prompt="auto"
                        interaction-prompt-style="basic"
                        interaction-prompt-threshold="0"
                        ar-scale="fixed"
                        ar-placement="floor"
                        ar-button
                        loading="eager"
                        reveal="interaction"
                        format="glb"
                    ></model-viewer>
                ) : null}
                {error && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(255, 0, 0, 0.1)',
                        padding: '20px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        zIndex: 1000
                    }}>
                        <p style={{ color: 'red', margin: 0 }}>Error: {error}</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                border: 'none',
                                background: '#E91E63',
                                color: 'white',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            Return to Configurator
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ARView; 