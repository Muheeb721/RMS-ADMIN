import './NotificationsPage.css';
import { useNavigate } from 'react-router-dom';

function NotificationsPage({ appData, setAppData, notify }) {
  const notifications = appData.notifications || [];
  const navigate = useNavigate();

  const markAllRead = () => {
    setAppData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((item) => ({ ...item, read: true })),
    }));
    notify({ message: 'All notifications marked as read.', variant: 'success' });
  };

  const toggleRead = (notificationId) => {
    setAppData((prev) => ({
      ...prev,
      notifications: (prev.notifications || []).map((item) =>
        item.id === notificationId ? { ...item, read: !item.read } : item,
      ),
    }));
  };

  const handleRespond = (notification) => {
    if (notification.propertyType && notification.propertyType.toString()) {
      const type = String(notification.propertyType).toLowerCase();
      navigate(`/admin/${type}s`);
      return;
    }
    navigate('/admin/properties');
  };

  return (
    <div className="page-section notifications-page">
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
