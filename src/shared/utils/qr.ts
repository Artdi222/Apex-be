import QRCode from 'qrcode';

/**
 * Generates a Data URL (base64) for a QR code containing the given text.
 */
export const generateQRCodeDataURL = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generates a Buffer for a QR code containing the given text.
 */
export const generateQRCodeBuffer = async (text: string): Promise<Buffer> => {
  try {
    return await QRCode.toBuffer(text, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 400,
    });
  } catch (error) {
    console.error('Error generating QR code buffer:', error);
    throw new Error('Failed to generate QR code');
  }
};
