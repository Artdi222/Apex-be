import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'
import { config } from '../../config'

export const jwtPlugin = new Elysia({ name: 'jwt-plugin' })
    .use(jwt({
        name: 'jwt',
        secret: config.jwt.secret,
        exp: config.jwt.accessExpiry
    }))
