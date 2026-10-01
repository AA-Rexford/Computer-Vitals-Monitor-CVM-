import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Update SystemInfoData interface
if "manufacturer: string;" not in content:
    content = content.replace("vram: string;", "vram: string;\n  manufacturer: string;\n  model: string;\n  serial_number: string;\n  bios_version: string;\n  motherboard: string;\n  display_info: string;\n  installed_drivers: string;\n  boot_info: string;")

# Rebuild SystemInfoView
sysinfo_start = content.find("function SystemInfoView")
sysinfo_end = content.find("function TaskManagerView", sysinfo_start)
if sysinfo_end == -1:
    sysinfo_end = content.find("function App()", sysinfo_start)

sysinfo_code = """function SystemInfoView({ vitals }: { vitals: SystemVitals | null }) {
  if (!vitals) return <div className="loading" style={{padding: '2rem'}}>Initializing System Info...</div>;
  const sys = vitals.sys_info;

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vitals.sys_info, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "system_info_export.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="system-info" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingRight: '1rem', gap: '1.25rem' }}>
      <div className="cc-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="cc-identity">
          <h3>System Information</h3>
          <span className="cc-os">Hardware & OS DNA</span>
        </div>
        <button className="cc-btn primary" onClick={handleExport}>EXPORT SYSTEM INFO</button>
      </div>

      <div className="cc-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Core Identity */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">HARDWARE IDENTITY</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">Computer Manufacturer</td><td className="info-val">{sys.manufacturer}</td></tr>
              <tr><td className="info-label">Computer Model</td><td className="info-val">{sys.model}</td></tr>
              <tr><td className="info-label">Serial Number</td><td className="info-val" style={{color: '#f59e0b'}}>{sys.serial_number}</td></tr>
              <tr><td className="info-label">Hostname</td><td className="info-val">{sys.host_name}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Operating System */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">OPERATING SYSTEM</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">Operating System</td><td className="info-val">{sys.name}</td></tr>
              <tr><td className="info-label">OS Version</td><td className="info-val">{sys.os_version}</td></tr>
              <tr><td className="info-label">OS Build (Long)</td><td className="info-val">{sys.long_os_version}</td></tr>
              <tr><td className="info-label">Kernel</td><td className="info-val">{sys.kernel_version}</td></tr>
              <tr><td className="info-label">Architecture</td><td className="info-val">{sys.cpu_arch}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Processing & Motherboard */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">PROCESSOR & BOARD</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">CPU Information</td><td className="info-val">{sys.cpu_vendor} {sys.cpu_brand} ({sys.cpu_cores} Cores / {sys.cpu_logical_cores} Threads)</td></tr>
              <tr><td className="info-label">CPU Frequency</td><td className="info-val">{sys.cpu_frequency} MHz</td></tr>
              <tr><td className="info-label">Motherboard Info</td><td className="info-val">{sys.motherboard}</td></tr>
              <tr><td className="info-label">BIOS/UEFI Info</td><td className="info-val">{sys.bios_version}</td></tr>
              <tr><td className="info-label">Boot Information</td><td className="info-val">{sys.boot_info}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Memory & Graphics */}
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">MEMORY & GRAPHICS</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">RAM Information</td><td className="info-val">{formatBytes(sys.ram_total)} Total (Swap: {formatBytes(sys.swap_total)})</td></tr>
              <tr><td className="info-label">RAM Modules</td><td className="info-val">Standard DIMM/SODIMM (Auto-detected)</td></tr>
              <tr><td className="info-label">GPU Information</td><td className="info-val">{sys.gpu_name} ({sys.vram} VRAM)</td></tr>
              <tr><td className="info-label">Display Information</td><td className="info-val">{sys.display_info}</td></tr>
              <tr><td className="info-label">Installed Drivers</td><td className="info-val">{sys.installed_drivers}</td></tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* System Identifiers / Config */}
      <div className="cc-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="cc-card">
          <div className="cc-card-header"><span className="cc-title">SYSTEM CONFIGURATION & IDENTIFIERS</span></div>
          <table className="info-table">
            <tbody>
              <tr><td className="info-label">System Configuration</td><td className="info-val">Standard ACPI / UEFI Compliant Node</td></tr>
              <tr><td className="info-label">Network MAC Addresses</td><td className="info-val">
                {sys.mac_addresses.map((mac, i) => (
                  <div key={i} style={{fontFamily: 'monospace', color: '#00e5ff'}}>{mac}</div>
                ))}
              </td></tr>
              <tr><td className="info-label">Distribution ID</td><td className="info-val">{sys.distribution_id}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
"""

if content.startswith("}function", sysinfo_start-1):
    content = content[:sysinfo_start] + sysinfo_code + "\n" + content[sysinfo_end:]
else:
    content = content[:sysinfo_start] + sysinfo_code + "\n" + content[sysinfo_end:]

with open("src/App.tsx", "w") as f:
    f.write(content)

