# NWU Live Poll API Documentation

> **⚠️ IMPORTANT SETUP NOTICES:**
>
> **🔧 REST Client Extension Required**: To test the API endpoints using the included `api.test.http` file, you must install the **REST Client** extension in VS Code. Search for "REST Client" by Huachao Mao in the VS Code extensions marketplace.
>
> **🗄️ Database Migration Required**: Before using the API, ensure you have migrated to the latest database schema by running:
>
> ```bash
> cd apps/api
> npx prisma migrate dev
> npx prisma generate
> ```

## Table of Contents

- [Overview](#overview)
- [Architecture & Technologies](#architecture--technologies)
- [Authentication & Authorization](#authentication--authorization)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
  - [Health & Info](#health--info)
  - [Authentication](#authentication-endpoints)
  - [Poll Management](#poll-management)
  - [Poll Lifecycle](#poll-lifecycle)
  - [Student Participation](#student-participation)
  - [Lobby Management](#lobby-management)
  - [Analytics & Statistics](#analytics--statistics)
  - [Student Submissions](#student-submissions)
- [WebSocket Integration](#websocket-integration)
- [Frontend Integration Guide](#frontend-integration-guide)
- [Error Handling](#error-handling)
- [Development & Testing](#development--testing)

---

## Overview

The NWU Live Poll API is a RESTful API built with Express.js and TypeScript that powers a real-time classroom polling system. It supports lecturer poll creation/management and student participation with live feedback and analytics.

**Base URL**: `http://localhost:8080/api`

**Current Version**: `1.0.0`

---

## Architecture & Technologies

### Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: express-validator
- **Real-time**: Socket.io
- **Security**: bcryptjs, CORS

### Project Structure

```
src/
├── app.ts              # Express app configuration
├── server.ts           # Server startup
├── db.ts               # Database connection
├── config/
│   └── database.ts     # Prisma client setup
├── middleware/
│   ├── auth.ts         # JWT authentication & authorization
│   ├── errorHandler.ts # Global error handling
│   └── validation.ts   # Request validation middleware
├── routes/
│   ├── auth/           # Authentication endpoints
│   ├── polls/          # Poll management endpoints
│   └── students/       # Student-specific endpoints
├── services/
│   ├── authService.ts         # Authentication business logic
│   ├── pollService.ts         # Poll CRUD operations
│   ├── participationService.ts # Student participation logic
│   ├── analyticsService.ts    # Statistics & reporting
│   └── socketService.ts       # Real-time WebSocket handling
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
interface JWTPayload {
  userId: number;
  email: string;
  role: "student" | "lecturer";
  iat: number; // issued at
  exp: number; // expires at (7 days)
}
```

### User Roles

- **`student`**: Can join polls, submit answers, view their submission history
- **`lecturer`**: Can create/manage polls, view analytics, control poll lifecycle

### Protected Route Headers

```http
Authorization: Bearer <jwt_token>
```

### Role-Based Access Control

- Routes use `authenticateToken` middleware for authentication
- Routes use `requireRole(['lecturer'])` or `requireRole(['student'])` for authorization
- Students can only access their own data (enforced by studentNumber matching)

---

## Database Schema

### Core Models

#### User

```prisma
model User {
  id            Int      @id @default(autoincrement())
  name          String
  email         String   @unique
  studentNumber String?  @unique  // Only for students
  password      String   // bcrypt hashed
  role          String   // 'student' | 'lecturer'
  created_at    DateTime @default(now())

  # Relations
  Polls         Poll[]   @relation("CreatedPolls")
  Votes         Vote[]
  Submissions   Submission[]
}
```

#### Poll

```prisma
model Poll {
  id           Int       @id @default(autoincrement())
  title        String
  description  String?
  joinCode     String    @unique  // 6-char code for joining
  status       String    @default("draft") // 'draft'|'open'|'live'|'closed'
  timerSeconds Int       @default(30)
  securityCode String?   // Optional 4-digit code
  created_by   Int
  created_at   DateTime  @default(now())
  expires_at   DateTime?

  # Relations
  questions    Question[]
  analytics    Analytics[]
  submissions  Submission[]
  creator      User      @relation(fields: [created_by], references: [id], name: "CreatedPolls")
}
```

#### Question

```prisma
model Question {
  id            Int    @id @default(autoincrement())
  poll_id       Int
  question_text String
  question_type String  // Currently only 'multiple_choice'
  correctIndex  Int?    // 0-based index of correct option

  # Relations
  options  Option[]
  votes    Vote[]
  answers  Answer[]
  poll     Poll     @relation(fields: [poll_id], references: [id])
}
```

#### Option

```prisma
model Option {
  id          Int    @id @default(autoincrement())
  question_id Int
  option_text String
  optionIndex Int    // A=0, B=1, C=2, D=3

  # Relations
  votes    Vote[]
  answers  Answer[]
  question Question @relation(fields: [question_id], references: [id])
}
```

#### Submission

```prisma
model Submission {
  id           Int      @id @default(autoincrement())
  poll_id      Int
  user_id      Int
  score        Int      // Number of correct answers
  total        Int      // Total number of questions
  submitted_at DateTime @default(now())

  # Relations
  answers Answer[]
  poll    Poll     @relation(fields: [poll_id], references: [id])
  user    User     @relation(fields: [user_id], references: [id])

  @@unique([poll_id, user_id]) // One submission per user per poll
}
```

---

## API Endpoints

### Health & Info

#### GET `/api`

**Purpose**: API status and endpoint overview
**Auth**: None required

**Response**:

```json
{
  "success": true,
  "message": "NWU Live Poll API is running",
  "timestamp": "2025-01-23T10:30:00.000Z",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "polls": "/api/polls",
    "students": "/api/students"
  }
}
```

#### GET `/api/health`

**Purpose**: Health check endpoint
**Auth**: None required

**Response**:

```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2025-01-23T10:30:00.000Z"
}
```

---

### Authentication Endpoints

#### POST `/api/auth/lecturer/signup`

**Purpose**: Register a new lecturer account
**Auth**: None required

**Request Body**:

```json
{
  "name": "Dr. John Smith",
  "email": "john.smith@nwu.ac.za",
  "password": "securePassword123"
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Dr. John Smith",
      "email": "john.smith@nwu.ac.za",
      "role": "lecturer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/lecturer/login`

**Purpose**: Authenticate lecturer and get JWT token
**Auth**: None required

**Request Body**:

```json
{
  "email": "john.smith@nwu.ac.za",
  "password": "securePassword123"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Dr. John Smith",
      "email": "john.smith@nwu.ac.za",
      "role": "lecturer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/student/signup`

**Purpose**: Register a new student account
**Auth**: None required

**Request Body**:

```json
{
  "name": "Jane Doe",
  "email": "jane.doe@nwu.ac.za",
  "studentNumber": "12345678",
  "password": "securePassword123"
}
```

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane.doe@nwu.ac.za",
      "role": "student",
      "studentNumber": "12345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/student/login`

**Purpose**: Authenticate student and get JWT token
**Auth**: None required

**Request Body**:

```json
{
  "email": "jane.doe@nwu.ac.za",
  "password": "securePassword123"
}
```

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 2,
      "name": "Jane Doe",
      "email": "jane.doe@nwu.ac.za",
      "role": "student",
      "studentNumber": "12345678"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Poll Management

#### GET `/api/polls`

**Purpose**: Get all polls created by authenticated lecturer
**Auth**: Required (Lecturer only)

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "Introduction to Physics Quiz",
      "description": "Test your basic physics knowledge",
      "joinCode": "ABC123",
      "status": "draft",
      "timerSeconds": 300,
      "securityCode": null,
      "createdAt": "2025-01-23T09:00:00.000Z",
      "submissionCount": 0,
      "questions": [
        {
          "text": "What is the speed of light?",
          "correctIndex": 2,
          "options": [
            { "text": "299,792,458 m/s", "index": 0 },
            { "text": "300,000,000 m/s", "index": 1 },
            { "text": "299,792,458 m/s", "index": 2 },
            { "text": "150,000,000 m/s", "index": 3 }
          ]
        }
      ]
    }
  ]
}
```

#### GET `/api/polls/:id`

**Purpose**: Get specific poll details
**Auth**: Required (Any role)
**Note**: Students don't see correct answers (`correctIndex` is `undefined`)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Introduction to Physics Quiz",
    "description": "Test your basic physics knowledge",
    "joinCode": "ABC123",
    "status": "live",
    "timerSeconds": 300,
    "securityCode": null,
    "createdAt": "2025-01-23T09:00:00.000Z",
    "questions": [
      {
        "text": "What is the speed of light?",
        "correctIndex": 2, // Only visible to lecturers
        "options": [
          { "text": "299,792,458 m/s", "index": 0 },
          { "text": "300,000,000 m/s", "index": 1 },
          { "text": "299,792,458 m/s", "index": 2 },
          { "text": "150,000,000 m/s", "index": 3 }
        ]
      }
    ]
  }
}
```

#### POST `/api/polls`

**Purpose**: Create a new poll
**Auth**: Required (Lecturer only)

**Request Body**:

```json
{
  "title": "Introduction to Physics Quiz",
  "description": "Test your basic physics knowledge",
  "questions": [
    {
      "text": "What is the speed of light?",
      "correctIndex": 2,
      "options": [
        { "text": "299,792,458 m/s", "index": 0 },
        { "text": "300,000,000 m/s", "index": 1 },
        { "text": "299,792,458 m/s", "index": 2 },
        { "text": "150,000,000 m/s", "index": 3 }
      ]
    }
  ],
  "timerSeconds": 300,
  "securityCode": "1234"
}
```

**Validation Rules**:

- `title`: Required, non-empty string
- `questions`: Required array with at least 1 question
- `questions[].text`: Required, non-empty string
- `questions[].options`: Required array with at least 2 options
- `questions[].correctIndex`: Required integer ≥ 0
- `timerSeconds`: Optional integer (default: 30)
- `securityCode`: Optional string

**Response (201)**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Introduction to Physics Quiz",
    "description": "Test your basic physics knowledge",
    "joinCode": "ABC123",
    "status": "draft",
    "timerSeconds": 300,
    "securityCode": "1234",
    "createdAt": "2025-01-23T09:00:00.000Z",
    "questions": [
      {
        "text": "What is the speed of light?",
        "correctIndex": 2,
        "options": [
          { "text": "299,792,458 m/s", "index": 0 },
          { "text": "300,000,000 m/s", "index": 1 },
          { "text": "299,792,458 m/s", "index": 2 },
          { "text": "150,000,000 m/s", "index": 3 }
        ]
      }
    ]
  }
}
```

#### PUT `/api/polls/:id`

**Purpose**: Update existing poll
**Auth**: Required (Lecturer only, must be poll creator)
**Status**: NOT YET IMPLEMENTED

**Response (501)**:

```json
{
  "success": false,
  "error": "Update functionality not implemented yet"
}
```

#### DELETE `/api/polls/:id`

**Purpose**: Delete a poll
**Auth**: Required (Lecturer only, must be poll creator)

**Response (200)**:

```json
{
  "success": true,
  "message": "Poll deleted successfully"
}
```

---

### Poll Lifecycle

#### POST `/api/polls/:id/open`

**Purpose**: Open poll for student joining (lobby phase)
**Auth**: Required (Lecturer only)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Introduction to Physics Quiz",
    "status": "open"
    // ... other poll data
  }
}
```

#### POST `/api/polls/:id/start`

**Purpose**: Start poll (make it live for answering)
**Auth**: Required (Lecturer only)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Introduction to Physics Quiz",
    "status": "live"
    // ... other poll data
  }
}
```

#### POST `/api/polls/:id/close`

**Purpose**: Close/end poll
**Auth**: Required (Lecturer only)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Introduction to Physics Quiz",
    "status": "closed"
    // ... other poll data
  }
}
```

**Poll Status Flow**:

```
draft → open → live → closed
  ↑       ↑      ↓       ↓
  └───────┴──────┴───────┘
     (Lecturer can reopen)
```

---

### Student Participation

#### GET `/api/polls/code/:joinCode`

**Purpose**: Get poll details by join code (for students)
**Auth**: None required

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Introduction to Physics Quiz",
    "description": "Test your basic physics knowledge",
    "status": "live",
    "timerSeconds": 300,
    "questions": [
      {
        "text": "What is the speed of light?",
        "options": [
          { "text": "299,792,458 m/s", "index": 0 },
          { "text": "300,000,000 m/s", "index": 1 },
          { "text": "299,792,458 m/s", "index": 2 },
          { "text": "150,000,000 m/s", "index": 3 }
        ]
      }
    ]
  }
}
```

#### POST `/api/polls/join`

**Purpose**: Join a poll (student registration)
**Auth**: None required

**Request Body**:

```json
{
  "joinCode": "ABC123",
  "studentNumber": "12345678",
  "securityCode": "1234" // Optional
}
```

**Validation Rules**:

- `joinCode`: Required, non-empty string
- `studentNumber`: Required, non-empty string
- `securityCode`: Optional, required if poll has security code
- Student must exist in database
- Poll must be in 'open' or 'live' status
- Student cannot have already submitted for this poll

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Introduction to Physics Quiz",
    "description": "Test your basic physics knowledge",
    "status": "live",
    "timerSeconds": 300,
    "questions": [
      {
        "id": 1,
        "text": "What is the speed of light?",
        "options": [
          { "text": "299,792,458 m/s", "index": 0 },
          { "text": "300,000,000 m/s", "index": 1 },
          { "text": "299,792,458 m/s", "index": 2 },
          { "text": "150,000,000 m/s", "index": 3 }
        ]
      }
    ]
  }
}
```

#### POST `/api/polls/:id/choices`

**Purpose**: Record live choice during poll (real-time tracking)
**Auth**: Required (Student only)
**Note**: This is primarily for WebSocket fallback. Real-time choices are handled via Socket.io.

**Response (200)**:

```json
{
  "success": true,
  "message": "Choice recorded"
}
```

#### POST `/api/polls/:id/submit`

**Purpose**: Submit final answers for grading
**Auth**: Required (Student only)

**Request Body**:

```json
{
  "answers": [
    {
      "questionId": 1,
      "optionIndex": 2
    },
    {
      "questionId": 2,
      "optionIndex": 0
    }
  ]
}
```

**Validation Rules**:

- `answers`: Required array with at least 1 answer
- `answers[].questionId`: Required integer
- `answers[].optionIndex`: Required integer ≥ 0
- Poll must be 'live' or 'closed'
- Student cannot submit twice for same poll

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "score": 1,
    "total": 2,
    "feedback": [
      {
        "questionIndex": 0,
        "questionText": "What is the speed of light?",
        "studentChoice": "299,792,458 m/s",
        "correctChoice": "299,792,458 m/s",
        "isCorrect": true
      },
      {
        "questionIndex": 1,
        "questionText": "What is gravity on Earth?",
        "studentChoice": "9.8 m/s²",
        "correctChoice": "9.81 m/s²",
        "isCorrect": false
      }
    ]
  }
}
```

---

### Lobby Management

#### GET `/api/polls/:id/lobby`

**Purpose**: Get list of students in poll lobby
**Auth**: Required (Lecturer only)

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "Jane Doe",
      "studentNumber": "12345678",
      "joinedAt": "2025-01-23T10:15:00.000Z"
    },
    {
      "id": 3,
      "name": "Bob Smith",
      "studentNumber": "87654321",
      "joinedAt": "2025-01-23T10:16:00.000Z"
    }
  ]
}
```

#### DELETE `/api/polls/:id/lobby/:studentNumber`

**Purpose**: Remove student from poll lobby
**Auth**: Required (Lecturer only)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Student removed from poll"
  }
}
```

---

### Analytics & Statistics

#### GET `/api/polls/:id/stats`

**Purpose**: Get real-time poll statistics
**Auth**: Required (Lecturer only)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "pollId": 1,
    "title": "Introduction to Physics Quiz",
    "status": "closed",
    "totalSubmissions": 25,
    "averageScore": 1.8,
    "averagePercentage": 90.0,
    "questions": [
      {
        "questionId": 1,
        "questionText": "What is the speed of light?",
        "totalAnswers": 25,
        "correctAnswers": 23,
        "correctPercentage": 92.0,
        "options": [
          {
            "text": "299,792,458 m/s",
            "index": 0,
            "count": 1,
            "percentage": 4.0,
            "isCorrect": false
          },
          {
            "text": "300,000,000 m/s",
            "index": 1,
            "count": 1,
            "percentage": 4.0,
            "isCorrect": false
          },
          {
            "text": "299,792,458 m/s",
            "index": 2,
            "count": 23,
            "percentage": 92.0,
            "isCorrect": true
          },
          {
            "text": "150,000,000 m/s",
            "index": 3,
            "count": 0,
            "percentage": 0.0,
            "isCorrect": false
          }
        ]
      }
    ]
  }
}
```

#### GET `/api/polls/:id/export`

**Purpose**: Export poll results
**Auth**: Required (Lecturer only)

**Query Parameters**:

- `format`: 'json' (default) | 'csv'

**Response for JSON (200)**:

```json
{
  "success": true,
  "data": {
    // Same structure as stats endpoint
  }
}
```

**Response for CSV (200)**:

```
Content-Type: text/csv
Content-Disposition: attachment; filename=poll_1_results.csv

question,totalAnswers,correctAnswers,correctPercentage,option_0_count,option_0_percentage...
```

---

### Student Submissions

#### GET `/api/students/:studentNumber/submissions`

**Purpose**: Get student's submission history
**Auth**: Required (Student can only access own data)

**Response (200)**:

```json
{
  "success": true,
  "data": [
    {
      "pollId": "1",
      "pollTitle": "Introduction to Physics Quiz",
      "score": 1,
      "total": 2,
      "percentage": 50,
      "submittedAt": "2025-01-23T10:30:00.000Z",
      "feedback": [
        {
          "questionText": "What is the speed of light?",
          "studentChoice": "299,792,458 m/s",
          "isCorrect": true
        },
        {
          "questionText": "What is gravity on Earth?",
          "studentChoice": "9.8 m/s²",
          "isCorrect": false
        }
      ]
    }
  ]
}
```

#### DELETE `/api/students/:studentNumber/submissions/:pollId`

**Purpose**: Delete student's submission from history
**Auth**: Required (Student can only delete own data)

**Response (200)**:

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Submission deleted successfully"
  }
}
```

---

## WebSocket Integration

The API includes Socket.io for real-time features:

### Connection

```javascript
const socket = io("http://localhost:8080", {
  auth: {
    token: "your_jwt_token",
  },
});
```

### Events

#### Client → Server

- `join-poll`: Join a poll room
- `leave-poll`: Leave a poll room
- `select-answer`: Record live answer selection

#### Server → Client

- `poll-status-changed`: Poll status updated (open/live/closed)
- `user-joined`: Someone joined the poll
- `user-left`: Someone left the poll
- `answer-selected`: Live answer selection
- `poll-stats-updated`: Real-time statistics update
- `kicked-from-poll`: Student was kicked from poll

### Example Usage

```javascript
// Join poll room
socket.emit("join-poll", "poll-123");

