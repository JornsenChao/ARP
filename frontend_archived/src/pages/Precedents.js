// src/pages/Precedents.js
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

const Precedents = () => {
  const [precedents, setPrecedents] = useState([]);
  const [query, setQuery] = useState('');

  const fetchPrecedents = (searchQuery = '') => {
    fetch(`${DOMAIN}/precedents`)
      .then((response) => response.json())
      .then((data) => setPrecedents(data))
      .catch((error) => console.error('Error fetching precedents:', error));
  };

  useEffect(() => {
    fetchPrecedents();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Search query:', query);
    // 这里如果后端支持 query，可传递；当前示例直接 fetchPrecedents(query)
    fetchPrecedents(query);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Precedents
      </Typography>

      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{ display: 'flex', gap: 1, mb: 2 }}
      >
        <TextField
          label="Search precedents..."
          variant="outlined"
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" variant="contained">
          Search
        </Button>
      </Box>

      {precedents.length === 0 ? (
        <Typography>No precedents found.</Typography>
      ) : (
        <Paper sx={{ p: 2 }}>
          <List>
            {precedents.map((precedent) => (
              <ListItem key={precedent.id} alignItems="flex-start">
                <ListItemText
                  primary={precedent.title}
                  secondary={precedent.description}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Precedents;
