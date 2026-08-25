import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const emptyProfile = () => ({
  fullName: '',
  name: '',
  email: '',
  phone: '',
  role: '',
});

function ProfilePage({ appData, setAppData, notify }) {
  const navigate = useNavigate();

  const defaultProfile = {
    fullName: 'Ayesha Khan',
    name: 'Ayesha Khan',
    email: 'admin@rms.com',
    phone: '+92 300 1234567',
    role: 'Super Administrator',
  };

  const savedProfile = appData.profile || appData.admin || defaultProfile;
  const [form, setForm] = useState(emptyProfile());
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setForm(emptyProfile());
    setShowConfirm(false);
  }, [savedProfile]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanedForm = {
      fullName: (form.fullName || form.name || '').trim(),
      name: (form.name || form.fullName || '').trim(),
      email: (form.email || '').trim(),
      phone: (form.phone || '').trim(),
      role: (form.role || '').trim(),
    };

    const isEmpty = !cleanedForm.fullName && !cleanedForm.name && !cleanedForm.email && !cleanedForm.phone && !cleanedForm.role;
    if (isEmpty) {
      notify({ message: 'Please enter profile details before updating.', variant: 'error' });
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmUpdate = () => {
    const cleanedForm = {
      fullName: (form.fullName || form.name || '').trim(),
      name: (form.name || form.fullName || '').trim(),
      email: (form.email || '').trim(),
      phone: (form.phone || '').trim(),
      role: (form.role || '').trim(),
    };

    const nextProfile = {
      ...defaultProfile,
      ...cleanedForm,
      fullName: cleanedForm.fullName || cleanedForm.name || defaultProfile.fullName,
      name: cleanedForm.name || cleanedForm.fullName || defaultProfile.name,
    };

    const profileNotification = {
      id: `notif-${Date.now()}`,
      title: 'Profile updated',
      message: `${nextProfile.fullName} updated the admin profile.`,
      detail: `Name: ${nextProfile.fullName} | Email: ${nextProfile.email} | Phone: ${nextProfile.phone} | Role: ${nextProfile.role}`,
      type: 'Profile',
      recipient: nextProfile.email || 'Admin',
      date: new Date().toISOString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      priority: 'High',
    };

    setAppData((prev) => ({
      ...prev,
      admin: { ...(prev.admin || {}), ...nextProfile },
      profile: nextProfile,
      notifications: [profileNotification, ...(prev.notifications || [])],
    }));

    setForm(emptyProfile());
    setShowConfirm(false);
    notify({ message: 'Profile updated successfully.', variant: 'success' });
    navigate('/admin');
  };

  return (
    <div className="page-section profile-page">
      <section className="panel-card">
        <div className="card-header">
          <h3>Admin Profile</h3>
        </div>
        <form onSubmit={handleSubmit} className="property-form">
          <div className="form-grid two-col">
            <label>
              Full Name
              <input value={form.fullName || form.name || ''} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value, name: event.target.value }))} />
            </label>
            <label>
              Role
              <input value={form.role || ''} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} />
            </label>
          </div>
          <div className="form-grid two-col">
            <label>
              Email
              <input type="email" value={form.email || ''} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </label>
            <label>
              Phone
              <input value={form.phone || ''} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
            </label>
          </div>
          <div className="form-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button type="submit" className="primary-button">Update Profile</button>
            {showConfirm && (
              <button type="button" className="primary-button" onClick={handleConfirmUpdate}>
                Confirm Update
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
