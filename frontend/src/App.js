// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Resources from './pages/Resources';
import Precedents from './pages/Precedents';
import NotesOverview from './pages/NotesOverview';
// import Workflow from './pages/Workflow';
import WorkflowHome from './pages/WorkflowHome';
import WorkflowStep from './pages/WorkflowStep';
import WorkflowTaskPage from './pages/WorkflowTaskPage';
import './App.css';

function App() {
  return (
    <Router>
      <NavBar />
      <div className="container"></div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        {/* <Route path="/workflow" element={<Workflow />} /> */}
        <Route path="/workflow" element={<WorkflowHome />} />
        <Route path="/workflow/step/:stepId" element={<WorkflowStep />} />
        <Route
          path="/workflow/step/:stepId/task/:taskId"
          element={<WorkflowTaskPage />}
        />
        <Route path="/tasks/:taskId" element={<TaskDetails />} />
        <Route path="/notes" element={<NotesOverview />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/precedents" element={<Precedents />} />
      </Routes>
    </Router>
  );
}

export default App;
