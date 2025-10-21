# NWU Live Poll API - Swagger/OpenAPI Documentation

## 🎉 Overview

The NWU Live Poll API now includes comprehensive **Swagger/OpenAPI 3.0** documentation for all endpoints. This provides an interactive interface to explore, test, and understand the API without needing external tools.

## 📍 Accessing the Documentation

### Local Development
Once the API server is running, access the Swagger UI at:
```
http://localhost:8080/api-docs
```

### Production
```
https://your-production-url.com/api-docs
```

### JSON Specification
The raw OpenAPI specification is available at:
```
http://localhost:8080/api-docs.json
```

## 🚀 Features

### Complete API Coverage
Every endpoint is fully documented with:
- ✅ **Detailed descriptions** - What each endpoint does
- ✅ **Request/response schemas** - Expected input and output formats
- ✅ **Authentication requirements** - Which endpoints require JWT tokens
- ✅ **Example values** - Sample requests and responses
- ✅ **Error responses** - All possible error scenarios
- ✅ **Parameter validation** - Required/optional fields with constraints

### Interactive Testing
The Swagger UI allows you to:
- 🔐 **Authenticate** - Enter your JWT token once and test protected endpoints
- 📝 **Try endpoints** - Execute API calls directly from the browser
- 👀 **See responses** - View real API responses with syntax highlighting
- 📋 **Copy examples** - Use pre-filled example values

### Organized by Categories
Endpoints are grouped into logical sections:

1. **Health & Info** - API status and information endpoints
2. **Authentication** - User registration and login (student/lecturer)
3. **Poll Management** - CRUD operations for polls (lecturer-only)
4. **Poll Lifecycle** - Poll status management (open/start/close)
5. **Student Participation** - Joining polls and submitting answers
6. **Lobby Management** - Managing poll participants
7. **Analytics & Statistics** - Poll results and exports
8. **Student Submissions** - Submission history management

## 🔐 How to Use Authentication in Swagger UI

### Step 1: Get a JWT Token
First, authenticate using one of the login endpoints:
- `POST /api/auth/lecturer/login` for lecturers
- `POST /api/auth/student/login` for students

### Step 2: Authorize in Swagger
1. Click the **"Authorize"** button (green lock icon) at the top right
2. Enter your token in the format: `Bearer <your_token_here>`
3. Click **"Authorize"**
4. Click **"Close"**

### Step 3: Test Protected Endpoints
Now you can test any endpoint that requires authentication. The token will be automatically included in the `Authorization` header.

## 📚 API Endpoint Summary

### Authentication Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/lecturer/signup` | Register new lecturer | No |
| POST | `/api/auth/lecturer/login` | Lecturer login | No |
| POST | `/api/auth/student/signup` | Register new student | No |
| POST | `/api/auth/student/login` | Student login | No |

### Poll Management (Lecturer Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/polls` | List all lecturer's polls | Yes (Lecturer) |
| GET | `/api/polls/:id` | Get poll by ID | Yes |
| POST | `/api/polls` | Create new poll | Yes (Lecturer) |
| PUT | `/api/polls/:id` | Update poll | Yes (Lecturer) |
| DELETE | `/api/polls/:id` | Delete poll | Yes (Lecturer) |

### Poll Lifecycle (Lecturer Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/polls/:id/open` | Open poll for joining | Yes (Lecturer) |
| POST | `/api/polls/:id/start` | Start poll (make live) | Yes (Lecturer) |
| POST | `/api/polls/:id/close` | Close poll | Yes (Lecturer) |

### Student Participation
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/polls/code/:joinCode` | Get poll by join code | No |
| POST | `/api/polls/join` | Join a poll | No |
| POST | `/api/polls/:id/choices` | Record live answer choice | Yes (Student) |
| POST | `/api/polls/:id/submit` | Submit final answers | Yes (Student) |

### Lobby Management (Lecturer Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/polls/:id/lobby` | Get lobby participants | Yes (Lecturer) |
| DELETE | `/api/polls/:id/lobby/:studentNumber` | Remove student from lobby | Yes (Lecturer) |

