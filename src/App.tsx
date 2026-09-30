import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Activity, Cpu, HardDrive, Network, MemoryStick, X, Minus, Square, Thermometer, LayoutDashboard, Stethoscope, Info, Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./App.css";

interface DiskInfo { name: string; file_system: string; mount_point: string; total_space: number; available_space: number; is_removable: boolean; }
interface ProcessInfo { pid: number; name: string; cpu_usage: number; memory_usage: number; }
interface NetworkInfo { name: string; rx_bytes: number; tx_bytes: number; }
interface SensorInfo { label: string; temperature: number; }
interface SystemInfoData { 
  name: string; kernel_version: string; os_version: string; host_name: string; uptime: number; 
  cpu_brand: string; cpu_cores: number; cpu_logical_cores: number; ram_total: number; swap_total: number; gpu_name: string;
}

interface SystemVitals {
  cpu_usage: number;
  ram_total: number;
  ram_used: number;
  disks: DiskInfo[];
  processes: ProcessInfo[];
  networks: NetworkInfo[];
  sensors: SensorInfo[];
  sys_info: SystemInfoData;
}

interface CpuHistoryPoint { time: string; usage: number; }

// Helper
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function DashboardGrid({ vitals, cpuHistory }: { vitals: SystemVitals | null, cpuHistory: CpuHistoryPoint[] }) {
  const ramPercentage = vitals ? ((vitals.ram_used / vitals.ram_total) * 100).toFixed(1) : 0;

  return (
    <div className="grid">
      <section className="panel">
        <div className="panel-header">
          <Cpu className="panel-icon" />
          <h2>CPU Utilization</h2>
          <span className="value-highlight">{vitals ? vitals.cpu_usage.toFixed(1) : "0"}%</span>
        </div>
        <div className="chart-container" style={{ height: '100px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cpuHistory}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <YAxis domain={[0, 100]} hide />
              <Area type="monotone" dataKey="usage" stroke="#00e5ff" strokeWidth={2} fillOpacity={1} fill="url(#colorUsage)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <MemoryStick className="panel-icon" />
          <h2>Memory</h2>
          <span className="value-highlight">{ramPercentage}%</span>
        </div>
        <div className="metric-row">
          <span>Total</span>
          <span>{vitals ? formatBytes(vitals.ram_total) : "0 GB"}</span>
        </div>
        <div className="metric-row">
          <span>Used</span>
          <span>{vitals ? formatBytes(vitals.ram_used) : "0 GB"}</span>
        </div>
        <div className="metric-row">
          <span>Available</span>
          <span>{vitals ? formatBytes(vitals.ram_total - vitals.ram_used) : "0 GB"}</span>
        </div>
        <div className="progress-bar mt-2">
          <div className={`progress-bar-fill ${Number(ramPercentage) > 90 ? 'critical' : ''}`} style={{ width: `${ramPercentage}%` }}></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <Network className="panel-icon" />
          <h2>Network Traffic</h2>
          <span className="value-highlight">{vitals?.networks.length || 0} interfaces</span>
        </div>
        <div className="network-list">
          {vitals?.networks.map((net, idx) => (
            <div key={idx} className="network-item">
              <div className="net-name">{net.name}</div>
              <div className="net-speeds">
                <span className="rx">↓ {formatBytes(net.rx_bytes)}/s</span>
                <span className="tx">↑ {formatBytes(net.tx_bytes)}/s</span>
              </div>
            </div>
          ))}
          {!vitals?.networks.length && <p className="placeholder-text">No active interfaces</p>}
        </div>
      </section>

      <section className="panel storage-panel">
        <div className="panel-header">
          <HardDrive className="panel-icon" />
          <h2>Storage Drives</h2>
          <span className="value-highlight">{vitals?.disks.length || 0} found</span>
        </div>
        <div className="disk-list">
          {vitals?.disks.map((disk, idx) => {
            const used = disk.total_space - disk.available_space;
            const percent = ((used / disk.total_space) * 100).toFixed(1);
            return (
              <div key={idx} className="disk-item">
                <div className="disk-header">
                  <span className="disk-name">{disk.name}</span>
                  <span className="disk-mount">{disk.mount_point}</span>
                </div>
                <div className="disk-details">
                  <span>{disk.file_system}</span>
                  <span>{formatBytes(used)} / {formatBytes(disk.total_space)}</span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-bar-fill ${Number(percent) > 90 ? 'critical' : ''}`} style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel process-panel">
        <div className="panel-header">
          <Activity className="panel-icon" />
          <h2>Top Processes</h2>
          <span className="value-highlight">{vitals?.processes.length || 0} listed</span>
        </div>
        <div className="process-list">
          {vitals?.processes.map((proc) => (
            <div key={proc.pid} className="process-item">
              <div className="process-info">
                <span className="process-name" title={proc.name}>
                  {proc.name.length > 20 ? proc.name.substring(0, 20) + "..." : proc.name}
                </span>
                <span className="process-pid">PID: {proc.pid}</span>
              </div>
              <div className="process-metrics">
                <span className="metric-badge cpu">{proc.cpu_usage.toFixed(1)}%</span>
                <span className="metric-badge ram">{formatBytes(proc.memory_usage)}</span>
              </div>
            </div>
          ))}
          {!vitals?.processes && <p className="placeholder-text">Gathering process data...</p>}
        </div>
      </section>

      <section className="panel sensor-panel">
        <div className="panel-header">
          <Thermometer className="panel-icon" />
          <h2>Hardware Sensors</h2>
          <span className="value-highlight">{vitals?.sensors.length || 0} reading{vitals?.sensors.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="sensor-list">
          {vitals?.sensors.map((sensor, idx) => (
            <div key={idx} className="sensor-item">
              <span className="sensor-label">{sensor.label}</span>
              <span className={`metric-badge ${sensor.temperature > 80 ? 'critical' : ''}`} style={{ 
                color: sensor.temperature > 80 ? '#ef4444' : sensor.temperature > 65 ? '#f59e0b' : 'var(--accent-cyan)',
                background: sensor.temperature > 80 ? 'rgba(239,68,68,0.1)' : sensor.temperature > 65 ? 'rgba(245,158,11,0.1)' : 'rgba(0,229,255,0.1)'
              }}>
                {sensor.temperature.toFixed(1)}°C
              </span>
            </div>
          ))}
          {!vitals?.sensors.length && <p className="placeholder-text">No temperature sensors detected</p>}
        </div>
      </section>
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
  
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

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
            <div className="sys-prop"><span className="prop-label">OS Name</span><span className="prop-value">{info.name} {info.os_version}</span></div>
            <div className="sys-prop"><span className="prop-label">Kernel</span><span className="prop-value">{info.kernel_version}</span></div>
            <div className="sys-prop"><span className="prop-label">Uptime</span><span className="prop-value highlight">{formatUptime(info.uptime)}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <Cpu className="panel-icon" />
            <h2>Processor</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Model</span><span className="prop-value">{info.cpu_brand}</span></div>
            <div className="sys-prop"><span className="prop-label">Physical Cores</span><span className="prop-value">{info.cpu_cores}</span></div>
            <div className="sys-prop"><span className="prop-label">Logical Threads</span><span className="prop-value">{info.cpu_logical_cores}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <MemoryStick className="panel-icon" />
            <h2>Memory</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Total RAM</span><span className="prop-value">{formatBytes(info.ram_total)}</span></div>
            <div className="sys-prop"><span className="prop-label">Total Swap</span><span className="prop-value">{formatBytes(info.swap_total)}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <Square className="panel-icon" />
            <h2>Graphics</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">GPU Model</span><span className="prop-value" title={info.gpu_name}>
              {info.gpu_name.length > 30 ? info.gpu_name.substring(0, 30) + '...' : info.gpu_name}
            </span></div>
          </div>
        </div>
      </div>
    </div>
  );
}


function App() {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [cpuHistory, setCpuHistory] = useState<CpuHistoryPoint[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "diagnostics" | "system">("dashboard");

  useEffect(() => {
    let isSubscribed = true;

    const fetchVitals = async () => {
      try {
        const data: SystemVitals = await invoke("get_system_vitals");
        if (!isSubscribed) return;
        
        setVitals(data);
        
        setCpuHistory(prev => {
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          const newPoint = { time: timeString, usage: data.cpu_usage };
          const newHistory = [...prev, newPoint];
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
          {activeTab === 'dashboard' && <DashboardGrid vitals={vitals} cpuHistory={cpuHistory} />}
          {activeTab === 'diagnostics' && <DiagnosticsView vitals={vitals} />}
          {activeTab === 'system' && <SystemInfoView vitals={vitals} />}
        </div>
      </main>
    </div>
  );
}

export default App;
