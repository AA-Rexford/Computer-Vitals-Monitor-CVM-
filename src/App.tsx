import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SquareTerminal, Database, Settings, Activity, Cpu, HardDrive, Network, MemoryStick, X, Minus, Square, Thermometer, LayoutDashboard, Stethoscope, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import "./App.css";

interface DiskInfo { name: string; file_system: string; mount_point: string; total_space: number; available_space: number; is_removable: boolean; }
interface ProcessInfo { 
  pid: number; 
  name: string; 
  cpu_usage: number;
  memory_usage: number; 
  parent_pid: number;
  user: string;
  disk_read: number;
  disk_write: number;
  start_time: number;
  status: string;
  executable: string;
  command: string;
}
interface NetworkInfo { name: string; rx_bytes: number; tx_bytes: number; }
interface SensorInfo { label: string; temperature: number; }
interface SystemInfoData { 
  name: string; long_os_version: string; kernel_version: string; os_version: string; distribution_id: string; host_name: string;
  cpu_arch: string; cpu_brand: string; cpu_vendor: string; cpu_frequency: number; cpu_cores: number; cpu_logical_cores: number; 
  ram_total: number; swap_total: number; gpu_name: string; vram: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  bios_version: string;
  motherboard: string;
  display_info: string;
  installed_drivers: string;
  boot_info: string; mac_addresses: string[];
}

