import React, { useEffect, useState } from 'react';

// Define LoadingIndicator locally or import if it becomes shared
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

const ARView = ({ modelBlobUrl, handleExitAR, arError, setArError, isLoading: initialIsLoading }) => {
    // We use local loading state because the model-viewer load determines UI readiness here
    const [isViewerLoading, setIsViewerLoading] = useState(true);

    // --- Workaround for onLoad not firing --- 
    useEffect(() => {
        // Force hide loading indicator after a delay (e.g., 2 seconds)
        const timer = setTimeout(() => {
            console.log('ARView: Forcing loading indicator off after timeout.');
            setIsViewerLoading(false);
        }, 2000); // 2000 milliseconds = 2 seconds

        // Cleanup the timer if the component unmounts or model changes before timeout
        return () => clearTimeout(timer);
    }, [modelBlobUrl]); // Re-run if the model URL changes
    // --- End Workaround --- 

    useEffect(() => {
        // Reset viewer loading state when the model URL changes (if component is reused)
        setIsViewerLoading(true);
    }, [modelBlobUrl]);

    return (
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
            {/* Use local isViewerLoading state for the indicator */}
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
                    bottom: '80px', // Position above launch button
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

            {/* Style Tag for model-viewer (can be moved to CSS file later) */} 
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    model-viewer#balloon-ar-viewer { /* Added ID for specificity */
                        width: 100%;
                        height: 100%;
                        background-color: transparent;
                        --poster-color: transparent;
                        position: absolute; /* Position within the container */
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        /* CSS variables for the default button (if it ever appears) */
                        --ar-button-background: #FF69B4;
                        --ar-button-border-radius: 50%;
                        --ar-button-color: white;
                        --ar-button-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    }
                    /* Style for centering default button icon (if it appears) */
                    model-viewer#balloon-ar-viewer::part(default-ar-button) {
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        padding: 0 !important;
                    }
                `}
            </style>

            {/* Model Viewer (absolute position within the relative container) */} 
            <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0 }}>
                 {/* Render model-viewer only when the component mounts and has a URL */}
                 {modelBlobUrl && (
                    <model-viewer
                        id="balloon-ar-viewer" // Added ID for querySelector
                        src={modelBlobUrl}
                        ios-src={modelBlobUrl} // Keep for potential Quick Look use
                        alt="AR Balloon Bouquet"
                        ar
                        ar-modes="webxr quick-look scene-viewer" // Keep all modes
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
                            console.error('ARView: Model viewer error:', event.detail);
                            setArError('Failed to load 3D model.');
                            setIsViewerLoading(false); // Ensure loading stops on error
                        }}
                        onLoad={() => {
                            console.log('ARView: Model loaded successfully (onLoad event)');
                            // Still try to set state normally via onLoad
                            setIsViewerLoading(false); 
                        }}
                    >
                        {/* Optional: Add a slot for custom poster if needed */}
                    </model-viewer>
                 )} 
            </div>
        </div>
    );
};

export default ARView; 