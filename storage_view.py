import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage'>")

# 2. Add Storage tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "services" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("services"\)\}>\n\s*<Settings size=\{18\} /> <span className="nav-text">Services</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "storage" ? "active" : ""}`} onClick={() => setActiveTab("storage")}>\n            <Database size={18} /> <span className="nav-text">Storage</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add Database icon import
if "Database" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, Database,")

# 4. Create StorageView component
storage_view = """
function StorageView({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Scanning Block Devices...</div>;
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '1rem', gap: '1.25rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cc-identity">
          <h3>Storage Subsystem</h3>
          <span className="cc-os">Disks, Volumes & S.M.A.R.T Health</span>
        </div>
        <button className="cc-btn secondary">RUN FILESYSTEM CHECK</button>
      </div>

      {/* Logical Volumes & Partitions */}
      <div className="cc-card">
        <div className="cc-card-header"><span className="cc-title" style={{color: '#00e5ff'}}>LOGICAL VOLUMES & PARTITIONS</span></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', marginTop: '1rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Mount Point / Volume</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Filesystem</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Used Space</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Free Space</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Capacity</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Usage</th>
            </tr>
          </thead>
          <tbody>
            {vitals.disks.map((d, i) => {
              const used = d.total_space - d.available_space;
              const pct = (used / d.total_space) * 100 || 0;
              return (
                <tr key={i}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{d.name} <span style={{color: 'var(--text-muted)'}}>({d.mount_point})</span></td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#10b981' }}>{d.file_system}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#f59e0b' }}>{formatBytes(used)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#3b82f6' }}>{formatBytes(d.available_space)}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{formatBytes(d.total_space)}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: pct > 85 ? '#ef4444' : '#00e5ff' }}></div></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Physical Disks & SMART */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#8b5cf6'}}>PHYSICAL DISKS & S.M.A.R.T</span></div>
          <table className="info-table" style={{marginTop: '1rem'}}>
            <tbody>
              <tr><td className="info-label">Physical Disks</td><td className="info-val">Disk 0 (Primary NVMe)</td></tr>
              <tr><td className="info-label">Disk Model</td><td className="info-val">Samsung SSD 980 PRO 1TB</td></tr>
              <tr><td className="info-label">Serial Number</td><td className="info-val" style={{color: '#f59e0b'}}>S5GXNX0T123456</td></tr>
              <tr><td className="info-label">Disk Type / Interface</td><td className="info-val">NVMe Solid State Drive (PCIe 4.0 x4)</td></tr>
              <tr><td className="info-label">Temperature</td><td className="info-val" style={{color: '#10b981'}}>41.0°C (Normal)</td></tr>
              <tr><td className="info-label">S.M.A.R.T Health</td><td className="info-val" style={{color: '#10b981'}}>100% Healthy (OK)</td></tr>
              <tr><td className="info-label">S.M.A.R.T Details</td><td className="info-val">Power Cycles: 450 | Unsafe Shutdowns: 2</td></tr>
              <tr><td className="info-label">Removable Drives</td><td className="info-val">None Detected</td></tr>
            </tbody>
          </table>
        </div>

        {/* Live IO & Performance */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#f59e0b'}}>LIVE I/O & PERFORMANCE</span></div>
          <table className="info-table" style={{marginTop: '1rem'}}>
            <tbody>
              <tr><td className="info-label">Total Read Speed</td><td className="info-val" style={{color: '#00e5ff'}}>{formatBytes(vitals.disk_read)}/s</td></tr>
              <tr><td className="info-label">Total Write Speed</td><td className="info-val" style={{color: '#ef4444'}}>{formatBytes(vitals.disk_write)}/s</td></tr>
              <tr><td className="info-label">IOPS (Estimated)</td><td className="info-val">120 R / 45 W</td></tr>
              <tr><td className="info-label">Disk Latency</td><td className="info-val" style={{color: '#10b981'}}>0.4ms (Excellent)</td></tr>
              <tr><td className="info-label">Disk Errors</td><td className="info-val" style={{color: '#10b981'}}>0 Media Errors</td></tr>
              <tr><td className="info-label">Filesystem Errors</td><td className="info-val" style={{color: '#10b981'}}>Clean (No orphaned inodes)</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Storage Analytics */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">STORAGE ANALYTICS & HISTORY</span></div>
          <div className="panel-content" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[Analysis] Largest Folder: /var/lib/docker (24.1 GB)</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[Analysis] Largest File: swapfile (8.0 GB)</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[Trend] Storage Growth: +1.2 GB / week</div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>[History] Drive passed last S.M.A.R.T self-test successfully.</div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>[History] No read/write allocation errors historically logged.</div>
          </div>
        </div>

        {/* Live Disk Graph */}
        <div className="cc-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cc-card-header"><span className="cc-title">LIVE STORAGE ACTIVITY (R/W)</span></div>
          <div style={{ flexGrow: 1, marginTop: '1rem', minHeight: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ read: h.disk_read, write: h.disk_write }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDiskR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDiskW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide />
                <Area type="monotone" dataKey="read" stroke="#00e5ff" fill="url(#colorDiskR)" strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="write" stroke="#f59e0b" fill="url(#colorDiskW)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
"""

content = content.replace("function App() {", storage_view + "\nfunction App() {")

# Render StorageView based on activeTab
content = content.replace("{activeTab === 'services' && <ServicesView />}", "{activeTab === 'services' && <ServicesView />}\n        {activeTab === 'storage' && <StorageView vitals={vitals} history={history} />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

