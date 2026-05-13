import { appConfig } from './app'
import { dbConfig } from './database'
import { jwtConfig } from './jwt'
import { storageConfig } from './storage'

export const config = {
    app: appConfig,
    db: dbConfig,
    jwt: jwtConfig,
    storage: storageConfig,
}
