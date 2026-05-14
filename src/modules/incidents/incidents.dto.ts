import { t } from 'elysia';

export const IncidentType = t.Union([
  t.Literal('damage'),
  t.Literal('accident'),
  t.Literal('mechanical'),
  t.Literal('other'),
]);

export const IncidentSeverity = t.Union([
  t.Literal('low'),
  t.Literal('medium'),
  t.Literal('high'),
  t.Literal('critical'),
]);

export const IncidentStatus = t.Union([
  t.Literal('open'),
  t.Literal('investigating'),
  t.Literal('resolved'),
  t.Literal('dismissed'),
]);

export const CreateIncidentDTO = t.Object({
  booking_id: t.String({ format: 'uuid' }),
  type: IncidentType,
  severity: IncidentSeverity,
  description: t.String({ minLength: 20, maxLength: 2000 }),
  official_photos: t.Optional(t.Array(t.String())),
  medical_response_required: t.Optional(t.Boolean()),
  medical_notes: t.Optional(t.String({ maxLength: 1000 })),
  user_unable_to_respond: t.Optional(t.Boolean()),
  estimated_cost: t.Optional(t.Number({ minimum: 0 })),
});

export const UpdateIncidentDTO = t.Object({
  status: t.Optional(IncidentStatus),
  estimated_cost: t.Optional(t.Number({ minimum: 0 })),
  resolution_notes: t.Optional(t.String({ maxLength: 2000 })),
  medical_notes: t.Optional(t.String({ maxLength: 1000 })),
  insurance_notified: t.Optional(t.Boolean()),
  insurance_claim_number: t.Optional(t.String({ maxLength: 100 })),
  police_report_filed: t.Optional(t.Boolean()),
  police_report_number: t.Optional(t.String({ maxLength: 100 })),
  user_unable_to_respond: t.Optional(t.Boolean()),
});

export const AddUserStatementDTO = t.Object({
  statement: t.String({ minLength: 20, maxLength: 2000 }),
  photos: t.Optional(t.Array(t.String())),
});

export const AddWitnessDTO = t.Object({
  witness_name: t.String({ minLength: 2, maxLength: 255 }),
  witness_contact: t.Optional(t.String({ maxLength: 255 })),
  statement: t.String({ minLength: 20, maxLength: 2000 }),
});

export const ListIncidentsQueryDTO = t.Object({
  page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
  status: t.Optional(IncidentStatus),
  severity: t.Optional(IncidentSeverity),
  booking_id: t.Optional(t.String({ format: 'uuid' })),
  medical_response: t.Optional(t.BooleanString()),
  awaiting_user_response: t.Optional(t.BooleanString()),
});

export type CreateIncidentInput = typeof CreateIncidentDTO.static;
export type UpdateIncidentInput = typeof UpdateIncidentDTO.static;
export type AddUserStatementInput = typeof AddUserStatementDTO.static;
export type AddWitnessInput = typeof AddWitnessDTO.static;
export type ListIncidentsQuery = typeof ListIncidentsQueryDTO.static;
