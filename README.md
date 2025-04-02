# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Troubleshooting Guide

### AR Button Not Visible

If the AR button is not appearing when you click "View in AR", follow these steps:

1. **Check Device Compatibility**
   - iOS: Use Safari browser
   - Android: Use Chrome browser
   - Desktop: Use Chrome or Edge with WebXR support
   - Mac: Must have AR capabilities (e.g., LiDAR scanner)

2. **Browser Cache**
   - Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
   - Or hold Shift and click the refresh button

3. **Check Console Logs**
   - Open Developer Tools (F12)
   - Look for logs starting with "AR:"
   - Common messages:
     - "AR: iOS device detected"
     - "AR: MacOS device detected"
     - "AR: MacOS support: Yes/No"
     - "AR: Model loaded"
     - "AR: Starting model export..."
     - "AR: Model exported"

4. **Model Loading Issues**
   - Wait for the model to fully load before clicking "View in AR"
   - Check if the model-viewer element is present in the DOM
   - Verify the model URL is accessible

5. **AR Support Detection**
   - The app checks for AR support on startup
   - For MacOS, it verifies WebXR support
   - For iOS/Android, AR is enabled by default
   - Check console for "AR: Support check failed" if issues persist

6. **Common Solutions**
   - Try clicking the pink "View in AR" button first
   - Wait for the model to load completely
   - Check if your device has AR capabilities
   - Ensure you're using a compatible browser
   - Try clearing browser cache and reloading

7. **Development Mode**
   - In development, AR support is always enabled
   - Production builds check for actual device support
   - Use `npm run build` to test production behavior

### Model Loading Issues

If the 3D model isn't loading properly:

1. **Check Model Path**
   - Verify the model path in `src/assets/models/`
   - Ensure the model file exists and is accessible

2. **Console Errors**
   - Look for Three.js related errors
   - Check for model loading failures
   - Verify model format compatibility

3. **Performance Issues**
   - Reduce model complexity if needed
   - Check for memory leaks in development
   - Monitor frame rate in AR mode

### Development Tips

1. **Testing AR**
   - Use Chrome DevTools device emulation
   - Test on multiple devices if possible
   - Check AR support detection logs

2. **Debugging**
   - Use the console logs with "AR:" prefix
   - Monitor model loading states
   - Check for WebXR support

3. **Common Pitfalls**
   - AR button may not appear immediately
   - Model needs to load before AR activation
   - Device must support AR features

For more detailed information about model-viewer and AR support, visit:
- [model-viewer Documentation](https://modelviewer.dev/docs/)
- [WebXR Device API](https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API)
- [AR Quick Look](https://developer.apple.com/documentation/arkit/ar_quick_look)

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
