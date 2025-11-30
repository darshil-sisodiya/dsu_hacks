# 🚀 ContextFlow AI

> **Minimize context switching friction with AI-powered task management**

ContextFlow AI is an intelligent productivity platform that integrates your Google Tasks and Calendar with AI-driven context analysis, helping you stay focused and organized across your work sessions.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.2.2-blue.svg)

---

## ✨ Features

### 🎯 **Smart Task Management**
- **AI-Powered Analysis**: Automatic task priority assessment using Google's Gemini AI
- **Calendar Integration**: Correlate tasks with calendar events for intelligent deadline detection
- **Urgency Detection**: Real-time tracking of time until deadlines with visual urgency indicators

### 📊 **Context Awareness**
- **Session Snapshots**: Capture and restore your work environment state for each task
- **File Search Integration**: AI analyzes workspace files relevant to your current task
- **Related Events**: Automatically link calendar events to tasks for better context

### 🔄 **Seamless Workflow**
- **One-Click Flow State**: Launch all relevant files and context for a task instantly
- **Desktop Integration**: Native Electron app for OS-level file management
- **Cross-Platform**: Works on Windows, macOS, and Linux

### 🔐 **Secure & Private**
- Google OAuth 2.0 authentication
- Rate limiting and security headers
- Local session state management
- MongoDB for secure data persistence

---

## 🏗️ Architecture

### **Tech Stack**

#### Backend
- **Runtime**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: Google Gemini AI, OpenAI
- **APIs**: Google Calendar API, Google Tasks API
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

#### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **TypeScript**: Full type safety

#### Desktop
- **Platform**: Electron
- **IPC**: Secure preload scripts
- **Integration**: Native file system access

---

## 📁 Project Structure

```
hack/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── config/         # Database & API configurations
│   │   ├── middleware/     # Express middleware (error handling, auth)
│   │   ├── models/         # MongoDB schemas (Task, Event, Session, Context)
│   │   ├── routes/         # API endpoints
│   │   │   ├── googleCalendar.ts
│   │   │   ├── googleTasks.ts
│   │   │   ├── integratedWorkspace.ts
│   │   │   ├── session.ts
│   │   │   └── workspace.ts
│   │   ├── services/       # Business logic
│   │   │   ├── gemini.ts              # AI analysis
│   │   │   ├── googleCalendar.ts      # Calendar integration
│   │   │   ├── googleTasks.ts         # Tasks integration
│   │   │   ├── fileSearch.ts          # Workspace file analysis
│   │   │   └── taskCalendarIntegration.ts
│   │   └── utils/          # Logger and helpers
│   └── package.json
│
├── frontend/               # Next.js web application
│   ├── app/
│   │   ├── components/
│   │   │   ├── TaskList.tsx          # Task sidebar
│   │   │   ├── ContextPanel.tsx      # Context information
│   │   │   ├── SessionSnapshot.tsx   # Session state
│   │   │   └── FlowButton.tsx        # Flow state trigger
│   │   ├── page.tsx        # Main application
│   │   └── globals.css
│   └── package.json
│
└── electron/               # Desktop application
    ├── main.js            # Electron main process
    └── preload.js         # Secure IPC bridge
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **MongoDB** (local or cloud instance)
- **Google Cloud Project** with Calendar and Tasks APIs enabled
- **Google Gemini API Key**

### 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd hack
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/contextflow

# Google APIs
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Optional: OpenAI
OPENAI_API_KEY=your_openai_api_key

# Workspace
WORKSPACE_ROOT_PATH=C:/path/to/your/workspace
```

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API** and **Google Tasks API**
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:3000/api/auth/callback`
6. Download credentials and update `.env`

Start the backend:

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4️⃣ Electron Desktop App (Optional)

```bash
cd electron
npm install
npm start
```

---

## 📡 API Endpoints

### Authentication & Google Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/google` | Initiate Google OAuth flow |
| `GET` | `/api/auth/google/callback` | OAuth callback handler |
| `GET` | `/api/auth/status` | Check authentication status |

