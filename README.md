
# SyncSpace

> **A real-time collaborative workspace for developers to code, communicate, and collaborate from a single platform.**

SyncSpace is a full-stack collaborative development workspace designed to bring real-time coding, communication, meetings, whiteboarding, file sharing, and AI-assisted development into one unified environment.

The platform combines **React, Node.js, Express, MongoDB, Socket.IO, WebRTC, and Yjs** to provide synchronized collaboration across multiple users in shared workspaces.

---

## Live Demo

### Frontend
https://sync-space-navy.vercel.app/

### Backend API
https://syncspace-backend-wahf.onrender.com/

### Backend Health Check
https://syncspace-backend-wahf.onrender.com/health

---

## Overview

Modern development teams often rely on multiple tools for:

- Collaborative coding
- Team communication
- Video meetings
- Whiteboarding
- File sharing
- Code execution
- Project activity tracking

SyncSpace brings these workflows together inside a single collaborative workspace.

A user can create or join a workspace, collaborate with other members in real time, edit code together, communicate through chat, participate in video/audio meetings, share their screen, use a collaborative whiteboard, execute code, review code with AI assistance, and revisit previous collaboration sessions.

---

## Key Features

### Real-Time Collaborative Code Editor

- Multi-user collaborative editing
- Monaco-based editor
- Real-time synchronization using **Yjs**
- Socket.IO-based real-time communication
- Live user presence
- Collaborative cursor tracking
- Multiple programming language templates
- Code execution
- HTML preview workflow
- AI-powered code review

### Collaborative Whiteboard

- Real-time multi-user whiteboard
- Drawing synchronization
- Sticky notes
- Live cursor/presence
- Follow Presenter mode
- Collaborative session events
- Replayable whiteboard actions

### Video & Audio Collaboration

- WebRTC-based video/audio meetings
- Screen sharing
- Meeting participant synchronization
- Media state synchronization
- Real-time signaling through Socket.IO

### Team Communication

- Workspace chat
- Real-time messages
- Emoji support
- Room activity indicators
- Participant presence

### Workspace & Room Management

- Create workspaces/rooms
- Join existing rooms
- QR-based room joining
- Room member management
- Online presence
- Activity feed

### Files & Documents

- File upload and sharing
- Collaborative documents
- Document version history
- Version restoration
- Cloudinary-based media storage

### Session Replay & Analytics

SyncSpace records collaboration events that can be replayed later.

Features include:

- Session recording
- Session replay
- Whiteboard event timeline
- Collaboration event history
- Session analytics
- Participant statistics
- Code activity statistics
- Chat activity statistics
- Most-active participant analysis

> Session recording represents **collaboration/event replay data**, not a raw webcam or audio recording.

### AI-Powered Development

#### AI Code Reviewer

The editor includes an AI-powered code review workflow that can analyze code for areas such as:

- Bugs
- Code smells
- Naming issues
- Missing comments
- Security concerns
- Performance concerns

The system can use OpenAI when an API key is configured and provides local heuristic checks as a fallback.

#### AI Session Summary

Replay sessions can generate an AI-assisted summary based on recorded collaboration events.

The system supports:

- OpenAI-powered summaries when configured
- Local event-analysis fallback when an OpenAI API key is unavailable

---

# Architecture

