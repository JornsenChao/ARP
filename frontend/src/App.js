// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Resources from './pages/Resources';
import Precedents from './pages/Precedents';
import NotesOverview from './pages/NotesOverview';
import WorkflowHome from './pages/WorkflowHome';
import WorkflowStep from './pages/WorkflowStep';
import WorkflowTaskPage from './pages/WorkflowTaskPage';
import { Step4DataProvider } from './Step4Context';
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // 您可以根据需求自定义
    },
    secondary: {
      main: '#9c27b0',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Step4DataProvider>
        <Router>
          {/* 全局的顶部导航栏 */}
          <NavBar />

          {/* 路由切换区域 */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:taskId" element={<TaskDetails />} />
            <Route path="/workflow" element={<WorkflowHome />} />
            <Route path="/workflow/step/:stepId" element={<WorkflowStep />} />
            <Route
              path="/workflow/step/:stepId/task/:taskId"
              element={<WorkflowTaskPage />}
            />
            <Route path="/notes" element={<NotesOverview />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/precedents" element={<Precedents />} />
          </Routes>
        </Router>
      </Step4DataProvider>
    </ThemeProvider>
  );
}

export default App;
