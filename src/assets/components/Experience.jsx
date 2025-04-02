import { 
    MeshReflectorMaterial, 
    PresentationControls, 
    Stage,
    Html,
    OrbitControls,
    PerspectiveCamera,
    Environment,
    useTexture,
    Sky,
    Backdrop,
    useGLTF,
    Decal,
    Float,
    Box,
    Cylinder,
    Sphere,
    Cone,
    Plane
} from "@react-three/drei";
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useCustomization } from "../../contexts/Customization";
import BalloonBouquetV4 from "./BalloonBouquetV4";
import { Model as PhotoStudio } from "./PhotoStudioExport";
import { useSpring, animated } from '@react-spring/three';
import { useGesture } from '@use-gesture/react';
import { XR, useXR } from '@react-three/xr';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Vector2, Raycaster, DoubleSide, Color } from 'three';

const EnvironmentProps = ({ environment }) => {
    const getPropsForEnvironment = (env) => {
        switch(env.name) {
            case 'warehouse':
                return {
                    props: [
                        { position: [-5, 0, -8], rotation: [0, Math.PI / 4, 0], scale: 1, type: 'shelf', color: '#8b4513' },
                        { position: [5, 0, -8], rotation: [0, -Math.PI / 4, 0], scale: 1, type: 'shelf', color: '#8b4513' },
                        { position: [0, 0, -12], rotation: [0, Math.PI, 0], scale: 1.2, type: 'table', color: '#a0522d' }
                    ]
                };
            case 'forest':
                return {
                    props: [
                        { position: [-8, 0, -10], rotation: [0, Math.PI / 3, 0], scale: 1.5, type: 'tree', color: '#228B22' },
                        { position: [8, 0, -10], rotation: [0, -Math.PI / 3, 0], scale: 1.5, type: 'tree', color: '#228B22' },
                        { position: [0, 0, -15], rotation: [0, Math.PI, 0], scale: 1.2, type: 'bush', color: '#32CD32' }
                    ]
                };
            case 'city':
                return {
                    props: [
                        { position: [-6, 0, -10], rotation: [0, Math.PI / 4, 0], scale: 1.2, type: 'building', color: '#808080' },
                        { position: [6, 0, -10], rotation: [0, -Math.PI / 4, 0], scale: 1.2, type: 'building', color: '#808080' },
                        { position: [0, 0, -12], rotation: [0, Math.PI, 0], scale: 1, type: 'bench', color: '#A9A9A9' }
                    ]
                };
            case 'studio':
                return {
                    props: [
                        { position: [-4, 0, -8], rotation: [0, Math.PI / 4, 0], scale: 1, type: 'camera', color: '#000000' },
                        { position: [4, 0, -8], rotation: [0, -Math.PI / 4, 0], scale: 1, type: 'light', color: '#FFD700' },
                        { position: [0, 0, -12], rotation: [0, Math.PI, 0], scale: 1.2, type: 'backdrop', color: '#F5F5F5' }
                    ]
                };
            case 'sunset':
                return {
                    props: [
                        { position: [-6, 0, -10], rotation: [0, Math.PI / 3, 0], scale: 1.2, type: 'palm', color: '#8B4513' },
                        { position: [6, 0, -10], rotation: [0, -Math.PI / 3, 0], scale: 1.2, type: 'palm', color: '#8B4513' },
                        { position: [0, 0, -12], rotation: [0, Math.PI, 0], scale: 1, type: 'beach_chair', color: '#DEB887' }
                    ]
                };
            case 'dawn':
                return {
                    props: [
                        { position: [-5, 0, -8], rotation: [0, Math.PI / 4, 0], scale: 1.2, type: 'flower', color: '#FF69B4' },
                        { position: [5, 0, -8], rotation: [0, -Math.PI / 4, 0], scale: 1.2, type: 'flower', color: '#FF69B4' },
                        { position: [0, 0, -10], rotation: [0, Math.PI, 0], scale: 1, type: 'garden_bench', color: '#8B4513' }
                    ]
                };
            case 'night':
                return {
                    props: [
                        { position: [-6, 0, -10], rotation: [0, Math.PI / 4, 0], scale: 1.2, type: 'streetlight', color: '#FFD700' },
                        { position: [6, 0, -10], rotation: [0, -Math.PI / 4, 0], scale: 1.2, type: 'streetlight', color: '#FFD700' },
                        { position: [0, 0, -12], rotation: [0, Math.PI, 0], scale: 1, type: 'bench', color: '#4A4A4A' }
                    ]
                };
            case 'park':
                return {
                    props: [
                        { position: [-6, 0, -10], rotation: [0, Math.PI / 3, 0], scale: 1.2, type: 'tree', color: '#228B22' },
                        { position: [6, 0, -10], rotation: [0, -Math.PI / 3, 0], scale: 1.2, type: 'tree', color: '#228B22' },
                        { position: [0, 0, -12], rotation: [0, Math.PI, 0], scale: 1, type: 'park_bench', color: '#8B4513' }
                    ]
                };
            default:
                return { props: [] };
        }
    };

    const props = getPropsForEnvironment(environment);

    return (
        <group>
            {props.props.map((prop, index) => (
                <Float
                    key={index}
        speed={1.5} 
                    rotationIntensity={0.2}
                    floatIntensity={0.2}
                >
                    <mesh
                        position={prop.position}
                        rotation={prop.rotation}
                        scale={prop.scale}
                        castShadow
                        receiveShadow
                    >
                        {prop.type === 'shelf' && (
                            <group>
                                <boxGeometry args={[2, 0.2, 1]} />
                                <boxGeometry args={[0.2, 2, 0.2]} position={[-0.9, 1, 0]} />
                                <boxGeometry args={[0.2, 2, 0.2]} position={[0.9, 1, 0]} />
                            </group>
                        )}
                        {prop.type === 'table' && (
                            <group>
                                <boxGeometry args={[2, 0.2, 2]} />
                                <boxGeometry args={[0.2, 1, 0.2]} position={[-0.9, 0.5, -0.9]} />
                                <boxGeometry args={[0.2, 1, 0.2]} position={[0.9, 0.5, -0.9]} />
                                <boxGeometry args={[0.2, 1, 0.2]} position={[-0.9, 0.5, 0.9]} />
                                <boxGeometry args={[0.2, 1, 0.2]} position={[0.9, 0.5, 0.9]} />
                            </group>
                        )}
                        {prop.type === 'tree' && (
                            <group>
                                <cylinderGeometry args={[0.3, 0.3, 2, 8]} />
                                <coneGeometry args={[1, 2, 8]} position={[0, 1.5, 0]} />
                            </group>
                        )}
                        {prop.type === 'bush' && (
                            <group>
                                <sphereGeometry args={[1, 16, 16]} />
                                <sphereGeometry args={[0.8, 16, 16]} position={[0.5, 0.5, 0.5]} />
                                <sphereGeometry args={[0.8, 16, 16]} position={[-0.5, 0.5, -0.5]} />
                            </group>
                        )}
                        {prop.type === 'building' && (
                            <group>
                                <boxGeometry args={[2, 4, 2]} />
                                <boxGeometry args={[0.2, 0.2, 0.2]} position={[-0.8, 2, -0.8]} />
                                <boxGeometry args={[0.2, 0.2, 0.2]} position={[0.8, 2, -0.8]} />
                                <boxGeometry args={[0.2, 0.2, 0.2]} position={[-0.8, 2, 0.8]} />
                                <boxGeometry args={[0.2, 0.2, 0.2]} position={[0.8, 2, 0.8]} />
                            </group>
                        )}
                        {prop.type === 'bench' && (
                            <group>
                                <boxGeometry args={[2, 0.2, 0.5]} />
                                <boxGeometry args={[0.2, 0.5, 0.2]} position={[-0.9, 0.25, 0]} />
                                <boxGeometry args={[0.2, 0.5, 0.2]} position={[0.9, 0.25, 0]} />
                                <boxGeometry args={[2, 0.2, 0.2]} position={[0, 0.5, 0]} />
                            </group>
                        )}
                        {prop.type === 'camera' && (
                            <group>
                                <boxGeometry args={[0.5, 0.5, 0.5]} />
                                <cylinderGeometry args={[0.2, 0.2, 0.3, 16]} position={[0, 0, 0.4]} />
                            </group>
                        )}
                        {prop.type === 'light' && (
                            <group>
                                <sphereGeometry args={[0.5, 16, 16]} />
                                <pointLight intensity={1} color={prop.color} />
                            </group>
                        )}
                        {prop.type === 'backdrop' && (
                            <group>
                                <boxGeometry args={[4, 3, 0.1]} />
                            </group>
                        )}
                        {prop.type === 'palm' && (
                            <group>
                                <cylinderGeometry args={[0.2, 0.2, 3, 8]} />
                                <coneGeometry args={[1, 2, 8]} position={[0, 1.5, 0]} />
                                <coneGeometry args={[0.8, 1.5, 8]} position={[0.5, 1.5, 0.5]} />
                            </group>
                        )}
                        {prop.type === 'beach_chair' && (
                            <group>
                                <boxGeometry args={[1.5, 0.2, 0.5]} />
                                <boxGeometry args={[1.5, 0.2, 0.2]} position={[0, 0.5, 0.15]} />
                            </group>
                        )}
                        {prop.type === 'flower' && (
                            <group>
                                <cylinderGeometry args={[0.1, 0.1, 0.5, 8]} />
                                <sphereGeometry args={[0.3, 16, 16]} position={[0, 0.4, 0]} />
                            </group>
                        )}
                        {prop.type === 'garden_bench' && (
                            <group>
                                <boxGeometry args={[2, 0.2, 0.5]} />
                                <boxGeometry args={[0.2, 0.5, 0.2]} position={[-0.9, 0.25, 0]} />
                                <boxGeometry args={[0.2, 0.5, 0.2]} position={[0.9, 0.25, 0]} />
                                <boxGeometry args={[2, 0.2, 0.2]} position={[0, 0.5, 0]} />
                            </group>
                        )}
                        {prop.type === 'streetlight' && (
                            <group>
                                <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
                                <sphereGeometry args={[0.3, 16, 16]} position={[0, 1.5, 0]} />
                                <pointLight intensity={1} color={prop.color} position={[0, 1.5, 0]} />
                            </group>
                        )}
                        {prop.type === 'park_bench' && (
                            <group>
                                <boxGeometry args={[2, 0.2, 0.5]} />
                                <boxGeometry args={[0.2, 0.5, 0.2]} position={[-0.9, 0.25, 0]} />
                                <boxGeometry args={[0.2, 0.5, 0.2]} position={[0.9, 0.25, 0]} />
                                <boxGeometry args={[2, 0.2, 0.2]} position={[0, 0.5, 0]} />
                            </group>
                        )}
                        <meshStandardMaterial 
                            color={prop.color}
                            roughness={0.6}
                            metalness={0.4}
                            envMapIntensity={1}
                            normalScale={[0.8, 0.8]}
                            aoMapIntensity={0.8}
                            side={DoubleSide}
                            transparent={prop.type === 'light' || prop.type === 'streetlight'}
                            opacity={prop.type === 'light' || prop.type === 'streetlight' ? 0.8 : 1}
                        />
        </mesh>
                </Float>
            ))}
        </group>
    );
};

