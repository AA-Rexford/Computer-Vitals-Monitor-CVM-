with open("src/App.tsx", "r") as f:
    content = f.read()

# Add GPU and SYS LOAD cards back
new_gpu = """
        {/* GPU */}
        <div className="cc-card" style={{ cursor: 'pointer', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.05)' }} onClick={() => setActiveTab('hardware')}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#8b5cf6'}}><Monitor size={14}/> GPU</span><span className="cc-value">{vitals.sys_info.gpu_name ? 'ACTIVE' : 'N/A'}</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{vitals.sys_info.gpu_name ? vitals.sys_info.gpu_name.substring(0, 35) : 'No dedicated GPU'}</div>
          <div className="cc-graph-mini" style={{ height: '120px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: '#8b5cf6', fontFamily: 'monospace' }}>{vitals.sys_info.vram !== 'Unavailable' ? `VRAM: ${vitals.sys_info.vram}` : 'GPU TELEMETRY N/A'}</span>
          </div>
        </div>
"""

new_sysload = """
        {/* SYSTEM LOAD */}
        <div className="cc-card" style={{ border: '1px solid #f472b6', background: 'rgba(244, 114, 182, 0.05)' }}>
          <div className="cc-card-header"><span className="cc-title" style={{color: '#f472b6'}}><Server size={14}/> SYS LOAD</span><span className="cc-value">{(vitals.cpu_usage / 100 * 4).toFixed(2)}</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Load Average Estimate</div>
          <div className="cc-graph-mini" style={{ height: '120px', marginTop: '0.5rem' }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={history.map(h => ({ val: (h.cpu_usage / 100 * 4) }))}><defs><linearGradient id="sysG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f472b6" stopOpacity={0.4}/><stop offset="95%" stopColor="#f472b6" stopOpacity={0}/></linearGradient></defs><YAxis hide /><Area type="basis" dataKey="val" stroke="#f472b6" fill="url(#sysG)" strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </div>
"""

# Insert them after CPU
insert_pos = content.find("{/* MEMORY */}")
content = content[:insert_pos] + new_gpu + "\n        " + content[insert_pos:]

# Insert sysload at the end of the grid
end_grid = content.find("      </div>\n    </div>\n  );\n}")
content = content[:end_grid] + new_sysload + "\n" + content[end_grid:]

with open("src/App.tsx", "w") as f:
    f.write(content)

print("Added cards back")
