import { useState } from 'react';
import './ChatbotPage.css';

function ChatbotPage({ appState, setAppState }) {
  const [form, setForm] = useState({
    question: '',
    answer: '',
    language: 'English',
    enabled: true,
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.question || !form.answer) return;

    setAppState((prev) => ({
      ...prev,
      chatbot: [{ id: Date.now(), ...form }, ...prev.chatbot],
    }));
    setForm({ question: '', answer: '', language: 'English', enabled: true });
  };

  const toggleEnable = (id) => {
    setAppState((prev) => ({
      ...prev,
      chatbot: prev.chatbot.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    }));
  };

  const removeItem = (id) => {
    setAppState((prev) => ({
      ...prev,
      chatbot: prev.chatbot.filter((item) => item.id !== id),
    }));
  };

  return (
    <div className="page-section chatbot-page">
      <div className="content-grid two-column">
        <section className="panel-card">
          <div className="card-header">
            <h3>Add Response</h3>
          </div>
          <form onSubmit={handleSubmit} className="property-form">
            <label>
              Question
              <input value={form.question} onChange={(e) => setForm((prev) => ({ ...prev, question: e.target.value }))} />
            </label>
            <label>
              Answer
              <textarea rows="4" value={form.answer} onChange={(e) => setForm((prev) => ({ ...prev, answer: e.target.value }))} />
            </label>
            <label>
              Language
              <select value={form.language} onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}>
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
              </select>
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))} />
              Enable response
            </label>
            <button type="submit" className="primary-button">Save Response</button>
          </form>
        </section>

        <section className="panel-card">
          <div className="card-header">
            <h3>Chatbot Responses</h3>
          </div>
          <div className="list-stack large">
            {appState.chatbot.map((item) => (
              <div key={item.id} className="list-row chatbot-row">
                <div>
                  <strong>{item.question}</strong>
                  <small>{item.language}</small>
                  <p>{item.answer}</p>
                </div>
                <div className="chatbot-actions">
                  <button className="table-button light" onClick={() => toggleEnable(item.id)}>{item.enabled ? 'Disable' : 'Enable'}</button>
                  <button className="table-button danger" onClick={() => removeItem(item.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ChatbotPage;
