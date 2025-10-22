# 📊 NWU Classroom Polling – Group 1  

---

## 📝 Meeting 1 – Summary (1 Sept 2025)  

### 🎯 UAT Prototype Scope  
**Goal:** Deliver a working **guest-mode polling flow** (ready for live demo).  

---

<details>
<summary>🔑 Functional Requirements (MoSCoW)</summary>

| FR-ID | Title            | Description                                                               | Priority |
|-------|------------------|---------------------------------------------------------------------------|----------|
| FR-01 | **Create Poll**  | Lecturer creates a questionnaire (≤ 5 options)                           | 🟥 Must  |
| FR-02 | **Start Poll**   | System generates a six-character code & opens a WebSocket room            | 🟥 Must  |
| FR-03 | **Guest Vote**   | Student enters code, submits vote, receives acknowledgment (<1s)          | 🟥 Must  |
| FR-04 | **Live Chart**   | System streams tally; lecturer can hide/reveal                            | 🟥 Must  |
| FR-05 | **Quiz Mode**    | Lecturer sets correct answers; system scores & exports CSV                | 🟧 Should|
| FR-06 | **SAML Login**   | SAFIRE SSO for lecturers (bonus)                                          | 🟨 Could |
| FR-07 | **Data Export**  | Exports participation logs & aggregated responses (CSV/JSON)              | 🟧 Should|
| FR-08 | **Responsive UI**| UI adapts to mobile, tablet, desktop                                      | 🟧 Should|
| FR-09 | **WCAG 2.1**     | Meets accessibility standards (global)                                    | 🟧 Should|

</details>

---

<details>
<summary>👨‍🏫 Lecturer, 👩‍🎓 Student & ⚙️ System Features</summary>

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

🚫 **Out of Scope for UAT:** SAML login, LMS integration, admin panel, advanced analytics  

</details>

---

<details>
<summary>🛠️ Workload Distribution</summary>

### Main Areas  
1. **Frontend** – Lecturer dashboard, student join page, charts, responsive UI  
2. **Backend** – REST APIs, WebSocket vote handling, validation  
3. **Database** – PostgreSQL schema, constraints, Redis persistence  
4. **DevOps** – Azure App Service, PostgreSQL, Redis, Docker, GitHub Actions (CI/CD)  
5. **Testing / QA** – Cypress E2E, k6 load tests (TBD)  
6. **Compliance / Security** – POPIA & PII handling  
7. **Project Management** – Sprint planning, repo strategy, coordination  

### Team Split  
- Mariska → Backend  
- Eugene → DevOps + Backend  
- Alfred → Frontend  
- Antonet → SQL  
- Ruan → Frontend  
- Yibanathi → SQL  
- Chris → Backend + Frontend  

</details>

---

<details>
<summary>📌 Key Notes from Meeting 1</summary>

- ✅ Scope confirmed: **guest poll flow only**  
- ✅ Tech stack agreed:  
  - Frontend → React  
  - Backend → Node/Express + Socket.io  
  - Database → PostgreSQL  
- ✅ Roles assigned (see workload split)  
- ✅ GitHub repo + branching strategy: `main`, `dev`, `feature/*`  
- ⚠️ Repo managed by FC – confirm team invites  
- ✅ Definition of "Done": reviewed, tested, deployed to staging  
- ✅ UAT test cases to be drafted from functional requirements  
- ✅ Sprint 1 (2–3 weeks): deliver **guest polling demo**  

📅 **Deadline:** **29 Sept – 3 Oct**  

</details>

---

# 🗓️ Meeting 2 – Agenda & Assignments (8 Sept 2025)  

<details>
<summary>✅ Agenda</summary>

---

1. **Recap of Previous Meeting**
   - Tech familiarization done  
   - Docker Compose + project structure set up (`apps/api`, `apps/web`)  
   - Initial frontend design ideas drafted  

2. **Frontend (apps/web)**
   - Review UI design ideas (Alfred & Ruan & CHris)  
   - Decide on basic navigation flow (Create Poll, Join Poll, Live Results)  
   - Confirm styling approach with Tailwind or whatever is used 

3. **Backend (apps/api)**
   - Confirm Express + Prisma setup status  
   - Decide which API endpoints are required first (`/create-poll`, `/join-poll`, `/vote`)  
   - Clarify how WebSockets will fit into the API

4. **Database**
   - Review Prisma schema 
   - Finalize tables needed for UAT (Poll, PollOption, Vote)  
   - Plan migrations for next week  

5. **DevOps**
   - Check Docker Compose: does it run API + Web successfully?  
   - Confirm DB/Redis containers are included or need to be added
   - How to know where to code/everyones part
   - Any other issues run into discussed

6. **Adjust Sprint Plan (due to semester test)**
   - Keep this week light: focus on making barebones, SQL tables set up with 1 entry each, more indepth frontend (because we have a baseline), simple navigations in backend and most important endpoints done
   - Push feature implementation to next week after tests  

---


</details>

---

<details>
<summary>📌 Assignments Until Next Meeting (Light Load – Test Week)</summary>

- **Frontend (Alfred, Ruan, Chris)**  
  - Delve deeper into frontend (decided upon navigation, colour scheme, images, etc) 

- **Backend (Mariska, Eugene, Chris)**  
  - Confirm API boilerplate runs inside Docker  
  - Document planned API routes (`/create-poll`, `/join-poll`, `/vote`)  

