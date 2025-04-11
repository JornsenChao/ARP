// src/pages/essentialWorkflow/Step1IdentifyHazard.jsx
import React, { useContext, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Toolbar,
  TextField,
  List,
  ListItem,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { EssentialWorkflowContext } from '../../contexts/EssentialWorkflowContext';

function Step1IdentifyHazard() {
  const { workflowState, updateStep1Hazards } = useContext(
    EssentialWorkflowContext
  );
  const [location, setLocation] = useState('');
  const [femaHazards, setFemaHazards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 调用后端 -> 后端调 FEMA
  async function fetchFemaData() {
    setLoading(true);
    setError('');
    setFemaHazards([]);

    try {
      const url = `http://localhost:8000/workflow/hazards?location=${encodeURIComponent(
        location
      )}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const data = await res.json();
      if (data.hazards) {
        setFemaHazards(data.hazards);
      } else {
        setError('No hazards array returned from server');
      }
    } catch (err) {
      console.error('fetchFemaData error:', err);
      setError(err.message || 'Error fetching hazards');
    } finally {
      setLoading(false);
    }
  }

  // 切换选中
  function toggleHazard(hazard) {
    if (!workflowState) return;
    const currentSelected = workflowState.step1.hazards || [];
    if (currentSelected.includes(hazard)) {
      updateStep1Hazards(currentSelected.filter((h) => h !== hazard));
    } else {
      updateStep1Hazards([...currentSelected, hazard]);
    }
  }

  if (!workflowState) {
    return <Box sx={{ mt: 8, p: 2 }}>Loading Step1...</Box>;
  }

  const selectedHazards = workflowState.step1.hazards;

  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h5" gutterBottom>
        Step 1: Identify Hazard
      </Typography>
      <TextField
        label="Enter Location (e.g. WA or Seattle, WA)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        sx={{ mb: 2, mr: 2 }}
      />
      <Button variant="outlined" onClick={fetchFemaData}>
        Fetch FEMA Hazards
      </Button>

      {loading && <Typography sx={{ mt: 2 }}>Loading...</Typography>}
      {error && (
        <Typography sx={{ mt: 2, color: 'red' }}>Error: {error}</Typography>
      )}

      {femaHazards.length > 0 && (
        <List sx={{ mt: 2 }}>
          {femaHazards.map((hazard) => {
            const isSelected = selectedHazards.includes(hazard);
            return (
              <ListItem
                key={hazard}
                button
                onClick={() => toggleHazard(hazard)}
                sx={{
                  backgroundColor: isSelected ? '#e0f7fa' : 'transparent',
                  mb: 1,
                }}
              >
                {hazard} {isSelected && '(selected)'}
              </ListItem>
            );
          })}
        </List>
      )}

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={selectedHazards.length === 0}
          component={Link}
          to="/workflow/step2"
        >
          Next Step
        </Button>
      </Box>
    </Box>
  );
}

export default Step1IdentifyHazard;
