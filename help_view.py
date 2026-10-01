import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet' | 'notifications' | 'settings'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet' | 'notifications' | 'settings' | 'help'>")

# 2. Add Help tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "settings" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("settings"\)\}>\n\s*<Settings size=\{18\} /> <span className="nav-text">Settings</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "help" ? "active" : ""}`} onClick={() => setActiveTab("help")}>\n            <HelpCircle size={18} /> <span className="nav-text">Help / About</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add HelpCircle icon import
if "HelpCircle" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, HelpCircle,")

# 4. Create HelpView component
help_view = """
function HelpView() {
  const [activeTopic, setActiveTopic] = useState('What is CVM?');

  const topics = [
    'What is CVM?', 
    'Getting Started', 
    'Understanding System Health', 
    'Understanding Diagnostics', 
    'Understanding Evidence', 
    'Understanding Permissions', 
    'Troubleshooting CVM', 
    'About & Licenses'
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Help Center & Documentation</h3>
          <span className="cc-os">Product Manual, Troubleshooting, and Application Diagnostics</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>Report a Bug</button>
          <button className="cc-btn" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6' }}>View App Logs</button>
          <button className="cc-btn" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b' }}>App Diagnostics</button>
          <button className="cc-btn" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }}>Online Docs</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Help Topics (Left) */}
        <div className="process-list-container" style={{ width: '260px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {topics.map(t => (
              <li 
                key={t} 
                onClick={() => setActiveTopic(t)}
                style={{ 
                  padding: '0.8rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: activeTopic === t ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: activeTopic === t ? '3px solid #00e5ff' : '3px solid transparent',
                  color: activeTopic === t ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: activeTopic === t ? 'bold' : 'normal'
                }}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Help Content (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>
          
          <h2 style={{ color: '#00e5ff', fontSize: '1.8rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.3)', paddingBottom: '1rem' }}>
            {activeTopic}
          </h2>

          {activeTopic === 'What is CVM?' && (
            <div style={{ color: '#fff' }}>
              <p style={{ marginBottom: '1rem' }}><strong>What Computer Vitals Monitor does:</strong></p>
              <p style={{ color: 'var(--text-muted)' }}>
                Computer Vitals Monitor (CVM) is a high-performance system monitoring and telemetry application written in Rust and React. It interfaces directly with the kernel and hardware layers to extract real-time metrics, system logs, hardware temperatures, and network topology.
              </p>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                It goes beyond simple monitoring by offering an Automated Diagnostic Center and Incident Response system, acting as an autonomous technician that detects, explains, and occasionally resolves system anomalies.
              </p>
            </div>
          )}

          {activeTopic === 'Getting Started' && (
            <div style={{ color: '#fff' }}>
              <p style={{ marginBottom: '1rem' }}><strong>Getting Started:</strong></p>
              <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Navigate to the Dashboard to see your live system vitals.</li>
                <li style={{ marginBottom: '0.5rem' }}>Check the Hardware and Storage tabs to ensure your disks and sensors are operating normally.</li>
                <li style={{ marginBottom: '0.5rem' }}>If you experience an issue, immediately run a Full System Diagnostic to generate actionable evidence.</li>
              </ul>
            </div>
          )}

          {activeTopic === 'Understanding System Health' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                System health is calculated by continuously sampling CPU load, thermal thresholds, disk latency, and kernel error logs. A system transitions from <strong style={{color: '#10b981'}}>Healthy</strong> to <strong style={{color: '#f59e0b'}}>Warning</strong> when parameters exceed 80% utilization for sustained periods, and to <strong style={{color: '#ef4444'}}>Critical</strong> upon hardware failure detection (e.g. SMART errors).
              </p>
            </div>
          )}

          {activeTopic === 'Understanding Diagnostics' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Diagnostics actively poke system APIs rather than passively listening. For example, a Memory Diagnostic allocates and verifies RAM segments. Always review the "Plain-English Explanation" generated after a diagnostic to understand what the test discovered.
              </p>
            </div>
          )}

          {activeTopic === 'Understanding Evidence' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                "Evidence" refers to the raw technical payload—such as a specific line in `dmesg` or an Event ID in the Windows Registry—that caused an alert to fire. You can use Evidence strings when opening IT support tickets.
              </p>
            </div>
          )}

          {activeTopic === 'Understanding Permissions' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                To execute critical actions like restarting services, forcing process termination, or deep network discovery, CVM requires elevated permissions (Root on Linux, Administrator on Windows). If a button fails, check your Polkit rules or launch CVM with `sudo`.
              </p>
            </div>
          )}

          {activeTopic === 'Troubleshooting CVM' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                If the application interface freezes, ensure the Rust backend isn't hanging on a zombie process lock. Use the "View App Logs" and "App Diagnostics" buttons in the top right to analyze the internal state of CVM itself.
              </p>
            </div>
          )}

          {activeTopic === 'About & Licenses' && (
            <div style={{ color: '#fff' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #00e5ff', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Computer Vitals Monitor</h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Version: 0.1.0-alpha</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Build Information: Commit 1c6d09c (Release)</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>System Compatibility: Linux (Debian/Ubuntu), Windows 11, macOS 14+</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Platform Support: x86_64, aarch64</div>
              </div>
              
              <h4 style={{ marginBottom: '0.5rem' }}>Open-source Licenses</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                This software utilizes the following open-source projects:<br/>
                - React (MIT License)<br/>
                - Tauri (Apache-2.0 License)<br/>
                - Recharts (MIT License)<br/>
                - Lucide Icons (ISC License)
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", help_view + "\nfunction App() {")

# Render HelpView based on activeTab
content = content.replace("{activeTab === 'settings' && <SettingsView />}", "{activeTab === 'settings' && <SettingsView />}\n        {activeTab === 'help' && <HelpView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

