#!/bin/bash

# Create backgrounds directory if it doesn't exist
mkdir -p public/backgrounds

# Download more natural, candid-style background images
echo "Downloading background images..."

# Modern Interior - Cozy home setting
curl -L "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=1920" -o public/backgrounds/modern_interior.jpg

# Forest - Natural woodland path
curl -L "https://images.unsplash.com/photo-1519682577862-22b62b24e493?q=80&w=1920" -o public/backgrounds/forest.jpg

# City - Natural street scene
curl -L "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=80&w=1920" -o public/backgrounds/city.jpg

# Studio - Warm, inviting space
curl -L "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=1920" -o public/backgrounds/studio.jpg

# Sunset Beach - Natural beach scene
curl -L "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920" -o public/backgrounds/sunset_beach.jpg

# Garden Dawn - Natural garden setting
curl -L "https://images.unsplash.com/photo-1504198322253-cfa87a0ff25f?q=80&w=1920" -o public/backgrounds/garden_dawn.jpg

# Night City - Natural night scene
curl -L "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1920" -o public/backgrounds/night_city.jpg

# Park - Natural park setting
curl -L "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?q=80&w=1920" -o public/backgrounds/park.jpg

echo "Background images downloaded successfully!" 