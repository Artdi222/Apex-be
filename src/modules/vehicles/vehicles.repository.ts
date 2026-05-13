import { db } from '../../database/client';
import type { CreateVehicleInput, UpdateVehicleModelInput, UpdateVehicleInstanceInput } from './vehicles.dto';

export interface VehicleFilterParams {
  class?: string;
  status?: string;
  search?: string;
  limit: number;
  offset: number;
}

export const vehiclesRepository = {
  async findAllModels(params: VehicleFilterParams) {
    const rows = await db`
      SELECT 
        vm.*,
        vm.base_hourly_rate as hourly_rate,
        COUNT(v.id)::int as total_stock,
        COUNT(CASE WHEN v.status IN ('available', 'in_use') THEN 1 END)::int as available_stock,
        -- Check if at least one instance is not currently on track
        EXISTS (
          SELECT 1 FROM vehicles v2
          WHERE v2.model_id = vm.id 
          AND v2.status IN ('available', 'in_use')
          AND NOT EXISTS (
            SELECT 1 FROM booking_vehicles bv
            JOIN bookings b ON b.id = bv.booking_id
            JOIN schedule_slots s ON s.id = b.schedule_slot_id
            WHERE bv.vehicle_id = v2.id
            AND b.status IN ('confirmed', 'checked_in')
            AND s.date = CURRENT_DATE
            AND CURRENT_TIME BETWEEN s.start_time AND s.end_time
          )
        ) as has_available_instance
      FROM vehicle_models vm
      LEFT JOIN vehicles v ON v.model_id = vm.id
      WHERE 1=1
        ${params.class ? db`AND vm.class = ${params.class}::vehicle_class` : db``}
        ${params.search ? db`AND (vm.name ILIKE ${'%' + params.search + '%'} OR vm.brand ILIKE ${'%' + params.search + '%'})` : db``}
      GROUP BY vm.id
      ORDER BY vm.created_at DESC
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    `;

    return rows;
  },

  async countModels(params: Partial<VehicleFilterParams>) {
    const rows = await db`
      SELECT COUNT(*)::int AS total 
      FROM vehicle_models 
      WHERE 1=1
        ${params.class ? db`AND class = ${params.class}::vehicle_class` : db``}
        ${params.search ? db`AND (name ILIKE ${'%' + params.search + '%'} OR brand ILIKE ${'%' + params.search + '%'})` : db``}
    `;
    return rows[0].total;
  },

  async findModelById(id: string) {
    const rows = await db`
      SELECT 
        vm.*,
        vm.base_hourly_rate as hourly_rate,
        COUNT(v.id)::int as total_stock,
        COUNT(CASE WHEN v.status IN ('available', 'in_use') THEN 1 END)::int as available_stock
      FROM vehicle_models vm
      LEFT JOIN vehicles v ON v.model_id = vm.id
      WHERE vm.id = ${id}
      GROUP BY vm.id
    `;
    return rows[0] ? { ...rows[0] } : null;
  },

  async findInstancesByModelId(modelId: string) {
    const rows = await db`
      SELECT * FROM vehicles WHERE model_id = ${modelId} ORDER BY internal_id ASC
    `;
    return rows.map(r => ({ ...r }));
  },

  async findInstanceById(id: string) {
    const rows = await db`
      SELECT v.*, vm.name as model_name, vm.brand, vm.base_hourly_rate as hourly_rate
      FROM vehicles v
      JOIN vehicle_models vm ON vm.id = v.model_id
      WHERE v.id = ${id}
    `;
    return rows[0] ? { ...rows[0] } : null;
  },

  async createModel(data: Omit<CreateVehicleInput, 'initial_stock'>) {
    const rows = await db`
      INSERT INTO vehicle_models (name, brand, model_code, year, class, horsepower, transmission, base_hourly_rate, images)
      VALUES (
        ${data.name},
        ${data.brand},
        ${data.model_code || null},
        ${data.year},
        ${data.class},
        ${data.horsepower},
        ${data.transmission},
        ${data.hourly_rate},
        ${data.images ? JSON.stringify(data.images) : '[]'}::jsonb
      )
      RETURNING *
    `;
    return rows[0];
  },

  async createInstance(modelId: string, internalId: string) {
    const rows = await db`
      INSERT INTO vehicles (model_id, internal_id, status)
      VALUES (${modelId}, ${internalId}, 'available')
      RETURNING *
    `;
    return rows[0];
  },

  async updateModel(id: string, data: UpdateVehicleModelInput) {
    const rows = await db`
      UPDATE vehicle_models
      SET 
        name = COALESCE(${data.name ?? null}, name),
        brand = COALESCE(${data.brand ?? null}, brand),
        model_code = COALESCE(${data.model_code ?? null}, model_code),
        year = COALESCE(${data.year ?? null}, year),
        class = COALESCE(${data.class ?? null}::vehicle_class, class),
        horsepower = COALESCE(${data.horsepower ?? null}, horsepower),
        transmission = COALESCE(${data.transmission ?? null}, transmission),
        base_hourly_rate = COALESCE(${data.hourly_rate ?? null}, base_hourly_rate),
        images = COALESCE(${data.images ? JSON.stringify(data.images) : null}::jsonb, images),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] || null;
  },

  async updateInstance(id: string, data: UpdateVehicleInstanceInput) {
    const rows = await db`
      UPDATE vehicles
      SET 
        internal_id = COALESCE(${data.internal_id ?? null}, internal_id),
        vin = COALESCE(${data.vin ?? null}, vin),
        status = COALESCE(${data.status ?? null}::vehicle_status, status),
        condition = COALESCE(${data.condition ?? null}, condition),
        mileage = COALESCE(${data.mileage ?? null}, mileage),
        notes = COALESCE(${data.notes ?? null}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows[0] || null;
  },

  async deleteModel(id: string) {
    const rows = await db`
      DELETE FROM vehicle_models WHERE id = ${id} RETURNING id
    `;
    return rows[0] || null;
  },

  async deleteInstance(id: string) {
    const rows = await db`
      DELETE FROM vehicles WHERE id = ${id} RETURNING id
    `;
    return rows[0] || null;
  },

  async getAvailableInstance(modelId: string, slotId: string, excludedIds: string[] = []) {
    const rows = await db`
      SELECT v.*
      FROM vehicles v
      WHERE v.model_id = ${modelId}
      AND v.status IN ('available', 'in_use')
      ${excludedIds.length > 0 ? db`AND v.id NOT IN ${db(excludedIds)}` : db``}
      AND NOT EXISTS (
        SELECT 1 FROM booking_vehicles bv
        JOIN bookings b ON b.id = bv.booking_id
        WHERE bv.vehicle_id = v.id
        AND b.schedule_slot_id = ${slotId}
        AND b.status NOT IN ('cancelled', 'no_show')
      )
      LIMIT 1
    `;
    return rows[0] || null;
  }
};