```mermaid
flowchart TB

    User1[Developer]
    User2[Collaborator]

    subgraph Frontend["React Frontend"]
        UI[SyncSpace UI]
        Editor[Collaborative Code Editor]
        Whiteboard[Collaborative Whiteboard]
        Meeting[Video / Audio Meeting]
        Chat[Team Chat]
        Replay[Session Replay]
        AI[AI Features]
    end

    subgraph Realtime["Real-Time Layer"]
        Socket[Socket.IO]
        YJS[Yjs Synchronization]
        WebRTC[WebRTC]
    end

    subgraph Backend["Node.js / Express Backend"]
        API[REST API]
        Auth[Authentication]
        Rooms[Room Management]
        Execution[Code Execution]
        Documents[Documents]
        Files[File Management]
        ReplayAPI[Replay & Analytics]
    end

    subgraph Storage["Data & Services"]
        Mongo[(MongoDB)]
        Cloudinary[Cloudinary]
        ExternalExecution[Code Execution Service]
        OpenAI[OpenAI API - Optional]
    end

    User1 --> UI
    User2 --> UI

    UI --> Editor
    UI --> Whiteboard
    UI --> Meeting
    UI --> Chat
    UI --> Replay
    UI --> AI

    Editor --> YJS
    Editor --> Socket
    Whiteboard --> Socket
    Chat --> Socket
    Meeting --> WebRTC
    WebRTC --> Socket

    UI --> API

    API --> Auth
    API --> Rooms
    API --> Execution
    API --> Documents
    API --> Files
    API --> ReplayAPI

    Auth --> Mongo
    Rooms --> Mongo
    Documents --> Mongo
    ReplayAPI --> Mongo

    Files --> Cloudinary
    Execution --> ExternalExecution
    AI --> OpenAI
````

---

# Technology Stack

## Frontend

| Technology          | Purpose                                |
| ------------------- | -------------------------------------- |
| React               | User interface                         |
| Vite                | Frontend tooling and build system      |
| React Router        | Client-side routing                    |
| Monaco Editor       | Code editing                           |
| Yjs                 | Collaborative document synchronization |
| Socket.IO Client    | Real-time communication                |
| React Konva / Konva | Whiteboard rendering                   |
| Simple Peer         | WebRTC abstraction                     |
| Zustand             | Client-side state management           |
| React Query         | Server-state management                |
| Axios               | HTTP communication                     |
| Tailwind CSS        | UI styling                             |
| React Markdown      | Markdown rendering                     |

## Backend

| Technology         | Purpose                    |
| ------------------ | -------------------------- |
| Node.js            | Server runtime             |
| Express.js         | REST API                   |
| Socket.IO          | Real-time communication    |
| MongoDB            | Application database       |
| Mongoose           | MongoDB object modeling    |
| JWT                | Authentication             |
| bcryptjs           | Password hashing           |
| Joi                | Request validation         |
| Multer             | File handling              |
| Cloudinary         | Media/file storage         |
| Nodemailer         | Email functionality        |
| Helmet             | Security headers           |
| Express Rate Limit | Request rate limiting      |
| Mongo Sanitize     | MongoDB query sanitization |
| Compression        | Response compression       |
| Morgan             | HTTP request logging       |

## Real-Time Technologies

* **Socket.IO**
* **Yjs**
* **WebRTC**
* **y-protocols**
* **Simple Peer**

## AI

* OpenAI API integration
* AI Code Reviewer
* AI Session Summary
* Local heuristic fallback for selected AI functionality

---

# Core System Design

SyncSpace uses multiple communication mechanisms because different collaboration features have different synchronization requirements.

### REST API

Used for operations such as:

* Authentication
* User management
* Room management
* Documents
* Files
* Code execution
* Replay
* Analytics

### Socket.IO

Used for real-time application events such as:

* Room presence
* Chat
* Collaboration events
* Meeting signaling
* Cursor/presence updates
* Whiteboard synchronization
* Activity updates

### Yjs

Used for collaborative document synchronization, particularly for the code editor.

Yjs provides conflict-aware synchronization between multiple users editing shared content.

### WebRTC

Used for peer-to-peer:

* Audio
* Video
* Screen sharing

Socket.IO is used as the signaling layer for establishing and synchronizing meeting connections.

---

# Project Structure

```text
SyncSpace/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   └── ...
│   │
│   ├── package.json
│   └── vite.config.*
│
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── package.json
│
├── FEATURE_IMPLEMENTATION.md
├── LICENSE
├── README.md
├── package.json
└── package-lock.json
```

---

# API Overview

The backend exposes versioned REST endpoints under:

```text
/api/v1
```

### Authentication

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me
GET    /api/v1/auth/verify-email/:token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password/:token
```

### Users

```text
/api/v1/users
```

### Rooms

