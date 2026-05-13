import { env } from 'bun'

export const storageConfig = {
    uploadDir: env.UPLOAD_DIR || './uploads',
}
