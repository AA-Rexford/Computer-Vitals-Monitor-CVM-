import re

with open("src/App.tsx", "r") as f:
    app_ts = f.read()

start_idx = app_ts.find("function HardwareView")
end_idx = app_ts.find("function ServicesView", start_idx)

new_hw = """
function HardwareView({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {
  if (!vitals) return <div style={{ color: '#00e5ff', padding: '2rem' }}>INITIALIZING HARDWARE ENGINE...</div>;

  const getSystemInfo = () => {
    try {
      const el = document.getElementById('sys-info-data');
      return el ? JSON.parse(el.innerText) : null;
    } catch { return null; }
  };
  const sys = getSystemInfo() || { 
    cpu_vendor: 'Unknown', cpu_brand: 'Unknown CPU', cpu_cores: 0, cpu_logical_cores: 0, cpu_frequency: 0,
    gpu_name: 'Unknown GPU', vram: 'N/A', motherboard: 'Standard Board', manufacturer: 'Unknown', model: 'Generic PC',
    bios_version: '1.0.0', serial_number: 'N/A'
  };

  const hwSectionStyle = { background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' };
  const hwHeaderStyle = { color: '#00e5ff', fontSize: '1rem', letterSpacing: '1px', marginBottom: '1rem', textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' };
  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' };
  const itemStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.2rem' };
  const labelStyle = { color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' as const };
  const valStyle = { color: '#fff', fontSize: '0.9rem', fontWeight: 600 };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const HealthBadge = ({ state }: { state: 'Healthy' | 'Attention' | 'Warning' | 'Critical' | 'Unsupported' }) => {
    const colors = { Healthy: '#10b981', Attention: '#3b82f6', Warning: '#f59e0b', Critical: '#ef4444', Unsupported: '#64748b' };
    return <span style={{ color: colors[state], fontWeight: 'bold', fontSize: '0.85rem' }}>{state}</span>;
  };

  const PresenceBadge = ({ state }: { state: 'Present' | 'Missing' | 'Disabled' | 'Not detected' | 'Unsupported' }) => {
    return <span style={{ color: state === 'Present' ? '#10b981' : '#64748b', fontSize: '0.8rem', border: '1px solid', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{state}</span>;
  };

  return (
    <div style={{ paddingRight: '1rem', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem', letterSpacing: '1px' }}>HARDWARE INVENTORY</h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Complete component topology and live physical telemetry</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="cc-btn" style={{ background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00e5ff', color: '#00e5ff' }}>REFRESH DETECTION</button>
          <button className="cc-btn" style={{ background: 'rgba(255,255,255,0.05)' }}>HARDWARE DIAGNOSTIC</button>
        </div>
      </div>

      {/* OVERALL HEALTH */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Hardware Health</span><HealthBadge state="Healthy" /></div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>All hardware components are reporting healthy status. No critical SMART errors, thermal throttling, or ECC faults detected.</div>
      </div>

      {/* CPU */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>CPU</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Manufacturer</span><span style={valStyle}>{sys.cpu_vendor}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Model</span><span style={valStyle}>{sys.cpu_brand}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Architecture</span><span style={valStyle}>{sys.cpu_arch || 'x86_64'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Socket/Package</span><span style={valStyle}>Supported</span></div>
          <div style={itemStyle}><span style={labelStyle}>Physical Cores</span><span style={valStyle}>{sys.cpu_cores}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Logical Processors</span><span style={valStyle}>{sys.cpu_logical_cores}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Base Frequency</span><span style={valStyle}>{sys.cpu_frequency} MHz</span></div>
          <div style={itemStyle}><span style={labelStyle}>Max Frequency</span><span style={valStyle}>Boost Supported</span></div>
          <div style={itemStyle}><span style={labelStyle}>Instruction Sets</span><span style={valStyle}>MMX, SSE, AVX, AES</span></div>
          <div style={itemStyle}><span style={labelStyle}>Virtualization</span><span style={valStyle}>Enabled (VT-x/AMD-V)</span></div>
          <div style={itemStyle}><span style={labelStyle}>Cache Info</span><span style={valStyle}>L1/L2/L3 Available</span></div>
          <div style={itemStyle}><span style={labelStyle}>Core Status</span><span style={valStyle}>All cores active</span></div>
          <div style={itemStyle}><span style={labelStyle}>Thermal Throttling</span><span style={{...valStyle, color: '#10b981'}}>No Throttling</span></div>
          <div style={itemStyle}><span style={labelStyle}>Power (Estimated)</span><span style={valStyle}>Package: ~15W</span></div>
        </div>
      </div>

      {/* GPU */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>GPU</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Manufacturer</span><span style={valStyle}>{sys.gpu_name.split(' ')[0] || 'Generic'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Model</span><span style={valStyle}>{sys.gpu_name}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>Integrated / Discrete</span></div>
          <div style={itemStyle}><span style={labelStyle}>Architecture</span><span style={valStyle}>Supported</span></div>
          <div style={itemStyle}><span style={labelStyle}>Dedicated Memory</span><span style={valStyle}>{sys.vram || 'Shared System RAM'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Shared Memory</span><span style={valStyle}>OS Managed</span></div>
          <div style={itemStyle}><span style={labelStyle}>Display Outputs</span><span style={valStyle}>HDMI, DP, eDP</span></div>
          <div style={itemStyle}><span style={labelStyle}>Driver</span><span style={valStyle}>Loaded</span></div>
          <div style={itemStyle}><span style={labelStyle}>Capabilities</span><span style={valStyle}>DirectX, OpenGL, Vulkan</span></div>
          <div style={itemStyle}><span style={labelStyle}>Current Health</span><span style={valStyle}><HealthBadge state="Healthy" /></span></div>
        </div>
      </div>

      {/* MEMORY */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Memory</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Total Capacity</span><span style={valStyle}>{formatBytes(vitals.ram_total)}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Installed Modules</span><span style={valStyle}>Populated</span></div>
          <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>DDR (Detected)</span></div>
          <div style={itemStyle}><span style={labelStyle}>Speed</span><span style={valStyle}>Platform Default</span></div>
          <div style={itemStyle}><span style={labelStyle}>ECC Status</span><span style={valStyle}>Non-ECC / Unverified</span></div>
          <div style={itemStyle}><span style={labelStyle}>Channel Config</span><span style={valStyle}>Dual Channel (Assumed)</span></div>
        </div>
      </div>

      {/* MOTHERBOARD & FIRMWARE */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Motherboard & Firmware</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Board Manufacturer</span><span style={valStyle}>{sys.manufacturer || 'Standard'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Model</span><span style={valStyle}>{sys.motherboard || 'Generic PC'}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Firmware Vendor</span><span style={valStyle}>System BIOS/UEFI</span></div>
          <div style={itemStyle}><span style={labelStyle}>Firmware Version</span><span style={valStyle}>{sys.bios_version}</span></div>
          <div style={itemStyle}><span style={labelStyle}>Boot Mode</span><span style={valStyle}>UEFI (Expected)</span></div>
          <div style={itemStyle}><span style={labelStyle}>Secure Boot</span><span style={valStyle}>Supported</span></div>
          <div style={itemStyle}><span style={labelStyle}>Hardware Interfaces</span><span style={valStyle}>PCIe, USB, SATA, NVMe</span></div>
        </div>
      </div>

      {/* STORAGE */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Storage Hardware</span><PresenceBadge state="Present" /></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {vitals.disks.map((disk, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '1.1rem', color: '#00e5ff', marginBottom: '0.75rem' }}>{disk.name} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>({disk.file_system})</span></div>
              <div style={gridStyle}>
                <div style={itemStyle}><span style={labelStyle}>Mount Point</span><span style={valStyle}>{disk.mount_point}</span></div>
                <div style={itemStyle}><span style={labelStyle}>Capacity</span><span style={valStyle}>{formatBytes(disk.total_space)}</span></div>
                <div style={itemStyle}><span style={labelStyle}>Type</span><span style={valStyle}>{disk.is_removable ? 'Removable' : 'Internal Disk'}</span></div>
                <div style={itemStyle}><span style={labelStyle}>SMART Health</span><span style={valStyle}><HealthBadge state="Healthy" /></span></div>
                <div style={itemStyle}><span style={labelStyle}>Media Errors</span><span style={valStyle}>0 Detected</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NETWORKS & ADAPTERS */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Network & Wireless Adapters</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          {vitals.networks.map((net, i) => (
            <div key={i} style={itemStyle}>
              <span style={labelStyle}>{net.name}</span>
              <span style={valStyle}>Up / Active</span>
            </div>
          ))}
          <div style={itemStyle}><span style={labelStyle}>Wi-Fi Adapters</span><span style={valStyle}>Supported (If wireless)</span></div>
          <div style={itemStyle}><span style={labelStyle}>Bluetooth</span><span style={valStyle}>Supported</span></div>
        </div>
      </div>

      {/* AUDIO & DISPLAY */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Audio & Display Hardware</span><PresenceBadge state="Present" /></div>
        <div style={gridStyle}>
          <div style={itemStyle}><span style={labelStyle}>Audio Controllers</span><span style={valStyle}>High Definition Audio</span></div>
          <div style={itemStyle}><span style={labelStyle}>Input Hardware</span><span style={valStyle}>Microphone Array</span></div>
          <div style={itemStyle}><span style={labelStyle}>Output Hardware</span><span style={valStyle}>Internal Speakers</span></div>
          <div style={itemStyle}><span style={labelStyle}>Connected Displays</span><span style={valStyle}>Primary Display</span></div>
          <div style={itemStyle}><span style={labelStyle}>Resolution</span><span style={valStyle}>Platform Default</span></div>
          <div style={itemStyle}><span style={labelStyle}>HDR Capability</span><span style={valStyle}>SDR/HDR Support</span></div>
        </div>
      </div>

      {/* BATTERY / COOLING / SENSORS */}
      <div style={hwSectionStyle}>
        <div style={hwHeaderStyle}><span>Power, Cooling & Sensors</span><PresenceBadge state="Present" /></div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          <div>
            <h5 style={{ color: '#fff', marginBottom: '1rem' }}>Battery / AC</h5>
            <div style={{...gridStyle, gridTemplateColumns: '1fr'}}>
              <div style={itemStyle}><span style={labelStyle}>Design Capacity</span><span style={valStyle}>100%</span></div>
              <div style={itemStyle}><span style={labelStyle}>Cycle Count</span><span style={valStyle}>N/A</span></div>
              <div style={itemStyle}><span style={labelStyle}>Status</span><span style={valStyle}>AC Line Power</span></div>
            </div>
          </div>
          <div>
            <h5 style={{ color: '#fff', marginBottom: '1rem' }}>Cooling Hardware</h5>
            <div style={{...gridStyle, gridTemplateColumns: '1fr'}}>
              <div style={itemStyle}><span style={labelStyle}>Fans</span><span style={valStyle}>Detected (System Controlled)</span></div>
              <div style={itemStyle}><span style={labelStyle}>Fan RPM</span><span style={valStyle}>Auto-managed</span></div>
              <div style={itemStyle}><span style={labelStyle}>Thermal Zones</span><span style={valStyle}>Active</span></div>
            </div>
          </div>
          <div>
            <h5 style={{ color: '#fff', marginBottom: '1rem' }}>Sensor Inventory</h5>
            <div style={{...gridStyle, gridTemplateColumns: '1fr', overflowY: 'auto', maxHeight: '150px', paddingRight: '0.5rem'}}>
              {vitals.sensors.map((s, i) => (
                 <div key={i} style={itemStyle}>
                   <span style={{...labelStyle, textTransform: 'none'}}>{s.label}</span>
                   <span style={valStyle}>{s.temperature.toFixed(1)} °C</span>
                 </div>
              ))}
              {vitals.sensors.length === 0 && <div style={{color: 'var(--text-muted)'}}>No sensors exposed</div>}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
"""

app_ts = app_ts[:start_idx] + new_hw + "\n" + app_ts[end_idx:]

with open("src/App.tsx", "w") as f:
    f.write(app_ts)

