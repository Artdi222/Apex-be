import { db } from '../../database/client';

export const settingsRepository = {
  /**
   * Get a single setting by key.
   */
  async getByKey(key: string) {
    const rows = await db`
      SELECT key, value, updated_at
      FROM system_settings
      WHERE key = ${key}
    `;
    return rows[0] || null;
  },

  /**
   * Get all settings.
   */
  async getAll() {
    return await db`
      SELECT key, value, updated_at
      FROM system_settings
      ORDER BY key ASC
    ` as any[];
  },

  /**
   * Upsert a setting (insert or update).
   */
  async upsert(key: string, value: any) {
    const rows = await db`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = ${value}, updated_at = NOW()
      RETURNING *
    `;
    return rows[0];
  },

  /**
   * Delete a setting by key.
   */
  async deleteByKey(key: string) {
    const rows = await db`
      DELETE FROM system_settings
      WHERE key = ${key}
      RETURNING *
    `;
    return rows[0] || null;
  },

  /**
   * Bulk upsert multiple settings at once.
   */
  async bulkUpsert(settings: { key: string; value: any }[]) {
    const results = [];
    for (const setting of settings) {
      const row = await this.upsert(setting.key, setting.value);
      results.push(row);
    }
    return results;
  },

  /**
   * Get audit logs with pagination.
   */
  async getAuditLogs(filters: { page?: number; limit?: number; user_id?: string; action?: string; entity?: string }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.user_id) {
      conditions.push(`al.user_id = $${params.length + 1}`);
      params.push(filters.user_id);
    }
    if (filters.action) {
      conditions.push(`al.action = $${params.length + 1}`);
      params.push(filters.action);
    }
    if (filters.entity) {
      conditions.push(`al.entity = $${params.length + 1}`);
      params.push(filters.entity);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const query = `
      SELECT
        al.*,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email, 'role', u.role) AS user_info
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${where}
      ORDER BY al.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const logs = await db.unsafe(query, params) as any[];

    const countQuery = `SELECT COUNT(*)::int AS total FROM audit_logs al ${where}`;
    const countParams = params.slice(0, -2);
    const countRows = await db.unsafe(countQuery, countParams) as any[];
    const total = countRows[0]?.total || 0;

    return { logs, total, page, limit };
  },

  /**
   * Create an audit log entry.
   */
  async createAuditLog(data: { user_id: string; action: string; entity: string; entity_id?: string }) {
    const rows = await db`
      INSERT INTO audit_logs (user_id, action, entity, entity_id)
      VALUES (${data.user_id}, ${data.action}, ${data.entity}, ${data.entity_id || null})
      RETURNING *
    `;
    return rows[0];
  },
};
