import './App.css';

import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '@pages/login';
import Register from '@pages/register';
import { Toaster } from 'sonner';
import ChatDashboard from '@pages/dashboard';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<ChatDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
