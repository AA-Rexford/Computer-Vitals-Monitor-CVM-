with open("src/App.tsx", "r") as f:
    content = f.read()

start = content.find("function DevicesView")
end = content.find("function selectedServiceStatusColor", start)
print(content[start:end])

