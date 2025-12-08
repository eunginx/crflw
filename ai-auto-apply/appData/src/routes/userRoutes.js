import express from 'express';
const router = express.Router();
import UserEmail from '../models/UserEmail.js';
import UserProfileEmail from '../models/UserProfileEmail.js';
import UserSettingsEmail from '../models/UserSettingsEmail.js';
import OnboardingProgressEmail from '../models/OnboardingProgressEmail.js';

console.log('[DEBUG] Unified user routes loaded');

// ===== PROFILE ENDPOINTS =====

// Get user profile
router.get('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const [user, profile] = await Promise.all([
      UserEmail.findByEmail(email),
      UserProfileEmail.findByEmail(email)
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      location: profile?.location,
      headline: profile?.headline,
      summary: profile?.summary,
      resumeUploaded: profile?.resume_uploaded || false,
      resumeFilename: profile?.resume_filename,
      skills: profile?.skills || [],
      experienceYears: profile?.experience_years || 0,
      linkedinUrl: profile?.linkedin_url,
      githubUrl: profile?.github_url,
      portfolioUrl: profile?.portfolio_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      error: 'Failed to load profile',
      details: error.message 
    });
  }
});

// Update user profile
router.put('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profileData = req.body;

    // Ensure user exists
    const existingUser = await UserEmail.findByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform profile data to match database schema
    const transformedProfile = {
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      phone: profileData.phone,
      location: profileData.location,
      headline: profileData.headline,
      summary: profileData.summary,
      skills: profileData.skills || [],
      experience_years: profileData.experienceYears || 0,
      linkedin_url: profileData.linkedinUrl,
      github_url: profileData.githubUrl,
      portfolio_url: profileData.portfolioUrl
    };

    // Update user basic info and profile in parallel
    const [updatedUser, updatedProfile] = await Promise.all([
      UserEmail.createOrUpdate(email, {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone
      }),
      UserProfileEmail.createOrUpdate(email, transformedProfile)
    ]);

    res.json({
      success: true,
      profile: {
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        location: updatedProfile?.location,
        headline: updatedProfile?.headline,
        summary: updatedProfile?.summary,
        skills: updatedProfile?.skills || [],
        experienceYears: updatedProfile?.experience_years || 0,
        linkedinUrl: updatedProfile?.linkedin_url,
        githubUrl: updatedProfile?.github_url,
        portfolioUrl: updatedProfile?.portfolio_url,
        updatedAt: updatedProfile?.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      details: error.message 
    });
  }
});

// ===== JOB PREFERENCES ENDPOINTS =====

// Get job preferences
router.get('/preferences/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const settings = await UserSettingsEmail.findByEmail(email);
    if (!settings) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    res.json({
      keywords: settings.keywords,
      locations: settings.locations,
      salaryMin: settings.salary_min,
      salaryMax: settings.salary_max,
      jobTypes: settings.job_types || ['full-time', 'contract'],
      industries: settings.industries || [],
      companySizes: settings.company_sizes || [],
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    });
  } catch (error) {
    console.error('Error fetching job preferences:', error);
    res.status(500).json({ 
      error: 'Failed to load preferences',
      details: error.message 
    });
  }
});

// Update job preferences
router.put('/preferences/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const preferencesData = req.body;

    // Ensure user exists
    const existingUser = await UserEmail.findByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform preferences data to match database schema
    const transformedPreferences = {
      keywords: preferencesData.keywords,
      locations: preferencesData.locations,
      salary_min: preferencesData.salaryMin,
      salary_max: preferencesData.salaryMax,
      job_types: preferencesData.jobTypes || ['full-time', 'contract'],
      industries: preferencesData.industries || [],
      company_sizes: preferencesData.companySizes || []
    };

    const updatedPreferences = await UserSettingsEmail.createOrUpdate(email, transformedPreferences);

    res.json({
      success: true,
      preferences: {
        keywords: updatedPreferences.keywords,
        locations: updatedPreferences.locations,
        salaryMin: updatedPreferences.salary_min,
        salaryMax: updatedPreferences.salary_max,
        jobTypes: updatedPreferences.job_types || ['full-time', 'contract'],
        industries: updatedPreferences.industries || [],
        companySizes: updatedPreferences.company_sizes || [],
        updatedAt: updatedPreferences.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating job preferences:', error);
    res.status(500).json({ 
      error: 'Failed to update preferences',
      details: error.message 
    });
  }
});

// ===== AUTO-APPLY SETTINGS ENDPOINTS =====

// Get auto-apply settings
router.get('/autoapply/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const settings = await UserSettingsEmail.findByEmail(email);
    if (!settings) {
      return res.status(404).json({ error: 'Auto-apply settings not found' });
    }

    res.json({
      enableAutoApply: settings.enable_auto_apply,
      generateCoverLetters: settings.generate_cover_letters,
      applyRemoteOnly: settings.apply_remote_only,
      maxApplicationsPerDay: settings.max_applications_per_day,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at
    });
  } catch (error) {
    console.error('Error fetching auto-apply settings:', error);
    res.status(500).json({ 
      error: 'Failed to load auto-apply settings',
      details: error.message 
    });
  }
});

