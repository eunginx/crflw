const db = require('../db');

class JobApplication {
  static async create(userId, applicationData) {
    const query = `
      INSERT INTO job_applications (user_id, title, company, status, applied_date, job_url, description, salary_min, salary_max, location, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      userId,
      applicationData.title,
      applicationData.company,
      applicationData.status || 'saved',
      applicationData.appliedDate || null,
      applicationData.jobUrl || null,
      applicationData.description || null,
      applicationData.salaryMin || null,
      applicationData.salaryMax || null,
      applicationData.location || null,
      applicationData.notes || null
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM job_applications WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    const query = `
      UPDATE job_applications 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id, ...values]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM job_applications WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByStatus(userId, status) {
    const query = 'SELECT * FROM job_applications WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC';
    const result = await db.query(query, [userId, status]);
    return result.rows;
  }
}

module.exports = JobApplication;
