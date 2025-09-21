// ===== COMPONENTE DE TESTE DE IMPRESSORA TÉRMICA =====

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Printer, Wifi, Usb, TestTube } from "lucide-react";
import { useThermalPrint } from "@/hooks/useThermalPrint";
import { Badge } from "@/components/ui/badge";

export const ThermalPrintTest = () => {
  const [printerIP, setPrinterIP] = useState('');
  const [connectionType, setConnectionType] = useState<'usb' | 'network'>('usb');
  const { testPrinter, isPrinting, lastPrintResult } = useThermalPrint();

  const handleTest = async () => {
    try {
      await testPrinter(connectionType === 'network' ? printerIP : undefined);
    } catch (error) {
      console.error('Teste falhou:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="w-5 h-5" />
          Configuração Impressora Térmica Elgin
        </CardTitle>
        <CardDescription>
          Configure e teste sua impressora térmica para comandas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tipo de Conexão */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Tipo de Conexão</Label>
          <div className="flex gap-3">
            <Button
              variant={connectionType === 'usb' ? 'default' : 'outline'}
              onClick={() => setConnectionType('usb')}
              className="flex-1"
            >
              <Usb className="w-4 h-4 mr-2" />
              USB
            </Button>
            <Button
              variant={connectionType === 'network' ? 'default' : 'outline'}
              onClick={() => setConnectionType('network')}
              className="flex-1"
            >
              <Wifi className="w-4 h-4 mr-2" />
              Rede
            </Button>
          </div>
        </div>

        {/* Configuração de Rede */}
        {connectionType === 'network' && (
          <div className="space-y-2">
            <Label htmlFor="printer-ip">IP da Impressora</Label>
            <Input
              id="printer-ip"
              placeholder="192.168.1.100"
              value={printerIP}
              onChange={(e) => setPrinterIP(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Configure o IP fixo da impressora na sua rede
            </p>
          </div>
        )}

        <Separator />

        {/* Teste de Impressão */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Teste de Funcionamento</Label>
          <Button
            onClick={handleTest}
            disabled={isPrinting || (connectionType === 'network' && !printerIP)}
            className="w-full"
            size="lg"
          >
            <TestTube className="w-4 h-4 mr-2" />
            {isPrinting ? 'Testando...' : 'Enviar Teste de Impressão'}
          </Button>
        </div>

        {/* Resultado do Último Teste */}
        {lastPrintResult && (
          <div className="space-y-3">
            <Label className="text-base font-medium">Status da Última Impressão</Label>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Badge variant={lastPrintResult.success ? 'default' : 'destructive'}>
                  {lastPrintResult.success ? 'Sucesso' : 'Falha'}
                </Badge>
                <span className="text-sm">{lastPrintResult.message}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(lastPrintResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Instruções de Setup</Label>
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>USB:</strong> Conecte a impressora via cabo USB e instale os drivers Elgin</p>
            <p><strong>Rede:</strong> Configure IP fixo na impressora e garanta que está na mesma rede</p>
            <p><strong>Papel:</strong> Use papel térmico 58mm ou 80mm</p>
            <p><strong>Teste:</strong> Sempre teste antes de usar em produção</p>
          </div>
        </div>

        {/* Status da Integração */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-800">
            <Printer className="w-4 h-4" />
            <span className="font-medium">Sistema de Impressão Ativo</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            Edge Function configurada e pronta para uso
          </p>
        </div>
      </CardContent>
    </Card>
  );
};