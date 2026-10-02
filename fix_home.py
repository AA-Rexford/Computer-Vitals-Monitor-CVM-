import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Fix activeTab declaration
content = re.sub(
    r'const \[activeTab, setActiveTab\] = useState<[^>]+>\("[^"]+"\);',
    'const [activeTab, setActiveTab] = useState<string>("home");',
    content
)

# Replace Software icon
content = content.replace("icon: <Activity size={64} /> }, // SOFTWARE", "icon: <SquareTerminal size={64} /> },")
# Wait, let's just do a string replace of the exact line
content = content.replace("{ id: 'tasks', name: 'SOFTWARE', icon: <Activity size={64} /> },", "{ id: 'tasks', name: 'SOFTWARE', icon: <SquareTerminal size={64} /> },")

# Replace Network icon
content = content.replace("{ id: 'network', name: 'NETWORK', icon: <Network size={64} /> },", "{ id: 'network', name: 'NETWORK', icon: <Wifi size={64} /> },")

# Ensure Wifi is imported
if "Wifi" not in content[:content.find("from 'lucide-react'")]:
    content = content.replace("import { ", "import { Wifi, ")

with open("src/App.tsx", "w") as f:
    f.write(content)

