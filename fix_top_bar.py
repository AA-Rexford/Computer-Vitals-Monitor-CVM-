import re

# 1. UPDATE App.tsx
with open("src/App.tsx", "r") as f:
    app_ts = f.read()

# Replace the top-bar block
old_top_bar_regex = r'<header className="top-bar".*?</header>'

new_top_bar = """<header className="top-bar" data-tauri-drag-region>
          <div className="top-brand" data-tauri-drag-region>
            {activeTab === 'home' ? (
              <div className="app-icon-brand" data-tauri-drag-region>
                <Activity size={24} style={{ color: '#00e5ff' }} />
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
        </header>"""

app_ts = re.sub(old_top_bar_regex, new_top_bar, app_ts, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(app_ts)

# 2. UPDATE App.css
with open("src/App.css", "r") as f:
    app_css = f.read()

# Remove padding from .main-content
app_css = app_css.replace(".main-content {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  padding: 1.5rem;\n  overflow: hidden;\n}", ".main-content {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  padding: 0;\n  overflow: hidden;\n}")

# Add padding to .tab-content
app_css = app_css.replace(".tab-content {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n}", ".tab-content {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  padding: 1.5rem;\n}")

# Fix .top-bar styles
new_top_bar_css = """
.top-bar {
  z-index: 50;
  position: relative;
  padding: 0;
  background: rgba(0, 0, 0, 0.4);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  -webkit-app-region: drag;
  height: 48px;
}

.top-brand {
  display: flex;
  height: 100%;
}

.app-icon-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1.5rem;
  background: rgba(0, 229, 255, 0.1);
  border-right: 1px solid var(--border-subtle);
}

.back-to-home-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.5rem;
  background: rgba(0, 229, 255, 0.15);
  border: none;
  border-right: 1px solid rgba(0, 229, 255, 0.3);
  color: #00e5ff;
  font-weight: 800;
  font-size: 0.9rem;
  letter-spacing: 1px;
  cursor: pointer;
  -webkit-app-region: no-drag;
  transition: all 0.2s;
}

.back-to-home-btn:hover {
  background: rgba(0, 229, 255, 0.3);
  color: #fff;
}
"""

app_css = re.sub(r'\.top-bar \{.*?(?=\.page-title \{)', new_top_bar_css, app_css, flags=re.DOTALL)

with open("src/App.css", "w") as f:
    f.write(app_css)

