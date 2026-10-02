with open("src/App.tsx", "r") as f:
    content = f.read()

start = content.find("function SoftwareView")
end = content.find("function HardwareView", start)
print(content[start:end])

