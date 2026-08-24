import { useMemo, useState } from 'react';
import './UsersPage.css';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import { generateId } from '../services/localStorage';

const emptyForm = {
  fullName: '',
  email: '',
  phone: '',
  role: 'Tenant',
  status: 'Active',
};

function UsersPage({ appData, setAppData, notify }) {
  const users = appData.users || [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('registrationDate');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  const filteredUsers = useMemo(() => {
    const next = [...users].filter((user) => {
      const matchesSearch = !search || [user.fullName, user.email, user.phone].join(' ').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;
      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });

    next.sort((a, b) => {
      if (sortBy === 'name') return String(a.fullName || a.name).localeCompare(String(b.fullName || b.name));
      if (sortBy === 'recent') return new Date(b.lastActivity || b.registrationDate || 0) - new Date(a.lastActivity || a.registrationDate || 0);
      return new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0);
    });

    return next;
  }, [users, search, statusFilter, roleFilter, sortBy]);

  const addActivity = (action, details) => {
    setAppData((prev) => ({
      ...prev,
      activityLogs: [{ id: `log-${Date.now()}`, action, details, timestamp: new Date().toISOString() }, ...(prev.activityLogs || [])].slice(0, 20),
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.fullName.trim() || !/^[A-Za-z ]{2,}$/.test(formData.fullName.trim())) nextErrors.fullName = 'Full name is required and should contain letters only';
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) nextErrors.email = 'Valid email is required';
    if (!formData.phone.trim() || !/^[+()\-\d\s]{7,20}$/.test(formData.phone)) nextErrors.phone = 'Valid phone is required';
    return nextErrors;
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingId(user.id);
    setFormData({
      fullName: user.fullName || user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const saveUser = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      id: editingId || generateId('usr'),
      fullName: formData.fullName.trim(),
      name: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      status: formData.status,
      registrationDate: editingId ? (users.find((item) => item.id === editingId)?.registrationDate || new Date().toISOString().slice(0, 10)) : new Date().toISOString().slice(0, 10),
      lastActivity: new Date().toISOString(),
    };

    setAppData((prev) => ({
      ...prev,
      users: editingId ? (prev.users || []).map((item) => (item.id === editingId ? payload : item)) : [payload, ...(prev.users || [])],
    }));
    addActivity(editingId ? 'User edited' : 'User added', `${payload.fullName} was ${editingId ? 'updated' : 'added'} to the roster.`);
    notify({ message: editingId ? 'User updated successfully.' : 'User created successfully.', variant: 'success' });
    setModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const deleteUser = (userId) => {
    setAppData((prev) => ({ ...prev, users: (prev.users || []).filter((item) => item.id !== userId) }));
    addActivity('User deleted', 'A user was removed from the admin list.');
    notify({ message: 'User deleted successfully.', variant: 'success' });
    setDeletingId(null);
  };

  const toggleStatus = (userId, nextStatus) => {
    setAppData((prev) => ({
      ...prev,
      users: (prev.users || []).map((item) => (item.id === userId ? { ...item, status: nextStatus, lastActivity: new Date().toISOString() } : item)),
    }));
    notify({ message: `User status updated to ${nextStatus}.`, variant: 'success' });
  };

  return (
    <div className="page-section users-page">
      <section className="panel-card toolbar-card">
        <div className="toolbar-row">
          <div className="toolbar-search">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, phone" />
          </div>
          <div className="toolbar-group">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <option value="All">All Roles</option>
              <option value="Tenant">Tenant</option>
              <option value="Buyer">Buyer</option>
              <option value="Landlord">Landlord</option>
              <option value="Admin">Admin</option>
            </select>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="registrationDate">Newest</option>
              <option value="recent">Recent Activity</option>
              <option value="name">Name</option>
            </select>
            <button type="button" className="primary-button" onClick={openCreateModal}>Add User</button>
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="card-header">
          <h3>User Directory</h3>
          <span className="mini-badge">{filteredUsers.length} users</span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h4>No users found</h4>
            <p>Try a different search or add a new user.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.fullName || user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.phone || '—'}</td>
                    <td>{user.role}</td>
                    <td>
                      <select value={user.status} onChange={(event) => toggleStatus(user.id, event.target.value)} className="status-select">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td>{formatDate(user.registrationDate)}</td>
                    <td>{formatDate(user.lastActivity)}</td>
                    <td>
                      <div className="table-actions">
                        <button type="button" className="table-button light" onClick={() => openEditModal(user)}>Edit</button>
                        <button type="button" className="table-button danger" onClick={() => setDeletingId(user.id)}>Delete</button>
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
        title={editingId ? 'Edit User' : 'Add User'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="primary-button" form="user-form">Save User</button>
          </>
        }
      >
        <form id="user-form" className="property-form" onSubmit={saveUser}>
          <label>
            Full Name
            <input value={formData.fullName} onChange={(event) => setFormData((prev) => ({ ...prev, fullName: event.target.value }))} />
            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
          </label>
          <label>
            Email
            <input type="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label>
            Phone
            <input value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </label>
          <div className="form-grid two-col">
            <label>
              Role
              <select value={formData.role} onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))}>
                <option value="Tenant">Tenant</option>
                <option value="Buyer">Buyer</option>
                <option value="Landlord">Landlord</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
            <label>
              Status
              <select value={formData.status} onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(deletingId)}
        title="Are you sure?"
        onClose={() => setDeletingId(null)}
        footer={
          <>
            <button type="button" className="outline-button" onClick={() => setDeletingId(null)}>Cancel</button>
            <button type="button" className="primary-button danger-button" onClick={() => deleteUser(deletingId)}>Delete</button>
          </>
        }
      >
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
}

export default UsersPage;
