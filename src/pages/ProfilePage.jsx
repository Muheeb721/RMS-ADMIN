import { useEffect, useState } from 'react';
import './ProfilePage.css';

function ProfilePage({ appData, setAppData, notify }) {
  const profile = appData.profile || appData.admin || {
    fullName: 'Ayesha Khan',
    name: 'Ayesha Khan',
    email: 'admin@rms.com',
    phone: '+92 300 1234567',
    role: 'Super Administrator',
  };

  const [form, setForm] = useState(profile);

  useEffect(() => {
    setForm(profile);
  }, [appData.profile, appData.admin]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextProfile = {
      ...profile,
      ...form,
      fullName: form.fullName || form.name || profile.fullName || 'Ayesha Khan',
      name: form.name || form.fullName || profile.name || 'Ayesha Khan',
    };

    setAppData((prev) => ({
      ...prev,
      admin: { ...(prev.admin || {}), ...nextProfile },
      profile: nextProfile,
    }));
    notify({ message: 'Profile updated successfully.', variant: 'success' });
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
          <button type="submit" className="primary-button">Update Profile</button>
        </form>
      </section>
    </div>
  );
}

export default ProfilePage;
