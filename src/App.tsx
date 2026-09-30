import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Activity, Cpu, HardDrive, Network, MemoryStick, X, Minus, Square } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./App.css";

interface DiskInfo {
  name: string;
  file_system: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  is_removable: boolean;
}

interface ProcessInfo {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_usage: number;
}

interface NetworkInfo {
  name: string;
  rx_bytes: number;
  tx_bytes: number;
}

interface SystemVitals {
  cpu_usage: number;
  ram_total: number;
  ram_used: number;
  disks: DiskInfo[];
  processes: ProcessInfo[];
  networks: NetworkInfo[];
}

interface CpuHistoryPoint {
  time: string;
  usage: number;
}

function App() {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [cpuHistory, setCpuHistory] = useState<CpuHistoryPoint[]>([]);

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
          // Keep last 30 data points
          return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
        });
      } catch (err) {
        console.error("Failed to fetch vitals:", err);
      }
    };

    // Initial fetch
    fetchVitals();
    // Poll every 1 second
    const interval = setInterval(fetchVitals, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ramPercentage = vitals ? ((vitals.ram_used / vitals.ram_total) * 100).toFixed(1) : 0;
  
  const appWindow = getCurrentWindow();

  return (
    <main className="dashboard-container">
      <header className="top-bar" data-tauri-drag-region>
        <div className="brand" data-tauri-drag-region>
          <Activity className="brand-icon" />
          <h1 data-tauri-drag-region>Computer Vitals Monitor</h1>
        </div>
        
        <div className="window-controls">
          <div className="status-badge" data-tauri-drag-region>
            <span className="status-dot"></span>
            COLLECTING EVIDENCE
          </div>
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

      <div className="grid">
        {/* CPU Panel */}
        <section className="panel">
          <div className="panel-header">
            <Cpu className="panel-icon" />
            <h2>CPU Utilization</h2>
            <span className="value-highlight">{vitals ? vitals.cpu_usage.toFixed(1) : "0.0"}%</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={cpuHistory}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} width={30} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0e14', border: '1px solid #1f2937', borderRadius: '4px' }}
                  itemStyle={{ color: '#00e5ff' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="usage" stroke="#00e5ff" fillOpacity={1} fill="url(#colorUsage)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* RAM Panel */}
        <section className="panel">
          <div className="panel-header">
            <MemoryStick className="panel-icon" />
            <h2>Memory</h2>
            <span className="value-highlight">{ramPercentage}%</span>
          </div>
          <div className="metrics-list">
            <div className="metric-row">
              <span className="metric-label">Total</span>
              <span className="metric-value">{vitals ? formatBytes(vitals.ram_total) : "--"}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Used</span>
              <span className="metric-value">{vitals ? formatBytes(vitals.ram_used) : "--"}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Available</span>
              <span className="metric-value">{vitals ? formatBytes(vitals.ram_total - vitals.ram_used) : "--"}</span>
            </div>
          </div>
          <div className="progress-bar-bg mt-4">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${ramPercentage}%` }}
            ></div>
          </div>
        </section>

        {/* Network Panel */}
        <section className="panel">
          <div className="panel-header">
            <Network className="panel-icon" />
            <h2>Network Traffic</h2>
            <span className="value-highlight">{vitals?.networks.length || 0} interfaces</span>
          </div>
          <div className="network-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '160px' }}>
            {vitals?.networks.map((net, idx) => (
              <div key={idx} className="network-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{net.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <span style={{ color: 'var(--accent-green)' }}>↓ {formatBytes(net.rx_bytes)}/s</span>
                  <span style={{ color: 'var(--accent-blue)' }}>↑ {formatBytes(net.tx_bytes)}/s</span>
                </div>
              </div>
            ))}
            {!vitals?.networks.length && <p className="placeholder-text">No active interfaces</p>}
          </div>
        </section>

        {/* Storage Panel */}
        <section className="panel storage-panel">
          <div className="panel-header">
            <HardDrive className="panel-icon" />
            <h2>Storage Drives</h2>
            <span className="value-highlight">{vitals?.disks.length || 0} found</span>
          </div>
          <div className="disk-list">
            {vitals?.disks.map((disk, idx) => {
              const used = disk.total_space - disk.available_space;
              const usedPercent = disk.total_space > 0 ? (used / disk.total_space) * 100 : 0;
              const isWarning = usedPercent > 85;
              const isCritical = usedPercent > 95;
              
              let barColorClass = "progress-bar-fill";
              if (isCritical) barColorClass += " critical";
              else if (isWarning) barColorClass += " warning";

              return (
                <div key={idx} className="disk-item">
                  <div className="disk-header">
                    <span className="disk-name">{disk.name || "Drive"}</span>
                    <span className="disk-mount">{disk.mount_point}</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">{disk.file_system}</span>
                    <span className="metric-value">
                      {formatBytes(used)} / {formatBytes(disk.total_space)}
                    </span>
                  </div>
                  <div className="progress-bar-bg mt-2">
                    <div 
                      className={barColorClass} 
                      style={{ width: `${usedPercent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {!vitals?.disks.length && <p className="placeholder-text">No storage devices detected.</p>}
          </div>
        </section>

        {/* Top Processes Panel */}
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
      </div>
    </main>
  );
}

export default App;
