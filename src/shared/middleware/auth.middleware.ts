import { Elysia } from 'elysia'
import { AppError } from '../errors/app-error'
import { ErrorCodes } from '../errors/error-codes'
import { jwtPlugin } from '../plugins/jwt.plugin'
import { UserPayload } from '../types'
import { db } from '../../database/client'

export const authMiddleware = (app: Elysia) => 
    app
    .use(jwtPlugin)
    .resolve(async ({ jwt, headers }) => {
        const authHeader = headers['authorization'] || headers['Authorization']
        const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null
        
        if (!token) {
            throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
        }

        const payload = await jwt.verify(token)
        if (!payload) {
            throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
        }
        
        const [dbUser] = await db`
            SELECT id, email, role, is_active 
            FROM users 
            WHERE id = ${payload.sub as string}
        `

        if (!dbUser) {
            throw new AppError('User no longer exists', 401, ErrorCodes.UNAUTHORIZED)
        }

        if (!dbUser.is_active) {
            throw new AppError('Account is deactivated', 403, ErrorCodes.FORBIDDEN)
        }

        const user: UserPayload = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role as UserPayload['role'],
        }
        
        return { user }
    })
