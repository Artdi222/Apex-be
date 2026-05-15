import { db } from '../../database/client';
import type {
  CreateIncidentInput,
  UpdateIncidentInput,
  AddUserStatementInput,
  AddWitnessInput,
  ListIncidentsQuery,
} from './incidents.dto';

export const incidentsRepository = {
  async create(data: CreateIncidentInput, createdBy: string) {
    const rows = await db`
      INSERT INTO incident_reports (
        booking_id, created_by, type, severity, description,
        official_photos, medical_response_required, medical_notes,
        user_unable_to_respond, estimated_cost
      ) VALUES (
        ${data.booking_id}, ${createdBy}, ${data.type}, ${data.severity},
        ${data.description}, ${JSON.stringify(data.official_photos || [])}::jsonb,
        ${data.medical_response_required || false}, ${data.medical_notes || null},
        ${data.user_unable_to_respond || false}, ${data.estimated_cost ?? null}
      )
      RETURNING *
    `;
    return rows[0];
  },

  async findById(id: string) {
    const rows = await db`
      SELECT 
        ir.*,
        json_build_object('id', creator.id, 'username', creator.username, 'email', creator.email, 'role', creator.role, 'avatar_url', creator.avatar_url) as created_by_user,
        json_build_object('id', b.id, 'status', b.status, 'user_id', b.user_id, 'schedule_slot_id', b.schedule_slot_id, 'total_price', b.total_price, 'created_at', b.created_at) as booking,
        json_build_object('id', u.id, 'username', u.username, 'email', u.email, 'avatar_url', u.avatar_url) as booking_user
      FROM incident_reports ir
      LEFT JOIN users creator ON ir.created_by = creator.id
      LEFT JOIN bookings b ON ir.booking_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      WHERE ir.id = ${id}
    `;
    return rows[0] || null;
  },

  async list(filters: ListIncidentsQuery, userId?: string, isAdmin?: boolean) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (!isAdmin && userId) {
      conditions.push(`b.user_id = $${params.length + 1}`);
      params.push(userId);
    }
    if (filters.status) {
      conditions.push(`ir.status = $${params.length + 1}`);
      params.push(filters.status);
    }
    if (filters.severity) {
      conditions.push(`ir.severity = $${params.length + 1}`);
      params.push(filters.severity);
    }
    if (filters.booking_id) {
      conditions.push(`ir.booking_id = $${params.length + 1}`);
      params.push(filters.booking_id);
    }
    if (filters.medical_response) {
      conditions.push(`ir.medical_response_required = $${params.length + 1}`);
      params.push(filters.medical_response);
    }
    if (filters.awaiting_user_response) {
      conditions.push(`ir.user_statement IS NULL AND ir.user_unable_to_respond = false AND ir.status != 'resolved'`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const offset = (page - 1) * limit;

    params.push(limit, offset);

    const query = `
      SELECT 
        ir.*,
        json_build_object('username', creator.username, 'role', creator.role, 'avatar_url', creator.avatar_url) as created_by_user,
        json_build_object('id', b.id, 'status', b.status, 'user_id', b.user_id) as booking,
        json_build_object('username', u.username, 'email', u.email, 'avatar_url', u.avatar_url) as booking_user
      FROM incident_reports ir
      LEFT JOIN users creator ON ir.created_by = creator.id
      LEFT JOIN bookings b ON ir.booking_id = b.id
      LEFT JOIN users u ON b.user_id = u.id
      ${where}
      ORDER BY ir.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    return await db.unsafe(query, params) as any[];
  },

  async update(id: string, data: UpdateIncidentInput) {
    const sets: string[] = [];
    const params: any[] = [];

    const fields = [
      'status', 'estimated_cost', 'resolution_notes', 'medical_notes',
      'insurance_notified', 'insurance_claim_number', 'police_report_filed',
      'police_report_number', 'user_unable_to_respond',
    ] as const;

    for (const field of fields) {
      if ((data as any)[field] !== undefined) {
        sets.push(`${field} = $${params.length + 1}`);
        params.push((data as any)[field]);
      }
    }

    sets.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE incident_reports SET ${sets.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `;

    const rows = await db.unsafe(query, params) as any[];
    return rows[0];
  },

  async addUserStatement(id: string, data: AddUserStatementInput) {
    const rows = await db`
      UPDATE incident_reports
      SET user_statement = ${data.statement},
          user_photos = ${JSON.stringify(data.photos || [])}::jsonb,
          user_responded_at = NOW(),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  },

  async addUserPhotos(id: string, photos: string[]) {
    const rows = await db`
      UPDATE incident_reports
      SET user_photos = user_photos || ${JSON.stringify(photos)}::jsonb,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  },

  async addWitness(id: string, data: AddWitnessInput) {
    const witness = JSON.stringify([{
      name: data.witness_name,
      contact: data.witness_contact || null,
      statement: data.statement,
      added_at: new Date().toISOString(),
    }]);

    const rows = await db`
      UPDATE incident_reports
      SET witnesses = witnesses || ${witness}::jsonb,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0];
  },

  async getByBookingId(bookingId: string) {
    return await db`
      SELECT ir.*,
        json_build_object('username', creator.username, 'role', creator.role) as created_by_user
      FROM incident_reports ir
      LEFT JOIN users creator ON ir.created_by = creator.id
      WHERE ir.booking_id = ${bookingId}
      ORDER BY ir.created_at DESC
    ` as any[];
  },
};
