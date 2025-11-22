// Email-based User Context
// This context manages user state using email as the primary identifier

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase';
import { emailUserDataAPI, emailSettingsAPI, emailApplicationsAPI } from '../services/apiService';

interface EmailUser {
  email: string;
  firebaseUid?: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailUserContextType {
  currentUser: EmailUser | null;
  firebaseUser: User | null;
  loading: boolean;
  error: string | null;
  // Authentication methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  // Email-based user management
  createOrUpdateUser: (userData: Partial<EmailUser>) => Promise<EmailUser | null>;
  refreshUserData: () => Promise<void>;
  // Clear error
  clearError: () => void;
}

const EmailUserContext = createContext<EmailUserContextType | undefined>(undefined);

export const useEmailUser = () => {
  const context = useContext(EmailUserContext);
  if (context === undefined) {
    throw new Error('useEmailUser must be used within an EmailUserProvider');
  }
  return context;
};

interface EmailUserProviderProps {
  children: ReactNode;
}

export const EmailUserProvider: React.FC<EmailUserProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<EmailUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clear error function
  const clearError = () => setError(null);

  // Create or update user in email-based system
  const createOrUpdateUser = async (userData: Partial<EmailUser>): Promise<EmailUser | null> => {
    if (!firebaseUser?.email) {
      setError('No authenticated user found');
      return null;
    }

    try {
      console.log('[EMAIL-USER] Creating/updating user in email-based system');
      
      // First try to get existing user data
      let existingUserData = await emailUserDataAPI.getUserData(firebaseUser.email);
      
      if (!existingUserData?.user) {
        // User doesn't exist, but the getUserData call should auto-create them
        // Try getting the data again to trigger user creation
        console.log('[EMAIL-USER] User not found, attempting auto-creation...');
        existingUserData = await emailUserDataAPI.getUserData(firebaseUser.email);
      }
      
      if (existingUserData?.user) {
        setCurrentUser(existingUserData.user);
        console.log('[EMAIL-USER] User created/updated successfully:', existingUserData.user);
        return existingUserData.user;
      } else {
        throw new Error('Failed to create or retrieve user');
      }
    } catch (error: any) {
      console.error('[EMAIL-USER] Failed to create/update user:', error);
      setError(error.message || 'Failed to create user account');
      return null;
    }
  };

  // Refresh user data from email-based system
  const refreshUserData = async (): Promise<void> => {
    if (!firebaseUser?.email) {
      setCurrentUser(null);
      return;
    }

    try {
      console.log('[EMAIL-USER] Refreshing user data');
      const userData = await emailUserDataAPI.getUserData(firebaseUser.email);
      setCurrentUser(userData?.user);
    } catch (error: any) {
      console.error('[EMAIL-USER] Failed to refresh user data:', error);
      if (error.status === 404) {
        // User doesn't exist in email-based system yet, create them
        await createOrUpdateUser({});
      } else {
        setError(error.message || 'Failed to load user data');
      }
    }
  };

  // Authentication methods
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('[EMAIL-USER] Signing in with email:', email);
      
      await signInWithEmailAndPassword(auth, email, password);
      // User will be processed by onAuthStateChanged
    } catch (error: any) {
      console.error('[EMAIL-USER] Sign in failed:', error);
      setError(error.message || 'Failed to sign in');
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('[EMAIL-USER] Signing up with email:', email);
      
      await createUserWithEmailAndPassword(auth, email, password);
      // User will be processed by onAuthStateChanged
    } catch (error: any) {
      console.error('[EMAIL-USER] Sign up failed:', error);
      setError(error.message || 'Failed to create account');
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log('[EMAIL-USER] Signing in with Google');
      
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // User will be processed by onAuthStateChanged
    } catch (error: any) {
      console.error('[EMAIL-USER] Google sign in failed:', error);
      setError(error.message || 'Failed to sign in with Google');
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('[EMAIL-USER] Signing out');
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setFirebaseUser(null);
      setError(null);
    } catch (error: any) {
      console.error('[EMAIL-USER] Sign out failed:', error);
      setError(error.message || 'Failed to sign out');
    }
  };

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[EMAIL-USER] Firebase auth state changed:', user?.email || 'No user');
      
      setFirebaseUser(user);
      setLoading(true);
      
      if (user) {
        // User is authenticated with Firebase
        try {
          // Try to find user in email-based system
          if (user.email) {
            const userData = await emailUserDataAPI.getUserData(user.email);
            
            if (userData?.user) {
              // User exists in email-based system
              setCurrentUser(userData.user);
              console.log('[EMAIL-USER] Found existing user in email-based system');
            } else {
              // User doesn't exist in email-based system, create them
              console.log('[EMAIL-USER] Creating new user in email-based system');
              await createOrUpdateUser({
                firstName: user.displayName?.split(' ')[0],
                lastName: user.displayName?.split(' ').slice(1).join(' ')
              });
            }
          }
        } catch (error: any) {
          console.error('[EMAIL-USER] Error processing user:', error);
          if (error.status !== 404) {
            setError(error.message || 'Failed to load user data');
          } else {
            // 404 means user doesn't exist, which is expected for new users
            if (user.email) {
              await createOrUpdateUser({
                firstName: user.displayName?.split(' ')[0],
                lastName: user.displayName?.split(' ').slice(1).join(' ')
              });
            }
          }
        }
      } else {
        // User is not authenticated
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: EmailUserContextType = {
    currentUser,
    firebaseUser,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    createOrUpdateUser,
    refreshUserData,
    clearError,
  };

  return (
    <EmailUserContext.Provider value={value}>
      {children}
    </EmailUserContext.Provider>
  );
};

export default EmailUserContext;
