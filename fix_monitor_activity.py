import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add Monitor to imports
if " Monitor," not in content:
    content = content.replace("import { Wifi,", "import { Wifi, Monitor,")

# Replace <Activity size={24} style={{ color: '#00e5ff' }} /> with the composite
old_icon = "<Activity size={24} style={{ color: '#00e5ff' }} />"
new_icon = """<div style={{ position: 'relative', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={28} style={{ position: 'absolute', color: '#00e5ff' }} />
                  <Activity size={14} style={{ position: 'absolute', color: '#00e5ff', top: '5px' }} />
                </div>"""

content = content.replace(old_icon, new_icon)

with open("src/App.tsx", "w") as f:
    f.write(content)

