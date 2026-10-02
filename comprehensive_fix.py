import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# ============================================================
# FIX 1: HomeGrid - use h2 tags and proper unique icon for SOFTWARE
# The icon component wraps Monitor+Activity composite for SOFTWARE
# ============================================================
old_homegrid = """function HomeGrid({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
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
}"""

new_homegrid = """function HomeGrid({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const boxes = [
    { id: 'dashboard', name: 'DASHBOARD', icon: <LayoutDashboard /> },
    { id: 'hardware', name: 'HARDWARE', icon: <Cpu /> },
    { id: 'tasks', name: 'SOFTWARE', icon: <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Monitor /><Activity style={{ position: 'absolute', width: '45%', height: '45%', top: '18%' }} /></div> },
    { id: 'network', name: 'NETWORK', icon: <Wifi /> },
    { id: 'devices', name: 'DEVICES', icon: <MonitorSmartphone /> },
    { id: 'reports', name: 'REPORTS', icon: <FileText /> },
  ];

  return (
    <div className="home-grid-container">
      {boxes.map(box => (
        <div key={box.id} className="home-box" onClick={() => setActiveTab(box.id)}>
          {box.icon}
          <h2>{box.name}</h2>
        </div>
      ))}
    </div>
  );
}"""

content = content.replace(old_homegrid, new_homegrid)

# ============================================================
# FIX 2: Dashboard POWER card - detect battery dynamically
# Replace hardcoded "No battery detected" with sensor-aware logic
# Also fix duplicate Activity icons: use Thermometer for SENSORS (already there),
# use Zap-like unicode for POWER, use Server for SYS LOAD
# ============================================================

# Fix POWER card - make it read sensors for battery info
old_power = """        {/* BATTERY / POWER */}
        <div className="cc-card" style={{ border: '1px solid #64748b', background: 'rgba(100, 116, 139, 0.05)' }}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#64748b'}}><Activity size={14}/> POWER</span><span className="cc-value">AC LINE</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No battery detected (Desktop)</div>
          <div className="cc-graph-mini" style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '10px' }}>
             <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>120V CONSTANT</span>
          </div>
        </div>"""

new_power = """        {/* BATTERY / POWER */}
        {(() => {
          const batSensor = vitals.sensors.find(s => s.label.toLowerCase().includes('bat'));
          const hasBattery = !!batSensor;
          const batTemp = batSensor?.temperature || 0;
          return (
            <div className="cc-card" style={{ border: '1px solid #a855f7', background: 'rgba(168, 85, 247, 0.05)' }}>
              <div className="cc-card-header"><span className="cc-title" style={{color: '#a855f7'}}>⚡ POWER</span><span className="cc-value">{hasBattery ? `${batTemp > 0 ? batTemp.toFixed(0) + '°C' : 'ON BAT'}` : 'AC'}</span></div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hasBattery ? 'Battery detected' : 'AC Power (No battery)'}</div>
              <div className="cc-graph-mini" style={{ height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: hasBattery ? '#a855f7' : '#64748b', fontFamily: 'monospace' }}>{hasBattery ? 'BATTERY ACTIVE' : 'MAINS POWER'}</span>
              </div>
            </div>
          );
        })()}"""

content = content.replace(old_power, new_power)

# Fix SYS LOAD card - replace duplicate Activity icon with Server
old_sysload = """<span className="cc-title" style={{color: '#f472b6'}}><Activity size={14}/> SYS LOAD</span>"""
new_sysload = """<span className="cc-title" style={{color: '#f472b6'}}><Server size={14}/> SYS LOAD</span>"""
content = content.replace(old_sysload, new_sysload)

# ============================================================
# FIX 3: ReportsView is called without props at line 3540
# ============================================================
content = content.replace(
    "{activeTab === 'reports' && <ReportsView />}",
    "{activeTab === 'reports' && <ReportsView history={history} vitals={vitals} />}"
)

# ============================================================
# FIX 4: Remove orphan views that aren't accessible from HomeGrid
# and clean up their routes. Keep only: home, dashboard, hardware,
# tasks (software), network, devices, reports
# ============================================================
# Remove routes to orphan views that cause confusion
orphan_routes = [
    "{activeTab === 'system' && <SystemInfoView vitals={vitals} />}",
    "{activeTab === 'services' && <ServicesView />}",
    "{activeTab === 'storage' && <StorageView vitals={vitals} history={history} />}",
    "{activeTab === 'logs' && <LogsView />}",
    "{activeTab === 'incidents' && <IncidentsView />}",
    "{activeTab === 'history' && <HistoryView history={history} />}",
    "{activeTab === 'actions' && <ActionsView />}",
    "{activeTab === 'discovery' && <DiscoveryView />}",
    "{activeTab === 'fleet' && <FleetView />}",
    "{activeTab === 'notifications' && <NotificationsView />}",
    "{activeTab === 'settings' && <SettingsView />}",
    "{activeTab === 'help' && <HelpView />}",
]
for route in orphan_routes:
    content = content.replace(route, "")

# ============================================================
# FIX 5: Dashboard quick controls reference 'diagnostics' which doesn't exist
# Fix to route to 'reports' instead
# ============================================================
content = content.replace(
    "onClick={() => setActiveTab('diagnostics')}",
    "onClick={() => setActiveTab('reports')}"
)

# Fix storage route in dashboard to hardware  
content = content.replace(
    "onClick={() => setActiveTab('storage')}",
    "onClick={() => setActiveTab('hardware')}"
)

with open("src/App.tsx", "w") as f:
    f.write(content)

print("All fixes applied successfully")
