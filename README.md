# NWU-Classroom-Polling-Group-1

# Meeting 1 Discussion topics

## 1. UAT Prototype Scope

**Goal:** Deliver a working **guest-mode polling flow** (live demo-ready).

#### MOSCOW Breakdown

| FR-ID | Title         | Description                                                                 | Priority   |
|-------|---------------|-----------------------------------------------------------------------------|------------|
| FR-01 | Create Poll   | The lecturer creates a questionnaire                                        | 🟥 Must    |
| FR-02 | Start Poll    | The system generates a six-character code and opens a WebSocket room        | 🟥 Must    |
| FR-03 | Guest Vote    | The student enters the code, selects the answer(s), and receives ack        | 🟥 Must    |
| FR-04 | Live Chart    | System streams tally; the lecturer can hide/reveal                          | 🟥 Must    |
| FR-05 | Quiz Mode     | Lecturer designates correct answers; system calculates scores & exports CSV | 🟧 Should  |
| FR-06 | SAML Login    | SAFIRE SSO for lecturers (bonus)                                            | 🟨 Could   |
| FR-07 | Data Export   | System exports participation logs & aggregated responses in CSV format      | 🟧 Should  |
| FR-08 | Responsive UI | Interfaces adapt to mobile, tablet, and desktop resolutions                 | 🟧 Should  |
| FR-09 | WCAG 2.1      | Ensures the application meets accessibility standards (global standard)     | 🟧 Should  |


### Lecturer
- Create poll (≤ 5 options)
- Start poll → join code generated
- View live results, hide/reveal charts
- Export results (CSV/JSON)

### Student
- Join poll via code
- Submit vote (acknowledged < 1s)
- View live chart updates

### System
- Aggregate analytics
- Responsive UI (desktop & mobile)
- POPIA-compliant data handling

**Out of scope for UAT:**  
SAML login, LMS integration, admin panel, advanced analytics

---

## 2. Workload Split

1. **Frontend** – Lecturer dashboard, student join page, charts, responsive UI  
2. **Backend** – REST APIs, WebSocket vote handling, validation  
3. **Database** – PostgreSQL schema, constraints, Redis → DB persistence  
4. **DevOps** – Azure App Service, PostgreSQL, Redis, Docker, GitHub Actions CI/CD  
5. **Testing / QA** – Cypress E2E (poll creation, voting, export), k6 load tests (TBD)  
6. **Compliance / Security** – POPIA checks, PII handling  
7. **Project Management** – Sprint planning, GitHub repo/branch strategy, coordination

### Work Distribution:
Probable split: 2 frontend, 3 backend and 2 database. Brackets are based on previous poll.

- Mariska: (front end, backend)
- Eugene: (backend)
- Alfred: (backend)
- Antonet: (SQL, front end)
- Ruan: (backend, front end)
- Yibanathi: (SQL, Security)
- Chris: 

---

## 3. Key Notes for Meeting

- ✅ Confirm scope: guest poll flow only  
- ✅ Lock in tech stack: **React + Node/Express + Socket.io + PostgreSQL + Redis + Azure**  
- ✅ Assign roles (see workload split)  
- ✅ Setup GitHub repo + branching strategy (`main`, `dev`, `feature/*`)
-  v/ Repo is set up by FC so check if he invited everyone
- ✅ Define "Done": reviewed, tested, deployed to staging  
- ✅ Draft UAT test cases from functional requirements  
- ✅ Plan Sprint 1 (2–3 weeks): deliver guest polling demo

**DEADLINE IS 29 SEPT - 3 OCT**
