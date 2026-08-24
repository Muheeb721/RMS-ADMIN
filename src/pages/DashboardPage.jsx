import { useMemo } from 'react';
import './DashboardPage.css';
import { formatCurrency, formatDate } from '../utils/formatters';

function DashboardPage({ appData }) {
  const properties = appData.properties || [];
  const bookings = appData.bookings || [];
  const payments = appData.payments || [];
  const dues = appData.dues || [];
  const users = appData.users || [];
  const activityLogs = appData.activityLogs || [];

  const stats = useMemo(() => {
    const totalProperties = properties.length;
    const availableProperties = properties.filter((item) => item.status === 'Available').length;
    const reservedProperties = properties.filter((item) => item.status === 'Reserved').length;
    const soldProperties = properties.filter((item) => item.status === 'Sold').length;
    const forRentProperties = properties.filter((item) => item.status === 'For Rent').length;
    const totalRevenue = payments
      .filter((payment) => payment.status === 'Paid')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const pendingPayments = payments.filter((payment) => payment.status === 'Pending').length;
    const outstandingDues = dues
      .filter((due) => due.paymentStatus !== 'Paid')
      .reduce((sum, due) => sum + Number(due.remainingAmount || due.currentCharge || 0), 0);

    return {
      totalProperties,
      availableProperties,
      reservedProperties,
      soldProperties,
      forRentProperties,
      totalUsers: users.length,
      totalBookings: bookings.length,
      totalRevenue,
      pendingPayments,
      outstandingDues,
    };
  }, [properties, payments, dues, users, bookings]);

  const cards = [
    { label: 'Total Properties', value: stats.totalProperties, icon: '🏠', tone: 'primary' },
    { label: 'Available Properties', value: stats.availableProperties, icon: '✅', tone: 'success' },
    { label: 'Reserved Properties', value: stats.reservedProperties, icon: '🟡', tone: 'warning' },
    { label: 'Sold Properties', value: stats.soldProperties, icon: '🔴', tone: 'danger' },
    { label: 'Properties For Rent', value: stats.forRentProperties, icon: '🏢', tone: 'info' },
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', tone: 'primary' },
    { label: 'Total Bookings', value: stats.totalBookings, icon: '📅', tone: 'success' },
    { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: '💰', tone: 'warning' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: '⏳', tone: 'info' },
    { label: 'Outstanding Dues', value: formatCurrency(stats.outstandingDues), icon: '📄', tone: 'danger' },
  ];

  const statusBreakdown = [
    { label: 'Available', value: properties.filter((item) => item.status === 'Available').length, color: '#16a34a' },
    { label: 'Reserved', value: properties.filter((item) => item.status === 'Reserved').length, color: '#f59e0b' },
    { label: 'Sold', value: properties.filter((item) => item.status === 'Sold').length, color: '#dc2626' },
    { label: 'For Rent', value: properties.filter((item) => item.status === 'For Rent').length, color: '#0ea5e9' },
  ];

  const recentTransactions = [...payments]
    .sort((a, b) => new Date(b.paymentDate || b.date || 0) - new Date(a.paymentDate || a.date || 0))
    .slice(0, 5);

  const maxStatusValue = Math.max(...statusBreakdown.map((item) => item.value), 1);

  return (
    <div className="page-section dashboard-page">
      <section className="welcome-card panel-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>Welcome back, Admin 👋</h2>
        </div>
        <div className="date-pill">{formatDate(new Date().toISOString())}</div>
      </section>

      <div className="stats-grid dashboard-stats">
        {cards.map((card) => (
          <div key={card.label} className={`stat-card tone-${card.tone}`}>
            <div className="stat-card-icon">{card.icon}</div>
            <p>{card.label}</p>
            <h3>{card.value}</h3>
            <span className="trend up">Live</span>
          </div>
        ))}
      </div>

      <div className="content-grid two-column">
        <section className="panel-card">
          <div className="card-header">
            <h3>Property Status</h3>
            <span className="mini-badge">Live data</span>
          </div>
          <div className="status-list">
            {statusBreakdown.map((item) => (
              <div key={item.label} className="status-row">
                <div className="status-info">
                  <span className="status-dot" style={{ background: item.color }} />
                  <span>{item.label}</span>
                </div>
                <div className="status-bar-track">
                  <span style={{ width: `${(item.value / maxStatusValue) * 100}%`, background: item.color }} />
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <span className="mini-badge">Updated</span>
          </div>
          <div className="activity-list">
            {activityLogs.slice(0, 5).map((item) => (
              <div key={item.id} className="activity-row">
                <div className="dot-indicator" />
                <div>
                  <strong>{item.action}</strong>
                  <small>{item.details}</small>
                </div>
                <span>{formatDate(item.timestamp)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="content-grid two-column">
        <section className="panel-card">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <span className="mini-badge">Latest</span>
          </div>
          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>User</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((payment) => (
                  <tr key={payment.id || payment.paymentId}>
                    <td>{payment.paymentId || payment.id}</td>
                    <td>{payment.userName || payment.user}</td>
                    <td>{payment.propertyName || payment.property}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.paymentMethod || payment.method}</td>
                    <td>{formatDate(payment.paymentDate || payment.date)}</td>
                    <td><span className={`status-badge ${String(payment.status).toLowerCase()}`}>{payment.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel-card">
          <div className="card-header">
            <h3>Recent Bookings</h3>
            <span className="mini-badge">{bookings.length} total</span>
          </div>
          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.customerName}</td>
                    <td>{booking.propertyTitle}</td>
                    <td>{formatCurrency(booking.amount)}</td>
                    <td><span className={`status-badge ${String(booking.bookingStatus).toLowerCase()}`}>{booking.bookingStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
