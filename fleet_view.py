import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet'>")

# 2. Add Fleet tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "discovery" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("discovery"\)\}>\n\s*<Radar size=\{18\} /> <span className="nav-text">Discovery</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "fleet" ? "active" : ""}`} onClick={() => setActiveTab("fleet")}>\n            <Server size={18} /> <span className="nav-text">Fleet</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add Server icon import
if "Server" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, Server,")

# 4. Create FleetView component
fleet_view = """
function FleetView() {
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [filterType, setFilterType] = useState('All Managed Devices');

  const fleetData = [
    { name: 'CVM-WORKSTATION', type: 'Computers', location: 'HQ - Floor 2', os: 'Linux 6.8', cpu: 'Ryzen 9', ram: '64GB', storage: '2TB', network: 'Online', lastSeen: 'Just now', agent: 'Connected', incidents: 0, health: 'Healthy' },
    { name: 'SQL-PROD-01', type: 'Servers', location: 'Data Center Alpha', os: 'Windows Server 2022', cpu: 'Dual Xeon', ram: '256GB', storage: '12TB RAID', network: 'Online', lastSeen: 'Just now', agent: 'Connected', incidents: 1, health: 'Warning' },
    { name: 'WEB-NODE-B', type: 'Servers', location: 'AWS eu-west-1', os: 'Ubuntu 22.04', cpu: 'AWS Graviton', ram: '16GB', storage: '100GB EBS', network: 'Online', lastSeen: 'Just now', agent: 'Connected', incidents: 0, health: 'Healthy' },
    { name: 'HR-PRINTER-4', type: 'Printers', location: 'HQ - Floor 3', os: 'Firmware 4.1', cpu: 'N/A', ram: '512MB', storage: 'N/A', network: 'Offline', lastSeen: '14 hours ago', agent: 'Unmanaged (SNMP)', incidents: 1, health: 'Critical' },
    { name: 'CORE-SWITCH-01', type: 'Network devices', location: 'Data Center Alpha', os: 'Cisco IOS', cpu: 'ARM', ram: '2GB', storage: 'NVRAM', network: 'Online', lastSeen: 'Just now', agent: 'SNMP', incidents: 0, health: 'Healthy' },
    { name: 'SEC-CAM-EXT', type: 'Other managed devices', location: 'HQ - Parking Lot', os: 'RTOS', cpu: 'ARM', ram: '128MB', storage: 'SD', network: 'Online', lastSeen: '2 mins ago', agent: 'Ping Only', incidents: 0, health: 'Attention' }
  ];

  const types = ['All Managed Devices', 'Computers', 'Servers', 'Printers', 'Network devices', 'Other managed devices'];
  
  const filteredFleet = filterType === 'All Managed Devices' ? fleetData : fleetData.filter(d => d.type === filterType);

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Top Health Dashboard */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Global Fleet Management</h3>
          <span className="cc-os">Organization: Acme Corp | Locations: 3 Active Sites</span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Devices</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>142</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontSize: '0.8rem', textTransform: 'uppercase' }}>Healthy</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981' }}>128</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#f59e0b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Attention / Warning</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f59e0b' }}>9</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', fontSize: '0.8rem', textTransform: 'uppercase' }}>Critical / Offline</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ef4444' }}>5</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Device Categories (Left) */}
        <div className="process-list-container" style={{ width: '250px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Device Filters</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {types.map(t => (
              <li 
                key={t} 
                onClick={() => setFilterType(t)}
                style={{ 
                  padding: '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: filterType === t ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: filterType === t ? '3px solid #00e5ff' : '3px solid transparent',
                  color: filterType === t ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Fleet Ledger (Center) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Device Name</th>
                <th style={{ padding: '0.5rem' }}>Location</th>
                <th style={{ padding: '0.5rem' }}>OS</th>
                <th style={{ padding: '0.5rem' }}>Hardware (CPU/RAM/Storage)</th>
                <th style={{ padding: '0.5rem' }}>Network</th>
                <th style={{ padding: '0.5rem' }}>Health</th>
              </tr>
            </thead>
            <tbody>
              {filteredFleet.map((dev, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedDevice(dev)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedDevice?.name === dev.name ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    opacity: dev.network === 'Offline' ? 0.5 : 1
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{dev.name}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{dev.location}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{dev.os}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{dev.cpu} / {dev.ram} / {dev.storage}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: dev.network === 'Online' ? '#10b981' : '#ef4444' }}>{dev.network}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ 
                      background: dev.health === 'Healthy' ? '#10b98133' : dev.health === 'Critical' ? '#ef444433' : '#f59e0b33', 
                      color: dev.health === 'Healthy' ? '#10b981' : dev.health === 'Critical' ? '#ef4444' : '#f59e0b', 
                      padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' 
                    }}>{dev.health}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fleet Details (Right) */}
        {selectedDevice && (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedDevice.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedDevice.type}</span>
            </div>

            <div>
              <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>{selectedDevice.location}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedDevice.os}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Network Status:</span>
                <span style={{ color: selectedDevice.network === 'Online' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{selectedDevice.network}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Seen:</span>
                <span>{selectedDevice.lastSeen}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Agent Status:</span>
                <span style={{ color: selectedDevice.agent.includes('Connected') ? '#10b981' : 'var(--text-muted)' }}>{selectedDevice.agent}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Open Incidents:</span>
                <span style={{ color: selectedDevice.incidents > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{selectedDevice.incidents} Active</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Device Details</h5>
              <div style={{ color: '#fff', fontSize: '0.85rem' }}>CPU: {selectedDevice.cpu}<br/>RAM: {selectedDevice.ram}<br/>Storage: {selectedDevice.storage}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${selectedDevice.health === 'Healthy' ? '#10b981' : selectedDevice.health === 'Critical' ? '#ef4444' : '#f59e0b'}` }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Device Health & History</h5>
              <div style={{ color: '#fff', fontSize: '0.85rem' }}>
                Current Status: <strong>{selectedDevice.health}</strong><br/>
                [History] Patch compliant. No hardware faults in last 30 days.
              </div>
            </div>

            <button className="cc-btn" style={{ marginTop: 'auto' }}>
              OPEN DEVICE DASHBOARD
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", fleet_view + "\nfunction App() {")

# Render FleetView based on activeTab
content = content.replace("{activeTab === 'discovery' && <DiscoveryView />}", "{activeTab === 'discovery' && <DiscoveryView />}\n        {activeTab === 'fleet' && <FleetView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

