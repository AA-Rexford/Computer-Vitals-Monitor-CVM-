with open("src/App.tsx", "r") as f:
    content = f.read()

start = content.find("function TaskManagerView")
end = content.find("function SettingsView", start)
print(content[start:end])

