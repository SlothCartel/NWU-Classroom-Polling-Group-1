# NWU Live Poll Frontend Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Application Flow](#application-flow)
4. [Page Components](#page-components)
5. [State Management](#state-management)
6. [API Integration](#api-integration)
7. [Real-time Features](#real-time-features)
8. [Deployment](#deployment)

---

## Overview

The NWU Live Poll frontend is a React-based single-page application that provides an intuitive interface for classroom polling. Built with TypeScript and Vite, the application offers separate workflows for lecturers and students with real-time updates and responsive design.

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- Tailwind CSS for styling
- Socket.io client for WebSocket communication
- Fetch API for HTTP requests

**Key Features:**
- Role-based routing with authentication guards
- Real-time poll participation and live charts
- Responsive design for mobile and desktop
- Automatic quiz grading and feedback
- Submission history for students
- Poll analytics and CSV export for lecturers

---

## Architecture

### Project Structure
```
apps/web/
├── src/
│   ├── App.tsx                # Main routing configuration
│   ├── main.tsx               # Application entry point
│   ├── components/
│   │   ├── guards.tsx         # Route protection components
│   │   └── Navbar.tsx         # Navigation component
│   ├── lib/
│   │   ├── api.ts             # API service layer
│   │   ├── auth.ts            # Authentication utilities
│   │   ├── http.ts            # HTTP client wrapper
│   │   ├── socket.ts          # WebSocket client
│   │   ├── studentAuth.ts     # Student-specific auth
│   │   └── types.ts           # TypeScript definitions
│   ├── pages/
│   │   ├── LoginPage.tsx      # Landing page with role selection
│   │   ├── LecturerLoginPage.tsx
│   │   ├── LecturerSignupPage.tsx
│   │   ├── StudentLoginPage.tsx
│   │   ├── StudentSignupPage.tsx
│   │   ├── AdminPage.tsx      # Lecturer dashboard
│   │   ├── DashboardPage.tsx  # Poll management
│   │   ├── StatsPage.tsx      # Poll analytics
│   │   ├── StudentPage.tsx    # Student dashboard
│   │   └── JoinPage.tsx       # Poll participation
│   └── assets/                # Static resources
└── public/                    # Public assets
```

### Design Patterns

**Route Guards**: Higher-order components that protect routes based on user role
**Service Layer**: Abstracted API calls in `lib/api.ts` for clean separation
**Type Safety**: Comprehensive TypeScript interfaces for all data structures
**Error Handling**: Centralized error handling in HTTP client with user feedback

---

## Application Flow

### Authentication Flow

1. User lands on `/login` (role selection)
2. Based on role selection, redirect to lecturer or student login
3. On successful authentication, JWT token stored in localStorage
4. Role-based redirect to appropriate dashboard
5. Protected routes validate token and role before rendering

### Lecturer Workflow

1. Login/Signup → Dashboard
2. Create new poll with questions and options
3. Open poll (generates join code, opens lobby)
4. Monitor lobby participants
5. Start poll when ready (activates questions)
6. View live answer statistics
7. Close poll and view final results
8. Export data as CSV for analysis

### Student Workflow

1. Login/Signup → Student Dashboard
2. Enter join code
3. Wait in lobby until lecturer starts
4. Answer questions within timer limits
5. Submit answers (automatic grading)
6. View score and feedback
7. Access submission history

---

## Page Components

### LoginPage
Landing page with role selection buttons directing to lecturer or student authentication flows.

### LecturerLoginPage / LecturerSignupPage
Standard authentication forms with email/password validation. On success, stores JWT token and redirects to dashboard.

### StudentLoginPage / StudentSignupPage
Requires student number, email, and password. Validates student credentials and redirects to student dashboard.

### AdminPage (Lecturer Dashboard)
Primary lecturer interface displaying:
- List of created polls with status badges
- Create new poll form with question builder
- Quick actions (open, start, close, delete)
- Navigation to detailed statistics

**Poll Creation Form:**
- Poll title input
- Timer configuration (seconds per question)
- Optional security code
- Dynamic question builder (add/remove questions)
- Option builder with correct answer designation
- Preview of poll structure

### DashboardPage
Extended poll management with bulk operations and filtering by poll status.

### StatsPage
Detailed analytics for a specific poll:
- Participant list with join timestamps
- Per-question breakdown showing correct/incorrect/unanswered counts
- Visual charts for result distribution
- CSV export functionality
- Real-time updates during active polling

### StudentPage
Student dashboard showing:
- Join poll interface with code input
- Submission history with scores
- Past poll results and feedback
- Profile information

### JoinPage
Active poll participation interface:
- Lobby view with waiting state
- Question display with timer
- Multiple choice options
- Progress indicator
- Automatic submission on timer expiry
- Score and feedback on completion

---

## State Management

### Local State
React hooks (useState, useEffect) manage component-level state for forms, modals, and UI interactions.

### Authentication State
Stored in localStorage:
- `token`: JWT authentication token
- `role`: User role (lecturer or student)
- `studentNumber`: Student identifier (students only)

### Real-time State
WebSocket events update UI state for:
- Lobby participant counts
- Live answer selections
- Poll status changes
- Statistics updates

### API State
Service functions in `api.ts` handle asynchronous operations with promises. Loading states and error boundaries provide user feedback during API calls.

---

## API Integration

### HTTP Client (`lib/http.ts`)
Centralized HTTP client wrapping fetch API with:
- Automatic JWT token injection
- Response parsing and error handling
- CORS configuration
- Request/response logging

### API Service (`lib/api.ts`)
High-level API functions organized by domain:

**Authentication:**
- `lecturerSignIn(email, password)`
- `lecturerSignUp(name, email, password)`
- `studentSignIn(identifier, password)`
- `studentSignUp(name, studentNumber, email, password)`

**Poll Management:**
- `listPolls()`: Fetch all lecturer polls
- `createPoll(data)`: Create new poll
- `getPollById(id)`: Fetch poll details
- `updatePoll(id, data)`: Modify existing poll
- `deletePoll(id)`: Remove poll
- `openPoll(id)`: Open lobby
- `startPoll(id)`: Activate questions
- `closePoll(id)`: Finalize submissions

**Student Participation:**
- `getPollByCode(joinCode)`: Look up poll
- `studentJoin(joinCode, studentNumber, securityCode)`: Join lobby
- `recordLiveChoice(pollId, questionId, optionIndex)`: Send live answer
- `submitAnswers(pollId, answers, studentNumber)`: Submit final answers

**Analytics:**
- `getPollStats(id)`: Get statistics
- `exportPollCsv(id)`: Download results
- `listStudentSubmissions(studentNumber)`: Submission history

**Lobby Management:**
- `listLobby(id)`: Get participants
- `kickFromLobby(id, studentNumber)`: Remove student

### Data Normalization
API responses are transformed to consistent frontend types using mapper functions, handling variations in backend response structures.

---

## Real-time Features

### WebSocket Client (`lib/socket.ts`)
Socket.io client manages bidirectional communication:

**Connection Setup:**
```javascript
socket = io(API_URL, {
  auth: { token: getToken() },
  reconnection: true
});
```

**Event Subscriptions:**
- `user-joined`: Update lobby participant list
- `user-left`: Remove participant from lobby
- `answer-selected`: Update live statistics
- `poll-status-changed`: Transition UI state
- `poll-stats-updated`: Refresh analytics
- `kicked-from-poll`: Force navigation away

**Event Emission:**
- `join-poll`: Subscribe to poll updates
- `leave-poll`: Unsubscribe from poll
- `select-answer`: Broadcast answer selection

### Live Updates
Real-time features are implemented across multiple pages:
- Lecturer sees live lobby updates
- Live charts update as students answer
- Students receive poll status changes
- Automatic page transitions on poll state changes

---

## Deployment

### Environment Configuration
Vite environment variables (`.env`):
```
VITE_API_URL=https://api.example.com
VITE_WS_URL=wss://api.example.com
```

### Build Process
```bash
npm run build       # Production build
npm run preview     # Preview production build
npm run dev         # Development server
```

### Vercel Deployment
The application is configured for Vercel deployment with:
- Automatic builds on git push
- Environment variable configuration via dashboard
- Custom domain support
- Edge caching for static assets

**vercel.json Configuration:**
- SPA routing fallback to index.html
- CORS headers for API communication
- Build output directory configuration

### Docker Support
Includes Dockerfile for containerized deployment with nginx serving static files.

### Browser Compatibility
Targets modern browsers with ES2020+ support. Responsive design tested on mobile, tablet, and desktop viewports.
