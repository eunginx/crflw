// Data Sync Verification Utility
// Ensures data consistency between onboarding, settings, and profile pages

import { UserProfile, JobPreferences, AutoApplySettings } from '../services/userService';

// Sync verification results
interface SyncVerificationResult {
  passed: boolean;
  issues: string[];
  fixes: Array<{
    field: string;
    issue: string;
    fix: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
}

// Field mapping between different data sources
interface FieldMapping {
  profile: string;
  preferences: string;
  settings: string;
  description: string;
}

// Data sync verifier
export class DataSyncVerifier {
  // Define field mappings that should be consistent
  private static readonly FIELD_MAPPINGS: FieldMapping[] = [
    {
      profile: 'firstName',
      preferences: 'name',
      settings: 'name',
      description: 'User name should be consistent across all data sources'
    },
    {
      profile: 'email',
      preferences: 'email',
      settings: 'email',
      description: 'Email should be consistent across all data sources'
    },
    {
      profile: 'location',
      preferences: 'locations',
      settings: 'location',
      description: 'Location should be synced between profile and preferences'
    },
    {
      profile: 'skills',
      preferences: 'keywords',
      settings: 'skills',
      description: 'Skills should be converted to keywords in preferences'
    },
    {
      profile: 'headline',
      preferences: 'jobTitle',
      settings: 'headline',
      description: 'Headline/job title should be consistent'
    }
  ];

  // Verify data sync between profile, preferences, and settings
  static verifyDataSync(
    profile: UserProfile | null,
    preferences: JobPreferences | null,
    settings: AutoApplySettings | null
  ): SyncVerificationResult {
    const issues: string[] = [];
    const fixes: Array<{ field: string; issue: string; fix: string; priority: 'high' | 'medium' | 'low' }> = [];
    const recommendations: string[] = [];

    // Check if all data sources exist
    if (!profile) {
      issues.push('Profile data is missing');
      fixes.push({
        field: 'profile',
        issue: 'Profile data is null or undefined',
        fix: 'Load or create user profile',
        priority: 'high'
      });
    }

    if (!preferences) {
      issues.push('Preferences data is missing');
      fixes.push({
        field: 'preferences',
        issue: 'Preferences data is null or undefined',
        fix: 'Load or create user preferences',
        priority: 'high'
      });
    }

    if (!settings) {
      issues.push('Settings data is missing');
      fixes.push({
        field: 'settings',
        issue: 'Settings data is null or undefined',
        fix: 'Load or create user settings',
        priority: 'high'
      });
    }

    // If any data source is missing, return early
    if (!profile || !preferences || !settings) {
      return {
        passed: false,
        issues,
        fixes,
        recommendations: ['Complete onboarding process to initialize all data sources']
      };
    }

    // Verify field mappings
    this.FIELD_MAPPINGS.forEach(mapping => {
      const profileValue = profile[mapping.profile as keyof UserProfile];
      const preferencesValue = preferences[mapping.preferences as keyof JobPreferences];
      const settingsValue = settings[mapping.settings as keyof AutoApplySettings];

      // Check for consistency
      if (this.isInconsistent(profileValue, preferencesValue, mapping.profile, mapping.preferences)) {
        issues.push(`Inconsistent ${mapping.description}`);
        fixes.push({
          field: `${mapping.profile}/${mapping.preferences}`,
          issue: `Profile ${mapping.profile} (${profileValue}) doesn't match preferences ${mapping.preferences} (${preferencesValue})`,
          fix: `Sync ${mapping.profile} from profile to preferences`,
          priority: 'medium'
        });
      }

      if (this.isInconsistent(profileValue, settingsValue, mapping.profile, mapping.settings)) {
        issues.push(`Inconsistent ${mapping.description}`);
        fixes.push({
          field: `${mapping.profile}/${mapping.settings}`,
          issue: `Profile ${mapping.profile} (${profileValue}) doesn't match settings ${mapping.settings} (${settingsValue})`,
          fix: `Sync ${mapping.profile} from profile to settings`,
          priority: 'medium'
        });
      }
    });

    // Specific checks for skills to keywords conversion
    if (profile.skills && Array.isArray(profile.skills)) {
      const skillsString = profile.skills.join(', ');
      const keywordsString = preferences.keywords || '';
      
      if (!this.containsAllKeywords(skillsString, keywordsString)) {
        const missingSkills = profile.skills.filter((skill: string) => 
          !keywordsString.toLowerCase().includes(skill.toLowerCase())
        );
        
        if (missingSkills.length > 0) {
          issues.push('Skills from profile not reflected in preferences keywords');
          fixes.push({
            field: 'skills/keywords',
            issue: `Skills [${missingSkills.join(', ')}] not found in preferences keywords`,
            fix: `Add missing skills to preferences keywords`,
            priority: 'high'
          });
        }
      }
    }

    // Specific checks for location
    if (profile.location && preferences.locations) {
      const profileLocation = profile.location.toLowerCase();
      const preferencesLocations = preferences.locations.toLowerCase();
      
      if (!preferencesLocations.includes(profileLocation)) {
        issues.push('Profile location not in preferences locations');
        fixes.push({
          field: 'location/locations',
          issue: `Profile location "${profile.location}" not in preferences locations`,
          fix: `Add profile location to preferences locations`,
          priority: 'medium'
        });
      }
    }

    // Check for logical inconsistencies
    if (settings.applyRemoteOnly && preferences.locations) {
      if (!preferences.locations.toLowerCase().includes('remote')) {
        issues.push('Remote-only setting conflicts with preferences');
        fixes.push({
          field: 'applyRemoteOnly/locations',
          issue: 'Remote-only enabled but "remote" not in preferred locations',
          fix: 'Add "remote" to preferred locations or disable remote-only',
          priority: 'high'
        });
      }
    }

    // Check for empty or invalid data
    if (!profile.skills || profile.skills.length === 0) {
      recommendations.push('Add skills to profile for better job matching');
    }

    if (!preferences.keywords || preferences.keywords.trim() === '') {
      recommendations.push('Add keywords to preferences for better job matching');
    }

    if (!preferences.locations || preferences.locations.trim() === '') {
      recommendations.push('Add locations to preferences to find relevant jobs');
    }

    if (!preferences.salaryMin && !preferences.salaryMax) {
      recommendations.push('Set salary preferences to filter job opportunities');
    }

    const passed = issues.length === 0;

    return {
      passed,
      issues,
      fixes,
      recommendations
    };
  }

