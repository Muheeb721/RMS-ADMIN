import { useMemo, useState } from 'react';
import './DuesPage.css';
import { formatCurrency, formatDate } from '../utils/formatters';

function DuesPage({ appData, setAppData, notify }) {
  const dues = appData.dues || [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredDues = useMemo(() => {
    const next = [...dues].filter((due) => {
      const matchesSearch = !search || [due.user, due.property, due.id].join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || due.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    return next.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));
  }, [dues, search, statusFilter]);

  const markPaid = (dueId) => {
    setAppData((prev) => ({
      ...prev,
      dues: (prev.dues || []).map((item) => (item.id === dueId ? { ...item, status: 'Paid', paymentStatus: 'Paid' } : item)),
    }));
    notify({ message: 'Due marked as paid.', variant: 'success' });
  };

  const sendReminder = (due) => {
    setAppData((prev) => ({
      ...prev,
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'Rent reminder sent',
          detail: `Reminder sent for ${due.user} for ${due.property}.`,
          time: 'Just now',
          read: false,
        },
        ...(prev.notifications || []),
      ],
    }));
    notify({ message: `Reminder sent to ${due.user}.`, variant: 'info' });
  };

  return (
    <div className="page-section dues-page">
      <section className="panel-card toolbar-card">
        <div className="toolbar-row">
          <div className="toolbar-search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search due by user or property" />
          </div>
          <div className="toolbar-group">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All Status</option>
              <option value="Due">Due</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
            <button type="button" className="mini-button">Send Reminders</button>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="card-header">
          <h3>Rent & Due Management</h3>
          <span className="mini-badge">{filteredDues.length} dues</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Due ID</th>
                <th>User</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDues.map((due) => (
                <tr key={due.id}>
                  <td>{due.id}</td>
                  <td>{due.user}</td>
                  <td>{due.property}</td>
                  <td>{formatCurrency(due.amount)}</td>
                  <td>{formatDate(due.dueDate)}</td>
                  <td><span className={`status-badge ${String(due.status).toLowerCase()}`}>{due.status}</span></td>
                  <td>
                    <div className="table-actions">
                      <button type="button" className="table-button light" onClick={() => markPaid(due.id)} disabled={due.status === 'Paid'}>
                        {due.status === 'Paid' ? 'Paid' : 'Mark Paid'}
                      </button>
                      <button type="button" className="table-button light" onClick={() => sendReminder(due)}>Remind</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DuesPage;
