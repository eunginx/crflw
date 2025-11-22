const db = require('../db');

class UserSettings {
  static async createOrUpdate(userId, settingsData) {
    try {
      // First try to update existing record
      const updateQuery = `
        UPDATE user_settings 
        SET 
          keywords = $2,
          locations = $3,
          salary_min = $4,
          salary_max = $5,
          enable_auto_apply = $6,
          generate_cover_letters = $7,
          apply_remote_only = $8,
          max_applications_per_day = $9,
          onboarding_complete = $10,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
      `;
      
      // Convert string values to proper types
      const updateValues = [
        userId,
        settingsData.keywords || null,
        settingsData.locations || null,
        settingsData.salary_min ? parseInt(settingsData.salary_min) : (settingsData.salaryMin ? parseInt(settingsData.salaryMin) : null),
        settingsData.salary_max ? parseInt(settingsData.salary_max) : (settingsData.salaryMax ? parseInt(settingsData.salaryMax) : null),
        settingsData.enable_auto_apply !== undefined ? (settingsData.enable_auto_apply === 'true' || settingsData.enable_auto_apply === true) : (settingsData.enableAutoApply !== undefined ? (settingsData.enableAutoApply === 'true' || settingsData.enableAutoApply === true) : null),
        settingsData.generate_cover_letters !== undefined ? (settingsData.generate_cover_letters === 'true' || settingsData.generate_cover_letters === true) : (settingsData.generateCoverLetters !== undefined ? (settingsData.generateCoverLetters === 'true' || settingsData.generateCoverLetters === true) : null),
        settingsData.apply_remote_only !== undefined ? (settingsData.apply_remote_only === 'true' || settingsData.apply_remote_only === true) : (settingsData.applyRemoteOnly !== undefined ? (settingsData.applyRemoteOnly === 'true' || settingsData.applyRemoteOnly === true) : null),
        settingsData.max_applications_per_day ? parseInt(settingsData.max_applications_per_day) : (settingsData.maxApplicationsPerDay ? parseInt(settingsData.maxApplicationsPerDay) : null),
        settingsData.onboarding_complete !== undefined ? (settingsData.onboarding_complete === 'true' || settingsData.onboarding_complete === true) : (settingsData.onboardingComplete !== undefined ? (settingsData.onboardingComplete === 'true' || settingsData.onboardingComplete === true) : false)
      ];
      
      const updateResult = await db.query(updateQuery, updateValues);
      
      if (updateResult.rows.length > 0) {
        return updateResult.rows[0];
      }
      
      // If no rows were updated, insert new record
      const insertQuery = `
        INSERT INTO user_settings (user_id, keywords, locations, salary_min, salary_max, enable_auto_apply, generate_cover_letters, apply_remote_only, max_applications_per_day, onboarding_complete)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const insertResult = await db.query(insertQuery, updateValues);
      return insertResult.rows[0];
      
    } catch (error) {
      console.error('Error in createOrUpdate:', error);
      throw error;
    }
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM user_settings WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = UserSettings;