  // Generate sync fixes
  static generateSyncFixes(
    profile: UserProfile | null,
    preferences: JobPreferences | null,
    settings: AutoApplySettings | null
  ): Array<{
    field: string;
    action: string;
    code: string;
  }> {
    const fixes: Array<{ field: string; action: string; code: string }> = [];

    if (!profile || !preferences || !settings) {
      return fixes;
    }

    // Sync skills to keywords
    if (profile.skills && Array.isArray(profile.skills)) {
      const currentKeywords = preferences.keywords || '';
      const missingSkills = profile.skills.filter((skill: string) => 
        !currentKeywords.toLowerCase().includes(skill.toLowerCase())
      );

      if (missingSkills.length > 0) {
        const newKeywords = [...currentKeywords.split(',').map((k: string) => k.trim()), ...missingSkills]
          .filter((k: string) => k.trim() !== '')
          .join(', ');

        fixes.push({
          field: 'skills/keywords',
          action: 'Sync profile skills to preferences keywords',
          code: `preferences.keywords = "${newKeywords}";`
        });
      }
    }

    // Sync location to locations
    if (profile.location && preferences.locations) {
      const profileLocation = profile.location;
      const currentLocations = preferences.locations.split(',').map((l: string) => l.trim());
      
      if (!currentLocations.includes(profileLocation)) {
        const newLocations = [...currentLocations, profileLocation].join(', ');
        fixes.push({
          field: 'location/locations',
          action: 'Add profile location to preferences locations',
          code: `preferences.locations = "${newLocations}";`
        });
      }
    }

    // Sync firstName (note: preferences/settings don't have name field in current schema)
    if (profile.firstName) {
      // This would require extending the schema to include name fields
      // Skipping since this function only returns fixes, not recommendations
    }

    // Sync email (note: preferences don't have email field in current schema)
    if (profile.email) {
      // This would require extending the schema to include email field
      // Skipping since this function only returns fixes, not recommendations
    }

    return fixes;
  }

