import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update ProcessInfo
old_proc = r'interface ProcessInfo \{[^}]+\}'
new_proc = """interface ProcessInfo { 
  pid: number; 
  name: string; 
  cpu_usage: number;
  memory_usage: number; 
  parent_pid: number;
  user: string;
  disk_read: number;
  disk_write: number;
  start_time: number;
  status: string;
  executable: string;
  command: string;
}"""
content = re.sub(old_proc, new_proc, content)

# 2. Fix DashboardGrid unused variables
content = content.replace("function DashboardGrid({ vitals, history, setActiveTab }: { vitals: SystemVitals | null, history: SystemVitals[], setActiveTab: any }) {", "function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {")

# Find where DashboardGrid ends (which is where SystemInfoView starts)
sysinfo_start = content.find("function SystemInfoView")
dashboard_grid = content[:sysinfo_start]

# Remove handleKill from DashboardGrid
dashboard_grid = re.sub(r'\s*const handleKill = async \(pid: number\) => \{.*?\};\n', '', dashboard_grid, flags=re.DOTALL)
# Remove sortedProcesses from DashboardGrid
dashboard_grid = re.sub(r'\s*const sortedProcesses = safeProcesses\.sort\(\(a, b\) => \{.*?\n\s*\}\);\n', '', dashboard_grid, flags=re.DOTALL)
# Remove safeProcesses from DashboardGrid
dashboard_grid = re.sub(r'\s*const safeProcesses = vitals\.processes\.filter.*?;\n', '', dashboard_grid)

content = dashboard_grid + content[sysinfo_start:]

# 3. In App() remove setActiveTab from DashboardGrid usage
content = content.replace("<DashboardGrid vitals={vitals} history={history} setActiveTab={setActiveTab} />", "<DashboardGrid vitals={vitals} history={history} />")


with open("src/App.tsx", "w") as f:
    f.write(content)

