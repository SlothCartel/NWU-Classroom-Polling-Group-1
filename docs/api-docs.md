# NWU Live Poll API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Database Schema](#database-schema)
6. [WebSocket Events](#websocket-events)
7. [Deployment](#deployment)

---

## Overview

The NWU Live Poll API is a RESTful service built with Express.js and TypeScript that enables real-time classroom polling. The system supports lecturer-created polls with live student participation, automatic grading, and comprehensive analytics.

**Base URL:** `/api`
**API Documentation:** `/api-docs` (Swagger UI)

### Key Features
- Role-based authentication (lecturers and students)
- Real-time poll participation via WebSockets
- Live answer tracking and chart updates
- Automatic quiz grading with correct answer designation
- CSV/JSON data export for analysis
- Lobby management with participant tracking

### Technology Stack
- Node.js with Express.js
- PostgreSQL with Prisma ORM
- Socket.io for real-time communication
- JWT for authentication
- Swagger for API documentation

---

## Architecture

### Project Structure
```
apps/api/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # HTTP and WebSocket server initialization
│   ├── config/                # Configuration modules
│   ├── middleware/            # Authentication and validation
│   ├── routes/                # API route definitions
│   │   ├── auth/              # Authentication routes
│   │   ├── polls/             # Poll management routes
│   │   └── students/          # Student-specific routes
│   ├── services/              # Business logic layer
│   └── types/                 # TypeScript type definitions
└── prisma/
    └── schema.prisma          # Database schema
```

### Core Services
- **authService**: Handles JWT generation and validation
- **pollService**: Manages poll lifecycle and operations
- **participationService**: Processes student submissions
- **analyticsService**: Generates statistics and exports
- **socketService**: Manages real-time WebSocket connections

---

## Authentication

### Authentication Flow
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Roles
- **Lecturer**: Can create, manage, and view poll results
- **Student**: Can join polls and submit answers

### Endpoints

#### Lecturer Signup
```
POST /api/auth/lecturer/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Lecturer Login
```
POST /api/auth/lecturer/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: { "success": true, "data": { "user": {...}, "token": "..." } }
```

#### Student Signup
```
POST /api/auth/student/signup
Content-Type: application/json

{
  "name": "Jane Smith",
  "studentNumber": "12345678",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

#### Student Login
```
POST /api/auth/student/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

---

## API Endpoints

### Poll Management (Lecturer)

#### List All Polls
```
GET /api/polls
Authorization: Bearer <lecturer-token>

Response: { "success": true, "data": [...polls] }
```

#### Get Poll by ID
```
GET /api/polls/:id
Authorization: Bearer <token>
```

#### Create Poll
```
POST /api/polls
Authorization: Bearer <lecturer-token>
Content-Type: application/json

{
  "title": "Introduction to Databases Quiz",
  "timerSeconds": 30,
  "securityCode": "optional-code",
  "questions": [
    {
      "text": "What does SQL stand for?",
      "correctIndex": 0,
      "options": [
        { "text": "Structured Query Language", "index": 0 },
        { "text": "Simple Question Language", "index": 1 }
      ]
    }
  ]
}
```

#### Delete Poll
```
DELETE /api/polls/:id
Authorization: Bearer <lecturer-token>
```

### Poll Lifecycle

#### Open Poll (Lobby)
```
POST /api/polls/:id/open
Authorization: Bearer <lecturer-token>

Status: "open" - students can join the lobby
```

#### Start Poll
```
POST /api/polls/:id/start
Authorization: Bearer <lecturer-token>

Status: "active" - poll questions become visible
```

#### Close Poll
```
POST /api/polls/:id/close
Authorization: Bearer <lecturer-token>

Status: "closed" - submissions finalized, results available
```

### Student Participation

#### Get Poll by Join Code
```
GET /api/polls/code/:joinCode

Public endpoint - returns poll details for students
```

#### Join Poll
```
POST /api/polls/join
Content-Type: application/json

{
  "joinCode": "ABC123",
  "studentNumber": "12345678",
  "securityCode": "optional"
}
```

#### Record Live Answer Choice
```
POST /api/polls/:id/choices
Authorization: Bearer <student-token>
Content-Type: application/json

{
  "questionId": 1,
  "optionIndex": 0
}

Used for live chart updates during active polling
```

#### Submit Final Answers
```
POST /api/polls/:id/submit
Content-Type: application/json

{
  "studentNumber": "12345678",
  "securityCode": "optional",
  "answers": [
    { "questionId": 1, "optionIndex": 0 },
    { "questionId": 2, "optionIndex": 1 }
  ]
}

Creates submission record with calculated score
```

### Lobby Management

#### List Lobby Participants
```
GET /api/polls/:id/lobby
Authorization: Bearer <lecturer-token>

Response: [{ "id": 1, "name": "Jane", "studentNumber": "12345678" }]
```

#### Remove Student from Lobby
```
DELETE /api/polls/:id/lobby/:studentNumber
Authorization: Bearer <lecturer-token>
```

### Analytics and Export

#### Get Poll Statistics
```
GET /api/polls/:id/stats
Authorization: Bearer <lecturer-token>

Response includes per-question breakdown with correct/incorrect counts
```

#### Export Results
```
GET /api/polls/:id/export?format=csv
Authorization: Bearer <lecturer-token>

Returns CSV file with submission details
```

### Student History

#### List Student Submissions
```
GET /api/students/:studentNumber/submissions
Authorization: Bearer <student-token>
```

#### Delete Student Submission
```
DELETE /api/students/:studentNumber/submissions/:pollId
Authorization: Bearer <student-token>
```

---

## Database Schema

### Core Tables

**User**: Stores both lecturers and students (role-based)
**Poll**: Poll metadata with join code and timer settings
**Question**: Individual questions within a poll
**Option**: Answer choices for each question
**Vote**: Live answer selections (one per student per question)
**Submission**: Final submitted answers with scores
**Answer**: Individual answers within a submission
**LobbyEntry**: Tracks students who joined the lobby
**Analytics**: Aggregated participation data

### Key Relationships
- User → Poll (one-to-many, lecturer creates polls)
- Poll → Question (one-to-many)
- Question → Option (one-to-many)
- User → Vote (one-to-many, live selections)
- User → Submission (one-to-many, final submissions)
- Submission → Answer (one-to-many)

### Unique Constraints
- Vote: One live vote per user per question
- Submission: One submission per user per poll
- LobbyEntry: One entry per user per poll

---

## WebSocket Events

### Connection
```javascript
socket = io(API_URL, { auth: { token: JWT_TOKEN } });
```

### Client to Server

**join-poll**: Join a poll room
**leave-poll**: Leave a poll room
**select-answer**: Send live answer selection

### Server to Client

**user-joined**: New participant joined lobby
**user-left**: Participant left poll
**answer-selected**: Real-time answer selection broadcast
**poll-status-changed**: Poll lifecycle change (open/active/closed)
**poll-stats-updated**: Live statistics update
**kicked-from-poll**: Student removed from poll

---

## Deployment

### Environment Variables
```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
PORT=8080
```

### Docker Support
The API includes a Dockerfile for containerized deployment. The docker-compose.yml file orchestrates the API, database, and frontend services.

### Health Checks
```
GET /api/health
Response: { "success": true, "message": "API is running" }
```

### Azure Deployment
Configured for Azure App Service with the following:
- PostgreSQL database instance
- Application settings for environment variables
- CORS configuration for Vercel frontend integration
- WebSocket support enabled
