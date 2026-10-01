import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents'>")

# 2. Add Incidents tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "logs" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("logs"\)\}>\n\s*<ScrollText size=\{18\} /> <span className="nav-text">Logs</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "incidents" ? "active" : ""}`} onClick={() => setActiveTab("incidents")}>\n            <AlertTriangle size={18} /> <span className="nav-text">Incidents</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Create IncidentsView component
incidents_view = """
function IncidentsView() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const incidentsData = [
    { 
      id: 'INC-9042', 
      severity: 'Critical', 
      status: 'Active', 
      category: 'Warning / Active incidents',
      problem: 'High SSD Read Latency', 
      device: '/dev/sdb (Storage)', 
      first: '2026-10-01 09:12 AM', 
      last: '2026-10-01 11:25 AM',
      timeline: ['09:12 AM - Latency threshold breached (>150ms)', '09:15 AM - Automated diagnostic executed', '09:20 AM - Retries increasing'],
      evidence: 'Avg random 4K read latency is 172ms.', 
      tests: 'Storage Diagnostic: FAILED. SMART Test: WARNING.',
      logs: 'kernel: ata2.00: exception Emask 0x0 SAct 0x0 SErr 0x0 action 0x0',
      actions: 'Throttled background defragmentation.',
      results: 'Action applied successfully. Latency did not recover.',
      verification: 'Pending manual review.',
      recovery: 'Awaiting user to replace drive or run full fsck offline.'
    },
    { 
      id: 'INC-9041', 
      severity: 'Warning', 
      status: 'Open', 
      category: 'Warning / Open incidents',
      problem: 'Docker Daemon Bind Error', 
      device: 'veth-docker (Network)', 
      first: '2026-10-01 08:00 AM', 
      last: '2026-10-01 08:05 AM',
      timeline: ['08:00 AM - Service failed to start', '08:01 AM - Port collision detected'],
      evidence: 'Port 8080 is already allocated by process ID 1422.', 
      tests: 'Service Diagnostic: FAILED.',
      logs: 'dockerd[1234]: Error starting proxy: listen tcp4 0.0.0.0:8080: bind: address already in use',
      actions: 'Restarted dockerd service.',
      results: 'Failed. Port collision persists.',
      verification: 'Failed.',
      recovery: 'Stop PID 1422 before starting Docker.'
    },
    { 
      id: 'INC-9040', 
      severity: 'Resolved', 
      status: 'Recovered', 
      category: 'Resolved / Recovered incidents',
      problem: 'GPU Driver Crash', 
      device: 'PCIe:0000:01:00.0 (Display)', 
      first: '2026-09-30 18:45 PM', 
      last: '2026-09-30 18:46 PM',
      timeline: ['18:45 PM - GPU fell off bus', '18:45 PM - Display froze', '18:46 PM - Driver dynamically reloaded'],
      evidence: 'Xid 79 - GPU has fallen off the bus.', 
      tests: 'Display Diagnostic: PASSED (after recovery).',
      logs: 'NVRM: GPU at PCI:0000:01:00.0 fell off the bus.',
      actions: 'Kernel auto-reloaded NVIDIA driver modules.',
      results: 'Modules successfully reloaded. Display restored.',
      verification: 'Success. Stress test passed.',
      recovery: 'Automated software recovery was successful.'
    }
  ];

  const filteredIncidents = incidentsData.filter(inc => {
    if (statusFilter !== "All" && !inc.status.includes(statusFilter)) return false;
    return inc.problem.toLowerCase().includes(searchQuery.toLowerCase()) || inc.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getSeverityColor = (sev: string) => {
    if (sev === 'Critical') return '#ef4444';
    if (sev === 'Warning') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3>Incident Response Center</h3>
          <span className="cc-os">Active anomalies, historical warnings, and recovery tracking</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}>
            <option>All</option><option>Active</option><option>Open</option><option>Recovered</option>
          </select>
          <input type="text" placeholder="Search incidents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff', width: '200px' }} />
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Incidents Table (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>ID</th>
                <th style={{ padding: '0.5rem' }}>Severity</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Problem</th>
                <th style={{ padding: '0.5rem' }}>Device</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((inc, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedIncident(inc)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedIncident?.id === inc.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace' }}>{inc.id}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ background: getSeverityColor(inc.severity) + '33', color: getSeverityColor(inc.severity), padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{inc.severity}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ color: inc.status === 'Active' ? '#ef4444' : inc.status === 'Open' ? '#f59e0b' : '#10b981' }}>{inc.status}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{inc.problem}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{inc.device}</td>
                </tr>
              ))}
              {filteredIncidents.length === 0 && <tr><td colSpan={5} style={{padding: '1rem', textAlign: 'center', color: 'var(--text-muted)'}}>No incidents found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Incident Details (Right) */}
        {selectedIncident && (
          <div style={{ width: '450px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ background: getSeverityColor(selectedIncident.severity) + '33', color: getSeverityColor(selectedIncident.severity), padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem', marginRight: '0.5rem' }}>{selectedIncident.severity.toUpperCase()}</span>
                <span style={{ background: selectedIncident.status === 'Recovered' ? '#10b98133' : '#ef444433', color: selectedIncident.status === 'Recovered' ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedIncident.status.toUpperCase()}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{selectedIncident.id}</span>
            </div>

            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selectedIncident.problem}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedIncident.device}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>First Detected:</span>
                <span>{selectedIncident.first}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Detected:</span>
                <span>{selectedIncident.last}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                <span style={{ fontWeight: 'bold', color: selectedIncident.status === 'Recovered' ? '#10b981' : '#ef4444' }}>{selectedIncident.status}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Incident Timeline</h5>
              <ul style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', paddingLeft: '1.5rem', borderRadius: '4px', fontSize: '0.85rem', color: '#fff', margin: 0 }}>
                {selectedIncident.timeline.map((evt: string, i: number) => <li key={i} style={{marginBottom: '0.25rem'}}>{evt}</li>)}
              </ul>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Diagnostic Intelligence</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><span style={{color: 'var(--text-muted)'}}>Evidence:</span> {selectedIncident.evidence}</div>
                <div><span style={{color: 'var(--text-muted)'}}>Tests Run:</span> {selectedIncident.tests}</div>
                <div><span style={{color: 'var(--text-muted)'}}>Related Logs:</span> <span style={{fontFamily: 'monospace', color: '#f59e0b'}}>{selectedIncident.logs}</span></div>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Recovery & Resolution</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><span style={{color: 'var(--text-muted)'}}>Actions Taken:</span> {selectedIncident.actions}</div>
                <div><span style={{color: 'var(--text-muted)'}}>Action Results:</span> {selectedIncident.results}</div>
                <div><span style={{color: 'var(--text-muted)'}}>Verification:</span> {selectedIncident.verification}</div>
                <div style={{marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,229,255,0.1)', borderLeft: '3px solid #00e5ff'}}>
                  <span style={{color: '#00e5ff', fontWeight: 'bold'}}>Recovery Info:</span> {selectedIncident.recovery}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", incidents_view + "\nfunction App() {")

# Render IncidentsView based on activeTab
content = content.replace("{activeTab === 'logs' && <LogsView />}", "{activeTab === 'logs' && <LogsView />}\n        {activeTab === 'incidents' && <IncidentsView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

