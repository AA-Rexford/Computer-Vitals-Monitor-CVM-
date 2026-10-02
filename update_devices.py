import re

with open("src/App.tsx", "r") as f:
    app_ts = f.read()

start_idx = app_ts.find("function DevicesView")
end_idx = app_ts.find("function selectedServiceStatusColor", start_idx)

new_devices = """
function DevicesView() {
  const [activeTab, setActiveTab] = useState('Overview');
  
  const tabs = ['Overview', 'Input', 'Audio', 'Imaging', 'Biometrics', 'Displays', 'USB', 'Bluetooth', 'Storage', 'Printers'];

  const panelStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' as const };
  const headerStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' };
  const itemStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const };
  const valStyle = { color: '#fff', fontSize: '0.9rem', fontWeight: 600 };

  const StatusBadge = ({ state }: { state: 'Connected' | 'Disconnected' | 'Enabled' | 'Disabled' | 'Error' | 'Ready' }) => {
    const colors = { Connected: '#10b981', Disconnected: '#64748b', Enabled: '#10b981', Disabled: '#64748b', Error: '#ef4444', Ready: '#10b981' };
    return <span style={{ color: colors[state] || '#fff', fontSize: '0.8rem', border: `1px solid ${colors[state] || '#fff'}`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{state}</span>;
  };

  const ActionButton = ({ label, danger }: { label: string, danger?: boolean }) => (
    <button className="cc-btn" style={{ 
      background: danger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.05)', 
      color: danger ? '#ef4444' : '#fff',
      border: danger ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)' 
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingRight: '1rem', gap: '1rem' }}>
      
      {/* HEADER & NAV */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>DEVICE MANAGER</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Peripherals, controllers, and externally connected equipment</span>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: activeTab === t ? 'rgba(0, 229, 255, 0.2)' : 'rgba(255,255,255,0.05)', border: activeTab === t ? '1px solid #00e5ff' : '1px solid transparent', color: activeTab === t ? '#00e5ff' : '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={panelStyle}>
              <div style={headerStyle}><span>Device Categories</span></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>Input Devices</span><span style={valStyle}>2 Connected</span></div>
                <div style={itemStyle}><span style={labelStyle}>Audio Hardware</span><span style={valStyle}>3 Available</span></div>
                <div style={itemStyle}><span style={labelStyle}>Imaging / Cameras</span><span style={valStyle}>1 WebCam</span></div>
                <div style={itemStyle}><span style={labelStyle}>Biometrics</span><span style={valStyle}>Fingerprint Sensor</span></div>
                <div style={itemStyle}><span style={labelStyle}>USB Tree</span><span style={valStyle}>12 Nodes</span></div>
                <div style={itemStyle}><span style={labelStyle}>Bluetooth</span><span style={valStyle}>Enabled</span></div>
              </div>
            </div>
            
            <div style={panelStyle}>
              <div style={headerStyle}><span>System Health</span></div>
              <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '8px', border: '1px dashed #10b981', textAlign: 'center' }}>
                 <strong>ALL DEVICES FUNCTIONING</strong><br/>
                 <span style={{ fontSize: '0.85rem' }}>No driver failures or disconnected required hardware.</span>
              </div>
            </div>
          </div>
        )}

        {/* INPUT DEVICES TAB */}
        {activeTab === 'Input' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Input Devices (Keyboard, Mouse, Controllers)</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Logitech MX Master 3</span><StatusBadge state="Connected" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>Mouse</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Manufacturer</span><span style={valStyle}>Logitech</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Connection</span><span style={valStyle}>Bluetooth Low Energy</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>logi_input.sys</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Disable" danger />
                   <ActionButton label="Configure OS Settings" />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIO DEVICES TAB */}
        {activeTab === 'Audio' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Audio Devices</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Realtek High Definition Audio</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>Internal Speakers / Out</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Default Device</span><span style={{...valStyle, color: '#10b981'}}>Yes</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>rtkvhd64.sys</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Capabilities</span><span style={valStyle}>24-bit, 48000 Hz</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* IMAGING & CAMERA TAB */}
        {activeTab === 'Imaging' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Cameras & Scanners</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Integrated HD Webcam</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Manufacturer</span><span style={valStyle}>Generic</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Connection</span><span style={valStyle}>Internal USB 2.0</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Resolutions</span><span style={valStyle}>720p / 1080p @ 30fps</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Test Device" />
                   <ActionButton label="Disable Camera" danger />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* BIOMETRICS TAB */}
        {activeTab === 'Biometrics' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Biometric Hardware</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Goodix Fingerprint Sensor</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Framework</span><span style={valStyle}>Windows Hello / PAM</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Driver Status</span><span style={valStyle}>Loaded</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Data Policy</span><span style={{...valStyle, color: '#f59e0b'}}>Data NOT Exposed</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* DISPLAYS TAB */}
        {activeTab === 'Displays' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Connected Displays</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Dell UltraSharp U2720Q</span><StatusBadge state="Connected" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Resolution</span><span style={valStyle}>3840 x 2160</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Refresh Rate</span><span style={valStyle}>60 Hz</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Connection</span><span style={valStyle}>DisplayPort</span></div>
                   <div style={itemStyle}><span style={labelStyle}>HDR Capability</span><span style={valStyle}>Supported (HDR400)</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* USB TAB */}
        {activeTab === 'USB' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>USB Devices</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>USB Root Hub (USB 3.0)</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Vendor ID / Product ID</span><span style={valStyle}>8086:43ED</span></div>
                   <div style={itemStyle}><span style={labelStyle}>USB Version</span><span style={valStyle}>3.2 Gen 2</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>usbhub3.sys</span></div>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* BLUETOOTH TAB */}
        {activeTab === 'Bluetooth' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Bluetooth Devices</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>AirPods Pro</span><StatusBadge state="Disconnected" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>MAC Address</span><span style={valStyle}>XX:XX:XX:XX:XX:XX</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Services</span><span style={valStyle}>Audio Sink, AVRCP</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Connect" />
                   <ActionButton label="Unpair" danger />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* STORAGE TAB */}
        {activeTab === 'Storage' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>External Storage</span></div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                <h4 style={{ color: '#f59e0b', margin: '0 0 0.5rem 0' }}>Privileged Destructive Operations Warning</h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Formatting or destructive partition changes require explicit device identification, selection, and multi-stage confirmation.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>Samsung Portable SSD T7</span><StatusBadge state="Connected" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Mount Point</span><span style={valStyle}>/media/usb0</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Filesystem</span><span style={valStyle}>exFAT</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Capacity</span><span style={valStyle}>1.0 TB</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Safely Remove / Eject" />
                   <ActionButton label="Format Device..." danger />
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* PRINTERS TAB */}
        {activeTab === 'Printers' && (
          <div style={panelStyle}>
            <div style={headerStyle}><span>Printers & Scanners</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                 <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}><span>HP LaserJet Pro M404</span><StatusBadge state="Ready" /></div>
                 <div style={gridStyle}>
                   <div style={itemStyle}><span style={labelStyle}>Connection</span><span style={valStyle}>Network (192.168.1.150)</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Queue State</span><span style={valStyle}>Idle (0 Jobs)</span></div>
                   <div style={itemStyle}><span style={labelStyle}>Toner / Ink</span><span style={valStyle}>65% Remaining</span></div>
                 </div>
                 <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                   <ActionButton label="Print Test Page" />
                   <ActionButton label="Clear Queue" danger />
                 </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
"""

app_ts = app_ts[:start_idx] + new_devices + "\n" + app_ts[end_idx:]

with open("src/App.tsx", "w") as f:
    f.write(app_ts)

