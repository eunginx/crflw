import { query as dbQuery } from '../db.js';

class User {
  static async create(firebaseUid, email) {
    const queryText = `
      INSERT INTO users (firebase_uid, email)
      VALUES ($1, $2)
      ON CONFLICT (firebase_uid) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const result = await dbQuery(queryText, [firebaseUid, email]);
    return result.rows[0];
  }

  static async findByFirebaseUid(firebaseUid) {
    const queryText = 'SELECT * FROM users WHERE firebase_uid = $1';
    const result = await dbQuery(queryText, [firebaseUid]);
    return result.rows[0];
  }

  static async updateEmailVerified(firebaseUid, verified) {
    const queryText = `
      UPDATE users 
      SET email_verified = $2, updated_at = CURRENT_TIMESTAMP
      WHERE firebase_uid = $1
      RETURNING *
    `;
    const result = await dbQuery(queryText, [firebaseUid, verified]);
    return result.rows[0];
  }
}

export default User;
