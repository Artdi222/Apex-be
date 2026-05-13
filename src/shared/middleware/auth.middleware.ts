import { Elysia } from 'elysia'
import { AppError } from '../errors/app-error'
import { ErrorCodes } from '../errors/error-codes'
import { jwtPlugin } from '../plugins/jwt.plugin'
import { UserPayload } from '../types'

export const authMiddleware = (app: Elysia) => 
    app
    .use(jwtPlugin)
    .resolve(async ({ jwt, headers }) => {
        const authHeader = headers['authorization'] || headers['Authorization']
        const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : null
        
        if (!token) {
            console.warn('[Auth] No token found in headers');
            throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
        }

        const payload = await jwt.verify(token)
        if (!payload) {
            console.warn('[Auth] Invalid or expired token');
            throw new AppError('Unauthorized', 401, ErrorCodes.UNAUTHORIZED)
        }
        
        // Map JWT payload (sub, email, role) to UserPayload (id, email, role)
        const user: UserPayload = {
            id: payload.sub as string,
            email: payload.email as string,
            role: payload.role as UserPayload['role'],
        }
        
        return { user }
    })
