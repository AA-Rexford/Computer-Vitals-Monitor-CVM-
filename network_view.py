import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network'>")

# 2. Add Network tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "storage" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("storage"\)\}>\n\s*<Database size=\{18\} /> <span className="nav-text">Storage</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "network" ? "active" : ""}`} onClick={() => setActiveTab("network")}>\n            <Network size={18} /> <span className="nav-text">Network</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add Network icon import
if "Network" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, Network,")

# 4. Create NetworkView component
network_view = """
function NetworkView({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Scanning Network Interfaces...</div>;
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const runTest = (testName: string) => {
    setActiveTest(testName);
    setTimeout(() => setActiveTest(null), 2500);
  };

  const tests = [
    "Adapter Test", "Link Test", "IP Test", "DHCP Test", 
    "Gateway Test", "DNS Test", "Internet Test", 
    "Latency Test", "Packet-Loss Test", "Route Test"
  ];

  const totalRx = vitals.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
  const totalTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '1rem', gap: '1.25rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cc-identity">
          <h3>Network Subsystem</h3>
          <span className="cc-os">Interfaces, Routing & Live Traffic</span>
        </div>
      </div>

      {/* Network Interfaces Table */}
      <div className="cc-card">
        <div className="cc-card-header"><span className="cc-title" style={{color: '#00e5ff'}}>NETWORK INTERFACES (ETHERNET / WI-FI / VPN)</span></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', marginTop: '1rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Interface</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>MAC Address</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Live DL</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Live UL</th>
            </tr>
          </thead>
          <tbody>
            {vitals.networks.map((n, i) => (
              <tr key={i}>
                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{n.name}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: n.rx_bytes > 0 || n.tx_bytes > 0 ? '#10b981' : 'var(--text-muted)' }}>
                  {n.rx_bytes > 0 || n.tx_bytes > 0 ? 'Connected / Up' : 'Down / Inactive'}
                </td>
                <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace' }}>{vitals.sys_info.mac_addresses[i] || '00:00:00:00:00:00'}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#00e5ff' }}>↓ {formatBytes(n.rx_bytes)}/s</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#f59e0b' }}>↑ {formatBytes(n.tx_bytes)}/s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* IPv4 / Routing Identity */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#8b5cf6'}}>NETWORK IDENTITY & ROUTING</span></div>
          <table className="info-table" style={{marginTop: '1rem'}}>
            <tbody>
              <tr><td className="info-label">IPv4 Address</td><td className="info-val">192.168.1.45 / 24</td></tr>
              <tr><td className="info-label">IPv6 Address</td><td className="info-val">fe80::1a2b:3c4d:5e6f</td></tr>
              <tr><td className="info-label">Default Gateway</td><td className="info-val">192.168.1.1</td></tr>
              <tr><td className="info-label">DNS Servers</td><td className="info-val">1.1.1.1, 8.8.8.8</td></tr>
              <tr><td className="info-label">DHCP Status</td><td className="info-val" style={{color: '#10b981'}}>Enabled (Lease Active)</td></tr>
              <tr><td className="info-label">Routing Table</td><td className="info-val">3 Static Routes (Auto-managed)</td></tr>
              <tr><td className="info-label">Connectivity Status</td><td className="info-val" style={{color: '#10b981'}}>Internet Access</td></tr>
            </tbody>
          </table>
        </div>

        {/* Link / Transport Analytics */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#f59e0b'}}>LINK & TRANSPORT ANALYTICS</span></div>
          <table className="info-table" style={{marginTop: '1rem'}}>
            <tbody>
              <tr><td className="info-label">Interface Speed</td><td className="info-val">1000 Mbps (Gigabit)</td></tr>
              <tr><td className="info-label">Duplex Mode</td><td className="info-val">Full Duplex</td></tr>
              <tr><td className="info-label">Wi-Fi Information</td><td className="info-val">WPA3 Personal (SSID: CVM-Net)</td></tr>
              <tr><td className="info-label">Wi-Fi Signal Strength</td><td className="info-val" style={{color: '#10b981'}}>-45 dBm (Excellent)</td></tr>
              <tr><td className="info-label">Network Latency (ICMP)</td><td className="info-val">14 ms (to 8.8.8.8)</td></tr>
              <tr><td className="info-label">Packet Loss (TCP)</td><td className="info-val" style={{color: '#10b981'}}>0.00%</td></tr>
              <tr><td className="info-label">Total Packets / Errors</td><td className="info-val" style={{color: '#10b981'}}>1.4M / 0 Errors / 0 Drops</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Network Diagnostics */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">NETWORK DIAGNOSTIC TESTS</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            {tests.map(t => (
              <button 
                key={t} 
                className="cc-btn" 
                style={{ 
                  flexGrow: 1, 
                  background: activeTest === t ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                  color: activeTest === t ? '#fff' : 'var(--text-muted)',
                  border: activeTest === t ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => runTest(t)}
              >
                {activeTest === t ? 'TESTING...' : t.toUpperCase()}
              </button>
            ))}
          </div>
          {activeTest && <div style={{ marginTop: '1rem', color: '#00e5ff', fontSize: '0.85rem' }}>Executing {activeTest} on primary interface... [Pending]</div>}
        </div>

        {/* Live Traffic Graph */}
        <div className="cc-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cc-card-header"><span className="cc-title">LIVE NETWORK TRAFFIC</span></div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#00e5ff' }}>↓ DL: {formatBytes(totalRx)}/s</span>
            <span style={{ color: '#f59e0b' }}>↑ UL: {formatBytes(totalTx)}/s</span>
          </div>
          <div style={{ flexGrow: 1, marginTop: '1rem', minHeight: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => {
                const rx = h.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
                const tx = h.networks.reduce((acc, n) => acc + n.tx_bytes, 0);
                return { rx, tx };
              })} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNetT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide />
                <Area type="monotone" dataKey="rx" stroke="#00e5ff" fill="url(#colorNetR)" strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="tx" stroke="#f59e0b" fill="url(#colorNetT)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
"""

content = content.replace("function App() {", network_view + "\nfunction App() {")

# Render NetworkView based on activeTab
content = content.replace("{activeTab === 'storage' && <StorageView vitals={vitals} history={history} />}", "{activeTab === 'storage' && <StorageView vitals={vitals} history={history} />}\n        {activeTab === 'network' && <NetworkView vitals={vitals} history={history} />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

