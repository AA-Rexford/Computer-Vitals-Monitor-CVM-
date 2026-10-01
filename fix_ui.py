import re

def process_tsx():
    with open("src/App.tsx", "r") as f:
        content = f.read()

    # 1. Add eventFilter state
    if "const [eventFilter, setEventFilter]" not in content:
        content = content.replace(
            "function DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {",
            "import { useState } from 'react';\n\nfunction DashboardGrid({ vitals, history }: { vitals: SystemVitals | null, history: SystemVitals[] }) {\n  const [eventFilter, setEventFilter] = useState('Active Problems');"
        )

    # 2. Update status/gauge colors
    color_logic = """  const diskUsagePct = totalDiskSpace > 0 ? ((totalDiskSpace - availableDiskSpace) / totalDiskSpace) * 100 : 0;

  let storageColor = '#10b981'; // Green
  if (diskUsagePct > 80) storageColor = '#ef4444'; // Red
  else if (diskUsagePct > 60) storageColor = '#f59e0b'; // Yellow

  let tempColor = '#3b82f6'; // Blue
  if (cpuTemp > 80) tempColor = '#ef4444'; // Red
  else if (cpuTemp > 60) tempColor = '#f59e0b'; // Yellow

  let sysStatus = 'HEALTHY';
"""
    # Replace existing diskUsagePct to activeProblems init
    content = re.sub(
        r'  const diskUsagePct.*?\n  let sysStatus = \'HEALTHY\';',
        color_logic,
        content,
        flags=re.DOTALL
    )

    # Update PieChart colors
    content = content.replace("color: '#f59e0b'", "color: storageColor")
    content = content.replace("color: sysColor", "color: tempColor")
    
    # 3. Update Dropdown and Events list
    events_section = """        <div className="cc-events-panel">
          <div className="events-header">
            <h4>Event Log & Active Problems</h4>
            <div className="dropdown">
              <select className="cc-select" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                <option value="Active Problems">Active Problems</option>
                <option value="All System Events">All System Events</option>
              </select>
            </div>
          </div>
          <div className="events-list">
            {eventFilter === 'Active Problems' && (
              <>
                {activeProblems.length === 0 ? (
                  <div className="event-item healthy">✓ System is running optimally. No active problems detected.</div>
                ) : (
                  activeProblems.map((prob, i) => (
                    <div key={i} className="event-item critical">! {prob}</div>
                  ))
                )}
              </>
            )}
            {eventFilter === 'All System Events' && (
              <>
                <div className="event-item info">i System monitoring initialized successfully.</div>
                <div className="event-item info">i Hardware polling rate set to 1000ms.</div>
                {activeProblems.map((prob, i) => (
                    <div key={`err-${i}`} className="event-item critical">! {prob}</div>
                ))}
              </>
            )}
          </div>
        </div>"""
    content = re.sub(r'<div className="cc-events-panel">.*?</div>\s*</div>', events_section + "\n\n        <div className=\"cc-actions-panel\">", content, flags=re.DOTALL)
    
    with open("src/App.tsx", "w") as f:
        f.write(content)

def process_css():
    with open("src/App.css", "r") as f:
        css = f.read()

    # Make the SYSTEM HEALTHY badge look better
    old_badge = """.cc-status-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  background: rgba(0,0,0,0.2);
}
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 10px currentColor;
  animation: pulse 2s infinite;
}"""

    new_badge = """.cc-status-box {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  border: 1px solid;
  padding: 0.6rem 1.25rem;
  border-radius: 9999px; /* sleek pill shape */
  background: rgba(0,0,0,0.4);
  box-shadow: inset 0 0 15px rgba(255,255,255,0.02);
}
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
  animation: pulse 1.5s ease-in-out infinite alternate;
}
@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.6; box-shadow: 0 0 0 0 rgba(currentColor, 0.7); }
  100% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 10px 2px currentColor; }
}"""
    css = css.replace(old_badge, new_badge)

    # Fix dropdown select styles
    select_fix = """
.cc-select {
  background: var(--bg-panel);
  color: var(--text-main);
  border: 1px solid var(--border-subtle);
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}
.cc-select option {
  background: var(--bg-deep);
  color: var(--text-main);
}
"""
    if "-webkit-appearance: none;" not in css:
        css = css.replace(".cc-select {", select_fix + "\n.cc-select-old {")

    # Fix network graph alignment
    # In App.tsx, all cc-graph-mini have height 80, but maybe margin is weird.
    # The network graph might have a smaller inner height. We will ensure all cc-graph-mini are exactly the same.
    
    with open("src/App.css", "w") as f:
        f.write(css)

if __name__ == "__main__":
    process_tsx()
    process_css()
