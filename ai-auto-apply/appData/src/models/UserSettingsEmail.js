// Email-based User Settings Model
import { query as dbQuery } from '../db.js';

class UserSettingsEmail {
  // Find settings by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM user_settings_email WHERE email = $1';
    const result = await dbQuery(sql, [email]);
    return result.rows[0] || null;
  }

  // Create or update settings by email
  static async createOrUpdate(email, settingsData) {
    const {
      keywords,
      locations,
      salary_min,
      salary_max,
      enable_auto_apply,
      generate_cover_letters,
      apply_remote_only,
      max_applications_per_day = 50,
      job_types = ['full-time', 'contract'],
      industries = [],
      company_sizes = []
    } = settingsData;

    // Check if settings exist
    const existingSettings = await this.findByEmail(email);
    
    if (existingSettings) {
      // Update existing settings
      const updateQuery = `
        UPDATE user_settings_email 
        SET keywords = $1,
            locations = $2,
            salary_min = $3,
            salary_max = $4,
            enable_auto_apply = $5,
            generate_cover_letters = $6,
            apply_remote_only = $7,
            max_applications_per_day = $8,
            job_types = $9,
            industries = $10,
            company_sizes = $11,
            updated_at = CURRENT_TIMESTAMP
        WHERE email = $12
        RETURNING *
      `;
      const result = await dbQuery(updateQuery, [
        keywords, locations, salary_min, salary_max,
        enable_auto_apply, generate_cover_letters, apply_remote_only,
        max_applications_per_day, JSON.stringify(job_types),
        JSON.stringify(industries), JSON.stringify(company_sizes), email
      ]);
      return result.rows[0];
    } else {
      // Create new settings
      const insertQuery = `
        INSERT INTO user_settings_email (
          email, keywords, locations, salary_min, salary_max,
          enable_auto_apply, generate_cover_letters, apply_remote_only,
          max_applications_per_day, job_types, industries, company_sizes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const result = await dbQuery(insertQuery, [
        email, keywords, locations, salary_min, salary_max,
        enable_auto_apply, generate_cover_letters, apply_remote_only,
        max_applications_per_day, JSON.stringify(job_types),
        JSON.stringify(industries), JSON.stringify(company_sizes)
      ]);
      return result.rows[0];
    }
  }

  // Update specific fields
  static async updateFields(email, fields) {
    const setClause = Object.keys(fields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = Object.values(fields);
    const sql = `
      UPDATE user_settings_email 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
      RETURNING *
    `;
    
    const result = await dbQuery(sql, [email, ...values]);
    return result.rows[0] || null;
  }

  // Delete settings by email
  static async deleteByEmail(email) {
    const sql = 'DELETE FROM user_settings_email WHERE email = $1';
    const result = await dbQuery(sql, [email]);
    return result.rowCount > 0;
  }

  // Get users with specific settings (for analytics)
  static async getUsersBySetting(settingName, settingValue) {
    const sql = `
      SELECT u.email, u.first_name, u.last_name, s.${settingName}
      FROM users_email u
      JOIN user_settings_email s ON u.email = s.email
      WHERE s.${settingName} = $1
      ORDER BY u.email
    `;
    const result = await dbQuery(sql, [settingValue]);
    return result.rows;
  }

  // Get salary statistics
  static async getSalaryStats() {
    const sql = `
      SELECT 
        COUNT(*) as total_users,
        AVG(salary_min) as avg_min_salary,
        AVG(salary_max) as avg_max_salary,
        MIN(salary_min) as min_salary,
        MAX(salary_max) as max_salary
      FROM user_settings_email 
      WHERE salary_min IS NOT NULL AND salary_max IS NOT NULL
    `;
    const result = await dbQuery(query);
    return result.rows[0];
  }

  // Get popular locations
  static async getPopularLocations(limit = 10) {
    const sql = `
      SELECT 
        TRIM(UNNEST(STRING_TO_ARRAY(locations, ','))) as location,
        COUNT(*) as count
      FROM user_settings_email 
      WHERE locations IS NOT NULL AND locations != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT $1
    `;
    const result = await dbQuery(sql, [limit]);
    return result.rows;
  }

  // Get popular keywords
  static async getPopularKeywords(limit = 20) {
    const sql = `
      SELECT 
        TRIM(UNNEST(STRING_TO_ARRAY(keywords, ','))) as keyword,
        COUNT(*) as count
      FROM user_settings_email 
      WHERE keywords IS NOT NULL AND keywords != ''
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT $1
    `;
    const result = await dbQuery(sql, [limit]);
    return result.rows;
  }
}

export default UserSettingsEmail;