### Tasks Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Fetch all Google Tasks |
| `GET` | `/api/tasks/:taskId` | Get specific task details |
| `POST` | `/api/tasks` | Create a new task |
| `PUT` | `/api/tasks/:taskId` | Update task |
| `DELETE` | `/api/tasks/:taskId` | Delete task |

### Calendar Integration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calendar/events` | Fetch calendar events |
| `GET` | `/api/calendar/events/task/:taskId` | Get events related to task |

### Integrated Workspace

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workspace/integrated` | Get AI-enhanced task list with priorities |
| `GET` | `/api/workspace/task/:taskId/context` | Get task context and related files |
| `POST` | `/api/workspace/sync` | Sync tasks with calendar |

### Session Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions/:taskId` | Get session snapshot for task |
| `POST` | `/api/sessions` | Create/update session snapshot |
| `DELETE` | `/api/sessions/:taskId` | Delete session |

---

## 🎨 UI Components

### TaskList
Displays synchronized tasks with priority indicators, urgency badges, and calendar event counts.

### ContextPanel
Shows AI-generated context analysis, related files from workspace, and relevant documentation.

### SessionSnapshot
Captures and displays:
- Open files and their state
- Active branches (Git)
- Terminal commands history
- Timestamps and restore points

### FlowButton
One-click button to:
- Open all relevant files
- Restore session state
- Launch development environment

---

## 🤖 AI Features

### Task Priority Analysis
Uses Google Gemini to analyze:
- Task titles and descriptions
- Due dates and time constraints
- Related calendar events
- Historical completion patterns

### Context Generation
AI examines:
- Workspace file structure
- Code comments and documentation
- Recent file modifications
- Project dependencies

### Intelligent Suggestions
- Optimal deadline recommendations
- Related task clustering
- Time allocation estimates
- Focus time recommendations

---

## 🔧 Configuration

### Database Models

#### Task
```typescript
{
  googleTaskId: string
  title: string
  status: 'needsAction' | 'completed'
  due?: Date
  notes?: string
  priority: 'high' | 'medium' | 'low'
  relatedEvents: CalendarEvent[]
}
```

#### CalendarEvent
```typescript
{
  googleEventId: string
  summary: string
  start: Date
  end: Date
  relatedTasks: Task[]
}
```

#### Session
```typescript
{
  taskId: string
  openFiles: string[]
  activeTerminals: string[]
  gitBranch?: string
  timestamp: Date
  customData: Map
}
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Test Google Calendar Integration
```bash
node test-calendar.js
```

### Test Google Tasks Integration
```bash
node test-google-tasks.js
```

### Test Gemini AI
```bash
node test-gemini.js
```

---

## 🛠️ Development

### Run in Development Mode

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Terminal 3 - Electron (optional):
```bash
cd electron
npm start
```

### Build for Production

Backend:
```bash
cd backend
npm run build
npm start
```

Frontend:
```bash
cd frontend
npm run build
npm start
```

Electron:
```bash
cd electron
npm run build
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
mongosh

# Or start MongoDB service
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

### Google API Authentication Errors
1. Verify credentials in Google Cloud Console
2. Check redirect URIs match exactly
3. Ensure APIs are enabled
4. Clear token files: `google-calendar-tokens.json`, `google-tasks-tokens.json`

### Port Already in Use
```bash
# Find and kill process on port 5000
npx kill-port 5000

# Or use different port
PORT=5001 npm run dev
```

---

## 🗺️ Roadmap

- [ ] **Microsoft Teams Integration** - Chat and meeting context
- [ ] **Slack Integration** - Channel and thread tracking
- [ ] **GitHub Integration** - Link PRs and issues to tasks
- [ ] **Time Tracking** - Automatic activity logging
- [ ] **AI Summarization** - Daily/weekly productivity reports
- [ ] **Mobile Apps** - iOS and Android clients
- [ ] **Team Collaboration** - Shared task contexts
- [ ] **Plugin System** - Custom integrations and extensions

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Support

For questions and support, please open an issue in the GitHub repository.

---

## 🙏 Acknowledgments

- Google Cloud Platform for Calendar and Tasks APIs
- Google Gemini AI for intelligent task analysis
- Next.js team for the amazing framework
- Electron for desktop integration capabilities

---

<div align="center">
Made with ❤️ for productive developers
</div>
