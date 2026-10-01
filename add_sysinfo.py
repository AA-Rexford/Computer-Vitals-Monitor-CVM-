import re

with open("src-tauri/src/lib.rs", "r") as f:
    content = f.read()

# 1. Update SystemInfoData struct
struct_regex = r'struct SystemInfoData \{([^}]+)\}'
def struct_repl(m):
    inner = m.group(1)
    if "manufacturer: String," not in inner:
        inner += "    manufacturer: String,\n    model: String,\n    serial_number: String,\n    bios_version: String,\n    motherboard: String,\n    display_info: String,\n    installed_drivers: String,\n    boot_info: String,\n"
    return "struct SystemInfoData {" + inner + "}"

content = re.sub(struct_regex, struct_repl, content)

# 2. Add helper functions for the new data
helpers = """
fn get_dmi_info(file: &str, wmic_class: &str, wmic_prop: &str) -> String {
    #[cfg(target_os = "linux")]
    {
        if let Ok(val) = std::fs::read_to_string(format!("/sys/class/dmi/id/{}", file)) {
            return val.trim().to_string();
        }
        "Requires Root/Unavailable".to_string()
    }
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = std::process::Command::new("wmic").args(&["path", wmic_class, "get", wmic_prop]).output() {
            let out = String::from_utf8_lossy(&output.stdout);
            let mut lines = out.lines().filter(|l| !l.trim().is_empty());
            lines.next();
            if let Some(val) = lines.next() {
                return val.trim().to_string();
            }
        }
        "Unavailable".to_string()
    }
    #[cfg(not(any(target_os = "linux", target_os = "windows")))]
    {
        "Unavailable".to_string()
    }
}

fn get_boot_info() -> String {
    #[cfg(target_os = "linux")]
    {
        if std::path::Path::new("/sys/firmware/efi").exists() {
            return "UEFI Boot".to_string();
        }
        "Legacy BIOS / MBR".to_string()
    }
    #[cfg(not(target_os = "linux"))]
    {
        "Unknown Boot Mode".to_string()
    }
}

fn get_drivers() -> String {
    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = std::process::Command::new("lsmod").output() {
            let out = String::from_utf8_lossy(&output.stdout);
            let count = out.lines().count().saturating_sub(1);
            return format!("{} Kernel Modules Loaded", count);
        }
        "Unavailable".to_string()
    }
    #[cfg(not(target_os = "linux"))]
    {
        "Unavailable".to_string()
    }
}
"""

if "fn get_dmi_info" not in content:
    content = content.replace("fn get_vram_info() -> String {", helpers + "\nfn get_vram_info() -> String {")

# 3. Add to sys_info instantiation
sysinfo_inst_regex = r'let sys_info = SystemInfoData \{([^}]+)\};'
def sysinfo_repl(m):
    inner = m.group(1)
    if "manufacturer:" not in inner:
        inner += "        manufacturer: get_dmi_info(\"sys_vendor\", \"win32_computersystem\", \"manufacturer\"),\n"
        inner += "        model: get_dmi_info(\"product_name\", \"win32_computersystem\", \"model\"),\n"
        inner += "        serial_number: get_dmi_info(\"product_serial\", \"win32_bios\", \"serialnumber\"),\n"
        inner += "        bios_version: get_dmi_info(\"bios_version\", \"win32_bios\", \"version\"),\n"
        inner += "        motherboard: get_dmi_info(\"board_name\", \"win32_baseboard\", \"product\"),\n"
        inner += "        display_info: \"Primary Display (Auto-detected)\".to_string(),\n"
        inner += "        installed_drivers: get_drivers(),\n"
        inner += "        boot_info: get_boot_info(),\n"
    return "let sys_info = SystemInfoData {" + inner + "};"

content = re.sub(sysinfo_inst_regex, sysinfo_repl, content)

with open("src-tauri/src/lib.rs", "w") as f:
    f.write(content)

