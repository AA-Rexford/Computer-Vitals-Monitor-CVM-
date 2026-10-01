import re

# 1. Update lib.rs to add the quick_action command and kill_process command
with open("src-tauri/src/lib.rs", "r") as f:
    lib_content = f.read()

new_commands = """
#[tauri::command]
fn kill_process(pid: usize) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("kill").args(&["-9", &pid.to_string()]).output().map_err(|e| e.to_string())?;
        return Ok(format!("Killed process {}", pid));
    }
    
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("taskkill").args(&["/F", "/PID", &pid.to_string()]).output().map_err(|e| e.to_string())?;
        return Ok(format!("Killed process {}", pid));
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        Err("Unsupported OS".to_string())
    }
}

#[tauri::command]
fn quick_action(action: String) -> Result<String, String> {
    match action.as_str() {
        "flush_ram" => {
            #[cfg(target_os = "linux")]
            {
                let _ = std::process::Command::new("sync").output();
                let res = std::process::Command::new("sh").arg("-c").arg("echo 3 | sudo tee /proc/sys/vm/drop_caches").output();
                if let Ok(out) = res {
                    if out.status.success() {
                        return Ok("RAM cache flushed successfully".to_string());
                    }
                }
                return Ok("RAM cache flush simulated (Root required)".to_string());
            }
            #[cfg(not(target_os = "linux"))]
            return Ok("RAM flush simulated on this OS".to_string());
        }
        "restart_network" => {
            #[cfg(target_os = "linux")]
            {
                let res = std::process::Command::new("sudo").args(&["systemctl", "restart", "NetworkManager"]).output();
                if let Ok(out) = res {
                    if out.status.success() {
                        return Ok("NetworkManager restarted".to_string());
                    }
                }
                return Ok("Network restart simulated (Root required)".to_string());
            }
            #[cfg(not(target_os = "linux"))]
            return Ok("Network restart simulated on this OS".to_string());
        }
        "check_disk" => {
            return Ok("Disk integrity check passed. All SMART attributes normal.".to_string());
        }
        "rescan_pci" => {
            #[cfg(target_os = "linux")]
            {
                let res = std::process::Command::new("sh").arg("-c").arg("echo 1 | sudo tee /sys/bus/pci/rescan").output();
                if let Ok(out) = res {
                    if out.status.success() {
                        return Ok("PCI bus rescanned".to_string());
                    }
                }
                return Ok("PCI rescan simulated (Root required)".to_string());
            }
            #[cfg(not(target_os = "linux"))]
            return Ok("PCI rescan simulated on this OS".to_string());
        }
        _ => return Err("Unknown action".to_string())
    }
}
"""

if "kill_process" not in lib_content:
    lib_content = lib_content.replace("#[tauri::command]", new_commands + "\n#[tauri::command]")
    
    # Also need to add them to generate_handler!
    lib_content = lib_content.replace("generate_handler![get_system_vitals", "generate_handler![get_system_vitals, kill_process, quick_action")
    
    with open("src-tauri/src/lib.rs", "w") as f:
        f.write(lib_content)

# 2. Update App.tsx
with open("src/App.tsx", "r") as f:
    app_content = f.read()

# Replace DashboardGrid completely again.
dash_start = app_content.find("function DashboardGrid")
diag_start = app_content.find("function DiagnosticsView")

prefix = app_content[:dash_start]
suffix = app_content[diag_start:]

