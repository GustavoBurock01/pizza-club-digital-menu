interface PixData {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  transactionId: string;
  description?: string;
}

export function generateBRCode(pixData: PixData): string {
  const { pixKey, merchantName, merchantCity, amount, transactionId, description } = pixData;
  
  console.log('[PIX-UTILS] Generating BR Code with data:', {
    pixKey: pixKey.substring(0, 5) + '...',
    merchantName,
    merchantCity, 
    amount,
    transactionId
  });
  
  // Validate PIX key format
  if (!pixKey || pixKey.length === 0) {
    throw new Error('PIX key is required');
  }
  
  // EMV format for PIX
  let payload = '';
  
  // Payload Format Indicator
  payload += '000201';
  
  // Point of Initiation Method (12 = static QR code)
  payload += '010212';
  
  // Merchant Account Information (tag 26)
  // This is the most critical part - must follow exact PIX standard
  const pixKeyFormatted = pixKey.trim();
  const merchantAccountInfo = `0014br.gov.bcb.pix01${pixKeyFormatted.length.toString().padStart(2, '0')}${pixKeyFormatted}`;
  const merchantAccountLength = merchantAccountInfo.length.toString().padStart(2, '0');
  payload += `26${merchantAccountLength}${merchantAccountInfo}`;
  
  console.log('[PIX-UTILS] Merchant account info:', merchantAccountInfo);
  
  // Merchant Category Code (0000 = not specified)
  payload += '52040000';
  
  // Transaction Currency (986 = BRL)
  payload += '5303986';
  
  // Transaction Amount
  if (amount > 0) {
    const amountStr = amount.toFixed(2);
    payload += `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
    console.log('[PIX-UTILS] Amount formatted:', amountStr);
  }
  
  // Country Code (BR)
  payload += '5802BR';
  
  // Merchant Name (max 25 chars)
  const merchantNameSafe = merchantName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25);
  payload += `59${merchantNameSafe.length.toString().padStart(2, '0')}${merchantNameSafe}`;
  
  // Merchant City (max 15 chars) 
  const merchantCitySafe = merchantCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 15);
  payload += `60${merchantCitySafe.length.toString().padStart(2, '0')}${merchantCitySafe}`;
  
  // Additional Data Field Template (tag 62) - optional but recommended
  if (description || transactionId) {
    let additionalData = '';
    
    // Transaction ID (tag 05)
    if (transactionId) {
      const txId = transactionId.substring(0, 25);
      additionalData += `05${txId.length.toString().padStart(2, '0')}${txId}`;
    }
    
    // Description (tag 02)
    if (description) {
      const desc = description.normalize('NFD').replace(/[\u0300-\u036f]/g, '').substring(0, 25);
      additionalData += `02${desc.length.toString().padStart(2, '0')}${desc}`;
    }
    
    if (additionalData) {
      payload += `62${additionalData.length.toString().padStart(2, '0')}${additionalData}`;
    }
  }
  
  // CRC16 placeholder
  payload += '6304';
  
  // Calculate CRC16
  const crc = calculateCRC16(payload);
  payload += crc;
  
  console.log('[PIX-UTILS] Final BR Code length:', payload.length);
  console.log('[PIX-UTILS] BR Code preview:', payload.substring(0, 100) + '...');
  
  return payload;
}

function calculateCRC16(payload: string): string {
  const data = new TextEncoder().encode(payload);
  let crc = 0xFFFF;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}