- **Database (Antonet, Yibanathi)**  
  - Draft Prisma schema (Poll, PollOption, Vote)  
  - Prepare first migration file (can remain unrun until after semester week)  

- **DevOps (Eugene)**  
  - Update `docker-compose.yml` if DB/Redis not included yet  
  - Verify frontend ↔ backend runs locally via Docker Compose
  - //anything that might still need to be done but I think we are good

- **QA / Testing (Shared)**  
  - Optional: Draft test case outline for “Create Poll” flow   

</details>

---

<details>
<summary>🎯 Next Meeting Goal (Monday)</summary>

By next Monday, the team should have:  
- Finalized UI flow and component skeletons in `apps/web`  
- Documented API endpoints + Prisma schema ready  
- Docker Compose working with API + Web (and DB/Redis if possible)  
- Optional: Test case outline for Create Poll 

</details>

---

# Meeting 3 - Agenda and Assignments (22 Sept)

<details>
<summary>🔑 Functional Requirements (MoSCoW) refresher</summary>

| FR-ID  | Title         | Description                                                                                          | Priority |
|--------|--------------|------------------------------------------------------------------------------------------------------|----------|
| FR-01  | Create Poll  | The lecturer creates a questionnaire.                                                                 | Must     |
| FR-02  | Start Poll   | The system generates a six-character code and opens a WebSocket room.                                 | Must     |
| FR-03  | Guest Vote   | The student enters the code, selects the answer(s), and receives ack.                                 | Must     |
| FR-04  | Live Chart   | System streams tally; the lecturer can hide/reveal.                                                   | Must     |
| FR-05  | Quiz Mode    | The lecturer designates correct answers; system calculates scores and exports results in CSV format.  | Should   |
| FR-06  | SAML Login   | SAFIRE SSO for lecturers (bonus).                                                                     | Could    |
| FR-07  | Data Export  | System exports participation logs and aggregated responses in CSV for analysis.                       | Should   |
| FR-08  | Responsive UI| Interfaces adapt to mobile, tablet, and desktop resolutions.                                          | Should   |
| FR-09  | WCAG 2.1     | Ensures the application meets accessibility standards.                                                | Should   |

</details>

---

<details>
<summary>📌 Current Status & Issues</summary>

### Database
- ✅ Team claims database is done.  
- ❓ Need to review what’s been implemented.  
- ➡️ If completed, assign **additional tasks** (e.g., optimization, seed data, analytics features).  

### Backend
- Currently only has a **UserAuthentication API**.  
- ❓ Unsure if it works (no clear testing strategy yet).  
- ⚠️ Needs verification and additional endpoints (poll creation, voting, results, etc.).
- Planning on having a discussion after the meeting

### Frontend
- Status **uncertain**.  
- A wireframe was drawn up but unclear if the team followed it.  
- ❓ Need to check progress (are the poll pages, lecturer dashboard, and student view implemented?).  

</details>

---

<details>
<summary>🛠️ To Be Done</summary>

### Backend
- [ ] Verify UserAuthentication API works (add tests or Postman collection).
- [ ] Make all other API's
- [ ] Implement **poll management endpoints** (create, start, end).  
- [ ] Implement **voting endpoint** (student submit answer).  
- [ ] Implement **results endpoint** (live tally + final results).  
- [ ] Add error handling and security (rate limiting, input validation).  

### Frontend
[NWU website framewire.pdf](https://github.com/user-attachments/files/22466243/NWU.website.framewire.pdf)

- [ ] Compare current UI to wireframe.  
- [ ] Implement **lecturer dashboard** (poll creation, start poll, view results).  
- [ ] Implement **student poll page** (code entry, voting, feedback).  
- [ ] Ensure **responsive design** across devices.  
- [ ] Connect frontend with backend APIs.  

### Database
- [ ] Review database schema (tables, relationships, constraints).  
- [ ] Check if schema matches functional requirements (polls, users, votes, results).  
- [ ] Seed test data for development/demo.  
- [ ] If schema is fully done → assign **extra features** (e.g., analytics, export logs).  

</details>

---

<details>
<summary>❓ Questions I Got Along the Way</summary>

- Sign in ????  
- Lecturer sign up (save email/password)  
- Lecturer dashboard (do we save all previous polls?)  
- Student dashboard (track number of polls attended?)  
- Polls (ensure student can only click one answer once)  
- Poll page (do we display results after every question?)  
- Poll page (timed or next? *guessing timed*)  

</details>

---
# 🗓️ Meeting 4 – Finilization (13 Oct 2025)  

---

<details>
## ✅ UAT Completed – Finalization & Deployment Phase (13 Oct 2025)

Our **User Acceptance Testing (UAT)** has been successfully completed.  
The system met the **guest-mode polling flow** objectives, with functional poll creation, live voting, and chart updates.  

We are now entering the **final phase** of development, focusing on:  
- 🧾 **Exporting poll data (CSV/JSON)**  
- ☁️ **Hosting the full application on Azure**  
- 🧪 **Final testing & demo preparation**  

🎯 **Goal:** Have the project fully finalized and ready for presentation by **Friday, 17 Oct 2025**.  
🎥 **Presentation:** Will be **online**, but date/time and format are **still to be confirmed**.

---

</details>

---

<details>
<summary>🎥 Presentation Preparation</summary>

### Current Plan
- Presentation will be **online** (platform TBC).  
- Format, date, and time not yet finalized.

🗓️ **Deadline:** Friday, 17 Oct 2025  
🎯 Deliverable: Fully deployed, working Azure demo  

</details>
