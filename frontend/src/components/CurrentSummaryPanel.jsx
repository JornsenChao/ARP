// src/components/CurrentSummaryPanel.jsx
import React from 'react';
import { Typography, List, ListItem, ListItemText } from '@mui/material';

function CurrentSummaryPanel({ summaryItems }) {
  return (
    <div style={{ marginTop: 16 }}>
      <Typography variant="h6">Current Summary</Typography>
      <List dense>
        {summaryItems.map((item, idx) => (
          <ListItem key={idx}>
            <ListItemText
              primary={item.content.slice(0, 50) + '...'}
              secondary={JSON.stringify(item.metadata)}
            />
          </ListItem>
        ))}
      </List>
    </div>
  );
}

export default CurrentSummaryPanel;
