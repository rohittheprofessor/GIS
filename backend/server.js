const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post('/api/imagery', (req, res) => {
  const { longitude, latitude, scale, startDate, endDate, source, mode, index, projectId, useMock } = req.body;

  if (!longitude || !latitude || !scale || !startDate || !endDate || !source) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // Construct arguments for python script
  const args = [
    path.join(__dirname, 'get_earth_engine_image.py'),
    `--lon=${longitude}`,
    `--lat=${latitude}`,
    `--scale=${scale}`,
    `--start=${startDate}`,
    `--end=${endDate}`,
    `--source=${source}`
  ];

  if (projectId) {
    args.push(`--project=${projectId}`);
  }

  if (useMock) {
    args.push('--mock');
  }

  if (mode) {
    args.push(`--mode=${mode}`);
  }

  if (index) {
    args.push(`--index=${index}`);
  }

  console.log(`Executing python scripts with args: ${args.join(' ')}`);

  // Spawn Python script (override with PYTHON env var if needed)
  const pythonCmd = process.env.PYTHON || 'py';
  const pythonProcess = spawn(pythonCmd, args);

  let dataString = '';
  let errorString = '';

  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorString += data.toString();
  });

  pythonProcess.on('error', (err) => {
    console.error(`Failed to start Python process: ${err.message}`);
    return res.status(500).json({ error: 'Failed to start Python process', details: err.message });
  });

  pythonProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Python script exited with code ${code}. Error: ${errorString}`);
      return res.status(500).json({ error: 'Failed to process imagery', details: errorString || `Python exited with code ${code}` });
    }

    try {
      const parsed = JSON.parse(dataString.trim());
      if (parsed.error) {
        return res.status(500).json({ error: 'Earth Engine Error', details: parsed.error });
      }
      res.json(parsed);
    } catch (e) {
      console.error("Failed to parse script output:", dataString);
      res.status(500).json({ error: 'Failed to parse script output', details: dataString.substring(0,200) });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
