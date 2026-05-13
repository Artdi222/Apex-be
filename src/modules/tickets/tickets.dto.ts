import { t } from 'elysia';

export const ValidateTicketDTO = t.Object({
  token: t.String({
    minLength: 64,
    maxLength: 64,
    description: 'The 64-character unique QR token for the booking'
  })
});

export type ValidateTicketInput = typeof ValidateTicketDTO.static;
