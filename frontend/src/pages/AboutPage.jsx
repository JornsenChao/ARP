// src/pages/AboutPage.jsx
import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Link as MuiLink,
  Divider,
  Button,
} from '@mui/material';
import { Link } from 'react-router-dom';

function AboutPage() {
  return (
    <Box
      component="main"
      sx={{
        mt: 8,
        px: 3,
        py: 4,
        maxWidth: 1000,
        mx: 'auto',
      }}
    >
      <Typography variant="h3" gutterBottom>
        About this Research
      </Typography>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        This research is Yongqin's Master of Science thesis project at the
        University of Washington, and also An Applied Research Consortium (ARC)
        project in collaboration with ZGF Architects.
      </Typography>
      {/* ---------- Team ---------- */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Team
        </Typography>
        <Typography paragraph>
          <strong>Developer&nbsp;/ Researcher:</strong>
          <br />– <strong>Yongqin Zhao</strong>, Master of Sceience
          Architecture, Design Technology candidate 2025, University of
          Washington.
        </Typography>
        <Typography paragraph>
          <strong>ARC Advisors:</strong>
          <br />– <strong>Dr. Flavia Grey</strong>, Principal, Data Strategy
          at&nbsp;ZGF Architects
          <br />– <strong>Dr. Karen Chen</strong>, Assistant Professor of Urban
          Planing, Environmental Health, and Data Science at the University of
          Washington
        </Typography>
        <Typography paragraph>
          <strong>Thesis Advisors:</strong>
          <br />– <strong>Dr. Narjes Abbasabadi</strong>, Assistant Professor of
          Architecture, Design Technology at the University of Washington
          <br />– <strong>Heather Burpee</strong>, Research Professor at the
          University of Washington Integrated Design Lab
        </Typography>
      </Paper>

      {/* ---------- Research objective ---------- */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Research Objective
        </Typography>

        <Typography variant="subtitle1" gutterBottom>
          1. Architectural Resilience
        </Typography>
        <Typography paragraph>
          The project stems from the growing demand for resilient design that
          anticipates hazards and mitigates risks throughout a building’s
          lifecycle.
        </Typography>

        <Typography variant="subtitle1" gutterBottom>
          2. A web-based platform to streamline resilience research
        </Typography>
        <Typography component="div">
          <ul>
            <li>
              Provide a <strong>directory of precedents</strong> (context,
              hazards, resources, codes, strategies).
            </li>
            <li>
              <strong>Navigate scattered resources</strong> — data, tools,
              support — via one interface.
            </li>
            <li>
              Offer a <strong>high-level guide</strong> that unifies precedent
              library, resource navigation & existing tools into an interactive
              workflow.
            </li>
          </ul>
        </Typography>

        <Typography variant="subtitle1" gutterBottom>
          3. Full 7-Step Reference Workflow
        </Typography>
        <Typography paragraph>
          Synthesised from AIA-HKS Resilience Framework, NOAA Climate Resilience
          Toolkit and more.
          <em>See diagram below for step-by-step overview.</em>
        </Typography>
        <Box
          sx={{
            textAlign: 'center',
            border: '1px dashed #bbb',
            p: 2,
            mb: 2,
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
      </Paper>

      {/* ---------- From workflow to platform ---------- */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          From the Compreghensive Resilience Workflow → Web Platform
        </Typography>
        <Typography paragraph>
          Through 100+ surveys (thanks to ZGF, Mithun, DLR Group, Schemata
          Workshop, Glumac, 7 Directions) and internal interviews at ZGF, we
          clarified the day-to-day scenarios:
        </Typography>
        <Typography component="div">
          <ul>
            <li>
              Fast, early-phase exploration: identify & assess hazards + impact.
            </li>
            <li>
              Navigate resources and precedents directly within the design
              team’s toolset.
            </li>
            <li>Generate concise reports to support client communication.</li>
          </ul>
        </Typography>
      </Paper>

      {/* ---------- Why it matters ---------- */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Why does this matter?
        </Typography>
        <Typography component="div">
          <ul>
            <li>
              Public resources exist (AIA Hub, FEMA, HHS…) but are{' '}
              <em>scattered</em>.
            </li>
            <li>
              Googling works but is time-consuming, especially for less
              experienced designers.
            </li>
            <li>
              Firm knowledge often lives in static files — can it be more
              accessible & interactive?
            </li>
            <li>
              A <strong>guided, direct</strong> workflow saves time and lowers
              the barrier to resilient design.
            </li>
          </ul>
        </Typography>
      </Paper>

      {/* ---------- Back link ---------- */}
      <Stack direction="row" spacing={2}>
        <Button variant="contained" component={Link} to="/">
          Back to Home
        </Button>
        <Button variant="outlined" component={Link} to="/workflow">
          Try the Platform
        </Button>
      </Stack>

      <Divider sx={{ my: 4 }} />

      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} Yongqin Zhao. All rights reserved.
      </Typography>
    </Box>
  );
}

export default AboutPage;
