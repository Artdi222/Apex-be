import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from '../../config';

export const saveFile = async (file: File, subDir: string = ''): Promise<string> => {
  const uploadDir = join(process.cwd(), config.storage.uploadDir, subDir);
  
  // Ensure directory exists
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const filePath = join(uploadDir, fileName);

  await Bun.write(filePath, file);

  // Return the relative path for database storage
  return join(subDir, fileName).replace(/\\/g, '/');
};

export const deleteFile = async (relativePath: string): Promise<void> => {
  const filePath = join(process.cwd(), config.storage.uploadDir, relativePath);
  const file = Bun.file(filePath);
  if (await file.exists()) {
    // In Bun, we can't delete directly with Bun.file, use node:fs
    const { unlink } = await import('node:fs/promises');
    await unlink(filePath);
  }
};
