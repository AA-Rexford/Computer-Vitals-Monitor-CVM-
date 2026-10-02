with open("src/App.tsx", "r") as f:
    content = f.read()

print("HomeGrid onClick:", "onClick={() => setActiveTab(box.id)}" in content)
import re
print("Buttons onClick:", len(re.findall(r'<button[^>]*onClick[^>]*>', content)))

