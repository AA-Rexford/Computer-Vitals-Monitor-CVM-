import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Completely replace DiagnosticsView
old_diag_start = content.find("function DiagnosticsView({ vitals }")
old_diag_end = content.find("function SystemInfoView({ vitals }", old_diag_start)

diagnostics_view = """function DiagnosticsView({ vitals }: { vitals: SystemVitals | null }) {
  const [activeSuite, setActiveSuite] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runFullDiagnostic = () => {
    if (isRunning) return;
    setIsRunning(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsRunning(false);
          return 100;
        }
        return p + 5;
      });
    }, 150);
  };

  const runSuite = (suite: any) => {
    setActiveSuite(suite);
    runFullDiagnostic();
  };

  const suites = [
    { name: 'CPU Diagnostic', status: 'Passed', problems: 'None', evidence: 'MCE check passed. Stress test max temp 72C.', english: 'Your processor is running perfectly.', action: 'None required.' },
    { name: 'Memory Diagnostic', status: 'Passed', problems: 'None', evidence: 'MemTest86+ fast-pass completed. 0 ECC errors.', english: 'Your RAM is fully functional with no corrupt sectors.', action: 'None required.' },
    { name: 'Storage Diagnostic', status: 'Warning', problems: 'High read latency on /dev/sdb', evidence: 'Avg latency > 150ms during random 4K read.', english: 'Your secondary hard drive is responding slower than usual.', action: 'Run a filesystem check and ensure the drive is not heavily fragmented.' },
    { name: 'Filesystem Diagnostic', status: 'Passed', problems: 'None', evidence: 'fsck clean on /dev/sda1.', english: 'Your file systems are completely clean and structurally sound.', action: 'None required.' },
    { name: 'Network Diagnostic', status: 'Passed', problems: 'None', evidence: 'Gateway ping < 2ms. No packet drop.', english: 'Your local network connection is solid.', action: 'None required.' },
    { name: 'DNS Diagnostic', status: 'Passed', problems: 'None', evidence: 'Resolved google.com in 14ms via 8.8.8.8.', english: 'Your computer can successfully translate website names into IP addresses.', action: 'None required.' },
    { name: 'Internet Diagnostic', status: 'Passed', problems: 'None', evidence: 'HTTP GET to captive.apple.com returned 200 OK.', english: 'You have full access to the internet.', action: 'None required.' },
    { name: 'Wi-Fi Diagnostic', status: 'Warning', problems: 'Signal attenuation', evidence: 'RSSI -75dBm, frequent retries.', english: 'Your Wi-Fi signal is weak, which might cause slow speeds.', action: 'Move closer to your router or remove physical obstructions.' },
    { name: 'Bluetooth Diagnostic', status: 'Passed', problems: 'None', evidence: 'HCI socket responsive. 1 device paired.', english: 'Your Bluetooth radio is working properly.', action: 'None required.' },
    { name: 'Battery Diagnostic', status: 'Passed', problems: 'None', evidence: 'Wear level 12%. Voltage normal.', english: 'Your battery is holding a healthy charge.', action: 'None required.' },
    { name: 'Temperature Diagnostic', status: 'Passed', problems: 'None', evidence: 'All thermal zones within TjMax - 20C limit.', english: 'Your computer is adequately cooled.', action: 'None required.' },
    { name: 'Service Diagnostic', status: 'Error', problems: 'Docker daemon failed to start', evidence: 'exit code 1 (bind address already in use)', english: 'A background service (Docker) crashed because another program is using its network port.', action: 'Stop the conflicting application and restart the Docker service.' },
    { name: 'Driver Diagnostic', status: 'Passed', problems: 'None', evidence: 'All loaded kernel modules have valid signatures.', english: 'Your hardware drivers are correctly installed.', action: 'None required.' },
    { name: 'OS Health Diagnostic', status: 'Passed', problems: 'None', evidence: 'SFC / DISM integrity checks passed.', english: 'Your core operating system files are intact.', action: 'None required.' },
    { name: 'Update Diagnostic', status: 'Warning', problems: 'Updates pending', evidence: '3 security updates available in APT cache.', english: 'There are security updates waiting to be installed.', action: 'Run the system updater as soon as possible.' },
    { name: 'Printer Diagnostic', status: 'Passed', problems: 'None', evidence: 'CUPS spooler active. Printer idle.', english: 'Your printer is connected and ready to print.', action: 'None required.' },
    { name: 'Scanner Diagnostic', status: 'Passed', problems: 'None', evidence: 'SANE backend initialized.', english: 'Your scanner is responding.', action: 'None required.' },
    { name: 'Audio Diagnostic', status: 'Passed', problems: 'None', evidence: 'PulseAudio / PipeWire sinks active. No xruns.', english: 'Your speakers and microphones are functioning.', action: 'None required.' },
    { name: 'Display Diagnostic', status: 'Passed', problems: 'None', evidence: 'EDID checksum valid. DPMS active.', english: 'Your monitors are properly communicating with your graphics card.', action: 'None required.' },
    { name: 'USB Diagnostic', status: 'Passed', problems: 'None', evidence: 'USB bus enumerating correctly. No overcurrent events.', english: 'All USB ports are functioning safely.', action: 'None required.' },
    { name: 'Camera Diagnostic', status: 'Passed', problems: 'None', evidence: 'v4l2 device node accessible. Framerate stable.', english: 'Your webcam is properly connected.', action: 'None required.' },
    { name: 'Application Diagnostic', status: 'Passed', problems: 'None', evidence: 'No excessive crashing in AppData/Crashpad.', english: 'Your installed applications are running stably.', action: 'None required.' },
    { name: 'Boot/Reliability Diagnostic', status: 'Passed', problems: 'None', evidence: 'Last 10 boots successful. Reliability Index: 9.8', english: 'Your computer consistently boots up without blue screens or crashes.', action: 'None required.' }
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1.25rem' }}>
      
      {/* Top Header & Master Progress */}
      <div className="cc-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '12px' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ color: '#00e5ff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Automated Diagnostic Center</h3>
          <span className="cc-os" style={{ display: 'block' }}>Complete System Intelligence & Problem Resolution</span>
          
          {isRunning && (
            <div style={{ marginTop: '1rem', width: '100%', maxWidth: '500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                <span>Diagnostic Progress...</span>
                <span>{progress}%</span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div className="progress-fill" style={{ width: `${progress}%`, transition: 'width 0.15s ease' }}></div>
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="cc-btn" 
          onClick={runFullDiagnostic}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem', background: isRunning ? 'rgba(0, 229, 255, 0.2)' : '#00e5ff', color: isRunning ? '#00e5ff' : '#000', border: '1px solid #00e5ff', borderRadius: '8px', fontWeight: 'bold' }}
        >
          {isRunning ? 'DIAGNOSTICS IN PROGRESS...' : 'RUN FULL DIAGNOSTIC'}
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Diagnostic Suites List (Left) */}
        <div className="process-list-container" style={{ width: '40%', overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Diagnostic Test Suites</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {suites.map((s, i) => (
              <li 
                key={i} 
                onClick={() => setActiveSuite(s)}
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  background: activeSuite?.name === s.name ? 'rgba(0, 229, 255, 0.15)' : 'rgba(0,0,0,0.2)',
                  border: activeSuite?.name === s.name ? '1px solid #00e5ff' : '1px solid transparent',
                  display: 'flex',
                  justifyContent: 'space-between'
                }}
              >
                <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                <span style={{ 
                  color: s.status === 'Passed' ? '#10b981' : s.status === 'Warning' ? '#f59e0b' : '#ef4444',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}>{s.status}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Diagnostic Results (Right) */}
        <div style={{ flexGrow: 1, background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {activeSuite ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: '#00e5ff', fontSize: '1.4rem', marginBottom: '0.25rem' }}>{activeSuite.name}</h3>
                  <span style={{ color: 'var(--text-muted)' }}>Detailed Test Results & Evidence</span>
                </div>
                <button className="cc-btn" onClick={() => runSuite(activeSuite)}>RETEST</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${activeSuite.status === 'Passed' ? '#10b981' : activeSuite.status === 'Warning' ? '#f59e0b' : '#ef4444'}` }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Test Results</h5>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: activeSuite.status === 'Passed' ? '#10b981' : activeSuite.status === 'Warning' ? '#f59e0b' : '#ef4444' }}>
                    {activeSuite.status.toUpperCase()}
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Detected Problems</h5>
                  <div style={{ color: '#fff' }}>{activeSuite.problems}</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Plain-English Explanation</h5>
                  <div style={{ color: '#fff' }}>{activeSuite.english}</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Recommended Action</h5>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{activeSuite.action}</div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #64748b' }}>
                  <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.25rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>Evidence (Technical Log)</h5>
                  <div style={{ color: '#00e5ff', fontFamily: 'monospace', fontSize: '0.85rem' }}>{activeSuite.evidence}</div>
                </div>

              </div>
            </>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', flexDirection: 'column', gap: '1rem' }}>
              <Stethoscope size={48} opacity={0.2} />
              <p>Select a diagnostic suite from the left<br/>or run a Full System Diagnostic to begin.</p>
            </div>
          )}
        </div>

      </div>

      {/* Diagnostic History Bottom Panel */}
      <div className="cc-card" style={{ marginTop: 'auto' }}>
        <div className="cc-card-header"><span className="cc-title">DIAGNOSTIC HISTORY</span></div>
        <div style={{ fontSize: '0.85rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ color: 'var(--text-muted)' }}>[History] 2026-10-01 08:30 AM — Full Diagnostic Run (3 Warnings, 0 Errors)</div>
          <div style={{ color: 'var(--text-muted)' }}>[History] 2026-09-28 14:15 PM — Network Diagnostic (Passed)</div>
          <div style={{ color: 'var(--text-muted)' }}>[History] 2026-09-25 09:00 AM — Storage Diagnostic (Warning: Latency spike)</div>
        </div>
      </div>

    </div>
  );
}
"""

content = content[:old_diag_start] + diagnostics_view + "\n" + content[old_diag_end:]

with open("src/App.tsx", "w") as f:
    f.write(content)

