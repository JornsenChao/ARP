// src/pages/step4/AnalyzeLikelihoodTask.js
import React, { useState } from 'react';
import { useStep4Data } from '../../Step4Context';
import { Box, Typography, TextField, Button } from '@mui/material';

const AnalyzeLikelihoodTask = () => {
  const {
    impactData, // 之前 EvaluateImpact 存储的数据
    likelihoodData,
    setLikelihoodData,
  } = useStep4Data();

  // 用简单表单演示如何记录 "Likelihood" 和 "Justification"
  const [hazard, setHazard] = useState('');
  const [likelihood, setLikelihood] = useState('');
  const [justification, setJustification] = useState('');

  const handleAddLikelihood = () => {
    if (!hazard || !likelihood) return;
    const newLikely = {
      hazard,
      likelihood, // 1-5
      justification,
      id: Date.now(),
    };
    setLikelihoodData([...likelihoodData, newLikely]);
    setHazard('');
    setLikelihood('');
    setJustification('');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Likelihood & Risk Assessment
      </Typography>
      <Typography sx={{ mb: 2 }}>
        Analyse the Risk based on the impact and likelihood (1-5) of a specific hazard.
      </Typography>

      {impactData.length === 0 && (
        <Typography color="error">
            There is no impact data. Please complete the "Evaluate Impact" task first.
        </Typography>
      )}

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          label="Hazard"
          value={hazard}
          onChange={(e) => setHazard(e.target.value)}
        />
        <TextField
          label="Likelihood (1~5)"
          value={likelihood}
          onChange={(e) => setLikelihood(e.target.value)}
        />
        <TextField
          label="Justification"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
        />
        <Button variant="contained" onClick={handleAddLikelihood}>
          Add
        </Button>
      </Box>

      {likelihoodData.length > 0 && (
        <Box>
          <Typography variant="subtitle1">Hazard Likelihoods</Typography>
          {likelihoodData.map((l) => (
            <Box key={l.id} sx={{ border: '1px solid #ccc', p: 1, mb: 1 }}>
              <Typography>
                <strong>Hazard:</strong> {l.hazard}
              </Typography>
              <Typography>
                <strong>Likelihood:</strong> {l.likelihood}
              </Typography>
              <Typography>
                <strong>Justification:</strong> {l.justification}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AnalyzeLikelihoodTask;
