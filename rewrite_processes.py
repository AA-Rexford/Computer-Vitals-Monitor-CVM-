import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update ProcessInfo type
content = content.replace("memory_usage: number;\n}", "memory_usage: number;\n  parent_pid: number;\n  user: string;\n  disk_read: number;\n  disk_write: number;\n  start_time: number;\n  status: string;\n  executable: string;\n  command: string;\n}")

# 2. Rename Tasks to Processes in Sidebar and update icons
content = content.replace("<Server size={18} /> Task Manager", "<Server size={18} /> Processes")

# 3. Remove "TASK MANAGER (TOP)" from DashboardGrid
# We can just remove the whole cc-card panel-card for TASK MANAGER (TOP)
tm_panel_regex = r'<div className="cc-card panel-card" style=\{\{ maxHeight: \'300px\', overflowY: \'auto\' \}\}>\s*<div className="panel-header" style=\{\{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' \}\}>\s*<h4>TASK MANAGER \(TOP\)</h4>.*?</div>\s*</div>'
content = re.sub(tm_panel_regex, '', content, flags=re.DOTALL)

# 4. Replace TaskManagerView with ProcessesView
old_tm_view = r'function TaskManagerView.*?<div className="system-info".*?</div\>\s*</div\>\s*\);\s*\}'

processes_view = """function TaskManagerView({ vitals }: { vitals: SystemVitals | null }) {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing Processes...</div>;

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleAction = async (action: string, pid: number) => {
    try {
      const result: string = await invoke(action, { pid });
      showStatus(result);
    } catch (e: any) {
      showStatus("Error: " + e);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Safe processes
  const safeProcesses = vitals.processes.filter(p => !p.name.toLowerCase().includes('webkit') && !p.name.toLowerCase().includes('cvm') && p.name !== 'antigravity');

  // Search filter
  const filtered = safeProcesses.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.pid.toString().includes(searchQuery));
  
  // Sort alphabetically
  const list = filtered.sort((a, b) => a.name.localeCompare(b.name) || a.pid - b.pid);

  const selectedProc = vitals.processes.find(p => p.pid === selectedPid);

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cc-identity">
          <h3>Processes Explorer</h3>
          <span className="cc-os">{safeProcesses.length} Running Processes</span>
        </div>
        <input 
          type="text" 
          placeholder="Search by Name or PID..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff', width: '300px' }}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Process List (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Name</th>
                <th style={{ padding: '0.5rem' }}>PID</th>
                <th style={{ padding: '0.5rem' }}>User</th>
                <th style={{ padding: '0.5rem' }}>CPU</th>
                <th style={{ padding: '0.5rem' }}>Memory</th>
                <th style={{ padding: '0.5rem' }}>Disk (R/W)</th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => (
                <tr 
                  key={p.pid} 
                  onClick={() => setSelectedPid(p.pid)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedPid === p.pid ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{p.pid}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{p.user}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#00e5ff' }}>{p.cpu_usage.toFixed(1)}%</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#3b82f6' }}>{formatBytes(p.memory_usage)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#f59e0b' }}>{formatBytes(p.disk_read)} / {formatBytes(p.disk_write)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Process Details (Right) */}
        {selectedProc && (
          <div style={{ width: '350px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid #00e5ff' }}>
            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{selectedProc.name}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>PID: {selectedProc.pid} • User: {selectedProc.user}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Parent PID:</span>
                <span>{selectedProc.parent_pid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ color: '#10b981' }}>{selectedProc.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Start Time:</span>
                <span>{new Date(selectedProc.start_time * 1000).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>CPU Usage:</span>
                <span style={{ color: '#00e5ff' }}>{selectedProc.cpu_usage.toFixed(1)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>RAM Usage:</span>
                <span style={{ color: '#3b82f6' }}>{formatBytes(selectedProc.memory_usage)}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Executable</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {selectedProc.executable || "Unavailable"}
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Command Line</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', wordBreak: 'break-all', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '100px', overflowY: 'auto' }}>
                {selectedProc.command || "Unavailable"}
              </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="cc-btn" onClick={() => handleAction('suspend_process', selectedProc.pid)}>SUSPEND</button>
              <button className="cc-btn" onClick={() => handleAction('resume_process', selectedProc.pid)}>RESUME</button>
              <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }} onClick={() => handleAction('kill_process', selectedProc.pid)}>FORCE TERMINATE</button>
            </div>

          </div>
        )}

      </div>

      {statusMsg && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(0, 229, 255, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid #00e5ff', color: '#fff', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {statusMsg}
        </div>
      )}
    </div>
  );
}"""

content = re.sub(old_tm_view, processes_view, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

