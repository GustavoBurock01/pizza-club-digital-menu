// ✅ FASE 2: INDICADOR DE STATUS DE CONEXÃO

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';
import { useAttendant } from '@/providers/AttendantProvider';

export const AttendantConnectionStatus = () => {
  const { connectionState } = useAttendant();

  // Não mostrar nada se estiver conectado
  if (connectionState.isConnected) {
    return null;
  }

  // Status de reconexão
  if (connectionState.reconnectAttempts > 0 && connectionState.reconnectAttempts <= 5) {
    return (
      <Alert variant="default" className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">
          Reconectando...
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          Tentando restabelecer conexão (tentativa {connectionState.reconnectAttempts} de 5)
          {connectionState.lastError && (
            <span className="block text-xs mt-1 opacity-75">
              Erro: {connectionState.lastError}
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Falha permanente após 5 tentativas
  if (connectionState.reconnectAttempts > 5) {
    return (
      <Alert variant="destructive" className="mb-4">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Sem conexão com o servidor</AlertTitle>
        <AlertDescription>
          Não foi possível estabelecer conexão. Recarregue a página para tentar novamente.
          <button
            onClick={() => window.location.reload()}
            className="block mt-2 text-sm underline hover:no-underline"
          >
            Recarregar página
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  // Estado inicial desconectado
  return (
    <Alert variant="default" className="mb-4 border-gray-400 bg-gray-50 dark:bg-gray-950/20">
      <WifiOff className="h-4 w-4 text-gray-600" />
      <AlertTitle className="text-gray-900 dark:text-gray-100">
        Conectando ao servidor...
      </AlertTitle>
      <AlertDescription className="text-gray-700 dark:text-gray-300">
        Aguarde enquanto estabelecemos a conexão em tempo real.
      </AlertDescription>
    </Alert>
  );
};

// Badge compacto para mostrar status na navbar/header
export const ConnectionStatusBadge = () => {
  const { connectionState } = useAttendant();

  if (connectionState.isConnected) {
    return (
      <Badge variant="outline" className="gap-1.5 border-green-500 text-green-700 dark:text-green-400">
        <Wifi className="h-3 w-3" />
        Conectado
      </Badge>
    );
  }

  if (connectionState.reconnectAttempts > 5) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <WifiOff className="h-3 w-3" />
        Desconectado
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1.5 border-yellow-500 text-yellow-700 dark:text-yellow-400">
      <AlertTriangle className="h-3 w-3 animate-pulse" />
      Reconectando ({connectionState.reconnectAttempts}/5)
    </Badge>
  );
};
