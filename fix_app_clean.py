import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add state to DashboardGrid ONLY
state_add = """  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };"""

# We find the start of DashboardGrid
dash_start = content.find("function DashboardGrid")
if dash_start != -1:
    sys_decl_idx = content.find("const sys = vitals.sys_info;", dash_start)
    if sys_decl_idx != -1:
        content = content[:sys_decl_idx] + state_add + "\n  " + content[sys_decl_idx:]

# 2. Replace alert() with showStatus() ONLY in DashboardGrid
dash_end = content.find("function DiagnosticsView", dash_start)
dash_content = content[dash_start:dash_end]

dash_content = dash_content.replace("alert(result);", "showStatus(result);")
dash_content = dash_content.replace('alert("Error: " + e);', 'showStatus("Error: " + e);')

# 3. Replace header
tm_header_old = r'<span className="cc-sub">.*?listed</span>'
tm_header_new = r'<button className="cc-btn secondary" style={{padding: "0.2rem 0.5rem", fontSize: "0.7rem", marginTop: "-5px"}} onClick={() => setShowAllTasks(!showAllTasks)}>{showAllTasks ? "COLLAPSE" : "SEE ALL TASKS"}</button>'
dash_content = re.sub(tm_header_old, tm_header_new, dash_content)

# 4. Replace mapping
process_map_regex = r'\{vitals\.processes\..*?\.map\(\(p\) => \('
new_map = """{vitals.processes.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const aIsApp = ['brave', 'chrome', 'firefox', 'gnome', 'code', 'spotify', 'slack', 'discord', 'terminal', 'nautilus', 'vlc', 'cvm'].some(app => aName.includes(app)) ? 0 : 1;
                const bIsApp = ['brave', 'chrome', 'firefox', 'gnome', 'code', 'spotify', 'slack', 'discord', 'terminal', 'nautilus', 'vlc', 'cvm'].some(app => bName.includes(app)) ? 0 : 1;
                if (aIsApp !== bIsApp) return aIsApp - bIsApp;
                return aName.localeCompare(bName) || a.pid - b.pid;
              }).slice(0, showAllTasks ? 9999 : 15).map((p) => ("""
dash_content = re.sub(process_map_regex, new_map, dash_content)

# 5. Add toast ONLY at the end of DashboardGrid
toast_ui = """
      {statusMsg && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(0, 229, 255, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid #00e5ff', color: '#fff', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {statusMsg}
        </div>
      )}
"""
dash_content_r = dash_content.rsplit("</div>\n  );\n}", 1)
if len(dash_content_r) == 2:
    dash_content = dash_content_r[0] + toast_ui + "\n    </div>\n  );\n}"

content = content[:dash_start] + dash_content + content[dash_end:]

with open("src/App.tsx", "w") as f:
    f.write(content)

