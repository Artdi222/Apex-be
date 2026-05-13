import { t } from 'elysia';

export const VehicleClassEnum = t.Union([
  t.Literal('gt'),
  t.Literal('touring'),
  t.Literal('formula'),
  t.Literal('drift'),
  t.Literal('endurance'),
]);

export const VehicleStatusEnum = t.Union([
  t.Literal('available'),
  t.Literal('in_use'),
  t.Literal('maintenance'),
  t.Literal('retired'),
]);

// Create a new model + initial stock
export const CreateVehicleDTO = t.Object({
  name: t.String({ minLength: 1 }),
  brand: t.String({ minLength: 1 }),
  model_code: t.Optional(t.String()),
  year: t.Numeric({ minimum: 1900, maximum: 2100 }),
  class: VehicleClassEnum,
  horsepower: t.Numeric({ minimum: 1 }),
  transmission: t.String({ minLength: 1 }),
  hourly_rate: t.Numeric({ minimum: 0 }),
  images: t.Optional(t.Array(t.String())),
  initial_stock: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
});

// For updating the general Model info
export const UpdateVehicleModelDTO = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  brand: t.Optional(t.String({ minLength: 1 })),
  model_code: t.Optional(t.String()),
  year: t.Optional(t.Numeric({ minimum: 1900, maximum: 2100 })),
  class: t.Optional(VehicleClassEnum),
  horsepower: t.Optional(t.Numeric({ minimum: 1 })),
  transmission: t.Optional(t.String({ minLength: 1 })),
  hourly_rate: t.Optional(t.Numeric({ minimum: 0 })),
  images: t.Optional(t.Array(t.String())),
});

// For updating a specific car instance
export const UpdateVehicleInstanceDTO = t.Object({
  internal_id: t.Optional(t.String()),
  vin: t.Optional(t.String()),
  status: t.Optional(VehicleStatusEnum),
  condition: t.Optional(t.String()),
  mileage: t.Optional(t.Numeric({ minimum: 0 })),
  notes: t.Optional(t.String()),
});

export const ListVehiclesQueryDTO = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
  class: t.Optional(VehicleClassEnum),
  status: t.Optional(VehicleStatusEnum),
  search: t.Optional(t.String()),
});

export type CreateVehicleInput = typeof CreateVehicleDTO.static;
export type UpdateVehicleModelInput = typeof UpdateVehicleModelDTO.static;
export type UpdateVehicleInstanceInput = typeof UpdateVehicleInstanceDTO.static;
export type ListVehiclesQuery = typeof ListVehiclesQueryDTO.static;
