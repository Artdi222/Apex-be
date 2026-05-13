import { env } from 'bun'

export const dbConfig = {
    url: env.DATABASE_URL || 'postgres://user:password@localhost:5432/apex_circuit',
}
