import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Add Task Manager to activeTab type and state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system'>('dashboard');", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks'>('dashboard');")

# 2. Add Task Manager icon to imports if possible, or use List/Activity
if "Activity" not in content:
    content = content.replace("import { Cpu, MemoryStick,", "import { Cpu, MemoryStick, Activity,")

# 3. Add sidebar button for Task Manager
nav_regex = r'(<button className={`nav-item \$\{activeTab === \'system\' \? \'active\' : \'\'\}`} onClick=\{\(\) => setActiveTab\(\'system\'\)\}>\n\s*<Monitor size=\{18\} /> System Info\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === \'tasks\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'tasks\')}>\n            <Activity size={18} /> Task Manager\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 4. Modify the DashboardGrid to accept setActiveTab
content = content.replace("function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {", "function DashboardGrid({ vitals, history, setActiveTab }: { vitals: SystemVitals | null, history: SystemVitals[], setActiveTab: any }) {")
content = content.replace("<DashboardGrid vitals={vitals} history={history} />", "<DashboardGrid vitals={vitals} history={history} setActiveTab={setActiveTab} />")

# 5. Fix the Dashboard "SEE ALL TASKS" button to trigger setActiveTab('tasks')
content = re.sub(r'onClick=\{\(\) => setShowAllTasks\(!showAllTasks\)\}>.*?COLLAPSE.*?SEE ALL TASKS.*?</button>', r'onClick={() => setActiveTab("tasks")}>SEE ALL TASKS</button>', content)

# 6. Make AreaCharts smooth (remove isAnimationActive={false})
content = content.replace("isAnimationActive={false}", "")

# 7. Create the TaskManagerView component
task_manager_view = """function TaskManagerView({ vitals }: { vitals: SystemVitals | null }) {
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing Task Manager...</div>;

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleKill = async (pid: number) => {
    try {
      const result: string = await invoke("kill_process", { pid });
      showStatus(result);
    } catch (e: any) {
      showStatus("Error: " + e);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter out the app's own processes so the user doesn't kill the UI
  const safeProcesses = vitals.processes.filter(p => !p.name.toLowerCase().includes('webkit') && !p.name.toLowerCase().includes('cvm'));

  const sortedProcesses = safeProcesses.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const apps = ['brave', 'chrome', 'firefox', 'gnome', 'code', 'spotify', 'slack', 'discord', 'terminal', 'nautilus', 'vlc'];
    const aIsApp = apps.some(app => aName.includes(app)) ? 0 : 1;
    const bIsApp = apps.some(app => bName.includes(app)) ? 0 : 1;
    if (aIsApp !== bIsApp) return aIsApp - bIsApp;
    return aName.localeCompare(bName) || a.pid - b.pid;
  });

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="cc-header" style={{ marginBottom: '1rem' }}>
        <div className="cc-identity">
          <h3>Task Manager</h3>
          <span className="cc-os">{sortedProcesses.length} Background Processes & Apps</span>
        </div>
      </div>
      
      <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.5rem' }}>Process Name</th>
              <th style={{ padding: '0.5rem' }}>PID</th>
              <th style={{ padding: '0.5rem' }}>CPU Usage</th>
              <th style={{ padding: '0.5rem' }}>Memory</th>
              <th style={{ padding: '0.5rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedProcesses.map(p => (
              <tr key={p.pid} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{p.name}</td>
                <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{p.pid}</td>
                <td style={{ padding: '0.75rem 0.5rem', color: '#00e5ff' }}>{p.cpu_usage.toFixed(1)}%</td>
                <td style={{ padding: '0.75rem 0.5rem', color: '#3b82f6' }}>{formatBytes(p.memory_usage)}</td>
                <td style={{ padding: '0.75rem 0.5rem' }}>
                  <button onClick={() => handleKill(p.pid)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>END</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {statusMsg && (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'rgba(0, 229, 255, 0.2)', backdropFilter: 'blur(10px)', border: '1px solid #00e5ff', color: '#fff', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {statusMsg}
        </div>
      )}
    </div>
  );
}

"""

# Insert TaskManagerView before function App
content = content.replace("function App() {", task_manager_view + "\nfunction App() {")

# 8. Render TaskManagerView based on activeTab
content = content.replace("{activeTab === 'system' && <SystemInfoView vitals={vitals} />}", "{activeTab === 'system' && <SystemInfoView vitals={vitals} />}\n        {activeTab === 'tasks' && <TaskManagerView vitals={vitals} />}")

# Remove the slice limit dependency on showAllTasks in Dashboard since we navigate away now.
content = re.sub(r'\.slice\(0, showAllTasks \? 9999 : 15\)', '.slice(0, 10)', content)

# Filter safe processes in Dashboard too
dashboard_map_start = r'\{vitals\.processes\.sort'
content = re.sub(dashboard_map_start, '{vitals.processes.filter(p => !p.name.toLowerCase().includes("webkit") && !p.name.toLowerCase().includes("cvm")).sort', content)


with open("src/App.tsx", "w") as f:
    f.write(content)

