import PDFDocument from 'pdfkit';
import { generateQRCodeBuffer } from './qr';

export interface TicketData {
  bookingId: string;
  userName: string;
  vehicleName?: string;
  date: string;
  startTime: string;
  endTime: string;
  qrToken: string;
}

export const generateTicketPDF = async (data: TicketData): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 0, 
        info: {
          Title: `Apex Circuit Ticket - ${data.bookingId}`,
          Author: 'Apex Circuit Rentals',
        }
      });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // 1. Header Background
      doc.rect(0, 0, pageWidth, 120).fill('#1A1A1A');
      
      // 2. Accent Bar
      doc.rect(0, 120, pageWidth, 8).fill('#2563EB'); 

      // 3. Header Content
      doc.fillColor('#FFFFFF');
      doc.fontSize(28).font('Helvetica-Bold').text('APEX CIRCUIT', 50, 40, { characterSpacing: 2 });
      doc.fontSize(10).font('Helvetica').text('OFFICIAL ENTRANCE PASS', 50, 75, { characterSpacing: 1 });
      
      doc.fontSize(12).font('Helvetica-Bold').text('E-TICKET', pageWidth - 150, 55, { align: 'right', width: 100 });
      doc.fillOpacity(0.8);
      doc.fontSize(8).font('Helvetica').text(`#${data.bookingId.slice(0, 12).toUpperCase()}`, pageWidth - 150, 75, { align: 'right', width: 100 });
      doc.fillOpacity(1.0);

      // 4. Main Body Content
      doc.fillColor('#1A1A1A');
      const contentTop = 180;
      
      // Left Column: Details
      const labelX = 50;
      const valueX = 160;
      const rowHeight = 35;

      const drawRow = (label: string, value: string, y: number) => {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#6B7280').text(label.toUpperCase(), labelX, y);
        const textStartY = y - 4;
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1A1A1A').text(value, valueX, textStartY, { width: 200 }); 
        const lineY = Math.max(y + 18, doc.y + 5);
        doc.rect(labelX, lineY, 280, 0.5).fill('#E5E7EB');
        return lineY;
      };

      let currentY = contentTop;
      currentY = drawRow('Driver', data.userName, currentY) + 25;
      currentY = drawRow('Vehicle', data.vehicleName || 'Own Vehicle', currentY) + 25;
      currentY = drawRow('Date', data.date, currentY) + 25;
      currentY = drawRow('Time Slot', `${data.startTime} - ${data.endTime}`, currentY) + 25;

      // Right Column: QR Code Box
      const qrBoxSize = 180;
      const qrBoxX = pageWidth - qrBoxSize - 50;
      const qrBoxY = contentTop;

      doc.rect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize).lineWidth(1).stroke('#E5E7EB');
      
      const qrBuffer = await generateQRCodeBuffer(data.qrToken);
      doc.image(qrBuffer, qrBoxX + 15, qrBoxY + 15, { width: qrBoxSize - 30 });
      
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#6B7280').text('SCAN AT PIT ENTRY', qrBoxX, qrBoxY + qrBoxSize + 10, { width: qrBoxSize, align: 'center' });

      // 5. Important Info / Disclaimer
      const infoBoxY = contentTop + rowHeight * 7;
      doc.rect(50, infoBoxY, pageWidth - 100, 100).fill('#F9FAFB');
      doc.fillColor('#1A1A1A');
      doc.fontSize(10).font('Helvetica-Bold').text('IMPORTANT INSTRUCTIONS:', 70, infoBoxY + 20);
      doc.fontSize(9).font('Helvetica').fillColor('#374151');
      doc.text('• Please arrive 30 minutes before your scheduled session.', 70, infoBoxY + 40);
      doc.text('• Valid driver\'s license and safety gear are required for all participants.', 70, infoBoxY + 55);
      doc.text('• This ticket is non-transferable and valid only for the specified date/time.', 70, infoBoxY + 70);

      // 6. Footer
      doc.rect(0, pageHeight - 60, pageWidth, 60).fill('#F3F4F6');
      doc.fillColor('#9CA3AF');
      doc.fontSize(8).font('Helvetica').text('© 2026 APEX CIRCUIT RENTALS • 123 RACING WAY, SPEEDWAY • SUPPORT@APEXCIRCUIT.COM', 0, pageHeight - 35, { align: 'center', width: pageWidth });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
