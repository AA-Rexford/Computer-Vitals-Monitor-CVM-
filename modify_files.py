import os

def process_lib():
    with open("src-tauri/src/lib.rs", "r") as f:
        content = f.read()
    
    # 1. Update SystemInfoData struct
    old_struct = """#[derive(Serialize, Clone)]
struct SystemInfoData {
    name: String,
    long_os_version: String,
    kernel_version: String,
    os_version: String,
    distribution_id: String,
    host_name: String,
    uptime: u64,
    boot_time: u64,
    cpu_arch: String,
    cpu_brand: String,
    cpu_vendor: String,
    cpu_frequency: u64,
    cpu_cores: usize,
    cpu_logical_cores: usize,
    ram_total: u64,
    ram_free: u64,
    ram_available: u64,
    swap_total: u64,
    swap_free: u64,
    gpu_name: String,
}"""
    
    new_struct = """#[derive(Serialize, Clone)]
struct SystemInfoData {
    name: String,
    long_os_version: String,
    kernel_version: String,
    os_version: String,
    distribution_id: String,
    host_name: String,
    cpu_arch: String,
    cpu_brand: String,
    cpu_vendor: String,
    cpu_frequency: u64,
    cpu_cores: usize,
    cpu_logical_cores: usize,
    ram_total: u64,
    swap_total: u64,
    gpu_name: String,
    vram: String,
    mac_addresses: Vec<String>,
}"""

    content = content.replace(old_struct, new_struct)
    
    # 2. Update get_gpu_info to also return VRAM. We'll add get_vram_info()
    vram_fn = """fn get_vram_info() -> String {
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = std::process::Command::new("lspci").args(&["-v"]).output() {
            let out = String::from_utf8_lossy(&output.stdout);
            for line in out.lines() {
                if line.contains("Memory at") && line.contains("size=") {
                    // Try to find the prefetchable memory size (often VRAM)
                    if line.contains("prefetchable") {
                        if let Some(idx) = line.find("size=") {
                            let end_idx = line[idx+5..].find(']').map(|i| i + idx + 5).unwrap_or(line.len());
                            return line[idx+5..end_idx].to_string();
                        }
                    }
                }
            }
        }
        "Unavailable".to_string()
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = std::process::Command::new("wmic").args(&["path", "win32_VideoController", "get", "AdapterRAM"]).output() {
            let out = String::from_utf8_lossy(&output.stdout);
            let mut lines = out.lines().filter(|l| !l.trim().is_empty());
            lines.next();
            if let Some(ram_str) = lines.next() {
                if let Ok(bytes) = ram_str.trim().parse::<u64>() {
                    return format!("{} MB", bytes / 1024 / 1024);
                }
            }
        }
        "Unavailable".to_string()
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        "Unavailable".to_string()
    }
}
"""
    content = content.replace("#[tauri::command]", vram_fn + "\n#[tauri::command]")
    
    # 3. Add mac addresses parsing inside get_system_vitals
    mac_logic = """
    let mut mac_addresses = Vec::new();
    for (name, data) in networks.iter() {
        let n = name.to_lowercase();
        if !n.starts_with("veth") && !n.starts_with("docker") && !n.starts_with("br-") && n != "lo" {
            let mac = data.mac_address();
            let mac_str = format!("{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
            mac_addresses.push(format!("{} ({})", name, mac_str));
        }
    }
"""
    
    content = content.replace("let sys_info = SystemInfoData {", mac_logic + "\n    let sys_info = SystemInfoData {")
    
    # 4. Update struct initialization
    old_init = """    let sys_info = SystemInfoData {
        name: System::name().unwrap_or_else(|| "Unavailable".to_string()),
        long_os_version: System::long_os_version().unwrap_or_else(|| "Unavailable".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "Unavailable".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unavailable".to_string()),
        distribution_id: System::distribution_id(),
        host_name: System::host_name().unwrap_or_else(|| "Unavailable".to_string()),
        uptime: System::uptime(),
        boot_time: System::boot_time(),
        cpu_arch: System::cpu_arch(),
        cpu_brand: sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or_else(|| "Unavailable".to_string()),
        cpu_vendor: sys.cpus().first().map(|c| c.vendor_id().to_string()).unwrap_or_else(|| "Unavailable".to_string()),
        cpu_frequency: sys.cpus().first().map(|c| c.frequency()).unwrap_or(0),
        cpu_cores: System::physical_core_count().unwrap_or(0),
        cpu_logical_cores: sys.cpus().len(),
        ram_total: sys.total_memory(),
        ram_free: sys.free_memory(),
        ram_available: sys.available_memory(),
        swap_total: sys.total_swap(),
        swap_free: sys.free_swap(),
        gpu_name: get_gpu_info(),
    };"""

    new_init = """    let sys_info = SystemInfoData {
        name: System::name().unwrap_or_else(|| "Unavailable".to_string()),
        long_os_version: System::long_os_version().unwrap_or_else(|| "Unavailable".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "Unavailable".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unavailable".to_string()),
        distribution_id: System::distribution_id(),
        host_name: System::host_name().unwrap_or_else(|| "Unavailable".to_string()),
        cpu_arch: System::cpu_arch(),
        cpu_brand: sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or_else(|| "Unavailable".to_string()),
        cpu_vendor: sys.cpus().first().map(|c| c.vendor_id().to_string()).unwrap_or_else(|| "Unavailable".to_string()),
        cpu_frequency: sys.cpus().first().map(|c| c.frequency()).unwrap_or(0),
        cpu_cores: System::physical_core_count().unwrap_or(0),
        cpu_logical_cores: sys.cpus().len(),
        ram_total: sys.total_memory(),
        swap_total: sys.total_swap(),
        gpu_name: get_gpu_info(),
        vram: get_vram_info(),
        mac_addresses,
    };"""
    content = content.replace(old_init, new_init)
    
    with open("src-tauri/src/lib.rs", "w") as f:
        f.write(content)