```text
/api/v1/rooms
```

### Chat

```text
/api/v1/chat
```

### Documents

```text
/api/v1/documents
```

### Files

```text
/api/v1/files
```

### Session Replay

```text
/api/v1/replay
```

### Code Execution

```text
POST /api/v1/execute
```

### AI Code Review

```text
POST /api/v1/execute/review
```

### Health Check

```text
GET /health
```

---

# Authentication & Security

The backend includes several security and reliability measures:

* JWT-based authentication
* Password hashing with bcrypt
* Protected API routes
* Request validation using Joi
* Authentication rate limiting
* Helmet security headers
* MongoDB query sanitization
* Configurable CORS
* HTTP request logging
* Response compression
* Environment-based configuration

Sensitive credentials and API keys should be supplied through environment variables and should never be committed to the repository.

---

# Environment Variables

## Frontend

Create:

```text
client/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

For production:

```env
VITE_API_URL=https://syncspace-backend-wahf.onrender.com/api/v1
VITE_SOCKET_URL=https://syncspace-backend-wahf.onrender.com
```

## Backend

Create:

```text
server/.env
```

The backend requires environment configuration for services such as:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

CLIENT_URL=http://localhost:5173

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=your_sender_email
```

Optional AI configuration:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
```

> Never commit real credentials, tokens, database URLs, or API keys to Git.

---

# Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* MongoDB / MongoDB Atlas
* Git

Optional services depending on enabled functionality:

* Cloudinary
* SMTP provider
* OpenAI API

---

## 1. Clone the Repository

```bash
git clone https://github.com/altafshaikh7/SyncSpace.git
cd SyncSpace
```

---

## 2. Install Dependencies

From the project root:

```bash
npm run install:all
```

This installs dependencies for both the frontend and backend.

---

## 3. Configure Environment Variables

Create the required `.env` files:

```text
client/.env
server/.env
```

Configure MongoDB, authentication, Cloudinary, SMTP, frontend URLs, and optional AI settings.

---

## 4. Start the Development Environment

Run both frontend and backend:

```bash
npm run dev
```

Or run them independently.

### Backend

```bash
npm run server
```

### Frontend

```bash
npm run client
```

The Vite development server will normally run on:

```text
http://localhost:5173
```

The backend will normally run on:

```text
http://localhost:5000
```

---

# Production Build

Build the frontend using:

```bash
npm run build
```

The production frontend build is generated in:

```text
client/dist
```

The backend can be started with:

```bash
npm start
```

---

# Deployment

The current deployment architecture separates the frontend and backend.

```text
                 ┌─────────────────────┐
                 │      GitHub Repo     │
                 │      SyncSpace       │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
      ┌───────────────┐           ┌────────────────┐
      │    Vercel     │           │     Render     │
      │    Frontend   │──────────▶│    Backend     │
      └───────────────┘           └───────┬────────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │   MongoDB   │
                                   └─────────────┘
