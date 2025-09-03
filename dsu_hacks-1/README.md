Here’s a **24-hour Hackathon MVP plan** for your **Electron-based context-aware Todo App** with **auto file restoration** and **session summarizer**:

---

## ✅ **Goals for MVP**

✔ User login system (local or simple JWT)
✔ Todo list with tasks per user
✔ File tracking per task
✔ Auto-open last used files on resume (using VS Code CLI)
✔ Session summarizer (last session details)
✔ Clean UI (basic but responsive)

---

## ✅ **Tech Stack**

* **Electron** → Desktop app shell
* **Frontend** → React + TailwindCSS (or plain React for speed)
* **Backend** → Node.js (Express) + MongoDB (local or Atlas)
* **Integration** → `child_process` for opening files in VS Code
* **Session Summarizer** → Simple text summary (no AI for MVP)

---

## ✅ **High-Level Architecture**

* **Electron Main Process** → Runs the app, spawns Node server
* **Electron Renderer** → React UI
* **Backend (Express)** → REST API for:

  * Auth
  * Tasks CRUD
  * File tracking
  * Session handling
* **MongoDB** → Store users, tasks, files, sessions

---

## ✅ **MVP Features**

1. **Login**

   * Hardcode 1–2 users or use local storage auth
2. **Todo List**

   * Add tasks, mark complete
3. **File Tracking**

   * Store files when user “opens” them
4. **Resume Task**

   * Auto-open top N files in VS Code
5. **Session Summarizer**

   * Show last opened files + last session time

---

## ✅ **24-Hour Timeline**

### **Hour 0–1: Setup**

* Initialize Electron app (`electron-quick-start` or `electron-forge`)
* Add React with Webpack or use `create-electron-app`
* Setup Express backend inside Electron
* Connect to MongoDB (local or Atlas)

---

### **Hour 2–4: Core Models & API**

**Models:**

* `User`: `{ name, email, password }`
* `Task`: `{ title, description, userId }`
* `File`: `{ taskId, userId, filePath, lastAccessed }`
* `Session`: `{ taskId, userId, startTime, endTime, filesOpened: [] }`

**APIs:**

* `POST /login`
* `GET /tasks`
* `POST /tasks`
* `POST /tasks/:taskId/open-file`
* `GET /tasks/:taskId/context`
* `POST /tasks/:taskId/resume`
* `GET /tasks/:taskId/last-session`

---

### **Hour 4–8: Frontend Basics**

* **Login Page**
* **Dashboard**

  * Show tasks
  * Add new task
* **Task Detail Modal**

  * Show last session summary
  * “Resume Task” button

---

### **Hour 8–12: File Tracking**

* Implement `open-file` API
* When user clicks **“Open File”** in UI:

  * Update DB (lastAccessed)
  * Actually open file using:

    ```js
    const { exec } = require("child_process");
    exec(`code "${filePath}"`);
    ```
* Test opening multiple files

---

### **Hour 12–16: Resume Task Feature**

* Fetch top 3 recent files
* Auto-open them on **Resume**
* Log session start and end in DB
* Update `Session` model

---

### **Hour 16–18: Session Summarizer**

* Create `GET /tasks/:taskId/last-session`
* Return:

  ```json
  {
    "lastSessionDate": "2025-09-03",
    "filesOpened": ["/src/App.js", "/src/utils/api.js"]
  }
  ```
* Display in UI (sidebar or modal)

---

### **Hour 18–20: Polishing UI**

* TailwindCSS for quick styling
* Dark mode toggle
* Framer Motion animations for modals

---

### **Hour 20–22: Testing & Debugging**

* Test:

  * Multiple users
  * Switching tasks
  * Auto-open files
  * Session summary
* Fix edge cases (no previous session)

---

### **Hour 22–24: Packaging & Demo**

* Use **Electron Packager** or **Electron Builder**:

  ```bash
  npm run build
  ```
* Create `.exe` or `.dmg` for demo
* Record demo video (optional)

---

## ✅ **MVP Deliverables**

✔ Electron desktop app
✔ Login → Dashboard → Tasks
✔ File tracking
✔ Auto-open files on resume
✔ Session summary modal

---

### **Optional Enhancements (if time left)**

✔ Configurable number of files to open
✔ Quick resume (last active task)
✔ AI-powered session summary using OpenAI API
✔ Integration with VS Code API for richer context

---


