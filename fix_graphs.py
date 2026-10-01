import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Remove Event Log
events_log_pattern = r'<div className="events-header">\s*<h4>Event Log</h4>.*?</div>\s*</div>\s*<div className="events-list".*?>.*?</div>'
content = re.sub(events_log_pattern, '', content, flags=re.DOTALL)

# Also remove actionLogs and eventFilter if desired, but we can just leave the state variables unused.

# 2. Fix the Task Manager slice
content = content.replace("vitals.processes.slice(0, 6)", "vitals.processes.slice(0, 100)")
# Ensure the task manager list can scroll well
content = content.replace("maxHeight: '180px'", "maxHeight: '300px', overflowY: 'auto'")
# Add the YAxis import
if "YAxis" not in content:
    content = content.replace("import { AreaChart, Area, ResponsiveContainer,", "import { AreaChart, Area, YAxis, ResponsiveContainer,")

# 3. Add YAxis to all charts to fix scaling and glow
# CPU
cpu_chart = r'(<AreaChart data=\{history\.map\(\(h, i\) => \(\{ time: i, val: h\.cpu_usage \}\)\)\} margin=\{\{ top: 0, right: 0, left: 0, bottom: 0 \}\}>)'
content = re.sub(cpu_chart, r'\1\n                <YAxis domain={[0, 100]} hide />', content)

# RAM
ram_chart = r'(<AreaChart data=\{history\.map\(\(h, i\) => \(\{ time: i, val: \(h\.ram_used / h\.ram_total\) \* 100 \}\)\)\} margin=\{\{ top: 0, right: 0, left: 0, bottom: 0 \}\}>)'
content = re.sub(ram_chart, r'\1\n                <YAxis domain={[0, 100]} hide />', content)

# GPU
gpu_chart = r'(<AreaChart data=\{history\.map\(\(h, i\) => \{\n                const gt = h\.sensors.*?return \{ time: i, val: gt \};\n              \}\)\} margin=\{\{ top: 0, right: 0, left: 0, bottom: 0 \}\}>)'
content = re.sub(gpu_chart, r'\1\n                <YAxis domain={[0, 100]} hide />', content)

# Network
net_chart = r'(<AreaChart data=\{history\.map\(\(h, i\) => \(\{ time: i, val: h\.networks.*?\}\)\)\} margin=\{\{ top: 0, right: 0, left: 0, bottom: 0 \}\}>)'
content = re.sub(net_chart, r'\1\n                <YAxis hide />', content)

# Fix the action logging (since we removed the log panel, we should just alert or console.log)
# Wait, handleKill and handleQuickAction use setActionLogs. We can just leave it, they will silently succeed in state but not render.
# Or we can change to alert:
# setActionLogs(prev => ... -> alert(result)
content = re.sub(r'setActionLogs\(prev => \[.*?\]\);', '', content)
content = content.replace('const result: string = await invoke("quick_action", { action });', 'const result: string = await invoke("quick_action", { action }); alert(result);')
content = content.replace('const result: string = await invoke("kill_process", { pid });', 'const result: string = await invoke("kill_process", { pid }); alert(result);')
# Add alert for errors too
content = re.sub(r'\} catch \(e: any\) \{.*?\}', r'} catch (e: any) {\n      alert("Error: " + e);\n    }', content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

