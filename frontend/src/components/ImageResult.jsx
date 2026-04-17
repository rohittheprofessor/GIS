const ImageResult = ({ base64Data, isLoading, error }) => {
  return (
    <div className="card result-card">
      <h2 className="card-title">Analysis Result</h2>
      
      <div className="result-container">
        {isLoading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Communicating with Google Earth Engine...</p>
            <span className="subtitle">This may take a few seconds depending on cloud cover and area size.</span>
          </div>
        )}

        {error && (
          <div className="error-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#E31A1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <p className="error-text">Extraction Failed</p>
            <p className="error-details">{error}</p>
          </div>
        )}

        {!isLoading && !error && !base64Data && (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
            <p>Awaiting coordinates to fetch imagery.</p>
          </div>
        )}

        {!isLoading && !error && base64Data && (
          <div className="image-display">
            <img src={base64Data} alt="Satellite Imagery from Earth Engine" className="satellite-image" />
            <div className="image-metadata">
              <span>RGB True Color Composite</span>
              <button onClick={() => window.open(base64Data, '_blank')} className="btn-secondary">View Full Resolution</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageResult;
