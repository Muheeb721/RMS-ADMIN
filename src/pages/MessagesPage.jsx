import './MessagesPage.css';

function MessagesPage({ messages }) {
  return (
    <div className="page-section messages-page">
      <section className="panel-card">
        <div className="card-header">
          <h3>Messages & Support</h3>
          <button className="mini-button">Create Ticket</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => (
                <tr key={message.id}>
                  <td>{message.sender}</td>
                  <td>{message.subject}</td>
                  <td><span className={`status-badge ${message.status === 'Open' ? 'pending' : 'active'}`}>{message.status}</span></td>
                  <td>{message.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default MessagesPage;
