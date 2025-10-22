# 🟣 NWU Live Poll
> _Empowering classrooms with real-time interaction._

![Tech Stack](https://img.shields.io/badge/stack-React%20%7C%20Node.js%20%7C%20PostgreSQL%20%7C%20Docker%20%7C%20Vercel-purple)

---

## 🎯 Overview
**NWU Live Poll** is a full-stack, real-time classroom polling system built for **North-West University (NWU)**.  
It enables lecturers to create live polls, quizzes, and surveys — and lets students participate instantly from any device, no third-party apps or accounts required.

The platform was developed to replace tools like **Kahoot!** and **Slido**, offering:
- Lower cost  
- POPIA compliance  
- Seamless in-class engagement  
- Institutional control over data  

---

## 🧩 Core Features

| Feature | Description |
|----------|--------------|
| **Real-Time Polling** | Instant feedback using WebSockets (Socket.IO). |
| **Role-Based Access** | Separate lecturer and student experiences. |
| **Guest or Authenticated Access** | Join via join code or optional login. |
| **Analytics Dashboard** | Live participation charts and poll results. |
| **Automatic Grading** | Real-time answer validation and scoring. |
| **CSV Export** | Poll results exportable for analysis. |
| **Responsive UI** | Optimized for mobile and desktop. |

---

## ⚙️ Technology Stack

### Front-End
- React 18 + TypeScript + Vite  
- Tailwind CSS + ShadCN UI  
- Socket.IO client for live updates  
- Hosted on **Vercel**

### Back-End
- Node.js + Express  
- PostgreSQL + Prisma ORM  
- Socket.IO server for real-time events  
- JWT authentication  
- Containerized via **Docker**

### Supporting Tools
- Docker Compose for local orchestration  
- ESLint + Prettier for code quality  
- GitHub Actions for CI/CD automation  

---

## 🗂️ Project Structure

NWU-Classroom-Polling-Group-1/
├── apps/
│ ├── api/ # Express API (backend)
│ └── web/ # React frontend
├── prisma/ # Database schema
├── docker-compose.yml # Container setup
└── docs/ # Project documentation


---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/SlothCartel/NWU-Classroom-Polling-Group-1.git
cd NWU-Classroom-Polling-Group-1
```

### 2️⃣ Environment Setup

Create a .env file in both /apps/api and /apps/web:

/apps/api/.env
```bash
PORT=8080
DATABASE_URL=postgresql://postgres:postgres@db:5432/nwupoll
JWT_SECRET=super_secure_secret
REDIS_URL=redis://redis:6379
FRONTEND_URL=http://localhost:5173
```

/apps/web/.env
```bash
VITE_API_BASE=http://localhost:8080/api
```

### 3️⃣ Run with Docker

```bash
docker-compose up --build
```

### 4️⃣ Access the App
- Front-End: http://localhost:5173
- Back-End API: http://localhost:8080/api
- API Docs (Swagger): http://localhost:8080/api-docs

---

## 🧠 Application Flow

### 👩‍🏫 Lecturer
1. Sign up or log in.
2. Create a new poll with questions and options.
3. Share the join code with students.
4. View real-time answers and analytics.
5. Export results as CSV for review.

###👨‍🎓 Student

1. Enter join code (no login required).
2. Participate in the live poll.
3. Submit responses within time limits.
4. Instantly view results and feedback.

---

## 🖥️ Deployment

| Component            | Platform         | Purpose                                             |
| -------------------- | ---------------- | --------------------------------------------------- |
| **Front-End**        | Vercel           | Continuous deployment and CDN hosting for React app |
| **Back-End**         | Docker (Node.js) | Hosted via containerized environment                |
| **Database**         | PostgreSQL       | Managed cloud instance                              |
| **Real-Time Engine** | Socket.IO        | Managed inside Dockerized API                       |
| **Orchestration**    | Docker Compose   | Local dev setup and integration                     |

### Deployment Pipeline
1. Push to dev or main triggers GitHub Actions build.
2. Docker images built using Dockerfile and docker-compose.yml.
3. Front-end auto-deploys to Vercel.
4. Back-end image deployed to Render or Railway.
5. Environment variables managed securely in .env and deployment dashboards.

📄 Full deployment documentation:
docs/deployment-docs.md

---

## 🧪 Testing

- Unit and integration tests via Jest (backend) and Vitest (frontend).
- Stress-tested with 200+ concurrent users using Socket.IO load testing.
- Docker-based testing ensures consistency across environments.

## 🧰 Development Principles
- Clean Code: Modular architecture and clear separation of concerns.
- Scalability: Fully containerized services for portability and performance.
- Security: JWT authentication and POPIA-compliant data storage.
- Maintainability: Strict TypeScript typing, ESLint, and Prettier formatting.

## 📈 System Architecture

+-------------+        +-------------------+        +------------------+
|   Browser   | <----> |   Node.js API     | <----> |   PostgreSQL DB  |
| (React/Vite)|   WS   | (Express + Socket)|   SQL  |  (Prisma ORM)    |
+-------------+        +-------------------+        +------------------+
        ↑                        ↑
        |                        |
        └──────── Docker / Compose ─────────┘

## 📚 Documentation

| Type                | Location                                                                                                        |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| Full Technical Docs | [docs/technical-docs.md](https://github.com/SlothCartel/NWU-Classroom-Polling-Group-1/docs/technical-docs.md)   |
| Backend API Docs    | [docs/api-docs.md](https://github.com/SlothCartel/NWU-Classroom-Polling-Group-1/docs/api-docs.md)               |
| Frontend Docs       | [docs/frontend-docs.md](https://github.com/SlothCartel/NWU-Classroom-Polling-Group-1/docs/frontend-docs.md)     |
| Deployment Docs     | [docs/deployment-docs.md](https://github.com/SlothCartel/NWU-Classroom-Polling-Group-1/docs/deployment-docs.md) |

## 🧑‍💻 Contributors

| Name               | Role                                              |
| ------------------ | ------------------------------------------------- |
| Mariska Adriaanzen | Project Lead / Back-End Developer / Documentation |
| Eugene Holt        | Back-End Developer / DevOps / Documentation       |
| Ruan Thompson      | Front-End Developer / Documentation               |
| Antonet Zwane      | Database Operation                                |
| Yibanathi Mojaki   | Database Operation                                |
| Alfred Paruque     | Documentation                                     |
| Chris Ries         | Documentation                                     |

