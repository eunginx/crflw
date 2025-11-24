import { query as dbQuery } from '../db.js';

export default class ResumeFile {
  static async create(userId, fileData) {
    const queryText = `
      INSERT INTO resume_files (user_id, filename, original_filename, file_path, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      userId,
      fileData.filename,
      fileData.originalFilename,
      fileData.filePath,
      fileData.fileSize || null,
      fileData.mimeType || null
    ];
    const result = await dbQuery(queryText, values);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const queryText = 'SELECT * FROM resume_files WHERE user_id = $1 AND is_active = true ORDER BY upload_date DESC';
    const result = await dbQuery(queryText, [userId]);
    return result.rows;
  }

  static async findById(id) {
    const queryText = 'SELECT * FROM resume_files WHERE id = $1';
    const result = await dbQuery(queryText, [id]);
    return result.rows[0];
  }

  static async deactivate(id) {
    const queryText = 'UPDATE resume_files SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *';
    const result = await dbQuery(queryText, [id]);
    return result.rows[0];
  }

  static async getActiveResume(userId) {
    const queryText = 'SELECT * FROM resume_files WHERE user_id = $1 AND is_active = true ORDER BY upload_date DESC LIMIT 1';
    const result = await dbQuery(queryText, [userId]);
    return result.rows[0];
  }
}

