import { db } from '../../database/client';
import type { BookingEquipmentItem, BookingStatus } from './bookings.dto';

export interface Booking {
  id: string;
  user_id: string;
  schedule_slot_id: string;
  participants_count: number;
  status: BookingStatus;
  total_price: number;
  notes: string | null;
  checked_in_at: Date | null;
  qr_code_token: string;
  agreement_accepted: boolean;
  agreement_accepted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface BookingWithDetails extends Booking {
  user?: {
    username: string;
    email: string;
  };
  schedule_slot?: {
    date: Date | string;
    start_time: string;
    end_time: string;
  };
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    year: number;
  };
  vehicles?: any[];
  equipment?: any[];
  user_username?: string;
  user_email?: string;
  slot_date?: Date | string;
  slot_start_time?: string;
  slot_end_time?: string;
  vehicle_name?: string;
}

export interface BookingFilterParams {
  user_id?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  limit: number;
  offset: number;
}

export const bookingsRepository = {
  async findAll(params: BookingFilterParams): Promise<BookingWithDetails[]> {
    const rows = await db`
      SELECT b.*,
             u.username as user_username,
             u.email as user_email,
             s.date as slot_date,
             s.start_time as slot_start_time,
             s.end_time as slot_end_time,
             (
               SELECT json_build_object(
                 'id', v.id,
                 'brand', vm.brand,
                 'model', vm.name,
                 'year', vm.year
               )
               FROM booking_vehicles bv
               JOIN vehicles v ON bv.vehicle_id = v.id
               JOIN vehicle_models vm ON v.model_id = vm.id
               WHERE bv.booking_id = b.id
               LIMIT 1
             ) as vehicle
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN schedule_slots s ON b.schedule_slot_id = s.id
      WHERE 1=1
        ${params.user_id ? db`AND b.user_id = ${params.user_id}` : db``}
        ${params.status ? db`AND b.status = ${params.status}::booking_status` : db``}
        ${params.date_from ? db`AND s.date >= ${params.date_from}` : db``}
        ${params.date_to ? db`AND s.date <= ${params.date_to}` : db``}
      ORDER BY b.created_at DESC
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    `;

    return rows.map(row => ({
      ...row,
      user: {
        username: row.user_username,
        email: row.user_email
      },
      schedule_slot: {
        date: row.slot_date,
        start_time: row.slot_start_time,
        end_time: row.slot_end_time
      }
    })) as unknown as BookingWithDetails[];
  },

  async count(params: Omit<BookingFilterParams, 'limit' | 'offset'>): Promise<number> {
    const rows = await db`
      SELECT COUNT(*)::int AS total
      FROM bookings b
      LEFT JOIN schedule_slots s ON b.schedule_slot_id = s.id
      WHERE 1=1
        ${params.user_id ? db`AND b.user_id = ${params.user_id}` : db``}
        ${params.status ? db`AND b.status = ${params.status}::booking_status` : db``}
        ${params.date_from ? db`AND s.date >= ${params.date_from}` : db``}
        ${params.date_to ? db`AND s.date <= ${params.date_to}` : db``}
    `;

    return rows[0].total;
  },

  async findById(id: string): Promise<BookingWithDetails | null> {
    const rows = await db`
      SELECT b.*,
             u.username as user_username,
             u.email as user_email,
             s.date as slot_date,
             s.start_time as slot_start_time,
             s.end_time as slot_end_time,
             (
               SELECT json_build_object(
                 'id', v.id,
                 'brand', vm.brand,
                 'model', vm.name,
                 'year', vm.year
               )
               FROM booking_vehicles bv
               JOIN vehicles v ON bv.vehicle_id = v.id
               JOIN vehicle_models vm ON v.model_id = vm.id
               WHERE bv.booking_id = b.id
               LIMIT 1
             ) as vehicle
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN schedule_slots s ON b.schedule_slot_id = s.id
      WHERE b.id = ${id}
    `;
    if (rows.length === 0) return null;
    
    const row = rows[0];
    const booking = {
      ...row,
      user: {
        username: row.user_username,
        email: row.user_email
      },
      schedule_slot: {
        date: row.slot_date,
        start_time: row.slot_start_time,
        end_time: row.slot_end_time
      }
    } as unknown as BookingWithDetails;

    const vehicles = await this.getBookingVehicles(id);
    booking.vehicles = vehicles;

    const equipment = await this.getBookingEquipment(id);
    booking.equipment = equipment;
    
    return booking;
  },

  async findByQrToken(token: string): Promise<BookingWithDetails | null> {
    const rows = await db`
      SELECT b.*,
             u.username as user_username,
             u.email as user_email,
             s.date as slot_date,
             s.start_time as slot_start_time,
             s.end_time as slot_end_time,
             (
               SELECT json_build_object(
                 'id', v.id,
                 'brand', vm.brand,
                 'model', vm.name,
                 'year', vm.year
               )
               FROM booking_vehicles bv
               JOIN vehicles v ON bv.vehicle_id = v.id
               JOIN vehicle_models vm ON v.model_id = vm.id
               WHERE bv.booking_id = b.id
               LIMIT 1
             ) as vehicle
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN schedule_slots s ON b.schedule_slot_id = s.id
      WHERE b.qr_code_token = ${token}
    `;
    if (rows.length === 0) return null;
    
    const row = rows[0];
    return {
      ...row,
      user: {
        username: row.user_username,
        email: row.user_email
      },
      schedule_slot: {
        date: row.slot_date,
        start_time: row.slot_start_time,
        end_time: row.slot_end_time
      }
    } as unknown as BookingWithDetails;
  },

  async create(data: {
    user_id: string;
    schedule_slot_id: string;
    participants_count: number;
    total_price: number;
    notes: string | null;
    qr_code_token: string;
    agreement_accepted: boolean;
    status?: string;
  }): Promise<Booking> {
    const rows = await db`
      INSERT INTO bookings (
        user_id, schedule_slot_id, participants_count, total_price, notes,
        qr_code_token, agreement_accepted, agreement_accepted_at, status
      )
      VALUES (
        ${data.user_id},
        ${data.schedule_slot_id},
        ${data.participants_count},
        ${data.total_price},
        ${data.notes},
        ${data.qr_code_token},
        ${data.agreement_accepted},
        ${data.agreement_accepted ? new Date().toISOString() : null},
        ${data.status || 'pending'}::booking_status
      )
      RETURNING *
    `;
    return rows[0] as unknown as Booking;
  },

  async addEquipment(bookingId: string, items: { equipment_id: string; quantity: number; unit_price: number }[]): Promise<void> {
    if (items.length === 0) return;

    const valuePlaceholders: string[] = [];
    const values: any[] = [];
    let paramIndex = 0;

    for (const item of items) {
      paramIndex++;
      const bookingIdx = paramIndex;
      values.push(bookingId);

      paramIndex++;
      const equipIdx = paramIndex;
      values.push(item.equipment_id);

      paramIndex++;
      const qtyIdx = paramIndex;
      values.push(item.quantity);

      paramIndex++;
      const priceIdx = paramIndex;
      values.push(item.unit_price);

      valuePlaceholders.push(`($${bookingIdx}, $${equipIdx}, $${qtyIdx}, $${priceIdx})`);
    }

    await db.unsafe(
      `INSERT INTO booking_equipment (booking_id, equipment_id, quantity, unit_price)
       VALUES ${valuePlaceholders.join(', ')}`,
      values
    );
  },

  async addVehicles(bookingId: string, vehicleIds: string[]): Promise<void> {
    if (vehicleIds.length === 0) return;

    const valuePlaceholders: string[] = [];
    const values: any[] = [];
    let paramIndex = 0;

    for (const vehicleId of vehicleIds) {
      paramIndex++;
      const bookingIdx = paramIndex;
      values.push(bookingId);

      paramIndex++;
      const vehicleIdx = paramIndex;
      values.push(vehicleId);

      valuePlaceholders.push(`($${bookingIdx}, $${vehicleIdx})`);
    }

    await db.unsafe(
      `INSERT INTO booking_vehicles (booking_id, vehicle_id)
       VALUES ${valuePlaceholders.join(', ')}`,
      values
    );
  },

  async getBookingVehicles(bookingId: string) {
    const rows = await db`
      SELECT v.id, v.internal_id, v.status AS instance_status,
             vm.brand, vm.name AS model, vm.year
      FROM vehicles v
      JOIN booking_vehicles bv ON v.id = bv.vehicle_id
      JOIN vehicle_models vm ON v.model_id = vm.id
      WHERE bv.booking_id = ${bookingId}
    `;
    return rows;
  },

  async getBookingEquipment(bookingId: string) {
    const rows = await db`
      SELECT be.*, e.name AS equipment_name, e.category, e.size
      FROM booking_equipment be
      LEFT JOIN equipment e ON be.equipment_id = e.id
      WHERE be.booking_id = ${bookingId}
    `;
    return rows;
  },

  async updateStatus(id: string, status: string): Promise<Booking | null> {
    const rows = await db`
      UPDATE bookings
      SET status = ${status}::booking_status, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return (rows[0] as unknown as Booking) || null;
  },

  async checkIn(id: string): Promise<Booking | null> {
    const rows = await db`
      UPDATE bookings
      SET status = 'checked_in', checked_in_at = NOW(), updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return (rows[0] as unknown as Booking) || null;
  },

  async findUpcomingByUser(userId: string): Promise<BookingWithDetails[]> {
    const rows = await db`
      SELECT b.*,
             u.email AS user_email,
             u.username AS user_username,
             (
               SELECT vm.brand || ' ' || vm.name
               FROM booking_vehicles bv
               JOIN vehicles v ON bv.vehicle_id = v.id
               JOIN vehicle_models vm ON v.model_id = vm.id
               WHERE bv.booking_id = b.id
               LIMIT 1
             ) AS vehicle_name,
             s.date AS slot_date,
             s.start_time AS slot_start_time,
             s.end_time AS slot_end_time
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN schedule_slots s ON b.schedule_slot_id = s.id
      WHERE b.user_id = ${userId}
        AND b.status IN ('pending', 'confirmed')
        AND s.date >= CURRENT_DATE
      ORDER BY s.date ASC, s.start_time ASC
    `;
    return rows as unknown as BookingWithDetails[];
  },

  async findHistoryByUser(userId: string, limit: number, offset: number): Promise<BookingWithDetails[]> {
    const rows = await db`
      SELECT b.*,
             u.email AS user_email,
             u.username AS user_username,
             (
               SELECT vm.brand || ' ' || vm.name
               FROM booking_vehicles bv
               JOIN vehicles v ON bv.vehicle_id = v.id
               JOIN vehicle_models vm ON v.model_id = vm.id
               WHERE bv.booking_id = b.id
               LIMIT 1
             ) AS vehicle_name,
             s.date AS slot_date,
             s.start_time AS slot_start_time,
             s.end_time AS slot_end_time
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN schedule_slots s ON b.schedule_slot_id = s.id
      WHERE b.user_id = ${userId}
        AND b.status IN ('completed', 'cancelled', 'no_show')
      ORDER BY b.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return rows as unknown as BookingWithDetails[];
  },

  async findTodayBookings(): Promise<BookingWithDetails[]> {
    const rows = await db`
      SELECT b.*,
             u.email AS user_email,
             u.username AS user_username,
             (
               SELECT vm.brand || ' ' || vm.name
               FROM booking_vehicles bv
               JOIN vehicles v ON bv.vehicle_id = v.id
               JOIN vehicle_models vm ON v.model_id = vm.id
               WHERE bv.booking_id = b.id
               LIMIT 1
             ) AS vehicle_name,
             s.date AS slot_date,
             s.start_time AS slot_start_time,
             s.end_time AS slot_end_time
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN schedule_slots s ON b.schedule_slot_id = s.id
      WHERE s.date = CURRENT_DATE
      ORDER BY s.start_time ASC
    `;
    return rows as unknown as BookingWithDetails[];
  },

  async hasUserBookedSlot(userId: string, slotId: string): Promise<boolean> {
    const rows = await db`
      SELECT 1 FROM bookings
      WHERE user_id = ${userId}
        AND schedule_slot_id = ${slotId}
        AND status NOT IN ('cancelled')
      LIMIT 1
    `;
    return rows.length > 0;
  },

  async getReservedEquipmentCount(slotId: string, equipmentId: string): Promise<number> {
    const rows = await db`
      SELECT SUM(be.quantity)::int as total
      FROM booking_equipment be
      JOIN bookings b ON b.id = be.booking_id
      WHERE b.schedule_slot_id = ${slotId}
        AND be.equipment_id = ${equipmentId}
        AND b.status NOT IN ('cancelled', 'no_show')
    `;
    return rows[0]?.total || 0;
  },
};
