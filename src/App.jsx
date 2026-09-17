import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Toast from './components/Toast';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import { clearAllAppStorage, clearAuthState, loadAppData, loadAuthState, persistAppData, saveLoginCredentials, setAuthState } from './services/localStorage';
import { clearAdminAuthToken, login as loginAdmin } from './services/adminAuth';
import { apiService } from './services/api';

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

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const loadDashboardData = async () => {
      try {
        const response = await apiService.request('/admin/dashboard');
        if (!response?.success || !response?.data) return;

        const dashboardUsers = response.data.users || [];
        const dashboardTenants = Array.isArray(response.data.tenants) && response.data.tenants.length
          ? response.data.tenants
          : dashboardUsers.map((user, index) => ({
              id: user._id || user.id || `tenant-${index + 1}`,
              _id: user._id || user.id || `tenant-${index + 1}`,
              fullName: user.fullName || user.name || 'Unknown Tenant',
              name: user.name || user.fullName || 'Unknown Tenant',
              email: user.email || '',
              phone: user.phone || '',
              status: user.status || 'Active',
              propertyName: user.propertyName || '',
              propertyId: user.propertyId || '',
              createdAt: user.createdAt || new Date().toISOString(),
            }));

        setAppData((prev) => ({
          ...prev,
          ...response.data,
          properties: response.data.properties || prev.properties || [],
          users: dashboardUsers,
          tenants: dashboardTenants,
          bookings: response.data.bookings || prev.bookings || [],
          payments: response.data.payments || prev.payments || [],
          rentRecords: response.data.rentRecords || prev.rentRecords || [],
          dues: response.data.dues || prev.dues || [],
          maintenanceItems: response.data.maintenanceItems || prev.maintenanceItems || [],
          notifications: response.data.notifications || prev.notifications || [],
          activityLogs: response.data.activity || prev.activityLogs || [],
          dashboardSummary: response.data.summary || prev.dashboardSummary || {},
        }));
      } catch (error) {
        console.warn('Unable to sync admin dashboard from backend:', error);
      }
    };

    loadDashboardData();
    return undefined;
  }, [isAuthenticated]);

  const handleLogin = async (email, password) => {
    try {
      const result = await loginAdmin(email, password);
      if (!result?.success) {
        setToast({ message: result?.message || 'Admin login failed.', variant: 'error' });
        return false;
      }

      // If backend returned user/profile data, merge it into app state
      if (result?.data?.user) {
        const userData = result.data.user;
        setAppData((prev) => ({
          ...prev,
          profile: { ...prev.profile, ...userData },
          admin: { ...prev.admin, ...userData },
        }));
      }

      const loginNotification = {
        id: `notif-${Date.now()}`,
        title: 'Admin logged in',
        message: `${email} signed in to the admin portal.`,
        detail: `Login by ${email}. Role: Administrator.`,
        type: 'Login',
        recipient: email,
        date: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        priority: 'Normal',
      };

      saveLoginCredentials(email, password);

      setAppData((prev) => ({
        ...prev,
        notifications: [loginNotification, ...(prev.notifications || [])],
      }));

      setIsAuthenticated(true);
      setToast({ message: 'Welcome back, Admin 👋', variant: 'success' });
      return true;
    } catch (error) {
      setToast({ message: error.message || 'Admin login failed.', variant: 'error' });
      return false;
    }
  };

  const handleLogout = () => {
    clearAllAppStorage();
    clearAuthState();
    clearAdminAuthToken();
    setIsAuthenticated(false);
    setToast({ message: 'Logged out successfully.', variant: 'info' });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage onLogin={handleLogin} />} />
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
