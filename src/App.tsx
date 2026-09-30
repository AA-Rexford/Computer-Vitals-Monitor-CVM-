import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Activity, Cpu, HardDrive, Network, MemoryStick } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "./App.css";

interface SystemVitals {
  cpu_usage: number;
  ram_total: number;
  ram_used: number;
}

interface CpuHistoryPoint {
  time: string;
  usage: number;
}

function App() {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [cpuHistory, setCpuHistory] = useState<CpuHistoryPoint[]>([]);

  useEffect(() => {
    let isSubscribed = true;

    const fetchVitals = async () => {
      try {
        const data: SystemVitals = await invoke("get_system_vitals");
        if (!isSubscribed) return;
        
        setVitals(data);
        
        setCpuHistory(prev => {
          const now = new Date();
          const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
          const newPoint = { time: timeString, usage: data.cpu_usage };
          const newHistory = [...prev, newPoint];
          // Keep last 30 data points
          return newHistory.length > 30 ? newHistory.slice(newHistory.length - 30) : newHistory;
        });
      } catch (err) {
        console.error("Failed to fetch vitals:", err);
      }
    };

    // Initial fetch
    fetchVitals();
    // Poll every 1 second
    const interval = setInterval(fetchVitals, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ramPercentage = vitals ? ((vitals.ram_used / vitals.ram_total) * 100).toFixed(1) : 0;

  return (
    <main className="dashboard-container">
      <header className="top-bar">
        <div className="brand">
          <Activity className="brand-icon" />
          <h1>Computer Vitals Monitor</h1>
        </div>
        <div className="status-badge">
          <span className="status-dot"></span>
          COLLECTING EVIDENCE
        </div>
      </header>

      <div className="grid">
        {/* CPU Panel */}
        <section className="panel">
          <div className="panel-header">
            <Cpu className="panel-icon" />
            <h2>CPU Utilization</h2>
            <span className="value-highlight">{vitals ? vitals.cpu_usage.toFixed(1) : "0.0"}%</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={cpuHistory}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={12} tickLine={false} axisLine={false} width={30} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0e14', border: '1px solid #1f2937', borderRadius: '4px' }}
                  itemStyle={{ color: '#00e5ff' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="usage" stroke="#00e5ff" fillOpacity={1} fill="url(#colorUsage)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* RAM Panel */}
        <section className="panel">
          <div className="panel-header">
            <MemoryStick className="panel-icon" />
            <h2>Memory</h2>
            <span className="value-highlight">{ramPercentage}%</span>
          </div>
          <div className="metrics-list">
            <div className="metric-row">
              <span className="metric-label">Total</span>
              <span className="metric-value">{vitals ? formatBytes(vitals.ram_total) : "--"}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Used</span>
              <span className="metric-value">{vitals ? formatBytes(vitals.ram_used) : "--"}</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">Available</span>
              <span className="metric-value">{vitals ? formatBytes(vitals.ram_total - vitals.ram_used) : "--"}</span>
            </div>
          </div>
          <div className="progress-bar-bg mt-4">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${ramPercentage}%` }}
            ></div>
          </div>
        </section>

        {/* Placeholder Panels for future phases */}
        <section className="panel disabled-panel">
          <div className="panel-header">
            <HardDrive className="panel-icon" />
            <h2>Storage</h2>
            <span className="status-tag">AWAITING PHASE 5</span>
          </div>
          <p className="placeholder-text">Hardware collectors not yet implemented for physical drives.</p>
        </section>

        <section className="panel disabled-panel">
          <div className="panel-header">
            <Network className="panel-icon" />
            <h2>Network</h2>
            <span className="status-tag">AWAITING PHASE 12</span>
          </div>
          <p className="placeholder-text">Interface parsing and packet statistics not yet implemented.</p>
        </section>
      </div>
    </main>
  );
}

export default App;
