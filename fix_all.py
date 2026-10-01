import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add PieChart imports
if "PieChart" not in content[:500]:
    content = content.replace("import { AreaChart, Area, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';", "import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';")

# Fix uptime (change sys.uptime to vitals.uptime)
content = content.replace("sys.uptime", "vitals.uptime")

with open("src/App.tsx", "w") as f:
    f.write(content)

with open("src-tauri/src/lib.rs", "r") as f:
    lib_content = f.read()

# Add uptime to SystemVitals
if "uptime: u64," not in lib_content:
    lib_content = lib_content.replace("struct SystemVitals {\n    cpu_usage: f32,", "struct SystemVitals {\n    cpu_usage: f32,\n    uptime: u64,")
    lib_content = lib_content.replace("    SystemVitals {\n        cpu_usage,", "    SystemVitals {\n        cpu_usage,\n        uptime: System::uptime(),")

with open("src-tauri/src/lib.rs", "w") as f:
    f.write(lib_content)

