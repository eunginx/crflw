const db = require('../db');

class OnboardingProgressEmail {
  static async findByEmail(email) {
    const query = 'SELECT * FROM onboarding_progress_email WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }

  static async createOrUpdate(email, progressData = {}) {
    const {
      email_verified = false,
      resume_uploaded = false,
      profile_complete = false,
      settings_complete = false,
      onboarding_complete = false,
      current_step = 1,
      completed_at = null,
    } = progressData;

    const query = `
      INSERT INTO onboarding_progress_email (
        email, email_verified, resume_uploaded, profile_complete,
        settings_complete, onboarding_complete, current_step, completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE SET
        email_verified = EXCLUDED.email_verified,
        resume_uploaded = EXCLUDED.resume_uploaded,
        profile_complete = EXCLUDED.profile_complete,
        settings_complete = EXCLUDED.settings_complete,
        onboarding_complete = EXCLUDED.onboarding_complete,
        current_step = EXCLUDED.current_step,
        completed_at = EXCLUDED.completed_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      email,
      email_verified,
      resume_uploaded,
      profile_complete,
      settings_complete,
      onboarding_complete,
      current_step,
      completed_at,
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updateStep(email, step) {
    const query = `
      UPDATE onboarding_progress_email
      SET current_step = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING *
    `;
    const result = await db.query(query, [email, step]);
    return result.rows[0] || null;
  }

  static async markComplete(email) {
    const query = `
      UPDATE onboarding_progress_email
      SET settings_complete = TRUE,
          profile_complete = TRUE,
          email_verified = TRUE,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING *
    `;
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  }
}

module.exports = OnboardingProgressEmail;
