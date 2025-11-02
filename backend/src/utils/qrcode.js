import QRCode from 'qrcode';

/**
 * Générer un QR code pour un logement
 */
export async function generatePropertyQRCode(accessLink) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(accessLink, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Erreur génération QR code:', error);
    throw error;
  }
}

/**
 * Générer un lien d'accès unique pour un logement
 */
export function generateAccessLink(propertyId) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${baseUrl}/guest/${propertyId}`;
}
