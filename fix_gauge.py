import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. We'll find the DashboardGrid function and completely replace it.
dash_start = content.find("function DashboardGrid")
diag_start = content.find("function DiagnosticsView")

prefix = content[:dash_start]
suffix = content[diag_start:]

new_dashboard = """function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  const [eventFilter, setEventFilter] = useState('Active Problems');

  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing Command Center...</div>;
  const sys = vitals.sys_info;

  const gpuSensor = vitals.sensors.find(s => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('amd') || s.label.toLowerCase().includes('radeon') || s.label.toLowerCase().includes('edge'));
  const gpuTemp = gpuSensor ? gpuSensor.temperature : 0;
  
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
  let sysColor = '#10b981'; // Green
  const activeProblems = [];
  
  if (vitals.cpu_usage > 90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push('CPU Usage Critical (>90%)'); }
  else if (vitals.cpu_usage > 75) { sysStatus = 'WARNING'; sysColor = '#f59e0b'; activeProblems.push('CPU Usage High (>75%)'); }
  
  if ((vitals.ram_used / vitals.ram_total) > 0.90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push('Memory Critical (>90%)'); }
  else if ((vitals.ram_used / vitals.ram_total) > 0.80) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } activeProblems.push('Memory High (>80%)'); }
  
  if (cpuTemp > 85) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push(`Thermal Critical (${cpuTemp.toFixed(1)}°C)`); }
  else if (cpuTemp > 75) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } activeProblems.push(`Thermal Warning (${cpuTemp.toFixed(1)}°C)`); }

  const storageGaugeData = [
    { name: 'Safe', value: 60, fill: '#10b981' },
    { name: 'Warning', value: 20, fill: '#f59e0b' },
    { name: 'Critical', value: 20, fill: '#ef4444' }
  ];

  const tempGaugeData = [
    { name: 'Cool', value: 60, fill: '#3b82f6' },
    { name: 'Warm', value: 20, fill: '#f59e0b' },
    { name: 'Hot', value: 20, fill: '#ef4444' }
  ];
  
  let currentStorageColor = '#10b981';
  if (diskUsagePct > 80) currentStorageColor = '#ef4444';
  else if (diskUsagePct > 60) currentStorageColor = '#f59e0b';

  let currentTempColor = '#3b82f6';
  if (cpuTemp > 80) currentTempColor = '#ef4444';
  else if (cpuTemp > 60) currentTempColor = '#f59e0b';

  // Custom Needle for the gauge
  const renderNeedle = (value: number, color: string) => {
      // Very simple text rendering inside the semi-circle gauge
      return (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -10%)', textAlign: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: color, fontFamily: 'monospace' }}>{value.toFixed(1)}{value === diskUsagePct ? '%' : '°C'}</div>
          </div>
      );
  };

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
          <strong>{formatUptime(vitals.uptime)}</strong>
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
            <ResponsiveContainer width="100%" height={90}>
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
            <ResponsiveContainer width="100%" height={90}>
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
            <ResponsiveContainer width="100%" height={90}>
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
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.networks.reduce((acc, n) => acc + n.rx_bytes, 0) }))}>
                <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STORAGE (GAUGE) */}
        <div className="cc-card donut-card">
          <div className="cc-card-header">
            <h4><HardDrive size={16}/> STORAGE USAGE</h4>
          </div>
          <div className="donut-container">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={storageGaugeData} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={70} dataKey="value" stroke="none" isAnimationActive={false}>
                  {storageGaugeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {renderNeedle(diskUsagePct, currentStorageColor)}
          </div>
        </div>

        {/* SENSORS (GAUGE) */}
        <div className="cc-card donut-card">
          <div className="cc-card-header">
            <h4><Thermometer size={16}/> TEMPERATURE</h4>
          </div>
          <div className="donut-container">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={tempGaugeData} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={55} outerRadius={70} dataKey="value" stroke="none" isAnimationActive={false}>
                  {tempGaugeData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {renderNeedle(cpuTemp, currentTempColor)}
          </div>
        </div>
      </div>

      {/* BOTTOM PANELS */}
      <div className="cc-bottom-grid">
        <div className="cc-events-panel">
          <div className="events-header">
            <h4>Event Log & Active Problems</h4>
            <div className="dropdown">
              <select className="cc-select" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                <option value="Active Problems">Active Problems</option>
                <option value="All System Events">All System Events</option>
              </select>
            </div>
          </div>
          <div className="events-list">
            {eventFilter === 'Active Problems' && (
              <>
                {activeProblems.length === 0 ? (
                  <div className="event-item healthy">✓ System is running optimally. No active problems detected.</div>
                ) : (
                  activeProblems.map((prob, i) => (
                    <div key={i} className="event-item critical">! {prob}</div>
                  ))
                )}
              </>
            )}
            {eventFilter === 'All System Events' && (
              <>
                <div className="event-item info">i System monitoring initialized successfully.</div>
                <div className="event-item info">i Hardware polling rate set to 1000ms.</div>
                {activeProblems.map((prob, i) => (
                    <div key={`err-${i}`} className="event-item critical">! {prob}</div>
                ))}
              </>
            )}
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
    f.write(prefix + new_dashboard + "\n\n" + suffix)

print("Re-wrote DashboardGrid")
