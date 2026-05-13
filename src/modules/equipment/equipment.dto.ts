import { t } from 'elysia';

export const EquipmentCategoryEnum = t.Union([
  t.Literal('helmet'),
  t.Literal('suit'),
  t.Literal('gloves'),
  t.Literal('shoes'),
  t.Literal('hans_device'),
  t.Literal('other'),
]);

export const EquipmentConditionEnum = t.Union([
  t.Literal('new'),
  t.Literal('good'),
  t.Literal('fair'),
  t.Literal('needs_replacement'),
]);

export const EquipmentStatusEnum = t.Union([
  t.Literal('available'),
  t.Literal('unavailable'),
  t.Literal('retired'),
]);

export const CreateEquipmentDTO = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  category: EquipmentCategoryEnum,
  size: t.Optional(t.String({ maxLength: 20 })),
  brand: t.Optional(t.String({ maxLength: 100 })),
  condition: t.Optional(EquipmentConditionEnum),
  rental_price: t.Numeric({ minimum: 0 }),
  stock_quantity: t.Numeric({ minimum: 0 }),
  available_quantity: t.Optional(t.Numeric({ minimum: 0 })),
  images: t.Optional(t.Array(t.String())),
});

export const UpdateEquipmentDTO = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 255 })),
  category: t.Optional(EquipmentCategoryEnum),
  size: t.Optional(t.String({ maxLength: 20 })),
  brand: t.Optional(t.String({ maxLength: 100 })),
  condition: t.Optional(EquipmentConditionEnum),
  rental_price: t.Optional(t.Numeric({ minimum: 0 })),
  stock_quantity: t.Optional(t.Numeric({ minimum: 0 })),
  available_quantity: t.Optional(t.Numeric({ minimum: 0 })),
  status: t.Optional(EquipmentStatusEnum),
  images: t.Optional(t.Array(t.String())),
});

export const ListEquipmentQueryDTO = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
  category: t.Optional(EquipmentCategoryEnum),
  size: t.Optional(t.String()),
  status: t.Optional(EquipmentStatusEnum),
  search: t.Optional(t.String()),
});

export type CreateEquipmentInput = typeof CreateEquipmentDTO.static;
export type UpdateEquipmentInput = typeof UpdateEquipmentDTO.static;
export type ListEquipmentQuery = typeof ListEquipmentQueryDTO.static;
