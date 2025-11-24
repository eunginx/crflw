import { query as dbQuery } from '../db.js';

class OnboardingProgress {
  static async createOrUpdate(userId, progressData) {
    const sql = `
      INSERT INTO onboarding_progress (user_id, email_verified, resume_uploaded, profile_complete, settings_complete, current_step, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        email_verified = EXCLUDED.email_verified,
        resume_uploaded = EXCLUDED.resume_uploaded,
        profile_complete = EXCLUDED.profile_complete,
        settings_complete = EXCLUDED.settings_complete,
        current_step = EXCLUDED.current_step,
        completed_at = EXCLUDED.completed_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      userId,
      progressData.emailVerified,
      progressData.resumeUploaded,
      progressData.profileComplete,
      progressData.settingsComplete,
      progressData.currentStep,
      progressData.completedAt
    ];
    const result = await dbQuery(sql, values);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const sql = 'SELECT * FROM onboarding_progress WHERE user_id = $1';
    const result = await dbQuery(sql, [userId]);
    return result.rows[0];
  }

  static async updateStep(userId, step) {
    const sql = `
      UPDATE onboarding_progress 
      SET current_step = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await db.query(query, [userId, step]);
    return result.rows[0];
  }

  static async markComplete(userId) {
    const sql = `
      UPDATE onboarding_progress 
      SET completed_at = CURRENT_TIMESTAMP, current_step = 7, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await dbQuery(sql, [userId]);
    return result.rows[0];
  }

  static async isComplete(userId) {
    const queryText = 'SELECT completed_at IS NOT NULL as complete FROM onboarding_progress WHERE user_id = $1';
    const result = await dbQuery(queryText, [userId]);
    return result.rows[0]?.complete || false;
  }
}

export default OnboardingProgress;
