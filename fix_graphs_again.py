import re

# 1. Update App.tsx
with open("src/App.tsx", "r") as f:
    tsx = f.read()

# Replace height={100} with height="100%" in ResponsiveContainer
tsx = tsx.replace("height={100}", 'height="100%"')
with open("src/App.tsx", "w") as f:
    f.write(tsx)

# 2. Update App.css
with open("src/App.css", "r") as f:
    css = f.read()

# Make sure cc-card is a flex column
if "display: flex;" not in re.search(r'\.cc-card\s*\{([^}]*)\}', css).group(1):
    css = re.sub(r'\.cc-card\s*\{([^}]*)\}', r'.cc-card {\1\n  display: flex;\n  flex-direction: column;\n}', css)

# Fix cc-graph-mini to expand to fill the card
css = re.sub(r'\.cc-graph-mini\s*\{([^}]*)\}', 
             r'.cc-graph-mini {\n  flex-grow: 1;\n  margin-top: 1rem;\n  margin-left: -1rem;\n  margin-right: -1rem;\n  margin-bottom: -1rem;\n  overflow: hidden;\n  border-radius: 0 0 12px 12px;\n  min-height: 80px;\n}', 
             css)

# Move window-controls to the very top right
css = re.sub(r'\.top-bar\s*\{([^}]*)\}', 
             r'.top-bar {\n  z-index: 50;\n  position: relative;\n  padding: 0.5rem;\n  background: transparent;\n  display: flex;\n  justify-content: flex-end;\n  align-items: flex-start;\n  -webkit-app-region: drag;\n  height: 30px;\n}', 
             css)

css = re.sub(r'\.window-controls\s*\{([^}]*)\}', 
             r'.window-controls {\n  display: flex;\n  gap: 0.5rem;\n  -webkit-app-region: no-drag;\n  margin-left: auto;\n}', 
             css)

with open("src/App.css", "w") as f:
    f.write(css)

print("Graphs and Controls updated")
