# App Data Service

A simple PostgreSQL-based API service for storing and serving AI Auto Apply user data.

## Features

- **PostgreSQL Database**: Persistent storage for user data
- **REST API**: Simple endpoints for user profiles, settings, and onboarding
- **Docker Support**: Containerized for easy deployment
- **Health Checks**: Built-in health monitoring

## Setup

### Local Development

1. Install dependencies:
```bash
cd appData
npm install
```

2. Set up PostgreSQL (or use Docker):
```bash
# Using Docker
docker run --name careerflow_postgres -e POSTGRES_DB=careerflow_db -e POSTGRES_USER=careerflow_user -e POSTGRES_PASSWORD=careerflow_password -p 5432:5432 -d postgres:15-alpine
```

3. Run migrations:
```bash
npm run migrate
```

4. Start the service:
```bash
npm run dev
```

### Docker Deployment

1. Build and run with Docker Compose:
```bash
cd appData
docker-compose up -d
```

## API Endpoints

### Users
- `POST /api/user` - Create or get user
- `PUT /api/user/email-verified` - Update email verification status

### Profiles
- `GET /api/profile/:firebaseUid` - Get user profile
- `PUT /api/profile/:firebaseUid` - Update user profile
- `PUT /api/profile/:firebaseUid/resume` - Update resume status

### Settings
- `GET /api/settings/:firebaseUid` - Get user settings
- `PUT /api/settings/:firebaseUid` - Update user settings

### Onboarding
- `GET /api/onboarding/:firebaseUid` - Get onboarding progress
- `PUT /api/onboarding/:firebaseUid` - Update onboarding progress
- `PUT /api/onboarding/:firebaseUid/step` - Update current step
- `POST /api/onboarding/:firebaseUid/complete` - Complete onboarding

### Health
- `GET /health` - Service health check

## Database Schema

- **users**: Basic user information
- **user_profiles**: Extended profile data
- **user_settings**: Application settings
- **onboarding_progress**: Onboarding tracking

## Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=careerflow_db
DB_USER=careerflow_user
DB_PASSWORD=careerflow_password
PORT=6000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```
