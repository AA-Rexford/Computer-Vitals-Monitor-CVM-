import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Activity, Cpu, HardDrive, Network, MemoryStick, X, Minus, Square, Thermometer, LayoutDashboard, Stethoscope, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import "./App.css";

interface DiskInfo { name: string; file_system: string; mount_point: string; total_space: number; available_space: number; is_removable: boolean; }
interface ProcessInfo { pid: number; name: string; cpu_usage: number;
  uptime: number; memory_usage: number; }
interface NetworkInfo { name: string; rx_bytes: number; tx_bytes: number; }
interface SensorInfo { label: string; temperature: number; }
interface SystemInfoData { 
  name: string; long_os_version: string; kernel_version: string; os_version: string; distribution_id: string; host_name: string;
  cpu_arch: string; cpu_brand: string; cpu_vendor: string; cpu_frequency: number; cpu_cores: number; cpu_logical_cores: number; 
  ram_total: number; swap_total: number; gpu_name: string; vram: string; mac_addresses: string[];
}

interface SystemVitals {
  cpu_usage: number;
  uptime: number;
  ram_total: number;
  ram_used: number;
  disks: DiskInfo[];
  processes: ProcessInfo[];
  networks: NetworkInfo[];
  sensors: SensorInfo[];
  sys_info: SystemInfoData;
}


// Helper
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};




