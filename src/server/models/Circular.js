import { Mesh } from 'three';
import { CircleGeometry } from 'three';
import { MeshStandardMaterial } from 'three';

export class Circular {
    constructor() {
        const geometry = new CircleGeometry(1, 32);
        const material = new MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.8,
            transparent: true,
            opacity: 0.5
        });
        
        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0;
        
        return mesh;
    }
} 