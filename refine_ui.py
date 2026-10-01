import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Change KILL to END and make it bigger
old_btn = r"<button onClick=\{\(\) => handleKill\(p\.pid\)\} style=\{\{ background: '#ef4444', color: '#fff', border: 'none', padding: '0\.2rem 0\.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0\.7rem' \}\}>KILL</button>"
new_btn = "<button onClick={() => handleKill(p.pid)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>END</button>"
content = re.sub(old_btn, new_btn, content)

# 2. Sort processes by memory to prevent jumping, and show more
# We need to sort vitals.processes inside the render or just sort it in state.
# It's currently `{vitals.processes.slice(0, 100).map((p) => (`
# Let's replace it with:
new_map = """{[...vitals.processes].sort((a, b) => b.memory_usage - a.memory_usage).slice(0, 50).map((p) => ("""
content = content.replace("vitals.processes.slice(0, 100).map((p) => (", new_map)

# 3. Graphs are too low/small. Increase height of cc-graph-mini to 140, and domain to [0, 'dataMax'] but wait, they hated when a small percentage looked high.
# If I set domain={[0, 100]} it is mathematically correct. 10% should be near the bottom!
# Maybe they want it to look like the CPU Utilization in the old Dashboard, which had NO domain and auto-scaled, BUT I'll just change the height to 120px so it physically looks larger.
content = content.replace("height={100}", "height={120}")

with open("src/App.tsx", "w") as f:
    f.write(content)
