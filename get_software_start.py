with open("src/App.tsx", "r") as f:
    content = f.read()

start = content.find("function SoftwareView")
print(content[start:start+1500])

