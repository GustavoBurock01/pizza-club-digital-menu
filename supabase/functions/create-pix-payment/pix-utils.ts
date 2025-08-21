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
  
  // EMV format for PIX
  let payload = '';
  
  // Payload Format Indicator
  payload += '000201';
  
  // Point of Initiation Method
  payload += '010212';
  
  // Merchant Account Information
  const merchantInfo = `0014br.gov.bcb.pix01${pixKey.length.toString().padStart(2, '0')}${pixKey}`;
  payload += `26${merchantInfo.length.toString().padStart(2, '0')}${merchantInfo}`;
  
  // Merchant Category Code
  payload += '52040000';
  
  // Transaction Currency (BRL)
  payload += '5303986';
  
  // Transaction Amount
  const amountStr = amount.toFixed(2);
  payload += `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  
  // Country Code
  payload += '5802BR';
  
  // Merchant Name
  const merchantNameEncoded = merchantName.substring(0, 25);
  payload += `59${merchantNameEncoded.length.toString().padStart(2, '0')}${merchantNameEncoded}`;
  
  // Merchant City
  const merchantCityEncoded = merchantCity.substring(0, 15);
  payload += `60${merchantCityEncoded.length.toString().padStart(2, '0')}${merchantCityEncoded}`;
  
  // Additional Data Field Template
  if (description || transactionId) {
    let additionalData = '';
    
    if (transactionId) {
      const txId = transactionId.substring(0, 25);
      additionalData += `05${txId.length.toString().padStart(2, '0')}${txId}`;
    }
    
    if (description) {
      const desc = description.substring(0, 25);
      additionalData += `02${desc.length.toString().padStart(2, '0')}${desc}`;
    }
    
    payload += `62${additionalData.length.toString().padStart(2, '0')}${additionalData}`;
  }
  
  // CRC16 placeholder
  payload += '6304';
  
  // Calculate CRC16
  const crc = calculateCRC16(payload);
  payload += crc;
  
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