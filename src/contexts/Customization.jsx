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
        { name: 'Pink', value: '#FFB6C1' },
        { name: 'Blue', value: '#87CEEB' },
        { name: 'Yellow', value: '#FFD700' },
        { name: 'Purple', value: '#DDA0DD' },
        { name: 'Green', value: '#98FB98' },
        { name: 'Orange', value: '#FFA07A' }
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