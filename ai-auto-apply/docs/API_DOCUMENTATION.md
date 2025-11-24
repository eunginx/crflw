# AI Auto Apply - Complete API Documentation

## Overview
The AI Auto Apply system consists of three main services communicating via REST APIs:
- **Frontend** (React SPA) - Port 3000
- **Backend API** (Node.js/Express) - Port 8000  
- **AI Service** (Node.js/Express) - Port 9000

---

## Backend API (Port 8000)

### Base Configuration
- **Base URL**: `http://localhost:8000`
- **Health Endpoint**: `GET /health`
- **API Base**: `http://localhost:8000/api`

### CORS Configuration
```javascript
origin: ['http://localhost:3000', 'http://127.0.0.1:3000']
credentials: true
methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
```

---

### 📋 Document Management Routes (`/api/documents`)

#### Upload Document
```http
POST /api/documents/upload
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "uuid",
    "filename": "resume.pdf",
    "originalFilename": "My Resume.pdf",
    "size": 269177,
    "uploadDate": "2025-11-24T11:36:51.061Z"
  }
}
```

#### Process Document
```http
POST /api/documents/:documentId/process
```

**Response:**
```json
{
  "success": true,
  "data": {
    "extractedText": "...",
    "textLength": 8259,
    "numPages": 4,
    "processingStatus": "completed",
    "screenshotPath": "/screenshots/doc-uuid.png"
  }
}
```

#### Get Document Results
```http
GET /api/documents/:documentId/results
```

#### Delete Document
```http
DELETE /api/documents/:documentId
```

---

### 📧 Email-Based User Data Routes (`/api/email`)

#### Get User Data
```http
GET /api/email/user-data/:email
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firebase_uid": "firebase-uid",
    "email_verified": true
  },
  "profile": {
    "headline": "Software Engineer",
    "summary": "Experienced developer...",
    "location": "San Francisco"
  },
  "settings": {
    "keywords": "React, Node.js",
    "locations": "San Francisco, Remote",
    "salary_min": 100000,
    "salary_max": 200000,
    "enable_auto_apply": true
  },
  "onboarding": {
    "profile_complete": true,
    "settings_complete": true,
    "onboarding_complete": false
  }
}
```

#### Update User Data
```http
PUT /api/email/user-data/:email
Content-Type: application/json
```

**Request Body:**
```json
{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "headline": "Senior Developer"
  },
  "settings": {
    "keywords": "React, TypeScript",
    "salary_min": 120000
  }
}
```

#### Update Firebase UID
```http
PUT /api/email/user-data/:email/firebase-uid
```

---

### 📊 Job Applications Routes (`/api/email/applications`)

#### Get All Applications
```http
GET /api/email/applications/:email
```

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "title": "Senior Software Engineer",
    "company": "Tech Company",
    "status": "applied",
    "applied_date": "2025-11-24T09:44:32.299Z",
    "job_url": "https://example.com/job",
    "description": "Job description...",
    "salary_min": 150000,
    "salary_max": 200000,
    "location": "San Francisco, CA",
    "notes": "Applied through referral"
  }
]
```

#### Get Applications by Status
```http
GET /api/email/applications/:email/status/:status
```

**Valid Statuses:** `saved`, `applied`, `interview`, `offer`, `rejected`

#### Get Application Statistics
```http
GET /api/email/applications/:email/stats
```

#### Create Application
```http
POST /api/email/applications/:email
```

#### Update Application
```http
PUT /api/email/applications/:email/:id
```

#### Update Application Status
```http
PATCH /api/email/applications/:email/:id/status
```

#### Delete Application
```http
DELETE /api/email/applications/:email/:id
```

---

### 🏷️ Job Status Types Routes (`/api/job-statuses`)

#### Get All Job Statuses
```http
GET /api/job-statuses
```

**Response:**
```json
[
  {
    "id": 1,
    "key": "saved",
    "label": "Saved",
    "icon": "📌",
    "color": "yellow",
    "description": "Job saved for later consideration",
    "sort_order": 1,
    "category": "neutral",
    "counts_towards": ["saved"],
    "ui_classes": {
      "bg": "bg-yellow-100",
      "chip": "px-3 py-1 rounded-full text-sm font-medium",
      "text": "text-yellow-800"
    },
    "hidden": false,
    "group_label": "Neutral"
  }
]
```

#### Get Enhanced Statuses
```http
GET /api/job-statuses/enhanced
```

#### Get Status Groups
```http
GET /api/job-statuses/groups
```

**Response:**
```json
[
  {
    "group_label": "Positive",
    "statuses": [
      {"key": "applied", "label": "Applied"},
      {"key": "interview", "label": "Interview"},
      {"key": "offer", "label": "Offer"}
    ]
  }
]
```

#### Get Analytics Data
```http
GET /api/job-statuses/analytics
```

#### Get Specific Status
```http
GET /api/job-statuses/:key
```

---

### 🤖 AI Apply Pipeline Routes (`/api/ai-apply`)

#### Get User Resumes
```http
GET /api/ai-apply/resumes
```

#### Upload Resume
```http
POST /api/ai-apply/resumes/upload
Content-Type: multipart/form-data
```

#### Set Active Resume
```http
POST /api/ai-apply/resumes/:resumeId/set-active
```

#### Process Resume
```http
POST /api/ai-apply/resumes/:resumeId/process
```

#### Get Resume Results
```http
GET /api/ai-apply/resumes/:resumeId/results
```

#### Delete Resume
```http
DELETE /api/ai-apply/resumes/:resumeId
```

#### Start AI Analysis
```http
POST /api/ai-apply/resumes/:resumeId/ai-analysis
```

---

## AI Service API (Port 9000)

### Base Configuration
- **Base URL**: `http://localhost:9000`
- **Health Endpoint**: `GET /health`

