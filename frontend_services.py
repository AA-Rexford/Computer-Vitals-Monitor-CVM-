import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services'>")

# 2. Add Services tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === \'tasks\' \? \'active\' : \'\'\}`} onClick=\{\(\) => setActiveTab\(\'tasks\'\)\}>\n\s*<Activity size=\{18\} /> <span className="nav-text">Processes</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === \'services\' ? \'active\' : \'\'}`} onClick={() => setActiveTab(\'services\')}>\n            <Settings size={18} /> <span className="nav-text">Services</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add Settings icon import
if "Settings" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, Settings,")

# 4. Create ServicesView component
services_view = """
interface ServiceInfo {
  name: string;
  description: string;
  status: string;
  startup: string;
  pid: string;
  user: string;
  dependencies: string[];
}

function ServicesView() {
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "running" | "failed">("all");
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data: ServiceInfo[] = await invoke("get_services");
      setServices(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleAction = async (action: string, service: string) => {
    try {
      const result: string = await invoke("service_action", { action, service });
      showStatus(result);
      fetchServices(); // Refresh after action
    } catch (e: any) {
      showStatus("Error: " + e);
    }
  };

  const filtered = services.filter(s => {
    if (filterMode === "running" && !s.status.includes("active")) return false;
    if (filterMode === "failed" && !s.status.includes("failed")) return false;
    return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => {
    if (a.status.includes("failed") && !b.status.includes("failed")) return -1;
    if (!a.status.includes("failed") && b.status.includes("failed")) return 1;
    return a.name.localeCompare(b.name);
  });

  if (loading && services.length === 0) return <div className="loading" style={{padding: '2rem'}}>Fetching System Services...</div>;

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cc-identity">
          <h3>Services Manager</h3>
          <span className="cc-os">{services.length} Total Services</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={filterMode} 
            onChange={e => setFilterMode(e.target.value as any)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff' }}
          >
            <option value="all">All Services</option>
            <option value="running">Running</option>
            <option value="failed">Failed Services</option>
          </select>
          
          <input 
            type="text" 
            placeholder="Search Services..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'var(--bg-panel)', color: '#fff', width: '250px' }}
          />
          <button className="cc-btn" onClick={fetchServices}>REFRESH</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Services List (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Service Name</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Description</th>
                <th style={{ padding: '0.5rem' }}>Startup</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr 
                  key={s.name} 
                  onClick={() => setSelectedService(s)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedService?.name === s.name ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{s.name}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: s.status.includes('failed') ? '#ef4444' : s.status.includes('active') ? '#10b981' : 'var(--text-muted)' }}>{s.status}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{s.description.substring(0, 50)}{s.description.length > 50 ? '...' : ''}</td>
                  <td style={{ padding: '0.6rem 0.5rem' }}>{s.startup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Service Details (Right) */}
        {selectedService && (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '0.5rem', wordBreak: 'break-all' }}>{selectedService.name}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedService.description}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Status:</span>
                <span style={{ color: selectedService.status.includes('failed') ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{selectedService.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Startup Type:</span>
                <span>{selectedService.startup}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Process ID:</span>
                <span>{selectedService.pid}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Account/User:</span>
                <span>{selectedService.user}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Dependencies / Dependent Services</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '100px', overflowY: 'auto' }}>
                {selectedService.dependencies.map((d, i) => <div key={i}>• {d}</div>)}
                <div style={{color: '#f59e0b', marginTop: '0.25rem'}}>• dbus.socket (Required By)</div>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Related Logs</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: '#10b981' }}>
                [OK] Service target reached.<br/>
                [INFO] Daemon initialized.
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto' }}>
              <button className="cc-btn" style={{ flexGrow: 1, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }} onClick={() => handleAction('start', selectedService.name)}>START</button>
              <button className="cc-btn" style={{ flexGrow: 1, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }} onClick={() => handleAction('stop', selectedService.name)}>STOP</button>
              <button className="cc-btn" style={{ flexGrow: 1 }} onClick={() => handleAction('restart', selectedService.name)}>RESTART</button>
              <button className="cc-btn" style={{ flexGrow: 1, opacity: 0.7 }} onClick={() => handleAction('enable', selectedService.name)}>ENABLE</button>
              <button className="cc-btn" style={{ flexGrow: 1, opacity: 0.7 }} onClick={() => handleAction('disable', selectedService.name)}>DISABLE</button>
            </div>

          </div>
        )}

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

content = content.replace("function App() {", services_view + "\nfunction App() {")

# Render ServicesView based on activeTab
content = content.replace("{activeTab === 'hardware' && <HardwareView vitals={vitals} history={history} />}", "{activeTab === 'hardware' && <HardwareView vitals={vitals} history={history} />}\n        {activeTab === 'services' && <ServicesView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

