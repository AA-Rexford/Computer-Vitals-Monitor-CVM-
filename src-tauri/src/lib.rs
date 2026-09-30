use tauri::State;
use std::sync::Mutex;
use sysinfo::{System, Disks};
use serde::Serialize;

#[derive(Serialize, Clone)]
struct DiskInfo {
    name: String,
    file_system: String,
    mount_point: String,
    total_space: u64,
    available_space: u64,
    is_removable: bool,
}

#[derive(Serialize, Clone)]
struct ProcessInfo {
    pid: u32,
    name: String,
    cpu_usage: f32,
    memory_usage: u64,
}

#[derive(Serialize, Clone)]
struct NetworkInfo {
    name: String,
    rx_bytes: u64,
    tx_bytes: u64,
}

#[derive(Serialize, Clone)]
struct SensorInfo {
    label: String,
    temperature: f32,
}

#[derive(Serialize, Clone)]
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
}

#[derive(Serialize, Clone)]
struct SystemVitals {
    cpu_usage: f32,
    ram_total: u64,
    ram_used: u64,
    disks: Vec<DiskInfo>,
    processes: Vec<ProcessInfo>,
    networks: Vec<NetworkInfo>,
    sensors: Vec<SensorInfo>,
    sys_info: SystemInfoData,
}

struct AppState {
    sys: Mutex<System>,
    disks: Mutex<Disks>,
    networks: Mutex<sysinfo::Networks>,
    components: Mutex<sysinfo::Components>,
}

fn get_gpu_info() -> String {
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = std::process::Command::new("lspci").output() {
            let out = String::from_utf8_lossy(&output.stdout);
            for line in out.lines() {
                if line.contains("VGA compatible controller") || line.contains("3D controller") {
                    if let Some(idx) = line.find(": ") {
                        return line[idx+2..].to_string();
                    }
                }
            }
        }
        "Unknown GPU".to_string()
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = std::process::Command::new("wmic").args(&["path", "win32_VideoController", "get", "name"]).output() {
            let out = String::from_utf8_lossy(&output.stdout);
            let mut lines = out.lines().filter(|l| !l.trim().is_empty());
            lines.next(); // Skip header
            if let Some(gpu) = lines.next() {
                return gpu.trim().to_string();
            }
        }
        "Unknown GPU".to_string()
    }
    
    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        "Unknown GPU".to_string()
    }
}

#[tauri::command]
fn get_system_vitals(state: State<'_, AppState>) -> SystemVitals {
    let mut sys = state.sys.lock().unwrap();
    let mut disks = state.disks.lock().unwrap();
    let mut networks = state.networks.lock().unwrap();
    let mut components = state.components.lock().unwrap();
    
    // Refresh components
    sys.refresh_all();
    disks.refresh(true);
    networks.refresh(true);
    components.refresh(true);
    
    let cpu_usage = sys.global_cpu_usage();
    let ram_total = sys.total_memory();
    let ram_used = sys.used_memory();

    let disk_list = disks.list().iter().filter(|d| {
        let fs = d.file_system().to_string_lossy().to_lowercase();
        // Filter out common virtual/container filesystems
        !fs.contains("overlay") && !fs.contains("tmpfs") && !fs.contains("squashfs") && !fs.contains("shm") && !fs.contains("devtmpfs") && fs != "sysfs" && fs != "proc" && fs != "cgroup"
    }).map(|d| DiskInfo {
        name: d.name().to_string_lossy().into_owned(),
        file_system: d.file_system().to_string_lossy().into_owned(),
        mount_point: d.mount_point().to_string_lossy().into_owned(),
        total_space: d.total_space(),
        available_space: d.available_space(),
        is_removable: d.is_removable(),
    }).collect();

    let mut proc_list: Vec<ProcessInfo> = sys.processes().iter().map(|(pid, p)| ProcessInfo {
        pid: pid.as_u32(),
        name: p.name().to_string_lossy().into_owned(),
        cpu_usage: p.cpu_usage(),
        memory_usage: p.memory(),
    }).collect();

    // Sort by CPU usage descending
    proc_list.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
    proc_list.truncate(15);

    let mut net_list: Vec<NetworkInfo> = networks.iter().filter(|(name, _)| {
        let n = name.to_lowercase();
        !n.starts_with("veth") && !n.starts_with("docker") && !n.starts_with("br-") && n != "lo"
    }).map(|(name, data)| NetworkInfo {
        name: name.to_string(),
        rx_bytes: data.received(),
        tx_bytes: data.transmitted(),
    }).collect();

    net_list.sort_by(|a, b| (b.rx_bytes + b.tx_bytes).cmp(&(a.rx_bytes + a.tx_bytes)));

    let mut sensor_list: Vec<SensorInfo> = components.iter().filter_map(|c| {
        c.temperature().map(|temp| SensorInfo {
            label: c.label().to_string(),
            temperature: temp,
        })
    }).collect();

    // Group similar labels by keeping the highest temp (sometimes sysinfo returns multiple cores)
    sensor_list.sort_by(|a, b| b.temperature.partial_cmp(&a.temperature).unwrap_or(std::cmp::Ordering::Equal));

    let sys_info = SystemInfoData {
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
    };

    SystemVitals {
        cpu_usage,
        ram_total,
        ram_used,
        disks: disk_list,
        processes: proc_list,
        networks: net_list,
        sensors: sensor_list,
        sys_info,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let disks = Disks::new_with_refreshed_list();
    let networks = sysinfo::Networks::new_with_refreshed_list();
    let components = sysinfo::Components::new_with_refreshed_list();

    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(sys),
            disks: Mutex::new(disks),
            networks: Mutex::new(networks),
            components: Mutex::new(components),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_vitals])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
