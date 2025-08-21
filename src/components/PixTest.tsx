import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PixTest = () => {
  const [pixKey, setPixKey] = useState('');
  const [amount, setAmount] = useState('10.00');
  const [brCode, setBrCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const generateTestPix = () => {
    if (!pixKey) {
      alert('Digite uma chave PIX');
      return;
    }

    // Generate a simple test PIX code
    const testData = {
      pixKey: pixKey.trim(),
      merchantName: "TESTE PIZZA CLUB",
      merchantCity: "SAO PAULO",
      amount: parseFloat(amount),
      transactionId: `TEST-${Date.now()}`,
      description: "Teste PIX"
    };

    // Simple BR Code generation for testing
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
    const amountStr = testData.amount.toFixed(2);
    payload += `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
    
    // Country Code
    payload += '5802BR';
    
    // Merchant Name
    const merchantName = testData.merchantName.substring(0, 25);
    payload += `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`;
    
    // Merchant City
    const merchantCity = testData.merchantCity.substring(0, 15);
    payload += `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`;
    
    // Additional Data
    const txId = testData.transactionId.substring(0, 25);
    const additionalData = `05${txId.length.toString().padStart(2, '0')}${txId}`;
    payload += `62${additionalData.length.toString().padStart(2, '0')}${additionalData}`;
    
    // CRC16 placeholder
    payload += '6304';
    
    // Calculate simple CRC16
    const crc = calculateSimpleCRC16(payload);
    payload += crc;

    setBrCode(payload);
    setQrCodeUrl(`https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(payload)}&choe=UTF-8`);
  };

  const calculateSimpleCRC16 = (payload: string): string => {
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
  };

  const copyBrCode = async () => {
    try {
      await navigator.clipboard.writeText(brCode);
      alert('BR Code copiado!');
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🧪 Teste PIX</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Use este teste para verificar se sua chave PIX está funcionando corretamente.
            Teste primeiro com um valor baixo como R$ 0,01.
          </AlertDescription>
        </Alert>

        <div>
          <Label htmlFor="pixKey">Chave PIX (CPF, email, telefone ou chave aleatória)</Label>
          <Input
            id="pixKey"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="exemplo@email.com ou 11999999999"
          />
        </div>

        <div>
          <Label htmlFor="amount">Valor para teste (R$)</Label>
          <Input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10.00"
          />
        </div>

        <Button onClick={generateTestPix} className="w-full">
          Gerar PIX de Teste
        </Button>

        {brCode && (
          <div className="space-y-4">
            <div>
              <Label>QR Code Gerado:</Label>
              <div className="flex justify-center mt-2">
                <img src={qrCodeUrl} alt="QR Code PIX Teste" className="border rounded" />
              </div>
            </div>

            <div>
              <Label>BR Code (Copia e Cola):</Label>
              <div className="mt-2 space-y-2">
                <div className="p-2 bg-gray-100 rounded text-xs break-all">
                  {brCode}
                </div>
                <Button onClick={copyBrCode} variant="outline" size="sm">
                  Copiar BR Code
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription>
                Teste este QR Code no seu banco para verificar se está funcionando.
                Se funcionar aqui mas não no sistema, o problema pode ser na configuração da chave PIX no servidor.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};