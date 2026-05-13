import { Elysia, t } from 'elysia';
import { bookingsService } from './bookings.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { wrapResponse } from '../../shared/utils/response';
import { ROLES } from '../../shared/types';
import { CreateBookingDTO, ListBookingsQueryDTO, BookingResponseDTO } from './bookings.dto';


// All booking routes require authentication
const userRoutes = new Elysia()
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, user }) => {
      const booking = await bookingsService.createBooking(body, user.id);
      return wrapResponse(booking);
    },
    {
      body: CreateBookingDTO,
    }
  )
  .get(
    '/',
    async ({ query, user }) => {
      const result = await bookingsService.listBookings(query, user.id, user.role);
      return wrapResponse(result);
    },
    { 
      query: ListBookingsQueryDTO,
      response: t.Object({
        success: t.Boolean(),
        data: t.Object({
          bookings: t.Array(BookingResponseDTO),
          pagination: t.Object({
            total: t.Number(),
            page: t.Number(),
            limit: t.Number(),
            totalPages: t.Number()
          })
        }),
        message: t.Optional(t.String())
      })
    }
  )
  .get(
    '/upcoming',
    async ({ user }) => {
      const bookings = await bookingsService.getUpcomingBookings(user.id);
      return wrapResponse(bookings);
    }
  )
  .get(
    '/history',
    async ({ query, user }) => {
      const result = await bookingsService.getBookingHistory(user.id, query);
      return wrapResponse(result);
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
        limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 })),
      }),
    }
  )
  .get(
    '/:id',
    async ({ params, user }) => {
      const booking = await bookingsService.getBookingById(params.id, user.id, user.role);
      return wrapResponse(booking);
    },
    { 
      params: t.Object({ id: t.String({ format: 'uuid' }) }),
      response: t.Object({
        success: t.Boolean(),
        data: BookingResponseDTO,
        message: t.Optional(t.String())
      })
    }
  )
  .put(
    '/:id/cancel',
    async ({ params, user }) => {
      const booking = await bookingsService.cancelBooking(params.id, user.id, user.role);
      return wrapResponse(booking);
    },
    { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
  );

// Admin-only routes
const adminRoutes = new Elysia()
  .use(authMiddleware)
  .use(requireRole(ROLES.ALL_ADMINS))
  .put(
    '/:id/confirm',
    async ({ params }) => {
      const booking = await bookingsService.confirmBooking(params.id);
      return wrapResponse(booking);
    },
    { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
  )
  .put(
    '/:id/checkIn',
    async ({ params }) => {
      const booking = await bookingsService.checkInBooking(params.id);
      return wrapResponse(booking);
    },
    { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
  )
  .put(
    '/:id/complete',
    async ({ params }) => {
      const booking = await bookingsService.completeBooking(params.id);
      return wrapResponse(booking);
    },
    { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
  )
  .put(
    '/:id/noShow',
    async ({ params }) => {
      const booking = await bookingsService.markNoShow(params.id);
      return wrapResponse(booking);
    },
    { params: t.Object({ id: t.String({ format: 'uuid' }) }) }
  )
  .get(
    '/today',
    async () => {
      const bookings = await bookingsService.getTodayBookings();
      return wrapResponse(bookings);
    }
  );

// Combined controller
export const bookingsController = new Elysia({ prefix: '/bookings' })
  .use(userRoutes)
  .use(adminRoutes);
