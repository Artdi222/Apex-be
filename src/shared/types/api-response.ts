import { t } from 'elysia'

export const ApiResponse = t.Object({
    success: t.Boolean(),
    data: t.Optional(t.Any()),
    message: t.Optional(t.String()),
    error: t.Optional(t.Any()),
})
