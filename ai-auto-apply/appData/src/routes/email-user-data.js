import express from 'express';
const router = express.Router();
import UserEmail from '../models/UserEmail.js';
import UserProfileEmail from '../models/UserProfileEmail.js';
import UserSettingsEmail from '../models/UserSettingsEmail.js';
import OnboardingProgressEmail from '../models/OnboardingProgressEmail.js';

console.log('[DEBUG] email-user-data-fixed route loaded');

// Get unified user data by email
router.get('/user-data/:email', async (req, res) => {
  console.log('[DEBUG] user-data route hit for email:', req.params.email);
  try {
    const { email } = req.params;
    
    // Get all data in parallel
    const [user, profile, settings, onboarding] = await Promise.all([
      UserEmail.findByEmail(email),
      UserProfileEmail.findByEmail(email),
      UserSettingsEmail.findByEmail(email),
      OnboardingProgressEmail.findByEmail(email)
    ]);

    console.log('[DEBUG] Data retrieved - user:', !!user, 'profile:', !!profile, 'settings:', !!settings, 'onboarding:', !!onboarding);
    if (settings) {
      console.log('[DEBUG] Existing settings found:', settings);
    }

    // If user doesn't exist, create them with default data
    if (!user) {
      console.log('[DEBUG] User not found, creating new user for email:', email);
      // Generate a unique firebase_uid using timestamp and random string
      const uniqueFirebaseUid = `auto-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const newUser = await UserEmail.createOrUpdate(email, {
        firebase_uid: uniqueFirebaseUid,
        email_verified: true
      });
      
      // Create default settings
      const defaultSettings = await UserSettingsEmail.createOrUpdate(email, {
        keywords: 'Software Engineer',
        locations: 'San Francisco, CA',
        salary_min: 100000,
        salary_max: 200000,
        enable_auto_apply: true,
        generate_cover_letters: true,
        apply_remote_only: false,
        max_applications_per_day: 50,
        job_types: ['full-time', 'contract'],
        industries: ['Technology'],
        company_sizes: ['Medium']
      });
      
      return res.json({
        user: newUser,
        profile: {},
        settings: defaultSettings,
        onboarding: {}
      });
    }

    // If user exists but settings don't exist, create default settings
    if (!settings) {
      console.log('[DEBUG] Settings not found for existing user, creating default settings for email:', email);
      const defaultSettings = await UserSettingsEmail.createOrUpdate(email, {
        keywords: 'Software Engineer',
        locations: 'San Francisco, CA',
        salary_min: 100000,
        salary_max: 200000,
        enable_auto_apply: true,
        generate_cover_letters: true,
        apply_remote_only: false,
        max_applications_per_day: 50,
        job_types: ['full-time', 'contract'],
        industries: ['Technology'],
        company_sizes: ['Medium']
      });
      
      return res.json({
        user: user || {},
        profile: profile || {},
        settings: defaultSettings,
        onboarding: onboarding || {}
      });
    }

    // Return existing data
    console.log('[DEBUG] Returning existing data for email:', email);
    res.json({
      user: user || {},
      profile: profile || {},
      settings: settings || {},
      onboarding: onboarding || {}
    });
  } catch (error) {
    console.error('Error fetching unified user data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to load user data',
      details: error.message 
    });
  }
});

// Update unified user data by email
router.put('/user-data/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { profile, settings, onboarding } = req.body;

    // Ensure user exists - create if not exists
    const existingUser = await UserEmail.findByEmail(email);
    if (!existingUser) {
      console.log('[DEBUG] Creating user for email during PUT:', email);
      // Generate a unique firebase_uid using timestamp and random string
      const uniqueFirebaseUid = `auto-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      await UserEmail.createOrUpdate(email, {
        firebase_uid: uniqueFirebaseUid,
        email_verified: true
      });
    }

    // Transform profile field names to match database schema
    const transformedProfile = profile ? {
      ...profile,
      first_name: profile.firstName,
      last_name: profile.lastName,
      phone: profile.phone,
      location: profile.location,
      headline: profile.headline,
      summary: profile.summary,
    } : {};

    // Transform settings field names to match database schema
    const transformedSettings = settings ? {
      ...settings,
      keywords: settings.keywords,
      locations: settings.locations,
      salary_min: settings.salary_min || settings.salaryMin,
      salary_max: settings.salary_max || settings.salaryMax,
      enable_auto_apply: settings.enable_auto_apply !== undefined ? settings.enable_auto_apply : settings.enableAutoApply,
      generate_cover_letters: settings.generate_cover_letters !== undefined ? settings.generate_cover_letters : settings.generateCoverLetters,
      apply_remote_only: settings.apply_remote_only !== undefined ? settings.apply_remote_only : settings.applyRemoteOnly,
      max_applications_per_day: settings.max_applications_per_day || settings.maxApplicationsPerDay,
    } : {};

    // Update all data in parallel
    const [updatedProfile, updatedSettings, updatedOnboarding] = await Promise.all([
      profile ? UserProfileEmail.createOrUpdate(email, transformedProfile) : Promise.resolve(null),
      settings ? UserSettingsEmail.createOrUpdate(email, transformedSettings) : Promise.resolve(null),
      onboarding ? OnboardingProgressEmail.createOrUpdate(email, onboarding) : Promise.resolve(null)
    ]);

    res.json({
      success: true,
      profile: updatedProfile,
      settings: updatedSettings,
      onboarding: updatedOnboarding
    });
  } catch (error) {
    console.error('Error updating user data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to update user data',
      details: error.message 
    });
  }
});

// Update user Firebase UID
router.put('/user-data/:email/firebase-uid', async (req, res) => {
  try {
    const { email } = req.params;
    const { firebase_uid } = req.body;
    
    console.log('[DEBUG] Updating Firebase UID for email:', email, 'to:', firebase_uid);
    
    const updatedUser = await UserEmail.createOrUpdate(email, {
      firebase_uid: firebase_uid,
      email_verified: true
    });
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating Firebase UID:', error);
    res.status(500).json({ 
      error: 'Failed to update Firebase UID',
      details: error.message 
    });
  }
});

export default router;
