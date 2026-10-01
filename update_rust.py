import re

with open("src-tauri/src/lib.rs", "r") as f:
    content = f.read()

# Add disk_read and disk_write to SystemVitals
if "disk_read: u64" not in content:
    content = content.replace("cpu_usage: f32,", "cpu_usage: f32,\n    disk_read: u64,\n    disk_write: u64,")

# Remove truncate(15) properly
content = re.sub(r'proc_list\.truncate\(15\);', r'// proc_list.truncate(15);', content)

# Calculate disk read/write
calc_code = """
    let mut disk_read = 0;
    let mut disk_write = 0;
    for (_, p) in sys.processes() {
        let du = p.disk_usage();
        disk_read += du.read_bytes;
        disk_write += du.written_bytes;
    }
"""
if "let mut disk_read = 0;" not in content:
    content = content.replace("let cpu_usage = sys.global_cpu_usage();", "let cpu_usage = sys.global_cpu_usage();" + calc_code)

# Add them to SystemVitals constructor
if "disk_read," not in content:
    content = content.replace("cpu_usage,", "cpu_usage,\n        disk_read,\n        disk_write,")

with open("src-tauri/src/lib.rs", "w") as f:
    f.write(content)

