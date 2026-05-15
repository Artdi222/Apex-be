import { Elysia, t } from 'elysia';
import { analyticsService } from './analytics.service';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { wrapResponse } from '../../shared/utils/response';
import { ROLES } from '../../shared/types/user';

export const analyticsController = new Elysia({ prefix: '/analytics' })
  .use(authMiddleware)
  .use(requireRole(ROLES.ALL_ADMINS))

  // GET /analytics — Full analytics dashboard payload
  .get(
    '/',
    async () => {
      const analytics = await analyticsService.getFullAnalytics();
      return wrapResponse(analytics);
    }
  )

  // GET /analytics/stats — Dashboard overview stats only
  .get(
    '/stats',
    async () => {
      const stats = await analyticsService.getDashboardStats();
      return wrapResponse(stats);
    }
  )

  // GET /analytics/revenue — Revenue overview + monthly breakdown
  .get(
    '/revenue',
    async ({ query }) => {
      const [overview, monthly] = await Promise.all([
        analyticsService.getRevenueOverview(),
        analyticsService.getMonthlyRevenue(query.months ? Number(query.months) : 12),
      ]);
      return wrapResponse({ overview, monthly });
    },
    {
      query: t.Object({
        months: t.Optional(t.String()),
      }),
    }
  )

  // GET /analytics/bookings — Daily booking counts
  .get(
    '/bookings',
    async ({ query }) => {
      const daily = await analyticsService.getDailyBookings(
        query.days ? Number(query.days) : 30
      );
      return wrapResponse(daily);
    },
    {
      query: t.Object({
        days: t.Optional(t.String()),
      }),
    }
  )

  // GET /analytics/bookings/status — Booking status distribution
  .get(
    '/bookings/status',
    async () => {
      const distribution = await analyticsService.getBookingStatusDistribution();
      return wrapResponse(distribution);
    }
  )

  // GET /analytics/sessions — Currently active sessions
  .get(
    '/sessions',
    async () => {
      const sessions = await analyticsService.getActiveSessions();
      return wrapResponse(sessions);
    }
  )

  // GET /analytics/vehicles/top — Top vehicles by booking count
  .get(
    '/vehicles/top',
    async ({ query }) => {
      const vehicles = await analyticsService.getTopVehicles(
        query.limit ? Number(query.limit) : 5
      );
      return wrapResponse(vehicles);
    },
    {
      query: t.Object({
        limit: t.Optional(t.String()),
      }),
    }
  )

  // GET /analytics/capacity — Capacity utilization
  .get(
    '/capacity',
    async ({ query }) => {
      const utilization = await analyticsService.getCapacityUtilization(
        query.days ? Number(query.days) : 30
      );
      return wrapResponse(utilization);
    },
    {
      query: t.Object({
        days: t.Optional(t.String()),
      }),
    }
  );
