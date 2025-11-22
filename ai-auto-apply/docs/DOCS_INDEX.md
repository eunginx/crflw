w# CareerFlow AI Auto-Apply - Documentation Index

This folder contains all documentation for the CareerFlow AI Auto-Apply system.

## 📚 Documentation Files

### System Architecture & Migration
- **EMAIL_BASED_SYSTEM_COMPLETE.md** - Complete guide to the email-based authentication system
- **POSTGRESQL_MIGRATION_COMPLETE.md** - PostgreSQL database migration documentation
- **POSTGRES_NAMING_CONVENTIONS.md** - Database naming conventions and standards
- **POSTGRES_NAMING_RULES_ANALYSIS.md** - Analysis of PostgreSQL naming rules

### Frontend Integration & Fixes
- **FRONTEND_INTEGRATION_COMPLETE.md** - Frontend integration with email-based APIs
- **SETTINGS_ERROR_FIX_COMPLETE.md** - Settings page error resolution
- **SETTINGS_LOADING_ISSUE_RESOLUTION.md** - Settings loading problem fixes
- **COMPILATION_FIXES_COMPLETE.md** - TypeScript compilation fixes
- **COMPREHENSIVE_TEST_COMPLETE.md** - Comprehensive testing documentation

### API Documentation
- **README.md** - Main API documentation (from appData)
- **README.md** - Frontend documentation (from frontend)

## 🧪 Testing

The test suite has been consolidated into a single file:
- **frontend/tests/merged-tests.js** - Complete test suite covering all functionality

### Running Tests
```bash
cd frontend
node tests/merged-tests.js
```

## 🏗️ Current Architecture

### Active Services
- **Frontend**: React application (port 3000)
- **Backend**: Email-based API service (port 6001)
- **Database**: PostgreSQL

### Deprecated Services
- **Firebase-based backend** (removed during cleanup)
- **Individual test files** (merged into consolidated test suite)

## 📁 Project Structure

```
ai-auto-apply/
├── docs/                    # All documentation files
├── frontend/
│   ├── src/                 # React application source
│   ├── tests/               # Consolidated test suite
│   └── package.json
├── appData/                 # Email-based backend service
│   ├── src/                 # Backend source
│   ├── scripts/             # Database scripts
│   └── package.json
├── ai-service/              # AI processing service
└── docker-compose.yml       # Container orchestration
```

## 🔄 API Endpoints

### Email-Based APIs (Port 6001)
- `GET /api/email/user-data/{email}` - Get unified user data
- `PUT /api/email/user-data/{email}` - Update user data
- `GET /api/email/applications/{email}` - Get applications
- `POST /api/email/applications/{email}` - Create application
- `PUT /api/email/applications/{email}/{id}` - Update application
- `DELETE /api/email/applications/{email}/{id}` - Delete application
- `GET /api/email/applications/{email}/stats` - Get application statistics

## 🚀 Quick Start

1. **Start Backend**:
   ```bash
   cd appData
   PORT=6001 npm start
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Run Tests**:
   ```bash
   cd frontend
   node tests/merged-tests.js
   ```

## 📝 Development Notes

- All authentication is now email-based
- Firebase is used only for client-side authentication
- PostgreSQL handles all persistent data
- API calls use port 6001
- All contexts use unified email-based APIs

## 🔧 Configuration

### Backend (.env)
```
PORT=6001
DATABASE_URL=postgresql://...
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:6001/api
```

---

*Last updated: November 2025*