### Analytics & Statistics (Lecturer Only)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/polls/:id/stats` | Get poll statistics | Yes (Lecturer) |
| GET | `/api/polls/:id/export?format=csv` | Export results as CSV | Yes (Lecturer) |
| GET | `/api/polls/:id/export?format=json` | Export results as JSON | Yes (Lecturer) |

### Student Submissions
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/students/:studentNumber/submissions` | Get submission history | Yes (Student/Own) |
| DELETE | `/api/students/:studentNumber/submissions/:pollId` | Delete submission | Yes (Student/Own) |

## 🛠️ Development & Maintenance

### Configuration Files
- **Swagger Config**: `apps/api/src/config/swagger.ts`
- **Main Integration**: `apps/api/src/app.ts`

### Updating Documentation
Documentation is maintained using JSDoc comments above each route handler. To update:

1. **Locate the route file** in `apps/api/src/routes/`
2. **Update the `@openapi` comment** above the route
3. **Rebuild and restart** the server
4. **Refresh** the Swagger UI

### Example Documentation Format
```typescript
/**
 * @openapi
 * /api/polls:
 *   get:
 *     tags:
 *       - Poll Management
 *     summary: Get all lecturer's polls
 *     description: Retrieves all polls created by the authenticated lecturer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of polls
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Poll'
 */
router.get("/", authenticateToken, requireRole(["lecturer"]), async (req, res) => {
  // Implementation
});
```

## 📦 Dependencies

The following packages are used for Swagger documentation:
- `swagger-jsdoc` - Generates OpenAPI specification from JSDoc comments
- `swagger-ui-express` - Serves interactive Swagger UI
- `@types/swagger-jsdoc` - TypeScript definitions
- `@types/swagger-ui-express` - TypeScript definitions

## 🌟 Best Practices

### When Testing in Swagger UI
1. **Start with authentication** - Get a token first
2. **Check required fields** - Red asterisks indicate required parameters
3. **Use example values** - Click "Try it out" to see pre-filled examples
4. **Read descriptions** - Each field has helpful descriptions
5. **Check status codes** - Different responses for success/error cases

### Common Response Patterns
All endpoints follow consistent response patterns:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ] // Optional validation details
}
```

## 🔍 Schema Reference

### Common Schemas
All reusable schemas are defined in `swagger.ts`:
- `User` - User account information
- `Poll` - Poll structure with questions
- `Question` - Question with options
- `Option` - Answer option
- `AuthResponse` - Authentication response
- `ErrorResponse` - Error response structure
- `PollStatistics` - Analytics data
- `StudentSubmission` - Submission history entry

## 📝 Notes

### WebSocket Documentation
Note: WebSocket events are documented in the main `api-docs.md` file as they cannot be tested through Swagger UI. The REST API endpoints serve as fallbacks for WebSocket functionality.

### CORS Configuration
The API includes CORS headers to allow Swagger UI and frontend applications to make requests. Origins are configured in `app.ts`.

### Security
- JWT tokens expire after 7 days
- Passwords are hashed with bcrypt
- Role-based access control is enforced on protected routes
- Students can only access their own data

## 🆘 Troubleshooting

### Swagger UI not loading
1. Ensure the API server is running
2. Check the console for errors
3. Verify `swagger.ts` has no syntax errors
4. Try accessing `/api-docs.json` to see the raw spec

### Authentication not working
1. Ensure you included "Bearer " before your token
2. Check token hasn't expired (7 day limit)
3. Verify you're using the correct role for the endpoint

### Changes not appearing
1. Restart the API server after updating JSDoc comments
2. Hard refresh the browser (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear browser cache if needed

## 📄 License

This documentation and API are part of the NWU Live Poll project.

---

**Need Help?** Check the main API documentation in `api-docs.md` or contact the development team.