// Update auto-apply settings
router.put('/autoapply/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const autoApplyData = req.body;

    // Ensure user exists
    const existingUser = await UserEmail.findByEmail(email);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Transform auto-apply data to match database schema
    const transformedAutoApply = {
      enable_auto_apply: autoApplyData.enableAutoApply,
      generate_cover_letters: autoApplyData.generateCoverLetters,
      apply_remote_only: autoApplyData.applyRemoteOnly,
      max_applications_per_day: autoApplyData.maxApplicationsPerDay
    };

    const updatedSettings = await UserSettingsEmail.createOrUpdate(email, transformedAutoApply);

    res.json({
      success: true,
      autoApplySettings: {
        enableAutoApply: updatedSettings.enable_auto_apply,
        generateCoverLetters: updatedSettings.generate_cover_letters,
        applyRemoteOnly: updatedSettings.apply_remote_only,
        maxApplicationsPerDay: updatedSettings.max_applications_per_day,
        updatedAt: updatedSettings.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating auto-apply settings:', error);
    res.status(500).json({ 
      error: 'Failed to update auto-apply settings',
      details: error.message 
    });
  }
});

// ===== SYNC ENDPOINT =====

// Sync all user data (comprehensive update)
router.post('/sync/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { profile, preferences, autoApplySettings, onboarding } = req.body;

    console.log('[SYNC] Starting sync for email:', email);

    // Ensure user exists - create if not exists
    const existingUser = await UserEmail.findByEmail(email);
    if (!existingUser) {
      console.log('[SYNC] Creating user during sync:', email);
      const uniqueFirebaseUid = `auto-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      await UserEmail.createOrUpdate(email, {
        firebase_uid: uniqueFirebaseUid,
        email_verified: true
      });
    }

    // Prepare all update operations
    const updates = [];

    // Profile updates
    if (profile) {
      const transformedProfile = {
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        location: profile.location,
        headline: profile.headline,
        summary: profile.summary,
        skills: profile.skills || [],
        experience_years: profile.experienceYears || 0,
        linkedin_url: profile.linkedinUrl,
        github_url: profile.githubUrl,
        portfolio_url: profile.portfolioUrl
      };
      updates.push(UserProfileEmail.createOrUpdate(email, transformedProfile));
      updates.push(UserEmail.createOrUpdate(email, {
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone
      }));
    }

    // Job preferences updates
    if (preferences) {
      const transformedPreferences = {
        keywords: preferences.keywords,
        locations: preferences.locations,
        salary_min: preferences.salaryMin,
        salary_max: preferences.salaryMax,
        job_types: preferences.jobTypes || ['full-time', 'contract'],
        industries: preferences.industries || [],
        company_sizes: preferences.companySizes || []
      };
      updates.push(UserSettingsEmail.createOrUpdate(email, transformedPreferences));
    }

    // Auto-apply settings updates
    if (autoApplySettings) {
      const transformedAutoApply = {
        enable_auto_apply: autoApplySettings.enableAutoApply,
        generate_cover_letters: autoApplySettings.generateCoverLetters,
        apply_remote_only: autoApplySettings.applyRemoteOnly,
        max_applications_per_day: autoApplySettings.maxApplicationsPerDay
      };
      updates.push(UserSettingsEmail.createOrUpdate(email, transformedAutoApply));
    }

    // Onboarding updates
    if (onboarding) {
      updates.push(OnboardingProgressEmail.createOrUpdate(email, onboarding));
    }

    // Execute all updates in parallel
    const results = await Promise.all(updates);

    // Fetch updated data to return
    const [user, profileResult, settingsResult, onboardingResult] = await Promise.all([
      UserEmail.findByEmail(email),
      UserProfileEmail.findByEmail(email),
      UserSettingsEmail.findByEmail(email),
      OnboardingProgressEmail.findByEmail(email)
    ]);

    console.log('[SYNC] Sync completed for email:', email);

    res.json({
      success: true,
      synced: {
        profile: profile ? profileResult : null,
        preferences: preferences ? settingsResult : null,
        autoApplySettings: autoApplySettings ? settingsResult : null,
        onboarding: onboarding ? onboardingResult : null
      },
      completeData: {
        user: user,
        profile: profileResult,
        settings: settingsResult,
        onboarding: onboardingResult
      }
    });
  } catch (error) {
    console.error('Error during sync:', error);
    res.status(500).json({ 
      error: 'Failed to sync user data',
      details: error.message 
    });
  }
});

export default router;
