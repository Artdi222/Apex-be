import { db } from "../../database/client";
import type {
  CreateEquipmentInput,
  UpdateEquipmentInput,
} from "./equipment.dto";

export interface EquipmentFilterParams {
  category?: string;
  size?: string;
  status?: string;
  search?: string;
  limit: number;
  offset: number;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  size: string | null;
  brand: string | null;
  condition: string;
  rental_price: number;
  stock_quantity: number;
  available_quantity: number;
  images: string[];
  status: string;
  created_at: Date;
  updated_at: Date;
}

export const equipmentRepository = {
  async findAll(params: EquipmentFilterParams): Promise<Equipment[]> {
    const rows = await db`
      SELECT e.*,
             (e.stock_quantity - COALESCE((
               SELECT SUM(be.quantity)::int
               FROM booking_equipment be
               JOIN bookings b ON b.id = be.booking_id
               JOIN schedule_slots s ON s.id = b.schedule_slot_id
               WHERE be.equipment_id = e.id
                 AND b.status IN ('confirmed', 'checked_in')
                 AND s.date = CURRENT_DATE
                 AND CURRENT_TIME BETWEEN s.start_time AND s.end_time
             ), 0)) as available_quantity
      FROM equipment e
      WHERE 1=1
        ${params.category ? db`AND e.category = ${params.category}` : db``}
        ${params.size ? db`AND e.size = ${params.size}` : db``}
        ${params.status ? db`AND e.status = ${params.status}` : db``}
        ${params.search ? db`AND (e.name ILIKE ${"%" + params.search + "%"} OR e.brand ILIKE ${"%" + params.search + "%"})` : db``}
      ORDER BY e.created_at DESC
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    `;

    return rows as unknown as Equipment[];
  },

  async count(
    params: Omit<EquipmentFilterParams, "limit" | "offset">,
  ): Promise<number> {
    const rows = await db`
      SELECT COUNT(*)::int AS total 
      FROM equipment 
      WHERE 1=1
        ${params.category ? db`AND category = ${params.category}` : db``}
        ${params.size ? db`AND size = ${params.size}` : db``}
        ${params.status ? db`AND status = ${params.status}` : db``}
        ${params.search ? db`AND (name ILIKE ${"%" + params.search + "%"} OR brand ILIKE ${"%" + params.search + "%"})` : db``}
    `;

    return rows[0].total;
  },

  async findById(id: string): Promise<Equipment | null> {
    const result = await db`
      SELECT e.*,
             (e.stock_quantity - COALESCE((
               SELECT SUM(be.quantity)::int
               FROM booking_equipment be
               JOIN bookings b ON b.id = be.booking_id
               JOIN schedule_slots s ON s.id = b.schedule_slot_id
               WHERE be.equipment_id = e.id
                 AND b.status IN ('confirmed', 'checked_in')
                 AND s.date = CURRENT_DATE
                 AND CURRENT_TIME BETWEEN s.start_time AND s.end_time
             ), 0)) as available_quantity
      FROM equipment e 
      WHERE e.id = ${id}
    `;

    return (result[0] as unknown as Equipment) || null;
  },

  async create(data: CreateEquipmentInput): Promise<Equipment> {
    const result = await db`
      INSERT INTO equipment (
        name,
        category,
        size,
        brand,
        condition,
        rental_price,
        stock_quantity,
        available_quantity,
        images
      ) VALUES (
        ${data.name},
        ${data.category},
        ${data.size || null},
        ${data.brand || null},
        ${data.condition || "new"},
        ${data.rental_price},
        ${data.stock_quantity},
        ${data.available_quantity ?? data.stock_quantity},
        ${data.images ? JSON.stringify(data.images) : "[]"}
      )
      RETURNING *
    `;

    return result[0] as unknown as Equipment;
  },

  async update(
    id: string,
    data: UpdateEquipmentInput,
  ): Promise<Equipment | null> {
    const rows = await db`
      UPDATE equipment
      SET 
        name = COALESCE(${data.name ?? null}, name),
        category = COALESCE(${data.category ?? null}, category),
        size = COALESCE(${data.size ?? null}, size),
        brand = COALESCE(${data.brand ?? null}, brand),
        condition = COALESCE(${data.condition ?? null}, condition),
        rental_price = COALESCE(${data.rental_price ?? null}, rental_price),
        stock_quantity = COALESCE(${data.stock_quantity ?? null}, stock_quantity),
        available_quantity = COALESCE(${data.available_quantity ?? null}, available_quantity),
        status = COALESCE(${data.status ?? null}, status),
        images = COALESCE(${data.images ? JSON.stringify(data.images) : null}, images),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return (rows[0] as unknown as Equipment) || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db`
      DELETE FROM equipment WHERE id = ${id}
    `;

    return result.count > 0;
  },

  async updateImages(id: string, images: string[]): Promise<Equipment | null> {
    const result = await db.unsafe(
      `UPDATE equipment SET images = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [JSON.stringify(images), id],
    );

    return (result[0] as unknown as Equipment) || null;
  },

  async incrementAvailability(id: string, quantity: number): Promise<boolean> {
    const result = await db`
      UPDATE equipment
      SET available_quantity = available_quantity + ${quantity},
          updated_at = NOW()
      WHERE id = ${id}
    `;

    return result.count > 0;
  },

  async decrementAvailability(id: string, quantity: number): Promise<boolean> {
    const result = await db`
      UPDATE equipment
      SET available_quantity = available_quantity - ${quantity},
          updated_at = NOW()
      WHERE id = ${id} AND available_quantity >= ${quantity}
    `;

    return result.count > 0;
  },
};
