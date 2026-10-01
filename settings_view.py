import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet' | 'notifications'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet' | 'notifications' | 'settings'>")

# 2. Add Settings tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "notifications" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("notifications"\)\}>\n\s*<Bell size=\{18\} /> <span className="nav-text">Notifications</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>\n            <Settings size={18} /> <span className="nav-text">Settings</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Create SettingsView component
settings_view = """
function SettingsView() {
  const [activeCategory, setActiveCategory] = useState('General');

  const categories = [
    'General', 'Monitoring', 'Diagnostics', 'Privacy & Permissions', 'Reporting & Logs', 'Developer', 'About'
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Configuration & Preferences</h3>
          <span className="cc-os">Customize application behavior, telemetry intervals, and permissions</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Categories (Left) */}
        <div className="process-list-container" style={{ width: '250px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {categories.map(c => (
              <li 
                key={c} 
                onClick={() => setActiveCategory(c)}
                style={{ 
                  padding: '0.8rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: activeCategory === c ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: activeCategory === c ? '3px solid #00e5ff' : '3px solid transparent',
                  color: activeCategory === c ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontWeight: activeCategory === c ? 'bold' : 'normal'
                }}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Form (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {activeCategory === 'General' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Appearance</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Theme</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>Cyberpunk Dark</option><option>Light Mode</option></select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Language</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>English (US)</option><option>Spanish</option></select>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Startup Behavior</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Launch at system startup
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Start minimized in system tray
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Automatically Check Updates
                  </label>
                </div>
              </div>
            </>
          )}

          {activeCategory === 'Monitoring' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Telemetry & Retention</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Sampling Intervals (Live Data)</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>1 Second (High Impact)</option><option>5 Seconds (Default)</option></select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>History Retention</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>30 Days</option><option>90 Days</option><option>1 Year</option></select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Database Settings</span>
                  <button className="cc-btn">Manage SQLite DB</button>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Notifications</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Enable Desktop Notification Popups
                </label>
              </div>
            </>
          )}

          {activeCategory === 'Diagnostics' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Diagnostic Thresholds</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>CPU Temperature Critical Level</span>
                  <input type="number" defaultValue="90" style={{ width: '80px', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Storage Capacity Warning Limit</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>85% Full</option><option>90% Full</option></select>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Auto-run Background Diagnostics Weekly
              </label>
            </>
          )}

          {activeCategory === 'Privacy & Permissions' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>System Capabilities</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Administrator / Root Status</span>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Unprivileged User (Polkit Limited)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Capability Status</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>CAP_NET_RAW Available</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Network Discovery Permissions</span>
                  <button className="cc-btn" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b' }}>Request Elevated Scan Access</button>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Privacy</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Anonymous Data Collection (Telemetry)
                </label>
              </div>
            </>
          )}

          {activeCategory === 'Reporting & Logs' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Export Settings</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Default Export Format</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>PDF Document</option><option>HTML Page</option><option>JSON Payload</option></select>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Logging Settings</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Application Log Level</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>INFO</option><option>DEBUG</option><option>ERROR</option></select>
                </div>
              </div>
            </>
          )}

          {activeCategory === 'Developer' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Advanced Settings</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1rem' }}>
                  <input type="checkbox" style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Enable Developer Console & Debug Tools
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Ignore SSL Errors (Not Recommended)
                </label>
              </div>
            </>
          )}

          {activeCategory === 'About' && (
            <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ width: '80px', height: '80px', background: '#00e5ff', borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)' }}>
                <Activity size={40} color="#000" />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Computer Vitals Monitor</h3>
              <p style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '2rem', fontWeight: 'bold' }}>Version 0.1.0-alpha</p>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
                <div style={{ marginBottom: '1rem' }}><strong style={{color: 'var(--text-muted)'}}>License:</strong> MIT Open Source License</div>
                <div><strong style={{color: 'var(--text-muted)'}}>Open-source information:</strong> Built with React, Tauri, and Rust. Data visualized via Recharts. Icons by Lucide.</div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", settings_view + "\nfunction App() {")

# Render SettingsView based on activeTab
content = content.replace("{activeTab === 'notifications' && <NotificationsView />}", "{activeTab === 'notifications' && <NotificationsView />}\n        {activeTab === 'settings' && <SettingsView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

