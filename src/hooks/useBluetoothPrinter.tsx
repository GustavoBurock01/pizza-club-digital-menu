import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface BluetoothDevice {
  name: string;
  address: string;
  device?: any; // Web Bluetooth Device
}

interface PrintResult {
  success: boolean;
  message: string;
}

export function useBluetoothPrinter() {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if Web Bluetooth is supported
  const isSupported = useCallback(() => {
    return 'bluetooth' in navigator;
  }, []);

  // Discover Bluetooth devices
  const discoverDevices = useCallback(async (): Promise<BluetoothDevice[]> => {
    if (!isSupported()) {
      toast.error('Bluetooth não suportado neste navegador');
      throw new Error('Web Bluetooth not supported');
    }

    try {
      setIsDiscovering(true);
      setError(null);

      // Request Bluetooth device with serial port profile
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['00001101-0000-1000-8000-00805f9b34fb'], // Serial Port Profile
      });

      const discoveredDevice: BluetoothDevice = {
        name: device.name || 'Dispositivo desconhecido',
        address: device.id,
        device,
      };

      console.log('[BLUETOOTH] Device discovered:', discoveredDevice);

      return [discoveredDevice];
    } catch (err: any) {
      console.error('[BLUETOOTH] Discovery error:', err);
      
      if (err.name === 'NotFoundError') {
        setError('Nenhum dispositivo selecionado');
      } else if (err.name === 'SecurityError') {
        setError('Permissão Bluetooth negada');
      } else {
        setError(err.message);
      }
      
      throw err;
    } finally {
      setIsDiscovering(false);
    }
  }, [isSupported]);

  // Connect to a device
  const connect = useCallback(async (device: BluetoothDevice): Promise<boolean> => {
    try {
      setIsConnecting(true);
      setError(null);

      if (!device.device?.gatt) {
        throw new Error('Dispositivo não suporta GATT');
      }

      console.log('[BLUETOOTH] Connecting to:', device.name);

      const server = await device.device.gatt.connect();
      
      if (server.connected) {
        setConnectedDevice(device);
        toast.success(`Conectado a ${device.name}`);
        return true;
      }

      throw new Error('Falha ao conectar');
    } catch (err: any) {
      console.error('[BLUETOOTH] Connection error:', err);
      setError(err.message);
      toast.error('Erro ao conectar: ' + err.message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect from device
  const disconnect = useCallback(() => {
    if (connectedDevice?.device?.gatt?.connected) {
      connectedDevice.device.gatt.disconnect();
    }
    setConnectedDevice(null);
    console.log('[BLUETOOTH] Disconnected');
  }, [connectedDevice]);

  // Print content to connected device
  const print = useCallback(async (content: string): Promise<PrintResult> => {
    if (!connectedDevice?.device?.gatt?.connected) {
      return {
        success: false,
        message: 'Nenhuma impressora conectada',
      };
    }

    try {
      setIsPrinting(true);
      setError(null);

      const server = connectedDevice.device.gatt;
      
      // Try to get the Serial Port service
      const service = await server.getPrimaryService('00001101-0000-1000-8000-00805f9b34fb');
      
      // Get the characteristic for writing
      const characteristics = await service.getCharacteristics();
      const writeCharacteristic = characteristics.find((c: any) => 
        c.properties.write || c.properties.writeWithoutResponse
      );

      if (!writeCharacteristic) {
        throw new Error('Característica de escrita não encontrada');
      }

      // Convert string to bytes
      const encoder = new TextEncoder();
      const data = encoder.encode(content);

      // Write in chunks if necessary
      const chunkSize = 20; // BLE typically has a 20-byte limit
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await writeCharacteristic.writeValue(chunk);
      }

      console.log('[BLUETOOTH] Print complete');
      toast.success('Impressão enviada!');

      return {
        success: true,
        message: 'Impressão concluída',
      };
    } catch (err: any) {
      console.error('[BLUETOOTH] Print error:', err);
      setError(err.message);
      toast.error('Erro ao imprimir: ' + err.message);

      return {
        success: false,
        message: err.message,
      };
    } finally {
      setIsPrinting(false);
    }
  }, [connectedDevice]);

  // Test print
  const testPrint = useCallback(async (): Promise<PrintResult> => {
    const testContent = `
================================
      TESTE DE IMPRESSAO
================================

Este e um teste de impressao
via Bluetooth.

Data: ${new Date().toLocaleString('pt-BR')}

--------------------------------
    Impressora funcionando!
================================

`;
    return print(testContent);
  }, [print]);

  return {
    isSupported: isSupported(),
    isDiscovering,
    isConnecting,
    isPrinting,
    connectedDevice,
    error,
    discoverDevices,
    connect,
    disconnect,
    print,
    testPrint,
  };
}
