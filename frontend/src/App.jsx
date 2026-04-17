import { useState } from 'react';
import axios from 'axios';
import './index.css';
import EarthEngineForm from './components/EarthEngineForm';
import DataVisualizer from './components/DataVisualizer';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorRight, setErrorRight] = useState(null);

  const [leftData, setLeftData] = useState(null);
  const [rightData, setRightData] = useState(null);

  const [leftConfig, setLeftConfig] = useState(null);
  const [rightConfig, setRightConfig] = useState(null);

  const fetchImagery = async (configLeft, configRight) => {
    setLoading(true);
    setError(null);
    setErrorRight(null);
    setLeftData(null);
    setRightData(null);
    setLeftConfig(configLeft);
    setRightConfig(configRight);

    const processError = (errorObj) => {
      let msg = errorObj?.response?.data?.details || errorObj?.response?.data?.error || errorObj?.message || "An error occurred during extraction.";
      if (typeof msg === 'string' && msg.trim().startsWith('{')) {
        try {
          msg = JSON.parse(msg).error || msg;
        } catch(e) {}
      }
      return msg;
    };

    try {
      const leftPromise = axios.post('http://localhost:3000/api/imagery', configLeft);
      
      if (configRight) {
        const [leftRes, rightRes] = await Promise.allSettled([
          leftPromise,
          axios.post('http://localhost:3000/api/imagery', configRight)
        ]);
        
        if (leftRes.status === 'fulfilled') {
          setLeftData(leftRes.value.data);
        } else {
          setError(processError(leftRes.reason));
        }

        if (rightRes.status === 'fulfilled') {
          setRightData(rightRes.value.data);
        } else {
          setErrorRight(processError(rightRes.reason));
        }

      } else {
        const response = await leftPromise;
        setLeftData(response.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(processError(err));
      // Note: for Promise.allSettled we also handled leftRes/rightRes inside the try block.
      // But if Promise.allSettled itself somehow fails or we fail before it, this global catch triggers.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: '20px', boxSizing: 'border-box' }}>
      <header className="hero">
        <h1>Earth Engine Explorer</h1>
        <p>Advanced geospatial analysis from Google Earth Engine.</p>
      </header>
      
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <section className="form-section" style={{ width: '100%', maxWidth: '900px', marginBottom: '20px' }}>
          <EarthEngineForm onSubmit={fetchImagery} isLoading={loading} />
        </section>
        
        <section className="result-section" style={{ width: '100%', maxWidth: '1400px', display: 'flex', gap: '20px' }}>
          <div className="card result-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2 className="card-title">{rightConfig ? 'Left View Result' : 'Analysis Result'}</h2>
            <DataVisualizer data={leftData} config={leftConfig} isLoading={loading} error={error} />
          </div>

          {rightConfig && (
            <div className="card result-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h2 className="card-title">Right View Result</h2>
              <DataVisualizer data={rightData} config={rightConfig} isLoading={loading} error={errorRight} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
