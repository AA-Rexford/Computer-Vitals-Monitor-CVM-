import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Fix handleQuickAction and handleKill safely
new_funcs = """const handleQuickAction = async (action: string) => {
    try {
      const result: string = await invoke("quick_action", { action });
      alert(result);
    } catch (e: any) {
      alert("Error: " + e);
    }
  };

  const handleKill = async (pid: number) => {
    try {
      const result: string = await invoke("kill_process", { pid });
      alert(result);
    } catch (e: any) {
      alert("Error: " + e);
    }
  };"""
content = re.sub(r'const handleQuickAction = async.*?const handleKill = async.*?\}\s*\};\s*', new_funcs + "\n\n  ", content, flags=re.DOTALL)

# 2. Fix the Task Manager slice
content = content.replace("vitals.processes.slice(0, 6)", "vitals.processes.slice(0, 100)")
content = content.replace("maxHeight: '180px'", "maxHeight: '300px', overflowY: 'auto'")
if "YAxis" not in content:
    content = content.replace("import { AreaChart, Area, ResponsiveContainer,", "import { AreaChart, Area, YAxis, ResponsiveContainer,")

# 3. Add YAxis to all charts
cpu_chart = r'(<AreaChart data=\{history\.map\(\(h, i\) => \(\{ time: i, val: h\.cpu_usage \}\)\)\} margin=\{\{ top: 0, right: 0, left: 0, bottom: 0 \}\}>)'
content = re.sub(cpu_chart, r'\1\n                <YAxis domain={[0, 100]} hide />', content)

ram_chart = r'(<AreaChart data=\{history\.map\(\(h, i\) => \(\{ time: i, val: \(h\.ram_used / h\.ram_total\) \* 100 \}\)\)\} margin=\{\{ top: 0, right: 0, left: 0, bottom: 0 \}\}>)'
content = re.sub(ram_chart, r'\1\n                <YAxis domain={[0, 100]} hide />', content)

gpu_chart = r'(<AreaChart data=\{history\.map\(\(h, i\) => \{\n                const gt = h\.sensors.*?return \{ time: i, val: gt \};\n              \}\)\} margin=\{\{ top: 0, right: 0, left: 0, bottom: 0 \}\}>)'
content = re.sub(gpu_chart, r'\1\n                <YAxis domain={[0, 100]} hide />', content)

net_chart = r'(<AreaChart data=\{history\.map\(\(h, i\) => \(\{ time: i, val: h\.networks.*?\}\)\)\} margin=\{\{ top: 0, right: 0, left: 0, bottom: 0 \}\}>)'
content = re.sub(net_chart, r'\1\n                <YAxis hide />', content)

# 4. Remove Event Log panel completely
events_log_pattern = r'<div className="events-header">\s*<h4>Event Log</h4>.*?</div>\s*<div className="events-list".*?>.*?</div>'
content = re.sub(events_log_pattern, '', content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

