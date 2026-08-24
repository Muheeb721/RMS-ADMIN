import { useMemo, useState } from 'react';
import './BookingsPage.css';
import Modal from '../components/Modal';
import { formatCurrency, formatDate } from '../utils/formatters';

const emptyForm = {
  customerName: '',
  customerPhone: '',
  propertyId: '',
  propertyTitle: '',
  propertyType: 'House',
  bookingDate: '',
  visitDate: '',
  amount: '',
  paymentStatus: 'Pending',
  bookingStatus: 'Pending',
  notes: '',
};

function BookingsPage({ appData, setAppData, notify, onBookingDecision }) {
  const bookings = appData.bookings || [];
  const properties = appData.properties || [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const filteredBookings = useMemo(() => {
    const next = [...bookings].filter((booking) => {
      const matchesSearch = !search || [booking.customerName, booking.propertyTitle].join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || booking.bookingStatus === statusFilter;
      const matchesPayment = paymentFilter === 'All' || booking.paymentStatus === paymentFilter;
      return matchesSearch && matchesStatus && matchesPayment;
    });
    return next.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [bookings, search, statusFilter, paymentFilter]);

  const addActivity = (action, details) => {
    setAppData((prev) => ({
      ...prev,
      activityLogs: [{ id: `log-${Date.now()}`, action, details, timestamp: new Date().toISOString() }, ...(prev.activityLogs || [])].slice(0, 20),
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.customerName.trim()) nextErrors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) nextErrors.customerPhone = 'Phone is required';
    if (!formData.propertyTitle.trim()) nextErrors.propertyTitle = 'Property is required';
    if (!formData.amount || Number(formData.amount) <= 0) nextErrors.amount = 'Valid amount is required';
    return nextErrors;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (booking) => {
    setEditingId(booking.id);
    setFormData({
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      propertyId: booking.propertyId,
      propertyTitle: booking.propertyTitle,
      propertyType: booking.propertyType,
      bookingDate: booking.bookingDate,
      visitDate: booking.visitDate,
      amount: booking.amount,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      notes: booking.notes,
    });
    setErrors({});
    setModalOpen(true);
  };

  const saveBooking = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const selectedProperty = properties.find((item) => item.id === formData.propertyId) || properties.find((item) => item.title === formData.propertyTitle);
    const payload = {
      id: editingId || `bk-${Date.now().toString().slice(-6)}`,
      bookingId: editingId || `bk-${Date.now().toString().slice(-6)}`,
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      propertyId: selectedProperty?.id || formData.propertyId || 'prop-temp',
      propertyTitle: selectedProperty?.title || formData.propertyTitle.trim(),
      propertyType: selectedProperty?.propertyType || formData.propertyType,
      bookingDate: formData.bookingDate || new Date().toISOString().slice(0, 10),
      visitDate: formData.visitDate || new Date().toISOString().slice(0, 10),
      amount: Number(formData.amount || 0),
      paymentStatus: formData.paymentStatus,
      bookingStatus: formData.bookingStatus,
      notes: formData.notes.trim(),
      createdAt: editingId ? bookings.find((item) => item.id === editingId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    setAppData((prev) => ({
      ...prev,
      bookings: editingId ? (prev.bookings || []).map((item) => (item.id === editingId ? payload : item)) : [payload, ...(prev.bookings || [])],
    }));
    addActivity(editingId ? 'Booking edited' : 'Booking added', `${payload.customerName}'s booking was ${editingId ? 'updated' : 'added'}.`);
    notify({ message: editingId ? 'Booking updated successfully.' : 'Booking created successfully.', variant: 'success' });
    setModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDecision = (bookingId, status) => {
    onBookingDecision?.(bookingId, status);
    setAppData((prev) => ({
      ...prev,
      bookings: (prev.bookings || []).map((item) => item.id === bookingId ? { ...item, bookingStatus: status } : item),
    }));
  };

  const deleteBooking = (bookingId) => {
    setAppData((prev) => ({ ...prev, bookings: (prev.bookings || []).filter((item) => item.id !== bookingId) }));
    addActivity('Booking deleted', 'A booking record was removed.');
    notify({ message: 'Booking deleted successfully.', variant: 'success' });
    setDeletingId(null);
  };

  return (
    <div className="page-section bookings-page">
      <section className="panel-card toolbar-card">
        <div className="toolbar-row">
          <div className="toolbar-search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer or property" />
          </div>
          <div className="toolbar-group">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All Booking Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)}>
              <option value="All">All Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
            </select>
            <button type="button" className="primary-button" onClick={openCreateModal}>Add Booking</button>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="card-header">
          <h3>Booking Management</h3>
          <span className="mini-badge">{filteredBookings.length} bookings</span>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h4>No bookings available</h4>
            <p>Create a new booking or adjust your filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Property</th>
                  <th>Amount</th>
                  <th>Booking</th>
                  <th>Payment</th>
                  <th>Visit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.id}</td>
                    <td>{booking.customerName}</td>
                    <td>{booking.propertyTitle}</td>
                    <td>{formatCurrency(booking.amount)}</td>
                    <td><span className={`status-badge ${String(booking.bookingStatus).toLowerCase()}`}>{booking.bookingStatus}</span></td>
                    <td><span className={`status-badge ${String(booking.paymentStatus).toLowerCase()}`}>{booking.paymentStatus}</span></td>
                    <td>{formatDate(booking.visitDate)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="table-button light" onClick={() => openEditModal(booking)}>Edit</button>
                        <button type="button" className="table-button light" onClick={() => handleDecision(booking.id, 'Approved')}>Approve</button>
                        <button type="button" className="table-button light" onClick={() => handleDecision(booking.id, 'Rejected')}>Reject</button>
                        <button type="button" className="table-button danger" onClick={() => setDeletingId(booking.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={modalOpen}
        title={editingId ? 'Edit Booking' : 'Add Booking'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="primary-button" form="booking-form">Save Booking</button>
          </>
        }
      >
        <form id="booking-form" className="property-form" onSubmit={saveBooking}>
          <div className="form-grid two-col">
            <label>
              Customer name
              <input value={formData.customerName} onChange={(event) => setFormData((prev) => ({ ...prev, customerName: event.target.value }))} />
              {errors.customerName && <span className="field-error">{errors.customerName}</span>}
            </label>
            <label>
              Customer phone
              <input value={formData.customerPhone} onChange={(event) => setFormData((prev) => ({ ...prev, customerPhone: event.target.value }))} />
              {errors.customerPhone && <span className="field-error">{errors.customerPhone}</span>}
            </label>
          </div>

          <div className="form-grid two-col">
            <label>
              Property title
              <input value={formData.propertyTitle} onChange={(event) => setFormData((prev) => ({ ...prev, propertyTitle: event.target.value }))} />
              {errors.propertyTitle && <span className="field-error">{errors.propertyTitle}</span>}
            </label>
            <label>
              Property type
              <select value={formData.propertyType} onChange={(event) => setFormData((prev) => ({ ...prev, propertyType: event.target.value }))}>
                <option value="House">House</option>
                <option value="Apartment">Apartment</option>
                <option value="Flat">Flat</option>
                <option value="Room">Room</option>
                <option value="Hostel">Hostel</option>
              </select>
            </label>
          </div>

          <div className="form-grid three-col">
            <label>
              Booking date
              <input type="date" value={formData.bookingDate} onChange={(event) => setFormData((prev) => ({ ...prev, bookingDate: event.target.value }))} />
            </label>
            <label>
              Visit date
              <input type="date" value={formData.visitDate} onChange={(event) => setFormData((prev) => ({ ...prev, visitDate: event.target.value }))} />
            </label>
            <label>
              Amount
              <input type="number" value={formData.amount} onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))} />
              {errors.amount && <span className="field-error">{errors.amount}</span>}
            </label>
          </div>

          <div className="form-grid two-col">
            <label>
              Booking status
              <select value={formData.bookingStatus} onChange={(event) => setFormData((prev) => ({ ...prev, bookingStatus: event.target.value }))}>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
            <label>
              Payment status
              <select value={formData.paymentStatus} onChange={(event) => setFormData((prev) => ({ ...prev, paymentStatus: event.target.value }))}>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </label>
          </div>

          <label>
            Notes
            <textarea rows="3" value={formData.notes} onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))} />
          </label>
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingId)}
        title="Are you sure?"
        onClose={() => setDeletingId(null)}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => setDeletingId(null)}>Cancel</button>
            <button type="button" className="primary-button danger-button" onClick={() => deleteBooking(deletingId)}>Delete</button>
          </>
        }
      >
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default BookingsPage;
