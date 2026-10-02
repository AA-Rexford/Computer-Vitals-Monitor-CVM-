with open("src/App.tsx", "r") as f:
    content = f.read()

start = content.find("function DashboardGrid")
end = content.find("function SystemInfoView", start)
print(content[start:end])

