# 📊 NWU Classroom Polling – Group 1

## 📝 Meeting 1: Discussion Summary

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
