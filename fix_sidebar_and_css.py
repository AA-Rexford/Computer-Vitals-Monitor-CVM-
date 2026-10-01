import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace sidebar nav entirely
old_nav = r'<nav className="sidebar-nav">.*?</nav>'
new_nav = """<nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> <span className="nav-text">Dashboard</span>
          </button>
          <button className={`nav-item ${activeTab === 'hardware' ? 'active' : ''}`} onClick={() => setActiveTab('hardware')}>
            <Cpu size={18} /> <span className="nav-text">Hardware</span>
          </button>
          <button className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
            <Activity size={18} /> <span className="nav-text">Processes</span>
          </button>
          <button className={`nav-item ${activeTab === 'diagnostics' ? 'active' : ''}`} onClick={() => setActiveTab('diagnostics')}>
            <Stethoscope size={18} /> <span className="nav-text">Diagnostics</span>
          </button>
          <button className={`nav-item ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
            <Info size={18} /> <span className="nav-text">System Info</span>
          </button>
        </nav>"""

content = re.sub(old_nav, new_nav, content, flags=re.DOTALL)

# Fix top bar text overlap in DashboardGrid
# Old: <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
# New: <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
content = content.replace("alignItems: 'center' }", "alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }")

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src/App.css", "r") as f:
    css = f.read()

# Fix cc-identity max width so it truncates or wraps nicely
css = css.replace(".cc-identity {", ".cc-identity {\n  flex: 1;\n  min-width: 300px;\n")
with open("src/App.css", "w") as f:
    f.write(css)

