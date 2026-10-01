import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet' | 'notifications'>")

# 2. Add Notifications tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "fleet" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("fleet"\)\}>\n\s*<Server size=\{18\} /> <span className="nav-text">Fleet</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "notifications" ? "active" : ""}`} onClick={() => setActiveTab("notifications")}>\n            <Bell size={18} /> <span className="nav-text">Notifications</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add Bell icon import
if "Bell" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, Bell,")

# 4. Create NotificationsView component
notifications_view = """
function NotificationsView() {
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [filterType, setFilterType] = useState('All');

  const notificationsData = [
    { id: 'NOT-1', type: 'Critical', time: '10:45 AM', problem: 'Storage Drive Offline', device: 'SQL-PROD-01', evidence: '/dev/sdb array degraded. 1 drive missing.', status: 'Active', incident: 'INC-9045', isRead: false },
    { id: 'NOT-2', type: 'Warning', time: '09:30 AM', problem: 'High CPU Temperature', device: 'CVM-WORKSTATION', evidence: 'Package temp reached 92C for 5 minutes.', status: 'Active', incident: 'INC-9044', isRead: false },
    { id: 'NOT-3', type: 'Recovery', time: '08:15 AM', problem: 'Network Restored', device: 'CORE-SWITCH-01', evidence: 'Uplink 2 re-established BGP session.', status: 'Resolved', incident: 'INC-9039', isRead: true },
    { id: 'NOT-4', type: 'Information', time: 'Yesterday', problem: 'System Update Available', device: 'Global Fleet', evidence: 'Security patch KB5043123 ready for deployment.', status: 'Pending', incident: 'None', isRead: true },
    { id: 'NOT-5', type: 'Attention', time: '2 Days Ago', problem: 'Low Disk Space', device: 'NAS-Storage', evidence: 'Volume 1 is 90% full (400GB remaining).', status: 'Active', incident: 'INC-9021', isRead: true }
  ];

  const categories = ['All', 'Critical', 'Warning', 'Attention', 'Information', 'Recovery'];
  
  const filteredNotifs = filterType === 'All' ? notificationsData : notificationsData.filter(n => n.type === filterType);

  const getNotifColor = (type: string) => {
    if (type === 'Critical') return '#ef4444';
    if (type === 'Warning') return '#f59e0b';
    if (type === 'Attention') return '#eab308';
    if (type === 'Recovery') return '#10b981';
    return '#3b82f6'; // Info
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Alerts & Notifications</h3>
          <span className="cc-os">Real-time System Event Push Notifications</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Notification History</button>
          <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Notification Settings</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Categories (Left) */}
        <div className="process-list-container" style={{ width: '220px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Filters</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {categories.map(c => (
              <li 
                key={c} 
                onClick={() => setFilterType(c)}
                style={{ 
                  padding: '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: filterType === c ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: filterType === c ? `3px solid ${getNotifColor(c)}` : '3px solid transparent',
                  color: filterType === c ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                {c} Notifications
              </li>
            ))}
          </ul>
        </div>

        {/* Notifications List (Center) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredNotifs.map(n => (
              <div 
                key={n.id}
                onClick={() => setSelectedNotif(n)}
                style={{
                  background: selectedNotif?.id === n.id ? 'rgba(0,229,255,0.1)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${selectedNotif?.id === n.id ? '#00e5ff' : 'rgba(255,255,255,0.05)'}`,
                  borderLeft: `4px solid ${getNotifColor(n.type)}`,
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: n.isRead ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!n.isRead && <div style={{ width: '8px', height: '8px', background: '#00e5ff', borderRadius: '50%' }}></div>}
                    <span style={{ fontWeight: 'bold', color: getNotifColor(n.type) }}>{n.type}</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>• {n.problem}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Device: {n.device}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Status: {n.status}</span>
                </div>
              </div>
            ))}
            {filteredNotifs.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No notifications found.</div>}
          </div>
        </div>

        {/* Notification Details (Right) */}
        {selectedNotif ? (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div>
              <span style={{ color: getNotifColor(selectedNotif.type), fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase' }}>{selectedNotif.type} NOTIFICATION</span>
              <h3 style={{ color: '#fff', fontSize: '1.3rem', marginTop: '0.25rem' }}>{selectedNotif.problem}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Notification Time:</span>
                <span>{selectedNotif.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Affected Device:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedNotif.device}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                <span style={{ color: selectedNotif.status === 'Active' ? '#ef4444' : '#10b981' }}>{selectedNotif.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Incident:</span>
                <span style={{ fontFamily: 'monospace', color: '#00e5ff' }}>{selectedNotif.incident}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Evidence Summary</h5>
              <div style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedNotif.evidence}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
              <button className="cc-btn" style={{ width: '100%', background: 'rgba(0, 229, 255, 0.2)', border: '1px solid #00e5ff', color: '#00e5ff' }}>
                OPEN INCIDENT
              </button>
              <button className="cc-btn" style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                VIEW EVIDENCE
              </button>
              <button className="cc-btn" style={{ width: '100%', background: 'transparent', border: '1px dashed #ef4444', color: '#ef4444', marginTop: '1rem' }} onClick={() => setSelectedNotif(null)}>
                DISMISS NOTIFICATION
              </button>
            </div>
          </div>
        ) : (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div>
              <Bell size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
              <p>Select a notification to view<br/>details and take action.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", notifications_view + "\nfunction App() {")

# Render NotificationsView based on activeTab
content = content.replace("{activeTab === 'fleet' && <FleetView />}", "{activeTab === 'fleet' && <FleetView />}\n        {activeTab === 'notifications' && <NotificationsView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

