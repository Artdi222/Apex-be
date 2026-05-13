import { t } from 'elysia';

export const SlotTypeEnum = t.Union([
  t.Literal('open'),
  t.Literal('exclusive'),
  t.Literal('maintenance'),
]);

export const SlotStatusEnum = t.Union([
  t.Literal('available'),
  t.Literal('full'),
  t.Literal('blocked'),
]);

export const CreateScheduleSlotDTO = t.Object({
  date: t.String({ format: 'date' }),
  start_time: t.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' }),
  end_time: t.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' }),
  slot_type: t.Optional(SlotTypeEnum),
  max_capacity: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
});

export const UpdateScheduleSlotDTO = t.Object({
  date: t.Optional(t.String({ format: 'date' })),
  start_time: t.Optional(t.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })),
  end_time: t.Optional(t.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' })),
  slot_type: t.Optional(SlotTypeEnum),
  max_capacity: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
  status: t.Optional(SlotStatusEnum),
});

export const ListSchedulesQueryDTO = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
  date_from: t.Optional(t.String({ format: 'date' })),
  date_to: t.Optional(t.String({ format: 'date' })),
  status: t.Optional(SlotStatusEnum),
  slot_type: t.Optional(SlotTypeEnum),
});

export const GenerateSlotsDTO = t.Object({
  date_from: t.String({ format: 'date' }),
  date_to: t.String({ format: 'date' }),
  start_time: t.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' }),
  end_time: t.String({ pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' }),
  slot_duration_minutes: t.Numeric({ minimum: 30, maximum: 480 }),
  slot_type: t.Optional(SlotTypeEnum),
  max_capacity: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
  days_of_week: t.Optional(t.Array(t.Numeric({ minimum: 0, maximum: 6 }))),
});

export const BlockSlotDTO = t.Object({
  reason: t.Optional(t.String()),
});

export const ScheduleSlotResponseDTO = t.Object({
  id: t.String(),
  date: t.Any(),
  start_time: t.String(),
  end_time: t.String(),
  slot_type: SlotTypeEnum,
  status: SlotStatusEnum,
  max_capacity: t.Number(),
  current_bookings: t.Number(),
  created_at: t.Any()
});

export type SlotType = typeof SlotTypeEnum.static;
export type SlotStatus = typeof SlotStatusEnum.static;
export type CreateScheduleSlotInput = typeof CreateScheduleSlotDTO.static;
export type UpdateScheduleSlotInput = typeof UpdateScheduleSlotDTO.static;
export type ListSchedulesQuery = typeof ListSchedulesQueryDTO.static;
export type GenerateSlotsInput = typeof GenerateSlotsDTO.static;
export type BlockSlotInput = typeof BlockSlotDTO.static;
export type ScheduleSlotResponse = typeof ScheduleSlotResponseDTO.static;
