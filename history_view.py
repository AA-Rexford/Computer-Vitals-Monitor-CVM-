import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history'>")

# 2. Add History tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "incidents" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("incidents"\)\}>\n\s*<AlertTriangle size=\{18\} /> <span className="nav-text">Incidents</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>\n            <LineChart size={18} /> <span className="nav-text">History</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add LineChart icon import
if "LineChart" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, LineChart,")

# 4. Create HistoryView component
history_view = """
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
"""

content = content.replace("function App() {", history_view + "\nfunction App() {")

# Render HistoryView based on activeTab
content = content.replace("{activeTab === 'incidents' && <IncidentsView />}", "{activeTab === 'incidents' && <IncidentsView />}\n        {activeTab === 'history' && <HistoryView history={history} />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

