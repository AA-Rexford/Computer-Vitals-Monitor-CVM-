import re

with open("src/App.css", "r") as f:
    css = f.read()

# Fix cc-card min-height to make boxes bigger
css = re.sub(r'\.cc-card\s*\{([^}]*)\}', r'.cc-card {\1\n  min-height: 200px;\n}', css)

# Fix cc-graph-mini
css = re.sub(r'\.cc-graph-mini\s*\{[^}]*\}', 
             r'.cc-graph-mini {\n  margin-top: auto;\n  height: 100px;\n  margin-left: -1rem;\n  margin-right: -1rem;\n  margin-bottom: -1rem;\n  overflow: hidden;\n  border-radius: 0 0 12px 12px;\n}', 
             css)

# Fix top-bar to make it smaller and put controls on the left
css = re.sub(r'\.top-bar\s*\{([^}]*)\}', 
             r'.top-bar {\n  z-index: 50;\n  position: relative;\n  padding: 0.5rem 1rem;\n  background: var(--bg-deep);\n  display: flex;\n  justify-content: flex-start;\n  align-items: center;\n  -webkit-app-region: drag;\n}', 
             css)

# Hide page-title (overview text)
css = re.sub(r'\.page-title\s*\{([^}]*)\}', 
             r'.page-title {\n  display: none;\n}', 
             css)

# Ensure window-controls are small and on the left
css = re.sub(r'\.window-controls\s*\{([^}]*)\}', 
             r'.window-controls {\n  display: flex;\n  gap: 0.5rem;\n  -webkit-app-region: no-drag;\n  margin-right: auto;\n}', 
             css)

# Make window control buttons smaller
css = re.sub(r'\.control-btn\s*\{([^}]*)\}', 
             r'.control-btn {\n  background: transparent;\n  border: none;\n  color: var(--text-muted);\n  cursor: pointer;\n  padding: 0.2rem;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  border-radius: 4px;\n  transition: all 0.2s;\n}', 
             css)

with open("src/App.css", "w") as f:
    f.write(css)

print("CSS Fixed")
