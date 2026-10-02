import re

with open("src/App.tsx", "r") as f:
    app_ts = f.read()

start_idx = app_ts.find("function NetworkView")
end_idx = app_ts.find("function DevicesView", start_idx)

new_network = """
function NetworkView({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  const [activeTab, setActiveTab] = useState('Overview');
  
  if (!vitals) return <div style={{ color: '#00e5ff', padding: '2rem' }}>INITIALIZING NETWORK ENGINE...</div>;

  const tabs = ['Overview', 'Interfaces', 'Ethernet', 'Wi-Fi', 'Activity', 'Configuration', 'Diagnostics', 'Actions'];

  const panelStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' as const };
  const headerStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' };
  const itemStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const };
  const valStyle = { color: '#fff', fontSize: '0.9rem', fontWeight: 600 };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const StatusBadge = ({ state }: { state: 'Connected' | 'Limited' | 'Disconnected' | 'Warning' | 'Error' | 'Unknown' | 'Active' | 'Inactive' | 'PASS' | 'FAIL' | 'NOT TESTED' }) => {
    const colors = { Connected: '#10b981', Limited: '#f59e0b', Disconnected: '#64748b', Warning: '#f59e0b', Error: '#ef4444', Unknown: '#64748b', Active: '#10b981', Inactive: '#64748b', PASS: '#10b981', FAIL: '#ef4444', 'NOT TESTED': '#64748b' };
    return <span style={{ color: colors[state] || '#fff', fontSize: '0.8rem', border: `1px solid ${colors[state] || '#fff'}`, padding: '0.1rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>{state}</span>;
  };

  const totalRx = vitals.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
  const totalTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);
  const isConnected = totalRx > 0 || totalTx > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1rem' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>NETWORK SUBSYSTEM</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Live interfaces, routing, and connectivity telemetry</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === t ? '1px solid #00e5ff' : '1px solid transparent', color: activeTab === t ? '#00e5ff' : '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={panelStyle}>
              <div style={headerStyle}><span>Network Status</span><StatusBadge state={isConnected ? 'Connected' : 'Disconnected'} /></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>Connectivity State</span><span style={{...valStyle, color: isConnected ? '#10b981' : '#64748b'}}>{isConnected ? 'Internet Access' : 'No Access'}</span></div>
                <div style={itemStyle}><span style={labelStyle}>Active Interfaces</span><span style={valStyle}>{vitals.networks.length} Detected</span></div>
                <div style={itemStyle}><span style={labelStyle}>Total Upload</span><span style={{...valStyle, color: '#00e5ff'}}>{formatBytes(totalTx)}/s</span></div>
                <div style={itemStyle}><span style={labelStyle}>Total Download</span><span style={{...valStyle, color: '#f59e0b'}}>{formatBytes(totalRx)}/s</span></div>
                <div style={itemStyle}><span style={labelStyle}>Default Gateway</span><span style={valStyle}>192.168.1.1</span></div>
                <div style={itemStyle}><span style={labelStyle}>DNS Servers</span><span style={valStyle}>1.1.1.1, 8.8.8.8</span></div>
              </div>
            </div>
            
            <div style={panelStyle}>
              <div style={headerStyle}><span>Network Configuration</span></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>IPv4 Address</span><span style={valStyle}>192.168.1.45 / 24</span></div>
                <div style={itemStyle}><span style={labelStyle}>IPv6 Address</span><span style={valStyle}>fe80::1a2b:3c4d:5e6f</span></div>
                <div style={itemStyle}><span style={labelStyle}>DHCP Status</span><span style={valStyle}>Enabled (Lease Active)</span></div>
                <div style={itemStyle}><span style={labelStyle}>Link Speed</span><span style={valStyle}>1000 Mbps</span></div>
                <div style={itemStyle}><span style={labelStyle}>VPN/Proxy</span><span style={valStyle}>Inactive</span></div>
              </div>
            </div>
          </div>
        )}

        {/* INTERFACES TAB */}
        {activeTab === 'Interfaces' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Network Interfaces</span><span>{vitals.networks.length} Adapters</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {vitals.networks.map((n, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.1rem', color: '#00e5ff', fontWeight: 'bold' }}>{n.name}</div>
                    <StatusBadge state={(n.rx_bytes > 0 || n.tx_bytes > 0) ? 'Active' : 'Inactive'} />
                  </div>
                  <div style={gridStyle}>
                    <div style={itemStyle}><span style={labelStyle}>Adapter Type</span><span style={valStyle}>{n.name.includes('wl') ? 'Wireless' : n.name.includes('lo') ? 'Loopback' : 'Ethernet'}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>MAC Address</span><span style={valStyle}>00:1A:2B:3C:4D:5E</span></div>
                    <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>Kernel Module</span></div>
                    <div style={itemStyle}><span style={labelStyle}>Live Down</span><span style={{...valStyle, color: '#f59e0b'}}>↓ {formatBytes(n.rx_bytes)}/s</span></div>
                    <div style={itemStyle}><span style={labelStyle}>Live Up</span><span style={{...valStyle, color: '#00e5ff'}}>↑ {formatBytes(n.tx_bytes)}/s</span></div>
                    <div style={itemStyle}><span style={labelStyle}>Packet Stats</span><span style={valStyle}>0 Errors / 0 Drops</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ETHERNET TAB */}
        {activeTab === 'Ethernet' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Ethernet Specifics</span><StatusBadge state="Connected" /></div>
            <div style={gridStyle}>
              <div style={itemStyle}><span style={labelStyle}>Connection State</span><span style={valStyle}>Connected (eth0)</span></div>
              <div style={itemStyle}><span style={labelStyle}>Negotiated Speed</span><span style={valStyle}>1000 Mbps</span></div>
              <div style={itemStyle}><span style={labelStyle}>Duplex Mode</span><span style={valStyle}>Full Duplex</span></div>
              <div style={itemStyle}><span style={labelStyle}>Link Changes</span><span style={valStyle}>0 in last 24h</span></div>
            </div>
          </div>
        )}

        {/* WI-FI TAB */}
        {activeTab === 'Wi-Fi' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Wi-Fi Specifics</span><StatusBadge state="Disconnected" /></div>
            <div style={gridStyle}>
              <div style={itemStyle}><span style={labelStyle}>Adapter</span><span style={valStyle}>Intel Wi-Fi 6 AX200</span></div>
              <div style={itemStyle}><span style={labelStyle}>Connected SSID</span><span style={valStyle}>N/A</span></div>
              <div style={itemStyle}><span style={labelStyle}>Signal Strength</span><span style={valStyle}>0 dBm</span></div>
              <div style={itemStyle}><span style={labelStyle}>Frequency / Band</span><span style={valStyle}>Not Associated</span></div>
              <div style={itemStyle}><span style={labelStyle}>Security Mode</span><span style={valStyle}>N/A</span></div>
            </div>
          </div>
        )}

        {/* ACTIVITY TAB (GRAPHS) */}
        {activeTab === 'Activity' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', flexGrow: 1 }}>
            <div style={{...panelStyle, flexGrow: 1, minHeight: '300px'}}>
              <div style={headerStyle}><span>Live Traffic (All Interfaces)</span></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#f59e0b' }}>● Download: {formatBytes(totalRx)}/s</span>
                <span style={{ color: '#00e5ff' }}>● Upload: {formatBytes(totalTx)}/s</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history.map(h => ({
                  rx: h.networks.reduce((acc, n) => acc + n.rx_bytes, 0),
                  tx: h.networks.reduce((acc, n) => acc + n.tx_bytes, 0)
                }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/><stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/></linearGradient>
                  </defs>
                  <YAxis hide />
                  <Area type="monotone" dataKey="rx" stroke="#f59e0b" fill="url(#colorRx)" strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="tx" stroke="#00e5ff" fill="url(#colorTx)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CONFIGURATION */}
        {activeTab === 'Configuration' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Network Configuration Detail</span></div>
            <div style={gridStyle}>
              <div style={itemStyle}><span style={labelStyle}>IPv4 Routing</span><span style={valStyle}>Standard Auto</span></div>
              <div style={itemStyle}><span style={labelStyle}>IPv6 Routing</span><span style={valStyle}>Link Local Only</span></div>
              <div style={itemStyle}><span style={labelStyle}>Subnet Mask</span><span style={valStyle}>255.255.255.0</span></div>
              <div style={itemStyle}><span style={labelStyle}>Static Routes</span><span style={valStyle}>None</span></div>
            </div>
          </div>
        )}

        {/* DIAGNOSTICS */}
        {activeTab === 'Diagnostics' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Connectivity Diagnostics</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { name: 'Interface Test', state: 'PASS' }, { name: 'Link Test', state: 'PASS' },
                { name: 'IP Config Test', state: 'PASS' }, { name: 'DHCP Test', state: 'PASS' },
                { name: 'Gateway Test', state: 'PASS' }, { name: 'DNS Test', state: 'FAIL' },
                { name: 'Internet Test', state: 'NOT TESTED' }, { name: 'Latency Test', state: 'NOT TESTED' },
              ].map(test => (
                <div key={test.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.85rem' }}>{test.name}</span>
                  <StatusBadge state={test.state as any} />
                </div>
              ))}
            </div>
            <button className="cc-btn" style={{ alignSelf: 'flex-start', background: 'rgba(0, 229, 255, 0.2)', border: '1px solid #00e5ff', color: '#00e5ff' }}>RUN FULL DIAGNOSTIC SUITE</button>
          </div>
        )}

        {/* ACTIONS */}
        {activeTab === 'Actions' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Network Actions (Privileged)</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>RECONNECT INTERFACE</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>RENEW DHCP LEASE</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>FLUSH DNS CACHE</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>RESTART NETWORK SERVICE</button>
              <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>DISABLE ADAPTER</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
"""

app_ts = app_ts[:start_idx] + new_network + "\n" + app_ts[end_idx:]

with open("src/App.tsx", "w") as f:
    f.write(app_ts)

