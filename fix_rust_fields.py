import re

with open("src-tauri/src/lib.rs", "r") as f:
    content = f.read()

# Revert ProcessInfo accidental addition
content = re.sub(r'struct ProcessInfo \{\n\s*pid: u32,\n\s*name: String,\n\s*cpu_usage: f32,\n\s*disk_read: u64,\n\s*disk_write: u64,\n\s*memory_usage: u64,\n\}', r'struct ProcessInfo {\n    pid: u32,\n    name: String,\n    cpu_usage: f32,\n    memory_usage: u64,\n}', content)

with open("src-tauri/src/lib.rs", "w") as f:
    f.write(content)

