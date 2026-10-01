import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports'>")

# 2. Add Reports tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "history" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("history"\)\}>\n\s*<LineChart size=\{18\} /> <span className="nav-text">History</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>\n            <FileText size={18} /> <span className="nav-text">Reports</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add FileText icon import
if "FileText" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, FileText,")

# 4. Create ReportsView component
reports_view = """
function ReportsView() {
  const [reportType, setReportType] = useState('Full System Report');

  const reportTypes = [
    'Quick Report', 'Full System Report', 'Technician Report', 
    'Hardware Report', 'Storage Report', 'Network Report', 
    'Diagnostic Report', 'Incident Report', 'Historical Report', 
    'Device Report', 'Organization Report'
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header & Export Actions */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>Report Generator</h3>
          <span className="cc-os">Comprehensive Export & Telemetry Compilation</span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="cc-btn" style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }}>EXPORT PDF</button>
          <button className="cc-btn" style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#3b82f6' }}>EXPORT HTML</button>
          <button className="cc-btn" style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b' }}>EXPORT JSON</button>
          <button className="cc-btn" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }}>EXPORT CSV</button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Report Types (Left) */}
        <div className="process-list-container" style={{ width: '280px', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Report Profiles</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {reportTypes.map(r => (
              <li 
                key={r} 
                onClick={() => setReportType(r)}
                style={{ 
                  padding: '0.6rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: reportType === r ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                  borderLeft: reportType === r ? '3px solid #00e5ff' : '3px solid transparent',
                  color: reportType === r ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.9rem'
                }}
              >
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Report Preview (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ borderBottom: '2px solid rgba(0, 229, 255, 0.3)', paddingBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Report Preview</span>
            <h2 style={{ margin: '0.5rem 0 0 0' }}>{reportType}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Generated on: {new Date().toLocaleString()}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Computer Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Hostname: CVM-WORKSTATION<br/>OS: Linux 6.8.0-45-generic<br/>Uptime: 4 days, 12 hours</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Hardware Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>CPU: AMD Ryzen 9 7950X<br/>RAM: 64GB DDR5-6000<br/>GPU: NVIDIA RTX 4090</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Software Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Kernel: 6.8.0-45-generic<br/>Services: 142 Active / 2 Failed<br/>Drivers: NVIDIA 535, uvcvideo</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Network Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>IP: 192.168.1.45<br/>Gateway: 192.168.1.1<br/>Link: 1000Mbps Full-Duplex</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', gridColumn: '1 / -1' }}>
              <h5 style={{ color: '#00e5ff', marginBottom: '0.5rem' }}>Storage Information</h5>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/dev/nvme0n1 (System): 240GB / 1TB Used (24%)<br/>/dev/sdb (Data): 1.8TB / 4TB Used (45%)</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
            <h5 style={{ color: '#f59e0b', marginBottom: '1rem', fontSize: '1rem' }}>Health Findings & Diagnostic Results</h5>
            <div style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong style={{color: '#10b981'}}>[PASS] CPU Diagnostic:</strong> All thermal zones nominal. Max temp 72C.</div>
              <div><strong style={{color: '#10b981'}}>[PASS] RAM Diagnostic:</strong> MemTest clean. No ECC errors detected.</div>
              <div><strong style={{color: '#ef4444'}}>[FAIL] Service Diagnostic:</strong> Docker daemon failed to bind port 8080.</div>
              <div><strong style={{color: '#f59e0b'}}>[WARN] Storage Diagnostic:</strong> High latency detected on /dev/sdb during 4K random read.</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
            <h5 style={{ color: '#8b5cf6', marginBottom: '1rem', fontSize: '1rem' }}>Incident Log & Timeline</h5>
            <div style={{ fontSize: '0.85rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div><strong>Incident INC-9041:</strong> Docker Bind Error (Warning)</div>
              <div style={{color: 'var(--text-muted)', fontFamily: 'monospace'}}>Evidence: listen tcp4 0.0.0.0:8080: bind: address already in use</div>
              <div><strong style={{color: '#00e5ff'}}>Actions Taken:</strong> Restarted dockerd.</div>
              <div><strong style={{color: '#ef4444'}}>Verification:</strong> Failed. Manual recovery required.</div>
              <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '0.5rem 0'}}/>
              <div><strong>Incident INC-9040:</strong> GPU Driver Crash (Recovered)</div>
              <div style={{color: 'var(--text-muted)', fontFamily: 'monospace'}}>Evidence: NVRM: GPU at PCI:0000:01:00.0 fell off the bus.</div>
              <div><strong style={{color: '#00e5ff'}}>Actions Taken:</strong> Auto-reloaded kernel modules.</div>
              <div><strong style={{color: '#10b981'}}>Verification:</strong> Success. System stable.</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", reports_view + "\nfunction App() {")

# Render ReportsView based on activeTab
content = content.replace("{activeTab === 'history' && <HistoryView history={history} />}", "{activeTab === 'history' && <HistoryView history={history} />}\n        {activeTab === 'reports' && <ReportsView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

