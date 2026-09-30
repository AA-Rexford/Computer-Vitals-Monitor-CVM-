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
    kernel_version: String,
    os_version: String,
    host_name: String,
    uptime: u64,
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
        name: System::name().unwrap_or_else(|| "Unknown".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "Unknown".to_string()),
        os_version: System::os_version().unwrap_or_else(|| "Unknown".to_string()),
        host_name: System::host_name().unwrap_or_else(|| "Unknown".to_string()),
        uptime: System::uptime(),
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
