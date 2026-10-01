import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Update activeTab state
content = content.replace("useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network'>", "useState<'dashboard' | 'diagnostics' | 'system' | 'tasks' | 'hardware' | 'services' | 'storage' | 'network' | 'devices'>")

# 2. Add Devices tab to sidebar
nav_regex = r'(<button className={`nav-item \$\{activeTab === "network" \? "active" : ""\}`} onClick=\{\(\) => setActiveTab\("network"\)\}>\n\s*<Network size=\{18\} /> <span className="nav-text">Network</span>\n\s*</button>)'
new_nav = r'\1\n          <button className={`nav-item ${activeTab === "devices" ? "active" : ""}`} onClick={() => setActiveTab("devices")}>\n            <MonitorSmartphone size={18} /> <span className="nav-text">Devices</span>\n          </button>'
content = re.sub(nav_regex, new_nav, content)

# 3. Add MonitorSmartphone icon import
if "MonitorSmartphone" not in content[:content.find("from")]:
    content = content.replace("SquareTerminal,", "SquareTerminal, MonitorSmartphone,")

# 4. Create DevicesView component
devices_view = """
function DevicesView() {
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [activeDiagnostic, setActiveDiagnostic] = useState<string | null>(null);

  const runDiagnostic = (action: string) => {
    setActiveDiagnostic(action);
    setTimeout(() => setActiveDiagnostic(null), 2500);
  };

  const devicesList = [
    { type: 'Display', category: 'Displays / Monitors', name: 'LG UltraGear 27"', manufacturer: 'LG Electronics', id: 'MON-LG-8291', status: 'Connected', driver: 'NVIDIA Display Driver 535.x', errors: 'None' },
    { type: 'Keyboard', category: 'Keyboards & Mice', name: 'Keychron Q1 Pro', manufacturer: 'Keychron', id: 'USB-HID-045E', status: 'Connected', driver: 'usbhid', errors: 'None' },
    { type: 'Mouse', category: 'Keyboards & Mice', name: 'Logitech MX Master 3', manufacturer: 'Logitech', id: 'BT-HID-LOGI', status: 'Connected (Bluetooth)', driver: 'logi_dj_receiver', errors: 'None' },
    { type: 'Camera', category: 'Cameras & Imaging', name: 'Logitech Brio 4K', manufacturer: 'Logitech', id: 'USB-VID-046D', status: 'Standby', driver: 'uvcvideo', errors: 'None' },
    { type: 'Microphone', category: 'Audio Devices', name: 'Blue Yeti Nano', manufacturer: 'Blue Microphones', id: 'USB-AUDIO-194F', status: 'Connected', driver: 'snd-usb-audio', errors: 'None' },
    { type: 'Speaker', category: 'Audio Devices', name: 'Focusrite Scarlett 2i2', manufacturer: 'Focusrite', id: 'USB-AUDIO-123A', status: 'Connected', driver: 'snd-usb-audio', errors: 'None' },
    { type: 'Printer', category: 'Printers & Scanners', name: 'HP LaserJet Pro MFP', manufacturer: 'HP', id: 'NET-PRN-HP', status: 'Offline', driver: 'HPLIP', errors: 'Printer is offline or sleeping.' },
    { type: 'Scanner', category: 'Printers & Scanners', name: 'Epson Perfection V39', manufacturer: 'Epson', id: 'USB-SCN-EPS', status: 'Disconnected', driver: 'sane-epson2', errors: 'Device not found.' },
    { type: 'Biometric', category: 'Biometric Peripherals', name: 'Goodix Fingerprint Reader', manufacturer: 'Goodix', id: 'USB-BIO-027C', status: 'Connected', driver: 'libfprint', errors: 'None' },
    { type: 'Bluetooth', category: 'Bluetooth Devices', name: 'Sony WH-1000XM4', manufacturer: 'Sony', id: 'BT-MAC-SO:NY', status: 'Disconnected', driver: 'bluez', errors: 'None' },
    { type: 'External Drive', category: 'External Drives', name: 'Samsung T7 Shield 2TB', manufacturer: 'Samsung', id: 'USB-STR-SAMS', status: 'Connected', driver: 'uas', errors: 'None' },
    { type: 'UPS', category: 'UPS Devices', name: 'APC Back-UPS Pro 1500', manufacturer: 'APC', id: 'USB-UPS-APC', status: 'Connected', driver: 'usbhid-ups', errors: 'None' },
    { type: 'Barcode Scanner', category: 'Card Readers / Scanners', name: 'Symbol LS2208', manufacturer: 'Zebra', id: 'USB-HID-ZEB', status: 'Disconnected', driver: 'usbhid', errors: 'Device unplugged.' },
    { type: 'Card Reader', category: 'Card Readers / Scanners', name: 'Realtek PCIE CardReader', manufacturer: 'Realtek', id: 'PCI-CR-RTL', status: 'Connected', driver: 'rtsx_pci', errors: 'None' }
  ];

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="cc-identity" style={{ flex: 1, minWidth: '300px' }}>
          <h3>Device Manager</h3>
          <span className="cc-os">Peripherals, USB, Audio & Displays</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* Device List (Left) */}
        <div className="process-list-container" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ position: 'sticky', top: '-1rem', background: 'var(--bg-panel)', zIndex: 10 }}>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.5rem' }}>Device Name</th>
                <th style={{ padding: '0.5rem' }}>Type / Category</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {devicesList.map((d, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedDevice(d)}
                  style={{ 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    cursor: 'pointer',
                    background: selectedDevice?.id === d.id ? 'rgba(0, 229, 255, 0.1)' : 'transparent'
                  }}>
                  <td style={{ padding: '0.6rem 0.5rem', fontWeight: 'bold' }}>{d.name}</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: 'var(--text-muted)' }}>{d.category} ({d.type})</td>
                  <td style={{ padding: '0.6rem 0.5rem', color: d.status.includes('Connected') || d.status === 'Standby' ? '#10b981' : 'var(--text-muted)' }}>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Device Details (Right) */}
        {selectedDevice && (
          <div style={{ width: '380px', background: 'var(--bg-panel)', borderRadius: '12px', padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '1px solid #00e5ff' }}>
            <div>
              <h4 style={{ color: '#00e5ff', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedDevice.name}</h4>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedDevice.category}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Manufacturer:</span>
                <span>{selectedDevice.manufacturer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Device Model:</span>
                <span>{selectedDevice.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Device ID (Hardware):</span>
                <span>{selectedDevice.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Connection Status:</span>
                <span style={{ color: selectedServiceStatusColor(selectedDevice.status), fontWeight: 'bold' }}>{selectedDevice.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Active Driver:</span>
                <span>{selectedDevice.driver}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Device Errors:</span>
                <span style={{ color: selectedDevice.errors === 'None' ? '#10b981' : '#ef4444' }}>{selectedDevice.errors}</span>
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Device Details & History</h5>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                [History] Last connected: 2 hours ago<br/>
                [History] Firmware version: 1.04.12<br/>
                [Details] Interface: {selectedDevice.id.includes('USB') ? 'USB 3.0 (5Gbps)' : selectedDevice.id.includes('BT') ? 'Bluetooth 5.2' : 'PCIe / Network'}
              </div>
            </div>

            <div>
              <h5 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Device Diagnostics</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <button 
                  className="cc-btn" 
                  style={{ flexGrow: 1, background: activeDiagnostic === 'Ping/Wake' ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)', color: activeDiagnostic === 'Ping/Wake' ? '#fff' : 'var(--text-muted)', border: activeDiagnostic === 'Ping/Wake' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => runDiagnostic('Ping/Wake')}
                >
                  {activeDiagnostic === 'Ping/Wake' ? 'WAKING...' : 'Ping / Wake'}
                </button>
                <button 
                  className="cc-btn" 
                  style={{ flexGrow: 1, background: activeDiagnostic === 'Driver Reload' ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)', color: activeDiagnostic === 'Driver Reload' ? '#fff' : 'var(--text-muted)', border: activeDiagnostic === 'Driver Reload' ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.1)' }}
                  onClick={() => runDiagnostic('Driver Reload')}
                >
                  {activeDiagnostic === 'Driver Reload' ? 'RELOADING...' : 'Reload Driver'}
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  className="cc-btn" 
                  style={{ flexGrow: 1, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981' }} 
                  onClick={() => runDiagnostic('Enable')}
                >
                  ENABLE DEVICE
                </button>
                <button 
                  className="cc-btn" 
                  style={{ flexGrow: 1, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#ef4444' }} 
                  onClick={() => runDiagnostic('Disable')}
                >
                  DISABLE DEVICE
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function selectedServiceStatusColor(status: string) {
  if (status.includes('Connected') || status === 'Standby') return '#10b981';
  return 'var(--text-muted)';
}
"""

content = content.replace("function App() {", devices_view + "\nfunction App() {")

# Render DevicesView based on activeTab
content = content.replace("{activeTab === 'network' && <NetworkView vitals={vitals} history={history} />}", "{activeTab === 'network' && <NetworkView vitals={vitals} history={history} />}\n        {activeTab === 'devices' && <DevicesView />}")

with open("src/App.tsx", "w") as f:
    f.write(content)