function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
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
  
  if (vitals.cpu_usage > 90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; }
  else if (vitals.cpu_usage > 75) { sysStatus = 'WARNING'; sysColor = '#f59e0b'; }
  
  if ((vitals.ram_used / vitals.ram_total) > 0.90) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; }
  else if ((vitals.ram_used / vitals.ram_total) > 0.80) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } }
  
  if (cpuTemp > 85) { sysStatus = 'CRITICAL'; sysColor = '#ef4444'; }
  else if (cpuTemp > 75) { if (sysStatus === 'HEALTHY') { sysStatus = 'WARNING'; sysColor = '#f59e0b'; } }

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
      alert(result);
    } catch (e: any) {
      alert("Error: " + e);
    }
  };

  const handleKill = async (pid: number) => {
    try {
      const result: string = await invoke("kill_process", { pid });
      alert(result);
    } catch (e: any) {
      alert("Error: " + e);
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
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.cpu_usage }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/><stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/></linearGradient></defs>
                <YAxis domain={[0, 100]} hide />
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
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: (h.ram_used / h.ram_total) * 100 }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                <YAxis domain={[0, 100]} hide />
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
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={history.map((h, i) => {
                const gt = h.sensors.find(s => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('amd') || s.label.toLowerCase().includes('edge'))?.temperature || 0;
                return { time: i, val: gt };
              })} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorGpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                <YAxis domain={[0, 100]} hide />
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
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={history.map((h, i) => ({ time: i, val: h.networks.reduce((acc, n) => acc + n.rx_bytes, 0) }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                <YAxis hide />
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
            <div className="events-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {[...vitals.processes].sort((a, b) => b.memory_usage - a.memory_usage).slice(0, 50).map((p) => (
                <div key={p.pid} className="process-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', marginBottom: '0.25rem', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PID: {p.pid}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: '#00e5ff', fontSize: '0.85rem' }}>{p.cpu_usage.toFixed(1)}% CPU</span>
                    <span style={{ color: '#3b82f6', fontSize: '0.85rem', minWidth: '60px', textAlign: 'right' }}>{formatBytes(p.memory_usage)}</span>
                    <button onClick={() => handleKill(p.pid)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>END</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="cc-actions-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4>Quick Actions</h4>
          <button className="cc-btn primary" onClick={() => document.querySelector<HTMLButtonElement>('.nav-item:nth-child(2)')?.click()}>
            RUN FULL DIAGNOSTIC
          </button>
          <div className="cc-btn-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
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


function DiagnosticsView({ vitals }: { vitals: SystemVitals | null }) {
  if (!vitals) return <p>Loading diagnostics...</p>;

  const issues = [];
  if (vitals.cpu_usage > 90) issues.push({ severity: 'critical', msg: `CPU Usage is critically high (${vitals.cpu_usage.toFixed(1)}%)` });
  else if (vitals.cpu_usage > 75) issues.push({ severity: 'warning', msg: `CPU Usage is high (${vitals.cpu_usage.toFixed(1)}%)` });

  const ramPercent = (vitals.ram_used / vitals.ram_total) * 100;
  if (ramPercent > 95) issues.push({ severity: 'critical', msg: `RAM is almost fully exhausted (${ramPercent.toFixed(1)}%)` });
  else if (ramPercent > 85) issues.push({ severity: 'warning', msg: `RAM usage is high (${ramPercent.toFixed(1)}%)` });

  vitals.sensors.forEach(s => {
    if (s.temperature > 85) issues.push({ severity: 'critical', msg: `Thermal anomaly: ${s.label} is overheating (${s.temperature}°C)` });
    else if (s.temperature > 75) issues.push({ severity: 'warning', msg: `Thermal warning: ${s.label} is running hot (${s.temperature}°C)` });
  });

  return (
    <div className="diagnostics-view">
      <div className="diag-header">
        <Stethoscope size={32} className="diag-icon" />
        <div>
          <h2>System Diagnostics Engine</h2>
          <p>Real-time analysis of hardware evidence</p>
        </div>
      </div>
      
      <div className="issues-list">
        {issues.length === 0 ? (
          <div className="issue-card healthy">
            <CheckCircle2 size={24} />
            <div className="issue-text">
              <h3>System Healthy</h3>
              <p>No anomalies detected in CPU, Memory, or Thermals.</p>
            </div>
          </div>
        ) : (
          issues.map((issue, i) => (
            <div key={i} className={`issue-card ${issue.severity}`}>
              <AlertTriangle size={24} />
              <div className="issue-text">
                <h3>{issue.severity === 'critical' ? 'Critical Anomaly' : 'Warning'}</h3>
                <p>{issue.msg}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SystemInfoView({ vitals }: { vitals: SystemVitals | null }) {
  if (!vitals) return <p>Loading...</p>;
  const info = vitals.sys_info;

  return (
    <div className="sysinfo-view">
      <div className="sysinfo-grid">
        <div className="panel sys-panel">
          <div className="panel-header">
            <Info className="panel-icon" />
            <h2>Operating System</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Host Name</span><span className="prop-value">{info.host_name}</span></div>
            <div className="sys-prop"><span className="prop-label">OS</span><span className="prop-value">{info.long_os_version}</span></div>
            <div className="sys-prop"><span className="prop-label">Distribution</span><span className="prop-value">{info.distribution_id || 'Unavailable'}</span></div>
            <div className="sys-prop"><span className="prop-label">Kernel</span><span className="prop-value">{info.kernel_version}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <Cpu className="panel-icon" />
            <h2>Processor</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Model</span><span className="prop-value gpu-text">{info.cpu_brand}</span></div>
            <div className="sys-prop"><span className="prop-label">Vendor ID</span><span className="prop-value">{info.cpu_vendor}</span></div>
            <div className="sys-prop"><span className="prop-label">Architecture</span><span className="prop-value">{info.cpu_arch || 'Unavailable'}</span></div>
            <div className="sys-prop"><span className="prop-label">Physical Cores</span><span className="prop-value">{info.cpu_cores === 0 ? 'Unavailable' : info.cpu_cores}</span></div>
            <div className="sys-prop"><span className="prop-label">Logical Threads</span><span className="prop-value">{info.cpu_logical_cores}</span></div>
            <div className="sys-prop"><span className="prop-label">Base Clock</span><span className="prop-value">{info.cpu_frequency === 0 ? 'Unavailable' : `${info.cpu_frequency} MHz`}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <MemoryStick className="panel-icon" />
            <h2>Memory subsystem</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Total RAM</span><span className="prop-value">{formatBytes(info.ram_total)}</span></div>
            <div className="sys-prop"><span className="prop-label">Total Swap</span><span className="prop-value">{formatBytes(info.swap_total)}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <Square className="panel-icon" />
            <h2>Graphics Processor</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">GPU Model</span><span className="prop-value gpu-text">{info.gpu_name}</span></div>
            <div className="sys-prop"><span className="prop-label">VRAM</span><span className="prop-value">{info.vram}</span></div>
          </div>
        </div>
        
        <div className="panel sys-panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-header">
            <Network className="panel-icon" />
            <h2>Network Adapters (MAC Addresses)</h2>
          </div>
          <div className="sys-props" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {info.mac_addresses.map((mac, i) => (
              <div key={i} className="sys-prop" style={{ marginBottom: 0 }}>
                <span className="prop-label">Adapter {i+1}</span>
                <span className="prop-value">{mac}</span>
              </div>
            ))}
            {info.mac_addresses.length === 0 && (
              <div className="sys-prop"><span className="prop-label">Adapters</span><span className="prop-value">Unavailable</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function App() {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [history, setHistory] = useState<SystemVitals[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "diagnostics" | "system">("dashboard");

  useEffect(() => {
    let isSubscribed = true;

    const fetchVitals = async () => {
      try {
        const data: SystemVitals = await invoke("get_system_vitals");
        if (!isSubscribed) return;
        
        setVitals(data);
        
        setHistory(prev => {
          const newHistory = [...prev, data];
          return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
        });
      } catch (err) {
        console.error("Failed to fetch vitals:", err);
      }
    };

    fetchVitals();
    const interval = setInterval(fetchVitals, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  const appWindow = getCurrentWindow();

  return (
    <div className="app-layout">
      <aside className="sidebar" data-tauri-drag-region>
        <div className="brand" data-tauri-drag-region>
          <Activity className="brand-icon" />
          <h1 data-tauri-drag-region>C V M</h1>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> <span className="nav-text">Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`} onClick={() => setActiveTab('diagnostics')}>
            <Stethoscope size={18} /> <span className="nav-text">Diagnostics</span>
          </button>
          <button className={`nav-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
            <Info size={18} /> <span className="nav-text">System Info</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="status-badge">
            <span className="status-dot"></span>
            LIVE
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar" data-tauri-drag-region>
          <h2 className="page-title" data-tauri-drag-region>
            {activeTab === 'dashboard' ? 'Overview' : activeTab === 'diagnostics' ? 'Diagnostics Engine' : 'System Identity'}
          </h2>
          
          <div className="window-controls">
            <button className="control-btn" onClick={() => appWindow.minimize()} title="Minimize">
              <Minus size={18} />
            </button>
            <button className="control-btn" onClick={() => appWindow.toggleMaximize()} title="Maximize">
              <Square size={14} />
            </button>
            <button className="control-btn close-btn" onClick={() => appWindow.close()} title="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="tab-content">
          {activeTab === 'dashboard' && <DashboardGrid vitals={vitals} history={history} />}
          {activeTab === 'diagnostics' && <DiagnosticsView vitals={vitals} />}
          {activeTab === 'system' && <SystemInfoView vitals={vitals} />}
        </div>
      </main>
    </div>
  );
}

export default App;
