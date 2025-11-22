// Context exports index file
// This file exports all email-based contexts for easy importing

export { useEmailUser, EmailUserProvider } from './EmailUserContext';
export { useEmailSettings, EmailSettingsProvider } from './EmailSettingsContext';
export { useEmailApplications, EmailApplicationsProvider } from './EmailApplicationsContext';

// Re-export default exports
export { default as EmailUserContext } from './EmailUserContext';
export { default as EmailSettingsContext } from './EmailSettingsContext';
export { default as EmailApplicationsContext } from './EmailApplicationsContext';
