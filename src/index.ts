import { createApp } from './app'
import { config } from './config'

const app = createApp()

app.listen(config.app.port, () => {
    console.log(`🦊 Apex Circuit API is running at ${app.server?.hostname}:${app.server?.port}`)
})
