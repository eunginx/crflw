import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { JobProvider } from './context/JobContext';
import { OnboardingProvider } from './context/OnboardingContext';
// Email-based providers
import { EmailUserProvider, EmailSettingsProvider, EmailApplicationsProvider } from './context';
// Components and pages
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import OnboardingPage from './pages/OnboardingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
// Email-based pages
import EmailSettingsPage from './pages/EmailSettingsPage';
import EmailIntegrationTest from './pages/EmailIntegrationTest';
import AIApplyPage from './pages/AIApplyPage';

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <JobProvider>
          <EmailUserProvider>
            <EmailApplicationsProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="jobs" element={<JobsPage />} />
                    <Route path="applications" element={<ApplicationsPage />} />
                    <Route path="ai-apply" element={<AIApplyPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={
                      <AuthProvider>
                        <JobProvider>
                          <EmailUserProvider>
                            <EmailApplicationsProvider>
                              <SettingsPage />
                            </EmailApplicationsProvider>
                          </EmailUserProvider>
                        </JobProvider>
                      </AuthProvider>
                    } />
                    {/* Email-based routes */}
                    <Route path="email-settings" element={
                      <EmailSettingsProvider>
                        <EmailSettingsPage />
                      </EmailSettingsProvider>
                    } />
                    <Route path="email-test" element={<EmailIntegrationTest />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </Router>
            </EmailApplicationsProvider>
          </EmailUserProvider>
        </JobProvider>
      </OnboardingProvider>
    </AuthProvider>
  );
}

export default App;