  // Apply sync fixes
  static applySyncFixes(
    profile: UserProfile,
    preferences: JobPreferences,
    settings: AutoApplySettings
  ): {
    updatedProfile: UserProfile;
    updatedPreferences: JobPreferences;
    updatedSettings: AutoApplySettings;
    appliedFixes: string[];
  } {
    const appliedFixes: string[] = [];
    const updatedProfile = { ...profile };
    const updatedPreferences = { ...preferences };
    const updatedSettings = { ...settings };

    // Apply skills to keywords sync
    if (updatedProfile.skills && Array.isArray(updatedProfile.skills)) {
      const currentKeywords = updatedPreferences.keywords || '';
      const missingSkills = updatedProfile.skills.filter((skill: string) => 
        !currentKeywords.toLowerCase().includes(skill.toLowerCase())
      );

      if (missingSkills.length > 0) {
        const newKeywords = [...currentKeywords.split(',').map((k: string) => k.trim()), ...missingSkills]
          .filter((k: string) => k.trim() !== '')
          .join(', ');

        updatedPreferences.keywords = newKeywords;
        appliedFixes.push(`Synced ${missingSkills.length} skills to preferences keywords`);
      }
    }

    // Apply location to locations sync
    if (updatedProfile.location && updatedPreferences.locations) {
      const profileLocation = updatedProfile.location;
      const currentLocations = updatedPreferences.locations.split(',').map((l: string) => l.trim());
      
      if (!currentLocations.includes(profileLocation)) {
        const newLocations = [...currentLocations, profileLocation].join(', ');
        updatedPreferences.locations = newLocations;
        appliedFixes.push(`Added profile location to preferences locations`);
      }
    }

    // Apply name sync (using firstName since profile doesn't have 'name' field)
    if (updatedProfile.firstName) {
      // Note: This would require extending the schema to include name fields
      appliedFixes.push('Name sync skipped - schema extension needed');
    }

    // Apply email sync (note: preferences don't have email field in current schema)
    if (updatedProfile.email) {
      // Note: This would require extending the schema to include email field
      appliedFixes.push('Email sync skipped - schema extension needed');
    }

    // Apply remote-only fix
    if (updatedSettings.applyRemoteOnly && updatedPreferences.locations) {
      if (!updatedPreferences.locations.toLowerCase().includes('remote')) {
        updatedPreferences.locations = updatedPreferences.locations + ', remote';
        appliedFixes.push('Added "remote" to preferences locations for remote-only setting');
      }
    }

    return {
      updatedProfile,
      updatedPreferences,
      updatedSettings,
      appliedFixes
    };
  }

  // Helper methods
  private static isInconsistent(
    value1: any,
    value2: any,
    field1: string,
    field2: string
  ): boolean {
    // Handle arrays vs strings
    if (Array.isArray(value1) && typeof value2 === 'string') {
      const value1String = value1.join(', ');
      return value1String !== value2;
    }

    if (typeof value1 === 'string' && Array.isArray(value2)) {
      const value2String = value2.join(', ');
      return value1 !== value2String;
    }

    // Handle null/undefined
    if (value1 == null && value2 == null) return false;
    if (value1 == null || value2 == null) return true;

    // Normal comparison
    return value1 !== value2;
  }

  private static containsAllKeywords(skillsString: string, keywordsString: string): boolean {
    const skills = skillsString.toLowerCase().split(',').map(s => s.trim());
    const keywords = keywordsString.toLowerCase().split(',').map(k => k.trim());
    
    return skills.every(skill => 
      keywords.some(keyword => keyword.includes(skill) || skill.includes(keyword))
    );
  }

  // Get sync status summary
  static getSyncStatusSummary(result: SyncVerificationResult): {
    status: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    message: string;
  } {
    const totalIssues = result.issues.length;
    const totalFixes = result.fixes.length;
    const highPriorityFixes = result.fixes.filter(f => f.priority === 'high').length;

    // Calculate score (0-100)
    let score = 100;
    score -= totalIssues * 20; // Each issue deducts 20 points
    score -= totalFixes * 10; // Each fix deducts 10 points
    score -= highPriorityFixes * 15; // High priority fixes deduct extra
    score = Math.max(0, score);

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let message: string;

    if (score >= 90) {
      status = 'excellent';
      message = 'Data sync is excellent - all data sources are consistent';
    } else if (score >= 75) {
      status = 'good';
      message = 'Data sync is good - minor inconsistencies found';
    } else if (score >= 60) {
      status = 'fair';
      message = 'Data sync is fair - several inconsistencies need attention';
    } else {
      status = 'poor';
      message = 'Data sync is poor - major inconsistencies require immediate attention';
    }

    return { status, score, message };
  }
}

export default DataSyncVerifier;
