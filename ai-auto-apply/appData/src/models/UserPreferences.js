const db = require('../db');

class UserPreferences {
  static async createOrUpdate(userId, preferencesData) {
    const query = `
      INSERT INTO user_preferences (user_id, theme, language, timezone, email_notifications, push_notifications, ui_preferences)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id) DO UPDATE SET
        theme = EXCLUDED.theme,
        language = EXCLUDED.language,
        timezone = EXCLUDED.timezone,
        email_notifications = EXCLUDED.email_notifications,
        push_notifications = EXCLUDED.push_notifications,
        ui_preferences = EXCLUDED.ui_preferences,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const values = [
      userId,
      preferencesData.theme || 'light',
      preferencesData.language || 'en',
      preferencesData.timezone || 'UTC',
      preferencesData.emailNotifications ?? true,
      preferencesData.pushNotifications ?? true,
      JSON.stringify(preferencesData.uiPreferences || {})
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rows[0];
  }
}

module.exports = UserPreferences;
