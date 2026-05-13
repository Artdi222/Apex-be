import { Elysia, t } from 'elysia';
import { wrapResponse } from '../../shared/utils/response';
import { AppError } from '../../shared/errors/app-error';
import { ErrorCodes } from '../../shared/errors/error-codes';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { requireRole } from '../../shared/middleware/rbac.middleware';
import { ROLES } from '../../shared/types';
import { uploadsService } from './uploads.service';

// Public route for serving static files
const publicRoutes = new Elysia()
  .get(
    '/*',
    ({ params }) => {
      const relativePath = (params as Record<string, string>)['*'];

      if (!relativePath) {
        throw new AppError('File path is required', 400, ErrorCodes.VALIDATION_ERROR);
      }

      const fullPath = uploadsService.getFilePath(relativePath);
      return new Response(Bun.file(fullPath));
    }
  );

// Authenticated routes
const authRoutes = new Elysia()
  .use(authMiddleware)
  // POST /uploads/image — Upload single image (any authenticated user)
  .post(
    '/image',
    async ({ body }) => {
      const { image, subDir } = body;
      const relativePath = await uploadsService.uploadSingle(image, subDir);
      return wrapResponse({ url: relativePath });
    },
    {
      body: t.Object({
        image: t.File(),
        subDir: t.Optional(t.String()),
      }),
    }
  )
  // POST /uploads/images — Upload multiple images (admin only)
  .use(requireRole(ROLES.ALL_ADMINS))
  .post(
    '/images',
    async ({ body }) => {
      const { images, subDir } = body;
      const relativePaths = await uploadsService.uploadMultiple(images, subDir);
      return wrapResponse({ urls: relativePaths });
    },
    {
      body: t.Object({
        images: t.Files(),
        subDir: t.Optional(t.String()),
      }),
    }
  )
  // DELETE /uploads/:filename — Delete file (admin only)
  .delete(
    '/:filename',
    async ({ params }) => {
      await uploadsService.deleteUpload(params.filename);
      return wrapResponse({ message: 'File deleted successfully' });
    },
    {
      params: t.Object({
        filename: t.String(),
      }),
    }
  );

export const uploadsController = new Elysia({ prefix: '/uploads' })
  .use(authRoutes)
  .use(publicRoutes);
