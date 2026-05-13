import { db } from '../../database/client';
import type { 
  CreateScheduleSlotInput, 
  UpdateScheduleSlotInput,
  SlotType,
  SlotStatus
} from './schedules.dto';

export interface ScheduleSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_type: SlotType;
  max_capacity: number;
  current_bookings: number;
  status: SlotStatus;
  created_at: Date;
}

export interface ScheduleFilterParams {
  date_from?: string;
  date_to?: string;
  status?: string;
  slot_type?: string;
  limit: number;
  offset: number;
}

export const schedulesRepository = {
  async findAll(params: ScheduleFilterParams): Promise<ScheduleSlot[]> {
    const rows = await db`
      SELECT id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
      FROM schedule_slots
      WHERE 1=1
        ${params.date_from ? db`AND date >= ${params.date_from}` : db``}
        ${params.date_to ? db`AND date <= ${params.date_to}` : db``}
        ${params.status ? db`AND status = ${params.status}::slot_status` : db``}
        ${params.slot_type ? db`AND slot_type = ${params.slot_type}::slot_type` : db``}
      ORDER BY date ASC, start_time ASC
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    `;

    return rows as unknown as ScheduleSlot[];
  },

  async count(params: Omit<ScheduleFilterParams, 'limit' | 'offset'>): Promise<number> {
    const rows = await db`
      SELECT COUNT(*)::int AS total 
      FROM schedule_slots 
      WHERE 1=1
        ${params.date_from ? db`AND date >= ${params.date_from}` : db``}
        ${params.date_to ? db`AND date <= ${params.date_to}` : db``}
        ${params.status ? db`AND status = ${params.status}::slot_status` : db``}
        ${params.slot_type ? db`AND slot_type = ${params.slot_type}::slot_type` : db``}
    `;

    return rows[0].total;
  },

  async findById(id: string): Promise<ScheduleSlot | null> {
    const rows = await db`
      SELECT id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
      FROM schedule_slots
      WHERE id = ${id}
    `;
    return (rows[0] as unknown as ScheduleSlot) || null;
  },

  async findByDateAndTime(date: string, startTime: string, endTime: string): Promise<ScheduleSlot | null> {
    const rows = await db`
      SELECT id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
      FROM schedule_slots
      WHERE date = ${date} AND start_time = ${startTime} AND end_time = ${endTime}
    `;
    return (rows[0] as unknown as ScheduleSlot) || null;
  },

  async findOverlapping(date: string, startTime: string, endTime: string, excludeId?: string): Promise<ScheduleSlot[]> {
    if (excludeId) {
      const rows = await db`
        SELECT id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
        FROM schedule_slots
        WHERE date = ${date}
          AND id != ${excludeId}
          AND start_time < ${endTime}
          AND end_time > ${startTime}
      `;
      return rows as unknown as ScheduleSlot[];
    }

    const rows = await db`
      SELECT id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
      FROM schedule_slots
      WHERE date = ${date}
        AND start_time < ${endTime}
        AND end_time > ${startTime}
    `;
    return rows as unknown as ScheduleSlot[];
  },

  async create(data: CreateScheduleSlotInput): Promise<ScheduleSlot> {
    const rows = await db`
      INSERT INTO schedule_slots (date, start_time, end_time, slot_type, max_capacity)
      VALUES (
        ${data.date},
        ${data.start_time},
        ${data.end_time},
        ${data.slot_type || 'open'},
        ${data.max_capacity || 6}
      )
      RETURNING id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
    `;
    return rows[0] as unknown as ScheduleSlot;
  },

  async createMany(slots: CreateScheduleSlotInput[]): Promise<number> {
    if (slots.length === 0) return 0;

    const valuePlaceholders: string[] = [];
    const values: any[] = [];
    let paramIndex = 0;

    for (const slot of slots) {
      paramIndex++;
      const dateIdx = paramIndex;
      values.push(slot.date);

      paramIndex++;
      const startIdx = paramIndex;
      values.push(slot.start_time);

      paramIndex++;
      const endIdx = paramIndex;
      values.push(slot.end_time);

      paramIndex++;
      const typeIdx = paramIndex;
      values.push(slot.slot_type || 'open');

      paramIndex++;
      const capIdx = paramIndex;
      values.push(slot.max_capacity || 6);

      valuePlaceholders.push(
        `($${dateIdx}, $${startIdx}, $${endIdx}, $${typeIdx}::slot_type, $${capIdx})`
      );
    }

    const result = await db.unsafe(
      `INSERT INTO schedule_slots (date, start_time, end_time, slot_type, max_capacity)
       VALUES ${valuePlaceholders.join(', ')}
       ON CONFLICT (date, start_time, end_time) DO NOTHING`,
      values
    );

    return result.count;
  },

  async update(id: string, data: UpdateScheduleSlotInput): Promise<ScheduleSlot | null> {
    const rows = await db`
      UPDATE schedule_slots 
      SET 
        date = COALESCE(${data.date ?? null}, date),
        start_time = COALESCE(${data.start_time ?? null}, start_time),
        end_time = COALESCE(${data.end_time ?? null}, end_time),
        slot_type = COALESCE(${data.slot_type ?? null}::slot_type, slot_type),
        max_capacity = COALESCE(${data.max_capacity ?? null}, max_capacity),
        status = COALESCE(${data.status ?? null}::slot_status, status)
      WHERE id = ${id}
      RETURNING id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
    `;

    return (rows[0] as unknown as ScheduleSlot) || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db`
      DELETE FROM schedule_slots WHERE id = ${id} AND current_bookings = 0
    `;
    return result.count > 0;
  },

  async blockSlot(id: string): Promise<ScheduleSlot | null> {
    const rows = await db`
      UPDATE schedule_slots
      SET status = 'blocked', slot_type = 'maintenance'
      WHERE id = ${id}
      RETURNING id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
    `;
    return (rows[0] as unknown as ScheduleSlot) || null;
  },

  async incrementBookings(id: string, amount: number = 1): Promise<ScheduleSlot | null> {
    const rows = await db`
      UPDATE schedule_slots
      SET current_bookings = current_bookings + ${amount},
          status = CASE
            WHEN current_bookings + ${amount} >= max_capacity THEN 'full'::slot_status
            ELSE status
          END
      WHERE id = ${id} AND current_bookings + ${amount} <= max_capacity
      RETURNING id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
    `;
    return (rows[0] as unknown as ScheduleSlot) || null;
  },

  async decrementBookings(id: string, amount: number = 1): Promise<ScheduleSlot | null> {
    const rows = await db`
      UPDATE schedule_slots
      SET current_bookings = GREATEST(0, current_bookings - ${amount}),
          status = CASE
            WHEN current_bookings - ${amount} < max_capacity THEN 'available'::slot_status
            ELSE status
          END
      WHERE id = ${id}
      RETURNING id, date, start_time, end_time, slot_type, max_capacity, current_bookings, status, created_at
    `;
    return (rows[0] as unknown as ScheduleSlot) || null;
  },
};
