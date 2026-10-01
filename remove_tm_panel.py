import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Remove TASK MANAGER (TOP) from Dashboard safely
# The panel starts with <div className="cc-card panel-card" style={{ maxHeight: '300px', overflowY: 'auto' }}>
# and ends right before <div className="cc-card panel-card"> ... <h4>QUICK ACTIONS</h4>
start_idx = content.find('<div className="cc-card panel-card" style={{ maxHeight: \'300px\', overflowY: \'auto\' }}>\n          <div className="panel-header" style={{ display: \'flex\', justifyContent: \'space-between\', alignItems: \'center\' }}>\n            <h4>TASK MANAGER (TOP)</h4>')
if start_idx != -1:
    end_idx = content.find('<div className="cc-card panel-card">\n          <div className="panel-header">\n            <h4>QUICK ACTIONS</h4>', start_idx)
    if end_idx != -1:
        content = content[:start_idx] + content[end_idx:]

with open("src/App.tsx", "w") as f:
    f.write(content)
