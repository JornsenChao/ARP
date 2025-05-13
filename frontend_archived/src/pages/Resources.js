// src/pages/Resources.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { API_BASE as DOMAIN } from '../apiBase';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [query, setQuery] = useState('');

  const fetchResources = (searchQuery = '') => {
    fetch(`${DOMAIN}/resources`)
      .then((response) => response.json())
      .then((data) => setResources(data))
      .catch((error) => console.error('Error fetching resources:', error));
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search query:', query);
    fetchResources(query);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Resources
      </Typography>

      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{ display: 'flex', gap: 1, mb: 2 }}
      >
        <TextField
          label="Search resources..."
          variant="outlined"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Search
        </Button>
      </Box>

      {resources.length === 0 ? (
        <Typography>Loading resources...</Typography>
      ) : (
        <Paper sx={{ p: 2 }}>
          <List>
            {resources.map((resource) => (
              <ListItem key={resource.id} alignItems="flex-start">
                <ListItemText
                  primary={resource.title}
                  secondary={resource.description}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Resources;
