with open("src/App.tsx", "r") as f:
    content = f.read()

import re

# Add safe battery fallback
safe_battery = "const battery = vitals.battery || { present: false, percent: 0, charging: false, power_source: 'AC Power', status: 'N/A' };"

# In DashboardGrid
if safe_battery not in content:
    content = content.replace(
        "const netTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);",
        "const netTx = vitals.networks.reduce((acc, n) => acc + n.tx_bytes, 0);\n  " + safe_battery
    )

# Replace vitals.battery with battery in DashboardGrid
content = content.replace("vitals.battery.present", "battery.present")
content = content.replace("vitals.battery.percent", "battery.percent")
content = content.replace("vitals.battery.status", "battery.status")
content = content.replace("vitals.battery.power_source", "battery.power_source")
content = content.replace("vitals.battery.charging", "battery.charging")

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Fixed battery crash")
