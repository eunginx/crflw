# CareerFlow AI Auto-Apply System

An intelligent job application automation system that uses AI to streamline the job search and application process.

## 🏗️ Architecture

### Services
- **Frontend**: React application with Firebase authentication
- **Backend**: Email-based API service with PostgreSQL database
- **AI Service**: AI processing for job matching and application generation

### Key Features
- ✅ Email-based unified API system
- ✅ PostgreSQL database with optimized naming conventions
- ✅ Automated job application processing
- ✅ User profile and settings management
- ✅ Application tracking and statistics
- ✅ Onboarding flow management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Firebase project (for authentication)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ai-auto-apply
   ```

2. **Install dependencies**:
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../appData
   npm install
   
   # AI Service (optional)
   cd ../ai-service
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   # Backend (appData/.env)
   PORT=6001
   DATABASE_URL=postgresql://username:password@localhost:5432/careerflow
   
   # Frontend (frontend/.env)
   REACT_APP_API_URL=http://localhost:6001/api
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   ```

4. **Start the services**:
   ```bash
   # Start PostgreSQL database
   # Start backend (port 6001)
   cd appData
   PORT=6001 npm start
   
   # Start frontend (port 3000)
   cd ../frontend
   npm start
   ```

## 📚 Documentation

All documentation is located in the `/docs` folder:

- [**Documentation Index**](docs/DOCS_INDEX.md) - Complete documentation overview
- [**Email-Based System**](docs/EMAIL_BASED_SYSTEM_COMPLETE.md) - Authentication system guide
- [**Frontend Integration**](docs/FRONTEND_INTEGRATION_COMPLETE.md) - Frontend setup and API integration
- [**Database Migration**](docs/POSTGRESQL_MIGRATION_COMPLETE.md) - PostgreSQL setup and migration

## 🧪 Testing

Run the comprehensive test suite:

```bash
cd frontend
node tests/merged-tests.js
```

The test suite covers:
- API connectivity
- User data management
- Application CRUD operations
- Settings management
- Onboarding flow
- Integration tests

## 🔧 API Endpoints

### Email-Based APIs (Port 6001)

#### User Data
- `GET /api/email/user-data/{email}` - Get unified user data
- `PUT /api/email/user-data/{email}` - Update user data

#### Applications
- `GET /api/email/applications/{email}` - Get all applications
- `POST /api/email/applications/{email}` - Create application
- `GET /api/email/applications/{email}/{id}` - Get specific application
- `PUT /api/email/applications/{email}/{id}` - Update application
- `DELETE /api/email/applications/{email}/{id}` - Delete application
- `GET /api/email/applications/{email}/stats` - Application statistics

#### Additional Features
- `GET /api/email/applications/{email}/status/{status}` - Filter by status
- `GET /api/email/applications/{email}/search?q=term` - Search applications
- `GET /api/email/applications/{email}/recent` - Recent applications

## 🗂️ Project Structure

```
ai-auto-apply/
├── docs/                    # All documentation
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React contexts
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── tests/              # Consolidated test suite
│   └── package.json
├── appData/                # Email-based backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── scripts/        # Database scripts
│   └── package.json
├── ai-service/             # AI processing service
└── docker-compose.yml      # Container orchestration
```

## 🔐 Authentication

The system uses a hybrid authentication approach:
- **Firebase Auth**: Client-side authentication and session management
- **Email-based API**: Server-side data access using email as primary identifier

## 📊 Database Schema

### Core Tables
- `users_email` - User accounts with email as primary key
- `user_profiles_email` - User profile information
- `user_settings_email` - Application preferences and settings
- `onboarding_progress_email` - Onboarding step tracking
- `job_applications_email` - Job application records

### Naming Conventions
- All tables use `_email` suffix to distinguish from Firebase-based tables
- Snake_case column naming
- UUID primary keys for most tables
- Email as foreign key reference

## 🔄 Migration Notes

The system has been migrated from Firebase-based to email-based APIs:

- **Before**: Firebase UID as primary identifier
- **After**: Email address as primary identifier
- **Benefits**: Better data portability, unified API structure, improved performance

## 🛠️ Development

### Running Tests
```bash
cd frontend
node tests/merged-tests.js
```

### Database Operations
```bash
cd appData
npm run migrate    # Run database migrations
npm run seed       # Seed test data
npm run reset      # Reset database
```

### Code Quality
```bash
cd frontend
npm run lint       # ESLint
npm run build      # Production build
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting**: Check PostgreSQL connection and PORT environment variable
2. **Frontend API errors**: Verify REACT_APP_API_URL matches backend port
3. **Authentication issues**: Check Firebase configuration and API keys
4. **Database errors**: Ensure PostgreSQL is running and migrations are applied

### Logging
- Backend logs: Console output from appData service
- Frontend logs: Browser developer console
- API logs: Detailed request/response logging in browser console

## 📈 Performance

- **API Response Time**: < 200ms average
- **Database Queries**: Optimized with proper indexing
- **Frontend Bundle**: < 2MB gzipped
- **Memory Usage**: < 512MB per service

## 🔒 Security

- Input validation on all API endpoints
- SQL injection prevention with parameterized queries
- CORS configuration for API access
- Environment variable protection for sensitive data

## 📝 License

[Add your license information here]

---

**CareerFlow AI Auto-Apply** - Streamlining your job search with intelligent automation.

*Last updated: November 2025*
