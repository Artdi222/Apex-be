import { schedulesRepository } from './schedules.repository';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { getPagination, getPaginationMeta } from '../../shared/utils/pagination';
import type {
  CreateScheduleSlotInput,
  UpdateScheduleSlotInput,
  ListSchedulesQuery,
  GenerateSlotsInput,
} from './schedules.dto';

export const schedulesService = {
  async listSlots(params: ListSchedulesQuery) {
    const { page, limit, offset } = getPagination(params);

    const filterParams = {
      date_from: params.date_from,
      date_to: params.date_to,
      status: params.status,
      slot_type: params.slot_type,
      limit,
      offset,
    };

    const [slots, total] = await Promise.all([
      schedulesRepository.findAll(filterParams),
      schedulesRepository.count(filterParams),
    ]);

    const pagination = getPaginationMeta(total, page, limit);

    return { slots, pagination };
  },

  async getSlotById(id: string) {
    const slot = await schedulesRepository.findById(id);

    if (!slot) {
      throw new AppError('Schedule slot not found', 404, ErrorCodes.NOT_FOUND);
    }

    return slot;
  },

  async createSlot(data: CreateScheduleSlotInput) {
    // Validate time range
    if (data.start_time >= data.end_time) {
      throw new AppError(
        'End time must be after start time',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check for overlapping slots
    const overlapping = await schedulesRepository.findOverlapping(
      data.date,
      data.start_time,
      data.end_time
    );

    if (overlapping.length > 0) {
      throw new AppError(
        'Time slot conflicts with existing schedule',
        409,
        ErrorCodes.CONFLICT
      );
    }

    const slot = await schedulesRepository.create(data);
    return slot;
  },

  async updateSlot(id: string, data: UpdateScheduleSlotInput) {
    const existing = await schedulesRepository.findById(id);

    if (!existing) {
      throw new AppError('Schedule slot not found', 404, ErrorCodes.NOT_FOUND);
    }

    // If changing time/date, validate no conflicts
    const newDate = data.date || existing.date;
    const newStartTime = data.start_time || existing.start_time;
    const newEndTime = data.end_time || existing.end_time;

    if (newStartTime >= newEndTime) {
      throw new AppError(
        'End time must be after start time',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check for overlapping slots (excluding current)
    if (data.date || data.start_time || data.end_time) {
      const overlapping = await schedulesRepository.findOverlapping(
        newDate,
        newStartTime,
        newEndTime,
        id
      );

      if (overlapping.length > 0) {
        throw new AppError(
          'Time slot conflicts with existing schedule',
          409,
          ErrorCodes.CONFLICT
        );
      }
    }

    // Validate max_capacity is not less than current_bookings
    if (data.max_capacity !== undefined && data.max_capacity < existing.current_bookings) {
      throw new AppError(
        `Cannot reduce capacity below current bookings (${existing.current_bookings})`,
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const updated = await schedulesRepository.update(id, data);
    if (!updated) {
      throw new AppError('Failed to update schedule slot', 500, ErrorCodes.INTERNAL_ERROR);
    }
    return updated;
  },

  async deleteSlot(id: string) {
    const existing = await schedulesRepository.findById(id);

    if (!existing) {
      throw new AppError('Schedule slot not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (existing.current_bookings > 0) {
      throw new AppError(
        'Cannot delete slot with active bookings',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const deleted = await schedulesRepository.delete(id);

    if (!deleted) {
      throw new AppError(
        'Failed to delete slot',
        500,
        ErrorCodes.INTERNAL_ERROR
      );
    }
  },

  async generateSlots(data: GenerateSlotsInput) {
    // Validate date range
    if (data.date_from > data.date_to) {
      throw new AppError(
        'date_from must be before or equal to date_to',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (data.start_time >= data.end_time) {
      throw new AppError(
        'End time must be after start time',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const slots: CreateScheduleSlotInput[] = [];
    const startDate = new Date(data.date_from);
    const endDate = new Date(data.date_to);

    // Generate slots for each day in range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();

      // Skip days not in days_of_week if specified
      if (data.days_of_week && data.days_of_week.length > 0) {
        if (!data.days_of_week.includes(dayOfWeek)) {
          continue;
        }
      }

      const dateStr = d.toISOString().split('T')[0];

      // Generate time slots for this day
      const [startHour, startMin] = data.start_time.split(':').map(Number);
      const [endHour, endMin] = data.end_time.split(':').map(Number);
      const dayStartMinutes = startHour * 60 + startMin;
      const dayEndMinutes = endHour * 60 + endMin;

      for (let t = dayStartMinutes; t + data.slot_duration_minutes <= dayEndMinutes; t += data.slot_duration_minutes) {
        const slotStartHour = Math.floor(t / 60);
        const slotStartMin = t % 60;
        const slotEndMin = t + data.slot_duration_minutes;
        const slotEndHour = Math.floor(slotEndMin / 60);
        const slotEndMinute = slotEndMin % 60;

        const slotStart = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMin).padStart(2, '0')}`;
        const slotEnd = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`;

        slots.push({
          date: dateStr,
          start_time: slotStart,
          end_time: slotEnd,
          slot_type: data.slot_type || 'open',
          max_capacity: data.max_capacity || 6,
        });
      }
    }

    if (slots.length === 0) {
      throw new AppError(
        'No slots could be generated with the given parameters',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const created = await schedulesRepository.createMany(slots);

    return {
      generated: slots.length,
      created,
      skipped: slots.length - created,
    };
  },

  async blockSlot(id: string) {
    const existing = await schedulesRepository.findById(id);

    if (!existing) {
      throw new AppError('Schedule slot not found', 404, ErrorCodes.NOT_FOUND);
    }

    if (existing.status === 'blocked') {
      throw new AppError(
        'Slot is already blocked',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const blocked = await schedulesRepository.blockSlot(id);
    if (!blocked) {
      throw new AppError('Failed to block schedule slot', 500, ErrorCodes.INTERNAL_ERROR);
    }
    return blocked;
  },
};
