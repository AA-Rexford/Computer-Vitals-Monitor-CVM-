import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs'>")

# 2. Add Logs tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "devices" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("devices"\)\}>\n\s*<MonitorSmartphone size=\{18\} /> <span className="nav-text">Devices</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")}>\n            <ScrollText size={18} /> <span className="nav-text">Logs</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add ScrollText icon import
if "ScrollText" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, ScrollText,")

# 4. Create LogsView component
logs_view = """
function LogsView() {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("Last 24 Hours");

  const handleExport = () => {
    alert("Exporting logs to JSON...");
  };

  const logsData = [
    { id: 'EVT-1001', time: '10:45:12 AM', severity: 'Error', source: 'Kernel', category: 'Kernel Logs / Linux journal logs', component: 'NVIDIA Driver', message: 'NVRM: GPU at PCI:0000:01:00.0 fell off the bus.', process: 'kworker/u16:4', service: 'systemd-udevd', device: 'PCIe Bus / GPU', english: 'Your graphics card momentarily disconnected from the motherboard, likely due to a driver crash or power spike. The driver was forcefully reloaded.', technical: 'PCIe AER fatal error reported. Link state D3hot. Resetting bridge.', raw: 'Sep 29 10:45:12 kernel: NVRM: GPU at PCI:0000:01:00.0 fell off the bus. NVRM: A GPU crash dump has been created.' },
    { id: 'EVT-1002', time: '10:40:01 AM', severity: 'Warning', source: 'Network', category: 'Network logs', component: 'wpa_supplicant', message: 'CTRL-EVENT-DISCONNECTED bssid=aa:bb:cc:dd reason=4', process: 'wpa_supplicant (pid 891)', service: 'NetworkManager', device: 'wlan0', english: 'Your computer temporarily disconnected from Wi-Fi because the router failed to respond to a keep-alive packet.', technical: 'Reason 4 (Disassociated due to inactivity). Deauthentication sent.', raw: 'Sep 29 10:40:01 wpa_supplicant[891]: wlan0: CTRL-EVENT-DISCONNECTED bssid=00:11:22:33:44:55 reason=4 locally_generated=1' },
    { id: 'EVT-1003', time: '10:15:33 AM', severity: 'Info', source: 'System', category: 'System logs / Boot logs', component: 'systemd', message: 'Startup finished in 3.42s (kernel) + 4.12s (userspace).', process: 'systemd (pid 1)', service: 'systemd-journald', device: 'N/A', english: 'The system successfully turned on and finished loading all background services very quickly.', technical: 'Target graphical.target reached. No failed units.', raw: 'Sep 29 10:15:33 systemd[1]: Startup finished in 3.42s (kernel) + 4.12s (userspace) = 7.54s.' },
    { id: 'EVT-1004', time: '09:55:10 AM', severity: 'Critical', source: 'Hardware', category: 'Hardware logs / Driver errors', component: 'S.M.A.R.T', message: 'ATA bus error, status: { DRDY ERR }', process: 'smartd', service: 'smartmontools', device: 'dev/sda', english: 'Your hard drive reported a read/write error. If this happens frequently, your drive might be failing and you should back up your data.', technical: 'UNC error at LBA 1234567. Uncorrectable sector.', raw: 'Sep 29 09:55:10 kernel: ata1.00: exception Emask 0x0 SAct 0x0 SErr 0x0 action 0x0\\nata1.00: failed command: READ DMA' },
    { id: 'EVT-1005', time: '09:00:22 AM', severity: 'Error', source: 'Application', category: 'Application logs / Windows Event Logs', component: 'Docker Daemon', message: 'failed to start container: port is already allocated', process: 'dockerd', service: 'docker.service', device: 'veth-dckr', english: 'An application tried to start, but the network port it requested is already being used by another program.', technical: 'Bind for 0.0.0.0:8080 failed: port is already allocated.', raw: 'Sep 29 09:00:22 dockerd[1234]: Error starting userland proxy: listen tcp4 0.0.0.0:8080: bind: address already in use' }
  ];

  const filteredLogs = logsData.filter(log => {
    if (severityFilter !== "All" && log.severity !== severityFilter) return false;
    if (categoryFilter !== "All" && !log.category.includes(categoryFilter)) return false;
    return log.message.toLowerCase().includes(searchQuery.toLowerCase()) || log.id.toLowerCase().includes(searchQuery.toLowerCase()) || log.component.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getSeverityColor = (sev: string) => {
    if (sev === 'Critical') return '#ef4444';
    if (sev === 'Error') return '#f97316';
    if (sev === 'Warning') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3>System Event Logs</h3>
          <span className="cc-os">Global Kernel, Application, Hardware & Journal Feed</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}>
            <option>Last Hour</option><option>Last 24 Hours</option><option>All Time</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}>
            <option>All</option><option>System</option><option>Application</option><option>Hardware</option><option>Kernel</option><option>Network</option>
          </select>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}>
            <option>All</option><option>Info</option><option>Warning</option><option>Error</option><option>Critical</option>
          </select>
          <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff', width: '200px' }} />
          <button className="cc-btn primary" onClick={handleExport}>EXPORT LOGS</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Logs Table (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Timestamp</th>
                <th style={{ padding: '0.5rem' }}>Severity</th>
                <th style={{ padding: '0.5rem' }}>Component</th>
                <th style={{ padding: '0.5rem' }}>Event ID</th>
                <th style={{ padding: '0.5rem' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedLog(log)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedLog?.id === log.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', whiteSpace: 'nowrap' }}>{log.time}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ background: getSeverityColor(log.severity) + '33', color: getSeverityColor(log.severity), padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{log.severity}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{log.component}</td>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace' }}>{log.id}</td>
                  <td style={{ padding: '0.6rem 0.5rem', wordBreak: 'break-all' }}>{log.message}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && <tr><td colSpan={5} style={{padding: '1rem', textAlign: 'center', color: 'var(--text-muted)'}}>No events match current filters.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Log Details (Right) */}
        {selectedLog && (
          <div style={{ width: '400px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: getSeverityColor(selectedLog.severity) + '33', color: getSeverityColor(selectedLog.severity), padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedLog.severity.toUpperCase()}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedLog.time}</span>
            </div>

            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedLog.message}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {selectedLog.id} • {selectedLog.category}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Source / Component:</span>
                <span>{selectedLog.source} / {selectedLog.component}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Process:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.process}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Service:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.service}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Device:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.device}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Plain-English Explanation</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: '#fff', borderLeft: '3px solid #00e5ff' }}>
                {selectedLog.english}
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Technical Details</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: '#f59e0b', wordBreak: 'break-all' }}>
                {selectedLog.technical}
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Raw Event Payload</h5>
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all', maxHeight: '100px', overflowY: 'auto' }}>
                {selectedLog.raw}
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button className="cc-btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>
                OPEN RELATED INCIDENT
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", logs_view + "\nfunction App() {")

# Render LogsView based on activeTab
content = content.replace("{activeTab === 'devices' && <DevicesView />}", "{activeTab === 'devices' && <DevicesView />}\n        {activeTab === 'logs' && <LogsView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

