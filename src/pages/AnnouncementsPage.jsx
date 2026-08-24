import { useState } from 'react';
import './AnnouncementsPage.css';

function AnnouncementsPage({ appState, setAppState }) {
  const [form, setForm] = useState({
    title: '',
    audience: 'All occupants',
    priority: 'Medium',
    content: '',
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title || !form.content) return;

    setAppState((prev) => ({
      ...prev,
      announcements: [{ id: Date.now(), ...form }, ...prev.announcements],
    }));
    setForm({ title: '', audience: 'All occupants', priority: 'Medium', content: '' });
  };

  return (
    <div className="page-section announcements-page">
      <div className="content-grid two-column">
        <section className="panel-card">
          <div className="card-header">
            <h3>Create Announcement</h3>
          </div>
          <form onSubmit={handleSubmit} className="property-form">
            <label>
              Title
              <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </label>
            <label>
              Audience
              <select value={form.audience} onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}>
                <option value="All occupants">All occupants</option>
                <option value="Tenants">Tenants</option>
                <option value="Landlords">Landlords</option>
              </select>
            </label>
            <label>
              Priority
              <select value={form.priority} onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </label>
            <label>
              Content
              <textarea value={form.content} rows="5" onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))} />
            </label>
            <button type="submit" className="primary-button">Publish</button>
          </form>
        </section>

        <section className="panel-card">
          <div className="card-header">
            <h3>Published Announcements</h3>
          </div>
          <div className="list-stack large">
            {appState.announcements.map((item) => (
              <div key={item.id} className="list-row announcement-row">
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.audience} · {item.priority}</small>
                  <p>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AnnouncementsPage;
