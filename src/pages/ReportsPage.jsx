import './ReportsPage.css';
import { formatCurrency, formatDate } from '../utils/formatters';

function ReportsPage({ appData }) {
  const payments = appData.payments || [];
  const bookings = appData.bookings || [];
  const dues = appData.dues || [];
  const users = appData.users || [];
  const properties = appData.properties || [];

  const totalRevenue = payments
    .filter((payment) => payment.status === 'Paid')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const approvedBookings = bookings.filter((booking) => booking.bookingStatus === 'Approved' || booking.status === 'Approved').length;
  const openTickets = (appData.messages || []).filter((message) => message.status === 'Open').length;
  const overdueDues = dues.filter((due) => due.status !== 'Paid').length;
  const activeUsers = users.filter((user) => user.status === 'Active').length;
  const occupancyRate = properties.length > 0
    ? Math.round((properties.filter((property) => property.status === 'Available' || property.status === 'Reserved').length / properties.length) * 100)
    : 0;

  const breakdown = [
    { label: 'Revenue', value: formatCurrency(totalRevenue) },
    { label: 'Approved bookings', value: String(approvedBookings) },
    { label: 'Open tickets', value: String(openTickets) },
    { label: 'Overdue dues', value: String(overdueDues) },
    { label: 'Active users', value: String(activeUsers) },
    { label: 'Occupancy', value: `${occupancyRate}%` },
  ];

  return (
    <div className="page-section reports-page">
      <div className="stats-grid three-column">
        {breakdown.map((item) => (
          <div key={item.label} className="stat-card">
            <p>{item.label}</p>
            <h3>{item.value}</h3>
          </div>
        ))}
      </div>

      <div className="content-grid two-column">
        <section className="panel-card">
          <div className="card-header">
            <h3>Recent Payments</h3>
          </div>
          <div className="table-wrap compact-table">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.user}</td>
                    <td>{payment.property}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{formatDate(payment.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel-card">
          <div className="card-header">
            <h3>Latest Bookings</h3>
          </div>
          <div className="user-list">
            {bookings.slice(0, 5).map((booking) => (
              <div className="user-row" key={booking.id}>
                <div className="user-avatar">{(booking.customerName || 'B').slice(0, 2).toUpperCase()}</div>
                <div className="user-meta">
                  <strong>{booking.customerName}</strong>
                  <small>{booking.propertyTitle}</small>
                </div>
                <span className={`status-badge ${String(booking.bookingStatus || booking.status).toLowerCase()}`}>
                  {booking.bookingStatus || booking.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ReportsPage;
