import { db } from './client'
import fs from 'fs'
import path from 'path'

export const seed = async () => {
    console.log('Seeding data...')
    try {
        const seedFile = path.join(__dirname, 'migrations', '011_seed_data.sql')
        const sql = fs.readFileSync(seedFile, 'utf-8')
        await db.unsafe(sql)
        console.log('Seeding completed successfully!')
    } catch (err) {
        console.error('Seeding failed:', err)
        process.exit(1)
    }
}

seed()
