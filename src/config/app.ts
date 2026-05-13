import { env } from 'bun'

export const appConfig = {
    port: env.PORT || 3000,
}
