const db = require('../db');

class JobStatusType {
  static async findAll(options = {}) {
    const { includeHidden = false, category = null, groupLabel = null } = options;
    
    let query = `
      SELECT * FROM job_status_types 
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;
    
    if (!includeHidden) {
      query += ` AND hidden = FALSE`;
    }
    
    if (category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(category);
    }
    
    if (groupLabel) {
      query += ` AND group_label = $${paramIndex++}`;
      params.push(groupLabel);
    }
    
    query += ` ORDER BY sort_order ASC`;
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  static async findByKey(key) {
    const query = 'SELECT * FROM job_status_types WHERE key = $1';
    const result = await db.query(query, [key]);
    return result.rows[0];
  }
  
  static async findById(id) {
    const query = 'SELECT * FROM job_status_types WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
  
  static async create(statusData) {
    const query = `
      INSERT INTO job_status_types (key, label, icon, color, description, sort_order, ui_classes, category, counts_towards, ai_advice, ai_next_step_action, timeline_icon, animation, hidden, experimental, group_label)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;
    
    const values = [
      statusData.key,
      statusData.label,
      statusData.icon,
      statusData.color,
      statusData.description || null,
      statusData.sort_order || 0,
      JSON.stringify(statusData.ui_classes || {}),
      statusData.category || null,
      statusData.counts_towards || [],
      statusData.ai_advice || null,
      statusData.ai_next_step_action || null,
      statusData.timeline_icon || null,
      statusData.animation || 'none',
      statusData.hidden || false,
      statusData.experimental || false,
      statusData.group_label || null
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 2;
    
    // Dynamic field building
    Object.keys(updates).forEach(key => {
      if (key === 'ui_classes') {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(JSON.stringify(updates[key]));
      } else if (key === 'counts_towards') {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(updates[key]);
      } else {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(updates[key]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    const query = `
      UPDATE job_status_types 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    
    values.unshift(id);
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  static async delete(id) {
    const query = 'DELETE FROM job_status_types WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
  
  static async getEnhancedStatuses(options = {}) {
    const { includeHidden = false } = options;
    
    let query = 'SELECT * FROM job_statuses_enhanced';
    const values = [];
    
    if (!includeHidden) {
      query += ' WHERE hidden = false';
    }
    
    query += ' ORDER BY sort_order ASC';
    
    const result = await db.query(query, values);
    return result.rows;
  }
  
  static async getStatusesByGroup() {
    const query = `
      SELECT 
        group_label,
        json_agg(
          json_build_object(
            'key', key,
            'label', label,
            'icon', icon,
            'color', color,
            'sort_order', sort_order
          ) ORDER BY sort_order
        ) as statuses
      FROM job_status_types 
      WHERE hidden = FALSE AND group_label IS NOT NULL
      GROUP BY group_label
      ORDER BY group_label
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
  
  static async getAnalyticsData() {
    const query = `
      SELECT 
        category,
        json_agg(
          json_build_object(
            'key', key,
            'label', label,
            'icon', icon,
            'counts_towards', counts_towards
          ) ORDER BY sort_order
        ) as statuses
      FROM job_status_types 
      WHERE hidden = FALSE
      GROUP BY category
      ORDER BY category
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = JobStatusType;
