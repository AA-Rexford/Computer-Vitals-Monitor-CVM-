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
struct SystemVitals {
    cpu_usage: f32,
    ram_total: u64,
    ram_used: u64,
    disks: Vec<DiskInfo>,
}

struct AppState {
    sys: Mutex<System>,
    disks: Mutex<Disks>,
}

#[tauri::command]
fn get_system_vitals(state: State<'_, AppState>) -> SystemVitals {
    let mut sys = state.sys.lock().unwrap();
    let mut disks = state.disks.lock().unwrap();
    
    // Refresh components
    sys.refresh_cpu_usage();
    sys.refresh_memory();
    disks.refresh_list();
    disks.refresh();
    
    let cpu_usage = sys.global_cpu_usage();
    let ram_total = sys.total_memory();
    let ram_used = sys.used_memory();

    let disk_list = disks.list().iter().map(|d| DiskInfo {
        name: d.name().to_string_lossy().into_owned(),
        file_system: d.file_system().to_string_lossy().into_owned(),
        mount_point: d.mount_point().to_string_lossy().into_owned(),
        total_space: d.total_space(),
        available_space: d.available_space(),
        is_removable: d.is_removable(),
    }).collect();

    SystemVitals {
        cpu_usage,
        ram_total,
        ram_used,
        disks: disk_list,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut sys = System::new_all();
    sys.refresh_cpu_usage();
    sys.refresh_memory();
    
    let mut disks = Disks::new_with_refreshed_list();

    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(sys),
            disks: Mutex::new(disks),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_vitals])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
