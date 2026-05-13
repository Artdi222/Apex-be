import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure random token of specified length.
 * Default is 64 characters (32 bytes hex).
 */
export const generateRandomToken = (bytes: number = 32): string => {
  return randomBytes(bytes).toString('hex');
};

/**
 * Generates a shorter token if needed
 */
export const generateShortToken = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
