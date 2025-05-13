// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Stack,
  Divider,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';

function HomePage() {
  return (
    <Box
      component="main"
      sx={{
        mt: 8, // 兼容你固定的 NavBar
        px: 3,
        py: 4,
        maxWidth: 1200,
        mx: 'auto',
      }}
    >
      {/* ---------- Hero ---------- */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h3" gutterBottom>
          Resilience&nbsp;Research&nbsp;Platform
        </Typography>

        <Typography variant="h6" color="text.secondary" gutterBottom>
          A guided, web-based toolkit that brings scattered resilience resources
          & firm knowledge directly into the design workflow.
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button
            variant="contained"
            component={Link}
            to="/workflow"
            size="large"
          >
            Launch Essential Workflow
          </Button>
          <Button variant="outlined" component={Link} to="/about" size="large">
            Learn&nbsp;More
          </Button>
        </Stack>
      </Paper>
      {/* ---------- What this platform IS / IS NOT ---------- */}
      <Typography variant="h5" gutterBottom>
        What this platform <strong>is</strong> — and{' '}
        <strong>is&nbsp;not</strong>
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ✅ It <em>is</em>…
              </Typography>
              <ul>
                <li>
                  A guided search interface for precedents, strategies, hazards
                  & reference resources.
                </li>
                <li>
                  A toolkit for teams to <strong>validate & upload</strong>{' '}
                  their own data (internal case studies, firm standards, etc.).
                </li>
                <li>
                  Built for <strong>very-early-phase</strong> design when quick
                  hazard + strategy scoping is critical for client dialogue.
                </li>
                <li>
                  Demonstrated with public sources (FEMA, AIA, CHD, …) & sample
                  firm data.
                </li>
              </ul>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🚫 It is <em>not</em>…
              </Typography>
              <ul>
                <li>An expert-level, all-knowing resilience knowledge base.</li>
                <li>A replacement for in-depth hazard modelling.</li>
                <li>
                  Automatically “correct” — users remain responsible for
                  verifying & curating their content.
                </li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Why does this matter?
              </Typography>
              <ul>
                <li>
                  Public resources exist (AIA Hub, FEMA, HHS…) but are{' '}
                  <em>scattered</em>.
                </li>
                <li>
                  Google everything would work but is time-consuming, especially
                  for less experienced designers.
                </li>
                <li>
                  Firm knowledge often lives in static files — can it be more
                  accessible & interactive?
                </li>
                <li>
                  A <strong>guided, direct</strong> workflow saves time and
                  lowers the barrier to resilient design.
                </li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Who is it for?
              </Typography>
              <Typography paragraph>
                Any architecture design team — regardless of experience — that
                needs to{' '}
                <strong>
                  <em>quickly</em>
                </strong>{' '}
                understand:
              </Typography>
              <ul>
                <li>Which hazards affect my site?</li>
                <li>Which precedents have addressed these hazards?</li>
                <li>
                  What strategies / codes / resources can I reference to start
                  the conversation with my client?
                </li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Divider sx={{ my: 4 }} />
      {/* ---------- Workflow relationship ---------- */}
      <Typography variant="h5" gutterBottom>
        7-Step <strong>Reference Workflow</strong> vs 4-Step{' '}
        <strong>Essential Workflow</strong>
      </Typography>
      <Typography paragraph>
        The full 7-step <em>Reference Workflow</em> (adapted from AIA–HKS, NOAA
        Toolkit, etc.) spans an entire project timeline. The
        <strong> Essential Workflow (4 steps)</strong> distills the most
        time-critical research tasks into the earliest phase and is the part now
        implemented in this platform.
      </Typography>{' '}
      <Box
        sx={{
          textAlign: 'center',
          my: 2,
          border: '1px dashed #bbb',
          p: 2,
        }}
      >
        <em>
          {' '}
          <img
            src="/assets/comprehensive_workflow.png"
            alt="Workflow Diagram"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </em>
      </Box>
      {/* ---------- Call-to-action ---------- */}
      <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
        <Button variant="contained" component={Link} to="/workflow">
          Start Now
        </Button>
        <Button variant="outlined" component={Link} to="/about">
          About the Research
        </Button>
      </Stack>
    </Box>
  );
}

export default HomePage;
