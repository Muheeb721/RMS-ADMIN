import './NotificationsPage.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

const normalizeNotification = (item, index) => ({
  ...item,
  id: item._id || item.id || `notif-${index + 1}`,
  _id: item._id || item.id || `notif-${index + 1}`,
  title: item.title || item.actionType || 'Notification',
  message: item.message || item.detail || '',
  detail: item.message || item.detail || '',
  read: item.isRead ?? item.read ?? false,
  time: item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
});

function NotificationsPage({ appData, setAppData, notify }) {
  const notifications = appData.notifications || [];
  const navigate = useNavigate();

  const summary = {
    total: notifications.length,
    unread: notifications.filter((item) => !(item.read ?? item.isRead ?? false)).length,
    responded: notifications.filter((item) => item.propertyType || item.entityType).length,
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await apiService.request('/notifications/admin/all');
        if (response?.success) {
          const nextItems = (response.data || []).map(normalizeNotification);
          setAppData((prev) => ({
            ...prev,
            notifications: nextItems,
          }));
        }
      } catch (error) {
        console.warn('Unable to load notifications from backend:', error?.message || error);
      }
    };

    loadNotifications();
  }, [setAppData]);

  const markAllRead = async () => {
    try {
      await apiService.request('/notifications/mark-all-read', { method: 'POST' });
      setAppData((prev) => ({
        ...prev,
        notifications: (prev.notifications || []).map((item) => ({ ...item, read: true, isRead: true })),
      }));
      notify({ message: 'All notifications marked as read.', variant: 'success' });
    } catch (error) {
      console.error('Mark all notifications failed:', error);
      notify({ message: error.message || 'Unable to mark notifications as read.', variant: 'error' });
    }
  };

  const toggleRead = async (notificationId) => {
    try {
      await apiService.request(`/notifications/${notificationId}/read`, { method: 'POST' });
      setAppData((prev) => ({
        ...prev,
        notifications: (prev.notifications || []).map((item) =>
          (item.id === notificationId || item._id === notificationId) ? { ...item, read: true, isRead: true } : item,
        ),
      }));
    } catch (error) {
      console.error('Toggle notification read failed:', error);
      notify({ message: error.message || 'Unable to update notification status.', variant: 'error' });
    }
  };

  const handleRespond = (notification) => {
    const entityType = String(notification.entityType || notification.propertyType || '').toLowerCase();
    if (entityType === 'property' || entityType === 'properties') {
      navigate('/admin/properties');
      return;
    }
    if (entityType === 'booking' || entityType === 'bookings') {
      navigate('/admin/bookings');
      return;
    }
    if (entityType === 'payment' || entityType === 'payments') {
      navigate('/admin/payments');
      return;
    }
    if (entityType === 'user' || entityType === 'users') {
      navigate('/admin/users');
      return;
    }
    navigate('/admin/notifications');
  };

  return (
    <div className="page-section notifications-page">
      <div className="summary-card">
        <div className="summary-item highlight">
          <span>Total</span>
          <strong>{summary.total}</strong>
        </div>
        <div className="summary-item">
          <span>Unread</span>
          <strong>{summary.unread}</strong>
        </div>
        <div className="summary-item">
          <span>Actionable</span>
          <strong>{summary.responded}</strong>
        </div>
      </div>

      <section className="panel-card">
        <div className="card-header">
          <h3>All Notifications</h3>
          <button type="button" className="mini-button" onClick={markAllRead}>Mark All Read</button>
        </div>
        <div className="list-stack large">
          {notifications.map((notification) => (
            <div key={notification.id} className={`list-row ${notification.read ? 'read' : 'unread'}`}>
              <div>
                <strong>{notification.title}</strong>
                <small>{notification.detail || notification.message}</small>
              </div>
              <div className="notification-actions">
                <span className="time-tag">{notification.time || 'Just now'}</span>
                <button type="button" className="table-button light" onClick={() => handleRespond(notification)}>
                  Respond
                </button>
                <button type="button" className="table-button light" onClick={() => toggleRead(notification.id)}>
                  {notification.read ? 'Unread' : 'Read'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default NotificationsPage;
