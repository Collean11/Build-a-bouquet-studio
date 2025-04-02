const { Scene, AmbientLight, DirectionalLight, Group, Mesh, SphereGeometry, MeshStandardMaterial, Vector3, Color, Box3 } = require('three');

function createBalloonBouquet(configuration) {
    try {
        console.log('Starting balloon bouquet creation with configuration:', configuration);
        
        // Create a temporary scene with white background
        const scene = new Scene();
        scene.background = new Color(0xffffff);
        console.log('Created scene with white background');

        // Create a group for the balloon bouquet
        const bouquet = new Group();
        console.log('Created bouquet group');

        // Define balloon positions
        const positions = [
            new Vector3(0, 0, 0),
            new Vector3(1, 0.5, 0),
            new Vector3(-1, 0.5, 0),
            new Vector3(0, 1, 0),
            new Vector3(0.5, 1.5, 0),
            new Vector3(-0.5, 1.5, 0)
        ];
        console.log('Defined balloon positions');

        // Create balloons
        positions.forEach((position, index) => {
            try {
                console.log(`Creating balloon ${index + 1} at position:`, position);
                
                // Get color, material type, and balloon type from configuration
                const color = configuration.balloonColors[`balloon${index + 1}`] || '#FFB6C1';
                const materialType = configuration.balloonMaterials[`balloon${index + 1}`] || 'standard';
                const balloonType = configuration.balloonTypes[`balloon${index + 1}`] || 'A';
                
                console.log(`Balloon ${index + 1} properties:`, { color, materialType, balloonType });

                // Create geometry based on balloon type
                let geometry;
                switch (balloonType) {
                    case 'A': // Latex
                        geometry = new SphereGeometry(0.5, 32, 32);
                        break;
                    case 'B': // Heart
                        geometry = new SphereGeometry(0.5, 32, 32);
                        break;
                    case 'C': // Star
                        geometry = new SphereGeometry(0.5, 32, 32);
                        break;
                    default:
                        geometry = new SphereGeometry(0.5, 32, 32);
                }
                console.log(`Created geometry for balloon ${index + 1}`);

                // Create material with proper color parsing
                const material = new MeshStandardMaterial({
                    color: new Color(color),
                    metalness: materialType === 'metallic' ? 0.8 : 0.0,
                    roughness: materialType === 'metallic' ? 0.2 : 0.5,
                    transparent: true,
                    opacity: 0.9,
                    side: 2 // Double-sided rendering
                });
                console.log(`Created material for balloon ${index + 1}`);

                // Create mesh
                const balloon = new Mesh(geometry, material);
                balloon.position.copy(position);
                balloon.castShadow = true;
                balloon.receiveShadow = true;
                console.log(`Created mesh for balloon ${index + 1}`);

                // Add to bouquet
                bouquet.add(balloon);
                console.log(`Added balloon ${index + 1} to bouquet`);
            } catch (error) {
                console.error(`Error creating balloon ${index + 1}:`, error);
                throw error;
            }
        });

        // Add lights
        const ambientLight = new AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        console.log('Added ambient light');

        const directionalLight = new DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        console.log('Added directional light');

        // Add bouquet to scene
        scene.add(bouquet);
        console.log('Added bouquet to scene');

        // Center the bouquet
        const box = new Box3().setFromObject(bouquet);
        const center = box.getCenter(new Vector3());
        bouquet.position.sub(center);
        console.log('Centered bouquet in scene');

        console.log('Balloon bouquet creation completed successfully');
        return scene;
    } catch (error) {
        console.error('Error in createBalloonBouquet:', error);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

module.exports = { createBalloonBouquet }; 