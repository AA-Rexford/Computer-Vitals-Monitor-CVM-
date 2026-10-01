import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add state for status message and showAllTasks
state_add = """  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };"""
content = re.sub(r'const sys = vitals\.sys_info;', state_add + '\n  const sys = vitals.sys_info;', content)

# 2. Replace alert() with showStatus()
content = content.replace("alert(result);", "showStatus(result);")
content = content.replace('alert("Error: " + e);', 'showStatus("Error: " + e);')

# 3. Fix Task Manager sorting and limit
# Find the task manager section
# Replace the header and the map
tm_header_old = r'<span className="cc-sub">.*?listed</span>'
tm_header_new = r'<button className="cc-btn secondary" style={{padding: "0.2rem 0.5rem", fontSize: "0.7rem"}} onClick={() => setShowAllTasks(!showAllTasks)}>{showAllTasks ? "COLLAPSE" : "SEE ALL TASKS"}</button>'
content = re.sub(tm_header_old, tm_header_new, content)

# Process sorting: We'll put common apps on top, then sort alphabetically to guarantee absolute stability.
common_apps = "['brave', 'chrome', 'firefox', 'gnome', 'code', 'spotify', 'slack', 'discord', 'terminal', 'nautilus', 'vlc']"
process_map_regex = r'\{vitals\.processes\..*?\.map\(\(p\) => \('
new_map = """{vitals.processes.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const aIsApp = ['brave', 'chrome', 'firefox', 'gnome', 'code', 'spotify', 'slack', 'discord', 'terminal', 'nautilus', 'vlc', 'cvm'].some(app => aName.includes(app)) ? 0 : 1;
                const bIsApp = ['brave', 'chrome', 'firefox', 'gnome', 'code', 'spotify', 'slack', 'discord', 'terminal', 'nautilus', 'vlc', 'cvm'].some(app => bName.includes(app)) ? 0 : 1;
                if (aIsApp !== bIsApp) return aIsApp - bIsApp;
                return aName.localeCompare(bName) || a.pid - b.pid;
              }).slice(0, showAllTasks ? 9999 : 15).map((p) => ("""
content = re.sub(process_map_regex, new_map, content)

# 4. Add the status message toast to the bottom
toast_ui = """
      {statusMsg && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(0, 229, 255, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid #00e5ff', color: '#fff', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {statusMsg}
        </div>
      )}
"""
content = content.replace("</div>\n  );\n}", toast_ui + "\n    </div>\n  );\n}")

with open("src/App.tsx", "w") as f:
    f.write(content)

print("App.tsx updated")
