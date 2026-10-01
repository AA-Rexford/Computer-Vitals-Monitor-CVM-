import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery'>")

# 2. Add Discovery tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "actions" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("actions"\)\}>\n\s*<Wrench size=\{18\} /> <span className="nav-text">Actions</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "discovery" ? "active" : ""}`} onClick={() => setActiveTab("discovery")}>\n            <Radar size={18} /> <span className="nav-text">Discovery</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add Radar icon import
if "Radar" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, Radar,")

# 4. Create DiscoveryView component
discovery_view = """
function DiscoveryView() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return p + 2;
      });
    }, 50);
  };

  const discoveredDevices = [
    { ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:01', hostname: 'Router-Main', vendor: 'Netgear', type: 'Gateway', status: 'Online', response: '1ms', services: '80 (HTTP), 443 (HTTPS), 53 (DNS)', firstSeen: '2026-09-01', lastSeen: 'Just now', rel: 'Default Gateway' },
    { ip: '192.168.1.45', mac: 'AA:BB:CC:DD:EE:02', hostname: 'CVM-WORKSTATION', vendor: 'Realtek', type: 'Computer', status: 'Online', response: '<1ms', services: '22 (SSH)', firstSeen: '2026-09-10', lastSeen: 'Just now', rel: 'Localhost (This PC)' },
    { ip: '192.168.1.102', mac: 'AA:BB:CC:DD:EE:03', hostname: 'Android-Phone', vendor: 'Samsung', type: 'Mobile', status: 'Online', response: '42ms', services: 'None detected', firstSeen: '2026-09-28', lastSeen: '2 mins ago', rel: 'Wireless Client' },
    { ip: '192.168.1.115', mac: 'AA:BB:CC:DD:EE:04', hostname: 'SmartTV-LivingRoom', vendor: 'LG Electronics', type: 'IoT / Media', status: 'Offline', response: 'Timeout', services: '8000 (HTTP API)', firstSeen: '2026-09-05', lastSeen: '5 hours ago', rel: 'Wireless Client' },
    { ip: '192.168.1.200', mac: 'AA:BB:CC:DD:EE:05', hostname: 'NAS-Storage', vendor: 'Synology', type: 'Storage', status: 'Online', response: '3ms', services: '445 (SMB), 5000 (DSM)', firstSeen: '2026-09-02', lastSeen: 'Just now', rel: 'Wired LAN Client' }
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header & Controls */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Network Discovery</h3>
          <span className="cc-os">LAN Topology & Asset Identification</span>
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <div><strong style={{color: 'var(--text-muted)'}}>Active Interface:</strong> eth0 (192.168.1.45)</div>
            <div><strong style={{color: 'var(--text-muted)'}}>Authorized Range:</strong> 192.168.1.0/24</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '200px' }}>
          <button 
            className="cc-btn" 
            onClick={startScan}
            style={{ width: '100%', background: isScanning ? 'rgba(0, 229, 255, 0.2)' : '#00e5ff', color: isScanning ? '#00e5ff' : '#000', border: '1px solid #00e5ff', fontWeight: 'bold' }}
          >
            {isScanning ? 'SCANNING...' : 'START DISCOVERY SCAN'}
          </button>
          
          {isScanning && (
            <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${scanProgress}%`, background: '#00e5ff', transition: 'width 0.1s linear' }}></div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Device List (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>IP Address</th>
                <th style={{ padding: '0.5rem' }}>Hostname</th>
                <th style={{ padding: '0.5rem' }}>Device Type</th>
                <th style={{ padding: '0.5rem' }}>Vendor</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {discoveredDevices.map((dev, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedDevice(dev)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedDevice?.ip === dev.ip ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    opacity: dev.status === 'Offline' ? 0.5 : 1
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{dev.ip}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{dev.hostname}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{dev.type}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{dev.vendor}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: dev.status === 'Online' ? '#10b981' : '#ef4444' }}>{dev.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <h5 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>Discovery History & Topology</h5>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              [History] Last full sweep completed yesterday at 23:00.<br/>
              [Topology] 5 nodes discovered in star topology originating from Gateway 192.168.1.1.
            </div>
          </div>
        </div>

        {/* Device Details (Right) */}
        {selectedDevice ? (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'monospace' }}>{selectedDevice.ip}</span>
              <span style={{ background: selectedDevice.status === 'Online' ? '#10b98133' : '#ef444433', color: selectedDevice.status === 'Online' ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedDevice.status.toUpperCase()}</span>
            </div>

            <div>
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedDevice.hostname}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedDevice.vendor} • {selectedDevice.type}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>MAC Address:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedDevice.mac}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Response Time:</span>
                <span style={{ color: selectedDevice.response === 'Timeout' ? '#ef4444' : '#10b981' }}>{selectedDevice.response}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>First Seen:</span>
                <span>{selectedDevice.firstSeen}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Seen:</span>
                <span>{selectedDevice.lastSeen}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Open Services</h5>
              <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedDevice.services}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Network Relationship</h5>
              <div style={{ color: '#fff', fontSize: '0.85rem' }}>{selectedDevice.rel}</div>
            </div>

            <button className="cc-btn" style={{ marginTop: 'auto' }}>
              RUN PORT SCAN
            </button>
          </div>
        ) : (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div>
              <Radar size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
              <p>Select a discovered device to view<br/>deep inspection details.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", discovery_view + "\nfunction App() {")

# Render DiscoveryView based on activeTab
content = content.replace("{activeTab === 'actions' && <ActionsView />}", "{activeTab === 'actions' && <ActionsView />}\n        {activeTab === 'discovery' && <DiscoveryView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

