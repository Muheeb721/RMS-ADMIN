import './SettingsPage.css';

const defaultSettings = {
  darkMode: false,
  notifications: true,
  autoApprove: false,
  emailAlerts: true,
  dateFormat: 'DD/MM/YYYY',
  timezone: 'GMT+5',
  itemsPerPage: 10,
};

const settingLabels = {
  darkMode: 'Dark Mode',
  notifications: 'Notifications',
  autoApprove: 'Auto Approve Bookings',
  emailAlerts: 'Email Alerts',
  dateFormat: 'Date Format',
  timezone: 'Timezone',
  itemsPerPage: 'Items Per Page',
};

function SettingsPage({ appData, setAppData, notify }) {
  const settings = { ...defaultSettings, ...(appData.settings || {}) };

  const handleToggle = (key) => {
    const nextValue = !settings[key];
    setAppData((prev) => ({
      ...prev,
      settings: { ...(prev.settings || {}), [key]: nextValue },
    }));
    notify({ message: `${settingLabels[key]} ${nextValue ? 'enabled' : 'disabled'}.`, variant: 'success' });
  };

  const handleSelect = (key, value) => {
    const nextValue = key === 'itemsPerPage' ? Number(value) : value;
    setAppData((prev) => ({
      ...prev,
      settings: { ...(prev.settings || {}), [key]: nextValue },
    }));
    notify({ message: `${settingLabels[key]} updated.`, variant: 'success' });
  };

  return (
    <div className="page-section settings-page">
      <section className="panel-card">
        <div className="card-header">
          <h3>Admin Preferences</h3>
        </div>
        <div className="settings-list">
          {Object.entries(settings).map(([key, value]) => {
            if (typeof value === 'boolean') {
              return (
                <div className="setting-row" key={key}>
                  <div>
                    <strong>{settingLabels[key] || key}</strong>
                    <small className="setting-description">
                      {key === 'darkMode' && 'Apply a dark appearance across the admin panel.'}
                      {key === 'notifications' && 'Show unread notification indicators in the header.'}
                      {key === 'autoApprove' && 'Automatically approve new bookings while the admin panel is online.'}
                      {key === 'emailAlerts' && 'Save your preference for email alerts.'}
                    </small>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={Boolean(value)}
                      onChange={() => handleToggle(key)}
                      aria-label={settingLabels[key] || key}
                    />
                    <span className="slider" />
                  </label>
                </div>
              );
            }

            return (
              <div className="setting-row" key={key}>
                <div>
                  <strong>{settingLabels[key] || key}</strong>
                </div>
                <select
                  value={value}
                  onChange={(event) => handleSelect(key, event.target.value)}
                  aria-label={settingLabels[key] || key}
                >
                  {key === 'dateFormat' && (
                    <>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </>
                  )}
                  {key === 'timezone' && (
                    <>
                      <option value="GMT+5">GMT+5</option>
                      <option value="UTC">UTC</option>
                      <option value="GMT+0">GMT+0</option>
                    </>
                  )}
                  {key === 'itemsPerPage' && (
                    <>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </>
                  )}
                </select>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
