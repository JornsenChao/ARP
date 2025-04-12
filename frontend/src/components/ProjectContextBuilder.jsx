// src/components/ProjectContextBuilder.jsx
import React from 'react';
import { TextField } from '@mui/material';

function ProjectContextBuilder({ value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <TextField
        label="Project Context"
        multiline
        rows={5}
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default ProjectContextBuilder;
