import React from 'react';
import { Box, Typography, Paper, Stack, Alert, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function MaintenanceLog() {
  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto', mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Maintenance & Data Storage Information
      </Typography>

      <Stack spacing={3}>
        {/* Data Storage Notice */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Data Storage Policy
          </Typography>
          <Typography paragraph>
            Please note that this is a research prototype running on development
            infrastructure. The backend server may restart periodically for
            maintenance or updates, which will result in temporary data loss. We
            recommend:
          </Typography>
          <ul>
            <li>
              <Typography>
                Download or save important analysis results and documents
              </Typography>
            </li>
            <li>
              <Typography>
                Use the "Delete Session" feature in the File Management page to
                clean up your data after completing your work
              </Typography>
            </li>
          </ul>
          <Alert severity="info" sx={{ mt: 2 }}>
            Next scheduled maintenance: Every Sunday 00:00-01:00 PDT
          </Alert>
        </Paper>

        {/* Demo Data Sources */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Demo Data Sources & Limitations
          </Typography>
          <Typography paragraph>
            The demo data provided in this prototype comes from the following
            sources:
          </Typography>
          <ul>
            <li>
              <Typography>
                <strong>Case Studies:</strong> Selected from publicly available
                FEMA and AIA case studies, processed and simplified for
                demonstration purposes
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>Building Codes & Standards:</strong> Based on publicly
                available building code summaries and guidelines
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>Strategy Documents:</strong> Derived from public
                resilience strategy documents and adapted for demonstration
              </Typography>
            </li>
          </ul>
          <Typography paragraph sx={{ mt: 2 }}>
            <strong>Limitations:</strong>
          </Typography>
          <ul>
            <li>
              <Typography>
                Demo data is abbreviated and simplified for prototype testing
              </Typography>
            </li>
            <li>
              <Typography>
                Some information may be outdated or incomplete
              </Typography>
            </li>
            <li>
              <Typography>
                For actual project use, please refer to official, up-to-date
                sources and consult with relevant experts
              </Typography>
            </li>
          </ul>
        </Paper>

        {/* Maintenance Log */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="primary">
            Maintenance Log
          </Typography>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Recent Updates:
          </Typography>
          <ul>
            <li>
              <Typography>
                <strong>May 16, 2025:</strong> Added session management and data
                cleanup features
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>May 15, 2025:</strong> Enhanced demo data processing and
                vector store optimization
              </Typography>
            </li>
            <li>
              <Typography>
                <strong>May 14, 2025:</strong> Improved file management system
              </Typography>
            </li>
          </ul>
        </Paper>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Link component={RouterLink} to="/" color="primary">
            Back to Home
          </Link>
        </Box>
      </Stack>
    </Box>
  );
}
