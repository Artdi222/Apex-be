import { Elysia } from 'elysia'
import { AppError } from '../errors/app-error'
import { ErrorCodes } from '../errors/error-codes'
import { UserRole, UserPayload } from '../types'

export const requireRole = (roles: UserRole[]) => {
    return new Elysia({ name: 'rbac-middleware' })
        .onBeforeHandle(({ user }: { user?: UserPayload } & Record<string, any>) => {
            if (!user || !roles.includes(user.role)) {
                throw new AppError('Forbidden', 403, ErrorCodes.FORBIDDEN)
            }
        })
}
