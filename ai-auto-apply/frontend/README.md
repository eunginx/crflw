# AI Auto-Apply Frontend

This is the frontend application for the AI Auto-Apply job search automation platform. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Authentication**: Email/password and Google sign-in with Firebase
- **Dashboard**: Overview of job applications and statistics
- **Job Management**: Browse, save, and apply to jobs
- **Application Tracking**: Monitor application status in real-time
- **Profile Management**: Upload and manage resume information
- **Settings**: Configure auto-apply preferences

## Tech Stack

- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Firebase** for authentication and database
- **React Router** for navigation
- **Headless UI** for accessible components
- **Heroicons** for icons

## Prerequisites

- Node.js 18+
- npm or yarn

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```env
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_API_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

### `npm start`

Runs the app in the development mode.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

## Docker Deployment

Build and run with Docker:

```bash
docker build -t ai-auto-apply-frontend .
docker run -p 3000:80 ai-auto-apply-frontend
```

Or use docker-compose from the root directory:

```bash
docker-compose up frontend
```

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).