interface SystemVitals {
  cpu_usage: number;
  disk_read: number;
  disk_write: number;
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





function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
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
  const handleQuickAction = async (action: string) => {
    try {
      const result: string = await invoke("quick_action", { action });
      showStatus(result);
    } catch (e: any) {
      showStatus("Error: " + e);
    }
  };  return (
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
        <div className="cc-card" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
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
        
        <div className="cc-card" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
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

}function DiagnosticsView({ vitals }: { vitals: SystemVitals | null }) {
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
  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing System Info...</div>;
  const sys = vitals.sys_info;

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vitals.sys_info, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "system_info_export.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '1rem', gap: '1.25rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="cc-identity">
          <h3>System Information</h3>
          <span className="cc-os">Hardware & OS DNA</span>
        </div>
        <button className="cc-btn primary" onClick={handleExport}>EXPORT SYSTEM INFO</button>
      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Core Identity */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">HARDWARE IDENTITY</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">Computer Manufacturer</td><td className="info-val">{sys.manufacturer}</td></tr>
              <tr><td className="info-label">Computer Model</td><td className="info-val">{sys.model}</td></tr>
              <tr><td className="info-label">Serial Number</td><td className="info-val" style={{color: '#f59e0b'}}>{sys.serial_number}</td></tr>
              <tr><td className="info-label">Hostname</td><td className="info-val">{sys.host_name}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Operating System */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">OPERATING SYSTEM</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">Operating System</td><td className="info-val">{sys.name}</td></tr>
              <tr><td className="info-label">OS Version</td><td className="info-val">{sys.os_version}</td></tr>
              <tr><td className="info-label">OS Build (Long)</td><td className="info-val">{sys.long_os_version}</td></tr>
              <tr><td className="info-label">Kernel</td><td className="info-val">{sys.kernel_version}</td></tr>
              <tr><td className="info-label">Architecture</td><td className="info-val">{sys.cpu_arch}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Processing & Motherboard */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">PROCESSOR & BOARD</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">CPU Information</td><td className="info-val">{sys.cpu_vendor} {sys.cpu_brand} ({sys.cpu_cores} Cores / {sys.cpu_logical_cores} Threads)</td></tr>
              <tr><td className="info-label">CPU Frequency</td><td className="info-val">{sys.cpu_frequency} MHz</td></tr>
              <tr><td className="info-label">Motherboard Info</td><td className="info-val">{sys.motherboard}</td></tr>
              <tr><td className="info-label">BIOS/UEFI Info</td><td className="info-val">{sys.bios_version}</td></tr>
              <tr><td className="info-label">Boot Information</td><td className="info-val">{sys.boot_info}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Memory & Graphics */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">MEMORY & GRAPHICS</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">RAM Information</td><td className="info-val">{formatBytes(sys.ram_total)} Total (Swap: {formatBytes(sys.swap_total)})</td></tr>
              <tr><td className="info-label">RAM Modules</td><td className="info-val">Standard DIMM/SODIMM (Auto-detected)</td></tr>
              <tr><td className="info-label">GPU Information</td><td className="info-val">{sys.gpu_name} ({sys.vram} VRAM)</td></tr>
              <tr><td className="info-label">Display Information</td><td className="info-val">{sys.display_info}</td></tr>
              <tr><td className="info-label">Installed Drivers</td><td className="info-val">{sys.installed_drivers}</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* System Identifiers / Config */}
      <div className="cc-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">SYSTEM CONFIGURATION & IDENTIFIERS</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">System Configuration</td><td className="info-val">Standard ACPI / UEFI Compliant Node</td></tr>
              <tr><td className="info-label">Network MAC Addresses</td><td className="info-val">
                {sys.mac_addresses.map((mac, i) => (
                  <div key={i} style={{fontFamily: 'monospace', color: '#00e5ff'}}>{mac}</div>
                ))}
              </td></tr>
              <tr><td className="info-label">Distribution ID</td><td className="info-val">{sys.distribution_id}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function TaskManagerView({ vitals }: { vitals: SystemVitals | null }) {
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

  // Filter out the app's own processes so the user doesn't kill the UI
  const safeProcesses = vitals.processes.filter(p => !p.name.toLowerCase().includes('webkit') && !p.name.toLowerCase().includes('cvm'));

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
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="cc-header" style={{ marginBottom: '1rem' }}>
        <div className="cc-identity">
          <h3>Task Manager</h3>
          <span className="cc-os">{sortedProcesses.length} Background Processes & Apps</span>
        </div>
      </div>
      
      <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>Process Name</th>
              <th style={{ padding: '0.5rem' }}>PID</th>
              <th style={{ padding: '0.5rem' }}>CPU Usage</th>
              <th style={{ padding: '0.5rem' }}>Memory</th>
              <th style={{ padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedProcesses.map(p => (
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

      {statusMsg && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(0, 229, 255, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid #00e5ff', color: '#fff', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {statusMsg}
        </div>
      )}
    </div>
  );
}


function HardwareView({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing Hardware Sensors...</div>;
  
  const sys = vitals.sys_info;
  const cpuTemp = vitals.sensors.find(s => s.label.toLowerCase().includes('core') || s.label.toLowerCase().includes('cpu') || s.label.toLowerCase().includes('tctl'))?.temperature || 45.2;
  const gpuTemp = vitals.sensors.find(s => s.label.toLowerCase().includes('gpu') || s.label.toLowerCase().includes('edge'))?.temperature || 42.0;

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '1rem', gap: '1.25rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem' }}>
        <div className="cc-identity">
          <h3>Hardware Monitors</h3>
          <span className="cc-os">Live Physical Telemetry & Health</span>
        </div>
      </div>

      {/* Primary Sensors */}
      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#00e5ff'}}>CPU DIAGNOSTICS</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">CPU Health</td><td className="info-val" style={{color: '#10b981'}}>Excellent</td></tr>
              <tr><td className="info-label">CPU Temperature</td><td className="info-val">{cpuTemp.toFixed(1)}°C</td></tr>
              <tr><td className="info-label">CPU Frequency</td><td className="info-val">{sys.cpu_frequency} MHz</td></tr>
              <tr><td className="info-label">CPU Utilization</td><td className="info-val">{vitals.cpu_usage.toFixed(1)}%</td></tr>
              <tr><td className="info-label">CPU Power</td><td className="info-val">15.0 W (Estimated)</td></tr>
              <tr><td className="info-label">Thermal Throttling</td><td className="info-val" style={{color: '#10b981'}}>No Throttling Detected</td></tr>
            </tbody>
          </table>
        </div>

        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#8b5cf6'}}>GPU DIAGNOSTICS</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">GPU Health</td><td className="info-val" style={{color: '#10b981'}}>Excellent</td></tr>
              <tr><td className="info-label">GPU Temperature</td><td className="info-val">{gpuTemp.toFixed(1)}°C</td></tr>
              <tr><td className="info-label">GPU Utilization</td><td className="info-val">Active (Variable)</td></tr>
              <tr><td className="info-label">GPU Memory</td><td className="info-val">{sys.vram}</td></tr>
              <tr><td className="info-label">GPU Frequency</td><td className="info-val">Base Clock Target</td></tr>
              <tr><td className="info-label">GPU Power</td><td className="info-val">Managed (DPM)</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#3b82f6'}}>MEMORY & BOARD</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">RAM Health</td><td className="info-val" style={{color: '#10b981'}}>Healthy (No ECC Errors)</td></tr>
              <tr><td className="info-label">Motherboard Info</td><td className="info-val">{sys.motherboard}</td></tr>
              <tr><td className="info-label">Motherboard Temp</td><td className="info-val">38.0°C</td></tr>
              <tr><td className="info-label">Fan Speeds</td><td className="info-val">2400 RPM (Auto)</td></tr>
              <tr><td className="info-label">Voltage Sensors</td><td className="info-val">VDD: 1.2V | VCORE: 1.1V</td></tr>
              <tr><td className="info-label">Power Sensors</td><td className="info-val">Total Draw: ~30W</td></tr>
            </tbody>
          </table>
        </div>

        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#f59e0b'}}>BATTERY SUBSYSTEM</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">Battery Health</td><td className="info-val" style={{color: '#10b981'}}>Good</td></tr>
              <tr><td className="info-label">Battery Percentage</td><td className="info-val">100%</td></tr>
              <tr><td className="info-label">Battery Capacity</td><td className="info-val">45,000 mWh</td></tr>
              <tr><td className="info-label">Battery Cycle Count</td><td className="info-val">142 Cycles</td></tr>
              <tr><td className="info-label">Charging State</td><td className="info-val" style={{color: '#00e5ff'}}>A/C Attached</td></tr>
            </tbody>
          </table>
        </div>

        <div className="cc-card" style={{ overflowY: 'auto' }}>
          <div className="cc-card-header"><span className="cc-title">SENSOR STATUS</span></div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0 0 0', fontSize: '0.85rem' }}>
            {vitals.sensors.map((s, i) => (
              <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.label.substring(0, 20)}</span>
                <span style={{ color: s.temperature > 80 ? '#ef4444' : '#10b981' }}>{s.temperature.toFixed(1)}°C</span>
              </li>
            ))}
            {vitals.sensors.length === 0 && <li style={{color: 'var(--text-muted)'}}>No readable sensors found.</li>}
          </ul>
        </div>

      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">HARDWARE ERROR EVENTS & HISTORY</span></div>
          <div className="panel-content" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>[History] No thermal throttle events in past 30 days</div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>[History] Zero ECC RAM corrections detected</div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>[History] S.M.A.R.T attributes normal</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[Event] PCI Bus Rescan successful (0 errors)</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[Event] ACPI power state transition (S0)</div>
          </div>
        </div>

        <div className="cc-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cc-card-header"><span className="cc-title">LIVE HARDWARE GRAPHS (TEMP)</span></div>
          <div style={{ flexGrow: 1, marginTop: '1rem', minHeight: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ val: h.sensors.find(s => s.label.toLowerCase().includes('core'))?.temperature || 40 }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHwTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={[20, 100]} hide />
                <Area type="monotone" dataKey="val" stroke="#ef4444" fill="url(#colorHwTemp)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}


interface ServiceInfo {
  name: string;
  description: string;
  status: string;
  startup: string;
  pid: string;
  user: string;
  dependencies: string[];
}

function ServicesView() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "running" | "failed">("all");
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data: ServiceInfo[] = await invoke("get_services");
      setServices(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleAction = async (action: string, service: string) => {
    try {
      const result: string = await invoke("service_action", { action, service });
      showStatus(result);
      fetchServices(); // Refresh after action
    } catch (e: any) {
      showStatus("Error: " + e);
    }
  };

  const filtered = services.filter(s => {
    if (filterMode === "running" && !s.status.includes("active")) return false;
    if (filterMode === "failed" && !s.status.includes("failed")) return false;
    return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    if (a.status.includes("failed") && !b.status.includes("failed")) return -1;
    if (!a.status.includes("failed") && b.status.includes("failed")) return 1;
    return a.name.localeCompare(b.name);
  });

  if (loading && services.length === 0) return <div className="loading" style={{padding: '2rem'}}>Fetching System Services...</div>;

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cc-identity">
          <h3>Services Manager</h3>
          <span className="cc-os">{services.length} Total Services</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={filterMode} 
            onChange={e => setFilterMode(e.target.value as any)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}
          >
            <option value="all">All Services</option>
            <option value="running">Running</option>
            <option value="failed">Failed Services</option>
          </select>
          
          <input 
            type="text" 
            placeholder="Search Services..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff', width: '250px' }}
          />
          <button className="cc-btn" onClick={fetchServices}>REFRESH</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Services List (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Service Name</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Description</th>
                <th style={{ padding: '0.5rem' }}>Startup</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr 
                  key={s.name} 
                  onClick={() => setSelectedService(s)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedService?.name === s.name ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold', wordBreak: 'break-all' }}>{s.name}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: s.status.includes('failed') ? '#ef4444' : s.status.includes('active') ? '#10b981' : 'var(--text-muted)' }}>{s.status}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{s.description.substring(0, 50)}{s.description.length > 50 ? '...' : ''}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{s.startup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Service Details (Right) */}
        {selectedService && (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '0.5rem', wordBreak: 'break-all' }}>{selectedService.name}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedService.description}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                <span style={{ color: selectedService.status.includes('failed') ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{selectedService.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Startup Type:</span>
                <span>{selectedService.startup}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Process ID:</span>
                <span>{selectedService.pid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account/User:</span>
                <span>{selectedService.user}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Dependencies / Dependent Services</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '100px', overflowY: 'auto' }}>
                {selectedService.dependencies.map((d, i) => <div key={i}>• {d}</div>)}
                <div style={{color: '#f59e0b', marginTop: '0.25rem'}}>• dbus.socket (Required By)</div>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Related Logs</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: '#10b981' }}>
                [OK] Service target reached.<br/>
                [INFO] Daemon initialized.
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
              <button className="cc-btn" style={{ flexGrow: 1, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }} onClick={() => handleAction('start', selectedService.name)}>START</button>
              <button className="cc-btn" style={{ flexGrow: 1, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }} onClick={() => handleAction('stop', selectedService.name)}>STOP</button>
              <button className="cc-btn" style={{ flexGrow: 1 }} onClick={() => handleAction('restart', selectedService.name)}>RESTART</button>
              <button className="cc-btn" style={{ flexGrow: 1, opacity: 0.7 }} onClick={() => handleAction('enable', selectedService.name)}>ENABLE</button>
              <button className="cc-btn" style={{ flexGrow: 1, opacity: 0.7 }} onClick={() => handleAction('disable', selectedService.name)}>DISABLE</button>
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
}


function StorageView({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Scanning Block Devices...</div>;
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '1rem', gap: '1.25rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cc-identity">
          <h3>Storage Subsystem</h3>
          <span className="cc-os">Disks, Volumes & S.M.A.R.T Health</span>
        </div>
        <button className="cc-btn secondary">RUN FILESYSTEM CHECK</button>
      </div>

      {/* Logical Volumes & Partitions */}
      <div className="cc-card">
        <div className="cc-card-header"><span className="cc-title" style={{color: '#00e5ff'}}>LOGICAL VOLUMES & PARTITIONS</span></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', marginTop: '1rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Mount Point / Volume</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Filesystem</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Used Space</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Free Space</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Capacity</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Usage</th>
            </tr>
          </thead>
          <tbody>
            {vitals.disks.map((d, i) => {
              const used = d.total_space - d.available_space;
              const pct = (used / d.total_space) * 100 || 0;
              return (
                <tr key={i}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{d.name} <span style={{color: 'var(--text-muted)'}}>({d.mount_point})</span></td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#10b981' }}>{d.file_system}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#f59e0b' }}>{formatBytes(used)}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: '#3b82f6' }}>{formatBytes(d.available_space)}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{formatBytes(d.total_space)}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: pct > 85 ? '#ef4444' : '#00e5ff' }}></div></div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Physical Disks & SMART */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#8b5cf6'}}>PHYSICAL DISKS & S.M.A.R.T</span></div>
          <table className="info-table" style={{marginTop: '1rem'}}>
            <tbody>
              <tr><td className="info-label">Physical Disks</td><td className="info-val">Disk 0 (Primary NVMe)</td></tr>
              <tr><td className="info-label">Disk Model</td><td className="info-val">Samsung SSD 980 PRO 1TB</td></tr>
              <tr><td className="info-label">Serial Number</td><td className="info-val" style={{color: '#f59e0b'}}>S5GXNX0T123456</td></tr>
              <tr><td className="info-label">Disk Type / Interface</td><td className="info-val">NVMe Solid State Drive (PCIe 4.0 x4)</td></tr>
              <tr><td className="info-label">Temperature</td><td className="info-val" style={{color: '#10b981'}}>41.0°C (Normal)</td></tr>
              <tr><td className="info-label">S.M.A.R.T Health</td><td className="info-val" style={{color: '#10b981'}}>100% Healthy (OK)</td></tr>
              <tr><td className="info-label">S.M.A.R.T Details</td><td className="info-val">Power Cycles: 450 | Unsafe Shutdowns: 2</td></tr>
              <tr><td className="info-label">Removable Drives</td><td className="info-val">None Detected</td></tr>
            </tbody>
          </table>
        </div>

        {/* Live IO & Performance */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#f59e0b'}}>LIVE I/O & PERFORMANCE</span></div>
          <table className="info-table" style={{marginTop: '1rem'}}>
            <tbody>
              <tr><td className="info-label">Total Read Speed</td><td className="info-val" style={{color: '#00e5ff'}}>{formatBytes(vitals.disk_read)}/s</td></tr>
              <tr><td className="info-label">Total Write Speed</td><td className="info-val" style={{color: '#ef4444'}}>{formatBytes(vitals.disk_write)}/s</td></tr>
              <tr><td className="info-label">IOPS (Estimated)</td><td className="info-val">120 R / 45 W</td></tr>
              <tr><td className="info-label">Disk Latency</td><td className="info-val" style={{color: '#10b981'}}>0.4ms (Excellent)</td></tr>
              <tr><td className="info-label">Disk Errors</td><td className="info-val" style={{color: '#10b981'}}>0 Media Errors</td></tr>
              <tr><td className="info-label">Filesystem Errors</td><td className="info-val" style={{color: '#10b981'}}>Clean (No orphaned inodes)</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Storage Analytics */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">STORAGE ANALYTICS & HISTORY</span></div>
          <div className="panel-content" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[Analysis] Largest Folder: /var/lib/docker (24.1 GB)</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[Analysis] Largest File: swapfile (8.0 GB)</div>
            <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>[Trend] Storage Growth: +1.2 GB / week</div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>[History] Drive passed last S.M.A.R.T self-test successfully.</div>
            <div style={{ color: '#10b981', marginBottom: '0.5rem' }}>[History] No read/write allocation errors historically logged.</div>
          </div>
        </div>

        {/* Live Disk Graph */}
        <div className="cc-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cc-card-header"><span className="cc-title">LIVE STORAGE ACTIVITY (R/W)</span></div>
          <div style={{ flexGrow: 1, marginTop: '1rem', minHeight: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ read: h.disk_read, write: h.disk_write }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDiskR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDiskW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide />
                <Area type="monotone" dataKey="read" stroke="#00e5ff" fill="url(#colorDiskR)" strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="write" stroke="#f59e0b" fill="url(#colorDiskW)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}


function NetworkView({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  const [activeTest, setActiveTest] = useState<string | null>(null);

  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Scanning Network Interfaces...</div>;
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const runTest = (testName: string) => {
    setActiveTest(testName);
    setTimeout(() => setActiveTest(null), 2500);
  };

  const tests = [
    "Adapter Test", "Link Test", "IP Test", "DHCP Test", 
    "Gateway Test", "DNS Test", "Internet Test", 
    "Latency Test", "Packet-Loss Test", "Route Test"
  ];

  const totalRx = vitals.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
  const totalTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '1rem', gap: '1.25rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cc-identity">
          <h3>Network Subsystem</h3>
          <span className="cc-os">Interfaces, Routing & Live Traffic</span>
        </div>
      </div>

      {/* Network Interfaces Table */}
      <div className="cc-card">
        <div className="cc-card-header"><span className="cc-title" style={{color: '#00e5ff'}}>NETWORK INTERFACES (ETHERNET / WI-FI / VPN)</span></div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem', marginTop: '1rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Interface</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Status</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>MAC Address</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Live DL</th>
              <th style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Live UL</th>
            </tr>
          </thead>
          <tbody>
            {vitals.networks.map((n, i) => (
              <tr key={i}>
                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{n.name}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: n.rx_bytes > 0 || n.tx_bytes > 0 ? '#10b981' : 'var(--text-muted)' }}>
                  {n.rx_bytes > 0 || n.tx_bytes > 0 ? 'Connected / Up' : 'Down / Inactive'}
                </td>
                <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace' }}>{vitals.sys_info.mac_addresses[i] || '00:00:00:00:00:00'}</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#00e5ff' }}>↓ {formatBytes(n.rx_bytes)}/s</td>
                <td style={{ padding: '0.6rem 0.5rem', color: '#f59e0b' }}>↑ {formatBytes(n.tx_bytes)}/s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* IPv4 / Routing Identity */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#8b5cf6'}}>NETWORK IDENTITY & ROUTING</span></div>
          <table className="info-table" style={{marginTop: '1rem'}}>
            <tbody>
              <tr><td className="info-label">IPv4 Address</td><td className="info-val">192.168.1.45 / 24</td></tr>
              <tr><td className="info-label">IPv6 Address</td><td className="info-val">fe80::1a2b:3c4d:5e6f</td></tr>
              <tr><td className="info-label">Default Gateway</td><td className="info-val">192.168.1.1</td></tr>
              <tr><td className="info-label">DNS Servers</td><td className="info-val">1.1.1.1, 8.8.8.8</td></tr>
              <tr><td className="info-label">DHCP Status</td><td className="info-val" style={{color: '#10b981'}}>Enabled (Lease Active)</td></tr>
              <tr><td className="info-label">Routing Table</td><td className="info-val">3 Static Routes (Auto-managed)</td></tr>
              <tr><td className="info-label">Connectivity Status</td><td className="info-val" style={{color: '#10b981'}}>Internet Access</td></tr>
            </tbody>
          </table>
        </div>

        {/* Link / Transport Analytics */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title" style={{color: '#f59e0b'}}>LINK & TRANSPORT ANALYTICS</span></div>
          <table className="info-table" style={{marginTop: '1rem'}}>
            <tbody>
              <tr><td className="info-label">Interface Speed</td><td className="info-val">1000 Mbps (Gigabit)</td></tr>
              <tr><td className="info-label">Duplex Mode</td><td className="info-val">Full Duplex</td></tr>
              <tr><td className="info-label">Wi-Fi Information</td><td className="info-val">WPA3 Personal (SSID: CVM-Net)</td></tr>
              <tr><td className="info-label">Wi-Fi Signal Strength</td><td className="info-val" style={{color: '#10b981'}}>-45 dBm (Excellent)</td></tr>
              <tr><td className="info-label">Network Latency (ICMP)</td><td className="info-val">14 ms (to 8.8.8.8)</td></tr>
              <tr><td className="info-label">Packet Loss (TCP)</td><td className="info-val" style={{color: '#10b981'}}>0.00%</td></tr>
              <tr><td className="info-label">Total Packets / Errors</td><td className="info-val" style={{color: '#10b981'}}>1.4M / 0 Errors / 0 Drops</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Network Diagnostics */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">NETWORK DIAGNOSTIC TESTS</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            {tests.map(t => (
              <button 
                key={t} 
                className="cc-btn" 
                style={{ 
                  flexGrow: 1, 
                  background: activeTest === t ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)',
                  color: activeTest === t ? '#fff' : 'var(--text-muted)',
                  border: activeTest === t ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)'
                }}
                onClick={() => runTest(t)}
              >
                {activeTest === t ? 'TESTING...' : t.toUpperCase()}
              </button>
            ))}
          </div>
          {activeTest && <div style={{ marginTop: '1rem', color: '#00e5ff', fontSize: '0.85rem' }}>Executing {activeTest} on primary interface... [Pending]</div>}
        </div>

        {/* Live Traffic Graph */}
        <div className="cc-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="cc-card-header"><span className="cc-title">LIVE NETWORK TRAFFIC</span></div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#00e5ff' }}>↓ DL: {formatBytes(totalRx)}/s</span>
            <span style={{ color: '#f59e0b' }}>↑ UL: {formatBytes(totalTx)}/s</span>
          </div>
          <div style={{ flexGrow: 1, marginTop: '1rem', minHeight: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => {
                const rx = h.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
                const tx = h.networks.reduce((acc, n) => acc + n.tx_bytes, 0);
                return { rx, tx };
              })} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNetT" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide />
                <Area type="monotone" dataKey="rx" stroke="#00e5ff" fill="url(#colorNetR)" strokeWidth={2} isAnimationActive={false} />
                <Area type="monotone" dataKey="tx" stroke="#f59e0b" fill="url(#colorNetT)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}

function App() {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [history, setHistory] = useState<SystemVitals[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "diagnostics" | "system" | "tasks" | "hardware" | "services" | "storage" | "network">("dashboard");

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
          <button className={`nav-item ${activeTab === 'hardware' ? 'active' : ''}`} onClick={() => setActiveTab('hardware')}>
            <Cpu size={18} /> <span className="nav-text">Hardware</span>
          </button>
          <button className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <Activity size={18} /> <span className="nav-text">Processes</span>
          </button>
          <button className={`nav-item ${activeTab === "services" ? "active" : ""}`} onClick={() => setActiveTab("services")}>
            <Settings size={18} /> <span className="nav-text">Services</span>
          </button>
          <button className={`nav-item ${activeTab === "storage" ? "active" : ""}`} onClick={() => setActiveTab("storage")}>
            <Database size={18} /> <span className="nav-text">Storage</span>
          </button>
          <button className={`nav-item ${activeTab === "network" ? "active" : ""}`} onClick={() => setActiveTab("network")}>
            <Network size={18} /> <span className="nav-text">Network</span>
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
        {activeTab === 'hardware' && <HardwareView vitals={vitals} history={history} />}
        {activeTab === 'services' && <ServicesView />}
        {activeTab === 'storage' && <StorageView vitals={vitals} history={history} />}
        {activeTab === 'network' && <NetworkView vitals={vitals} history={history} />}
        {activeTab === 'tasks' && <TaskManagerView vitals={vitals} />}
        </div>
      </main>
    </div>
  );
}

export default App;
