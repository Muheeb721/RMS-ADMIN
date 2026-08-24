import './SettingsPage.css';

const defaultSettings = {
  darkMode: true,
  notifications: true,
  autoApprove: false,
  emailAlerts: true,
  dateFormat: 'DD/MM/YYYY',
  timezone: 'GMT+5',
  itemsPerPage: 10,
};

function SettingsPage({ appData, setAppData, notify }) {
  const settings = { ...defaultSettings, ...(appData.settings || {}) };

  const handleToggle = (key) => {
    setAppData((prev) => ({
      ...prev,
      settings: { ...(prev.settings || {}), [key]: !(prev.settings?.[key] ?? defaultSettings[key]) },
    }));
  };

  const handleSelect = (key, value) => {
    setAppData((prev) => ({
      ...prev,
      settings: { ...(prev.settings || {}), [key]: value },
    }));
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
                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</strong>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked={Boolean(value)} onChange={() => handleToggle(key)} />
                    <span className="slider" />
                  </label>
                </div>
              );
            }

            return (
              <div className="setting-row" key={key}>
                <div>
                  <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}</strong>
                </div>
                <select value={value} onChange={(event) => { handleSelect(key, event.target.value); notify({ message: 'Settings updated.', variant: 'success' }); }}>
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
