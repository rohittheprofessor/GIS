import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DataVisualizer = ({ data, config, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Communicating with Google Earth Engine...</p>
        <span className="subtitle">This may take a few seconds depending on cloud cover and area size.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E31A1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p className="error-text">Extraction Failed</p>
        <p className="error-details">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
        <p>Awaiting parameters to fetch data.</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (data.type) {
      case 'thumbnail':
        return (
          <div className="image-display">
            <img src={data.data} alt="Satellite Imagery" className="satellite-image" />
            <div className="image-metadata">
              <span>{config?.index?.toUpperCase() || 'RGB'} Thumbnail Composite</span>
              <button onClick={() => window.open(data.data, '_blank')} className="btn-secondary">Open Image</button>
            </div>
          </div>
        );
      
      case 'mapid':
        return (
          <div className="map-display" style={{ height: '400px', width: '100%', position: 'relative' }}>
            <MapContainer 
              center={[config?.latitude || 0, config?.longitude || 0]} 
              zoom={config?.scale < 30 ? 13 : 11} 
              style={{ height: '100%', width: '100%', borderRadius: '8px', zIndex: 0 }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <TileLayer
                url={data.urlFormat}
                attribution="Google Earth Engine"
              />
            </MapContainer>
            <div className="image-metadata" style={{ marginTop: '10px' }}>
              <span>Interactive Map - {config?.index?.toUpperCase() || 'RGB'}</span>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="video-display">
            <img src={data.url} alt="Time-lapse Animation" className="satellite-image" />
            <div className="image-metadata">
              <span>Time-Lapse GIF ({config?.index?.toUpperCase() || 'RGB'})</span>
              <button onClick={() => window.open(data.url, '_blank')} className="btn-secondary">Open GIF</button>
            </div>
          </div>
        );

      case 'download':
        return (
          <div className="download-display" style={{ textAlign: 'center', padding: '40px 0' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#007bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            <h3 style={{ marginTop: '20px' }}>Data is Ready for Download</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>Your requested GeoTIFF has been generated.</p>
            <a href={data.url} className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }} target="_blank" rel="noreferrer">
              Download GeoTIFF Data
            </a>
          </div>
        );

      default:
        return <div>Unknown response type</div>;
    }
  };

  return (
    <div className="result-container" style={{ height: '100%' }}>
      {renderContent()}
    </div>
  );
};

export default DataVisualizer;
