import re

# ================================
# 1. Update App.tsx
# ================================
with open("src/App.tsx", "r") as f:
    app_ts = f.read()

# Make 'home' the default activeTab
app_ts = app_ts.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet' | 'notifications' | 'settings' | 'help'>('dashboard');",
                        "useState<'home' | 'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions' | 'discovery' | 'fleet' | 'notifications' | 'settings' | 'help'>('home');")

# Add HomeGrid component before App
home_grid = """
function HomeGrid({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const boxes = [
    { id: 'dashboard', name: 'DASHBOARD', icon: <LayoutDashboard size={64} /> },
    { id: 'hardware', name: 'HARDWARE', icon: <Cpu size={64} /> },
    { id: 'tasks', name: 'SOFTWARE', icon: <Activity size={64} /> },
    { id: 'network', name: 'NETWORK', icon: <Network size={64} /> },
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
"""
app_ts = app_ts.replace("function App() {", home_grid + "\nfunction App() {")

# Remove the entire <aside className="sidebar"> ... </aside>
# We'll use regex for this.
app_ts = re.sub(r'<aside className="sidebar".*?</aside>', '', app_ts, flags=re.DOTALL)

# Add "Back to Home" in top-bar
back_btn = """
          {activeTab !== 'home' && (
            <button className="cc-btn secondary" style={{ marginRight: '1rem' }} onClick={() => setActiveTab('home')}>
              ← Back to Home
            </button>
          )}
          <h2 className="page-title"
"""
app_ts = app_ts.replace('<h2 className="page-title"', back_btn)

# Add HomeGrid to the tab content
tab_content_injection = """<div className="tab-content">
          {activeTab === 'home' && <HomeGrid setActiveTab={setActiveTab} />}"""
app_ts = app_ts.replace('<div className="tab-content">', tab_content_injection)

# Add ChevronLeft or generic arrow icon import if needed. We can just use text arrow for now.

with open("src/App.tsx", "w") as f:
    f.write(app_ts)


# ================================
# 2. Update App.css
# ================================
with open("src/App.css", "r") as f:
    app_css = f.read()

new_css = """
/* HOME GRID Layout */
.home-grid-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 2rem;
  width: 100%;
  height: 100%;
  padding: 1rem;
}

.home-box {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
  position: relative;
}

.home-box::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at center, rgba(0, 229, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}

.home-box:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 229, 255, 0.2);
  border-color: rgba(0, 229, 255, 0.5);
}

.home-box:hover::before {
  opacity: 1;
}

.home-box-icon {
  color: var(--text-muted);
  transition: all 0.3s;
  z-index: 1;
}

.home-box:hover .home-box-icon {
  color: #00e5ff;
  transform: scale(1.1);
}

.home-box-name {
  font-size: 2.5rem;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--text-main);
  text-transform: uppercase;
  z-index: 1;
  transition: color 0.3s;
}

.home-box:hover .home-box-name {
  color: #fff;
}
"""

with open("src/App.css", "a") as f:
    f.write(new_css)

