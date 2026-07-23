import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import ClinicalCases from './pages/Cases';
import AutopsyCases from './pages/AutopsyCases';
import LabManagement from './pages/LabManagement';
import SettingsPage from './pages/SettingsPage';
import Staff from './pages/Staff';
import ReportsDashboard from './pages/ReportsDashboard';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="clinical" element={<ClinicalCases />} />
        <Route path="autopsy" element={<AutopsyCases />} />
        <Route path="lab" element={<LabManagement />} />
        <Route path="staff" element={<Staff />} />
        <Route path="report-dashboard" element={<ReportsDashboard />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
