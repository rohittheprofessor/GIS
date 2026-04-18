import { useState } from 'react';

const EarthEngineForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    longitude: '-122.0838',
    latitude: '37.4220',
    scale: '10',
    projectId: '',
    useMock: false,
    mode: 'thumbnail',
    splitScreen: false,
    
    // Left pane config
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    source: 'sentinel2',
    index: 'truecolor',

    // Right pane config (for split screen)
    rightStartDate: '2024-01-01',
    rightEndDate: '2024-12-31',
    rightSource: 'sentinel2',
    rightIndex: 'truecolor',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const baseConfig = {
      longitude: parseFloat(formData.longitude),
      latitude: parseFloat(formData.latitude),
      scale: parseFloat(formData.scale),
      projectId: formData.projectId,
      useMock: formData.useMock,
      mode: formData.mode,
    };

    const configLeft = {
      ...baseConfig,
      startDate: formData.startDate,
      endDate: formData.endDate,
      source: formData.source,
      index: formData.index,
    };

    const configRight = formData.splitScreen ? {
      ...baseConfig,
      startDate: formData.rightStartDate,
      endDate: formData.rightEndDate,
      source: formData.rightSource,
      index: formData.rightIndex,
    } : null;

    onSubmit(configLeft, configRight);
  };

  return (
    <div className="card form-card" style={{ width: '100%' }}>
      <h2 className="card-title">Extraction Parameters</h2>
      <form onSubmit={handleSubmit}>
        {/* Global Configuration */}
        <div className="form-section-header">Global Settings</div>
        
        <div className="input-row">
          <div className="input-group">
            <label>Longitude Coordinates</label>
            <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Latitude Coordinates</label>
            <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Scale (Resolution in meters)</label>
            <input type="number" name="scale" value={formData.scale} onChange={handleChange} required />
          </div>
        </div>

        <div className="input-row">
          <div className="input-group">
            <label>Display Mode</label>
            <select name="mode" value={formData.mode} onChange={handleChange}>
              <option value="thumbnail">Static Image (Thumbnail)</option>
              <option value="map">Interactive Map (Leaflet)</option>
              <option value="video">Time-Lapse Animation (Local GIF)</option>
              <option value="download">Raw Data Download (GeoTIFF)</option>
            </select>
          </div>
          <div className="input-group" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
            <div className="input-checkbox" style={{ marginTop: '30px' }}>
              <input type="checkbox" id="splitScreen" name="splitScreen" checked={formData.splitScreen} onChange={handleChange} />
              <label htmlFor="splitScreen" style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Enable Split-Screen Comparison</label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Main / Left Pane Configuration */}
          <div style={{ flex: 1 }}>
            <div className="form-section-header">{formData.splitScreen ? 'Left View' : 'Temporal & Visual Settings'}</div>
            
            <div className="input-row">
              <div className="input-group">
                <label>Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label>Satellite Source</label>
              <select name="source" value={formData.source} onChange={handleChange}>
                <option value="sentinel2">Sentinel-2 (10m Res)</option>
                <option value="landsat8">Landsat-8 (30m Res)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Analysis Index</label>
              <select name="index" value={formData.index} onChange={handleChange}>
                <option value="truecolor">True Color (RGB)</option>
                <option value="falsecolor">False Color (Infrared / Urban)</option>
                <option value="ndvi">NDVI (Vegetation Index)</option>
                <option value="ndwi">NDWI (Water Index)</option>
              </select>
            </div>
          </div>

          {/* Right Pane Configuration (Only if splitScreen is true) */}
          {formData.splitScreen && (
            <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
              <div className="form-section-header">Right View</div>
              
              <div className="input-row">
                <div className="input-group">
                  <label>Start Date</label>
                  <input type="date" name="rightStartDate" value={formData.rightStartDate} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>End Date</label>
                  <input type="date" name="rightEndDate" value={formData.rightEndDate} onChange={handleChange} required />
                </div>
              </div>

              <div className="input-group">
                <label>Satellite Source</label>
                <select name="rightSource" value={formData.rightSource} onChange={handleChange}>
                  <option value="sentinel2">Sentinel-2 (10m Res)</option>
                  <option value="landsat8">Landsat-8 (30m Res)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Analysis Index</label>
                <select name="rightIndex" value={formData.rightIndex} onChange={handleChange}>
                  <option value="truecolor">True Color (RGB)</option>
                  <option value="falsecolor">False Color (Infrared / Urban)</option>
                  <option value="ndvi">NDVI (Vegetation Index)</option>
                  <option value="ndwi">NDWI (Water Index)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="form-section-header">System Settings</div>
        <div className="input-row">
          <div className="input-group" style={{ display: 'flex', alignItems: 'flex-start', paddingBottom: '10px' }}>
            <div className="input-checkbox">
              <input type="checkbox" id="useMock" name="useMock" checked={formData.useMock} onChange={handleChange} />
              <label htmlFor="useMock">Use Mock Fallback</label>
            </div>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Extracting via Earth Engine...' : 'Fetch Satellite Data'}
        </button>
      </form>
    </div>
  );
};

export default EarthEngineForm;
