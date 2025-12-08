// QA Checklist and Data Consistency Verification
// This utility provides comprehensive checks for the AI Auto Apply system

import { UserProfile, JobPreferences, AutoApplySettings } from '../services/userService';

// QA Check Results
interface QACheckResult {
  passed: boolean;
  issues: string[];
  warnings: string[];
  recommendations: string[];
}

// Data Consistency Check
interface DataConsistencyResult extends QACheckResult {
  profileIssues: string[];
  preferenceIssues: string[];
  settingsIssues: string[];
  syncIssues: string[];
}

// UX Consistency Check
interface UXConsistencyResult extends QACheckResult {
  componentIssues: string[];
  stylingIssues: string[];
  navigationIssues: string[];
  accessibilityIssues: string[];
}

// Complete QA Result
interface CompleteQAResult {
  dataConsistency: DataConsistencyResult;
  uxConsistency: UXConsistencyResult;
  overallScore: number;
  criticalIssues: string[];
  readyForProduction: boolean;
}

// Data Consistency Checks
export class DataConsistencyChecker {
  static checkUserProfile(profile: UserProfile | null): QACheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!profile) {
      issues.push('User profile is null or undefined');
      return { passed: false, issues, warnings, recommendations };
    }

    // Required fields
    const requiredFields = ['name', 'email'];
    requiredFields.forEach(field => {
      if (!profile[field as keyof UserProfile]) {
        issues.push(`Required field '${field}' is missing from profile`);
      }
    });

    // Optional but recommended fields
    const recommendedFields = ['headline', 'summary', 'location', 'phone'];
    recommendedFields.forEach(field => {
      if (!profile[field as keyof UserProfile]) {
        warnings.push(`Recommended field '${field}' is missing from profile`);
        recommendations.push(`Add ${field} to improve profile completeness`);
      }
    });

    // Data format validation
    if (profile.email && !this.isValidEmail(profile.email)) {
      issues.push('Email format is invalid');
    }

    if (profile.phone && !this.isValidPhone(profile.phone)) {
      warnings.push('Phone format may be invalid');
    }

    // Skills validation
    if (profile.skills && Array.isArray(profile.skills)) {
      if (profile.skills.length === 0) {
        warnings.push('No skills listed in profile');
        recommendations.push('Add skills to improve job matching');
      } else {
        const emptySkills = profile.skills.filter((skill: string) => !skill.trim());
        if (emptySkills.length > 0) {
          issues.push(`${emptySkills.length} empty skill entries found`);
        }
      }
    }

    const passed = issues.length === 0;
    return { passed, issues, warnings, recommendations };
  }

  static checkJobPreferences(preferences: JobPreferences | null): QACheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!preferences) {
      issues.push('Job preferences are null or undefined');
      return { passed: false, issues, warnings, recommendations };
    }

    // Keywords validation
    if (!preferences.keywords || preferences.keywords.trim() === '') {
      warnings.push('No job keywords specified');
      recommendations.push('Add keywords to improve job matching');
    } else {
      const keywords = preferences.keywords.split(',').map((k: string) => k.trim());
      if (keywords.length === 0) {
        issues.push('Keywords format is invalid');
      } else {
        const emptyKeywords = keywords.filter((k: string) => k === '');
        if (emptyKeywords.length > 0) {
          warnings.push(`${emptyKeywords.length} empty keyword entries found`);
        }
      }
    }

    // Locations validation
    if (!preferences.locations || preferences.locations.trim() === '') {
      warnings.push('No locations specified');
      recommendations.push('Add locations to find relevant jobs');
    }

    // Salary validation
    if (preferences.salaryMin && preferences.salaryMax) {
      if (preferences.salaryMin > preferences.salaryMax) {
        issues.push('Minimum salary is greater than maximum salary');
      }
      if (preferences.salaryMin < 0 || preferences.salaryMax < 0) {
        issues.push('Salary values cannot be negative');
      }
    } else if (preferences.salaryMin || preferences.salaryMax) {
      warnings.push('Only one salary value specified (min or max)');
      recommendations.push('Specify both minimum and maximum salary for better filtering');
    }

    // Job types validation
    if (preferences.jobTypes && Array.isArray(preferences.jobTypes)) {
      const validJobTypes = ['full-time', 'part-time', 'contract', 'internship', 'temporary'];
      const invalidJobTypes = preferences.jobTypes.filter((type: string) => !validJobTypes.includes(type));
      if (invalidJobTypes.length > 0) {
        warnings.push(`Invalid job types: ${invalidJobTypes.join(', ')}`);
      }
    }

    const passed = issues.length === 0;
    return { passed, issues, warnings, recommendations };
  }

  static checkAutoApplySettings(settings: AutoApplySettings | null): QACheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (!settings) {
      issues.push('Auto-apply settings are null or undefined');
      return { passed: false, issues, warnings, recommendations };
    }

    // Daily limit validation
    if (settings.maxApplicationsPerDay && settings.maxApplicationsPerDay < 1) {
      issues.push('Daily limit must be at least 1');
    } else if (settings.maxApplicationsPerDay && settings.maxApplicationsPerDay > 50) {
      warnings.push('Daily limit is very high (over 50 applications per day)');
      recommendations.push('Consider a more reasonable daily limit');
    }

    // Experience level validation (not in current AutoApplySettings schema)
    // Note: experienceLevel would need to be added to the schema
    // if (settings.experienceLevel) {
    //   const validLevels = ['entry', 'junior', 'mid', 'senior', 'lead', 'principal'];
    //   if (!validLevels.includes(settings.experienceLevel)) {
    //     warnings.push(`Invalid experience level: ${settings.experienceLevel}`);
    //     recommendations.push('Use a valid experience level');
    //   }
    // }

    // Remote preference validation
    if (settings.applyRemoteOnly !== undefined && typeof settings.applyRemoteOnly !== 'boolean') {
      issues.push('Remote preference must be a boolean value');
    }

    // Cover letter preference validation
    if (settings.generateCoverLetters !== undefined && typeof settings.generateCoverLetters !== 'boolean') {
      issues.push('Auto cover letters preference must be a boolean value');
    }

    const passed = issues.length === 0;
    return { passed, issues, warnings, recommendations };
  }

  static checkDataSync(profile: UserProfile | null, preferences: JobPreferences | null, settings: AutoApplySettings | null): QACheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check if all data exists
    if (!profile) issues.push('Profile data missing');
    if (!preferences) issues.push('Preferences data missing');
    if (!settings) issues.push('Settings data missing');

    if (profile && preferences) {
      // Check skills sync
      if (profile.skills && profile.skills.length > 0) {
        if (!preferences.keywords || preferences.keywords.trim() === '') {
          warnings.push('Skills exist in profile but no keywords in preferences');
          recommendations.push('Sync profile skills to preferences keywords');
        }
      }

      // Check location sync
      if (profile.location && profile.location.trim() !== '') {
        if (!preferences.locations || preferences.locations.trim() === '') {
          warnings.push('Location exists in profile but no locations in preferences');
          recommendations.push('Add profile location to preferences');
        }
      }
    }

    // Check for logical inconsistencies
    if (settings && preferences) {
      if (settings.applyRemoteOnly && (!preferences.locations || !preferences.locations.toLowerCase().includes('remote'))) {
        warnings.push('Remote-only setting enabled but remote not in preferred locations');
        recommendations.push('Add "remote" to preferred locations or disable remote-only setting');
      }
    }

    const passed = issues.length === 0;
    return { passed, issues, warnings, recommendations };
  }

  static runFullDataConsistencyCheck(
    profile: UserProfile | null,
    preferences: JobPreferences | null,
    settings: AutoApplySettings | null
  ): DataConsistencyResult {
    const profileCheck = this.checkUserProfile(profile);
    const preferenceCheck = this.checkJobPreferences(preferences);
    const settingsCheck = this.checkAutoApplySettings(settings);
    const syncCheck = this.checkDataSync(profile, preferences, settings);

    const allIssues = [
      ...profileCheck.issues,
      ...preferenceCheck.issues,
      ...settingsCheck.issues,
      ...syncCheck.issues
    ];

    const allWarnings = [
      ...profileCheck.warnings,
      ...preferenceCheck.warnings,
      ...settingsCheck.warnings,
      ...syncCheck.warnings
    ];

    const allRecommendations = [
      ...profileCheck.recommendations,
      ...preferenceCheck.recommendations,
      ...settingsCheck.recommendations,
      ...syncCheck.recommendations
    ];

    const passed = allIssues.length === 0;

    return {
      passed,
      issues: allIssues,
      warnings: allWarnings,
      recommendations: allRecommendations,
      profileIssues: profileCheck.issues,
      preferenceIssues: preferenceCheck.issues,
      settingsIssues: settingsCheck.issues,
      syncIssues: syncCheck.issues
    };
  }

  // Helper validation methods
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
}

