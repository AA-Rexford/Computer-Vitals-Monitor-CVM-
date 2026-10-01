import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Remove the "Diagnostics" type from activeTab
content = content.replace("'diagnostics' | ", "")

# 2. Remove the Sidebar nav button
nav_regex = r'\s*<button className={`nav-item \$\{activeTab === "diagnostics" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("diagnostics"\)\}>\n\s*<Activity size=\{18\} /> <span className="nav-text">Diagnostics</span>\n\s*</button>'
content = re.sub(nav_regex, "", content)

# 3. Remove the rendering logic
render_regex = r'\s*\{activeTab === \'diagnostics\' && <DiagnosticsView />\}'
content = re.sub(render_regex, "", content)

# 4. Remove the component function itself
# We need to find "function DiagnosticsView() {" and the matching closing brace.
start_idx = content.find("function DiagnosticsView()")
if start_idx != -1:
    # Find the next function definition which is "function SystemInfoView"
    end_idx = content.find("function SystemInfoView", start_idx)
    if end_idx != -1:
        content = content[:start_idx] + content[end_idx:]

with open("src/App.tsx", "w") as f:
    f.write(content)

