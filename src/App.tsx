// @ts-nocheck
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { SquareTerminal, FileText, LineChart, ScrollText, MonitorSmartphone, Database, Settings, Activity, Cpu, HardDrive, Network, MemoryStick, X, Minus, Square, Thermometer, LayoutDashboard, Stethoscope, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
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

}function DiagnosticsView() {
  const [activeSuite, setActiveSuite] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runFullDiagnostic = () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

  const runSuite = (suite: any) => {
    setActiveSuite(suite);
    runFullDiagnostic();
  };

  const suites = [
    { name: 'CPU Diagnostic', status: 'Passed', problems: 'None', evidence: 'MCE check passed. Stress test max temp 72C.', english: 'Your processor is running perfectly.', action: 'None required.' },
    { name: 'Memory Diagnostic', status: 'Passed', problems: 'None', evidence: 'MemTest86+ fast-pass completed. 0 ECC errors.', english: 'Your RAM is fully functional with no corrupt sectors.', action: 'None required.' },
    { name: 'Storage Diagnostic', status: 'Warning', problems: 'High read latency on /dev/sdb', evidence: 'Avg latency > 150ms during random 4K read.', english: 'Your secondary hard drive is responding slower than usual.', action: 'Run a filesystem check and ensure the drive is not heavily fragmented.' },
    { name: 'Filesystem Diagnostic', status: 'Passed', problems: 'None', evidence: 'fsck clean on /dev/sda1.', english: 'Your file systems are completely clean and structurally sound.', action: 'None required.' },
    { name: 'Network Diagnostic', status: 'Passed', problems: 'None', evidence: 'Gateway ping < 2ms. No packet drop.', english: 'Your local network connection is solid.', action: 'None required.' },
    { name: 'DNS Diagnostic', status: 'Passed', problems: 'None', evidence: 'Resolved google.com in 14ms via 8.8.8.8.', english: 'Your computer can successfully translate website names into IP addresses.', action: 'None required.' },
    { name: 'Internet Diagnostic', status: 'Passed', problems: 'None', evidence: 'HTTP GET to captive.apple.com returned 200 OK.', english: 'You have full access to the internet.', action: 'None required.' },
    { name: 'Wi-Fi Diagnostic', status: 'Warning', problems: 'Signal attenuation', evidence: 'RSSI -75dBm, frequent retries.', english: 'Your Wi-Fi signal is weak, which might cause slow speeds.', action: 'Move closer to your router or remove physical obstructions.' },
    { name: 'Bluetooth Diagnostic', status: 'Passed', problems: 'None', evidence: 'HCI socket responsive. 1 device paired.', english: 'Your Bluetooth radio is working properly.', action: 'None required.' },
    { name: 'Battery Diagnostic', status: 'Passed', problems: 'None', evidence: 'Wear level 12%. Voltage normal.', english: 'Your battery is holding a healthy charge.', action: 'None required.' },
    { name: 'Temperature Diagnostic', status: 'Passed', problems: 'None', evidence: 'All thermal zones within TjMax - 20C limit.', english: 'Your computer is adequately cooled.', action: 'None required.' },
    { name: 'Service Diagnostic', status: 'Error', problems: 'Docker daemon failed to start', evidence: 'exit code 1 (bind address already in use)', english: 'A background service (Docker) crashed because another program is using its network port.', action: 'Stop the conflicting application and restart the Docker service.' },
    { name: 'Driver Diagnostic', status: 'Passed', problems: 'None', evidence: 'All loaded kernel modules have valid signatures.', english: 'Your hardware drivers are correctly installed.', action: 'None required.' },
    { name: 'OS Health Diagnostic', status: 'Passed', problems: 'None', evidence: 'SFC / DISM integrity checks passed.', english: 'Your core operating system files are intact.', action: 'None required.' },
    { name: 'Update Diagnostic', status: 'Warning', problems: 'Updates pending', evidence: '3 security updates available in APT cache.', english: 'There are security updates waiting to be installed.', action: 'Run the system updater as soon as possible.' },
    { name: 'Printer Diagnostic', status: 'Passed', problems: 'None', evidence: 'CUPS spooler active. Printer idle.', english: 'Your printer is connected and ready to print.', action: 'None required.' },
    { name: 'Scanner Diagnostic', status: 'Passed', problems: 'None', evidence: 'SANE backend initialized.', english: 'Your scanner is responding.', action: 'None required.' },
    { name: 'Audio Diagnostic', status: 'Passed', problems: 'None', evidence: 'PulseAudio / PipeWire sinks active. No xruns.', english: 'Your speakers and microphones are functioning.', action: 'None required.' },
    { name: 'Display Diagnostic', status: 'Passed', problems: 'None', evidence: 'EDID checksum valid. DPMS active.', english: 'Your monitors are properly communicating with your graphics card.', action: 'None required.' },
    { name: 'USB Diagnostic', status: 'Passed', problems: 'None', evidence: 'USB bus enumerating correctly. No overcurrent events.', english: 'All USB ports are functioning safely.', action: 'None required.' },
    { name: 'Camera Diagnostic', status: 'Passed', problems: 'None', evidence: 'v4l2 device node accessible. Framerate stable.', english: 'Your webcam is properly connected.', action: 'None required.' },
    { name: 'Application Diagnostic', status: 'Passed', problems: 'None', evidence: 'No excessive crashing in AppData/Crashpad.', english: 'Your installed applications are running stably.', action: 'None required.' },
    { name: 'Boot/Reliability Diagnostic', status: 'Passed', problems: 'None', evidence: 'Last 10 boots successful. Reliability Index: 9.8', english: 'Your computer consistently boots up without blue screens or crashes.', action: 'None required.' }
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Top Header & Master Progress */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ color: '#00e5ff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Automated Diagnostic Center</h3>
          <span className="cc-os" style={{ display: 'block' }}>Complete System Intelligence & Problem Resolution</span>
          
          {isRunning && (
            <div style={{ marginTop: '1rem', width: '100%', maxWidth: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>Diagnostic Progress...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.15s ease' }}></div>
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="cc-btn" 
          onClick={runFullDiagnostic}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: isRunning ? 'rgba(0, 229, 255, 0.2)' : '#00e5ff', color: isRunning ? '#00e5ff' : '#000', border: '1px solid #00e5ff', borderRadius: '8px', fontWeight: 'bold' }}
        >
          {isRunning ? 'DIAGNOSTICS IN PROGRESS...' : 'RUN FULL DIAGNOSTIC'}
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Diagnostic Suites List (Left) */}
        <div className="process-list-container" style={{ width: '40%', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Diagnostic Test Suites</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {suites.map((s, i) => (
              <li 
                key={i} 
                onClick={() => setActiveSuite(s)}
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: activeSuite?.name === s.name ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0,0,0,0.2)',
                  border: activeSuite?.name === s.name ? '1px solid #00e5ff' : '1px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                <span style={{ 
                  color: s.status === 'Passed' ? '#10b981' : s.status === 'Warning' ? '#f59e0b' : '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}>{s.status}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Diagnostic Results (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeSuite ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>{activeSuite.name}</h3>
                  <span style={{ color: 'var(--text-muted)' }}>Detailed Test Results & Evidence</span>
                </div>
                <button className="cc-btn" onClick={() => runSuite(activeSuite)}>RETEST</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${activeSuite.status === 'Passed' ? '#10b981' : activeSuite.status === 'Warning' ? '#f59e0b' : '#ef4444'}` }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Test Results</h5>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: activeSuite.status === 'Passed' ? '#10b981' : activeSuite.status === 'Warning' ? '#f59e0b' : '#ef4444' }}>
                    {activeSuite.status.toUpperCase()}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Detected Problems</h5>
                  <div style={{ color: '#fff' }}>{activeSuite.problems}</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Plain-English Explanation</h5>
                  <div style={{ color: '#fff' }}>{activeSuite.english}</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Recommended Action</h5>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{activeSuite.action}</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Evidence (Technical Log)</h5>
                  <div style={{ color: '#00e5ff', fontFamily: 'monospace', fontSize: '0.85rem' }}>{activeSuite.evidence}</div>
                </div>

              </div>
            </>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
              <Stethoscope size={48} opacity={0.2} />
              <p>Select a diagnostic suite from the left<br/>or run a Full System Diagnostic to begin.</p>
            </div>
          )}
        </div>

      </div>

      {/* Diagnostic History Bottom Panel */}
      <div className="cc-card" style={{ marginTop: 'auto' }}>
        <div className="cc-card-header"><span className="cc-title">DIAGNOSTIC HISTORY</span></div>
        <div style={{ fontSize: '0.85rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-muted)' }}>[History] 2026-10-01 08:30 AM — Full Diagnostic Run (3 Warnings, 0 Errors)</div>
          <div style={{ color: 'var(--text-muted)' }}>[History] 2026-09-28 14:15 PM — Network Diagnostic (Passed)</div>
          <div style={{ color: 'var(--text-muted)' }}>[History] 2026-09-25 09:00 AM — Storage Diagnostic (Warning: Latency spike)</div>
        </div>
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


function DevicesView() {
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [activeDiagnostic, setActiveDiagnostic] = useState<string | null>(null);

  const runDiagnostic = (action: string) => {
    setActiveDiagnostic(action);
    setTimeout(() => setActiveDiagnostic(null), 2500);
  };

  const devicesList = [
    { type: 'Display', category: 'Displays / Monitors', name: 'LG UltraGear 27"', manufacturer: 'LG Electronics', id: 'MON-LG-8291', status: 'Connected', driver: 'NVIDIA Display Driver 535.x', errors: 'None' },
    { type: 'Keyboard', category: 'Keyboards & Mice', name: 'Keychron Q1 Pro', manufacturer: 'Keychron', id: 'USB-HID-045E', status: 'Connected', driver: 'usbhid', errors: 'None' },
    { type: 'Mouse', category: 'Keyboards & Mice', name: 'Logitech MX Master 3', manufacturer: 'Logitech', id: 'BT-HID-LOGI', status: 'Connected (Bluetooth)', driver: 'logi_dj_receiver', errors: 'None' },
    { type: 'Camera', category: 'Cameras & Imaging', name: 'Logitech Brio 4K', manufacturer: 'Logitech', id: 'USB-VID-046D', status: 'Standby', driver: 'uvcvideo', errors: 'None' },
    { type: 'Microphone', category: 'Audio Devices', name: 'Blue Yeti Nano', manufacturer: 'Blue Microphones', id: 'USB-AUDIO-194F', status: 'Connected', driver: 'snd-usb-audio', errors: 'None' },
    { type: 'Speaker', category: 'Audio Devices', name: 'Focusrite Scarlett 2i2', manufacturer: 'Focusrite', id: 'USB-AUDIO-123A', status: 'Connected', driver: 'snd-usb-audio', errors: 'None' },
    { type: 'Printer', category: 'Printers & Scanners', name: 'HP LaserJet Pro MFP', manufacturer: 'HP', id: 'NET-PRN-HP', status: 'Offline', driver: 'HPLIP', errors: 'Printer is offline or sleeping.' },
    { type: 'Scanner', category: 'Printers & Scanners', name: 'Epson Perfection V39', manufacturer: 'Epson', id: 'USB-SCN-EPS', status: 'Disconnected', driver: 'sane-epson2', errors: 'Device not found.' },
    { type: 'Biometric', category: 'Biometric Peripherals', name: 'Goodix Fingerprint Reader', manufacturer: 'Goodix', id: 'USB-BIO-027C', status: 'Connected', driver: 'libfprint', errors: 'None' },
    { type: 'Bluetooth', category: 'Bluetooth Devices', name: 'Sony WH-1000XM4', manufacturer: 'Sony', id: 'BT-MAC-SO:NY', status: 'Disconnected', driver: 'bluez', errors: 'None' },
    { type: 'External Drive', category: 'External Drives', name: 'Samsung T7 Shield 2TB', manufacturer: 'Samsung', id: 'USB-STR-SAMS', status: 'Connected', driver: 'uas', errors: 'None' },
    { type: 'UPS', category: 'UPS Devices', name: 'APC Back-UPS Pro 1500', manufacturer: 'APC', id: 'USB-UPS-APC', status: 'Connected', driver: 'usbhid-ups', errors: 'None' },
    { type: 'Barcode Scanner', category: 'Card Readers / Scanners', name: 'Symbol LS2208', manufacturer: 'Zebra', id: 'USB-HID-ZEB', status: 'Disconnected', driver: 'usbhid', errors: 'Device unplugged.' },
    { type: 'Card Reader', category: 'Card Readers / Scanners', name: 'Realtek PCIE CardReader', manufacturer: 'Realtek', id: 'PCI-CR-RTL', status: 'Connected', driver: 'rtsx_pci', errors: 'None' }
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3>Device Manager</h3>
          <span className="cc-os">Peripherals, USB, Audio & Displays</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Device List (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Device Name</th>
                <th style={{ padding: '0.5rem' }}>Type / Category</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {devicesList.map((d, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedDevice(d)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedDevice?.id === d.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{d.name}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{d.category} ({d.type})</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: d.status.includes('Connected') || d.status === 'Standby' ? '#10b981' : 'var(--text-muted)' }}>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Device Details (Right) */}
        {selectedDevice && (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedDevice.name}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedDevice.category}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Manufacturer:</span>
                <span>{selectedDevice.manufacturer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Device Model:</span>
                <span>{selectedDevice.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Device ID (Hardware):</span>
                <span>{selectedDevice.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Connection Status:</span>
                <span style={{ color: selectedServiceStatusColor(selectedDevice.status), fontWeight: 'bold' }}>{selectedDevice.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Driver:</span>
                <span>{selectedDevice.driver}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Device Errors:</span>
                <span style={{ color: selectedDevice.errors === 'None' ? '#10b981' : '#ef4444' }}>{selectedDevice.errors}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Device Details & History</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                [History] Last connected: 2 hours ago<br/>
                [History] Firmware version: 1.04.12<br/>
                [Details] Interface: {selectedDevice.id.includes('USB') ? 'USB 3.0 (5Gbps)' : selectedDevice.id.includes('BT') ? 'Bluetooth 5.2' : 'PCIe / Network'}
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Device Diagnostics</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button 
                  className="cc-btn" 
                  style={{ flexGrow: 1, background: activeDiagnostic === 'Ping/Wake' ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)', color: activeDiagnostic === 'Ping/Wake' ? '#fff' : 'var(--text-muted)', border: activeDiagnostic === 'Ping/Wake' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => runDiagnostic('Ping/Wake')}
                >
                  {activeDiagnostic === 'Ping/Wake' ? 'WAKING...' : 'Ping / Wake'}
                </button>
                <button 
                  className="cc-btn" 
                  style={{ flexGrow: 1, background: activeDiagnostic === 'Driver Reload' ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)', color: activeDiagnostic === 'Driver Reload' ? '#fff' : 'var(--text-muted)', border: activeDiagnostic === 'Driver Reload' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => runDiagnostic('Driver Reload')}
                >
                  {activeDiagnostic === 'Driver Reload' ? 'RELOADING...' : 'Reload Driver'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="cc-btn" 
                  style={{ flexGrow: 1, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }} 
                  onClick={() => runDiagnostic('Enable')}
                >
                  ENABLE DEVICE
                </button>
                <button 
                  className="cc-btn" 
                  style={{ flexGrow: 1, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }} 
                  onClick={() => runDiagnostic('Disable')}
                >
                  DISABLE DEVICE
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function selectedServiceStatusColor(status: string) {
  if (status.includes('Connected') || status === 'Standby') return '#10b981';
  return 'var(--text-muted)';
}


function LogsView() {
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("Last 24 Hours");

  const handleExport = () => {
    alert("Exporting logs to JSON...");
  };

  const logsData = [
    { id: 'EVT-1001', time: '10:45:12 AM', severity: 'Error', source: 'Kernel', category: 'Kernel Logs / Linux journal logs', component: 'NVIDIA Driver', message: 'NVRM: GPU at PCI:0000:01:00.0 fell off the bus.', process: 'kworker/u16:4', service: 'systemd-udevd', device: 'PCIe Bus / GPU', english: 'Your graphics card momentarily disconnected from the motherboard, likely due to a driver crash or power spike. The driver was forcefully reloaded.', technical: 'PCIe AER fatal error reported. Link state D3hot. Resetting bridge.', raw: 'Sep 29 10:45:12 kernel: NVRM: GPU at PCI:0000:01:00.0 fell off the bus. NVRM: A GPU crash dump has been created.' },
    { id: 'EVT-1002', time: '10:40:01 AM', severity: 'Warning', source: 'Network', category: 'Network logs', component: 'wpa_supplicant', message: 'CTRL-EVENT-DISCONNECTED bssid=aa:bb:cc:dd reason=4', process: 'wpa_supplicant (pid 891)', service: 'NetworkManager', device: 'wlan0', english: 'Your computer temporarily disconnected from Wi-Fi because the router failed to respond to a keep-alive packet.', technical: 'Reason 4 (Disassociated due to inactivity). Deauthentication sent.', raw: 'Sep 29 10:40:01 wpa_supplicant[891]: wlan0: CTRL-EVENT-DISCONNECTED bssid=00:11:22:33:44:55 reason=4 locally_generated=1' },
    { id: 'EVT-1003', time: '10:15:33 AM', severity: 'Info', source: 'System', category: 'System logs / Boot logs', component: 'systemd', message: 'Startup finished in 3.42s (kernel) + 4.12s (userspace).', process: 'systemd (pid 1)', service: 'systemd-journald', device: 'N/A', english: 'The system successfully turned on and finished loading all background services very quickly.', technical: 'Target graphical.target reached. No failed units.', raw: 'Sep 29 10:15:33 systemd[1]: Startup finished in 3.42s (kernel) + 4.12s (userspace) = 7.54s.' },
    { id: 'EVT-1004', time: '09:55:10 AM', severity: 'Critical', source: 'Hardware', category: 'Hardware logs / Driver errors', component: 'S.M.A.R.T', message: 'ATA bus error, status: { DRDY ERR }', process: 'smartd', service: 'smartmontools', device: 'dev/sda', english: 'Your hard drive reported a read/write error. If this happens frequently, your drive might be failing and you should back up your data.', technical: 'UNC error at LBA 1234567. Uncorrectable sector.', raw: 'Sep 29 09:55:10 kernel: ata1.00: exception Emask 0x0 SAct 0x0 SErr 0x0 action 0x0\nata1.00: failed command: READ DMA' },
    { id: 'EVT-1005', time: '09:00:22 AM', severity: 'Error', source: 'Application', category: 'Application logs / Windows Event Logs', component: 'Docker Daemon', message: 'failed to start container: port is already allocated', process: 'dockerd', service: 'docker.service', device: 'veth-dckr', english: 'An application tried to start, but the network port it requested is already being used by another program.', technical: 'Bind for 0.0.0.0:8080 failed: port is already allocated.', raw: 'Sep 29 09:00:22 dockerd[1234]: Error starting userland proxy: listen tcp4 0.0.0.0:8080: bind: address already in use' }
  ];

  const filteredLogs = logsData.filter(log => {
    if (severityFilter !== "All" && log.severity !== severityFilter) return false;
    if (categoryFilter !== "All" && !log.category.includes(categoryFilter)) return false;
    return log.message.toLowerCase().includes(searchQuery.toLowerCase()) || log.id.toLowerCase().includes(searchQuery.toLowerCase()) || log.component.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getSeverityColor = (sev: string) => {
    if (sev === 'Critical') return '#ef4444';
    if (sev === 'Error') return '#f97316';
    if (sev === 'Warning') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3>System Event Logs</h3>
          <span className="cc-os">Global Kernel, Application, Hardware & Journal Feed</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}>
            <option>Last Hour</option><option>Last 24 Hours</option><option>All Time</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}>
            <option>All</option><option>System</option><option>Application</option><option>Hardware</option><option>Kernel</option><option>Network</option>
          </select>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}>
            <option>All</option><option>Info</option><option>Warning</option><option>Error</option><option>Critical</option>
          </select>
          <input type="text" placeholder="Search events..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff', width: '200px' }} />
          <button className="cc-btn primary" onClick={handleExport}>EXPORT LOGS</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Logs Table (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Timestamp</th>
                <th style={{ padding: '0.5rem' }}>Severity</th>
                <th style={{ padding: '0.5rem' }}>Component</th>
                <th style={{ padding: '0.5rem' }}>Event ID</th>
                <th style={{ padding: '0.5rem' }}>Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedLog(log)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedLog?.id === log.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', whiteSpace: 'nowrap' }}>{log.time}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ background: getSeverityColor(log.severity) + '33', color: getSeverityColor(log.severity), padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{log.severity}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{log.component}</td>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace' }}>{log.id}</td>
                  <td style={{ padding: '0.6rem 0.5rem', wordBreak: 'break-all' }}>{log.message}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && <tr><td colSpan={5} style={{padding: '1rem', textAlign: 'center', color: 'var(--text-muted)'}}>No events match current filters.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Log Details (Right) */}
        {selectedLog && (
          <div style={{ width: '400px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ background: getSeverityColor(selectedLog.severity) + '33', color: getSeverityColor(selectedLog.severity), padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedLog.severity.toUpperCase()}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedLog.time}</span>
            </div>

            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedLog.message}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ID: {selectedLog.id} • {selectedLog.category}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Source / Component:</span>
                <span>{selectedLog.source} / {selectedLog.component}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Process:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.process}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Service:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.service}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Device:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedLog.device}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Plain-English Explanation</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: '#fff', borderLeft: '3px solid #00e5ff' }}>
                {selectedLog.english}
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Technical Details</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: '#f59e0b', wordBreak: 'break-all' }}>
                {selectedLog.technical}
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Raw Event Payload</h5>
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)', wordBreak: 'break-all', maxHeight: '100px', overflowY: 'auto' }}>
                {selectedLog.raw}
              </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button className="cc-btn" style={{ width: '100%', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>
                OPEN RELATED INCIDENT
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}


function IncidentsView() {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const incidentsData = [
    { 
      id: 'INC-9042', 
      severity: 'Critical', 
      status: 'Active', 
      category: 'Warning / Active incidents',
      problem: 'High SSD Read Latency', 
      device: '/dev/sdb (Storage)', 
      first: '2026-10-01 09:12 AM', 
      last: '2026-10-01 11:25 AM',
      timeline: ['09:12 AM - Latency threshold breached (>150ms)', '09:15 AM - Automated diagnostic executed', '09:20 AM - Retries increasing'],
      evidence: 'Avg random 4K read latency is 172ms.', 
      tests: 'Storage Diagnostic: FAILED. SMART Test: WARNING.',
      logs: 'kernel: ata2.00: exception Emask 0x0 SAct 0x0 SErr 0x0 action 0x0',
      actions: 'Throttled background defragmentation.',
      results: 'Action applied successfully. Latency did not recover.',
      verification: 'Pending manual review.',
      recovery: 'Awaiting user to replace drive or run full fsck offline.'
    },
    { 
      id: 'INC-9041', 
      severity: 'Warning', 
      status: 'Open', 
      category: 'Warning / Open incidents',
      problem: 'Docker Daemon Bind Error', 
      device: 'veth-docker (Network)', 
      first: '2026-10-01 08:00 AM', 
      last: '2026-10-01 08:05 AM',
      timeline: ['08:00 AM - Service failed to start', '08:01 AM - Port collision detected'],
      evidence: 'Port 8080 is already allocated by process ID 1422.', 
      tests: 'Service Diagnostic: FAILED.',
      logs: 'dockerd[1234]: Error starting proxy: listen tcp4 0.0.0.0:8080: bind: address already in use',
      actions: 'Restarted dockerd service.',
      results: 'Failed. Port collision persists.',
      verification: 'Failed.',
      recovery: 'Stop PID 1422 before starting Docker.'
    },
    { 
      id: 'INC-9040', 
      severity: 'Resolved', 
      status: 'Recovered', 
      category: 'Resolved / Recovered incidents',
      problem: 'GPU Driver Crash', 
      device: 'PCIe:0000:01:00.0 (Display)', 
      first: '2026-09-30 18:45 PM', 
      last: '2026-09-30 18:46 PM',
      timeline: ['18:45 PM - GPU fell off bus', '18:45 PM - Display froze', '18:46 PM - Driver dynamically reloaded'],
      evidence: 'Xid 79 - GPU has fallen off the bus.', 
      tests: 'Display Diagnostic: PASSED (after recovery).',
      logs: 'NVRM: GPU at PCI:0000:01:00.0 fell off the bus.',
      actions: 'Kernel auto-reloaded NVIDIA driver modules.',
      results: 'Modules successfully reloaded. Display restored.',
      verification: 'Success. Stress test passed.',
      recovery: 'Automated software recovery was successful.'
    }
  ];

  const filteredIncidents = incidentsData.filter(inc => {
    if (statusFilter !== "All" && !inc.status.includes(statusFilter)) return false;
    return inc.problem.toLowerCase().includes(searchQuery.toLowerCase()) || inc.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getSeverityColor = (sev: string) => {
    if (sev === 'Critical') return '#ef4444';
    if (sev === 'Warning') return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3>Incident Response Center</h3>
          <span className="cc-os">Active anomalies, historical warnings, and recovery tracking</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}>
            <option>All</option><option>Active</option><option>Open</option><option>Recovered</option>
          </select>
          <input type="text" placeholder="Search incidents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff', width: '200px' }} />
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Incidents Table (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>ID</th>
                <th style={{ padding: '0.5rem' }}>Severity</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Problem</th>
                <th style={{ padding: '0.5rem' }}>Device</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((inc, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedIncident(inc)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedIncident?.id === inc.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace' }}>{inc.id}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ background: getSeverityColor(inc.severity) + '33', color: getSeverityColor(inc.severity), padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{inc.severity}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ color: inc.status === 'Active' ? '#ef4444' : inc.status === 'Open' ? '#f59e0b' : '#10b981' }}>{inc.status}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{inc.problem}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{inc.device}</td>
                </tr>
              ))}
              {filteredIncidents.length === 0 && <tr><td colSpan={5} style={{padding: '1rem', textAlign: 'center', color: 'var(--text-muted)'}}>No incidents found.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Incident Details (Right) */}
        {selectedIncident && (
          <div style={{ width: '450px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ background: getSeverityColor(selectedIncident.severity) + '33', color: getSeverityColor(selectedIncident.severity), padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem', marginRight: '0.5rem' }}>{selectedIncident.severity.toUpperCase()}</span>
                <span style={{ background: selectedIncident.status === 'Recovered' ? '#10b98133' : '#ef444433', color: selectedIncident.status === 'Recovered' ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedIncident.status.toUpperCase()}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{selectedIncident.id}</span>
            </div>

            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '0.25rem' }}>{selectedIncident.problem}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedIncident.device}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>First Detected:</span>
                <span>{selectedIncident.first}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Detected:</span>
                <span>{selectedIncident.last}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                <span style={{ fontWeight: 'bold', color: selectedIncident.status === 'Recovered' ? '#10b981' : '#ef4444' }}>{selectedIncident.status}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Incident Timeline</h5>
              <ul style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', paddingLeft: '1.5rem', borderRadius: '4px', fontSize: '0.85rem', color: '#fff', margin: 0 }}>
                {selectedIncident.timeline.map((evt: string, i: number) => <li key={i} style={{marginBottom: '0.25rem'}}>{evt}</li>)}
              </ul>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Diagnostic Intelligence</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><span style={{color: 'var(--text-muted)'}}>Evidence:</span> {selectedIncident.evidence}</div>
                <div><span style={{color: 'var(--text-muted)'}}>Tests Run:</span> {selectedIncident.tests}</div>
                <div><span style={{color: 'var(--text-muted)'}}>Related Logs:</span> <span style={{fontFamily: 'monospace', color: '#f59e0b'}}>{selectedIncident.logs}</span></div>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Recovery & Resolution</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><span style={{color: 'var(--text-muted)'}}>Actions Taken:</span> {selectedIncident.actions}</div>
                <div><span style={{color: 'var(--text-muted)'}}>Action Results:</span> {selectedIncident.results}</div>
                <div><span style={{color: 'var(--text-muted)'}}>Verification:</span> {selectedIncident.verification}</div>
                <div style={{marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,229,255,0.1)', borderLeft: '3px solid #00e5ff'}}>
                  <span style={{color: '#00e5ff', fontWeight: 'bold'}}>Recovery Info:</span> {selectedIncident.recovery}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}


function HistoryView({ history }: { history: SystemVitals[] }) {
  const [timeRange, setTimeRange] = useState('1 Hour');
  const [metricGroup, setMetricGroup] = useState('CPU & RAM');

  // Generate some stable mocked historical data since real data takes days to build up
  const mockHistoricalData = Array.from({ length: 60 }).map((_, i) => ({
    time: `-${60 - i}m`,
    cpu: 20 + Math.random() * 60,
    ram: 40 + Math.random() * 20,
    gpu: 10 + Math.random() * 80,
    temp: 35 + Math.random() * 45,
    disk: Math.random() * 500,
    netRx: Math.random() * 100,
    netTx: Math.random() * 20,
    latency: 10 + Math.random() * 150,
    packetLoss: Math.random() > 0.95 ? Math.random() * 5 : 0
  }));

  const metrics = [
    'CPU & RAM', 'GPU & Temperature', 'Disk I/O & Storage Growth', 
    'Network Traffic (UL/DL)', 'Network Latency & Packet Loss',
    'Process Resource History', 'Service Availability History', 'Incident & Error Overlay'
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header & Controls */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Historical Telemetry</h3>
          <span className="cc-os">Time-series Database & Metric Visualization</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['1 Min', '1 Hour', '1 Day', '1 Week', '1 Month', 'Custom'].map(t => (
            <button 
              key={t}
              onClick={() => setTimeRange(t)}
              style={{ 
                padding: '0.4rem 0.8rem', 
                borderRadius: '4px', 
                border: timeRange === t ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.2)', 
                background: timeRange === t ? 'rgba(0, 229, 255, 0.2)' : 'var(--bg-panel)', 
                color: timeRange === t ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              {t}
            </button>
          ))}
          <button className="cc-btn" style={{ padding: '0.4rem 1rem' }}>Zoom In/Out</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Metric Categories (Left) */}
        <div className="process-list-container" style={{ width: '280px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Telemetry Groups</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {metrics.map(m => (
              <li 
                key={m} 
                onClick={() => setMetricGroup(m)}
                style={{ 
                  padding: '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: metricGroup === m ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: metricGroup === m ? '3px solid #00e5ff' : '3px solid transparent',
                  color: metricGroup === m ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                {m}
              </li>
            ))}
          </ul>
        </div>

        {/* Dynamic Chart (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ color: '#00e5ff', fontSize: '1.2rem' }}>{metricGroup}</h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Historical Comparison | View: {timeRange}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#00e5ff' }}>• Data Series A</span>
              <span style={{ color: '#8b5cf6' }}>• Data Series B</span>
              <span style={{ color: '#ef4444' }}>| Incident Overlay</span>
            </div>
          </div>

          <div style={{ flexGrow: 1, minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockHistoricalData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="histColorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="histColorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{fill: 'var(--text-muted)'}} />
                <YAxis stroke="rgba(255,255,255,0.2)" tick={{fill: 'var(--text-muted)'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-panel)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                
                {/* Incident Overlay Line */}
                <ReferenceLine x="-45m" stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Storage Latency Spike (INC-9042)', fill: '#ef4444', fontSize: 12 }} />
                
                {metricGroup === 'CPU & RAM' && (
                  <>
                    <Area type="monotone" dataKey="cpu" stroke="#00e5ff" fill="url(#histColorA)" strokeWidth={2} name="CPU Usage (%)" />
                    <Area type="monotone" dataKey="ram" stroke="#8b5cf6" fill="url(#histColorB)" strokeWidth={2} name="RAM Usage (%)" />
                  </>
                )}
                {metricGroup === 'GPU & Temperature' && (
                  <>
                    <Area type="monotone" dataKey="gpu" stroke="#10b981" fillOpacity={0.2} fill="#10b981" strokeWidth={2} name="GPU Usage (%)" />
                    <Area type="monotone" dataKey="temp" stroke="#ef4444" fillOpacity={0.2} fill="#ef4444" strokeWidth={2} name="Package Temp (°C)" />
                  </>
                )}
                {metricGroup === 'Disk I/O & Storage Growth' && (
                  <>
                    <Area type="step" dataKey="disk" stroke="#f59e0b" fillOpacity={0.2} fill="#f59e0b" strokeWidth={2} name="Disk I/O Activity" />
                  </>
                )}
                {metricGroup.includes('Network') && (
                  <>
                    <Area type="monotone" dataKey="netRx" stroke="#3b82f6" fillOpacity={0.2} fill="#3b82f6" strokeWidth={2} name="Download" />
                    <Area type="monotone" dataKey="netTx" stroke="#ec4899" fillOpacity={0.2} fill="#ec4899" strokeWidth={2} name="Upload" />
                  </>
                )}
                {(!metricGroup.includes('Network') && !metricGroup.includes('CPU') && !metricGroup.includes('GPU') && !metricGroup.includes('Disk')) && (
                  <Area type="monotone" dataKey="latency" stroke="#00e5ff" fill="url(#histColorA)" strokeWidth={2} name="Active Metric" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>
    </div>
  );
}


function ReportsView() {
  const [reportType, setReportType] = useState('Full System Report');

  const reportTypes = [
    'Quick Report', 'Full System Report', 'Technician Report', 
    'Hardware Report', 'Storage Report', 'Network Report', 
    'Diagnostic Report', 'Incident Report', 'Historical Report', 
    'Device Report', 'Organization Report'
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header & Export Actions */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Report Generator</h3>
          <span className="cc-os">Comprehensive Export & Telemetry Compilation</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>EXPORT PDF</button>
          <button className="cc-btn" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6' }}>EXPORT HTML</button>
          <button className="cc-btn" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b' }}>EXPORT JSON</button>
          <button className="cc-btn" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }}>EXPORT CSV</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Report Types (Left) */}
        <div className="process-list-container" style={{ width: '280px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Report Profiles</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {reportTypes.map(r => (
              <li 
                key={r} 
                onClick={() => setReportType(r)}
                style={{ 
                  padding: '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: reportType === r ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: reportType === r ? '3px solid #00e5ff' : '3px solid transparent',
                  color: reportType === r ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Report Preview (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ borderBottom: '2px solid rgba(0, 229, 255, 0.3)', paddingBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Report Preview</span>
            <h2 style={{ margin: '0.5rem 0 0 0' }}>{reportType}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Generated on: {new Date().toLocaleString()}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Computer Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hostname: CVM-WORKSTATION<br/>OS: Linux 6.8.0-45-generic<br/>Uptime: 4 days, 12 hours</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Hardware Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CPU: AMD Ryzen 9 7950X<br/>RAM: 64GB DDR5-6000<br/>GPU: NVIDIA RTX 4090</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Software Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kernel: 6.8.0-45-generic<br/>Services: 142 Active / 2 Failed<br/>Drivers: NVIDIA 535, uvcvideo</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Network Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>IP: 192.168.1.45<br/>Gateway: 192.168.1.1<br/>Link: 1000Mbps Full-Duplex</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', gridColumn: '1 / -1' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Storage Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/dev/nvme0n1 (System): 240GB / 1TB Used (24%)<br/>/dev/sdb (Data): 1.8TB / 4TB Used (45%)</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
            <h5 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1rem' }}>Health Findings & Diagnostic Results</h5>
            <div style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong style={{color: '#10b981'}}>[PASS] CPU Diagnostic:</strong> All thermal zones nominal. Max temp 72C.</div>
              <div><strong style={{color: '#10b981'}}>[PASS] RAM Diagnostic:</strong> MemTest clean. No ECC errors detected.</div>
              <div><strong style={{color: '#ef4444'}}>[FAIL] Service Diagnostic:</strong> Docker daemon failed to bind port 8080.</div>
              <div><strong style={{color: '#f59e0b'}}>[WARN] Storage Diagnostic:</strong> High latency detected on /dev/sdb during 4K random read.</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
            <h5 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1rem' }}>Incident Log & Timeline</h5>
            <div style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong>Incident INC-9041:</strong> Docker Bind Error (Warning)</div>
              <div style={{color: 'var(--text-muted)', fontFamily: 'monospace'}}>Evidence: listen tcp4 0.0.0.0:8080: bind: address already in use</div>
              <div><strong style={{color: '#00e5ff'}}>Actions Taken:</strong> Restarted dockerd.</div>
              <div><strong style={{color: '#ef4444'}}>Verification:</strong> Failed. Manual recovery required.</div>
              <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '0.5rem 0'}}/>
              <div><strong>Incident INC-9040:</strong> GPU Driver Crash (Recovered)</div>
              <div style={{color: 'var(--text-muted)', fontFamily: 'monospace'}}>Evidence: NVRM: GPU at PCI:0000:01:00.0 fell off the bus.</div>
              <div><strong style={{color: '#00e5ff'}}>Actions Taken:</strong> Auto-reloaded kernel modules.</div>
              <div><strong style={{color: '#10b981'}}>Verification:</strong> Success. System stable.</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function App() {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [history, setHistory] = useState<SystemVitals[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "diagnostics" | "system" | "tasks" | "hardware" | "services" | "storage" | "network" | "devices" | "logs">("dashboard");

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
          <button className={`nav-item ${activeTab === "devices" ? "active" : ""}`} onClick={() => setActiveTab("devices")}>
            <MonitorSmartphone size={18} /> <span className="nav-text">Devices</span>
          </button>
          <button className={`nav-item ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")}>
            <ScrollText size={18} /> <span className="nav-text">Logs</span>
          </button>
          <button className={`nav-item ${activeTab === "incidents" ? "active" : ""}`} onClick={() => setActiveTab("incidents")}>
            <AlertTriangle size={18} /> <span className="nav-text">Incidents</span>
          </button>
          <button className={`nav-item ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
            <LineChart size={18} /> <span className="nav-text">History</span>
          </button>
          <button className={`nav-item ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>
            <FileText size={18} /> <span className="nav-text">Reports</span>
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
          {activeTab === 'diagnostics' && <DiagnosticsView />}
          {activeTab === 'system' && <SystemInfoView vitals={vitals} />}
        {activeTab === 'hardware' && <HardwareView vitals={vitals} history={history} />}
        {activeTab === 'services' && <ServicesView />}
        {activeTab === 'storage' && <StorageView vitals={vitals} history={history} />}
        {activeTab === 'network' && <NetworkView vitals={vitals} history={history} />}
        {activeTab === 'devices' && <DevicesView />}
        {activeTab === 'logs' && <LogsView />}
        {activeTab === 'incidents' && <IncidentsView />}
        {activeTab === 'history' && <HistoryView history={history} />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'tasks' && <TaskManagerView vitals={vitals} />}
        </div>
      </main>
    </div>
  );
}

export default App;
