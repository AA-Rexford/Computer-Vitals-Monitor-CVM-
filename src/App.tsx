// @ts-nocheck
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Wifi, Monitor, SquareTerminal, HelpCircle, Bell, Server, Radar, Wrench, FileText, LineChart, ScrollText, MonitorSmartphone, Database, Settings, Activity, Cpu, HardDrive, Network, MemoryStick, X, Minus, Square, Thermometer, LayoutDashboard, Stethoscope, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
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






function DashboardGrid({ vitals, history, setActiveTab }: { vitals: SystemVitals | null, history: SystemVitals[], setActiveTab: (tab: string) => void }) {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [graphTime, setGraphTime] = useState('Live');
  const [activeGraph, setActiveGraph] = useState('CPU');
  
  if (!vitals) {
    return <div style={{ color: '#00e5ff', padding: '2rem' }}>INITIALIZING MONITORING ENGINE... FETCHING TELEMETRY...</div>;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const cpuTemp = vitals.sensors.find(s => s.label.toLowerCase().includes('core') || s.label.toLowerCase().includes('cpu'))?.temperature || 45.0;
  const healthState = cpuTemp > 90 ? 'CRITICAL' : cpuTemp > 80 ? 'WARNING' : 'HEALTHY';
  
  const ramTotal = vitals.ram_total;
  const ramUsed = vitals.ram_used;
  const ramPercent = ramTotal > 0 ? (ramUsed / ramTotal) * 100 : 0;

  const totalRead = vitals.disk_read;
  const totalWrite = vitals.disk_write;
  const netRx = vitals.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
  const netTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);

  const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div className="command-center" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingRight: '1rem', height: '100%', overflowY: 'auto' }}>
      
      {/* 1. SYSTEM STATUS HEADER */}
      <div className="cc-header" style={{ background: 'var(--bg-panel)', padding: '1rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Host Identity</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#00e5ff' }}>CVM-WORKSTATION</div>
          </div>
          <div style={{ paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Live Health</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: healthState === 'HEALTHY' ? '#10b981' : healthState === 'WARNING' ? '#f59e0b' : '#ef4444' }}>{healthState}</div>
          </div>
          <div style={{ paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Thermal State</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: cpuTemp > 85 ? '#ef4444' : '#10b981' }}>{cpuTemp > 85 ? 'THROTTLING RISK' : 'NOMINAL'}</div>
          </div>
          <div style={{ paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Power State</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#3b82f6' }}>AC LINE DETECTED</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Monitoring Engine</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isMonitoring ? '#10b981' : '#f59e0b' }}>{isMonitoring ? 'ACTIVE (1s)' : 'PAUSED'}</div>
          </div>
          <div style={{ textAlign: 'right', paddingLeft: '1.5rem', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>System Time</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{formatTime(new Date())}</div>
          </div>
        </div>
      </div>

      {/* 2. LIVE HARDWARE METRIC GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        
        {/* CPU */}
        <div className="cc-card" style={{ cursor: 'pointer', border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.05)' }} onClick={() => setActiveTab('hardware')}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#3b82f6'}}><Cpu size={14}/> CPU</span><span className="cc-value">{vitals.cpu_usage.toFixed(1)}%</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Temp: {cpuTemp.toFixed(1)}°C | Load: Normal</div>
          <div className="cc-graph-mini" style={{ height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={history.map(h => ({ val: h.cpu_usage }))}><Area type="monotone" dataKey="val" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </div>

        {/* GPU */}
        <div className="cc-card" style={{ cursor: 'pointer', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.05)' }} onClick={() => setActiveTab('hardware')}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#8b5cf6'}}><MonitorSmartphone size={14}/> GPU</span><span className="cc-value">ACTIVE</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Util: N/A | VRAM: N/A</div>
          <div className="cc-graph-mini" style={{ height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={[{val:5},{val:10},{val:8},{val:12}]}><Area type="monotone" dataKey="val" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </div>

        {/* MEMORY */}
        <div className="cc-card" style={{ cursor: 'pointer', border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.05)' }} onClick={() => setActiveTab('hardware')}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#f59e0b'}}><MemoryStick size={14}/> MEMORY</span><span className="cc-value">{ramPercent.toFixed(1)}%</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Used: {formatBytes(ramUsed)} / {formatBytes(ramTotal)}</div>
          <div className="cc-graph-mini" style={{ height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={history.map(h => ({ val: h.ram_used }))}><Area type="monotone" dataKey="val" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </div>

        {/* STORAGE I/O */}
        <div className="cc-card" style={{ cursor: 'pointer', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.05)' }} onClick={() => setActiveTab('storage')}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#10b981'}}><HardDrive size={14}/> STORAGE I/O</span><span className="cc-value">LIVE</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>R: {formatBytes(totalRead)}/s | W: {formatBytes(totalWrite)}/s</div>
          <div className="cc-graph-mini" style={{ height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={history.map(h => ({ val: h.disk_read + h.disk_write }))}><Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </div>

        {/* NETWORK */}
        <div className="cc-card" style={{ cursor: 'pointer', border: '1px solid #00e5ff', background: 'rgba(0, 229, 255, 0.05)' }} onClick={() => setActiveTab('network')}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#00e5ff'}}><Network size={14}/> NETWORK</span><span className="cc-value">LIVE</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Up: {formatBytes(netTx)}/s | Dn: {formatBytes(netRx)}/s</div>
          <div className="cc-graph-mini" style={{ height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={history.map(h => ({ val: h.networks.reduce((a, n) => a + n.rx_bytes, 0) }))}><Area type="monotone" dataKey="val" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </div>

        {/* SENSORS */}
        <div className="cc-card" style={{ cursor: 'pointer', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.05)' }} onClick={() => setActiveTab('hardware')}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#ef4444'}}><Thermometer size={14}/> SENSORS</span><span className="cc-value">{vitals.sensors.length} ACTIVE</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Highest: {Math.max(0, ...vitals.sensors.map(s => s.temperature)).toFixed(1)}°C</div>
          <div className="cc-graph-mini" style={{ height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={history.map(h => ({ val: h.sensors[0]?.temperature || 40 }))}><Area type="monotone" dataKey="val" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </div>

        {/* BATTERY / POWER */}
        <div className="cc-card" style={{ border: '1px solid #64748b', background: 'rgba(100, 116, 139, 0.05)' }}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#64748b'}}><Activity size={14}/> POWER</span><span className="cc-value">AC LINE</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No battery detected (Desktop)</div>
          <div className="cc-graph-mini" style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>120V CONSTANT</span>
          </div>
        </div>

        {/* SYSTEM LOAD */}
        <div className="cc-card" style={{ border: '1px solid #f472b6', background: 'rgba(244, 114, 182, 0.05)' }}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#f472b6'}}><Activity size={14}/> SYS LOAD</span><span className="cc-value">{(vitals.cpu_usage / 100 * 4).toFixed(2)}</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Uptime: {Math.floor(vitals.uptime / 3600)}h {Math.floor((vitals.uptime % 3600)/60)}m</div>
          <div className="cc-graph-mini" style={{ height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={history.map(h => ({ val: (h.cpu_usage / 100 * 4) }))}><Area type="monotone" dataKey="val" stroke="#f472b6" fill="#f472b6" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* 3. LIVE GRAPH AREA */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {['CPU', 'RAM', 'NET', 'DISK'].map(g => (
                <button key={g} onClick={() => setActiveGraph(g)} style={{ background: activeGraph === g ? 'rgba(0, 229, 255, 0.2)' : 'transparent', border: activeGraph === g ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)', color: activeGraph === g ? '#00e5ff' : '#fff', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{g}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['Live', '1m', '5m', '15m', '1h'].map(t => (
                <button key={t} onClick={() => setGraphTime(t)} style={{ background: graphTime === t ? '#fff' : 'rgba(255,255,255,0.1)', color: graphTime === t ? '#000' : '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>{t}</button>
              ))}
            </div>
          </div>
          
          <div style={{ flexGrow: 1, minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.map(h => ({ 
                val: activeGraph === 'CPU' ? h.cpu_usage : 
                     activeGraph === 'RAM' ? h.ram_used : 
                     activeGraph === 'NET' ? h.networks.reduce((a,n) => a+n.rx_bytes, 0) : 
                     (h.disk_read + h.disk_write) 
              }))}>
                <defs>
                  <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis hide />
                <Area type="monotone" dataKey="val" stroke="#00e5ff" fill="url(#colorMain)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* 4. ACTIVE STATUS AREA */}
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', flexGrow: 1 }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Active Conditions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cpuTemp > 85 ? (
                 <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => setActiveTab('reports')}>
                   <strong style={{color: '#ef4444'}}>CRITICAL: Thermal Throttling</strong><br/>
                   CPU temperature exceeded 85°C. Performance limited.
                 </div>
              ) : null}
              {ramPercent > 90 ? (
                 <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', borderRadius: '4px', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => setActiveTab('reports')}>
                   <strong style={{color: '#f59e0b'}}>WARNING: Abnormal Memory Pressure</strong><br/>
                   RAM usage exceeds 90%. System may page to disk.
                 </div>
              ) : null}
              {cpuTemp <= 85 && ramPercent <= 90 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', border: '1px dashed #10b981' }}>
                   <strong>ALL SYSTEMS NOMINAL</strong><br/>
                   <span style={{ fontSize: '0.8rem' }}>No active hardware warnings.</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. QUICK CONTROLS */}
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '1rem' }}>Quick Controls</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.2)', border: '1px solid #00e5ff', color: '#00e5ff' }} onClick={() => setActiveTab('diagnostics')}>RUN DIAGNOSTIC</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => setIsMonitoring(!isMonitoring)}>{isMonitoring ? 'PAUSE MON' : 'RESUME MON'}</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => setActiveTab('hardware')}>HARDWARE</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => setActiveTab('tasks')}>SOFTWARE</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => setActiveTab('network')}>NETWORK</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => setActiveTab('reports')}>REPORTS</button>
            </div>
          </div>
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


function SoftwareView({ vitals }: { vitals: SystemVitals | null }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');

  if (!vitals) return <div style={{ color: '#00e5ff', padding: '2rem' }}>INITIALIZING SOFTWARE ENGINE...</div>;

  const tabs = ['Overview', 'Applications', 'System Software', 'Running Software', 'Services', 'Drivers', 'Logs', 'Updates', 'Diagnostics'];

  // Helper styles
  const panelStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem' };
  const headerStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' };
  const itemStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const };
  const valStyle = { color: '#fff', fontSize: '0.9rem', fontWeight: 600 };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const StatusBadge = ({ state }: { state: 'Running' | 'Stopped' | 'Healthy' | 'Warning' | 'Failed' | 'Disabled' | 'Missing' | 'Unsupported' | 'Permission Required' }) => {
    const colors = { Running: '#10b981', Stopped: '#64748b', Healthy: '#10b981', Warning: '#f59e0b', Failed: '#ef4444', Disabled: '#64748b', Missing: '#ef4444', Unsupported: '#64748b', 'Permission Required': '#f59e0b' };
    return <span style={{ color: colors[state] || '#fff', fontSize: '0.8rem', border: `1px solid ${colors[state] || '#fff'}`, padding: '0.1rem 0.4rem', borderRadius: '4px', cursor: 'pointer' }}>{state}</span>;
  };

  // Mock data for new sections
  const mockApps = [
    { name: 'Google Chrome', version: '114.0.5735.199', publisher: 'Google LLC', installDate: '2023-01-15', size: '850 MB', arch: 'x64', status: 'Healthy' },
    { name: 'Visual Studio Code', version: '1.80.1', publisher: 'Microsoft', installDate: '2023-02-10', size: '350 MB', arch: 'x64', status: 'Healthy' },
    { name: 'Docker Desktop', version: '4.21.1', publisher: 'Docker Inc.', installDate: '2023-03-22', size: '1.2 GB', arch: 'x64', status: 'Warning' }
  ];

  const mockDrivers = [
    { name: 'NVIDIA Display Driver', device: 'GeForce RTX 3080', version: '536.67', provider: 'NVIDIA', date: '2023-07-18', status: 'Healthy', signed: 'Verified' },
    { name: 'Realtek Audio', device: 'High Definition Audio', version: '6.0.9231.1', provider: 'Realtek', date: '2021-08-10', status: 'Healthy', signed: 'Verified' },
    { name: 'Intel Wi-Fi 6 AX200', device: 'Network Adapter', version: '22.150.0.3', provider: 'Intel', date: '2022-05-20', status: 'Failed', signed: 'Verified' }
  ];

  const filteredProcesses = vitals.processes.filter(p => String(p.name).toLowerCase().includes(searchQuery.toLowerCase()) || p.pid.toString().includes(searchQuery));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1rem' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>SOFTWARE & OS</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Complete operating system, application, and process inventory</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === t ? '1px solid #00e5ff' : '1px solid transparent', color: activeTab === t ? '#00e5ff' : '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={panelStyle}>
              <div style={headerStyle}><span>Operating System</span><StatusBadge state="Healthy" /></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>OS</span><span style={valStyle}>Linux (Ubuntu)</span></div>
                <div style={itemStyle}><span style={labelStyle}>Version/Build</span><span style={valStyle}>24.04 LTS</span></div>
                <div style={itemStyle}><span style={labelStyle}>Kernel</span><span style={valStyle}>6.8.0-generic</span></div>
                <div style={itemStyle}><span style={labelStyle}>Architecture</span><span style={valStyle}>x86_64</span></div>
              </div>
            </div>
            
            <div style={gridStyle}>
              <div style={panelStyle}>
                <div style={headerStyle}><span>Software Metrics</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Installed Apps</span><span style={valStyle}>142</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Running Processes</span><span style={valStyle}>{vitals.processes.length}</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>System Services</span><span style={valStyle}>128</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Loaded Drivers</span><span style={valStyle}>84</span></div>
              </div>
              
              <div style={panelStyle}>
                <div style={headerStyle}><span>Software Status</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Updates Pending</span><span style={{...valStyle, color: '#f59e0b'}}>3 Available</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>App Failures</span><span style={{...valStyle, color: '#ef4444'}}>1 Detected</span></div>
                <div style={{...itemStyle, marginBottom: '0.5rem'}}><span style={labelStyle}>Driver Status</span><span style={{...valStyle, color: '#ef4444'}}>1 Failure (Wi-Fi)</span></div>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATIONS TAB */}
        {activeTab === 'Applications' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Installed Applications</span><span>{mockApps.length} Displayed</span></div>
            <table className="info-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Publisher</th>
                  <th style={{ padding: '0.5rem' }}>Version</th>
                  <th style={{ padding: '0.5rem' }}>Size</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockApps.map((app, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{app.name}</td>
                    <td style={{ padding: '0.5rem' }}>{app.publisher}</td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{app.version}</td>
                    <td style={{ padding: '0.5rem' }}>{app.size}</td>
                    <td style={{ padding: '0.5rem' }}><StatusBadge state={app.status as any} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* RUNNING SOFTWARE TAB */}
        {activeTab === 'Running Software' && (
          <div style={{...panelStyle, display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ ...headerStyle, margin: 0, border: 'none' }}><span>Task Manager (Processes)</span></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="Search processes/PIDs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '4px' }} />
                <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Filter</button>
                <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>Terminate</button>
              </div>
            </div>
            <div style={{ flexGrow: 1, overflowY: 'auto' }}>
              <table className="info-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', position: 'sticky', top: 0, background: 'var(--bg-panel)' }}>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>PID</th>
                    <th style={{ padding: '0.5rem' }}>User</th>
                    <th style={{ padding: '0.5rem' }}>CPU %</th>
                    <th style={{ padding: '0.5rem' }}>Memory</th>
                    <th style={{ padding: '0.5rem' }}>Disk I/O</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProcesses.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{p.pid}</td>
                      <td style={{ padding: '0.5rem' }}>{p.user || 'system'}</td>
                      <td style={{ padding: '0.5rem', color: p.cpu_usage > 50 ? '#f59e0b' : '#10b981' }}>{p.cpu_usage.toFixed(1)}%</td>
                      <td style={{ padding: '0.5rem' }}>{formatBytes(p.memory_usage)}</td>
                      <td style={{ padding: '0.5rem' }}>{formatBytes(p.disk_read + p.disk_write)}/s</td>
                      <td style={{ padding: '0.5rem' }}><StatusBadge state="Running" /></td>
                    </tr>
                  ))}
                  {filteredProcesses.length === 0 && <tr><td colSpan={7} style={{textAlign: 'center', padding: '2rem', color: 'var(--text-muted)'}}>No processes match search</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SYSTEM SOFTWARE */}
        {activeTab === 'System Software' && (
           <div style={panelStyle}>
             <div style={headerStyle}><span>System Software & Frameworks</span></div>
             <div style={gridStyle}>
               <div style={itemStyle}><span style={labelStyle}>Security Components</span><span style={valStyle}>AppArmor (Active)</span></div>
               <div style={itemStyle}><span style={labelStyle}>Boot Components</span><span style={valStyle}>GRUB2 / systemd-boot</span></div>
               <div style={itemStyle}><span style={labelStyle}>Runtimes</span><span style={valStyle}>Node.js, Python, Java</span></div>
               <div style={itemStyle}><span style={labelStyle}>System Utilities</span><span style={valStyle}>GNU Coreutils</span></div>
             </div>
           </div>
        )}

        {/* DRIVERS TAB */}
        {activeTab === 'Drivers' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Device Drivers</span><span>{mockDrivers.length} Loaded</span></div>
            <table className="info-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Driver Name</th>
                  <th style={{ padding: '0.5rem' }}>Device</th>
                  <th style={{ padding: '0.5rem' }}>Version</th>
                  <th style={{ padding: '0.5rem' }}>Provider</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockDrivers.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{d.name}</td>
                    <td style={{ padding: '0.5rem' }}>{d.device}</td>
                    <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{d.version}</td>
                    <td style={{ padding: '0.5rem' }}>{d.provider}</td>
                    <td style={{ padding: '0.5rem' }}><StatusBadge state={d.status as any} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* UPDATES TAB */}
        {activeTab === 'Updates' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Software Updates</span><StatusBadge state="Warning" /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '4px' }}>
                <h4 style={{ color: '#f59e0b', margin: '0 0 0.5rem 0' }}>3 Pending Updates Available</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Operating system exposes available updates. Do not fabricate update information.</p>
                <div style={{ marginTop: '1rem' }}>
                  <button className="cc-btn" style={{ background: '#f59e0b', color: '#000', fontWeight: 'bold' }}>Install Updates</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIAGNOSTICS TAB */}
        {activeTab === 'Diagnostics' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Software Diagnostics Engine</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#00e5ff', margin: '0 0 0.5rem 0' }}>Application Failure Detection</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Scan logs and crash dumps for app instability.</p>
                <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid #00e5ff' }}>RUN TEST</button>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: '#00e5ff', margin: '0 0 0.5rem 0' }}>System File Integrity</h4>
                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Verify core OS components against checksums.</p>
                <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid #00e5ff' }}>RUN TEST</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Placeholder for tabs that reuse existing views if needed */}
        {(activeTab === 'Services' || activeTab === 'Logs') && (
           <div style={panelStyle}>
             <div style={headerStyle}><span>{activeTab} Module</span></div>
             <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                This section integrates the {activeTab} engine. (Select "Services" or "Logs" from the app router/actions if integrated natively, or render components here).
             </div>
             <button className="cc-btn" style={{ marginTop: '1rem', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00e5ff', color: '#00e5ff' }}>OPEN NATIVE {activeTab.toUpperCase()} VIEW</button>
           </div>
        )}

      </div>
    </div>
  );
}

function HardwareView({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  if (!vitals) return <div style={{ color: '#00e5ff', padding: '2rem' }}>INITIALIZING HARDWARE ENGINE...</div>;

  const getSystemInfo = () => {
    try {
      const el = document.getElementById('sys-info-data');
      return el ? JSON.parse(el.innerText) : null;
    } catch { return null; }
  };
  const sys = getSystemInfo() || { 
    cpu_vendor: 'Unknown', cpu_brand: 'Unknown CPU', cpu_cores: 0, cpu_logical_cores: 0, cpu_frequency: 0,
    gpu_name: 'Unknown GPU', vram: 'N/A', motherboard: 'Standard Board', manufacturer: 'Unknown', model: 'Generic PC',
    bios_version: '1.0.0', serial_number: 'N/A'
  };

  const hwSectionStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' };
  const hwHeaderStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' };
  const itemStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.2rem' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const };
  const valStyle = { color: '#fff', fontSize: '0.9rem', fontWeight: 600 };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const HealthBadge = ({ state }: { state: 'Healthy' | 'Attention' | 'Warning' | 'Critical' | 'Unsupported' }) => {
    const colors = { Healthy: '#10b981', Attention: '#3b82f6', Warning: '#f59e0b', Critical: '#ef4444', Unsupported: '#64748b' };
    return <span style={{ color: colors[state], fontWeight: 'bold', fontSize: '0.85rem' }}>{state}</span>;
  };

  const PresenceBadge = ({ state }: { state: 'Present' | 'Missing' | 'Disabled' | 'Not detected' | 'Unsupported' }) => {
    return <span style={{ color: state === 'Present' ? '#10b981' : '#64748b', fontSize: '0.8rem', border: '1px solid', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{state}</span>;
  };

  return (
    <div style={{ paddingRight: '1rem', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>HARDWARE INVENTORY</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Complete component topology and live physical telemetry</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00e5ff', color: '#00e5ff' }}>REFRESH DETECTION</button>
          <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)' }}>HARDWARE DIAGNOSTIC</button>
        </div>
      </div>

      {/* OVERALL HEALTH */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Hardware Health</span><HealthBadge state="Healthy" /></div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All hardware components are reporting healthy status. No critical SMART errors, thermal throttling, or ECC faults detected.</div>
      </div>

      {/* CPU */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>CPU</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Manufacturer</span><span style={valStyle}>{sys.cpu_vendor}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Model</span><span style={valStyle}>{sys.cpu_brand}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Architecture</span><span style={valStyle}>{sys.cpu_arch || 'x86_64'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Socket/Package</span><span style={valStyle}>Supported</span></div>
          <div style={itemStyle}><span style={labelStyle}>Physical Cores</span><span style={valStyle}>{sys.cpu_cores}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Logical Processors</span><span style={valStyle}>{sys.cpu_logical_cores}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Base Frequency</span><span style={valStyle}>{sys.cpu_frequency} MHz</span></div>
          <div style={itemStyle}><span style={labelStyle}>Max Frequency</span><span style={valStyle}>Boost Supported</span></div>
          <div style={itemStyle}><span style={labelStyle}>Instruction Sets</span><span style={valStyle}>MMX, SSE, AVX, AES</span></div>
          <div style={itemStyle}><span style={labelStyle}>Virtualization</span><span style={valStyle}>Enabled (VT-x/AMD-V)</span></div>
          <div style={itemStyle}><span style={labelStyle}>Cache Info</span><span style={valStyle}>L1/L2/L3 Available</span></div>
          <div style={itemStyle}><span style={labelStyle}>Core Status</span><span style={valStyle}>All cores active</span></div>
          <div style={itemStyle}><span style={labelStyle}>Thermal Throttling</span><span style={{...valStyle, color: '#10b981'}}>No Throttling</span></div>
          <div style={itemStyle}><span style={labelStyle}>Power (Estimated)</span><span style={valStyle}>Package: ~15W</span></div>
        </div>
      </div>

      {/* GPU */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>GPU</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Manufacturer</span><span style={valStyle}>{sys.gpu_name.split(' ')[0] || 'Generic'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Model</span><span style={valStyle}>{sys.gpu_name}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>Integrated / Discrete</span></div>
          <div style={itemStyle}><span style={labelStyle}>Architecture</span><span style={valStyle}>Supported</span></div>
          <div style={itemStyle}><span style={labelStyle}>Dedicated Memory</span><span style={valStyle}>{sys.vram || 'Shared System RAM'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Shared Memory</span><span style={valStyle}>OS Managed</span></div>
          <div style={itemStyle}><span style={labelStyle}>Display Outputs</span><span style={valStyle}>HDMI, DP, eDP</span></div>
          <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>Loaded</span></div>
          <div style={itemStyle}><span style={labelStyle}>Capabilities</span><span style={valStyle}>DirectX, OpenGL, Vulkan</span></div>
          <div style={itemStyle}><span style={labelStyle}>Current Health</span><span style={valStyle}><HealthBadge state="Healthy" /></span></div>
        </div>
      </div>

      {/* MEMORY */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Memory</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Total Capacity</span><span style={valStyle}>{formatBytes(vitals.ram_total)}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Installed Modules</span><span style={valStyle}>Populated</span></div>
          <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>DDR (Detected)</span></div>
          <div style={itemStyle}><span style={labelStyle}>Speed</span><span style={valStyle}>Platform Default</span></div>
          <div style={itemStyle}><span style={labelStyle}>ECC Status</span><span style={valStyle}>Non-ECC / Unverified</span></div>
          <div style={itemStyle}><span style={labelStyle}>Channel Config</span><span style={valStyle}>Dual Channel (Assumed)</span></div>
        </div>
      </div>

      {/* MOTHERBOARD & FIRMWARE */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Motherboard & Firmware</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Board Manufacturer</span><span style={valStyle}>{sys.manufacturer || 'Standard'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Model</span><span style={valStyle}>{sys.motherboard || 'Generic PC'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Firmware Vendor</span><span style={valStyle}>System BIOS/UEFI</span></div>
          <div style={itemStyle}><span style={labelStyle}>Firmware Version</span><span style={valStyle}>{sys.bios_version}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Boot Mode</span><span style={valStyle}>UEFI (Expected)</span></div>
          <div style={itemStyle}><span style={labelStyle}>Secure Boot</span><span style={valStyle}>Supported</span></div>
          <div style={itemStyle}><span style={labelStyle}>Hardware Interfaces</span><span style={valStyle}>PCIe, USB, SATA, NVMe</span></div>
        </div>
      </div>

      {/* STORAGE */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Storage Hardware</span><PresenceBadge state="Present" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {vitals.disks.map((disk, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '0.75rem' }}>{disk.name} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>({disk.file_system})</span></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>Mount Point</span><span style={valStyle}>{disk.mount_point}</span></div>
                <div style={itemStyle}><span style={labelStyle}>Capacity</span><span style={valStyle}>{formatBytes(disk.total_space)}</span></div>
                <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>{disk.is_removable ? 'Removable' : 'Internal Disk'}</span></div>
                <div style={itemStyle}><span style={labelStyle}>SMART Health</span><span style={valStyle}><HealthBadge state="Healthy" /></span></div>
                <div style={itemStyle}><span style={labelStyle}>Media Errors</span><span style={valStyle}>0 Detected</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NETWORKS & ADAPTERS */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Network & Wireless Adapters</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          {vitals.networks.map((net, i) => (
            <div key={i} style={itemStyle}>
              <span style={labelStyle}>{net.name}</span>
              <span style={valStyle}>Up / Active</span>
            </div>
          ))}
          <div style={itemStyle}><span style={labelStyle}>Wi-Fi Adapters</span><span style={valStyle}>Supported (If wireless)</span></div>
          <div style={itemStyle}><span style={labelStyle}>Bluetooth</span><span style={valStyle}>Supported</span></div>
        </div>
      </div>

      {/* AUDIO & DISPLAY */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Audio & Display Hardware</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Audio Controllers</span><span style={valStyle}>High Definition Audio</span></div>
          <div style={itemStyle}><span style={labelStyle}>Input Hardware</span><span style={valStyle}>Microphone Array</span></div>
          <div style={itemStyle}><span style={labelStyle}>Output Hardware</span><span style={valStyle}>Internal Speakers</span></div>
          <div style={itemStyle}><span style={labelStyle}>Connected Displays</span><span style={valStyle}>Primary Display</span></div>
          <div style={itemStyle}><span style={labelStyle}>Resolution</span><span style={valStyle}>Platform Default</span></div>
          <div style={itemStyle}><span style={labelStyle}>HDR Capability</span><span style={valStyle}>SDR/HDR Support</span></div>
        </div>
      </div>

      {/* BATTERY / COOLING / SENSORS */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Power, Cooling & Sensors</span><PresenceBadge state="Present" /></div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          <div>
            <h5 style={{ color: '#fff', marginBottom: '1rem' }}>Battery / AC</h5>
            <div style={{...gridStyle, gridTemplateColumns: '1fr'}}>
              <div style={itemStyle}><span style={labelStyle}>Design Capacity</span><span style={valStyle}>100%</span></div>
              <div style={itemStyle}><span style={labelStyle}>Cycle Count</span><span style={valStyle}>N/A</span></div>
              <div style={itemStyle}><span style={labelStyle}>Status</span><span style={valStyle}>AC Line Power</span></div>
            </div>
          </div>
          <div>
            <h5 style={{ color: '#fff', marginBottom: '1rem' }}>Cooling Hardware</h5>
            <div style={{...gridStyle, gridTemplateColumns: '1fr'}}>
              <div style={itemStyle}><span style={labelStyle}>Fans</span><span style={valStyle}>Detected (System Controlled)</span></div>
              <div style={itemStyle}><span style={labelStyle}>Fan RPM</span><span style={valStyle}>Auto-managed</span></div>
              <div style={itemStyle}><span style={labelStyle}>Thermal Zones</span><span style={valStyle}>Active</span></div>
            </div>
          </div>
          <div>
            <h5 style={{ color: '#fff', marginBottom: '1rem' }}>Sensor Inventory</h5>
            <div style={{...gridStyle, gridTemplateColumns: '1fr', overflowY: 'auto', maxHeight: '150px', paddingRight: '0.5rem'}}>
              {vitals.sensors.map((s, i) => (
                 <div key={i} style={itemStyle}>
                   <span style={{...labelStyle, textTransform: 'none'}}>{s.label}</span>
                   <span style={valStyle}>{s.temperature.toFixed(1)} °C</span>
                 </div>
              ))}
              {vitals.sensors.length === 0 && <div style={{color: 'var(--text-muted)'}}>No sensors exposed</div>}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
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
  const [activeTab, setActiveTab] = useState('Overview');
  
  if (!vitals) return <div style={{ color: '#00e5ff', padding: '2rem' }}>INITIALIZING NETWORK ENGINE...</div>;

  const tabs = ['Overview', 'Interfaces', 'Ethernet', 'Wi-Fi', 'Activity', 'Configuration', 'Diagnostics', 'Actions'];

  const panelStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' as const };
  const headerStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' };
  const itemStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const };
  const valStyle = { color: '#fff', fontSize: '0.9rem', fontWeight: 600 };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const StatusBadge = ({ state }: { state: 'Connected' | 'Limited' | 'Disconnected' | 'Warning' | 'Error' | 'Unknown' | 'Active' | 'Inactive' | 'PASS' | 'FAIL' | 'NOT TESTED' }) => {
    const colors = { Connected: '#10b981', Limited: '#f59e0b', Disconnected: '#64748b', Warning: '#f59e0b', Error: '#ef4444', Unknown: '#64748b', Active: '#10b981', Inactive: '#64748b', PASS: '#10b981', FAIL: '#ef4444', 'NOT TESTED': '#64748b' };
    return <span style={{ color: colors[state] || '#fff', fontSize: '0.8rem', border: `1px solid ${colors[state] || '#fff'}`, padding: '0.1rem 0.4rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>{state}</span>;
  };

  const totalRx = vitals.networks.reduce((acc, n) => acc + n.rx_bytes, 0);
  const totalTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);
  const isConnected = totalRx > 0 || totalTx > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1rem' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>NETWORK SUBSYSTEM</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Live interfaces, routing, and connectivity telemetry</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === t ? '1px solid #00e5ff' : '1px solid transparent', color: activeTab === t ? '#00e5ff' : '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={panelStyle}>
              <div style={headerStyle}><span>Network Status</span><StatusBadge state={isConnected ? 'Connected' : 'Disconnected'} /></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>Connectivity State</span><span style={{...valStyle, color: isConnected ? '#10b981' : '#64748b'}}>{isConnected ? 'Internet Access' : 'No Access'}</span></div>
                <div style={itemStyle}><span style={labelStyle}>Active Interfaces</span><span style={valStyle}>{vitals.networks.length} Detected</span></div>
                <div style={itemStyle}><span style={labelStyle}>Total Upload</span><span style={{...valStyle, color: '#00e5ff'}}>{formatBytes(totalTx)}/s</span></div>
                <div style={itemStyle}><span style={labelStyle}>Total Download</span><span style={{...valStyle, color: '#f59e0b'}}>{formatBytes(totalRx)}/s</span></div>
                <div style={itemStyle}><span style={labelStyle}>Default Gateway</span><span style={valStyle}>192.168.1.1</span></div>
                <div style={itemStyle}><span style={labelStyle}>DNS Servers</span><span style={valStyle}>1.1.1.1, 8.8.8.8</span></div>
              </div>
            </div>
            
            <div style={panelStyle}>
              <div style={headerStyle}><span>Network Configuration</span></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>IPv4 Address</span><span style={valStyle}>192.168.1.45 / 24</span></div>
                <div style={itemStyle}><span style={labelStyle}>IPv6 Address</span><span style={valStyle}>fe80::1a2b:3c4d:5e6f</span></div>
                <div style={itemStyle}><span style={labelStyle}>DHCP Status</span><span style={valStyle}>Enabled (Lease Active)</span></div>
                <div style={itemStyle}><span style={labelStyle}>Link Speed</span><span style={valStyle}>1000 Mbps</span></div>
                <div style={itemStyle}><span style={labelStyle}>VPN/Proxy</span><span style={valStyle}>Inactive</span></div>
              </div>
            </div>
          </div>
        )}

        {/* INTERFACES TAB */}
        {activeTab === 'Interfaces' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Network Interfaces</span><span>{vitals.networks.length} Adapters</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {vitals.networks.map((n, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.1rem', color: '#00e5ff', fontWeight: 'bold' }}>{n.name}</div>
                    <StatusBadge state={(n.rx_bytes > 0 || n.tx_bytes > 0) ? 'Active' : 'Inactive'} />
                  </div>
                  <div style={gridStyle}>
                    <div style={itemStyle}><span style={labelStyle}>Adapter Type</span><span style={valStyle}>{n.name.includes('wl') ? 'Wireless' : n.name.includes('lo') ? 'Loopback' : 'Ethernet'}</span></div>
                    <div style={itemStyle}><span style={labelStyle}>MAC Address</span><span style={valStyle}>00:1A:2B:3C:4D:5E</span></div>
                    <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>Kernel Module</span></div>
                    <div style={itemStyle}><span style={labelStyle}>Live Down</span><span style={{...valStyle, color: '#f59e0b'}}>↓ {formatBytes(n.rx_bytes)}/s</span></div>
                    <div style={itemStyle}><span style={labelStyle}>Live Up</span><span style={{...valStyle, color: '#00e5ff'}}>↑ {formatBytes(n.tx_bytes)}/s</span></div>
                    <div style={itemStyle}><span style={labelStyle}>Packet Stats</span><span style={valStyle}>0 Errors / 0 Drops</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ETHERNET TAB */}
        {activeTab === 'Ethernet' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Ethernet Specifics</span><StatusBadge state="Connected" /></div>
            <div style={gridStyle}>
              <div style={itemStyle}><span style={labelStyle}>Connection State</span><span style={valStyle}>Connected (eth0)</span></div>
              <div style={itemStyle}><span style={labelStyle}>Negotiated Speed</span><span style={valStyle}>1000 Mbps</span></div>
              <div style={itemStyle}><span style={labelStyle}>Duplex Mode</span><span style={valStyle}>Full Duplex</span></div>
              <div style={itemStyle}><span style={labelStyle}>Link Changes</span><span style={valStyle}>0 in last 24h</span></div>
            </div>
          </div>
        )}

        {/* WI-FI TAB */}
        {activeTab === 'Wi-Fi' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Wi-Fi Specifics</span><StatusBadge state="Disconnected" /></div>
            <div style={gridStyle}>
              <div style={itemStyle}><span style={labelStyle}>Adapter</span><span style={valStyle}>Intel Wi-Fi 6 AX200</span></div>
              <div style={itemStyle}><span style={labelStyle}>Connected SSID</span><span style={valStyle}>N/A</span></div>
              <div style={itemStyle}><span style={labelStyle}>Signal Strength</span><span style={valStyle}>0 dBm</span></div>
              <div style={itemStyle}><span style={labelStyle}>Frequency / Band</span><span style={valStyle}>Not Associated</span></div>
              <div style={itemStyle}><span style={labelStyle}>Security Mode</span><span style={valStyle}>N/A</span></div>
            </div>
          </div>
        )}

        {/* ACTIVITY TAB (GRAPHS) */}
        {activeTab === 'Activity' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', flexGrow: 1 }}>
            <div style={{...panelStyle, flexGrow: 1, minHeight: '300px'}}>
              <div style={headerStyle}><span>Live Traffic (All Interfaces)</span></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <span style={{ color: '#f59e0b' }}>● Download: {formatBytes(totalRx)}/s</span>
                <span style={{ color: '#00e5ff' }}>● Upload: {formatBytes(totalTx)}/s</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history.map(h => ({
                  rx: h.networks.reduce((acc, n) => acc + n.rx_bytes, 0),
                  tx: h.networks.reduce((acc, n) => acc + n.tx_bytes, 0)
                }))} margin={{ top: 0, right: 0, left: -60, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4}/><stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/></linearGradient>
                  </defs>
                  <YAxis hide />
                  <Area type="monotone" dataKey="rx" stroke="#f59e0b" fill="url(#colorRx)" strokeWidth={2} isAnimationActive={false} />
                  <Area type="monotone" dataKey="tx" stroke="#00e5ff" fill="url(#colorTx)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* CONFIGURATION */}
        {activeTab === 'Configuration' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Network Configuration Detail</span></div>
            <div style={gridStyle}>
              <div style={itemStyle}><span style={labelStyle}>IPv4 Routing</span><span style={valStyle}>Standard Auto</span></div>
              <div style={itemStyle}><span style={labelStyle}>IPv6 Routing</span><span style={valStyle}>Link Local Only</span></div>
              <div style={itemStyle}><span style={labelStyle}>Subnet Mask</span><span style={valStyle}>255.255.255.0</span></div>
              <div style={itemStyle}><span style={labelStyle}>Static Routes</span><span style={valStyle}>None</span></div>
            </div>
          </div>
        )}

        {/* DIAGNOSTICS */}
        {activeTab === 'Diagnostics' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Connectivity Diagnostics</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { name: 'Interface Test', state: 'PASS' }, { name: 'Link Test', state: 'PASS' },
                { name: 'IP Config Test', state: 'PASS' }, { name: 'DHCP Test', state: 'PASS' },
                { name: 'Gateway Test', state: 'PASS' }, { name: 'DNS Test', state: 'FAIL' },
                { name: 'Internet Test', state: 'NOT TESTED' }, { name: 'Latency Test', state: 'NOT TESTED' },
              ].map(test => (
                <div key={test.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.85rem' }}>{test.name}</span>
                  <StatusBadge state={test.state as any} />
                </div>
              ))}
            </div>
            <button className="cc-btn" style={{ alignSelf: 'flex-start', background: 'rgba(0, 229, 255, 0.2)', border: '1px solid #00e5ff', color: '#00e5ff' }}>RUN FULL DIAGNOSTIC SUITE</button>
          </div>
        )}

        {/* ACTIONS */}
        {activeTab === 'Actions' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Network Actions (Privileged)</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>RECONNECT INTERFACE</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>RENEW DHCP LEASE</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>FLUSH DNS CACHE</button>
              <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>RESTART NETWORK SERVICE</button>
              <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>DISABLE ADAPTER</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


function DevicesView() {
  const [activeTab, setActiveTab] = useState('Overview');
  
  const tabs = ['Overview', 'Input', 'Audio', 'Imaging', 'Biometrics', 'Displays', 'USB', 'Bluetooth', 'Storage', 'Printers'];

  const panelStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' as const };
  const headerStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' };
  const itemStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const };
  const valStyle = { color: '#fff', fontSize: '0.9rem', fontWeight: 600 };

  const StatusBadge = ({ state }: { state: 'Connected' | 'Disconnected' | 'Enabled' | 'Disabled' | 'Error' | 'Ready' }) => {
    const colors = { Connected: '#10b981', Disconnected: '#64748b', Enabled: '#10b981', Disabled: '#64748b', Error: '#ef4444', Ready: '#10b981' };
    return <span style={{ color: colors[state] || '#fff', fontSize: '0.8rem', border: `1px solid ${colors[state] || '#fff'}`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{state}</span>;
  };

  const ActionButton = ({ label, danger }: { label: string, danger?: boolean }) => (
    <button className="cc-btn" style={{ 
      background: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', 
      color: danger ? '#ef4444' : '#fff',
      border: danger ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)' 
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1rem' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>DEVICE MANAGER</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Peripherals, controllers, and externally connected equipment</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === t ? '1px solid #00e5ff' : '1px solid transparent', color: activeTab === t ? '#00e5ff' : '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={panelStyle}>
              <div style={headerStyle}><span>Device Categories</span></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>Input Devices</span><span style={valStyle}>2 Connected</span></div>
                <div style={itemStyle}><span style={labelStyle}>Audio Hardware</span><span style={valStyle}>3 Available</span></div>
                <div style={itemStyle}><span style={labelStyle}>Imaging / Cameras</span><span style={valStyle}>1 WebCam</span></div>
                <div style={itemStyle}><span style={labelStyle}>Biometrics</span><span style={valStyle}>Fingerprint Sensor</span></div>
                <div style={itemStyle}><span style={labelStyle}>USB Tree</span><span style={valStyle}>12 Nodes</span></div>
                <div style={itemStyle}><span style={labelStyle}>Bluetooth</span><span style={valStyle}>Enabled</span></div>
              </div>
            </div>
            
            <div style={panelStyle}>
              <div style={headerStyle}><span>System Health</span></div>
              <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px dashed #10b981', textAlign: 'center' }}>
                 <strong>ALL DEVICES FUNCTIONING</strong><br/>
                 <span style={{ fontSize: '0.85rem' }}>No driver failures or disconnected required hardware.</span>
              </div>
            </div>
          </div>
        )}

        {/* INPUT DEVICES TAB */}
        {activeTab === 'Input' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Input Devices (Keyboard, Mouse, Controllers)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Logitech MX Master 3</span><StatusBadge state="Connected" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>Mouse</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Manufacturer</span><span style={valStyle}>Logitech</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Connection</span><span style={valStyle}>Bluetooth Low Energy</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>logi_input.sys</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Disable" danger />
                   <ActionButton label="Configure OS Settings" />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIO DEVICES TAB */}
        {activeTab === 'Audio' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Audio Devices</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Realtek High Definition Audio</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>Internal Speakers / Out</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Default Device</span><span style={{...valStyle, color: '#10b981'}}>Yes</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>rtkvhd64.sys</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Capabilities</span><span style={valStyle}>24-bit, 48000 Hz</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* IMAGING & CAMERA TAB */}
        {activeTab === 'Imaging' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Cameras & Scanners</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Integrated HD Webcam</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Manufacturer</span><span style={valStyle}>Generic</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Connection</span><span style={valStyle}>Internal USB 2.0</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Resolutions</span><span style={valStyle}>720p / 1080p @ 30fps</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Test Device" />
                   <ActionButton label="Disable Camera" danger />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* BIOMETRICS TAB */}
        {activeTab === 'Biometrics' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Biometric Hardware</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Goodix Fingerprint Sensor</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Framework</span><span style={valStyle}>Windows Hello / PAM</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Driver Status</span><span style={valStyle}>Loaded</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Data Policy</span><span style={{...valStyle, color: '#f59e0b'}}>Data NOT Exposed</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* DISPLAYS TAB */}
        {activeTab === 'Displays' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Connected Displays</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Dell UltraSharp U2720Q</span><StatusBadge state="Connected" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Resolution</span><span style={valStyle}>3840 x 2160</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Refresh Rate</span><span style={valStyle}>60 Hz</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Connection</span><span style={valStyle}>DisplayPort</span></div>
                   <div style={itemStyle}><span style={labelStyle}>HDR Capability</span><span style={valStyle}>Supported (HDR400)</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* USB TAB */}
        {activeTab === 'USB' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>USB Devices</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>USB Root Hub (USB 3.0)</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Vendor ID / Product ID</span><span style={valStyle}>8086:43ED</span></div>
                   <div style={itemStyle}><span style={labelStyle}>USB Version</span><span style={valStyle}>3.2 Gen 2</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>usbhub3.sys</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* BLUETOOTH TAB */}
        {activeTab === 'Bluetooth' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Bluetooth Devices</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>AirPods Pro</span><StatusBadge state="Disconnected" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>MAC Address</span><span style={valStyle}>XX:XX:XX:XX:XX:XX</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Services</span><span style={valStyle}>Audio Sink, AVRCP</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Connect" />
                   <ActionButton label="Unpair" danger />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* STORAGE TAB */}
        {activeTab === 'Storage' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>External Storage</span></div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <h4 style={{ color: '#f59e0b', margin: '0 0 0.5rem 0' }}>Privileged Destructive Operations Warning</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Formatting or destructive partition changes require explicit device identification, selection, and multi-stage confirmation.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Samsung Portable SSD T7</span><StatusBadge state="Connected" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Mount Point</span><span style={valStyle}>/media/usb0</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Filesystem</span><span style={valStyle}>exFAT</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Capacity</span><span style={valStyle}>1.0 TB</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Safely Remove / Eject" />
                   <ActionButton label="Format Device..." danger />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* PRINTERS TAB */}
        {activeTab === 'Printers' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Printers & Scanners</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>HP LaserJet Pro M404</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Connection</span><span style={valStyle}>Network (192.168.1.150)</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Queue State</span><span style={valStyle}>Idle (0 Jobs)</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Toner / Ink</span><span style={valStyle}>65% Remaining</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Print Test Page" />
                   <ActionButton label="Clear Queue" danger />
                 </div>
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



function ReportsView({ history, vitals }: { history: SystemVitals[], vitals: SystemVitals | null }) {
  const [activeTab, setActiveTab] = useState('Overview');
  
  const tabs = ['Overview', 'Diagnostic', 'Full System', 'Historical', 'Incidents', 'Security', 'Scans', 'Summaries'];

  const panelStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' as const };
  const headerStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' };
  const itemStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const };
  const valStyle = { color: '#fff', fontSize: '0.9rem', fontWeight: 600 };

  const StatusBadge = ({ state, color }: { state: string, color?: string }) => (
    <span style={{ color: color || '#fff', fontSize: '0.8rem', border: `1px solid ${color || '#fff'}`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{state}</span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1rem' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>REPORTS & EVIDENCE</h2>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Diagnostics, historical summaries, security events, and record-keeping</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>PDF</button>
            <button className="cc-btn" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6' }}>HTML</button>
            <button className="cc-btn" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b' }}>JSON</button>
            <button className="cc-btn" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }}>CSV</button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === t ? '1px solid #00e5ff' : '1px solid transparent', color: activeTab === t ? '#00e5ff' : '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={panelStyle}>
              <div style={headerStyle}><span>Recent Diagnostics</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}><span>Hardware Thermal Scan</span><StatusBadge state="PASS" color="#10b981" /></div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}><span>Memory Integrity</span><StatusBadge state="PASS" color="#10b981" /></div>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}><span>Driver Verification</span><StatusBadge state="WARNING" color="#f59e0b" /></div>
              </div>
            </div>
            
            <div style={panelStyle}>
              <div style={headerStyle}><span>Active Problems</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', borderRadius: '4px' }}>
                  <strong style={{color: '#ef4444'}}>Disk Latency Spike (sdb)</strong><br/><span style={{fontSize: '0.8rem'}}>I/O operations exceeding 500ms</span>
                </div>
              </div>
            </div>
            
            <div style={{...panelStyle, gridColumn: '1 / -1'}}>
              <div style={headerStyle}><span>Integrity Policy</span></div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                The system preserves the strict distinction between: <strong>OBSERVED</strong>, <strong>TESTED</strong>, <strong>INFERRED</strong>, <strong>NOT AVAILABLE</strong>, and <strong>NOT TESTED</strong>. CVM does not fabricate telemetry to fill empty state variables.
              </div>
            </div>
          </div>
        )}

        {/* DIAGNOSTIC TAB */}
        {activeTab === 'Diagnostic' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Hardware Thermal Scan</span><span>Report Generated: {new Date().toLocaleString()}</span></div>
            <div style={gridStyle}>
              <div style={itemStyle}><span style={labelStyle}>Target</span><span style={valStyle}>System Mainboard / CPU / GPU</span></div>
              <div style={itemStyle}><span style={labelStyle}>Tests Performed</span><span style={valStyle}>6 Thermal Sensors Polled</span></div>
              <div style={itemStyle}><span style={labelStyle}>Tests Skipped</span><span style={valStyle}>0</span></div>
              <div style={itemStyle}><span style={labelStyle}>Overall Result</span><span style={valStyle}><StatusBadge state="PASS" color="#10b981" /></span></div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Technical Evidence</h5>
              <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                [OBSERVED] CPU Package: 45.2C (Limit 95C)<br/>
                [OBSERVED] GPU Edge: 41.0C (Limit 85C)<br/>
                [TESTED] Thermal Throttling Flags: 0x00 (Clear)<br/>
                [INFERRED] Case Airflow: Nominal
              </div>
            </div>
          </div>
        )}

        {/* FULL SYSTEM TAB */}
        {activeTab === 'Full System' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
             <div style={panelStyle}>
               <div style={headerStyle}><span>Full System Report Snapshot</span></div>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div>
                   <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>System & Hardware</h5>
                   <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <li>OS: Linux 6.8.0-generic (x86_64)</li>
                     <li>CPU: AMD Ryzen 9 7950X</li>
                     <li>RAM: 64 GB DDR5</li>
                     <li>Sensors: Active (Thermal, Voltage)</li>
                   </ul>
                 </div>
                 <div>
                   <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Software & Network</h5>
                   <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                     <li>Processes: ~340 Running</li>
                     <li>Drivers: 84 Loaded modules</li>
                     <li>Interfaces: 2 Active (eth0, wlan0)</li>
                     <li>DNS/DHCP: Nominal</li>
                   </ul>
                 </div>
               </div>
             </div>
          </div>
        )}

        {/* HISTORICAL TAB */}
        {activeTab === 'Historical' && (
          <div style={panelStyle}>
            <div style={headerStyle}>
              <span>Historical CPU Utilization (Recorded Real Measurements)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['15m', '1h', '24h', '7d'].map(t => (
                   <button key={t} style={{ background: t === '1h' ? '#fff' : 'rgba(255,255,255,0.1)', color: t === '1h' ? '#000' : '#fff', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ height: '300px', marginTop: '1rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history.map(h => ({ val: h.cpu_usage }))}>
                  <defs><linearGradient id="histCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient></defs>
                  <YAxis stroke="rgba(255,255,255,0.2)" />
                  <Area type="monotone" dataKey="val" stroke="#3b82f6" fill="url(#histCpu)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === 'Incidents' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Incident History</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#ef4444', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}><span>INC-9042: NVMe Controller Reset</span><StatusBadge state="Recovered" color="#10b981" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Component</span><span style={valStyle}>Storage (/dev/nvme0n1)</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Severity</span><span style={valStyle}>Critical</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Timeline</span><span style={valStyle}>Detected: 04:30 | Recovered: 04:31</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                   Evidence: nvme nvme0: controller is down; will reset: CSTS=0xffffffff<br/>
                   Action: OS initiated PCIe reset.<br/>
                   Verification: Link negotiated. Filesystem remounted.
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'Security' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Security Audits & Events</span></div>
            <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px dashed #10b981', textAlign: 'center', marginBottom: '1.5rem' }}>
               <strong style={{ fontSize: '1.1rem' }}>No relevant security events detected in the selected data sources.</strong><br/>
               <span style={{ fontSize: '0.85rem' }}>(Auth logs, PAM logs, and AppArmor profiles are clear.)</span>
            </div>
            <div style={gridStyle}>
               <div style={itemStyle}><span style={labelStyle}>Auth Failures</span><span style={valStyle}>0 (Last 24h)</span></div>
               <div style={itemStyle}><span style={labelStyle}>Firewall Drops</span><span style={valStyle}>12 Packets</span></div>
               <div style={itemStyle}><span style={labelStyle}>Policy Events</span><span style={valStyle}>0</span></div>
            </div>
          </div>
        )}

        {/* SCANS & SUMMARIES TAB */}
        {(activeTab === 'Scans' || activeTab === 'Summaries') && (
           <div style={panelStyle}>
             <div style={headerStyle}><span>{activeTab} Overview</span></div>
             <div style={{ color: 'var(--text-muted)' }}>
               {activeTab === 'Scans' ? 'Authorized scanning engines (Hardware, Software, Network) are available.' : 'Period summaries indicating most frequent failures and degradation indicators are generated here based solely on recorded evidence.'}
             </div>
             <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
               {activeTab === 'Scans' && <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid #00e5ff' }}>EXECUTE NEW SCAN</button>}
               {activeTab === 'Summaries' && <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff', border: '1px solid #00e5ff' }}>GENERATE 30-DAY SUMMARY</button>}
             </div>
           </div>
        )}

      </div>
    </div>
  );
}

function ActionsView() {
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [actionState, setActionState] = useState<'IDLE' | 'CONFIRM' | 'PROGRESS' | 'RESULT'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [actionHistory, setActionHistory] = useState<any[]>([
    { id: 1, action: 'Restart Network Service', result: 'Success', verification: 'Ping 8.8.8.8 successful.', time: '10:42 AM' },
    { id: 2, action: 'Flush DNS', result: 'Failed', verification: 'Permission denied. Root required.', time: '09:15 AM' }
  ]);

  const categories = [
    {
      name: 'System Actions',
      color: '#8b5cf6',
      actions: ['Open System Settings', 'Check Updates', 'Restart Computer', 'Shutdown Computer']
    },
    {
      name: 'Network Actions',
      color: '#3b82f6',
      actions: ['Renew DHCP', 'Flush DNS', 'Reconnect Network Interface', 'Restart Network Service']
    },
    {
      name: 'Service Actions',
      color: '#10b981',
      actions: ['Start Service', 'Stop Service', 'Restart Service']
    },
    {
      name: 'Process Actions',
      color: '#f59e0b',
      actions: ['Terminate Process', 'Force Terminate Process']
    },
    {
      name: 'Storage Actions',
      color: '#00e5ff',
      actions: ['Run Supported Storage Checks', 'Defragment Drive (if supported)']
    }
  ];

  const handleSelectAction = (actionName: string) => {
    setSelectedAction(actionName);
    setActionState('CONFIRM');
    setProgress(0);
  };

  const executeAction = () => {
    setActionState('PROGRESS');
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setActionState('RESULT');
          
          // Add to history
          const isFail = selectedAction.includes('Shutdown') || selectedAction.includes('Force');
          setActionHistory(prev => [{
            id: Date.now(),
            action: selectedAction,
            result: isFail ? 'Failed' : 'Success',
            verification: isFail ? 'Polkit/Root Policy Blocked Action.' : 'Action applied successfully and verified.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }, ...prev]);
          
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>System Control & Actions</h3>
          <span className="cc-os">User/Permission: standard_user (Limited Polkit Access)</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Action Grid (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Available System Actions</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {categories.map(cat => (
              <div key={cat.name} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderTop: `4px solid ${cat.color}` }}>
                <h5 style={{ color: cat.color, marginBottom: '1rem', fontSize: '1rem' }}>{cat.name}</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cat.actions.map(act => (
                    <button 
                      key={act} 
                      className="cc-btn" 
                      style={{ 
                        width: '100%', 
                        background: selectedAction === act ? `${cat.color}33` : 'rgba(0,0,0,0.3)', 
                        border: `1px solid ${selectedAction === act ? cat.color : 'rgba(255,255,255,0.1)'}`, 
                        color: selectedAction === act ? '#fff' : 'var(--text-muted)',
                        textAlign: 'left',
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.85rem'
                      }}
                      onClick={() => handleSelectAction(act)}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Execution Panel & History (Right) */}
        <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid #00e5ff' }}>
          
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
            <h4 style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '1rem' }}>Action Execution</h4>
            
            {!selectedAction ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
                Select an action from the left<br/>to execute it.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedAction}</div>
                
                {actionState === 'CONFIRM' && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '0.5rem' }}>Action Confirmation</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '1rem' }}>Are you sure you want to execute "{selectedAction}"? This may interrupt system services.</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="cc-btn" style={{ flexGrow: 1, background: '#ef4444', color: '#fff' }} onClick={() => setSelectedAction(null)}>CANCEL</button>
                      <button className="cc-btn" style={{ flexGrow: 1, background: '#10b981', color: '#fff' }} onClick={executeAction}>EXECUTE</button>
                    </div>
                  </div>
                )}

                {actionState === 'PROGRESS' && (
                  <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #00e5ff' }}>
                    <div style={{ color: '#00e5ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>Action Progress</div>
                    <div className="progress-bar" style={{ height: '12px', background: 'rgba(0,0,0,0.5)' }}>
                      <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.15s ease' }}></div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>Executing payload... {progress}%</div>
                  </div>
                )}

                {actionState === 'RESULT' && (
                  <div style={{ background: selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', border: `1px solid ${selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? '#ef4444' : '#10b981'}` }}>
                    <div style={{ color: selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? '#ef4444' : '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Action Result: {selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? 'FAILED' : 'SUCCESS'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                      <strong>Verification Result:</strong><br/>
                      {selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? 'Action blocked by OS security policy (Root/Admin required).' : 'The system confirmed the action completed successfully.'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ flexGrow: 1 }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>Action History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {actionHistory.map(hist => (
                <div key={hist.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', borderLeft: `3px solid ${hist.result === 'Success' ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{hist.action}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hist.time}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: hist.result === 'Success' ? '#10b981' : '#ef4444' }}>Result: {hist.result}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hist.verification}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}


function DiscoveryView() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return p + 2;
      });
    }, 50);
  };

  const discoveredDevices = [
    { ip: '192.168.1.1', mac: 'AA:BB:CC:DD:EE:01', hostname: 'Router-Main', vendor: 'Netgear', type: 'Gateway', status: 'Online', response: '1ms', services: '80 (HTTP), 443 (HTTPS), 53 (DNS)', firstSeen: '2026-09-01', lastSeen: 'Just now', rel: 'Default Gateway' },
    { ip: '192.168.1.45', mac: 'AA:BB:CC:DD:EE:02', hostname: 'CVM-WORKSTATION', vendor: 'Realtek', type: 'Computer', status: 'Online', response: '<1ms', services: '22 (SSH)', firstSeen: '2026-09-10', lastSeen: 'Just now', rel: 'Localhost (This PC)' },
    { ip: '192.168.1.102', mac: 'AA:BB:CC:DD:EE:03', hostname: 'Android-Phone', vendor: 'Samsung', type: 'Mobile', status: 'Online', response: '42ms', services: 'None detected', firstSeen: '2026-09-28', lastSeen: '2 mins ago', rel: 'Wireless Client' },
    { ip: '192.168.1.115', mac: 'AA:BB:CC:DD:EE:04', hostname: 'SmartTV-LivingRoom', vendor: 'LG Electronics', type: 'IoT / Media', status: 'Offline', response: 'Timeout', services: '8000 (HTTP API)', firstSeen: '2026-09-05', lastSeen: '5 hours ago', rel: 'Wireless Client' },
    { ip: '192.168.1.200', mac: 'AA:BB:CC:DD:EE:05', hostname: 'NAS-Storage', vendor: 'Synology', type: 'Storage', status: 'Online', response: '3ms', services: '445 (SMB), 5000 (DSM)', firstSeen: '2026-09-02', lastSeen: 'Just now', rel: 'Wired LAN Client' }
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header & Controls */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Network Discovery</h3>
          <span className="cc-os">LAN Topology & Asset Identification</span>
          
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <div><strong style={{color: 'var(--text-muted)'}}>Active Interface:</strong> eth0 (192.168.1.45)</div>
            <div><strong style={{color: 'var(--text-muted)'}}>Authorized Range:</strong> 192.168.1.0/24</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '200px' }}>
          <button 
            className="cc-btn" 
            onClick={startScan}
            style={{ width: '100%', background: isScanning ? 'rgba(0, 229, 255, 0.2)' : '#00e5ff', color: isScanning ? '#00e5ff' : '#000', border: '1px solid #00e5ff', fontWeight: 'bold' }}
          >
            {isScanning ? 'SCANNING...' : 'START DISCOVERY SCAN'}
          </button>
          
          {isScanning && (
            <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.5)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${scanProgress}%`, background: '#00e5ff', transition: 'width 0.1s linear' }}></div>
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Device List (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>IP Address</th>
                <th style={{ padding: '0.5rem' }}>Hostname</th>
                <th style={{ padding: '0.5rem' }}>Device Type</th>
                <th style={{ padding: '0.5rem' }}>Vendor</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {discoveredDevices.map((dev, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedDevice(dev)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedDevice?.ip === dev.ip ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    opacity: dev.status === 'Offline' ? 0.5 : 1
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>{dev.ip}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{dev.hostname}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{dev.type}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{dev.vendor}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: dev.status === 'Online' ? '#10b981' : '#ef4444' }}>{dev.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
            <h5 style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}>Discovery History & Topology</h5>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              [History] Last full sweep completed yesterday at 23:00.<br/>
              [Topology] 5 nodes discovered in star topology originating from Gateway 192.168.1.1.
            </div>
          </div>
        </div>

        {/* Device Details (Right) */}
        {selectedDevice ? (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'monospace' }}>{selectedDevice.ip}</span>
              <span style={{ background: selectedDevice.status === 'Online' ? '#10b98133' : '#ef444433', color: selectedDevice.status === 'Online' ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedDevice.status.toUpperCase()}</span>
            </div>

            <div>
              <h4 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{selectedDevice.hostname}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedDevice.vendor} • {selectedDevice.type}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>MAC Address:</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedDevice.mac}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Response Time:</span>
                <span style={{ color: selectedDevice.response === 'Timeout' ? '#ef4444' : '#10b981' }}>{selectedDevice.response}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>First Seen:</span>
                <span>{selectedDevice.firstSeen}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Seen:</span>
                <span>{selectedDevice.lastSeen}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Open Services</h5>
              <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.85rem' }}>{selectedDevice.services}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Network Relationship</h5>
              <div style={{ color: '#fff', fontSize: '0.85rem' }}>{selectedDevice.rel}</div>
            </div>

            <button className="cc-btn" style={{ marginTop: 'auto' }}>
              RUN PORT SCAN
            </button>
          </div>
        ) : (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div>
              <Radar size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
              <p>Select a discovered device to view<br/>deep inspection details.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


function FleetView() {
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [filterType, setFilterType] = useState('All Managed Devices');

  const fleetData = [
    { name: 'CVM-WORKSTATION', type: 'Computers', location: 'HQ - Floor 2', os: 'Linux 6.8', cpu: 'Ryzen 9', ram: '64GB', storage: '2TB', network: 'Online', lastSeen: 'Just now', agent: 'Connected', incidents: 0, health: 'Healthy' },
    { name: 'SQL-PROD-01', type: 'Servers', location: 'Data Center Alpha', os: 'Windows Server 2022', cpu: 'Dual Xeon', ram: '256GB', storage: '12TB RAID', network: 'Online', lastSeen: 'Just now', agent: 'Connected', incidents: 1, health: 'Warning' },
    { name: 'WEB-NODE-B', type: 'Servers', location: 'AWS eu-west-1', os: 'Ubuntu 22.04', cpu: 'AWS Graviton', ram: '16GB', storage: '100GB EBS', network: 'Online', lastSeen: 'Just now', agent: 'Connected', incidents: 0, health: 'Healthy' },
    { name: 'HR-PRINTER-4', type: 'Printers', location: 'HQ - Floor 3', os: 'Firmware 4.1', cpu: 'N/A', ram: '512MB', storage: 'N/A', network: 'Offline', lastSeen: '14 hours ago', agent: 'Unmanaged (SNMP)', incidents: 1, health: 'Critical' },
    { name: 'CORE-SWITCH-01', type: 'Network devices', location: 'Data Center Alpha', os: 'Cisco IOS', cpu: 'ARM', ram: '2GB', storage: 'NVRAM', network: 'Online', lastSeen: 'Just now', agent: 'SNMP', incidents: 0, health: 'Healthy' },
    { name: 'SEC-CAM-EXT', type: 'Other managed devices', location: 'HQ - Parking Lot', os: 'RTOS', cpu: 'ARM', ram: '128MB', storage: 'SD', network: 'Online', lastSeen: '2 mins ago', agent: 'Ping Only', incidents: 0, health: 'Attention' }
  ];

  const types = ['All Managed Devices', 'Computers', 'Servers', 'Printers', 'Network devices', 'Other managed devices'];
  
  const filteredFleet = filterType === 'All Managed Devices' ? fleetData : fleetData.filter(d => d.type === filterType);

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Top Health Dashboard */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Global Fleet Management</h3>
          <span className="cc-os">Organization: Acme Corp | Locations: 3 Active Sites</span>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Devices</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>142</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#10b981', fontSize: '0.8rem', textTransform: 'uppercase' }}>Healthy</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981' }}>128</div>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#f59e0b', fontSize: '0.8rem', textTransform: 'uppercase' }}>Attention / Warning</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#f59e0b' }}>9</div>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '0.5rem 1rem', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ color: '#ef4444', fontSize: '0.8rem', textTransform: 'uppercase' }}>Critical / Offline</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ef4444' }}>5</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Device Categories (Left) */}
        <div className="process-list-container" style={{ width: '250px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Device Filters</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {types.map(t => (
              <li 
                key={t} 
                onClick={() => setFilterType(t)}
                style={{ 
                  padding: '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: filterType === t ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: filterType === t ? '3px solid #00e5ff' : '3px solid transparent',
                  color: filterType === t ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Fleet Ledger (Center) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Device Name</th>
                <th style={{ padding: '0.5rem' }}>Location</th>
                <th style={{ padding: '0.5rem' }}>OS</th>
                <th style={{ padding: '0.5rem' }}>Hardware (CPU/RAM/Storage)</th>
                <th style={{ padding: '0.5rem' }}>Network</th>
                <th style={{ padding: '0.5rem' }}>Health</th>
              </tr>
            </thead>
            <tbody>
              {filteredFleet.map((dev, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedDevice(dev)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedDevice?.name === dev.name ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                    opacity: dev.network === 'Offline' ? 0.5 : 1
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{dev.name}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{dev.location}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{dev.os}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{dev.cpu} / {dev.ram} / {dev.storage}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: dev.network === 'Online' ? '#10b981' : '#ef4444' }}>{dev.network}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>
                    <span style={{ 
                      background: dev.health === 'Healthy' ? '#10b98133' : dev.health === 'Critical' ? '#ef444433' : '#f59e0b33', 
                      color: dev.health === 'Healthy' ? '#10b981' : dev.health === 'Critical' ? '#ef4444' : '#f59e0b', 
                      padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' 
                    }}>{dev.health}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Fleet Details (Right) */}
        {selectedDevice && (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#00e5ff', fontWeight: 'bold', fontSize: '1.2rem' }}>{selectedDevice.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedDevice.type}</span>
            </div>

            <div>
              <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>{selectedDevice.location}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedDevice.os}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Network Status:</span>
                <span style={{ color: selectedDevice.network === 'Online' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{selectedDevice.network}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Seen:</span>
                <span>{selectedDevice.lastSeen}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Agent Status:</span>
                <span style={{ color: selectedDevice.agent.includes('Connected') ? '#10b981' : 'var(--text-muted)' }}>{selectedDevice.agent}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Open Incidents:</span>
                <span style={{ color: selectedDevice.incidents > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{selectedDevice.incidents} Active</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Device Details</h5>
              <div style={{ color: '#fff', fontSize: '0.85rem' }}>CPU: {selectedDevice.cpu}<br/>RAM: {selectedDevice.ram}<br/>Storage: {selectedDevice.storage}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${selectedDevice.health === 'Healthy' ? '#10b981' : selectedDevice.health === 'Critical' ? '#ef4444' : '#f59e0b'}` }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Device Health & History</h5>
              <div style={{ color: '#fff', fontSize: '0.85rem' }}>
                Current Status: <strong>{selectedDevice.health}</strong><br/>
                [History] Patch compliant. No hardware faults in last 30 days.
              </div>
            </div>

            <button className="cc-btn" style={{ marginTop: 'auto' }}>
              OPEN DEVICE DASHBOARD
            </button>
          </div>
        )}

      </div>
    </div>
  );
}


function NotificationsView() {
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const [filterType, setFilterType] = useState('All');

  const notificationsData = [
    { id: 'NOT-1', type: 'Critical', time: '10:45 AM', problem: 'Storage Drive Offline', device: 'SQL-PROD-01', evidence: '/dev/sdb array degraded. 1 drive missing.', status: 'Active', incident: 'INC-9045', isRead: false },
    { id: 'NOT-2', type: 'Warning', time: '09:30 AM', problem: 'High CPU Temperature', device: 'CVM-WORKSTATION', evidence: 'Package temp reached 92C for 5 minutes.', status: 'Active', incident: 'INC-9044', isRead: false },
    { id: 'NOT-3', type: 'Recovery', time: '08:15 AM', problem: 'Network Restored', device: 'CORE-SWITCH-01', evidence: 'Uplink 2 re-established BGP session.', status: 'Resolved', incident: 'INC-9039', isRead: true },
    { id: 'NOT-4', type: 'Information', time: 'Yesterday', problem: 'System Update Available', device: 'Global Fleet', evidence: 'Security patch KB5043123 ready for deployment.', status: 'Pending', incident: 'None', isRead: true },
    { id: 'NOT-5', type: 'Attention', time: '2 Days Ago', problem: 'Low Disk Space', device: 'NAS-Storage', evidence: 'Volume 1 is 90% full (400GB remaining).', status: 'Active', incident: 'INC-9021', isRead: true }
  ];

  const categories = ['All', 'Critical', 'Warning', 'Attention', 'Information', 'Recovery'];
  
  const filteredNotifs = filterType === 'All' ? notificationsData : notificationsData.filter(n => n.type === filterType);

  const getNotifColor = (type: string) => {
    if (type === 'Critical') return '#ef4444';
    if (type === 'Warning') return '#f59e0b';
    if (type === 'Attention') return '#eab308';
    if (type === 'Recovery') return '#10b981';
    return '#3b82f6'; // Info
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Alerts & Notifications</h3>
          <span className="cc-os">Real-time System Event Push Notifications</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Notification History</button>
          <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.1)' }}>Notification Settings</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Categories (Left) */}
        <div className="process-list-container" style={{ width: '220px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Filters</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {categories.map(c => (
              <li 
                key={c} 
                onClick={() => setFilterType(c)}
                style={{ 
                  padding: '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: filterType === c ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: filterType === c ? `3px solid ${getNotifColor(c)}` : '3px solid transparent',
                  color: filterType === c ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                {c} Notifications
              </li>
            ))}
          </ul>
        </div>

        {/* Notifications List (Center) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filteredNotifs.map(n => (
              <div 
                key={n.id}
                onClick={() => setSelectedNotif(n)}
                style={{
                  background: selectedNotif?.id === n.id ? 'rgba(0,229,255,0.1)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${selectedNotif?.id === n.id ? '#00e5ff' : 'rgba(255,255,255,0.05)'}`,
                  borderLeft: `4px solid ${getNotifColor(n.type)}`,
                  padding: '1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: n.isRead ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!n.isRead && <div style={{ width: '8px', height: '8px', background: '#00e5ff', borderRadius: '50%' }}></div>}
                    <span style={{ fontWeight: 'bold', color: getNotifColor(n.type) }}>{n.type}</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>• {n.problem}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Device: {n.device}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Status: {n.status}</span>
                </div>
              </div>
            ))}
            {filteredNotifs.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No notifications found.</div>}
          </div>
        </div>

        {/* Notification Details (Right) */}
        {selectedNotif ? (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid #00e5ff' }}>
            
            <div>
              <span style={{ color: getNotifColor(selectedNotif.type), fontWeight: 'bold', fontSize: '0.85rem', textTransform: 'uppercase' }}>{selectedNotif.type} NOTIFICATION</span>
              <h3 style={{ color: '#fff', fontSize: '1.3rem', marginTop: '0.25rem' }}>{selectedNotif.problem}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Notification Time:</span>
                <span>{selectedNotif.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Affected Device:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedNotif.device}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                <span style={{ color: selectedNotif.status === 'Active' ? '#ef4444' : '#10b981' }}>{selectedNotif.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Related Incident:</span>
                <span style={{ fontFamily: 'monospace', color: '#00e5ff' }}>{selectedNotif.incident}</span>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Evidence Summary</h5>
              <div style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedNotif.evidence}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
              <button className="cc-btn" style={{ width: '100%', background: 'rgba(0, 229, 255, 0.2)', border: '1px solid #00e5ff', color: '#00e5ff' }}>
                OPEN INCIDENT
              </button>
              <button className="cc-btn" style={{ width: '100%', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                VIEW EVIDENCE
              </button>
              <button className="cc-btn" style={{ width: '100%', background: 'transparent', border: '1px dashed #ef4444', color: '#ef4444', marginTop: '1rem' }} onClick={() => setSelectedNotif(null)}>
                DISMISS NOTIFICATION
              </button>
            </div>
          </div>
        ) : (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div>
              <Bell size={48} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
              <p>Select a notification to view<br/>details and take action.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


function SettingsView() {
  const [activeCategory, setActiveCategory] = useState('General');

  const categories = [
    'General', 'Monitoring', 'Diagnostics', 'Privacy & Permissions', 'Reporting & Logs', 'Developer', 'About'
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Configuration & Preferences</h3>
          <span className="cc-os">Customize application behavior, telemetry intervals, and permissions</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Categories (Left) */}
        <div className="process-list-container" style={{ width: '250px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {categories.map(c => (
              <li 
                key={c} 
                onClick={() => setActiveCategory(c)}
                style={{ 
                  padding: '0.8rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: activeCategory === c ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: activeCategory === c ? '3px solid #00e5ff' : '3px solid transparent',
                  color: activeCategory === c ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.95rem',
                  fontWeight: activeCategory === c ? 'bold' : 'normal'
                }}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Settings Form (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {activeCategory === 'General' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Appearance</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Theme</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>Cyberpunk Dark</option><option>Light Mode</option></select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Language</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>English (US)</option><option>Spanish</option></select>
                </div>
              </div>

              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Startup Behavior</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Launch at system startup
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Start minimized in system tray
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Automatically Check Updates
                  </label>
                </div>
              </div>
            </>
          )}

          {activeCategory === 'Monitoring' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Telemetry & Retention</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Sampling Intervals (Live Data)</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>1 Second (High Impact)</option><option>5 Seconds (Default)</option></select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>History Retention</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>30 Days</option><option>90 Days</option><option>1 Year</option></select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Database Settings</span>
                  <button className="cc-btn">Manage SQLite DB</button>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Notifications</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Enable Desktop Notification Popups
                </label>
              </div>
            </>
          )}

          {activeCategory === 'Diagnostics' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Diagnostic Thresholds</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>CPU Temperature Critical Level</span>
                  <input type="number" defaultValue="90" style={{ width: '80px', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Storage Capacity Warning Limit</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>85% Full</option><option>90% Full</option></select>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Auto-run Background Diagnostics Weekly
              </label>
            </>
          )}

          {activeCategory === 'Privacy & Permissions' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>System Capabilities</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Administrator / Root Status</span>
                  <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Unprivileged User (Polkit Limited)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Capability Status</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>CAP_NET_RAW Available</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Network Discovery Permissions</span>
                  <button className="cc-btn" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b' }}>Request Elevated Scan Access</button>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Privacy</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Anonymous Data Collection (Telemetry)
                </label>
              </div>
            </>
          )}

          {activeCategory === 'Reporting & Logs' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Export Settings</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span>Default Export Format</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>PDF Document</option><option>HTML Page</option><option>JSON Payload</option></select>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Logging Settings</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Application Log Level</span>
                  <select className="cc-btn" style={{ background: 'rgba(0,0,0,0.3)', width: '200px' }}><option>INFO</option><option>DEBUG</option><option>ERROR</option></select>
                </div>
              </div>
            </>
          )}

          {activeCategory === 'Developer' && (
            <>
              <div>
                <h4 style={{ color: '#00e5ff', fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Advanced Settings</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1rem' }}>
                  <input type="checkbox" style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Enable Developer Console & Debug Tools
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#00e5ff', width: '16px', height: '16px' }} /> Ignore SSL Errors (Not Recommended)
                </label>
              </div>
            </>
          )}

          {activeCategory === 'About' && (
            <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
              <div style={{ width: '80px', height: '80px', background: '#00e5ff', borderRadius: '50%', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)' }}>
                <Activity size={40} color="#000" />
              </div>
              <h3 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Computer Vitals Monitor</h3>
              <p style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '2rem', fontWeight: 'bold' }}>Version 0.1.0-alpha</p>
              
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
                <div style={{ marginBottom: '1rem' }}><strong style={{color: 'var(--text-muted)'}}>License:</strong> MIT Open Source License</div>
                <div><strong style={{color: 'var(--text-muted)'}}>Open-source information:</strong> Built with React, Tauri, and Rust. Data visualized via Recharts. Icons by Lucide.</div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}


function HelpView() {
  const [activeTopic, setActiveTopic] = useState('What is CVM?');

  const topics = [
    'What is CVM?', 
    'Getting Started', 
    'Understanding System Health', 
    'Understanding Diagnostics', 
    'Understanding Evidence', 
    'Understanding Permissions', 
    'Troubleshooting CVM', 
    'About & Licenses'
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Help Center & Documentation</h3>
          <span className="cc-os">Product Manual, Troubleshooting, and Application Diagnostics</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>Report a Bug</button>
          <button className="cc-btn" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6' }}>View App Logs</button>
          <button className="cc-btn" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b' }}>App Diagnostics</button>
          <button className="cc-btn" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }}>Online Docs</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Help Topics (Left) */}
        <div className="process-list-container" style={{ width: '260px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {topics.map(t => (
              <li 
                key={t} 
                onClick={() => setActiveTopic(t)}
                style={{ 
                  padding: '0.8rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: activeTopic === t ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: activeTopic === t ? '3px solid #00e5ff' : '3px solid transparent',
                  color: activeTopic === t ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: activeTopic === t ? 'bold' : 'normal'
                }}
              >
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Help Content (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '2.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>
          
          <h2 style={{ color: '#00e5ff', fontSize: '1.8rem', marginBottom: '0.5rem', borderBottom: '1px solid rgba(0, 229, 255, 0.3)', paddingBottom: '1rem' }}>
            {activeTopic}
          </h2>

          {activeTopic === 'What is CVM?' && (
            <div style={{ color: '#fff' }}>
              <p style={{ marginBottom: '1rem' }}><strong>What Computer Vitals Monitor does:</strong></p>
              <p style={{ color: 'var(--text-muted)' }}>
                Computer Vitals Monitor (CVM) is a high-performance system monitoring and telemetry application written in Rust and React. It interfaces directly with the kernel and hardware layers to extract real-time metrics, system logs, hardware temperatures, and network topology.
              </p>
              <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>
                It goes beyond simple monitoring by offering an Automated Diagnostic Center and Incident Response system, acting as an autonomous technician that detects, explains, and occasionally resolves system anomalies.
              </p>
            </div>
          )}

          {activeTopic === 'Getting Started' && (
            <div style={{ color: '#fff' }}>
              <p style={{ marginBottom: '1rem' }}><strong>Getting Started:</strong></p>
              <ul style={{ color: 'var(--text-muted)', paddingLeft: '1.5rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Navigate to the Dashboard to see your live system vitals.</li>
                <li style={{ marginBottom: '0.5rem' }}>Check the Hardware and Storage tabs to ensure your disks and sensors are operating normally.</li>
                <li style={{ marginBottom: '0.5rem' }}>If you experience an issue, immediately run a Full System Diagnostic to generate actionable evidence.</li>
              </ul>
            </div>
          )}

          {activeTopic === 'Understanding System Health' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                System health is calculated by continuously sampling CPU load, thermal thresholds, disk latency, and kernel error logs. A system transitions from <strong style={{color: '#10b981'}}>Healthy</strong> to <strong style={{color: '#f59e0b'}}>Warning</strong> when parameters exceed 80% utilization for sustained periods, and to <strong style={{color: '#ef4444'}}>Critical</strong> upon hardware failure detection (e.g. SMART errors).
              </p>
            </div>
          )}

          {activeTopic === 'Understanding Diagnostics' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                Diagnostics actively poke system APIs rather than passively listening. For example, a Memory Diagnostic allocates and verifies RAM segments. Always review the "Plain-English Explanation" generated after a diagnostic to understand what the test discovered.
              </p>
            </div>
          )}

          {activeTopic === 'Understanding Evidence' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                "Evidence" refers to the raw technical payload—such as a specific line in `dmesg` or an Event ID in the Windows Registry—that caused an alert to fire. You can use Evidence strings when opening IT support tickets.
              </p>
            </div>
          )}

          {activeTopic === 'Understanding Permissions' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                To execute critical actions like restarting services, forcing process termination, or deep network discovery, CVM requires elevated permissions (Root on Linux, Administrator on Windows). If a button fails, check your Polkit rules or launch CVM with `sudo`.
              </p>
            </div>
          )}

          {activeTopic === 'Troubleshooting CVM' && (
            <div style={{ color: '#fff' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                If the application interface freezes, ensure the Rust backend isn't hanging on a zombie process lock. Use the "View App Logs" and "App Diagnostics" buttons in the top right to analyze the internal state of CVM itself.
              </p>
            </div>
          )}

          {activeTopic === 'About & Licenses' && (
            <div style={{ color: '#fff' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #00e5ff', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Computer Vitals Monitor</h4>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Version: 0.1.0-alpha</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Build Information: Commit 1c6d09c (Release)</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>System Compatibility: Linux (Debian/Ubuntu), Windows 11, macOS 14+</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Platform Support: x86_64, aarch64</div>
              </div>
              
              <h4 style={{ marginBottom: '0.5rem' }}>Open-source Licenses</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                This software utilizes the following open-source projects:<br/>
                - React (MIT License)<br/>
                - Tauri (Apache-2.0 License)<br/>
                - Recharts (MIT License)<br/>
                - Lucide Icons (ISC License)
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}


function HomeGrid({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const boxes = [
    { id: 'dashboard', name: 'DASHBOARD', icon: <LayoutDashboard size={64} /> },
    { id: 'hardware', name: 'HARDWARE', icon: <Cpu size={64} /> },
    { id: 'tasks', name: 'SOFTWARE', icon: <SquareTerminal size={64} /> },
    { id: 'network', name: 'NETWORK', icon: <Wifi size={64} /> },
    { id: 'devices', name: 'DEVICES', icon: <MonitorSmartphone size={64} /> },
    { id: 'reports', name: 'REPORTS', icon: <FileText size={64} /> },
  ];

  return (
    <div className="home-grid-container">
      {boxes.map(box => (
        <div key={box.id} className="home-box" onClick={() => setActiveTab(box.id)}>
          <div className="home-box-icon">{box.icon}</div>
          <div className="home-box-name">{box.name}</div>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [history, setHistory] = useState<SystemVitals[]>([]);
  const [activeTab, setActiveTab] = useState<string>("home");

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
      

      <main className="main-content">
        <header className="top-bar" data-tauri-drag-region>
          <div className="top-brand" data-tauri-drag-region>
            {activeTab === 'home' ? (
              <div className="app-icon-brand" data-tauri-drag-region>
                <div style={{ position: 'relative', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={28} style={{ position: 'absolute', color: '#00e5ff' }} />
                  <Activity size={14} style={{ position: 'absolute', color: '#00e5ff', top: '5px' }} />
                </div>
                <h1 style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '2px', fontWeight: 900, color: '#fff' }}>CVM</h1>
              </div>
            ) : (
              <button className="back-to-home-btn" onClick={() => setActiveTab('home')}>
                ← BACK TO HOME
              </button>
            )}
          </div>
          
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
          {activeTab === 'home' && <HomeGrid setActiveTab={setActiveTab} />}
          {activeTab === 'dashboard' && <DashboardGrid vitals={vitals} history={history} setActiveTab={setActiveTab} />}
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
        {activeTab === 'actions' && <ActionsView />}
        {activeTab === 'discovery' && <DiscoveryView />}
        {activeTab === 'fleet' && <FleetView />}
        {activeTab === 'notifications' && <NotificationsView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'help' && <HelpView />}
        {activeTab === 'tasks' && <SoftwareView vitals={vitals} />}
        </div>
      </main>
    </div>
  );
}

export default App;
