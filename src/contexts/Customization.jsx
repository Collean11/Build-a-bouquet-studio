import { createContext, useContext, useState } from "react";

const CustomizationContext = createContext({});

export const CustomizationProvider = ({ children }) => {
    const [selectedBalloon, setSelectedBalloon] = useState('top');
    const [balloonTypes, setBalloonTypes] = useState({
        top: 'A',
        middle1: 'A',
        middle2: 'A',
        middle3: 'A',
        bottom1: 'A',
        bottom2: 'A',
        bottom3: 'A'
    });
    const [balloonColors, setBalloonColors] = useState({
        top: '#FFB6C1',
        middle1: '#FFB6C1',
        middle2: '#FFB6C1',
        middle3: '#FFB6C1',
        bottom1: '#FFB6C1',
        bottom2: '#FFB6C1',
        bottom3: '#FFB6C1'
    });
    const [balloonMaterials, setBalloonMaterials] = useState({
        top: 'standard',
        middle1: 'standard',
        middle2: 'standard',
        middle3: 'standard',
        bottom1: 'standard',
        bottom2: 'standard',
        bottom3: 'standard'
    });
    const [selectedEnvironment, setSelectedEnvironment] = useState('studio');
    const [scene, setScene] = useState(null);

    const colorOptions = [
        // Pastel Colors
        { name: 'Soft Pink', value: '#FFB6C1' },
        { name: 'Baby Blue', value: '#87CEEB' },
        { name: 'Butter Yellow', value: '#FFFACD' },
        { name: 'Lavender', value: '#DDA0DD' },
        { name: 'Mint Green', value: '#98FB98' },
        { name: 'Peach', value: '#FFA07A' },
        
        // Rich Colors (replacing "dark")
        { name: 'Deep Purple', value: '#4B0082' },
        { name: 'Navy Blue', value: '#000080' },
        { name: 'Forest Green', value: '#228B22' },
        { name: 'Burgundy', value: '#800020' },
        { name: 'Dark Teal', value: '#008080' },
        { name: 'Royal Blue', value: '#4169E1' },
        
        // Classic Colors (replacing "basic")
        { name: 'Pure White', value: '#FFFFFF' },
        { name: 'Pure Black', value: '#000000' },
        { name: 'Pure Red', value: '#FF0000' },
        { name: 'Pure Blue', value: '#0000FF' },
        { name: 'Pure Green', value: '#00FF00' },
        { name: 'Pure Yellow', value: '#FFFF00' },
        
        // Vibrant Colors
        { name: 'Hot Pink', value: '#FF69B4' },
        { name: 'Electric Blue', value: '#00FFFF' },
        { name: 'Sunshine Yellow', value: '#FFEB3B' },
        { name: 'Electric Purple', value: '#9B30FF' },
        { name: 'Neon Green', value: '#7FFF00' },
        { name: 'Coral', value: '#FF7F50' },
        
        // Metallic Colors
        { name: 'Gold', value: '#FFD700' },
        { name: 'Silver', value: '#C0C0C0' },
        { name: 'Rose Gold', value: '#B76E79' },
        { name: 'Bronze', value: '#CD7F32' },
        { name: 'Platinum', value: '#E5E4E2' },
        { name: 'Copper', value: '#B87333' }
    ];

    const materialOptions = [
        { name: 'Standard', value: 'standard' },
        { name: 'Pearl', value: 'pearl' },
        { name: 'Metallic', value: 'metallic' }
    ];

    const environments = [
        { name: 'Studio', value: 'studio' },
        { name: 'Sunset', value: 'sunset' },
        { name: 'Dawn', value: 'dawn' },
        { name: 'Night', value: 'night' },
        { name: 'Warehouse', value: 'warehouse' },
        { name: 'Forest', value: 'forest' },
        { name: 'Apartment', value: 'apartment' },
        { name: 'City', value: 'city' },
        { name: 'Park', value: 'park' },
        { name: 'Lobby', value: 'lobby' }
    ];

    const setColor = (balloon, color) => {
        setBalloonColors(prev => ({
            ...prev,
            [balloon]: color
        }));
    };

    const setMaterial = (balloon, material) => {
        setBalloonMaterials(prev => ({
            ...prev,
            [balloon]: material
        }));
    };

    const toggleBalloonType = (balloon, type) => {
        setBalloonTypes(prev => ({
            ...prev,
            [balloon]: type
        }));
    };

    return (
        <CustomizationContext.Provider value={{
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
            setSelectedEnvironment,
            scene,
            setScene
        }}>
            {children}
        </CustomizationContext.Provider>
    );
};

export const useCustomization = () => {
    const context = useContext(CustomizationContext);
    if (context === undefined) {
        throw new Error('useCustomization must be used within a CustomizationProvider');
    }
    return context;
}; 