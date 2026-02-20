import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bases from './pages/Bases';
import BaseDetail from './pages/BaseDetail';
import Missions from './pages/Missions';
import MissionDetail from './pages/MissionDetail';
import Users from './pages/Users';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/bases" element={<Bases />} />
      <Route path="/bases/:id" element={<BaseDetail />} />
      <Route path="/missions" element={<Missions />} />
      <Route path="/missions/:id" element={<MissionDetail />} />
      <Route path="/users" element={<Users />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
