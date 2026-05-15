import { settingsRepository } from './settings.repository';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

// Default settings that the system should have
const DEFAULT_SETTINGS: Record<string, any> = {
  'site.name': 'Apex Circuit Rentals',
  'site.description': 'Premium racing circuit track day bookings',
  'booking.max_participants': 6,
  'booking.auto_confirm': false,
  'booking.cancellation_hours': 24,
  'booking.require_agreement': true,
  'schedule.default_slot_duration_minutes': 60,
  'schedule.default_max_capacity': 6,
  'schedule.default_start_time': '08:00',
  'schedule.default_end_time': '17:00',
  'notification.email_enabled': true,
  'notification.booking_confirmation': true,
  'notification.booking_reminder_hours': 24,
  'pricing.base_rate_open': 150,
  'pricing.base_rate_exclusive': 500,
  'pricing.tax_rate': 10,
  'pricing.weekend_surge_percent': 20,
};

export const settingsService = {
  async getSetting(key: string) {
    const setting = await settingsRepository.getByKey(key);
    if (!setting) {
      // Return default if available
      if (key in DEFAULT_SETTINGS) {
        return { key, value: DEFAULT_SETTINGS[key], updated_at: null, is_default: true };
      }
      throw new AppError(`Setting '${key}' not found`, 404, ErrorCodes.NOT_FOUND);
    }
    return setting;
  },

  async getAllSettings() {
    const stored = await settingsRepository.getAll();
    const storedMap = new Map(stored.map((s: any) => [s.key, s]));

    // Merge with defaults
    const allSettings: any[] = [];
    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
      if (storedMap.has(key)) {
        allSettings.push(storedMap.get(key));
      } else {
        allSettings.push({ key, value: defaultValue, updated_at: null, is_default: true });
      }
    }

    // Add any custom settings not in defaults
    for (const setting of stored) {
      if (!(setting.key in DEFAULT_SETTINGS)) {
        allSettings.push(setting);
      }
    }

    return allSettings;
  },

  async updateSetting(key: string, value: any, userId: string) {
    const result = await settingsRepository.upsert(key, value);

    // Log the change
    await settingsRepository.createAuditLog({
      user_id: userId,
      action: 'update_setting',
      entity: 'system_settings',
      entity_id: key,
    });

    return result;
  },

  async bulkUpdateSettings(settings: { key: string; value: any }[], userId: string) {
    const results = await settingsRepository.bulkUpsert(settings);

    // Log bulk change
    await settingsRepository.createAuditLog({
      user_id: userId,
      action: 'bulk_update_settings',
      entity: 'system_settings',
    });

    return results;
  },

  async deleteSetting(key: string, userId: string) {
    // Prevent deleting default settings
    if (key in DEFAULT_SETTINGS) {
      throw new AppError('Cannot delete a default system setting', 400, ErrorCodes.BAD_REQUEST);
    }

    const deleted = await settingsRepository.deleteByKey(key);
    if (!deleted) {
      throw new AppError(`Setting '${key}' not found`, 404, ErrorCodes.NOT_FOUND);
    }

    await settingsRepository.createAuditLog({
      user_id: userId,
      action: 'delete_setting',
      entity: 'system_settings',
      entity_id: key,
    });

    return deleted;
  },

  async getAuditLogs(filters: { page?: number; limit?: number; user_id?: string; action?: string; entity?: string }) {
    return settingsRepository.getAuditLogs(filters);
  },

  async getPublicSettings() {
    const publicKeys = [
      'site.name',
      'site.description',
      'booking.max_participants',
      'booking.require_agreement',
      'schedule.default_slot_duration_minutes',
      'schedule.default_max_capacity',
      'schedule.default_start_time',
      'schedule.default_end_time',
      'pricing.base_rate_open',
      'pricing.base_rate_exclusive',
      'pricing.tax_rate',
      'pricing.weekend_surge_percent',
    ];

    const allSettings = await this.getAllSettings();
    return allSettings.filter((s: any) => publicKeys.includes(s.key));
  },

  async createAuditLog(data: { user_id: string; action: string; entity: string; entity_id?: string }) {
    return settingsRepository.createAuditLog(data);
  },
};