```

### Frontend

Hosted on Vercel.

```text
https://sync-space-navy.vercel.app/
```

### Backend

Hosted on Render.

```text
https://syncspace-backend-wahf.onrender.com/
```

---

# Development Scripts

From the root directory:

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Start frontend and backend together    |
| `npm run server`      | Start backend development server       |
| `npm run client`      | Start frontend development server      |
| `npm run install:all` | Install client and server dependencies |
| `npm run build`       | Build frontend for production          |
| `npm start`           | Start production backend               |

### Client scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

### Server scripts

```bash
npm run dev
npm start
npm run lint
```

---

# Engineering Highlights

SyncSpace demonstrates practical implementation of several distributed and real-time application concepts:

### Real-Time State Synchronization

Yjs and Socket.IO are used together to synchronize collaborative application state and events across connected clients.

### Peer-to-Peer Communication

WebRTC provides the foundation for real-time audio, video, and screen-sharing functionality.

### Modular Backend Architecture

The Express backend separates responsibilities across:

* Routes
* Controllers
* Models
* Middleware
* Validators
* Services

This structure makes individual features easier to maintain and extend.

### Event-Based Collaboration

Collaboration activity is represented as events, enabling:

* Session replay
* Activity timelines
* Analytics
* AI-assisted session summaries

### AI With Fallback Behavior

Selected AI functionality supports an external OpenAI integration while maintaining local fallback behavior for supported use cases when an API key is unavailable.

---

# Current Feature Status

## Implemented

* Authentication
* Create / Join Rooms
* Real-time collaborative code editor
* Live cursor and user presence
* Collaborative whiteboard
* Team chat
* WebRTC video/audio
* Screen sharing
* QR room joining
* Sticky notes
* Follow Presenter mode
* Session recording/event capture
* Session replay
* Session analytics
* Document version history
* File sharing/upload
* AI Code Reviewer
* AI Session Summary
* Dark / Light theme
* Code execution
* HTML preview

## Future Roadmap

Potential future improvements include:

* AI Diagram Recognition
* AI Whiteboard Beautification
* AI Drawing Generation
* AI Interview Mode
* Voice Collaboration
* Smart Conflict Detection
* AI Task Extraction
* Built-in AI Assistant
* AI-enhanced Session Replay
* Smart Sticky Notes
* AI Project Planner
* Templates Library
* Achievement System
* Productivity Timer
* Additional export formats
* Advanced collaboration analytics

---

# Performance & Reliability Considerations

The application is designed around real-time communication and event synchronization.

Key considerations include:

* Event-driven communication using Socket.IO
* Collaborative document synchronization with Yjs
* WebRTC for peer-to-peer media
* MongoDB for persistent application data
* Cloudinary for media storage
* HTTP compression
* Request validation
* Authentication rate limiting
* Security middleware
* Health-check endpoint for deployment monitoring

---

# Contributing

Contributions, improvements, and bug reports are welcome.

### Development Workflow

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/your-feature
```

3. Make your changes.
4. Test locally.
5. Commit your changes.

```bash
git commit -m "feat: add your feature"
```

6. Push the branch.

```bash
git push origin feature/your-feature
```

7. Open a Pull Request.

---

# Known Limitations

Some advanced AI and collaboration ideas are not currently part of the implemented production feature set.

The project intentionally separates implemented functionality from future roadmap items rather than representing planned features as completed functionality.

External services such as MongoDB Atlas, Cloudinary, SMTP providers, code execution infrastructure, and OpenAI may require their own configuration, availability, quotas, or credentials.

---

# License

This project is licensed under the **MIT License**.

See the [LICENSE](LICENSE) file for details.

---

# Author

**Altaf Shaikh**

B.Tech Computer Science & Engineering

GitHub:
[https://github.com/altafshaikh7](https://github.com/altafshaikh7)

---

# Project Links

| Resource          | Link                                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------- |
| GitHub Repository | [https://github.com/altafshaikh7/SyncSpace](https://github.com/altafshaikh7/SyncSpace)                   |
| Live Application  | [https://sync-space-navy.vercel.app/](https://sync-space-navy.vercel.app/)                               |
| Backend API       | [https://syncspace-backend-wahf.onrender.com/](https://syncspace-backend-wahf.onrender.com/)             |
| API Health Check  | [https://syncspace-backend-wahf.onrender.com/health](https://syncspace-backend-wahf.onrender.com/health) |

---

<p align="center">
  Built with React, Node.js, MongoDB, Socket.IO, WebRTC, Yjs and modern web technologies.
</p>
```

## Is version mein kya important hai

Ye README **resume-style project description nahi** hai. Company/recruiter GitHub README ke liye maine intentionally:

* **Actual implemented features** rakhe hain.
* Future features ko clearly **Roadmap** mein rakha hai.
* Architecture diagram diya hai.
* Installation aur deployment reproducible banaya hai.
* Security section add kiya hai.
* API structure documented hai.
* AI features ko specifically explain kiya hai.
* `FEATURE_IMPLEMENTATION.md` ke actual implementation details ko reflect kiya hai.
* MIT License ko properly reference kiya hai.

