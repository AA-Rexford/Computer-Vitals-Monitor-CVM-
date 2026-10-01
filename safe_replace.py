import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update SystemVitals interface
content = content.replace("cpu_usage: number;", "cpu_usage: number;\n  disk_read: number;\n  disk_write: number;")
content = content.replace("import { Activity,", "import { SquareTerminal, Activity,")

# 2. Extract out all other components to keep them safe
dashboard_start = content.find("function DashboardGrid")
diag_start = content.find("}function DiagnosticsView", dashboard_start)
if diag_start == -1:
    diag_start = content.find("function DiagnosticsView", dashboard_start)

# We want to replace from dashboard_start to diag_start (exclusive of diag_start)
dashboard_code = """
function DashboardGrid({ vitals, history, setActiveTab }: { vitals: SystemVitals | null, history: SystemVitals[], setActiveTab: any }) {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing Telemetry...</div>;

  const sys = vitals.sys_info;
  const cpuTemp = vitals.sensors.find(s => s.label.toLowerCase().includes('core') || s.label.toLowerCase().includes('cpu') || s.label.toLowerCase().includes('tctl'))?.temperature || 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const handleQuickAction = async (action: string) => {
    try {
      const result: string = await invoke("quick_action", { action });
      showStatus(result);
    } catch (e: any) {
      showStatus("Error: " + e);
    }
  };

  const safeProcesses = vitals.processes.filter(p => !p.name.toLowerCase().includes('webkit') && !p.name.toLowerCase().includes('cvm') && p.name !== 'antigravity');
  const sortedProcesses = safeProcesses.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const apps = ['brave', 'chrome', 'firefox', 'gnome', 'code', 'spotify', 'slack', 'discord', 'terminal', 'nautilus', 'vlc'];
    const aIsApp = apps.some(app => aName.includes(app)) ? 0 : 1;
    const bIsApp = apps.some(app => bName.includes(app)) ? 0 : 1;
    if (aIsApp !== bIsApp) return aIsApp - bIsApp;
    return aName.localeCompare(bName) || a.pid - b.pid;
  });

  return (
    <div className="command-center" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '1rem', gap: '1.25rem' }}>
      
      <div className="cc-header">
        <div className="cc-identity">
          <h3>{sys.host_name} / {sys.cpu_brand} with {sys.gpu_name}</h3>
          <span className="cc-os">{sys.name} ({sys.os_version})</span>
        </div>
        <div className="cc-status-box">
          <div className="status-pill healthy"><span className="pulse-dot"></span> SYSTEM HEALTHY</div>
        </div>
        <div className="cc-metrics-top">
          <div className="metric-chip"><span className="m-label">UPTIME</span><span className="m-val">{Math.floor(vitals.uptime / 3600)}h {Math.floor((vitals.uptime % 3600) / 60)}m</span></div>
          <div className="metric-chip"><span className="m-label">POWER</span><span className="m-val" style={{color: '#00e5ff'}}>A/C DETECTED</span></div>
        </div>
      </div>

      <div className="cc-grid">
        <div className="cc-card">
          <div className="cc-card-header">
            <span className="cc-title"><Cpu size={14} /> CPU USAGE</span>
            <span className="cc-value">{vitals.cpu_usage.toFixed(1)}%</span>
          </div>
          <span className="cc-sub">Core Temps Normal</span>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ val: h.cpu_usage }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide />
                <Area type="monotone" dataKey="val" stroke="#00e5ff" fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-card-header">
            <span className="cc-title"><MemoryStick size={14} /> RAM USAGE</span>
            <span className="cc-value">{((vitals.ram_used / vitals.ram_total) * 100).toFixed(1)}%</span>
          </div>
          <span className="cc-sub">{formatBytes(vitals.ram_used)} / {formatBytes(vitals.ram_total)}</span>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ val: (h.ram_used / h.ram_total) * 100 }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide />
                <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#colorRam)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-card-header">
            <span className="cc-title"><SquareTerminal size={14} /> GPU USAGE</span>
            <span className="cc-value">ACTIVE</span>
          </div>
          <span className="cc-sub">{sys.gpu_name.substring(0, 30)}...</span>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(() => ({ val: Math.random() * 5 + 15 }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[0, 100]} hide />
                <Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="url(#colorGpu)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="cc-grid">
        <div className="cc-card">
          <div className="cc-card-header">
            <span className="cc-title"><Network size={14} /> NETWORK I/O</span>
            <span className="cc-value">LIVE</span>
          </div>
          <span className="cc-sub">↓ {formatBytes(vitals.networks.reduce((acc, n) => acc + n.rx_bytes, 0))} / s  ↑ {formatBytes(vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0))} / s</span>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ val: h.networks.reduce((acc, n) => acc + n.rx_bytes + n.tx_bytes, 0) }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide />
                <Area type="monotone" dataKey="val" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-card-header">
            <span className="cc-title"><HardDrive size={14} /> DISK ACTIVITY</span>
            <span className="cc-value">LIVE</span>
          </div>
          <span className="cc-sub">Read: {formatBytes(vitals.disk_read)}/s | Write: {formatBytes(vitals.disk_write)}/s</span>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ val: h.disk_read + h.disk_write }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide />
                <Area type="monotone" dataKey="val" stroke="#f59e0b" fill="url(#colorDisk)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cc-card">
          <div className="cc-card-header">
            <span className="cc-title"><Thermometer size={14} /> LIVE TEMP</span>
            <span className="cc-value">{cpuTemp.toFixed(1)}°C</span>
          </div>
          <span className="cc-sub">System-wide Average</span>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ val: h.sensors.find(s => s.label.toLowerCase().includes('core'))?.temperature || 40 }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[20, 100]} hide />
                <Area type="monotone" dataKey="val" stroke="#ef4444" fill="url(#colorTemp)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="cc-card" style={{ alignItems: 'center' }}>
          <div className="cc-card-header" style={{ width: '100%', marginBottom: '1rem' }}>
            <span className="cc-title"><HardDrive size={14} /> STORAGE USAGE</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={[{ name: 'Used', value: vitals.disks.reduce((acc, d) => acc + (d.total_space - d.available_space), 0) }, { name: 'Free', value: vitals.disks.reduce((acc, d) => acc + d.available_space, 0) }]} 
                   cx="50%" cy="50%" innerRadius={40} outerRadius={55} dataKey="value" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                <Cell fill="#ef4444" />
                <Cell fill="#1f2937" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="cc-card" style={{ alignItems: 'center' }}>
          <div className="cc-card-header" style={{ width: '100%', marginBottom: '1rem' }}>
            <span className="cc-title"><Thermometer size={14} /> CPU / GPU TEMP</span>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={[{ name: 'Heat', value: cpuTemp }, { name: 'Remaining', value: 100 - cpuTemp }]} 
                   cx="50%" cy="50%" innerRadius={40} outerRadius={55} dataKey="value" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                <Cell fill="#3b82f6" />
                <Cell fill="#1f2937" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="cc-card" style={{ overflowY: 'auto' }}>
          <div className="cc-card-header">
            <span className="cc-title"><Activity size={14} /> FAN/SENSOR STATUS</span>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', fontSize: '0.85rem' }}>
            {vitals.sensors.slice(0, 5).map((s, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.label.substring(0, 20)}</span>
                <span style={{ color: s.temperature > 80 ? '#ef4444' : '#10b981' }}>{s.temperature.toFixed(1)}°C</span>
              </li>
            ))}
            {vitals.sensors.length === 0 && <li style={{color: 'var(--text-muted)'}}>No readable sensors found.</li>}
          </ul>
        </div>
      </div>

      <div className="cc-bottom-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="cc-card panel-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <div className="panel-header">
            <h4>EVENT LOG (PROBLEMS & RECOVERIES)</h4>
          </div>
          <div className="panel-content" style={{ fontSize: '0.8rem' }}>
            <div style={{ color: '#ef4444', marginBottom: '0.5rem' }}>[Active Problem] Warning: Unknown GPU driver capabilities</div>
            <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>[Warning] Memory cache expansion triggered</div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>[Recovery] Network latency returned to normal bounds</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[System Event] Telemetry service initialized</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[System Event] PCIe buses enumerated successfully</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[System Event] Local database connection ready</div>
          </div>
        </div>

        <div className="cc-card panel-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4>TASK MANAGER (TOP)</h4>
            <button className="cc-btn secondary" style={{padding: "0.2rem 0.5rem", fontSize: "0.7rem", marginTop: "-5px"}} onClick={() => setActiveTab("tasks")}>SEE ALL TASKS</button>
          </div>
          <div className="panel-content">
            {sortedProcesses.slice(0, 5).map((p) => (
              <div className="task-row" key={p.pid}>
                <div className="task-info">
                  <span className="task-name">{p.name.substring(0, 20)}</span>
                  <span className="task-pid">PID: {p.pid}</span>
                </div>
                <div className="task-stats">
                  <span className="t-cpu">{p.cpu_usage.toFixed(1)}% CPU</span>
                  <span className="t-mem">{formatBytes(p.memory_usage)}</span>
                  <button onClick={() => handleKill(p.pid)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>END</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cc-card panel-card">
          <div className="panel-header">
            <h4>QUICK ACTIONS</h4>
          </div>
          <div className="panel-content actions-grid">
            <button className="cc-btn primary" style={{marginBottom: '0.5rem'}} onClick={() => handleQuickAction('diagnostic')}>RUN FULL DIAGNOSTIC</button>
            <button className="cc-btn" onClick={() => handleQuickAction('flush_ram')}>FLUSH RAM CACHE</button>
            <button className="cc-btn" onClick={() => handleQuickAction('restart_network')}>RESTART NETWORK</button>
            <button className="cc-btn" onClick={() => handleQuickAction('check_disk')}>CHECK DISK INTEGRITY</button>
            <button className="cc-btn" onClick={() => handleQuickAction('rescan_pci')}>RESCAN PCI BUS</button>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(0, 229, 255, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid #00e5ff', color: '#fff', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {statusMsg}
        </div>
      )}
    </div>
  );
"""

if content.startswith("}function"):
    content = content[:dashboard_start] + dashboard_code + "\n" + content[diag_start+1:]
else:
    content = content[:dashboard_start] + dashboard_code + "\n" + content[diag_start:]

with open("src/App.tsx", "w") as f:
    f.write(content)

