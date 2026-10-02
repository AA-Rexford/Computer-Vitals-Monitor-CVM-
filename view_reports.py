with open("src/App.tsx", "r") as f:
    content = f.read()

start = content.find("function ReportsView")
end = content.find("function ActionsView", start)
print(content[start:end])

