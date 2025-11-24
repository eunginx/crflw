// Email-based User Model
import { query as dbQuery } from '../db.js';

class UserEmail {
  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users_email WHERE email = $1';
    const result = await dbQuery(sql, [email]);
    return result.rows[0] || null;
  }

  // Find user by Firebase UID (for compatibility)
  static async findByFirebaseUid(firebaseUid) {
    const sql = 'SELECT * FROM users_email WHERE firebase_uid = $1';
    const result = await dbQuery(sql, [firebaseUid]);
    return result.rows[0] || null;
  }

  // Create or update user by email
  static async createOrUpdate(email, userData = {}) {
    const {
      firebase_uid,
      password_hash,
      email_verified = false,
      first_name,
      last_name,
      phone
    } = userData;

    // Check if user exists
    const existingUser = await this.findByEmail(email);
    
    if (existingUser) {
      // Update existing user
      const updateSql = `
        UPDATE users_email 
        SET firebase_uid = COALESCE($1, firebase_uid),
            password_hash = COALESCE($2, password_hash),
            email_verified = COALESCE($3, email_verified),
            first_name = COALESCE($4, first_name),
            last_name = COALESCE($5, last_name),
            phone = COALESCE($6, phone),
            updated_at = CURRENT_TIMESTAMP
        WHERE email = $7
        RETURNING *
      `;
      const result = await dbQuery(updateSql, [
        firebase_uid, password_hash, email_verified, 
        first_name, last_name, phone, email
      ]);
      return result.rows[0];
    } else {
      // Create new user
      const insertSql = `
        INSERT INTO users_email (email, firebase_uid, password_hash, email_verified, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const result = await dbQuery(insertSql, [
        email, firebase_uid, password_hash, email_verified, 
        first_name, last_name, phone
      ]);
      return result.rows[0];
    }
  }

  // Update email verification status
  static async updateEmailVerified(email, verified) {
    const sql = `
      UPDATE users_email 
      SET email_verified = $1, updated_at = CURRENT_TIMESTAMP
      WHERE email = $2
      RETURNING *
    `;
    const result = await dbQuery(sql, [verified, email]);
    return result.rows[0] || null;
  }

  // Delete user by email
  static async deleteByEmail(email) {
    const sql = 'DELETE FROM users_email WHERE email = $1';
    const result = await dbQuery(sql, [email]);
    return result.rowCount > 0;
  }

  // Get user summary
  static async getUserSummary(email) {
    const sql = 'SELECT * FROM user_summary_email WHERE email = $1';
    const result = await dbQuery(sql, [email]);
    return result.rows[0] || null;
  }

  // Search users by email or name
  static async search(searchTerm) {
    const sql = `
      SELECT email, first_name, last_name, email_verified, created_at
      FROM users_email 
      WHERE email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1
      ORDER BY email
      LIMIT 20
    `;
    const result = await dbQuery(sql, [`%${searchTerm}%`]);
    return result.rows;
  }

  // Get all users with pagination
  static async getAll(limit = 50, offset = 0) {
    const sql = `
      SELECT email, first_name, last_name, email_verified, created_at
      FROM users_email 
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await dbQuery(sql, [limit, offset]);
    return result.rows;
  }

  // Count total users
  static async count() {
    const sql = 'SELECT COUNT(*) as count FROM users_email';
    const result = await dbQuery(sql);
    return parseInt(result.rows[0].count);
  }
}

export default UserEmail;
