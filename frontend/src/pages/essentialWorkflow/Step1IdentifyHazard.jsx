// src/pages/Step1IdentifyHazard.jsx
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

  // 简化：模拟从FEMA拉取到的hazard列表
  async function fetchFemaData() {
    // 真实情况下 => 调后端再调FEMA API
    // 这里仅模拟
    const mockHazards = ['Flood', 'Earthquake', 'Wildfire'];
    setFemaHazards(mockHazards);
  }

  // 选中某项hazard
  function toggleHazard(hazard) {
    if (!workflowState) return;
    const currentSelected = workflowState.step1.hazards;
    if (currentSelected.includes(hazard)) {
      updateStep1Hazards(currentSelected.filter((h) => h !== hazard));
    } else {
      updateStep1Hazards([...currentSelected, hazard]);
    }
  }

  if (!workflowState) {
    return <Box sx={{ mt: 8, p: 2 }}>Loading Step1...</Box>;
  }

  return (
    <Box sx={{ mt: 8, p: 2 }}>
      <Toolbar />
      <Typography variant="h5" gutterBottom>
        Step 1: Identify Hazard
      </Typography>
      <TextField
        label="Enter Location (State, County)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        sx={{ mb: 2, mr: 2 }}
      />
      <Button variant="outlined" onClick={fetchFemaData}>
        Fetch FEMA Hazards
      </Button>

      {femaHazards.length > 0 && (
        <List>
          {femaHazards.map((hazard) => {
            const selected = workflowState.step1.hazards.includes(hazard);
            return (
              <ListItem
                key={hazard}
                button
                onClick={() => toggleHazard(hazard)}
                sx={{
                  backgroundColor: selected ? '#e0f7fa' : 'transparent',
                  mb: 1,
                }}
              >
                {hazard} {selected && '(selected)'}
              </ListItem>
            );
          })}
        </List>
      )}

      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          disabled={workflowState.step1.hazards.length === 0}
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
