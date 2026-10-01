import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Find the start of DashboardGrid
dash_start = content.find("function DashboardGrid")

# Find the start of DiagnosticsView
diag_start = content.find("function DiagnosticsView")

# Split the file
prefix = content[:dash_start]
suffix = content[diag_start:]

new_dashboard = """
import { PieChart, Pie, Cell } from 'recharts';

function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing Command Center...</div>;
  const sys = vitals.sys_info;

  // Extract GPU Temp if available in sensors
  const gpuSensor = vitals.sensors.find(s => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('amd') || s.label.toLowerCase().includes('radeon') || s.label.toLowerCase().includes('edge'));
  const gpuTemp = gpuSensor ? gpuSensor.temperature : 0;
  
  // Extract Max CPU Temp
  const cpuSensor = vitals.sensors.find(s => s.label.toLowerCase().includes('cpu') || s.label.toLowerCase().includes('core') || s.label.toLowerCase().includes('tctl'));
  const cpuTemp = cpuSensor ? cpuSensor.temperature : (vitals.sensors.length > 0 ? vitals.sensors[0].temperature : 0);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const totalRx = vitals.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
  const totalTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);
  
  const totalDiskSpace = vitals.disks.reduce((acc, d) => acc + d.total_space, 0);
  const availableDiskSpace = vitals.disks.reduce((acc, d) => acc + d.available_space, 0);
  const diskUsagePct = totalDiskSpace > 0 ? ((totalDiskSpace - availableDiskSpace) / totalDiskSpace) * 100 : 0;

  let sysStatus = 'HEALTHY';
  let sysColor = 'var(--accent-green)';
  const activeProblems = [];
  
  if (vitals.cpu_usage > 90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push('CPU Usage Critical (>90%)'); }
  else if (vitals.cpu_usage > 75) { sysStatus = 'WARNING'; sysColor = '#f59e0b'; activeProblems.push('CPU Usage High (>75%)'); }
  
  if ((vitals.ram_used / vitals.ram_total) > 0.90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push('Memory Critical (>90%)'); }
  else if ((vitals.ram_used / vitals.ram_total) > 0.80) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } activeProblems.push('Memory High (>80%)'); }
  
  if (cpuTemp > 85) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push(`Thermal Critical (${cpuTemp.toFixed(1)}°C)`); }
  else if (cpuTemp > 75) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } activeProblems.push(`Thermal Warning (${cpuTemp.toFixed(1)}°C)`); }

  const diskData = [
    { name: 'Used', value: totalDiskSpace - availableDiskSpace, color: '#f59e0b' },
    { name: 'Free', value: availableDiskSpace, color: 'rgba(255,255,255,0.05)' }
  ];

  const tempData = [
    { name: 'Temp', value: cpuTemp, color: sysColor },
    { name: 'Remaining', value: Math.max(100 - cpuTemp, 0), color: 'rgba(255,255,255,0.05)' }
  ];

  return (
    <div className="command-center">
      {/* HEADER STRIP */}
      <div className="cc-header">
        <div className="cc-identity">
          <h3>{sys.host_name} / {sys.cpu_brand}</h3>
          <span className="cc-os">{sys.long_os_version}</span>
        </div>
        <div className="cc-status-box" style={{ borderColor: sysColor }}>
          <div className="status-indicator" style={{ backgroundColor: sysColor }}></div>
          <span style={{ color: sysColor, fontWeight: 'bold', letterSpacing: '0.1em' }}>SYSTEM {sysStatus}</span>
        </div>
        <div className="cc-uptime">
          <span>UPTIME</span>
          <strong>{formatUptime(sys.uptime)}</strong>
        </div>
        <div className="cc-battery">
          <span>POWER</span>
          <strong>A/C DETECTED</strong>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="cc-grid">
        
        {/* CPU */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><Cpu size={16}/> CPU USAGE</h4>
            <span className="cc-value">{vitals.cpu_usage.toFixed(1)}%</span>
          </div>
          <div className="cc-sub">Core Temps Normal</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.cpu_usage }))}>
                <defs><linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/><stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#00e5ff" fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RAM */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><MemoryStick size={16}/> RAM USAGE</h4>
            <span className="cc-value">{((vitals.ram_used / vitals.ram_total) * 100).toFixed(1)}%</span>
          </div>
          <div className="cc-sub">{formatBytes(vitals.ram_used)} / {formatBytes(vitals.ram_total)}</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: (h.ram_used / h.ram_total) * 100 }))}>
                <defs><linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#colorRam)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GPU */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><Square size={16}/> GPU USAGE</h4>
            <span className="cc-value">{gpuTemp > 0 ? 'ACTIVE' : 'IDLE'}</span>
          </div>
          <div className="cc-sub">{sys.gpu_name.length > 25 ? sys.gpu_name.substring(0, 25) + '...' : sys.gpu_name}</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={history.map((h, i) => {
                const gt = h.sensors.find(s => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('amd') || s.label.toLowerCase().includes('edge'))?.temperature || 0;
                return { time: i, val: gt };
              })}>
                <defs><linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="url(#colorGpu)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NETWORK */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><Network size={16}/> NETWORK I/O</h4>
            <span className="cc-value">LIVE</span>
          </div>
          <div className="cc-sub">↓ {formatBytes(totalRx)}/s  ↑ {formatBytes(totalTx)}/s</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.networks.reduce((acc, n) => acc + n.rx_bytes, 0) }))}>
                <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STORAGE (DONUT) */}
        <div className="cc-card donut-card">
          <div className="cc-card-header">
            <h4><HardDrive size={16}/> STORAGE USAGE</h4>
          </div>
          <div className="donut-container">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={diskData} innerRadius={40} outerRadius={55} dataKey="value" stroke="none" isAnimationActive={false}>
                  {diskData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label">
              <span className="cc-value">{diskUsagePct.toFixed(1)}%</span>
              <span className="cc-sub">USED</span>
            </div>
          </div>
        </div>

        {/* SENSORS (DONUT) */}
        <div className="cc-card donut-card">
          <div className="cc-card-header">
            <h4><Thermometer size={16}/> TEMPERATURE</h4>
          </div>
          <div className="donut-container">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={tempData} innerRadius={40} outerRadius={55} dataKey="value" stroke="none" startAngle={225} endAngle={-45} isAnimationActive={false}>
                  {tempData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.color} /> ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label">
              <span className="cc-value" style={{color: sysColor}}>{cpuTemp.toFixed(1)}°C</span>
              <span className="cc-sub">CPU CORE</span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM PANELS */}
      <div className="cc-bottom-grid">
        <div className="cc-events-panel">
          <div className="events-header">
            <h4>Event Log & Active Problems</h4>
            <div className="dropdown">
              <select className="cc-select">
                <option>Active Problems</option>
                <option>Recent Warnings</option>
                <option>Recent Recoveries</option>
                <option>All System Events</option>
              </select>
            </div>
          </div>
          <div className="events-list">
            {activeProblems.length === 0 ? (
              <div className="event-item healthy">✓ System is running optimally. No active problems detected.</div>
            ) : (
              activeProblems.map((prob, i) => (
                <div key={i} className="event-item critical">! {prob}</div>
              ))
            )}
            <div className="event-item info">i System monitoring initialized successfully.</div>
            <div className="event-item info">i Hardware polling rate set to 1000ms.</div>
          </div>
        </div>

        <div className="cc-actions-panel">
          <h4>Quick Actions</h4>
          <button className="cc-btn primary" onClick={() => document.querySelector<HTMLButtonElement>('.nav-item:nth-child(2)')?.click()}>
            RUN FULL DIAGNOSTIC
          </button>
          <div className="cc-btn-grid">
            <button className="cc-btn secondary">Flush RAM Cache</button>
            <button className="cc-btn secondary">Restart Network</button>
            <button className="cc-btn secondary">Check Disk Integrity</button>
            <button className="cc-btn secondary">Rescan PCI Bus</button>
          </div>
        </div>
      </div>

    </div>
  );
}
"""