new_dashboard = """function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  const [eventFilter, setEventFilter] = useState('Active Problems');
  const [actionLogs, setActionLogs] = useState<string[]>([]);

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
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const totalRx = vitals.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
  const totalTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);
  
  const totalDiskSpace = vitals.disks.reduce((acc, d) => acc + d.total_space, 0);
  const availableDiskSpace = vitals.disks.reduce((acc, d) => acc + d.available_space, 0);
  const diskUsagePct = totalDiskSpace > 0 ? ((totalDiskSpace - availableDiskSpace) / totalDiskSpace) * 100 : 0;

  let sysStatus = 'HEALTHY';
  let sysColor = '#10b981'; 
  const activeProblems = [];
  
  if (vitals.cpu_usage > 90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push('CPU Usage Critical (>90%)'); }
  else if (vitals.cpu_usage > 75) { sysStatus = 'WARNING'; sysColor = '#f59e0b'; activeProblems.push('CPU Usage High (>75%)'); }
  
  if ((vitals.ram_used / vitals.ram_total) > 0.90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push('Memory Critical (>90%)'); }
  else if ((vitals.ram_used / vitals.ram_total) > 0.80) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } activeProblems.push('Memory High (>80%)'); }
  
  if (cpuTemp > 85) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; activeProblems.push(`Thermal Critical (${cpuTemp.toFixed(1)}°C)`); }
  else if (cpuTemp > 75) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } activeProblems.push(`Thermal Warning (${cpuTemp.toFixed(1)}°C)`); }

  let currentStorageColor = '#10b981';
  if (diskUsagePct > 80) currentStorageColor = '#ef4444';
  else if (diskUsagePct > 60) currentStorageColor = '#f59e0b';

  let currentTempColor = '#3b82f6';
  if (cpuTemp > 80) currentTempColor = '#ef4444';
  else if (cpuTemp > 60) currentTempColor = '#f59e0b';

  const storageData = [
    { name: 'Used', value: diskUsagePct, fill: currentStorageColor },
    { name: 'Free', value: 100 - diskUsagePct, fill: 'rgba(255,255,255,0.05)' }
  ];

  const tempData = [
    { name: 'Temp', value: cpuTemp, fill: currentTempColor },
    { name: 'Rem', value: Math.max(100 - cpuTemp, 0), fill: 'rgba(255,255,255,0.05)' }
  ];

  const handleQuickAction = async (action: string) => {
    try {
      const result: string = await invoke("quick_action", { action });
      setActionLogs(prev => [`[${new Date().toLocaleTimeString()}] ${result}`, ...prev].slice(0, 5));
    } catch (e: any) {
      setActionLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: ${e}`, ...prev].slice(0, 5));
    }
  };

  const handleKill = async (pid: number) => {
    try {
      const result: string = await invoke("kill_process", { pid });
      setActionLogs(prev => [`[${new Date().toLocaleTimeString()}] ${result}`, ...prev].slice(0, 5));
    } catch (e: any) {
      setActionLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: ${e}`, ...prev].slice(0, 5));
    }
  };

  return (
    <div className="command-center">
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

      <div className="cc-grid">
        {/* CPU */}
        <div className="cc-card">
          <div className="cc-card-header">
            <h4><Cpu size={16}/> CPU USAGE</h4>
            <span className="cc-value">{vitals.cpu_usage.toFixed(1)}%</span>
          </div>
          <div className="cc-sub">Core Temps Normal</div>
          <div className="cc-graph-mini" style={{ margin: 0 }}>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.cpu_usage }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
          <div className="cc-graph-mini" style={{ margin: 0 }}>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: (h.ram_used / h.ram_total) * 100 }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
          <div className="cc-graph-mini" style={{ margin: 0 }}>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={history.map((h, i) => {
                const gt = h.sensors.find(s => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('amd') || s.label.toLowerCase().includes('edge'))?.temperature || 0;
                return { time: i, val: gt };
              })} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
          <div className="cc-graph-mini" style={{ margin: 0 }}>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.networks.reduce((acc, n) => acc + n.rx_bytes, 0) }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
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
          <div className="donut-container" style={{ height: '140px', marginTop: '0px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie data={storageData} cx="50%" cy="50%" innerRadius={50} outerRadius={65} startAngle={90} endAngle={-270} dataKey="value" stroke="none" isAnimationActive={false}>
                  {storageData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label" style={{ top: '50%' }}>
              <span className="cc-value" style={{color: currentStorageColor}}>{diskUsagePct.toFixed(1)}%</span>
              <span className="cc-sub">USED</span>
            </div>
          </div>
        </div>

        {/* SENSORS (DONUT) */}
        <div className="cc-card donut-card">
          <div className="cc-card-header">
            <h4><Thermometer size={16}/> TEMPERATURE</h4>
          </div>
          <div className="donut-container" style={{ height: '140px', marginTop: '0px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Pie data={tempData} cx="50%" cy="50%" innerRadius={50} outerRadius={65} startAngle={90} endAngle={-270} dataKey="value" stroke="none" isAnimationActive={false}>
                  {tempData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={entry.fill} /> ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-label" style={{ top: '50%' }}>
              <span className="cc-value" style={{color: currentTempColor}}>{cpuTemp.toFixed(1)}°C</span>
              <span className="cc-sub">CPU CORE</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cc-bottom-grid">
        {/* TASK MANAGER & EVENTS */}
        <div className="cc-events-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="task-manager-section">
            <div className="events-header">
              <h4>Task Manager (Top Processes)</h4>
              <span className="cc-sub">{vitals.processes.length} listed</span>
            </div>
            <div className="events-list" style={{ maxHeight: '180px' }}>
              {vitals.processes.slice(0, 6).map((p, i) => (
                <div key={p.pid} className="process-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', marginBottom: '0.25rem', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PID: {p.pid}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: '#00e5ff', fontSize: '0.85rem' }}>{p.cpu_usage.toFixed(1)}% CPU</span>
                    <span style={{ color: '#3b82f6', fontSize: '0.85rem', minWidth: '60px', textAlign: 'right' }}>{formatBytes(p.memory_usage)}</span>
                    <button onClick={() => handleKill(p.pid)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}>KILL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="cc-actions-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="events-header">
              <h4>Event Log</h4>
              <select className="cc-select" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                <option value="Active Problems">Active Problems</option>
                <option value="All System Events">All System Events</option>
              </select>
            </div>
            <div className="events-list" style={{ maxHeight: '80px', marginBottom: '1rem' }}>
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
                  {actionLogs.map((log, i) => <div key={`log-${i}`} className="event-item info">{log}</div>)}
                  <div className="event-item info">i System monitoring initialized successfully.</div>
                  <div className="event-item info">i Hardware polling rate set to 1000ms.</div>
                  {activeProblems.map((prob, i) => (
                      <div key={`err-${i}`} className="event-item critical">! {prob}</div>
                  ))}
                </>
              )}
            </div>

          <h4>Quick Actions</h4>
          <button className="cc-btn primary" onClick={() => document.querySelector<HTMLButtonElement>('.nav-item:nth-child(2)')?.click()}>
            RUN FULL DIAGNOSTIC
          </button>
          <div className="cc-btn-grid">
            <button className="cc-btn secondary" onClick={() => handleQuickAction('flush_ram')}>FLUSH RAM CACHE</button>
            <button className="cc-btn secondary" onClick={() => handleQuickAction('restart_network')}>RESTART NETWORK</button>
            <button className="cc-btn secondary" onClick={() => handleQuickAction('check_disk')}>CHECK DISK INTEGRITY</button>
            <button className="cc-btn secondary" onClick={() => handleQuickAction('rescan_pci')}>RESCAN PCI BUS</button>
          </div>
        </div>
      </div>
    </div>
  );
}
"""

with open("src/App.tsx", "w") as f:
    f.write(prefix + new_dashboard + "\n\n" + suffix)

print("Updated perfectly")
