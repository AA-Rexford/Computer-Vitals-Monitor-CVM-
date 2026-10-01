import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices' | 'logs' | 'incidents' | 'history' | 'reports' | 'actions'>")

# 2. Add Actions tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "reports" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("reports"\)\}>\n\s*<FileText size=\{18\} /> <span className="nav-text">Reports</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "actions" ? "active" : ""}`} onClick={() => setActiveTab("actions")}>\n            <Wrench size={18} /> <span className="nav-text">Actions</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add Wrench icon import
if "Wrench" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, Wrench,")

# 4. Create ActionsView component
actions_view = """
function ActionsView() {
  const [selectedAction, setSelectedAction] = useState<any>(null);
  const [actionState, setActionState] = useState<'IDLE' | 'CONFIRM' | 'PROGRESS' | 'RESULT'>('IDLE');
  const [progress, setProgress] = useState(0);
  const [actionHistory, setActionHistory] = useState<any[]>([
    { id: 1, action: 'Restart Network Service', result: 'Success', verification: 'Ping 8.8.8.8 successful.', time: '10:42 AM' },
    { id: 2, action: 'Flush DNS', result: 'Failed', verification: 'Permission denied. Root required.', time: '09:15 AM' }
  ]);

  const categories = [
    {
      name: 'System Actions',
      color: '#8b5cf6',
      actions: ['Open System Settings', 'Check Updates', 'Restart Computer', 'Shutdown Computer']
    },
    {
      name: 'Network Actions',
      color: '#3b82f6',
      actions: ['Renew DHCP', 'Flush DNS', 'Reconnect Network Interface', 'Restart Network Service']
    },
    {
      name: 'Service Actions',
      color: '#10b981',
      actions: ['Start Service', 'Stop Service', 'Restart Service']
    },
    {
      name: 'Process Actions',
      color: '#f59e0b',
      actions: ['Terminate Process', 'Force Terminate Process']
    },
    {
      name: 'Storage Actions',
      color: '#00e5ff',
      actions: ['Run Supported Storage Checks', 'Defragment Drive (if supported)']
    }
  ];

  const handleSelectAction = (actionName: string) => {
    setSelectedAction(actionName);
    setActionState('CONFIRM');
    setProgress(0);
  };

  const executeAction = () => {
    setActionState('PROGRESS');
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setActionState('RESULT');
          
          // Add to history
          const isFail = selectedAction.includes('Shutdown') || selectedAction.includes('Force');
          setActionHistory(prev => [{
            id: Date.now(),
            action: selectedAction,
            result: isFail ? 'Failed' : 'Success',
            verification: isFail ? 'Polkit/Root Policy Blocked Action.' : 'Action applied successfully and verified.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }, ...prev]);
          
          return 100;
        }
        return p + 10;
      });
    }, 150);
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Header */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity">
          <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>System Control & Actions</h3>
          <span className="cc-os">User/Permission: standard_user (Limited Polkit Access)</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Action Grid (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Available System Actions</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {categories.map(cat => (
              <div key={cat.name} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', borderTop: `4px solid ${cat.color}` }}>
                <h5 style={{ color: cat.color, marginBottom: '1rem', fontSize: '1rem' }}>{cat.name}</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cat.actions.map(act => (
                    <button 
                      key={act} 
                      className="cc-btn" 
                      style={{ 
                        width: '100%', 
                        background: selectedAction === act ? `${cat.color}33` : 'rgba(0,0,0,0.3)', 
                        border: `1px solid ${selectedAction === act ? cat.color : 'rgba(255,255,255,0.1)'}`, 
                        color: selectedAction === act ? '#fff' : 'var(--text-muted)',
                        textAlign: 'left',
                        padding: '0.6rem 0.8rem',
                        fontSize: '0.85rem'
                      }}
                      onClick={() => handleSelectAction(act)}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Execution Panel & History (Right) */}
        <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '1px solid #00e5ff' }}>
          
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
            <h4 style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '1rem' }}>Action Execution</h4>
            
            {!selectedAction ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
                Select an action from the left<br/>to execute it.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedAction}</div>
                
                {actionState === 'CONFIRM' && (
                  <div style={{ background: 'rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid #f59e0b' }}>
                    <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '0.5rem' }}>Action Confirmation</div>
                    <div style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '1rem' }}>Are you sure you want to execute "{selectedAction}"? This may interrupt system services.</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="cc-btn" style={{ flexGrow: 1, background: '#ef4444', color: '#fff' }} onClick={() => setSelectedAction(null)}>CANCEL</button>
                      <button className="cc-btn" style={{ flexGrow: 1, background: '#10b981', color: '#fff' }} onClick={executeAction}>EXECUTE</button>
                    </div>
                  </div>
                )}

                {actionState === 'PROGRESS' && (
                  <div style={{ background: 'rgba(0, 229, 255, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid #00e5ff' }}>
                    <div style={{ color: '#00e5ff', fontWeight: 'bold', marginBottom: '0.5rem' }}>Action Progress</div>
                    <div className="progress-bar" style={{ height: '12px', background: 'rgba(0,0,0,0.5)' }}>
                      <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.15s ease' }}></div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem', textAlign: 'center' }}>Executing payload... {progress}%</div>
                  </div>
                )}

                {actionState === 'RESULT' && (
                  <div style={{ background: selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', border: `1px solid ${selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? '#ef4444' : '#10b981'}` }}>
                    <div style={{ color: selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? '#ef4444' : '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      Action Result: {selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? 'FAILED' : 'SUCCESS'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#fff' }}>
                      <strong>Verification Result:</strong><br/>
                      {selectedAction.includes('Shutdown') || selectedAction.includes('Force') ? 'Action blocked by OS security policy (Root/Admin required).' : 'The system confirmed the action completed successfully.'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ flexGrow: 1 }}>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '1rem' }}>Action History</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {actionHistory.map(hist => (
                <div key={hist.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', borderLeft: `3px solid ${hist.result === 'Success' ? '#10b981' : '#ef4444'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{hist.action}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hist.time}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: hist.result === 'Success' ? '#10b981' : '#ef4444' }}>Result: {hist.result}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{hist.verification}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
"""

content = content.replace("function App() {", actions_view + "\nfunction App() {")

# Render ActionsView based on activeTab
content = content.replace("{activeTab === 'reports' && <ReportsView />}", "{activeTab === 'reports' && <ReportsView />}\n        {activeTab === 'actions' && <ActionsView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