// Listen for status changes
socket.on("poll-status-changed", (data) => {
  console.log(`Poll ${data.pollId} status: ${data.status}`);
});

// Record answer selection
socket.emit("select-answer", {
  pollId: "poll-123",
  questionId: 1,
  optionIndex: 2,
});
```

---

## Frontend Integration Guide

### Authentication Flow

1. **Login/Signup**:

```javascript
const authResponse = await fetch("/api/auth/lecturer/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "lecturer@nwu.ac.za",
    password: "password123",
  }),
});

const { data } = await authResponse.json();
const { user, token } = data;

// Store token for subsequent requests
localStorage.setItem("authToken", token);
```

2. **Authenticated Requests**:

```javascript
const token = localStorage.getItem("authToken");

const response = await fetch("/api/polls", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

### Poll Creation Flow (Lecturer)

```javascript
const createPoll = async (pollData) => {
  const response = await fetch("/api/polls", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "My Quiz",
      questions: [
        {
          text: "What is 2+2?",
          correctIndex: 1,
          options: [
            { text: "3", index: 0 },
            { text: "4", index: 1 },
            { text: "5", index: 2 },
            { text: "6", index: 3 },
          ],
        },
      ],
      timerSeconds: 300,
      securityCode: "1234",
    }),
  });

  return await response.json();
};
```

### Poll Management Flow (Lecturer)

```javascript
// Open poll for joining
const openPoll = async (pollId) => {
  const response = await fetch(`/api/polls/${pollId}/open`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
};

// Start poll (make live)
const startPoll = async (pollId) => {
  const response = await fetch(`/api/polls/${pollId}/start`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
};

// Close poll
const closePoll = async (pollId) => {
  const response = await fetch(`/api/polls/${pollId}/close`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
};
```

### Student Participation Flow

1. **Join Poll**:

```javascript
const joinPoll = async (joinCode, studentNumber, securityCode) => {
  // First get poll details
  const pollResponse = await fetch(`/api/polls/code/${joinCode}`);
  const poll = await pollResponse.json();

  // Then join the poll
  const joinResponse = await fetch("/api/polls/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      joinCode,
      studentNumber,
      securityCode,
    }),
  });

  return await joinResponse.json();
};
```

2. **Submit Answers**:

```javascript
const submitAnswers = async (pollId, answers, token) => {
  const response = await fetch(`/api/polls/${pollId}/submit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      answers: [
        { questionId: 1, optionIndex: 2 },
        { questionId: 2, optionIndex: 0 },
      ],
    }),
  });

  return await response.json();
};
```

### Real-time Integration

```javascript
import io from "socket.io-client";

