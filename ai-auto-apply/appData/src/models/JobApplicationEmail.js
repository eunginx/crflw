// Email-based Job Applications Model
import { query as dbQuery } from '../db.js';

class JobApplicationEmail {
  // Get all applications for a user
  static async findByEmail(email) {
    const sql = `
      SELECT * FROM job_applications_email 
      WHERE email = $1 
      ORDER BY created_at DESC
    `;
    const result = await dbQuery(sql, [email]);
    return result.rows;
  }

  // Get applications by status for a user
  static async findByEmailAndStatus(email, status) {
    const sql = `
      SELECT * FROM job_applications_email 
      WHERE email = $1 AND status = $2 
      ORDER BY created_at DESC
    `;
    const result = await dbQuery(sql, [email, status]);
    return result.rows;
  }

  // Get application by ID for a user
  static async findByIdAndEmail(id, email) {
    const sql = `
      SELECT * FROM job_applications_email 
      WHERE id = $1 AND email = $2
    `;
    const result = await dbQuery(sql, [id, email]);
    return result.rows[0] || null;
  }

  // Create new application
  static async create(email, applicationData) {
    const {
      title,
      company,
      status = 'saved',
      applied_date,
      job_url,
      description,
      salary_min,
      salary_max,
      location,
      notes,
      source,
      priority = 'medium'
    } = applicationData;

    const sql = `
      INSERT INTO job_applications_email (
        email, title, company, status, applied_date, job_url,
        description, salary_min, salary_max, location, notes, source, priority
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const result = await dbQuery(sql, [
      email, title, company, status, applied_date, job_url,
      description, salary_min, salary_max, location, notes, source, priority
    ]);
    return result.rows[0];
  }

  // Update application
  static async update(id, email, updateData) {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = fields
      .map((field, index) => `${field} = $${index + 3}`)
      .join(', ');

    const sql = `
      UPDATE job_applications_email 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND email = $2
      RETURNING *
    `;
    
    const result = await dbQuery(sql, [id, email, ...values]);
    return result.rows[0] || null;
  }

  // Delete application
  static async delete(id, email) {
    const sql = 'DELETE FROM job_applications_email WHERE id = $1 AND email = $2';
    const result = await dbQuery(sql, [id, email]);
    return result.rowCount > 0;
  }

  // Get application statistics for a user
  static async getStatsByEmail(email) {
    const sql = `
      SELECT 
        COUNT(*) as total_applications,
        COUNT(CASE WHEN status = 'saved' THEN 1 END) as saved,
        COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied,
        COUNT(CASE WHEN status = 'interview' THEN 1 END) as interviews,
        COUNT(CASE WHEN status = 'offer' THEN 1 END) as offers,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN applied_date IS NOT NULL THEN 1 END) as with_applied_date
      FROM job_applications_email 
      WHERE email = $1
    `;
    const result = await dbQuery(sql, [email]);
    return result.rows[0];
  }

  // Get recent applications for a user
  static async getRecentByEmail(email, limit = 10) {
    const sql = `
      SELECT * FROM job_applications_email 
      WHERE email = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await dbQuery(sql, [email, limit]);
    return result.rows;
  }

  // Get applications by company for a user
  static async findByEmailAndCompany(email, company) {
    const sql = `
      SELECT * FROM job_applications_email 
      WHERE email = $1 AND company ILIKE $2 
      ORDER BY created_at DESC
    `;
    const result = await dbQuery(sql, [email, `%${company}%`]);
    return result.rows;
  }

  // Search applications for a user
  static async searchByEmail(email, searchTerm) {
    const sql = `
      SELECT * FROM job_applications_email 
      WHERE email = $1 
      AND (title ILIKE $2 OR company ILIKE $2 OR description ILIKE $2 OR notes ILIKE $2)
      ORDER BY created_at DESC
    `;
    const result = await dbQuery(sql, [email, `%${searchTerm}%`]);
    return result.rows;
  }

  // Get applications by date range for a user
  static async findByEmailAndDateRange(email, startDate, endDate) {
    const sql = `
      SELECT * FROM job_applications_email 
      WHERE email = $1 
      AND created_at >= $2 AND created_at <= $3
      ORDER BY created_at DESC
    `;
    const result = await dbQuery(sql, [email, startDate, endDate]);
    return result.rows;
  }

  // Get application trends (global analytics)
  static async getApplicationTrends(days = 30) {
    const sql = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as applications,
        COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied_today
      FROM job_applications_email 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    const result = await dbQuery(query);
    return result.rows;
  }

  // Get popular companies (global analytics)
  static async getPopularCompanies(limit = 20) {
    const sql = `
      SELECT 
        company,
        COUNT(*) as application_count,
        COUNT(CASE WHEN status = 'applied' THEN 1 END) as applied_count,
        COUNT(CASE WHEN status = 'interview' THEN 1 END) as interview_count
      FROM job_applications_email 
      GROUP BY company
      ORDER BY application_count DESC
      LIMIT $1
    `;
    const result = await dbQuery(sql, [limit]);
    return result.rows;
  }

  // Update application status
  static async updateStatus(id, email, newStatus) {
    const sql = `
      UPDATE job_applications_email 
      SET status = $1, 
          applied_date = CASE 
            WHEN $1 = 'applied' AND applied_date IS NULL THEN CURRENT_TIMESTAMP 
            ELSE applied_date 
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND email = $3
      RETURNING *
    `;
    
    const result = await dbQuery(sql, [newStatus, id, email]);
    return result.rows[0] || null;
  }

  // Get applications by priority for a user
  static async findByEmailAndPriority(email, priority) {
    const sql = `
      SELECT * FROM job_applications_email 
      WHERE email = $1 AND priority = $2 
      ORDER BY created_at DESC
    `;
    const result = await dbQuery(sql, [email, priority]);
    return result.rows;
  }
}

export default JobApplicationEmail;
