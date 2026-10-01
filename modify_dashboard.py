import re

def process_tsx():
    with open("src/App.tsx", "r") as f:
        content = f.read()

    # 1. Update the DashboardGrid component
    new_dashboard = """function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  if (!vitals) return <div className="loading">Initializing Command Center...</div>;
  const sys = vitals.sys_info;

  // Extract GPU Temp if available in sensors
  const gpuSensor = vitals.sensors.find(s => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('amd') || s.label.toLowerCase().includes('radeon'));
  const gpuTemp = gpuSensor ? gpuSensor.temperature : 0;
  
  // Extract Max CPU Temp
  const cpuSensor = vitals.sensors.find(s => s.label.toLowerCase().includes('cpu') || s.label.toLowerCase().includes('core'));
  const cpuTemp = cpuSensor ? cpuSensor.temperature : (vitals.sensors[0]?.temperature || 0);

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

  // Derive system status
  let sysStatus = 'HEALTHY';
  let sysColor = 'var(--accent-green)';
  const activeProblems = [];
  
  if (vitals.cpu_usage > 90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push('CPU Usage Critical (>90%)'); }
  else if (vitals.cpu_usage > 75) { sysStatus = 'WARNING'; sysColor = '#f59e0b'; activeProblems.push('CPU Usage High (>75%)'); }
  
  if ((vitals.ram_used / vitals.ram_total) > 0.90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push('Memory Critical (>90%)'); }
  else if ((vitals.ram_used / vitals.ram_total) > 0.80) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } activeProblems.push('Memory High (>80%)'); }
  
  if (cpuTemp > 85) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push(`Thermal Critical (${cpuTemp.toFixed(1)}°C)`); }
  else if (cpuTemp > 75) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } activeProblems.push(`Thermal Warning (${cpuTemp.toFixed(1)}°C)`); }

  return (
    <div className="command-center">
      {/* HEADER STRIP */}
      <div className="cc-header">
        <div className="cc-identity">
          <h3>{sys.host_name}</h3>
          <span className="cc-os">{sys.long_os_version}</span>
        </div>
        <div className="cc-status-box" style={{ borderColor: sysColor }}>
          <div className="status-indicator" style={{ backgroundColor: sysColor }}></div>
          <span style={{ color: sysColor, fontWeight: 'bold' }}>SYSTEM {sysStatus}</span>
        </div>
        <div className="cc-uptime">
          <span>UPTIME</span>
          <strong>{formatUptime(sys.uptime)}</strong>
        </div>
        <div className="cc-battery">
          <span>POWER</span>
          <strong>A/C</strong>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="cc-grid">
        
        {/* CPU */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><Cpu size={16}/> CPU</h4>
            <span className="cc-value">{vitals.cpu_usage.toFixed(1)}%</span>
          </div>
          <div className="cc-sub">Temp: {cpuTemp.toFixed(1)}°C</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.cpu_usage }))}>
                <defs><linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#00e5ff" fill="url(#colorCpu)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RAM */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><MemoryStick size={16}/> RAM</h4>
            <span className="cc-value">{((vitals.ram_used / vitals.ram_total) * 100).toFixed(1)}%</span>
          </div>
          <div className="cc-sub">{formatBytes(vitals.ram_used)} / {formatBytes(vitals.ram_total)}</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: (h.ram_used / h.ram_total) * 100 }))}>
                <defs><linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#colorRam)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GPU */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><Square size={16}/> GPU</h4>
            <span className="cc-value">{gpuTemp > 0 ? 'ACTIVE' : 'IDLE'}</span>
          </div>
          <div className="cc-sub">Temp: {gpuTemp > 0 ? `${gpuTemp.toFixed(1)}°C` : 'N/A'}</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={history.map((h, i) => {
                const gt = h.sensors.find(s => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('amd'))?.temperature || 0;
                return { time: i, val: gt };
              })}>
                <defs><linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="url(#colorGpu)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STORAGE */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><HardDrive size={16}/> STORAGE</h4>
            <span className="cc-value">{diskUsagePct.toFixed(1)}%</span>
          </div>
          <div className="cc-sub">I/O Activity: Tracking...</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={history.map((h, i) => {
                const totalD = h.disks.reduce((acc, d) => acc + d.total_space, 0);
                const availD = h.disks.reduce((acc, d) => acc + d.available_space, 0);
                return { time: i, val: totalD > 0 ? ((totalD - availD) / totalD) * 100 : 0 };
              })}>
                <defs><linearGradient id="colorDisk" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#f59e0b" fill="url(#colorDisk)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* NETWORK */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><Network size={16}/> NETWORK</h4>
            <span className="cc-value">LIVE</span>
          </div>
          <div className="cc-sub">↓ {formatBytes(totalRx)}/s  ↑ {formatBytes(totalTx)}/s</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.networks.reduce((acc, n) => acc + n.rx_bytes, 0) }))}>
                <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="#10b981" fill="url(#colorNet)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SENSORS */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><Activity size={16}/> SENSORS</h4>
            <span className="cc-value" style={{ color: sysColor }}>{sysStatus}</span>
          </div>
          <div className="cc-sub">Fans: Auto-managed</div>
          <div className="cc-graph-mini">
            <ResponsiveContainer width="100%" height={60}>
              <AreaChart data={history.map((h, i) => {
                const ct = h.sensors.find(s => s.label.toLowerCase().includes('cpu') || s.label.toLowerCase().includes('core'))?.temperature || (h.sensors[0]?.temperature || 0);
                return { time: i, val: ct };
              })}>
                <defs><linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={sysColor} stopOpacity={0.3}/><stop offset="95%" stopColor={sysColor} stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke={sysColor} fill="url(#colorTemp)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* BOTTOM PANELS */}
      <div className="cc-bottom-grid">
        <div className="cc-events-panel">
          <h4>Event Log & Active Problems</h4>
          <div className="events-list">
            {activeProblems.length === 0 ? (
              <div className="event-item healthy">✓ System is running optimally. No active problems detected.</div>
            ) : (
              activeProblems.map((prob, i) => (
                <div key={i} className="event-item critical">! {prob}</div>
              ))
            )}
            <div className="event-item info">i System monitoring initialized.</div>
          </div>
        </div>

        <div className="cc-actions-panel">
          <h4>Quick Actions</h4>
          <button className="cc-btn primary" onClick={() => document.querySelector<HTMLButtonElement>('.nav-item:nth-child(2)')?.click()}>
            RUN FULL DIAGNOSTIC
          </button>
          <button className="cc-btn secondary">Flush RAM Cache</button>
          <button className="cc-btn secondary">Restart Network</button>
          <button className="cc-btn secondary">Check Disk Integrity</button>
        </div>
      </div>

    </div>
  );
}"""

    # Replace the old DashboardGrid
    content = re.sub(r'function DashboardGrid.*?\n\}\n(?=function)', new_dashboard + "\n", content, flags=re.DOTALL)
    
    with open("src/App.tsx", "w") as f:
        f.write(content)

if __name__ == "__main__":
    process_tsx()