// UX Consistency Checks
export class UXConsistencyChecker {
  static checkComponentConsistency(): QACheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // This would typically check for component usage consistency
    // For now, we'll provide a framework for such checks

    // Check for consistent button usage
    warnings.push('Consider implementing unified button components');
    recommendations.push('Use the design system button classes for consistency');

    // Check for consistent form inputs
    warnings.push('Consider implementing unified form input components');
    recommendations.push('Use shared form components for consistency');

    const passed = issues.length === 0;
    return { passed, issues, warnings, recommendations };
  }

  static checkStylingConsistency(): QACheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for consistent color usage
    warnings.push('Verify consistent use of design system colors');
    recommendations.push('Use CSS custom properties for colors');

    // Check for consistent typography
    warnings.push('Verify consistent typography scale usage');
    recommendations.push('Use design system typography classes');

    // Check for consistent spacing
    warnings.push('Verify consistent spacing usage');
    recommendations.push('Use design system spacing scale');

    const passed = issues.length === 0;
    return { passed, issues, warnings, recommendations };
  }

  static checkNavigationConsistency(): QACheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check navigation structure
    warnings.push('Verify all pages are accessible through navigation');
    recommendations.push('Test navigation flow between all pages');

    // Check breadcrumb consistency
    warnings.push('Consider implementing breadcrumbs for better navigation');
    recommendations.push('Add breadcrumbs to show user location');

    const passed = issues.length === 0;
    return { passed, issues, warnings, recommendations };
  }

  static checkAccessibility(): QACheckResult {
    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check for alt text on images
    warnings.push('Verify all images have appropriate alt text');
    recommendations.push('Add descriptive alt text to all meaningful images');

    // Check for proper heading hierarchy
    warnings.push('Verify proper heading hierarchy (h1, h2, h3...)');
    recommendations.push('Use semantic HTML heading structure');

    // Check for form labels
    warnings.push('Verify all form inputs have associated labels');
    recommendations.push('Add proper labels to all form inputs');

    // Check for keyboard navigation
    warnings.push('Verify all interactive elements are keyboard accessible');
    recommendations.push('Test keyboard navigation for all interactions');

    const passed = issues.length === 0;
    return { passed, issues, warnings, recommendations };
  }

  static runFullUXConsistencyCheck(): UXConsistencyResult {
    const componentCheck = this.checkComponentConsistency();
    const stylingCheck = this.checkStylingConsistency();
    const navigationCheck = this.checkNavigationConsistency();
    const accessibilityCheck = this.checkAccessibility();

    const allIssues = [
      ...componentCheck.issues,
      ...stylingCheck.issues,
      ...navigationCheck.issues,
      ...accessibilityCheck.issues
    ];

    const allWarnings = [
      ...componentCheck.warnings,
      ...stylingCheck.warnings,
      ...navigationCheck.warnings,
      ...accessibilityCheck.warnings
    ];

    const allRecommendations = [
      ...componentCheck.recommendations,
      ...stylingCheck.recommendations,
      ...navigationCheck.recommendations,
      ...accessibilityCheck.recommendations
    ];

    const passed = allIssues.length === 0;

    return {
      passed,
      issues: allIssues,
      warnings: allWarnings,
      recommendations: allRecommendations,
      componentIssues: componentCheck.issues,
      stylingIssues: stylingCheck.issues,
      navigationIssues: navigationCheck.issues,
      accessibilityIssues: accessibilityCheck.issues
    };
  }
}

