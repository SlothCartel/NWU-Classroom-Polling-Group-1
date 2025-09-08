# 📊 NWU Classroom Polling – Group 1

## 📝 Meeting 1: Discussion Summary: 1 Sept 2025

### 🎯 UAT Prototype Scope  
**Goal:** Deliver a working **guest-mode polling flow** (ready for live demo).  

---

### 🔑 Functional Requirements (MoSCoW)

| FR-ID | Title         | Description                                                                 | Priority   |
|-------|---------------|-----------------------------------------------------------------------------|------------|
| FR-01 | **Create Poll**   | Lecturer creates a questionnaire (≤ 5 options)                           | 🟥 Must    |
| FR-02 | **Start Poll**    | System generates a six-character code & opens a WebSocket room           | 🟥 Must    |
| FR-03 | **Guest Vote**    | Student enters code, submits vote, receives acknowledgment (<1s)         | 🟥 Must    |
| FR-04 | **Live Chart**    | System streams tally; lecturer can hide/reveal                           | 🟥 Must    |
| FR-05 | **Quiz Mode**     | Lecturer sets correct answers; system scores & exports CSV               | 🟧 Should  |
| FR-06 | **SAML Login**    | SAFIRE SSO for lecturers (bonus)                                         | 🟨 Could   |
| FR-07 | **Data Export**   | Exports participation logs & aggregated responses (CSV/JSON)             | 🟧 Should  |
| FR-08 | **Responsive UI** | UI adapts to mobile, tablet, desktop                                     | 🟧 Should  |
| FR-09 | **WCAG 2.1**      | Meets accessibility standards (global)                                   | 🟧 Should  |

---

### 👨‍🏫 Lecturer Features
- Create polls (≤ 5 options)  
- Start poll → system generates join code  
- View live results, hide/reveal charts  
- Export results (CSV/JSON)  

### 👩‍🎓 Student Features
- Join poll with code  
- Submit vote (acknowledged in <1s)  
- See live chart updates  

### ⚙️ System Features
- Real-time analytics & aggregation  
- Responsive across devices  
- POPIA-compliant data handling  

🚫 **Out of Scope for UAT:**  
SAML login, LMS integration, admin panel, advanced analytics  

---

## 🛠️ Workload Distribution

**Main Areas:**  
1. **Frontend** – Lecturer dashboard, student join page, charts, responsive UI  
2. **Backend** – REST APIs, WebSocket vote handling, validation  
3. **Database** – PostgreSQL schema, constraints, Redis persistence  
4. **DevOps** – Azure App Service, PostgreSQL, Redis, Docker, GitHub Actions (CI/CD)  
5. **Testing / QA** – Cypress E2E, k6 load tests (TBD)  
6. **Compliance / Security** – POPIA & PII handling  
7. **Project Management** – Sprint planning, repo strategy, coordination  

**Proposed Split:**  
- Mariska → Backend  
- Eugene → DevOps + Backend  
- Alfred → Frontend  
- Antonet → SQL  
- Ruan → Frontend  
- Yibanathi → SQL  
- Chris → Backend + Frontend  

---

## 📌 Key Meeting Notes

- ✅ Scope confirmed: **guest poll flow only**  
- ✅ Tech stack agreed:  
  - Frontend → React  
  - Backend → Node/Express + Socket.io  
  - Database → PostgreSQL  
- ✅ Roles assigned (see workload split)  
- ✅ GitHub repo + branching strategy: `main`, `dev`, `feature/*`  
- ⚠️ Repo is managed by FC – confirm team invites  
- ✅ Definition of "Done": reviewed, tested, deployed to staging  
- ✅ UAT test cases to be drafted from functional requirements  
- ✅ Sprint 1 (2–3 weeks): deliver **guest polling demo**  

📅 **Deadline:** **29 Sept – 3 Oct**  

---

# 🗓️ Meeting 2 Agenda & Assignments : 8 Sept 2025

## ✅ Agenda for Tonight
1. **Recap of Previous Meeting**
   - Everyone familiarized themselves with assigned technologies  
   - Docker environment was set up  
   - Frontend team drafted initial UI designs  

2. **Review Frontend Designs**
   - Alfred & Ruan & Chris present drafted UI  
   - Group discussion → confirm layout, colors, navigation, etc
   - Decide on “minimum viable UI” for UAT demo (MOSCOW shoulds')

3. **Backend & Database Progress**
   - Backend team (Mariska, Eugene, Chris): confirm Node + Socket.io boilerplate & Docker setup  
   - Database team (Antonet, Yibanathi): Prism setup, start on ERD/schema draft (Polls, Options, Votes, Users), Redis integration  

4. **Integration Plan**
   - Define API endpoints and WebSocket handling (at least on paper)  
   - Decide on Redis → PostgreSQL persistence approach  
   - Rough architecture flow diagram  

5. **Adjust Sprint Plan (due to semester test)**
   - Focus this week on design & setup work rather than full implementation  
   - Push working demo skeleton to the following week  

---

## 📌 Assignments Until Next Meeting (Light Load for Test Week)

- **Frontend (Alfred, Ruan, Chris)**  
  - Finalize UI mockups & folder/component structure in React  
  - Optional: start basic layout (navigation, empty pages)  

- **Backend (Mariska, Eugene, Chris)**  
  - Set up barebones Express + Socket.io project structure (no logic yet)  
  - Document planned endpoints (Create Poll, Join Poll, Vote)  

- **Database (Antonet, Yibanathi)**  
  - Finalize ERD/schema (Poll, PollOption, Vote)  
  - Prepare migration files (can remain untested until after semester week)  

- **QA / Testing (Shared)**  
  - Draft **UAT test cases** for Create Poll + Join Poll (can be simple text)  

---

## 🎯 Next Meeting Goal (Monday)
By next Monday, the team should have:  
- Agreed UI designs with React structure ready  
- Backend & API endpoints defined (not fully coded)  
- Database schema finalized & migrations drafted  

👉 **Working demo skeleton is shifted to the following week (after the semester test).**

---

