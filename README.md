# Computer Vitals Monitor

An open-source, offline-first Windows and Linux diagnostic platform that continuously collects real system evidence, turns scattered technical information into understandable health findings, and lets technicians drill from plain-English explanations down to raw evidence. 

## 🎯 Core Promise
Computer Vitals Monitor provides **one interface that makes a computer explain itself**. It replaces the fragmented, disjointed process of hunting through Task Manager, Event Viewer, hardware sensors, and terminal commands by providing understandable, evidence-backed health findings in one unified workflow.

## 🛠️ Tech Stack
*   **App Shell:** [Tauri 2](https://tauri.app/) (Lightweight native app without Electron bloat)
*   **Core Backend:** **Rust** (Memory-safe, low-overhead system monitoring, device collectors, database, diagnostics, and actions)
*   **Frontend UI:** **TypeScript + React** (Dynamic graphs, futuristic command-center visual identity)
*   **Storage:** **SQLite** (Local, offline history, metrics, and incident logging)

## 🔑 Key Design Principles
1.  **Evidence-First:** Every diagnostic conclusion (e.g., "thermal throttling") traces back directly to raw evidence.
2.  **Offline-First & Local:** Core functionality requires no internet connection. No cloud providers, no subscriptions.
3.  **Simple on Top, Technical Underneath:** Plain-English explanations for users, but deep technical inspection capabilities for advanced technicians.
4.  **Security & Safety:** Actions like restarting a service or killing a process require explicit user permissions.

## 🚀 Core Functions
1.  **Discover:** Map out hardware (CPU, RAM, Disks) and network topology without unrestricted scanning.
2.  **Monitor:** Provide continuous live vitals without needing a refresh button.
3.  **Diagnose:** Correlate evidence via a robust rule engine rather than relying on guesswork.
4.  **Manage / Remediate:** Execute authorized fixes and **verify** if the fix worked.

## Development
To get started:
```bash
npm install
npm run tauri dev
```
