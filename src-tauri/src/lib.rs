use tauri::State;
use std::sync::Mutex;
use sysinfo::System;
use serde::Serialize;

#[derive(Serialize, Clone)]
struct SystemVitals {
    cpu_usage: f32,
    ram_total: u64,
    ram_used: u64,
}

struct AppState {
    sys: Mutex<System>,
}

#[tauri::command]
fn get_system_vitals(state: State<'_, AppState>) -> SystemVitals {
    let mut sys = state.sys.lock().unwrap();
    // Refresh only the specific components we need
    sys.refresh_cpu_usage();
    sys.refresh_memory();
    
    let cpu_usage = sys.global_cpu_usage();
    let ram_total = sys.total_memory();
    let ram_used = sys.used_memory();

    SystemVitals {
        cpu_usage,
        ram_total,
        ram_used,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut sys = System::new_all();
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    tauri::Builder::default()
        .manage(AppState {
            sys: Mutex::new(sys),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_system_vitals])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
