// src/pages/step4/ExposureToHazardsTask.js
import React, { useState } from 'react';
import { useStep4Data } from '../../Step4Context';
import { Box, Typography, TextField, Button } from '@mui/material';

const ExposureToHazardsTask = () => {
  // Context中的数据与更新函数
  const { exposureData, setExposureData } = useStep4Data();

  // 本地表单状态
  const [hazardType, setHazardType] = useState('');
  const [exposureYesNo, setExposureYesNo] = useState('No');
  const [rationale, setRationale] = useState('');

  const handleAddExposure = () => {
    if (!hazardType.trim()) return;
    // 生成一条新的暴露记录
    const newItem = {
      hazardType,
      exposure: exposureYesNo,
      rationale,
      id: Date.now(), // 简易ID
    };
    setExposureData([...exposureData, newItem]);
    // 重置表单
    setHazardType('');
    setExposureYesNo('No');
    setRationale('');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Exposure to Hazards
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Determine whether the building is exposed to specific hazards (Yes/No)
        and provide rationale.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="Hazard Type"
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
        />
        <TextField
          label="Exposure (Yes/No)"
          value={exposureYesNo}
          onChange={(e) => setExposureYesNo(e.target.value)}
        />
        <TextField
          label="Rationale"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
        />
        <Button variant="contained" onClick={handleAddExposure}>
          Add
        </Button>
      </Box>

      {exposureData.length > 0 && (
        <Box>
          <Typography variant="subtitle1">Current Hazards Exposure</Typography>
          {exposureData.map((item) => (
            <Box key={item.id} sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
              <Typography>
                <strong>Hazard:</strong> {item.hazardType}
              </Typography>
              <Typography>
                <strong>Exposure:</strong> {item.exposure}
              </Typography>
              <Typography>
                <strong>Rationale:</strong> {item.rationale}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ExposureToHazardsTask;
