import { bookingsRepository } from '../bookings/bookings.repository';
import { generateQRCodeDataURL } from '../../shared/utils/qr';
import { generateTicketPDF } from '../../shared/utils/pdf';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';

export const ticketsService = {
  async getQRCode(bookingId: string, userId: string, userRole: string) {
    const booking = await bookingsRepository.findById(bookingId);

    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Authorization check: only owner or admin
    if (userRole !== 'admin' && userRole !== 'superadmin' && booking.user_id !== userId) {
      throw new AppError('You do not have permission to view this ticket', 403, ErrorCodes.FORBIDDEN);
    }

    return await generateQRCodeDataURL(booking.qr_code_token);
  },

  async getTicketPDF(bookingId: string, userId: string, userRole: string) {
    const booking = await bookingsRepository.findById(bookingId);

    if (!booking) {
      throw new AppError('Booking not found', 404, ErrorCodes.NOT_FOUND);
    }

    // Authorization check: only owner or admin
    if (userRole !== 'admin' && userRole !== 'superadmin' && booking.user_id !== userId) {
      throw new AppError('You do not have permission to download this ticket', 403, ErrorCodes.FORBIDDEN);
    }

    const vehicleNames = booking.vehicle_name 
      ? [booking.vehicle_name]
      : (booking.vehicles && booking.vehicles.length > 0 
          ? booking.vehicles.map((v: any) => v.model)
          : ['Own Vehicle']);

    const vehicleName = vehicleNames.join(', ');

    const pdfBuffer = await generateTicketPDF({
      bookingId: booking.id,
      userName: booking.user?.username || booking.user_username || 'Valued Customer',
      vehicleName,
      date: booking.schedule_slot?.date 
        ? new Date(booking.schedule_slot.date).toLocaleDateString('en-US', { dateStyle: 'full' }) 
        : (booking.slot_date ? new Date(booking.slot_date).toLocaleDateString('en-US', { dateStyle: 'full' }) : 'N/A'),
      startTime: (booking.schedule_slot?.start_time || booking.slot_start_time || 'N/A').slice(0, 5),
      endTime: (booking.schedule_slot?.end_time || booking.slot_end_time || 'N/A').slice(0, 5),
      qrToken: booking.qr_code_token
    });

    return pdfBuffer;
  },

  async validateToken(token: string) {
    const booking = await bookingsRepository.findByQrToken(token);

    if (!booking) {
      throw new AppError('Invalid ticket token', 404, ErrorCodes.NOT_FOUND);
    }

    if (booking.status === 'cancelled') {
      throw new AppError('This ticket has been cancelled', 400, ErrorCodes.BAD_REQUEST);
    }

    if (booking.status === 'checked_in') {
      throw new AppError('This ticket has already been checked in', 400, ErrorCodes.BAD_REQUEST);
    }

    if (booking.status === 'completed') {
      throw new AppError('This ticket has already been used and completed', 400, ErrorCodes.BAD_REQUEST);
    }

    // Auto check-in if valid
    const updatedBooking = await bookingsRepository.checkIn(booking.id);

    return {
      success: true,
      message: 'Ticket validated successfully',
      booking: updatedBooking
    };
  }
};
