# 🚀 Quick Start - Swagger API Documentation

## Access Swagger UI

**Local Development:**
```
http://localhost:8080/api-docs
```

**OpenAPI Spec (JSON):**
```
http://localhost:8080/api-docs.json
```

## 🔐 Quick Authentication Guide

### 1. Get Token (via Swagger UI)

**For Lecturers:**
1. Expand `POST /api/auth/lecturer/login`
2. Click "Try it out"
3. Enter credentials:
   ```json
   {
     "email": "lecturer@nwu.ac.za",
     "password": "your_password"
   }
   ```
4. Click "Execute"
5. Copy the `token` from response

**For Students:**
1. Use `POST /api/auth/student/login`
2. Same process as above

### 2. Authorize in Swagger

1. Click **"Authorize"** button (🔒 green lock icon top-right)
2. Enter: `Bearer YOUR_TOKEN_HERE`
3. Click "Authorize"
4. Click "Close"
5. ✅ Now you can test protected endpoints!

## 📋 Common Workflows

### Create a Poll (Lecturer)

```
1. Authenticate as lecturer
2. POST /api/polls
3. Use example values or customize:
   {
     "title": "My Quiz",
     "questions": [...]
   }
4. Copy the joinCode from response
```

### Join a Poll (Student)

```
1. GET /api/polls/code/{joinCode} - Preview poll
2. POST /api/polls/join - Join with student number
3. POST /api/polls/{id}/submit - Submit answers
```

### Run a Poll Session (Lecturer)

```
1. POST /api/polls - Create poll
2. POST /api/polls/{id}/open - Open for joining
3. GET /api/polls/{id}/lobby - See who joined
4. POST /api/polls/{id}/start - Start poll
5. GET /api/polls/{id}/stats - View live results
6. POST /api/polls/{id}/close - Close poll
7. GET /api/polls/{id}/export?format=csv - Download results
```

## 🎯 Endpoint Categories

| Category | Tag Name | Description |
|----------|----------|-------------|
| 🏥 | Health & Info | API status endpoints |
| 🔐 | Authentication | Login/Signup |
| 📝 | Poll Management | CRUD operations |
| 🔄 | Poll Lifecycle | Status changes |
| 👥 | Student Participation | Joining & submitting |
| 🚪 | Lobby Management | Participant tracking |
| 📊 | Analytics & Statistics | Results & exports |
| 📚 | Student Submissions | History management |

## ⚡ Quick Reference

### Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (wrong role)
- `404` - Not Found
- `500` - Server Error

### Poll Status Flow
```
draft → open → live → closed
```

### Common Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

## 🔧 Development Commands

**Start API Server:**
```bash
cd apps/api
npm run dev
```

**Access Swagger:**
```bash
# Open in browser
http://localhost:8080/api-docs
```

**Download OpenAPI Spec:**
```bash
curl http://localhost:8080/api-docs.json > openapi.json
```

## 💡 Pro Tips

1. **Use the Schema tab** - See all request/response structures
2. **Check example values** - Auto-populated for quick testing
3. **Expand all sections** - Click to see detailed documentation
4. **Test error cases** - Try invalid inputs to see error responses
5. **Export spec** - Download JSON for tools like Postman

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Add "Bearer " before token in Authorize dialog |
| Swagger not loading | Check server is running on port 8080 |
| Token expired | Login again to get new token (7 day expiry) |
| CORS errors | Ensure frontend URL is in allowed origins |

## 📱 Mobile/Postman Users

**Import OpenAPI Spec:**
1. Download: `http://localhost:8080/api-docs.json`
2. Import into Postman/Insomnia/etc.
3. All endpoints automatically configured!

---

**Full Documentation:** See `SWAGGER_DOCS.md` for comprehensive guide
