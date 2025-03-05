// src/pages/step4/EvaluateImpactTask.js
import React, { useState } from 'react';
import { useStep4Data } from '../../Step4Context';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
} from '@mui/material';

const EvaluateImpactTask = () => {
  const { exposureData, impactData, setImpactData } = useStep4Data();

  // 本地状态
  const [selectedHazard, setSelectedHazard] = useState('');
  const [systemName, setSystemName] = useState('');
  const [consequenceRating, setConsequenceRating] = useState('');

  const handleAddImpact = () => {
    if (!selectedHazard || !systemName || !consequenceRating) return;
    const newImpact = {
      hazard: selectedHazard,
      system: systemName,
      consequence: consequenceRating,
      id: Date.now(),
    };
    setImpactData([...impactData, newImpact]);
    // 重置
    setSystemName('');
    setConsequenceRating('');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        High-Level Impact Assessment
      </Typography>
      <Typography sx={{ mb: 2 }}>
        For each exposed （Exposure=Yes） hazard, determine the consequence
        rating for each system.（Consequence Rating）。
      </Typography>

      {exposureData.length === 0 && (
        <Typography color="error">
          There is no hazards exposure data. Please complete the "“Exposure to
          Hazards" task first.
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: 1 }}>
        {/* 下拉框 - 只列出暴露=Yes的灾害 */}
        <Select
          value={selectedHazard}
          onChange={(e) => setSelectedHazard(e.target.value)}
          displayEmpty
          size="small"
          sx={{ width: 180 }}
        >
          <MenuItem value="">(Select Hazard)</MenuItem>
          {exposureData
            .filter((ex) => ex.exposure.toLowerCase() === 'yes')
            .map((ex) => (
              <MenuItem key={ex.id} value={ex.hazardType}>
                {ex.hazardType}
              </MenuItem>
            ))}
        </Select>

        <TextField
          label="System Name"
          size="small"
          value={systemName}
          onChange={(e) => setSystemName(e.target.value)}
        />
        <TextField
          label="Consequence Rating"
          size="small"
          value={consequenceRating}
          onChange={(e) => setConsequenceRating(e.target.value)}
        />
        <Button variant="contained" onClick={handleAddImpact}>
          Add Impact
        </Button>
      </Box>

      {impactData.length > 0 && (
        <Box>
          <Typography variant="subtitle1">Current Impact Records</Typography>
          {impactData.map((imp) => (
            <Box key={imp.id} sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
              <Typography>
                <strong>Hazard:</strong> {imp.hazard}
              </Typography>
              <Typography>
                <strong>System:</strong> {imp.system}
              </Typography>
              <Typography>
                <strong>Consequence:</strong> {imp.consequence}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default EvaluateImpactTask;
