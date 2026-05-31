import { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import PublicView from './components/PublicView';

function AppInner() {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('session');
    return saved ? JSON.parse(saved) : null;
  });
  const navigate = useNavigate();

  const handleLogin = (data) => {
    const s = { email: data.perfil?.nombre || 'Admin', token: data.token, rol: data.rol, rol_nombre: data.rol_nombre, perfil: data.perfil };
    localStorage.setItem('session', JSON.stringify(s));
    setSession(s);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('session');
    setSession(null);
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/dashboard" element={
        session ? <Dashboard session={session} onLogout={handleLogout} /> : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<PublicView onOpenLogin={() => navigate('/login')} />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
