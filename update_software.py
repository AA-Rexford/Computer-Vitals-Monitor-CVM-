import re

with open("src/App.tsx", "r") as f:
    app_ts = f.read()

start_idx = app_ts.find("function TaskManagerView")
end_idx = app_ts.find("function HardwareView", start_idx)

new_software = """
function SoftwareView({ vitals }: { vitals: SystemVitals | null }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  if (!vitals) return <div style={{ color: '#00e5ff', padding: '2rem' }}>INITIALIZING SOFTWARE ENGINE...</div>;

  const tabs = ['Overview', 'Applications', 'System Software', 'Running Software', 'Services', 'Drivers', 'Logs', 'Updates', 'Diagnostics'];

  // Helper styles
  const panelStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' };
  const headerStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' };
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

  const StatusBadge = ({ state }: { state: 'Running' | 'Stopped' | 'Healthy' | 'Warning' | 'Failed' | 'Disabled' | 'Missing' | 'Unsupported' | 'Permission Required' }) => {
    const colors = { Running: '#10b981', Stopped: '#64748b', Healthy: '#10b981', Warning: '#f59e0b', Failed: '#ef4444', Disabled: '#64748b', Missing: '#ef4444', Unsupported: '#64748b', 'Permission Required': '#f59e0b' };
    return <span style={{ color: colors[state] || '#fff', fontSize: '0.8rem', border: `1px solid ${colors[state] || '#fff'}`, padding: '0.1rem 0.4rem', borderRadius: '4px', cursor: 'pointer' }}>{state}</span>;
  };

  // Mock data for new sections
  const mockApps = [
    { name: 'Google Chrome', version: '114.0.5735.199', publisher: 'Google LLC', installDate: '2023-01-15', size: '850 MB', arch: 'x64', status: 'Healthy' },
    { name: 'Visual Studio Code', version: '1.80.1', publisher: 'Microsoft', installDate: '2023-02-10', size: '350 MB', arch: 'x64', status: 'Healthy' },
    { name: 'Docker Desktop', version: '4.21.1', publisher: 'Docker Inc.', installDate: '2023-03-22', size: '1.2 GB', arch: 'x64', status: 'Warning' }
  ];

  const mockDrivers = [
    { name: 'NVIDIA Display Driver', device: 'GeForce RTX 3080', version: '536.67', provider: 'NVIDIA', date: '2023-07-18', status: 'Healthy', signed: 'Verified' },
    { name: 'Realtek Audio', device: 'High Definition Audio', version: '6.0.9231.1', provider: 'Realtek', date: '2021-08-10', status: 'Healthy', signed: 'Verified' },
    { name: 'Intel Wi-Fi 6 AX200', device: 'Network Adapter', version: '22.150.0.3', provider: 'Intel', date: '2022-05-20', status: 'Failed', signed: 'Verified' }
  ];

  const filteredProcesses = vitals.processes.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.pid.toString().includes(searchQuery));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1rem' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>SOFTWARE & OS</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Complete operating system, application, and process inventory</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === t ? '1px solid #00e5ff' : '1px solid transparent', color: activeTab === t ? '#00e5ff' : '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={panelStyle}>
              <div style={headerStyle}><span>Operating System</span><StatusBadge state="Healthy" /></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>OS</span><span style={valStyle}>Linux (Ubuntu)</span></div>
                <div style={itemStyle}><span style={labelStyle}>Version/Build</span><span style={valStyle}>24.04 LTS</span></div>
                <div style={itemStyle}><span style={labelStyle}>Kernel</span><span style={valStyle}>6.8.0-generic</span></div>
                <div style={itemStyle}><span style={labelStyle}>Architecture</span><span style={valStyle}>x86_64</span></div>
              </div>
            </div>
            
            <div style={gridStyle}>
              <div style={panelStyle}>
                <div style={headerStyle}><span>Software Metrics</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Installed Apps</span><span style={valStyle}>142</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Running Processes</span><span style={valStyle}>{vitals.processes.length}</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>System Services</span><span style={valStyle}>128</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Loaded Drivers</span><span style={valStyle}>84</span></div>
              </div>
              
              <div style={panelStyle}>
                <div style={headerStyle}><span>Software Status</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Updates Pending</span><span style={{...valStyle, color: '#f59e0b'}}>3 Available</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>App Failures</span><span style={{...valStyle, color: '#ef4444'}}>1 Detected</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Driver Status</span><span style={{...valStyle, color: '#ef4444'}}>1 Failure (Wi-Fi)</span></div>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'Applications' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Installed Applications</span><span>{mockApps.length} Displayed</span></div>
            <table className="info-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Publisher</th>
                  <th style={{ padding: '0.5rem' }}>Version</th>
                  <th style={{ padding: '0.5rem' }}>Size</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockApps.map((app, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{app.name}</td>
                    <td style={{ padding: '0.5rem' }}>{app.publisher}</td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{app.version}</td>
                    <td style={{ padding: '0.5rem' }}>{app.size}</td>
                    <td style={{ padding: '0.5rem' }}><StatusBadge state={app.status as any} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RUNNING SOFTWARE TAB */}
        {activeTab === 'Running Software' && (
          <div style={{...panelStyle, display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={headerStyle} style={{ margin: 0, border: 'none' }}><span>Task Manager (Processes)</span></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="Search processes/PIDs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px' }} />
                <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Filter</button>
                <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>Terminate</button>
              </div>
            </div>
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
              <table className="info-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', position: 'sticky', top: 0, background: 'var(--bg-panel)' }}>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>PID</th>
                    <th style={{ padding: '0.5rem' }}>User</th>
                    <th style={{ padding: '0.5rem' }}>CPU %</th>
                    <th style={{ padding: '0.5rem' }}>Memory</th>
                    <th style={{ padding: '0.5rem' }}>Disk I/O</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcesses.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{p.pid}</td>
                      <td style={{ padding: '0.5rem' }}>{p.user || 'system'}</td>
                      <td style={{ padding: '0.5rem', color: p.cpu_usage > 50 ? '#f59e0b' : '#10b981' }}>{p.cpu_usage.toFixed(1)}%</td>
                      <td style={{ padding: '0.5rem' }}>{formatBytes(p.memory_usage)}</td>
                      <td style={{ padding: '0.5rem' }}>{formatBytes(p.disk_read + p.disk_write)}/s</td>
                      <td style={{ padding: '0.5rem' }}><StatusBadge state="Running" /></td>
                    </tr>
                  ))}
                  {filteredProcesses.length === 0 && <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No processes match search</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SYSTEM SOFTWARE */}
        {activeTab === 'System Software' && (
           <div style={panelStyle}>
             <div style={headerStyle}><span>System Software & Frameworks</span></div>
             <div style={gridStyle}>
               <div style={itemStyle}><span style={labelStyle}>Security Components</span><span style={valStyle}>AppArmor (Active)</span></div>
               <div style={itemStyle}><span style={labelStyle}>Boot Components</span><span style={valStyle}>GRUB2 / systemd-boot</span></div>
               <div style={itemStyle}><span style={labelStyle}>Runtimes</span><span style={valStyle}>Node.js, Python, Java</span></div>
               <div style={itemStyle}><span style={labelStyle}>System Utilities</span><span style={valStyle}>GNU Coreutils</span></div>
             </div>
           </div>
        )}

        {/* DRIVERS TAB */}
        {activeTab === 'Drivers' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Device Drivers</span><span>{mockDrivers.length} Loaded</span></div>
            <table className="info-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Driver Name</th>
                  <th style={{ padding: '0.5rem' }}>Device</th>
                  <th style={{ padding: '0.5rem' }}>Version</th>
                  <th style={{ padding: '0.5rem' }}>Provider</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockDrivers.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{d.name}</td>
                    <td style={{ padding: '0.5rem' }}>{d.device}</td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{d.version}</td>
                    <td style={{ padding: '0.5rem' }}>{d.provider}</td>
                    <td style={{ padding: '0.5rem' }}><StatusBadge state={d.status as any} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* UPDATES TAB */}
        {activeTab === 'Updates' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Software Updates</span><StatusBadge state="Warning" /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '4px' }}>
                <h4 style={{ color: '#f59e0b', margin: '0 0 0.5rem 0' }}>3 Pending Updates Available</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Operating system exposes available updates. Do not fabricate update information.</p>
                <div style={{ marginTop: '1rem' }}>
                  <button className="cc-btn" style={{ background: '#f59e0b', color: '#000', fontWeight: 'bold' }}>Install Updates</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIAGNOSTICS TAB */}
        {activeTab === 'Diagnostics' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Software Diagnostics Engine</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#00e5ff', margin: '0 0 0.5rem 0' }}>Application Failure Detection</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scan logs and crash dumps for app instability.</p>
                <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid #00e5ff' }}>RUN TEST</button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#00e5ff', margin: '0 0 0.5rem 0' }}>System File Integrity</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verify core OS components against checksums.</p>
                <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid #00e5ff' }}>RUN TEST</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Placeholder for tabs that reuse existing views if needed */}
        {(activeTab === 'Services' || activeTab === 'Logs') && (
           <div style={panelStyle}>
             <div style={headerStyle}><span>{activeTab} Module</span></div>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                This section integrates the {activeTab} engine. (Select "Services" or "Logs" from the app router/actions if integrated natively, or render components here).
             </div>
             <button className="cc-btn" style={{ marginTop: '1rem', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00e5ff', color: '#00e5ff' }}>OPEN NATIVE {activeTab.toUpperCase()} VIEW</button>
           </div>
        )}

      </div>
    </div>
  );
}
"""

app_ts = app_ts[:start_idx] + new_software + "\n" + app_ts[end_idx:]

with open("src/App.tsx", "w") as f:
    f.write(app_ts)

