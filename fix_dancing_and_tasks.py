import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Stop the dancing graphs (add isAnimationActive={false})
content = content.replace('<Area type="monotone" dataKey="val" stroke="#00e5ff" fill="url(#colorCpu)" strokeWidth={2} />', '<Area type="monotone" dataKey="val" stroke="#00e5ff" fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />')
content = content.replace('<Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#colorRam)" strokeWidth={2} />', '<Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#colorRam)" strokeWidth={2} isAnimationActive={false} />')
content = content.replace('<Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="url(#colorGpu)" strokeWidth={2} />', '<Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="url(#colorGpu)" strokeWidth={2} isAnimationActive={false} />')
content = content.replace('<Area type="monotone" dataKey="val" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2} />', '<Area type="monotone" dataKey="val" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2} isAnimationActive={false} />')

# Just to be safe, find all Area and Pie and ensure isAnimationActive={false}
content = re.sub(r'(<Area\s+[^>]*?)(?<!isAnimationActive=\{false\})\s*/>', r'\1 isAnimationActive={false} />', content)
content = re.sub(r'(<Pie\s+[^>]*?)(?<!isAnimationActive=\{false\})\s*>', r'\1 isAnimationActive={false}>', content)


# 2. Redesign TaskManagerView to split Apps and Background Processes
old_tm_view_regex = r'function TaskManagerView.*?<div className="system-info".*?</div\>\s*</div\>\s*\);\s*\}'
new_tm_view = """function TaskManagerView({ vitals }: { vitals: SystemVitals | null }) {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing Task Manager...</div>;

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleKill = async (pid: number) => {
    try {
      const result: string = await invoke("kill_process", { pid });
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

  const knownApps = ['brave', 'chrome', 'firefox', 'gnome', 'code', 'spotify', 'slack', 'discord', 'terminal', 'nautilus', 'vlc', 'web', 'thunar', 'dolphin', 'obs', 'steam'];
  
  const appsList = safeProcesses.filter(p => knownApps.some(app => p.name.toLowerCase().includes(app)) || p.memory_usage > 200 * 1024 * 1024)
    .sort((a, b) => a.name.localeCompare(b.name) || a.pid - b.pid);
    
  const bgList = safeProcesses.filter(p => !knownApps.some(app => p.name.toLowerCase().includes(app)) && p.memory_usage <= 200 * 1024 * 1024)
    .sort((a, b) => a.name.localeCompare(b.name) || a.pid - b.pid);

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="cc-header" style={{ marginBottom: '1rem' }}>
        <div className="cc-identity">
          <h3>Task Manager</h3>
          <span className="cc-os">{safeProcesses.length} Total Running Processes</span>
        </div>
      </div>
      
      <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div>
            <h4 style={{ color: '#00e5ff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Apps ({appsList.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Process Name</th>
                <th style={{ padding: '0.5rem' }}>PID</th>
                <th style={{ padding: '0.5rem' }}>CPU Usage</th>
                <th style={{ padding: '0.5rem' }}>Memory</th>
                <th style={{ padding: '0.5rem' }}>Action</th>
                </tr>
            </thead>
            <tbody>
                {appsList.map(p => (
                <tr key={p.pid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{p.pid}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#00e5ff' }}>{p.cpu_usage.toFixed(1)}%</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#3b82f6' }}>{formatBytes(p.memory_usage)}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                    <button onClick={() => handleKill(p.pid)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>END</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

        <div>
            <h4 style={{ color: '#f59e0b', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>Background Processes ({bgList.length})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Process Name</th>
                <th style={{ padding: '0.5rem' }}>PID</th>
                <th style={{ padding: '0.5rem' }}>CPU Usage</th>
                <th style={{ padding: '0.5rem' }}>Memory</th>
                <th style={{ padding: '0.5rem' }}>Action</th>
                </tr>
            </thead>
            <tbody>
                {bgList.map(p => (
                <tr key={p.pid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{p.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{p.pid}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#00e5ff' }}>{p.cpu_usage.toFixed(1)}%</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#3b82f6' }}>{formatBytes(p.memory_usage)}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                    <button onClick={() => handleKill(p.pid)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>END</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>

      </div>

      {statusMsg && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(0, 229, 255, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid #00e5ff', color: '#fff', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {statusMsg}
        </div>
      )}
    </div>
  );
}"""

content = re.sub(old_tm_view_regex, new_tm_view, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

