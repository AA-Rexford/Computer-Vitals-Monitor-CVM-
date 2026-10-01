import re

with open("src-tauri/src/lib.rs", "r") as f:
    content = f.read()

# Update ProcessInfo struct
old_proc_struct = r'struct ProcessInfo \{\s*pid: u32,\s*name: String,\s*cpu_usage: f32,\s*memory_usage: u64,\s*\}'
new_proc_struct = """struct ProcessInfo {
    pid: u32,
    parent_pid: u32,
    name: String,
    user: String,
    cpu_usage: f32,
    memory_usage: u64,
    disk_read: u64,
    disk_write: u64,
    start_time: u64,
    status: String,
    executable: String,
    command: String,
}"""

content = re.sub(old_proc_struct, new_proc_struct, content, flags=re.MULTILINE)

# Update proc_list mapping safely
old_map = """    let mut proc_list: Vec<ProcessInfo> = sys.processes().iter().map(|(pid, p)| ProcessInfo {
        pid: pid.as_u32(),
        name: p.name().to_string_lossy().into_owned(),
        cpu_usage: p.cpu_usage(),
        memory_usage: p.memory(),
    }).collect();"""

new_map = """    let mut proc_list: Vec<ProcessInfo> = sys.processes().iter().map(|(pid, p)| {
        let du = p.disk_usage();
        ProcessInfo {
            pid: pid.as_u32(),
            parent_pid: p.parent().map(|p| p.as_u32()).unwrap_or(0),
            name: p.name().to_string_lossy().into_owned(),
            user: p.user_id().map(|u| u.to_string()).unwrap_or_else(|| "System".to_string()),
            cpu_usage: p.cpu_usage(),
            memory_usage: p.memory(),
            disk_read: du.read_bytes,
            disk_write: du.written_bytes,
            start_time: p.start_time(),
            status: p.status().to_string(),
            executable: p.exe().unwrap_or_else(|| std::path::Path::new("")).to_string_lossy().into_owned(),
            command: p.cmd().join(" "),
        }
    }).collect();"""

content = content.replace(old_map, new_map)

commands_to_add = """
#[tauri::command]
async fn suspend_process(pid: usize) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("kill").args(&["-STOP", &pid.to_string()]).output().map_err(|e| e.to_string())?;
        return Ok(format!("Suspended process {}", pid));
    }
    #[cfg(not(target_os = "linux"))]
    Err("Suspend not supported on this OS".to_string())
}

#[tauri::command]
async fn resume_process(pid: usize) -> Result<String, String> {
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("kill").args(&["-CONT", &pid.to_string()]).output().map_err(|e| e.to_string())?;
        return Ok(format!("Resumed process {}", pid));
    }
    #[cfg(not(target_os = "linux"))]
    Err("Resume not supported on this OS".to_string())
}
"""
if "async fn suspend_process" not in content:
    content = content.replace("#[tauri::command]\nasync fn kill_process", commands_to_add + "\n#[tauri::command]\nasync fn kill_process")

if "suspend_process, resume_process" not in content:
    content = content.replace("kill_process, quick_action])", "kill_process, quick_action, suspend_process, resume_process])")

with open("src-tauri/src/lib.rs", "w") as f:
    f.write(content)

