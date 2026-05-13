import { Elysia } from 'elysia'
import { corsPlugin } from './shared/plugins/cors.plugin'
import { swagger } from '@elysiajs/swagger'
import { jwtPlugin } from './shared/plugins/jwt.plugin'
import { errorHandler } from './shared/errors/error-handler'

import { authController } from './modules/auth/auth.controller'
import { usersController } from './modules/users/users.controller'
import { vehiclesController } from './modules/vehicles/vehicles.controller'
import { equipmentController } from './modules/equipment/equipment.controller'
import { schedulesController } from './modules/schedules/schedules.controller'
import { bookingsController } from './modules/bookings/bookings.controller'
import { ticketsController } from './modules/tickets/tickets.controller'
import { uploadsController } from './modules/uploads/uploads.controller'

const app = new Elysia({ prefix: '/api/v1' })
    .use(corsPlugin)
    .use(swagger({
        documentation: {
            info: {
                title: 'APEX Circuit Rentals API',
                version: '1.0.0',
                description: 'Racing track rental management system API',
            },
            tags: [
                { name: 'Auth', description: 'Authentication endpoints' },
                { name: 'Users', description: 'User management' },
                { name: 'Vehicles', description: 'Vehicle fleet management' },
                { name: 'Equipment', description: 'Racing equipment management' },
                { name: 'Schedules', description: 'Track schedule management' },
                { name: 'Bookings', description: 'Booking management' },
                { name: 'Tickets', description: 'Ticket and QR management' },
                { name: 'Uploads', description: 'File upload management' },
            ],
        },
    }))
    .use(jwtPlugin)
    .use(errorHandler)
    .use(authController)
    .use(usersController)
    .use(vehiclesController)
    .use(equipmentController)
    .use(schedulesController)
    .use(bookingsController)
    .use(ticketsController)
    .use(uploadsController)

export type App = typeof app

export const createApp = () => app
