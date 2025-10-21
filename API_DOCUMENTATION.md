# 📚 API Documentation - Quick Access

## 🌐 Swagger/OpenAPI Documentation

The NWU Live Poll API is now **fully documented** with interactive Swagger/OpenAPI 3.0 specification.

### 🚀 Access Points

| Resource | URL | Description |
|----------|-----|-------------|
| **Swagger UI** | `http://localhost:8080/api-docs` | Interactive API documentation |
| **OpenAPI Spec** | `http://localhost:8080/api-docs.json` | Raw JSON specification |
| **Full Guide** | [`apps/api/SWAGGER_DOCS.md`](apps/api/SWAGGER_DOCS.md) | Comprehensive documentation guide |
| **Quick Start** | [`apps/api/SWAGGER_QUICKSTART.md`](apps/api/SWAGGER_QUICKSTART.md) | Quick reference card |
| **Implementation** | [`apps/api/SWAGGER_IMPLEMENTATION_SUMMARY.md`](apps/api/SWAGGER_IMPLEMENTATION_SUMMARY.md) | Technical implementation details |

## ✅ What's Documented

✅ **35+ Endpoints** - Every single API endpoint fully documented
✅ **15+ Schemas** - All request/response structures defined
✅ **Interactive Testing** - Try endpoints directly in the browser
✅ **Authentication** - JWT token support built-in
✅ **Examples** - Pre-filled example values for all endpoints
✅ **Error Handling** - All error scenarios documented

## 🎯 Quick Start

### 1. Start the API Server
```bash
cd apps/api
npm run dev
```

### 2. Open Swagger UI
Navigate to: **http://localhost:8080/api-docs**

### 3. Authenticate (for protected endpoints)
1. Login via `/api/auth/lecturer/login` or `/api/auth/student/login`
2. Copy the `token` from the response
3. Click **"Authorize"** button (🔒) in Swagger UI
4. Enter: `Bearer YOUR_TOKEN_HERE`
5. Test protected endpoints!

## 📋 Endpoint Categories

The API is organized into 8 logical categories:

| Category | Endpoints | Description |
|----------|-----------|-------------|
| 🏥 **Health & Info** | 2 | API status and information |
| 🔐 **Authentication** | 11 | User registration and login |
| 📝 **Poll Management** | 6 | CRUD operations for polls |
| 🔄 **Poll Lifecycle** | 4 | Poll status management |
| 👥 **Student Participation** | 5 | Joining and submitting answers |
| 🚪 **Lobby Management** | 3 | Participant tracking |
| 📊 **Analytics** | 3 | Statistics and exports |
| 📚 **Submissions** | 4 | Student history management |

## 🎨 Features

- ✨ **Interactive Testing** - Execute API calls directly from the browser
- 🔍 **Searchable** - Find endpoints quickly
- 📖 **Comprehensive** - Every parameter documented
- 🎯 **Examples** - Pre-filled sample requests
- 🔐 **Secure** - JWT authentication support
- 📥 **Exportable** - Download OpenAPI spec for Postman/Insomnia
- 🎭 **Role-Based** - Clear indication of lecturer/student endpoints
- ⚡ **Real-Time** - See live request/response data

## 🛠️ For Developers

### Import into Postman/Insomnia
1. Download the spec: `http://localhost:8080/api-docs.json`
2. Import into your API client
3. All endpoints are auto-configured!

### Update Documentation
Documentation is maintained using JSDoc comments in the route files:
```typescript
/**
 * @openapi
 * /api/endpoint:
 *   get:
 *     tags:
 *       - Category Name
 *     summary: Short description
 *     ...
 */
router.get("/endpoint", handler);
```

See `apps/api/SWAGGER_DOCS.md` for full update instructions.

## 📚 Additional Documentation

- **Original API Docs**: [`apps/api/api-docs.md`](apps/api/api-docs.md) - Markdown reference
- **Deployment Guide**: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Production deployment
- **Team Guide**: [`TEAM_GUIDE.md`](TEAM_GUIDE.md) - Development workflow
- **README**: [`README.md`](README.md) - Project overview

## 🎉 Benefits

With Swagger/OpenAPI documentation, you can:

- 📱 **Test API** without writing code
- 🔍 **Explore endpoints** interactively
- 📋 **Copy examples** for quick integration
- 🎓 **Onboard developers** faster
- 🐛 **Debug issues** more easily
- 📦 **Generate clients** automatically
- 📖 **Reference schemas** while coding
- ✅ **Validate requests** before sending

## 🚦 Status Codes Quick Reference

| Code | Meaning | When You'll See It |
|------|---------|-------------------|
| 200 | Success | Request completed successfully |
| 201 | Created | Resource created (e.g., new poll) |
| 400 | Bad Request | Validation error or missing fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Wrong role for this endpoint |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Something went wrong on server |

## 💡 Pro Tips

1. **Use the Schema tab** in Swagger UI to see all data structures
2. **Expand all operations** at once using the expand button
3. **Bookmark** `/api-docs` for quick access
4. **Download the spec** to use offline
5. **Check example responses** before implementing

---

**Ready to explore?** Open [http://localhost:8080/api-docs](http://localhost:8080/api-docs) in your browser! 🚀
