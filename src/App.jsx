import { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ARView from './pages/ARView'
import "./App.css";
import { CustomizationProvider } from "./contexts/Customization";
import Configurator from "./assets/components/Configurator";

function App() {
  return (
    <CustomizationProvider>
      <Routes>
        <Route path="/" element={
          <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            <Suspense fallback={null}>
              <Configurator />
            </Suspense>
          </div>
        } />
        <Route path="/ar" element={<ARView />} />
      </Routes>
    </CustomizationProvider>
  );
}

export default App;
