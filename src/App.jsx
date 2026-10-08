import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Toast from './components/Toast';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import AdminForgotPasswordPage from './pages/AdminForgotPasswordPage';
import { clearAllAppStorage, clearAuthState, clearLoginCredentials, loadAppData, loadAuthState, persistAppData, setAuthState } from './services/localStorage';
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
    clearLoginCredentials();
  }, []);

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
      if (String(result?.data?.user?.role || '').toLowerCase() !== 'admin') {
        clearAdminAuthToken();
        setToast({ message: 'This account does not have admin access.', variant: 'error' });
        return false;
      }

      // If backend returned user/profile data, merge it into app state
      if (result?.data?.user) {
        const userData = result.data.user;
        const adminName = userData.fullName || userData.name || userData.username || userData.email?.split('@')[0] || 'Admin';
        const authenticatedUser = {
          ...userData,
          fullName: adminName,
          name: adminName,
          profileImage: userData.profileImage || userData.profile?.profileImage || userData.profileData?.profileImage || '',
        };
        setAppData((prev) => ({
          ...prev,
          profile: { ...prev.profile, ...authenticatedUser },
          admin: { ...prev.admin, ...authenticatedUser },
        }));
      }

      setIsAuthenticated(true);
      setToast({ message: `Welcome back, ${result?.data?.user?.fullName || result?.data?.user?.name || result?.data?.user?.username || 'Admin'} 👋`, variant: 'success' });
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
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('rms_auth_session');
      window.localStorage.removeItem('rms_user_role');
      window.localStorage.removeItem('rms_admin_auth');
      window.localStorage.removeItem('rms_admin_token');
      window.localStorage.removeItem('rms_token');
      delete window.__RMS_AUTH_TOKEN;
      delete window.__rms_inmemory_token;
      window.history.replaceState(null, '', '/login');
      window.location.replace('/login');
    }
    setToast({ message: 'Logged out successfully.', variant: 'info' });
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/admin" replace /> : <AdminForgotPasswordPage />} />
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
