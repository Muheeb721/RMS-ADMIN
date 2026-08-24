import { useState } from 'react';
import './LoginPage.css';

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('admin@rms.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const success = onLogin(email, password);
    if (!success) {
      setError('Please enter a valid admin email and password.');
    }
  };

  return (
    <div className="login-shell login-page">
      <div className="login-card">
        <div className="brand-block">
          <div className="brand-badge">RMS</div>
          <h1>Admin Login</h1>
          <p>Secure access to the RMS administration panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Email Address
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@rms.com" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button type="submit" className="primary-button full-width">Login to Dashboard</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