### AI Pipeline Endpoints

#### Get Job Matches
```http
POST /api/ai/job-matches
```

**Request:**
```json
{
  "resumeId": "uuid",
  "userId": "firebase-uid",
  "preferences": {
    "keywords": "React, Node.js",
    "locations": ["San Francisco", "Remote"],
    "salary_min": 100000,
    "salary_max": 200000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMatches": 25,
    "jobs": [
      {
        "id": "job-uuid",
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "location": "San Francisco, CA",
        "salary_min": 120000,
        "salary_max": 180000,
        "match_score": 0.85,
        "description": "Job description..."
      }
    ]
  }
}
```

#### Generate Cover Letter
```http
POST /api/ai/cover-letter
```

#### Auto-Fill Application
```http
POST /api/ai/auto-fill
```

#### Submit Application
```http
POST /api/ai/submit-application
```

---

## Frontend Service (Port 3000)

### Base Configuration
- **Base URL**: `http://localhost:3000`
- **Type**: React Single Page Application
- **Development Server**: React Scripts

### Key Routes
- `/` - Home/Landing
- `/ai-apply` - Main AI Apply interface
- `/onboarding` - User onboarding flow
- `/profile` - User profile management
- `/jobs` - Job applications dashboard

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (optional)"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

### Firebase Integration
- Frontend uses Firebase Auth for user authentication
- Backend receives `firebase_uid` for user identification
- Email-based fallback for development/testing

### Headers
```http
Authorization: Bearer <firebase-token>
Content-Type: application/json
```

---

## Rate Limiting & Security

### Current Limits
- No rate limiting implemented (development)
- CORS restricted to localhost:3000
- File upload size: 10MB max

### Security Headers
```javascript
allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
```

---

## Development vs Production

### Environment Variables
```bash
# Backend
PORT=8000
NODE_ENV=development

# Frontend  
PORT=3000
REACT_APP_API_URL=http://localhost:8000

# AI Service
PORT=9000
```

### Docker Ports (Future)
- Frontend: 3100 (host) → 3000 (container)
- Backend: 8100 (host) → 8000 (container)  
- AI Service: 9100 (host) → 9000 (container)

---

## Testing Endpoints

### Health Checks
```bash
# Backend
curl http://localhost:8000/health

# AI Service
curl http://localhost:9000/health

# Frontend
curl http://localhost:3000
```

### API Testing Examples
```bash
# Get user data
curl "http://localhost:8000/api/email/user-data/user@example.com"

# Get job statuses
curl "http://localhost:8000/api/job-statuses"

# Get applications
curl "http://localhost:8000/api/email/applications/user@example.com"
```

---

## WebSocket/Real-time Features

### Current Implementation
- No WebSocket connections
- Polling-based updates for document processing
- 2-second polling interval for processing status

### Future Enhancements
- WebSocket for real-time processing updates
- Live job application status updates
- Real-time AI analysis progress

---

## File Upload Handling

### Supported Formats
- PDF files only for resumes
- Max file size: 10MB
- Storage location: `appData/uploads/resumes/`

### Processing Pipeline
1. File upload via multipart/form-data
2. PDF parsing with pdf-parse v2.4.5
3. Text extraction and metadata generation
4. Optional screenshot generation
5. Database storage of results

---

## Database Integration

### PostgreSQL Tables
- `users` - User accounts
- `user_profiles` - User profile data
- `user_settings` - Application preferences
- `documents` - Uploaded files
- `document_processing_results` - Processing results
- `job_applications` - Job applications
- `job_status_types` - Application status options

### Connection Pool
- 5-20 connections depending on load
- Automatic connection cleanup
- Query timeout: 30 seconds

---

## Performance Monitoring

### Logging
- Request/response logging
- Error tracking with stack traces
- Processing time measurements
- Database query logging (development)

### Metrics to Monitor
- API response times
- Document processing duration
- File upload success rates
- Database connection pool status
- Memory usage per service

---

## Troubleshooting Guide

### Common Issues
1. **404 Errors** - Check route registration in index.js
2. **Processing Stuck** - Check polling logic and processing status
3. **PDF Parse Errors** - Verify pdf-parse v2.4.5 usage
4. **Database Errors** - Check connection and schema
5. **CORS Issues** - Verify origin configuration

### Debug Commands
```bash
# Check running processes
lsof -i :3000,8000,9000

# Check logs
tail -f logs/frontend.log
tail -f logs/backend.log  
tail -f logs/ai-service.log

# Test endpoints
curl -v http://localhost:8000/health
```

---

## API Versioning

### Current Version: v1.0.0
- No version prefix in URLs
- Backward compatibility maintained
- Breaking changes require version bump

### Future Versioning Strategy
- `/api/v1/` for current endpoints
- `/api/v2/` for breaking changes
- Deprecation notices for old versions

---

*Last Updated: 2025-11-24*
*Version: 1.0.0*