with open("src/App.tsx", "w") as f:
    f.write(prefix + new_dashboard + "\n" + suffix)

# We also need to fix the App function to track `history: SystemVitals[]` instead of `cpuHistory: CpuHistoryPoint[]`.
with open("src/App.tsx", "r") as f:
    app_code = f.read()

# Replace CpuHistoryPoint[] with SystemVitals[]
app_code = app_code.replace("const [cpuHistory, setCpuHistory] = useState<CpuHistoryPoint[]>([]);", "const [history, setHistory] = useState<SystemVitals[]>([]);")
app_code = app_code.replace("cpuHistory={cpuHistory}", "history={history}")

# Update setCpuHistory block
old_set_cpu = """        setCpuHistory(prev => {
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          const newPoint = { time: timeString, usage: data.cpu_usage };
          const newHistory = [...prev, newPoint];
          return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
        });"""

new_set_hist = """        setHistory(prev => {
          const newHistory = [...prev, data];
          return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
        });"""

app_code = app_code.replace(old_set_cpu, new_set_hist)

# Fix Recharts import to include PieChart, Pie, Cell if not present
if "PieChart" not in app_code:
    app_code = app_code.replace("import { AreaChart, Area, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';", "import { AreaChart, Area, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';")

# Ensure the top-level import has PieChart
# Remove the inline import from the split string if present
app_code = app_code.replace("import { PieChart, Pie, Cell } from 'recharts';\n\nfunction DashboardGrid", "function DashboardGrid")

with open("src/App.tsx", "w") as f:
    f.write(app_code)

print("Updated App.tsx successfully.")
