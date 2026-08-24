import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Toast from './components/Toast';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import { clearAuthState, loadAppData, loadAuthState, persistAppData, setAuthState } from './services/localStorage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(loadAuthState);
  const [appData, setAppData] = useState(loadAppData);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    persistAppData(appData);
  }, [appData]);

  useEffect(() => {
    setAuthState(isAuthenticated);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleLogin = (email, password) => {
    if (email && password && email.includes('@') && password.length >= 4) {
      setIsAuthenticated(true);
      setToast({ message: 'Welcome back, Admin 👋', variant: 'success' });
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    clearAuthState();
    setIsAuthenticated(false);
    setToast({ message: 'Logged out successfully.', variant: 'info' });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? '/admin' : '/login'} replace />} />
        <Route
          path="/admin/*"
          element={
            isAuthenticated ? (
              <AdminLayout
                appData={appData}
                setAppData={setAppData}
                onLogout={handleLogout}
                notify={setToast}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/admin' : '/login'} replace />} />
      </Routes>
      <Toast toast={toast} />
    </BrowserRouter>
  );
}

export default App;