// Connect with authentication
const socket = io("http://localhost:8080", {
  auth: {
    token: localStorage.getItem("authToken"),
  },
});

// Join poll room
socket.emit("join-poll", pollId);

// Listen for real-time updates
socket.on("poll-status-changed", (data) => {
  if (data.status === "live") {
    // Show poll questions
    startPoll(data.data);
  } else if (data.status === "closed") {
    // Show results
    endPoll();
  }
});

// Send live answer selection
const selectAnswer = (questionId, optionIndex) => {
  socket.emit("select-answer", {
    pollId,
    questionId,
    optionIndex,
  });
};

// Listen for other students' selections (for lecturer stats)
socket.on("answer-selected", (data) => {
  updateLiveStats(data);
});
```

### Error Handling

```javascript
const handleApiCall = async (apiCall) => {
  try {
    const response = await apiCall();

    if (!response.success) {
      throw new Error(response.error || "API call failed");
    }

    return response.data;
  } catch (error) {
    console.error("API Error:", error.message);

    // Handle specific error cases
    if (error.message === "Invalid token") {
      // Redirect to login
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }

    throw error;
  }
};

// Usage
try {
  const polls = await handleApiCall(() =>
    fetch("/api/polls", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json()),
  );
} catch (error) {
  setErrorMessage(error.message);
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message",
  "details": [] // Optional validation details
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created successfully
- `400`: Bad request / Validation error
- `401`: Unauthorized (no/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Internal server error
- `501`: Not implemented

### Common Error Scenarios

#### Authentication Errors

```json
{
  "success": false,
  "error": "Access token required"
}
```

```json
{
  "success": false,
  "error": "Invalid token"
}
```

```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

#### Validation Errors

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Valid email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

#### Business Logic Errors

```json
{
  "success": false,
  "error": "Poll not found"
}
```

```json
{
  "success": false,
  "error": "You have already participated in this poll"
}
```

---

## Development & Testing

### Environment Setup

1. Install dependencies: `npm install`
2. Set up environment variables in `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/nwu_polls"
   JWT_SECRET="your-secret-key"
   FRONTEND_URL="http://localhost:3000"
   ```
3. Run database migrations: `npx prisma migrate dev`
4. Generate Prisma client: `npx prisma generate`
5. Start development server: `npm run dev`

### Testing with HTTP Files

Use the provided `api.test.http` file with REST Client extension in VS Code:

```http
### Variables
@baseUrl = http://localhost:8080/api
@lecturerToken = your_lecturer_jwt_token
@studentToken = your_student_jwt_token

### Create Poll
POST {{baseUrl}}/polls
Content-Type: application/json
Authorization: Bearer {{lecturerToken}}

{
  "title": "Test Poll",
  "questions": [
    {
      "text": "What is 2 + 2?",
      "correctIndex": 1,
      "options": [
        { "text": "3", "index": 0 },
        { "text": "4", "index": 1 },
        { "text": "5", "index": 2 },
        { "text": "6", "index": 3 }
      ]
    }
  ],
  "timerSeconds": 300
}
```

### Database Management

- View database: `npx prisma studio`
- Reset database: `npx prisma migrate reset`
- Generate new migration: `npx prisma migrate dev --name your_migration_name`

### Key Implementation Notes

1. **Security**: All passwords are hashed with bcrypt before storage
2. **Join Codes**: Auto-generated 6-character alphanumeric codes
3. **Poll Status Flow**: draft → open → live → closed (can reopen)
4. **Real-time**: WebSocket integration for live updates
5. **Validation**: Comprehensive request validation with express-validator
6. **Error Handling**: Consistent error response format across all endpoints
7. **Authorization**: Role-based access control with JWT middleware
8. **Database**: Prisma ORM with PostgreSQL, optimized queries with includes

This API is designed to be REST-compliant, type-safe, and production-ready with comprehensive error handling and real-time capabilities.