def process_tsx():
    with open("src/App.tsx", "r") as f:
        content = f.read()

    # 1. Update interface
    old_ts_struct = """interface SystemInfoData { 
  name: string; long_os_version: string; kernel_version: string; os_version: string; distribution_id: string; host_name: string; uptime: number; boot_time: number;
  cpu_arch: string; cpu_brand: string; cpu_vendor: string; cpu_frequency: number; cpu_cores: number; cpu_logical_cores: number; 
  ram_total: number; ram_free: number; ram_available: number; swap_total: number; swap_free: number; gpu_name: string;
}"""
    new_ts_struct = """interface SystemInfoData { 
  name: string; long_os_version: string; kernel_version: string; os_version: string; distribution_id: string; host_name: string;
  cpu_arch: string; cpu_brand: string; cpu_vendor: string; cpu_frequency: number; cpu_cores: number; cpu_logical_cores: number; 
  ram_total: number; swap_total: number; gpu_name: string; vram: string; mac_addresses: string[];
}"""
    content = content.replace(old_ts_struct, new_ts_struct)
    
    # 2. Update view
    old_view = """function SystemInfoView({ vitals }: { vitals: SystemVitals | null }) {
  if (!vitals) return <p>Loading...</p>;
  const info = vitals.sys_info;
  
  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600*24));
    const h = Math.floor(seconds % (3600*24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    return `${d}d ${h}h ${m}m`;
  };

  const bootDate = new Date(Date.now() - info.uptime * 1000).toLocaleString();

  return (
    <div className="sysinfo-view">
      <div className="sysinfo-grid">
        <div className="panel sys-panel">
          <div className="panel-header">
            <Info className="panel-icon" />
            <h2>Operating System</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Host Name</span><span className="prop-value">{info.host_name}</span></div>
            <div className="sys-prop"><span className="prop-label">OS</span><span className="prop-value">{info.long_os_version}</span></div>
            <div className="sys-prop"><span className="prop-label">Distribution</span><span className="prop-value">{info.distribution_id || 'Unavailable'}</span></div>
            <div className="sys-prop"><span className="prop-label">Kernel</span><span className="prop-value">{info.kernel_version}</span></div>
            <div className="sys-prop"><span className="prop-label">Boot Time</span><span className="prop-value">{bootDate}</span></div>
            <div className="sys-prop"><span className="prop-label">Uptime</span><span className="prop-value highlight">{formatUptime(info.uptime)}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <Cpu className="panel-icon" />
            <h2>Processor</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Model</span><span className="prop-value gpu-text">{info.cpu_brand}</span></div>
            <div className="sys-prop"><span className="prop-label">Vendor ID</span><span className="prop-value">{info.cpu_vendor}</span></div>
            <div className="sys-prop"><span className="prop-label">Architecture</span><span className="prop-value">{info.cpu_arch}</span></div>
            <div className="sys-prop"><span className="prop-label">Physical Cores</span><span className="prop-value">{info.cpu_cores === 0 ? 'Unavailable' : info.cpu_cores}</span></div>
            <div className="sys-prop"><span className="prop-label">Logical Threads</span><span className="prop-value">{info.cpu_logical_cores}</span></div>
            <div className="sys-prop"><span className="prop-label">Base Clock</span><span className="prop-value">{info.cpu_frequency === 0 ? 'Unavailable' : `${info.cpu_frequency} MHz`}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <MemoryStick className="panel-icon" />
            <h2>Memory subsystem</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Total RAM</span><span className="prop-value">{formatBytes(info.ram_total)}</span></div>
            <div className="sys-prop"><span className="prop-label">Available RAM</span><span className="prop-value">{formatBytes(info.ram_available)}</span></div>
            <div className="sys-prop"><span className="prop-label">Free RAM</span><span className="prop-value">{formatBytes(info.ram_free)}</span></div>
            <div className="sys-prop"><span className="prop-label">Total Swap</span><span className="prop-value">{formatBytes(info.swap_total)}</span></div>
            <div className="sys-prop"><span className="prop-label">Free Swap</span><span className="prop-value">{formatBytes(info.swap_free)}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <Square className="panel-icon" />
            <h2>Graphics Processor</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">GPU Model</span><span className="prop-value gpu-text">{info.gpu_name}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}"""
    
    # Wait, my distribution_id replacement missed a previous edit, so I'll just use regex or build it fresh.
    new_view = """function SystemInfoView({ vitals }: { vitals: SystemVitals | null }) {
  if (!vitals) return <p>Loading...</p>;
  const info = vitals.sys_info;

  return (
    <div className="sysinfo-view">
      <div className="sysinfo-grid">
        <div className="panel sys-panel">
          <div className="panel-header">
            <Info className="panel-icon" />
            <h2>Operating System</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Host Name</span><span className="prop-value">{info.host_name}</span></div>
            <div className="sys-prop"><span className="prop-label">OS</span><span className="prop-value">{info.long_os_version}</span></div>
            <div className="sys-prop"><span className="prop-label">Distribution</span><span className="prop-value">{info.distribution_id || 'Unavailable'}</span></div>
            <div className="sys-prop"><span className="prop-label">Kernel</span><span className="prop-value">{info.kernel_version}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <Cpu className="panel-icon" />
            <h2>Processor</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Model</span><span className="prop-value gpu-text">{info.cpu_brand}</span></div>
            <div className="sys-prop"><span className="prop-label">Vendor ID</span><span className="prop-value">{info.cpu_vendor}</span></div>
            <div className="sys-prop"><span className="prop-label">Architecture</span><span className="prop-value">{info.cpu_arch || 'Unavailable'}</span></div>
            <div className="sys-prop"><span className="prop-label">Physical Cores</span><span className="prop-value">{info.cpu_cores === 0 ? 'Unavailable' : info.cpu_cores}</span></div>
            <div className="sys-prop"><span className="prop-label">Logical Threads</span><span className="prop-value">{info.cpu_logical_cores}</span></div>
            <div className="sys-prop"><span className="prop-label">Base Clock</span><span className="prop-value">{info.cpu_frequency === 0 ? 'Unavailable' : `${info.cpu_frequency} MHz`}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <MemoryStick className="panel-icon" />
            <h2>Memory subsystem</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">Total RAM</span><span className="prop-value">{formatBytes(info.ram_total)}</span></div>
            <div className="sys-prop"><span className="prop-label">Total Swap</span><span className="prop-value">{formatBytes(info.swap_total)}</span></div>
          </div>
        </div>

        <div className="panel sys-panel">
          <div className="panel-header">
            <Square className="panel-icon" />
            <h2>Graphics Processor</h2>
          </div>
          <div className="sys-props">
            <div className="sys-prop"><span className="prop-label">GPU Model</span><span className="prop-value gpu-text">{info.gpu_name}</span></div>
            <div className="sys-prop"><span className="prop-label">VRAM</span><span className="prop-value">{info.vram}</span></div>
          </div>
        </div>
        
        <div className="panel sys-panel" style={{ gridColumn: 'span 2' }}>
          <div className="panel-header">
            <Network className="panel-icon" />
            <h2>Network Adapters (MAC Addresses)</h2>
          </div>
          <div className="sys-props" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {info.mac_addresses.map((mac, i) => (
              <div key={i} className="sys-prop" style={{ marginBottom: 0 }}>
                <span className="prop-label">Adapter {i+1}</span>
                <span className="prop-value">{mac}</span>
              </div>
            ))}
            {info.mac_addresses.length === 0 && (
              <div className="sys-prop"><span className="prop-label">Adapters</span><span className="prop-value">Unavailable</span></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}"""
    
    # Do a regex replace for the whole function
    import re
    content = re.sub(r'function SystemInfoView.*?\n\}', new_view, content, flags=re.DOTALL)
    
    with open("src/App.tsx", "w") as f:
        f.write(content)


if __name__ == "__main__":
    process_lib()
    process_tsx()
