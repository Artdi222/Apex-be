import { Elysia, t } from 'elysia';
import { ticketsService } from './tickets.service';
import { ValidateTicketDTO } from './tickets.dto';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { response } from '../../shared/utils/response';

export const ticketsController = new Elysia({ prefix: '/tickets' })
  .use(authMiddleware)
  .get('/:bookingId/qr', async ({ params, user }) => {
    const qrDataURL = await ticketsService.getQRCode(params.bookingId, user.id, user.role);
    return response.success(qrDataURL);
  }, {
    params: t.Object({
      bookingId: t.String()
    })
  })
  .get('/:bookingId/pdf', async ({ params, user, set }) => {
    const pdfBuffer = await ticketsService.getTicketPDF(params.bookingId, user.id, user.role);
    
    set.headers['Content-Type'] = 'application/pdf';
    set.headers['Content-Disposition'] = `attachment; filename="ticket-${params.bookingId}.pdf"`;
    
    return pdfBuffer;
  }, {
    params: t.Object({
      bookingId: t.String()
    })
  })
  .group('/validate', (app) =>
    app
      .use(requireRole(['admin', 'superadmin']))
      .post('/', async ({ body }) => {
        const result = await ticketsService.validateToken(body.token);
        return response.success(result.booking, result.message);
      }, {
        body: ValidateTicketDTO
      })
  );
