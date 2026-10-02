with open("src/App.tsx", "r") as f:
    content = f.read()

start = content.find("function NetworkView")
end = content.find("function DevicesView", start)
print(content[start:end])

