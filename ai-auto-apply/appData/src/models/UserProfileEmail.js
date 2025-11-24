import { query as dbQuery } from '../db.js';

class UserProfileEmail {
  static async findByEmail(email) {
    const sql = 'SELECT * FROM user_profiles_email WHERE email = $1';
    const result = await dbQuery(sql, [email]);
    return result.rows[0] || null;
  }

  static async createOrUpdate(email, profileData = {}) {
    const {
      headline,
      summary,
      location,
      resume_uploaded = false,
      resume_filename = null,
      resume_path = null,
      linkedin_url = null,
      github_url = null,
      portfolio_url = null,
      skills = [],
      experience_years = 0,
      first_name = null,
      last_name = null,
      phone = null,
    } = profileData;

    const sql = `
      INSERT INTO user_profiles_email (
        email, headline, summary, location, resume_uploaded,
        resume_filename, resume_path, linkedin_url, github_url,
        portfolio_url, skills, experience_years, first_name, last_name, phone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (email) DO UPDATE SET
        headline = EXCLUDED.headline,
        summary = EXCLUDED.summary,
        location = EXCLUDED.location,
        resume_uploaded = EXCLUDED.resume_uploaded,
        resume_filename = EXCLUDED.resume_filename,
        resume_path = EXCLUDED.resume_path,
        linkedin_url = EXCLUDED.linkedin_url,
        github_url = EXCLUDED.github_url,
        portfolio_url = EXCLUDED.portfolio_url,
        skills = EXCLUDED.skills,
        experience_years = EXCLUDED.experience_years,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      email,
      headline,
      summary,
      location,
      resume_uploaded,
      resume_filename,
      resume_path,
      linkedin_url,
      github_url,
      portfolio_url,
      JSON.stringify(skills),
      experience_years,
      first_name,
      last_name,
      phone
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async updateResumeStatus(email, uploaded, filename = null, path = null) {
    const sql = `
      UPDATE user_profiles_email
      SET resume_uploaded = $2,
          resume_filename = $3,
          resume_path = $4,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING *
    `;
    const result = await dbQuery(sql, [email, uploaded, filename, path]);
    return result.rows[0] || null;
  }
}

export default UserProfileEmail;
