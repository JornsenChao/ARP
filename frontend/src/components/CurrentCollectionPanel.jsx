// src/components/CurrentCollectionPanel.jsx
import React from 'react';
import { Typography, List, ListItem, ListItemText } from '@mui/material';

function CurrentCollectionPanel({ collectionItems }) {
  return (
    <div style={{ marginTop: 16 }}>
      <Typography variant="h6">Current Collection</Typography>
      <List dense>
        {collectionItems.map((item, idx) => (
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

export default CurrentCollectionPanel;
