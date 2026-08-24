import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import './AdminLayout.css';
import DashboardPage from '../pages/DashboardPage';
import PropertiesPage from '../pages/PropertiesPage';
import HousesPage from '../pages/HousesPage';
import ApartmentsPage from '../pages/ApartmentsPage';
import FlatsPage from '../pages/FlatsPage';
import UsersPage from '../pages/UsersPage';
import BookingsPage from '../pages/BookingsPage';
import PaymentsPage from '../pages/PaymentsPage';
import DuesPage from '../pages/DuesPage';
import NotificationsPage from '../pages/NotificationsPage';
import ReportsPage from '../pages/ReportsPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';

const navItems = [
  { label: 'Dashboard', path: '/', icon: '⌂' },
  { label: 'Houses', path: '/houses', icon: '▣' },
  { label: 'Apartments', path: '/apartments', icon: '▤' },
  { label: 'Flats', path: '/flats', icon: '▥' },
  { label: 'Properties', path: '/properties', icon: '◍' },
  { label: 'Users', path: '/users', icon: '👥' },
  { label: 'Bookings', path: '/bookings', icon: '🗓' },
  { label: 'Payments', path: '/payments', icon: '💳' },
  { label: 'Dues', path: '/dues', icon: '📄' },
  { label: 'Notifications', path: '/notifications', icon: '🔔' },
  { label: 'Reports', path: '/reports', icon: '📊' },
  { label: 'Settings', path: '/settings', icon: '⚙' },
  { label: 'Admin Profile', path: '/profile', icon: '👤' },
];

function AdminLayout({ appData, setAppData, onLogout, notify }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const unreadCount = useMemo(
    () => appData.notifications.filter((item) => !item.read).length,
    [appData.notifications],
  );

  const adminName = appData.profile?.fullName || appData.admin?.fullName || appData.admin?.name || 'Admin';

  const titleMap = {
    '/': 'Dashboard',
    '/houses': 'Houses',
    '/apartments': 'Apartments',
    '/flats': 'Flats',
    '/properties': 'Properties',
    '/users': 'Users',
    '/bookings': 'Bookings',
    '/payments': 'Payments',
    '/dues': 'Dues',
    '/notifications': 'Notifications',
    '/reports': 'Reports',
    '/settings': 'Settings',
    '/profile': 'Admin Profile',
  };

  const currentTitle = titleMap[location.pathname] || 'Dashboard';

  const handleBookingDecision = (bookingId, bookingStatus) => {
    const nextBookings = appData.bookings.map((booking) =>
      booking.id === bookingId ? { ...booking, bookingStatus, paymentStatus: bookingStatus === 'Approved' ? 'Paid' : booking.paymentStatus } : booking,
    );

    const nextNotifications = [
      {
        id: `notif-${Date.now()}`,
        title: `Booking ${bookingStatus}`,
        message: `Booking ${bookingId} was marked as ${bookingStatus.toLowerCase()}.`,
        type: 'Booking',
        recipient: 'Admin',
        date: new Date().toISOString(),
        read: false,
        priority: 'High',
      },
      ...appData.notifications,
    ];

    setAppData((prev) => ({
      ...prev,
      bookings: nextBookings,
      notifications: nextNotifications,
      activityLogs: [
        {
          id: `log-${Date.now()}`,
          action: 'Booking updated',
          details: `Booking ${bookingId} status changed to ${bookingStatus}.`,
          timestamp: new Date().toISOString(),
        },
        ...prev.activityLogs,
      ],
    }));

    notify({ message: `Booking ${bookingStatus.toLowerCase()} successfully.`, variant: 'success' });
  };

  return (
    <div className={`dashboard-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <button type="button" className="menu-toggle" onClick={() => setSidebarOpen((prev) => !prev)} aria-label="Open sidebar">
        ☰
      </button>
      <div className={`sidebar-backdrop ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="app-brand">RMS</div>
          {!collapsed && (
            <div className="brand-copy">
              <strong>RMS Admin</strong>
              <small>Operations Suite</small>
            </div>
          )}
          <button
            type="button"
            className="collapse-toggle"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label="Collapse sidebar"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Sidebar navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={`/admin${item.path}`}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="outline-button" onClick={() => navigate('/admin/profile')}>
            {!collapsed ? 'View Profile' : '👤'}
          </button>
          <button type="button" className="primary-button" onClick={onLogout}>
            {!collapsed ? 'Logout' : '⇠'}
          </button>
        </div>
      </aside>

      <main className="content-area">
        <header className="topbar">
          <div className="topbar-heading">
            <p className="eyebrow">Operations</p>
            <h2>{currentTitle}</h2>
          </div>

          <div className="topbar-actions">
            <button type="button" className="header-icon-button notification-button" aria-label="Notifications" onClick={() => navigate('/admin/notifications')}>
              🔔
              {unreadCount > 0 && <span className="header-badge">{unreadCount}</span>}
            </button>
            <button type="button" className="profile-pill" onClick={() => navigate('/admin/profile')}>
              <span className="avatar-wrap">{adminName.slice(0, 2).toUpperCase()}</span>
              {!collapsed && (
                <span className="profile-meta">
                  <strong>{adminName}</strong>
                  <small>Admin</small>
                </span>
              )}
            </button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardPage appData={appData} />} />
          <Route path="/houses" element={<HousesPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/apartments" element={<ApartmentsPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/flats" element={<FlatsPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/properties" element={<PropertiesPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/users" element={<UsersPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/bookings" element={<BookingsPage appData={appData} setAppData={setAppData} notify={notify} onBookingDecision={handleBookingDecision} />} />
          <Route path="/payments" element={<PaymentsPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/dues" element={<DuesPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/notifications" element={<NotificationsPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/reports" element={<ReportsPage appData={appData} />} />
          <Route path="/profile" element={<ProfilePage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="/settings" element={<SettingsPage appData={appData} setAppData={setAppData} notify={notify} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default AdminLayout;
