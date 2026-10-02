with open("src/App.tsx", "r") as f:
    content = f.read()

start = content.find("function HardwareView")
end = content.find("function ServicesView", start)
print(content[start:end])

