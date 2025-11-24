import { query as dbQuery } from '../db.js';

class UserProfile {
  static async createOrUpdate(userId, profileData) {
    const queryText = `
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
      profileData.first_name,
      profileData.last_name,
      profileData.phone,
      profileData.location,
      profileData.headline,
      profileData.summary,
      profileData.resume_uploaded,
      profileData.resume_filename,
      profileData.resume_path
    ];
    const result = await dbQuery(queryText, values);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const queryText = 'SELECT * FROM user_profiles WHERE user_id = $1';
    const result = await dbQuery(queryText, [userId]);
    return result.rows[0];
  }

  static async updateResumeStatus(userId, uploaded, filename = null, path = null) {
    const queryText = `
      UPDATE user_profiles 
      SET resume_uploaded = $2, resume_filename = $3, resume_path = $4, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING *
    `;
    const result = await dbQuery(queryText, [userId, uploaded, filename, path]);
    return result.rows[0];
  }
}

export default UserProfile;
