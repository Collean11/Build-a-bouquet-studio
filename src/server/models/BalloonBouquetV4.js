import { Group, SphereGeometry, MeshStandardMaterial, Mesh, CylinderGeometry } from 'three';

class BalloonBouquetV4 extends Group {
    constructor(config) {
        super();
        
        const { balloonTypes, balloonColors, balloonMaterials } = config;
        
        // Create balloons based on configuration
        Object.entries(balloonTypes).forEach(([position, type], index) => {
            if (type) {
                const balloon = this.createBalloon(
                    balloonColors[position],
                    balloonMaterials[position],
                    position,
                    index
                );
                this.add(balloon);
            }
        });
    }
    
    createBalloon(color, material, position, index) {
        // Create balloon group
        const balloonGroup = new Group();
        
        // Create balloon body
        const geometry = new SphereGeometry(0.5, 32, 32);
        const materialProps = {
            color: color,
            roughness: material === 'metallic' ? 0.1 : 0.5,
            metalness: material === 'metallic' ? 0.9 : 0.0,
        };
        const balloonMaterial = new MeshStandardMaterial(materialProps);
        const balloon = new Mesh(geometry, balloonMaterial);
        
        // Create balloon tie
        const tieGeometry = new CylinderGeometry(0.05, 0.05, 0.2, 16);
        const tieMaterial = new MeshStandardMaterial({ color: color, roughness: 0.5 });
        const tie = new Mesh(tieGeometry, tieMaterial);
        tie.position.y = -0.5;
        
        // Add balloon parts to group
        balloonGroup.add(balloon);
        balloonGroup.add(tie);
        
        // Position balloon based on its position in the bouquet
        const angle = (index / 5) * Math.PI * 2;
        const radius = 0.7;
        balloonGroup.position.x = Math.cos(angle) * radius;
        balloonGroup.position.z = Math.sin(angle) * radius;
        balloonGroup.position.y = position.includes('top') ? 1.5 : 0.5;
        
        return balloonGroup;
    }
}

export default BalloonBouquetV4; 