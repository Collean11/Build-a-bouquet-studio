import { 
    MeshReflectorMaterial, 
    PresentationControls, 
    Stage,
    Html,
    OrbitControls,
    PerspectiveCamera,
    Environment,
    useGLTF,
    Float
} from "@react-three/drei";
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useCustomization } from "../../contexts/Customization";
import BalloonBouquetV4 from "./BalloonBouquetV4";
import { useSpring, animated } from '@react-spring/three';
import { useGesture } from '@use-gesture/react';
import { XR, useXR } from '@react-three/xr';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Vector2, Raycaster, DoubleSide, Color } from 'three';



const BalloonClickHandler = () => {
    const { camera, scene } = useThree();
    const { setSelectedBalloon } = useCustomization();
    
    const handleClick = (event) => {
        const raycaster = new Raycaster();
        const mouse = new Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);

        for (const intersect of intersects) {
            if (intersect.object.userData.isBalloon) {
                console.log('Selected balloon:', intersect.object.userData.balloonId);
                setSelectedBalloon(intersect.object.userData.balloonId);
                break;
            }
        }
    };

    useEffect(() => {
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [camera, scene]);

    return null;
};

const Experience = () => {
    const { selectedEnvironment, setScene } = useCustomization();
    const [isARMode, setIsARMode] = useState(false);
    const { selectedBalloon, setSelectedBalloon } = useCustomization();
    const [selectedBalloonMesh, setSelectedBalloonMesh] = useState(null);
    const navigate = useNavigate();
    const sceneRef = useRef();

    const handleARClick = async () => {
        if (!sceneRef.current) {
            console.error('Scene reference not available');
            return;
        }

        try {
            // Create a temporary scene for AR
            const tempScene = new THREE.Scene();
            
            // Find the balloon bouquet in the current scene
            let balloonGroup = null;
            sceneRef.current.traverse((child) => {
                if (child.userData && child.userData.isBalloonBouquet) {
                    balloonGroup = child;
                }
            });

            if (!balloonGroup) {
                console.error('No balloon bouquet found in scene');
                alert('Could not find balloon bouquet in scene. Please try again.');
                return;
            }

            // Clone the balloon bouquet
            const balloonClone = balloonGroup.clone();

            // Center the balloon bouquet
            const box = new THREE.Box3().setFromObject(balloonClone);
            const center = box.getCenter(new THREE.Vector3());
            balloonClone.position.sub(center);

            // Scale the model appropriately for AR
            const size = box.getSize(new THREE.Vector3());
            const maxSize = Math.max(size.x, size.y, size.z);
            const scale = 1 / maxSize; // Normalize size to 1 unit
            balloonClone.scale.multiplyScalar(scale);

            // Add the balloon bouquet to the temporary scene
            tempScene.add(balloonClone);

            // Add lights to the temporary scene
            const ambientLight = new THREE.AmbientLight(0xffffff, 1);
            tempScene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
            directionalLight.position.set(5, 5, 5);
            tempScene.add(directionalLight);

            // Export the scene
            const exporter = new GLTFExporter();
            exporter.parse(
                tempScene,
                (gltf) => {
                    const blob = new Blob([gltf], { type: 'model/gltf-binary' });
                    const blobUrl = URL.createObjectURL(blob);
                    
                    // Create a simple HTML file with the model-viewer
                    const htmlContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>AR Balloon Bouquet</title>
                            <meta name="viewport" content="width=device-width, initial-scale=1">
                            <script type="module" src="https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js"></script>
                            <style>
                                body { margin: 0; padding: 0; }
                                model-viewer { width: 100%; height: 100vh; }
                            </style>
                        </head>
                        <body>
                            <model-viewer
                                src="${blobUrl}"
                                ar
                                ar-modes="webxr scene-viewer quick-look"
                                camera-controls
                                auto-rotate
                                camera-orbit="0deg 75deg 75%"
                                min-camera-orbit="auto auto 75%"
                                max-camera-orbit="auto auto 75%"
                            ></model-viewer>
                        </body>
                        </html>
                    `;

                    // Create a blob from the HTML content
                    const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
                    const htmlUrl = URL.createObjectURL(htmlBlob);

                    // Open the AR view in a new window
                    const arWindow = window.open(htmlUrl, '_blank');
                    if (!arWindow) {
                        alert('Please allow popups for this site to view the AR model.');
                    }
                },
                (error) => {
                    console.error('Export error:', error);
                    alert('Error preparing model for AR view');
                },
                { binary: true }
            );
        } catch (error) {
            console.error('AR preparation error:', error);
            alert('Error preparing AR view');
        }
    };

    const handleExitAR = () => {
        setIsARMode(false);
    };

    return (
        <div style={{ 
            width: '100vw', 
            height: '100vh',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <Canvas
                shadows
                camera={{ position: [0, -6, 3], fov: 45 }}
                gl={{ preserveDrawingBuffer: true }}
            >
                <Suspense fallback={null}>
                    <group ref={sceneRef}>
                        {/* Single environment setup */}
                        <Environment {...EnvironmentConfig[selectedEnvironment]} />
                        
                        {/* Single lighting setup */}
                        <ambientLight intensity={0.2} />
                        <directionalLight
                            position={[10, 10, 5]}
                            intensity={2}
                            castShadow
                            shadow-mapSize-width={2048}
                            shadow-mapSize-height={2048}
                            shadow-camera-far={50}
                            shadow-camera-left={-10}
                            shadow-camera-right={10}
                            shadow-camera-top={10}
                            shadow-camera-bottom={-10}
                        />
                        
                        <BalloonClickHandler />
                        
                        {/* Balloon bouquet */}
                        <BalloonBouquetV4 
                            position={[0, -5, 0]}
                            scale={100}
                            userData={{ 
                                isBalloonBouquet: true,
                                isARViewable: true
                            }}
                        />

                        <OrbitControls
                            makeDefault
                            minPolarAngle={Math.PI / 8}
                            maxPolarAngle={Math.PI / 2}
                            minDistance={20}
                            maxDistance={80}
                            target={[0, 0, 0]}
                            enablePan={false}
                            enableZoom={true}
                            enableRotate={true}
                            zoomSpeed={0.5}
                            rotateSpeed={0.5}
                            panSpeed={0.5}
                        />
                    </group>
                </Suspense>
            </Canvas>
        </div>
    );
};

export default Experience;