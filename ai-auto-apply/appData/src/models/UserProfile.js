const db = require('../db');

class UserProfile {
  static async createOrUpdate(userId, profileData) {
    const query = `
      INSERT INTO user_profiles (user_id, first_name, last_name, phone, location, headline, summary, resume_uploaded, resume_filename, resume_path)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (user_id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        location = EXCLUDED.location,
        headline = EXCLUDED.headline,
        summary = EXCLUDED.summary,
        resume_uploaded = EXCLUDED.resume_uploaded,
        resume_filename = EXCLUDED.resume_filename,
        resume_path = EXCLUDED.resume_path,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      userId,
      profileData.firstName,
      profileData.lastName,
      profileData.phone,
      profileData.location,
      profileData.headline,
      profileData.summary,
      profileData.resumeUploaded || false,
      profileData.resumeFilename,
      profileData.resumePath
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM user_profiles WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }

  static async updateResumeStatus(userId, uploaded, filename = null, path = null) {
    const query = `
      UPDATE user_profiles 
      SET resume_uploaded = $2, resume_filename = $3, resume_path = $4, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await db.query(query, [userId, uploaded, filename, path]);
    return result.rows[0];
  }
}

module.exports = UserProfile;
