import { t } from 'elysia';

export const BookingStatusEnum = t.Union([
  t.Literal('pending'),
  t.Literal('confirmed'),
  t.Literal('checked_in'),
  t.Literal('completed'),
  t.Literal('cancelled'),
  t.Literal('no_show'),
]);

export const BookingEquipmentItemDTO = t.Object({
  equipment_id: t.String({ format: 'uuid' }),
  quantity: t.Numeric({ minimum: 1, maximum: 10 }),
});

export const CreateBookingDTO = t.Object({
  schedule_slot_id: t.String({ format: 'uuid' }),
  participants_count: t.Optional(t.Numeric({ minimum: 1, maximum: 6, default: 1 })),
  vehicle_ids: t.Optional(t.Array(t.String({ format: 'uuid' }))),
  equipment: t.Optional(t.Array(BookingEquipmentItemDTO)),
  notes: t.Optional(t.String()),
  agreement_accepted: t.Boolean(),
});

export const ListBookingsQueryDTO = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
  status: t.Optional(BookingStatusEnum),
  user_id: t.Optional(t.String({ format: 'uuid' })),
  date_from: t.Optional(t.String({ format: 'date' })),
  date_to: t.Optional(t.String({ format: 'date' })),
});

export const BookingResponseDTO = t.Object({
  id: t.String(),
  status: BookingStatusEnum,
  total_price: t.Numeric(),
  notes: t.Nullable(t.String()),
  participants_count: t.Numeric(),
  created_at: t.Any(),
  user: t.Optional(t.Object({
    username: t.String(),
    email: t.String(),
    avatar_url: t.Optional(t.Nullable(t.String()))
  })),
  schedule_slot: t.Optional(t.Object({
    date: t.Any(),
    start_time: t.String(),
    end_time: t.String()
  })),
  vehicle: t.Optional(t.Nullable(t.Object({
    id: t.String(),
    brand: t.String(),
    model: t.String(),
    year: t.Numeric()
  }))),
  vehicles: t.Optional(t.Array(t.Any())),
  equipment: t.Optional(t.Array(t.Any()))
});

export type BookingStatus = typeof BookingStatusEnum.static;
export type CreateBookingInput = typeof CreateBookingDTO.static;
export type ListBookingsQuery = typeof ListBookingsQueryDTO.static;
export type BookingEquipmentItem = typeof BookingEquipmentItemDTO.static;
export type BookingResponse = typeof BookingResponseDTO.static;