const getTexturePath = (envName) => {
    if (!envName) return '/environments/studio.hdr';
    
    switch(envName.value || envName) {
        case 'plain':
            return '/environments/studio.hdr';
        case 'apartment':
            return '/environments/luxury_apartment.hdr';
        case 'party_room':
            return '/environments/party_room.hdr';
        case 'wedding':
            return '/environments/wedding_venue.hdr';
        case 'office':
            return '/environments/modern_office.hdr';
        case 'restaurant':
            return '/environments/restaurant.hdr';
        case 'photo_shoot':
            return '/environments/photo_shoot_room.hdr';
        default:
            return '/environments/studio.hdr';
    }
};

const ThemedFloor = ({ environment }) => {
    return (
        <group>
            {/* Main reflective floor */}
            <mesh
                position={[0, -2, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
                    blur={[1000, 100]}
        resolution={2048}
        mixBlur={1}
                    mixStrength={30}
                    depthScale={1}
                    minDepthThreshold={0.85}
                    color="#ffffff"
                    metalness={0.8}
                    roughness={0.2}
                    mirror={0.8}
                    distortion={0.2}
                    distortionScale={0.5}
                />
            </mesh>

            {/* Colored floor overlay */}
            <mesh
                position={[0, -1.99, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
            >
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial
                    color={environment?.value === 'party_room' ? '#1a1a1a' : 
                           environment?.value === 'wedding' ? '#f5e6e6' :
                           environment?.value === 'office' ? '#e8e8e8' :
                           environment?.value === 'restaurant' ? '#2c1810' :
                           environment?.value === 'apartment' ? '#f0f0f0' :
                           '#ffffff'}
                    roughness={0.4}
                    metalness={0.6}
                    envMapIntensity={1}
                    side={DoubleSide}
                    normalScale={[0.8, 0.8]}
                    aoMapIntensity={0.8}
                />
            </mesh>
        </group>
    );
};

const SceneBackground = ({ environment }) => {
    const { scene } = useThree();
    const [envMap, setEnvMap] = useState(null);

    return (
        <>
            <Environment
                preset="studio"
                background
                blur={0.8}
                resolution={512}
                ground={{
                    height: 15,
                    radius: 40,
                    scale: 1000
                }}
            />
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
        </>
    );
};

const PhotoBackdrop = ({ theme = 'white' }) => {
    console.log('PhotoBackdrop: Current theme:', theme);
    return (
        <mesh
            position={[-10, 0, -8]}
            rotation={[0, Math.PI, 0]}
            scale={[12, 8, 1]}
        >
            <planeGeometry args={[1, 1]} />
            <meshStandardMaterial
                color={theme === 'white' ? '#ffffff' :
                       theme === 'black' ? '#000000' :
                       theme === 'gray' ? '#808080' :
                       theme === 'cream' ? '#f5f5f5' :
                       theme === 'blue' ? '#e6f3ff' :
                       '#ffffff'}
                roughness={0.3}
                metalness={0.1}
                side={DoubleSide}
                transparent={true}
                opacity={1}
                needsUpdate={true}
        />
        </mesh>
    );
};

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
                        <Environment
                            preset="studio"
                            background
                            blur={0.8}
                            resolution={512}
                            ground={{
                                height: 15,
                                radius: 40,
                                scale: 1000
                            }}
                        />
                        
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