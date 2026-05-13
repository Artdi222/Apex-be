import { nanoid } from 'nanoid';
import { bookingsRepository } from './bookings.repository';
import { schedulesRepository } from '../schedules/schedules.repository';
import { vehiclesRepository } from '../vehicles/vehicles.repository';
import { equipmentRepository } from '../equipment/equipment.repository';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { getPagination, getPaginationMeta } from '../../shared/utils/pagination';
import type { CreateBookingInput, ListBookingsQuery } from './bookings.dto';

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};

export const bookingsService = {
  async createBooking(data: CreateBookingInput, userId: string) {
    // Validate agreement
    if (!data.agreement_accepted) {
      throw new AppError(
        'You must accept the agreement to create a booking',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Validate schedule slot exists and is available
    const slot = await schedulesRepository.findById(data.schedule_slot_id);
    if (!slot) {
      throw new AppError('Schedule slot not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Parse slot times and calculate duration
    const slotDate = new Date(slot.date);
    const [startH, startM] = slot.start_time.split(':').map(Number);
    const [endH, endM] = slot.end_time.split(':').map(Number);
    const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;

    // Check if slot has already passed
    const slotEndTime = new Date(slotDate.getTime());
    slotEndTime.setHours(endH, endM, 0, 0);
    
    if (slotEndTime < new Date()) {
      throw new AppError(
        'Cannot book a session that has already ended',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (slot.status !== 'available') {
      throw new AppError(
        'Schedule slot is not available',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const participantsCount = data.participants_count || 1;

    if (slot.current_bookings + participantsCount > slot.max_capacity) {
      throw new AppError(
        `Schedule slot does not have enough capacity (available: ${slot.max_capacity - slot.current_bookings})`,
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check if user already booked this slot
    const alreadyBooked = await bookingsRepository.hasUserBookedSlot(userId, data.schedule_slot_id);
    if (alreadyBooked) {
      throw new AppError(
        'You already have a booking for this time slot',
        409,
        ErrorCodes.CONFLICT
      );
    }

    // Calculate session fee based on duration and slot type
    const baseRate = slot.slot_type === 'exclusive' ? 500 : 150;
    const sessionFee = baseRate * durationHours * participantsCount;

    // Validate vehicle models and auto-assign specific instances
    let vehiclePrice = 0;
    const modelIds = data.vehicle_ids || [];
    const assignedInstanceIds: string[] = [];
    
    if (modelIds.length > 0) {
      for (const modelId of modelIds) {
        const model = await vehiclesRepository.findModelById(modelId);
        if (!model) {
          throw new AppError(`Vehicle model ${modelId} not found`, 404, ErrorCodes.NOT_FOUND);
        }

        // Find an available physical instance for this slot, excluding already assigned ones in this booking
        const instance = await vehiclesRepository.getAvailableInstance(modelId, data.schedule_slot_id, assignedInstanceIds);
        if (!instance) {
          throw new AppError(
            `No available cars left for model "${model.name}" in this time slot`,
            400,
            ErrorCodes.VALIDATION_ERROR
          );
        }

        assignedInstanceIds.push(instance.id);

        // Vehicle cost based on duration
        vehiclePrice += Number(model.base_hourly_rate) * durationHours;
      }
    }

    // Validate and calculate equipment costs
    let equipmentTotal = 0;
    const equipmentItems: { equipment_id: string; quantity: number; unit_price: number }[] = [];

    if (data.equipment && data.equipment.length > 0) {
      for (const item of data.equipment) {
        const equipment = await equipmentRepository.findById(item.equipment_id);
        if (!equipment) {
          throw new AppError(
            `Equipment ${item.equipment_id} not found`,
            404,
            ErrorCodes.NOT_FOUND
          );
        }
        if (equipment.status !== 'available') {
          throw new AppError(
            `Equipment "${equipment.name}" is not available`,
            400,
            ErrorCodes.VALIDATION_ERROR
          );
        }
        const reservedCount = await bookingsRepository.getReservedEquipmentCount(data.schedule_slot_id, item.equipment_id);
        const availableForSlot = equipment.stock_quantity - reservedCount;

        if (availableForSlot < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${equipment.name}" in this time slot (available: ${availableForSlot})`,
            400,
            ErrorCodes.VALIDATION_ERROR
          );
        }

        const unitPrice = Number(equipment.rental_price);
        equipmentTotal += unitPrice * item.quantity;
        equipmentItems.push({
          equipment_id: item.equipment_id,
          quantity: item.quantity,
          unit_price: unitPrice,
        });
      }
    }

    let subTotal = vehiclePrice + equipmentTotal + sessionFee;
    
    // Apply weekend surge (20% increase)
    const dayOfWeek = new Date(slot.date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) {
      subTotal *= 1.2;
    }

    // Add 10% tax
    const totalPrice = subTotal * 1.10;

    // Generate unique QR code token
    const qrCodeToken = nanoid(64);

    // Create booking
    const booking = await bookingsRepository.create({
      user_id: userId,
      schedule_slot_id: data.schedule_slot_id,
      participants_count: participantsCount,
      total_price: totalPrice,
      notes: data.notes || null,
      qr_code_token: qrCodeToken,
      agreement_accepted: data.agreement_accepted,
    });

    // Add multiple instances to booking_vehicles
    if (assignedInstanceIds.length > 0) {
      await bookingsRepository.addVehicles(booking.id, assignedInstanceIds);
    }

    // Add equipment to booking
    if (equipmentItems.length > 0) {
      await bookingsRepository.addEquipment(booking.id, equipmentItems);
    }

    // Increment slot bookings count
    await schedulesRepository.incrementBookings(data.schedule_slot_id, participantsCount);

    // Return booking with details
    const fullBooking = await bookingsRepository.findById(booking.id);
    const equipment = await bookingsRepository.getBookingEquipment(booking.id);

    return { ...fullBooking, equipment };
  },

  async listBookings(params: ListBookingsQuery, userId?: string, role?: string) {
    const { page, limit, offset } = getPagination(params);

    const filterParams = {
      user_id: role === 'user' ? userId : params.user_id,
      status: params.status,
      date_from: params.date_from,
      date_to: params.date_to,
      limit,
      offset,
    };

    const [bookings, total] = await Promise.all([
      bookingsRepository.findAll(filterParams),
      bookingsRepository.count(filterParams),
    ]);

    const pagination = getPaginationMeta(total, page, limit);

    return { bookings, pagination };
  },

  async getBookingById(id: string, userId?: string, role?: string) {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Users can only view their own bookings
    if (role === 'user' && booking.user_id !== userId) {
      throw new AppError('Forbidden', 403, ErrorCodes.FORBIDDEN);
    }

    const equipment = await bookingsRepository.getBookingEquipment(id);

    return { ...booking, equipment };
  },

  async confirmBooking(id: string) {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }

    this.validateTransition(booking.status, 'confirmed');

    const updated = await bookingsRepository.updateStatus(id, 'confirmed');
    return updated;
  },

  async cancelBooking(id: string, userId?: string, role?: string) {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Users can only cancel their own bookings
    if (role === 'user' && booking.user_id !== userId) {
      throw new AppError('Forbidden', 403, ErrorCodes.FORBIDDEN);
    }

    this.validateTransition(booking.status, 'cancelled');

    const updated = await bookingsRepository.updateStatus(id, 'cancelled');

    // Decrement slot bookings count
    await schedulesRepository.decrementBookings(booking.schedule_slot_id, booking.participants_count);

    // Restore vehicle status to 'available' for all rented vehicles
    const vehicles = await bookingsRepository.getBookingVehicles(id);
    if (vehicles && vehicles.length > 0) {
      for (const vehicle of vehicles) {
        await vehiclesRepository.updateInstance(vehicle.id, { status: 'available' });
      }
    }

    // Restore equipment availability
    const equipment = await bookingsRepository.getBookingEquipment(id);
    if (equipment && equipment.length > 0) {
      for (const item of equipment) {
        await equipmentRepository.incrementAvailability(item.equipment_id, item.quantity);
      }
    }

    return updated;
  },

  async checkInBooking(id: string) {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }

    this.validateTransition(booking.status, 'checked_in');

    const updated = await bookingsRepository.checkIn(id);

    // Update vehicle status to 'in_use' when checking in
    const vehicles = await bookingsRepository.getBookingVehicles(id);
    if (vehicles && vehicles.length > 0) {
      for (const vehicle of vehicles) {
        await vehiclesRepository.updateInstance(vehicle.id, { status: 'in_use' });
      }
    }

    return updated;
  },

  async completeBooking(id: string) {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }

    this.validateTransition(booking.status, 'completed');

    const updated = await bookingsRepository.updateStatus(id, 'completed');

    // Restore vehicle status to 'available' for all rented vehicles
    const vehicles = await bookingsRepository.getBookingVehicles(id);
    if (vehicles && vehicles.length > 0) {
      for (const vehicle of vehicles) {
        await vehiclesRepository.updateInstance(vehicle.id, { status: 'available' });
      }
    }

    // Restore equipment availability
    const equipment = await bookingsRepository.getBookingEquipment(id);
    if (equipment && equipment.length > 0) {
      for (const item of equipment) {
        await equipmentRepository.incrementAvailability(item.equipment_id, item.quantity);
      }
    }

    return updated;
  },

  async markNoShow(id: string) {
    const booking = await bookingsRepository.findById(id);

    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }

    this.validateTransition(booking.status, 'no_show');

    const updated = await bookingsRepository.updateStatus(id, 'no_show');

    // Decrement slot bookings count
    await schedulesRepository.decrementBookings(booking.schedule_slot_id, booking.participants_count);

    // Restore vehicle status to 'available' for all rented vehicles
    const vehicles = await bookingsRepository.getBookingVehicles(id);
    if (vehicles && vehicles.length > 0) {
      for (const vehicle of vehicles) {
        await vehiclesRepository.updateInstance(vehicle.id, { status: 'available' });
      }
    }

    return updated;
  },

  async getUpcomingBookings(userId: string) {
    return bookingsRepository.findUpcomingByUser(userId);
  },

  async getBookingHistory(userId: string, params: { page?: number; limit?: number }) {
    const { page, limit, offset } = getPagination(params);
    const bookings = await bookingsRepository.findHistoryByUser(userId, limit, offset);
    return { bookings, page, limit };
  },

  async getTodayBookings() {
    return bookingsRepository.findTodayBookings();
  },

  validateTransition(currentStatus: string, targetStatus: string) {
    const allowed = STATUS_TRANSITIONS[currentStatus];

    if (!allowed || !allowed.includes(targetStatus)) {
      throw new AppError(
        `Cannot transition from "${currentStatus}" to "${targetStatus}"`,
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
  },
};
