import { analyticsRepository } from './analytics.repository';

export const analyticsService = {
  async getDashboardStats() {
    return analyticsRepository.getDashboardStats();
  },

  async getRevenueOverview() {
    return analyticsRepository.getRevenueOverview();
  },

  async getMonthlyRevenue(months?: number) {
    return analyticsRepository.getMonthlyRevenue(months);
  },

  async getDailyBookings(days?: number) {
    return analyticsRepository.getDailyBookings(days);
  },

  async getBookingStatusDistribution() {
    return analyticsRepository.getBookingStatusDistribution();
  },

  async getActiveSessions() {
    return analyticsRepository.getActiveSessions();
  },

  async getTopVehicles(limit?: number) {
    return analyticsRepository.getTopVehicles(limit);
  },

  async getCapacityUtilization(days?: number) {
    return analyticsRepository.getCapacityUtilization(days);
  },

  /**
   * Returns a full analytics payload combining all metrics.
   */
  async getFullAnalytics() {
    const [
      stats,
      revenueOverview,
      monthlyRevenue,
      dailyBookings,
      statusDistribution,
      activeSessions,
      topVehicles,
      capacityUtilization,
    ] = await Promise.all([
      analyticsRepository.getDashboardStats(),
      analyticsRepository.getRevenueOverview(),
      analyticsRepository.getMonthlyRevenue(12),
      analyticsRepository.getDailyBookings(30),
      analyticsRepository.getBookingStatusDistribution(),
      analyticsRepository.getActiveSessions(),
      analyticsRepository.getTopVehicles(5),
      analyticsRepository.getCapacityUtilization(30),
    ]);

    return {
      stats,
      revenueOverview,
      monthlyRevenue,
      dailyBookings,
      statusDistribution,
      activeSessions,
      topVehicles,
      capacityUtilization,
    };
  },
};
