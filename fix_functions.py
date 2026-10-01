import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace handleQuickAction and handleKill entirely
func_pattern = r'const handleQuickAction = async.*?const handleKill = async.*?catch \(e: any\) \{.*?\}'
new_funcs = """const handleQuickAction = async (action: string) => {
    try {
      const result: string = await invoke("quick_action", { action });
      alert(result);
    } catch (e: any) {
      alert("Error: " + e);
    }
  };

  const handleKill = async (pid: number) => {
    try {
      const result: string = await invoke("kill_process", { pid });
      alert(result);
    } catch (e: any) {
      alert("Error: " + e);
    }
  };"""

content = re.sub(r'const handleQuickAction = async.*?};', new_funcs, content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)

