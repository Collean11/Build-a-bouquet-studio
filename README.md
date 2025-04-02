# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Troubleshooting AR Button Issues

### AR Button Not Visible
If the AR button disappears or is not visible, follow these steps:

1. **Check Device Compatibility**
   - iOS devices: Must use Safari browser
   - Android devices: Must use Chrome browser
   - Desktop: Must use Chrome or Edge with WebXR support

2. **Browser Cache Clear**
   ```bash
   # On Chrome/Edge:
   1. Open Developer Tools (F12 or right-click -> Inspect)
   2. Hold Shift and click the refresh button
   # OR
   1. Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   ```

3. **Model-Viewer Script Check**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Filter for "model-viewer"
   - Ensure both scripts are loaded:
     - `@google/model-viewer/dist/model-viewer.min.js`
     - `@google/model-viewer/dist/model-viewer-legacy.js`

4. **Force AR Button Display**
   If the button is still not visible, try these steps:
   1. Click the pink AR button in the bottom-right corner
   2. Wait for the model to load
   3. Look for a green circular button in the bottom-right corner
   4. If not visible, try refreshing the page and repeating steps 1-3

5. **Common Issues and Solutions**
   - If you see "AR is not supported on this device":
     - Try using a different browser
     - Ensure you're on a compatible device
     - Check if your device has AR capabilities
   - If the model loads but no AR button appears:
     - Try clearing browser cache
     - Check if you're in a supported browser
     - Ensure the model-viewer scripts are loaded correctly

6. **Developer Console Check**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any error messages related to:
     - model-viewer
     - AR support
     - WebXR
   - Share these messages with support if issues persist

### AR Button Styling
The AR button should appear as a green circular button in the bottom-right corner. If it appears differently:
- Check if your browser is up to date
- Try clearing browser cache
- Ensure no browser extensions are interfering with the display

## AR Button Fix Implementation

### Problem
The AR button was not appearing consistently across different devices and browsers. The main issues were:
1. AR support detection was too restrictive
2. CSS styles weren't being properly applied
3. Different AR modes weren't being handled correctly

### Solution
We implemented a comprehensive fix that addresses multiple aspects:

1. **Improved AR Support Detection**
   ```javascript
   // Check for different AR modes in order of preference
   const checkAR = async () => {
       try {
           // iOS Quick Look AR
           const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
           if (isIOS) {
               setArSupported(true);
               return;
           }
           
           // Android Scene Viewer AR
           const isAndroid = /Android/i.test(navigator.userAgent);
           if (isAndroid) {
               setArSupported(true);
               return;
           }

           // WebXR support
           if (navigator.xr) {
               const supported = await navigator.xr.isSessionSupported('immersive-ar');
               setArSupported(supported);
           }
       } catch (error) {
           console.error('AR support check failed:', error);
       }
   };
   ```

2. **Enhanced Model-Viewer Configuration**
   ```html
   <model-viewer
       src={modelBlobUrl}
       ar
       ar-modes="webxr scene-viewer quick-look"
       ar-button
       ar-scale="fixed"
       ar-placement="floor"
       ar-button-style="default"
       ar-button-position="bottom-right"
       ar-button-scale="1"
       ar-button-visibility="always"
       ios-src={modelBlobUrl}
       quick-look-browsers="safari chrome"
   />
   ```

3. **Robust CSS Styling**
   ```css
   model-viewer {
       --ar-button-background: #FF69B4;
       --ar-button-border-radius: 50%;
       --ar-button-color: white;
       --ar-button-shadow: 0 4px 12px rgba(0,0,0,0.2);
   }
   
   /* Target all possible AR button selectors */
   model-viewer::part(default-ar-button),
   model-viewer::part(ar-button),
   #ar-button {
       background-color: #FF69B4 !important;
       border-radius: 50% !important;
       position: fixed !important;
       bottom: 20px !important;
       right: 20px !important;
       z-index: 1006 !important;
       display: block !important;
       opacity: 1 !important;
       visibility: visible !important;
       pointer-events: auto !important;
   }
   ```

4. **Forced Button Visibility**
   ```javascript
   useEffect(() => {
       if (showAR && modelBlobUrl) {
           const modelViewer = document.querySelector('model-viewer');
           if (modelViewer) {
               const handleLoad = () => {
                   const arButton = modelViewer.shadowRoot?.querySelector('#ar-button');
                   if (arButton) {
                       arButton.style.display = 'block';
                       arButton.style.opacity = '1';
                       arButton.style.visibility = 'visible';
                   }
               };
               modelViewer.addEventListener('load', handleLoad);
           }
       }
   }, [showAR, modelBlobUrl]);
   ```

### Key Improvements
1. **Multiple AR Mode Support**
   - iOS: Quick Look AR
   - Android: Scene Viewer AR
   - Desktop: WebXR (when available)

2. **Consistent Styling**
   - Pink color scheme (#FF69B4)
   - Circular shape
   - Proper positioning
   - Hover and active states

3. **Reliable Visibility**
   - Multiple CSS selectors
   - Forced display properties
   - Proper z-indexing
   - Event-based initialization

4. **Error Handling**
   - Graceful fallbacks
   - Clear error messages
   - Device-specific support

### Testing
To verify the fix:
1. Clear browser cache
2. Test on different devices:
   - iOS (Safari)
   - Android (Chrome)
   - Desktop (Chrome/Edge)
3. Check console for AR support messages
4. Verify button visibility and functionality
