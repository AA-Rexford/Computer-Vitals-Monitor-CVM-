import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add SquareTerminal to imports
if "SquareTerminal" not in content:
    content = content.replace("Stethoscope,", "Stethoscope, SquareTerminal,")

with open("src/App.tsx", "w") as f:
    f.write(content)