// Complete QA System
export class QASystem {
  static runCompleteQACheck(
    profile: UserProfile | null,
    preferences: JobPreferences | null,
    settings: AutoApplySettings | null
  ): CompleteQAResult {
    const dataConsistency = DataConsistencyChecker.runFullDataConsistencyCheck(profile, preferences, settings);
    const uxConsistency = UXConsistencyChecker.runFullUXConsistencyCheck();

    const totalIssues = dataConsistency.issues.length + uxConsistency.issues.length;
    const totalWarnings = dataConsistency.warnings.length + uxConsistency.warnings.length;
    const totalRecommendations = dataConsistency.recommendations.length + uxConsistency.recommendations.length;

    // Calculate overall score (0-100)
    const maxScore = 100;
    const issueDeduction = totalIssues * 10; // Each issue deducts 10 points
    const warningDeduction = totalWarnings * 2; // Each warning deducts 2 points
    const overallScore = Math.max(0, maxScore - issueDeduction - warningDeduction);

    // Critical issues are data consistency issues
    const criticalIssues = dataConsistency.issues;

    const readyForProduction = dataConsistency.passed && overallScore >= 80;

    return {
      dataConsistency,
      uxConsistency,
      overallScore,
      criticalIssues,
      readyForProduction
    };
  }

  static generateQAReport(result: CompleteQAResult): string {
    const report = [
      '# AI Auto Apply - QA Report',
      '',
      `Overall Score: ${result.overallScore}/100`,
      `Ready for Production: ${result.readyForProduction ? '✅ YES' : '❌ NO'}`,
      '',
      '## Critical Issues',
      ...result.criticalIssues.map(issue => `- ❌ ${issue}`),
      '',
      '## Data Consistency Issues',
      ...result.dataConsistency.issues.map(issue => `- ⚠️ ${issue}`),
      '',
      '## UX Consistency Issues',
      ...result.uxConsistency.issues.map(issue => `- ⚠️ ${issue}`),
      '',
      '## Warnings',
      ...[...result.dataConsistency.warnings, ...result.uxConsistency.warnings].map(warning => `- ⚠️ ${warning}`),
      '',
      '## Recommendations',
      ...[...result.dataConsistency.recommendations, ...result.uxConsistency.recommendations].map(rec => `- 💡 ${rec}`),
      '',
      '---',
      `Generated on: ${new Date().toLocaleDateString()}`
    ].join('\n');

    return report;
  }

  static getQuickStats(result: CompleteQAResult) {
    return {
      totalIssues: result.dataConsistency.issues.length + result.uxConsistency.issues.length,
      totalWarnings: result.dataConsistency.warnings.length + result.uxConsistency.warnings.length,
      totalRecommendations: result.dataConsistency.recommendations.length + result.uxConsistency.recommendations.length,
      criticalIssues: result.criticalIssues.length,
      score: result.overallScore,
      ready: result.readyForProduction
    };
  }
}

// Export QA classes
export default QASystem;
