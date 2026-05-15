import { db } from '../../database/client';

export const analyticsRepository = {
  /**
   * Revenue overview: total revenue, revenue this month, last month, and percentage change.
   */
  async getRevenueOverview() {
    const rows = await db`
      SELECT
        COALESCE(SUM(total_price), 0)::numeric AS total_revenue,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', NOW()) THEN total_price ELSE 0 END), 0)::numeric AS this_month,
        COALESCE(SUM(CASE WHEN DATE_TRUNC('month', b.created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month') THEN total_price ELSE 0 END), 0)::numeric AS last_month
      FROM bookings b
      WHERE b.status IN ('confirmed', 'checked_in', 'completed')
    `;
    return rows[0];
  },

  /**
   * Monthly revenue for the last N months (default 12).
   * Returns [{ month: '2024-05', revenue: 1234.56 }, ...]
   */
  async getMonthlyRevenue(months: number = 12) {
    return await db`
      SELECT
        TO_CHAR(DATE_TRUNC('month', gs.month), 'YYYY-MM') AS month,
        COALESCE(SUM(b.total_price), 0)::numeric AS revenue,
        COUNT(b.id)::int AS bookings_count
      FROM generate_series(
        DATE_TRUNC('month', NOW()) - (${months - 1} * INTERVAL '1 month'),
        DATE_TRUNC('month', NOW()),
        '1 month'
      ) AS gs(month)
      LEFT JOIN bookings b
        ON DATE_TRUNC('month', b.created_at) = gs.month
        AND b.status IN ('confirmed', 'checked_in', 'completed')
      GROUP BY gs.month
      ORDER BY gs.month ASC
    ` as any[];
  },

  /**
   * Daily booking counts for the last N days (default 30).
   */
  async getDailyBookings(days: number = 30) {
    return await db`
      SELECT
        TO_CHAR(gs.day, 'YYYY-MM-DD') AS date,
        COUNT(b.id)::int AS count,
        COALESCE(SUM(b.total_price), 0)::numeric AS revenue
      FROM generate_series(
        (NOW() - (${days - 1} * INTERVAL '1 day'))::date,
        NOW()::date,
        '1 day'
      ) AS gs(day)
      LEFT JOIN bookings b
        ON b.created_at::date = gs.day
        AND b.status NOT IN ('cancelled')
      GROUP BY gs.day
      ORDER BY gs.day ASC
    ` as any[];
  },

  /**
   * Booking status distribution — counts per status.
   */
  async getBookingStatusDistribution() {
    return await db`
      SELECT status, COUNT(*)::int AS count
      FROM bookings
      GROUP BY status
      ORDER BY count DESC
    ` as any[];
  },

  /**
   * Currently active sessions (checked-in bookings on today's slots).
   */
  async getActiveSessions() {
    return await db`
      SELECT
        b.id AS booking_id,
        b.checked_in_at,
        u.username,
        u.email,
        u.avatar_url,
        ss.date,
        ss.start_time,
        ss.end_time,
        ss.slot_type,
        COALESCE(
          (SELECT vm.name FROM booking_vehicles bv
           JOIN vehicles v ON bv.vehicle_id = v.id
           JOIN vehicle_models vm ON v.model_id = vm.id
           WHERE bv.booking_id = b.id LIMIT 1),
          'Own Vehicle'
        ) AS vehicle_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN schedule_slots ss ON b.schedule_slot_id = ss.id
      WHERE b.status = 'checked_in'
        AND ss.date = CURRENT_DATE
      ORDER BY b.checked_in_at ASC
    ` as any[];
  },

  /**
   * Overall dashboard stats.
   */
  async getDashboardStats() {
    const rows = await db`
      SELECT
        (SELECT COUNT(*)::int FROM users WHERE is_active = true) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE created_at >= DATE_TRUNC('month', NOW())) AS new_users_this_month,
        (SELECT COUNT(*)::int FROM bookings WHERE status IN ('confirmed', 'checked_in', 'completed')) AS total_bookings,
        (SELECT COUNT(*)::int FROM bookings WHERE status = 'checked_in') AS active_sessions,
        (SELECT COUNT(*)::int FROM bookings WHERE status = 'pending') AS pending_bookings,
        (SELECT COUNT(*)::int FROM bookings WHERE created_at >= DATE_TRUNC('month', NOW())) AS bookings_this_month,
        (SELECT COUNT(*)::int FROM bookings WHERE created_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month') AND created_at < DATE_TRUNC('month', NOW())) AS bookings_last_month,
        (SELECT COUNT(*)::int FROM vehicles WHERE status = 'available') AS available_vehicles,
        (SELECT COUNT(*)::int FROM vehicles) AS total_vehicles,
        (SELECT COUNT(*)::int FROM incident_reports WHERE status IN ('open', 'investigating')) AS open_incidents,
        (SELECT COALESCE(SUM(total_price), 0)::numeric FROM bookings WHERE status IN ('confirmed', 'checked_in', 'completed')) AS total_revenue
    `;
    return rows[0];
  },

  /**
   * Top vehicles by booking count.
   */
  async getTopVehicles(limit: number = 5) {
    return await db`
      SELECT
        v.id,
        v.internal_id,
        vm.name AS model_name,
        vm.images->>0 AS image_url,
        COUNT(bv.id)::int AS booking_count,
        COALESCE(SUM(vm.base_hourly_rate), 0)::numeric AS estimated_revenue
      FROM booking_vehicles bv
      JOIN vehicles v ON bv.vehicle_id = v.id
      JOIN vehicle_models vm ON v.model_id = vm.id
      GROUP BY v.id, v.internal_id, vm.name, vm.images
      ORDER BY booking_count DESC
      LIMIT ${limit}
    ` as any[];
  },

  /**
   * Capacity utilization — average bookings vs capacity per slot for recent period.
   */
  async getCapacityUtilization(days: number = 30) {
    const rows = await db`
      SELECT
        COALESCE(AVG(
          CASE WHEN ss.max_capacity > 0
            THEN (ss.current_bookings::numeric / ss.max_capacity::numeric) * 100
            ELSE 0
          END
        ), 0)::numeric AS avg_utilization_pct,
        COUNT(DISTINCT ss.id)::int AS total_slots,
        SUM(ss.current_bookings)::int AS total_booked,
        SUM(ss.max_capacity)::int AS total_capacity
      FROM schedule_slots ss
      WHERE ss.date >= (NOW() - (${days} * INTERVAL '1 day'))::date
        AND ss.date <= NOW()::date
    `;
    return rows[0];
  },
};
