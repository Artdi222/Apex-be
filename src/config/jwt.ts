import { env } from 'bun'

export const jwtConfig = {
    secret: env.JWT_SECRET || 'supersecretkey',
    refreshSecret: env.REFRESH_TOKEN_SECRET || 'superrefreshsecretkey',
    accessExpiry: '15m',
    refreshExpiry: '7d',
}
