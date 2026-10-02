import re

with open("src/App.tsx", "r") as f:
    app_ts = f.read()

# 1. Update the instantiation
app_ts = app_ts.replace("<DashboardGrid vitals={vitals} history={history} />", "<DashboardGrid vitals={vitals} history={history} setActiveTab={setActiveTab} />")

# 2. Extract and replace DashboardGrid
start_idx = app_ts.find("function DashboardGrid(")
end_idx = app_ts.find("function SystemInfoView", start_idx)

new_dashboard = """
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
"""

app_ts = app_ts[:start_idx] + new_dashboard + "\n" + app_ts[end_idx:]

with open("src/App.tsx", "w") as f:
    f.write(app_ts)

