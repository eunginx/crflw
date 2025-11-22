const db = require('../db');

class User {
  static async create(firebaseUid, email) {
    const query = `
      INSERT INTO users (firebase_uid, email)
      VALUES ($1, $2)
      ON CONFLICT (firebase_uid) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await db.query(query, [firebaseUid, email]);
    return result.rows[0];
  }

  static async findByFirebaseUid(firebaseUid) {
    const query = 'SELECT * FROM users WHERE firebase_uid = $1';
    const result = await db.query(query, [firebaseUid]);
    return result.rows[0];
  }

  static async updateEmailVerified(firebaseUid, verified) {
    const query = `
      UPDATE users 
      SET email_verified = $2, updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = $1
      RETURNING *
    `;
    const result = await db.query(query, [firebaseUid, verified]);
    return result.rows[0];
  }
}

module.exports = User;
