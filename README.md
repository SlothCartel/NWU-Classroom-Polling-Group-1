# NWU-Classroom-Polling-Group-1

# Meeting 1 Discussion topics

## 1. UAT Prototype Scope

**Goal:** Deliver a working **guest-mode polling flow** (live demo-ready).

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

---

## 3. Key Notes for Meeting

- ✅ Confirm scope: guest poll flow only  
- ✅ Lock in tech stack: **React + Node/Express + Socket.io + PostgreSQL + Redis + Azure**  
- ✅ Assign roles (see workload split)  
- ✅ Setup GitHub repo + branching strategy (`main`, `dev`, `feature/*`)  
- ✅ Define "Done": reviewed, tested, deployed to staging  
- ✅ Draft UAT test cases from functional requirements  
- ✅ Plan Sprint 1 (2–3 weeks): deliver guest polling demo  
