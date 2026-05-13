import { Elysia } from 'elysia'
import { AppError } from './app-error'
import { ErrorCodes } from './error-codes'

export const errorHandler = new Elysia({ name: 'error-handler' })
    .error('APP_ERROR', AppError)
    .onError(({ error, set }) => {
        if (error instanceof AppError) {
            set.status = error.statusCode
            return {
                success: false,
                code: error.code,
                message: error.message
            }
        }
        
        console.error(error)
        set.status = 500
        return {
            success: false,
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'Internal Server Error'
        }
    })
