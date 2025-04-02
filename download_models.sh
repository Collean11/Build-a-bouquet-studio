#!/bin/bash

# Create models directory if it doesn't exist
mkdir -p public/models

# Download models
echo "Downloading 3D models..."

# Warehouse props
curl -L "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/IndustrialShelf/glTF/IndustrialShelf.gltf" -o public/models/industrial_shelf.glb

# Forest props
curl -L "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Tree/glTF/Tree.gltf" -o public/models/tree.glb

# City props
curl -L "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Building/glTF/Building.gltf" -o public/models/building.glb

# Studio props
curl -L "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/StudioBackdrop/glTF/StudioBackdrop.gltf" -o public/models/studio_backdrop.glb

# Beach props
curl -L "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BeachChair/glTF/BeachChair.gltf" -o public/models/beach_chair.glb

# Garden props
curl -L "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/GardenBench/glTF/GardenBench.gltf" -o public/models/garden_bench.glb

# Night props
curl -L "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/StreetLight/glTF/StreetLight.gltf" -o public/models/street_light.glb

# Park props
curl -L "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ParkBench/glTF/ParkBench.gltf" -o public/models/park_bench.glb

echo "3D models downloaded successfully!" 