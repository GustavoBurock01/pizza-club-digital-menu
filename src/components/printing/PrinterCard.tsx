import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Printer, 
  Wifi, 
  Usb, 
  Bluetooth, 
  MoreVertical, 
  TestTube, 
  Trash2, 
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface PrinterConfig {
  id: string;
  name: string;
  connection_type: 'usb' | 'network' | 'bluetooth';
  ip_address?: string;
  port?: number;
  bluetooth_address?: string;
  paper_width: number;
  is_default: boolean;
  is_enabled: boolean;
  last_status: 'online' | 'offline' | 'unknown' | 'error';
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

interface PrinterCardProps {
  printer: PrinterConfig;
  onEdit: (printer: PrinterConfig) => void;
  onDelete: (printerId: string) => void;
  onTest: (printerId: string) => void;
  onToggleEnabled: (printerId: string, enabled: boolean) => void;
  onSetDefault: (printerId: string) => void;
  isTesting?: boolean;
}

const connectionIcons = {
  usb: Usb,
  network: Wifi,
  bluetooth: Bluetooth,
};

const connectionLabels = {
  usb: 'USB',
  network: 'Rede',
  bluetooth: 'Bluetooth',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  unknown: 'bg-gray-400',
  error: 'bg-orange-500',
};

const statusLabels = {
  online: 'Online',
  offline: 'Offline',
  unknown: 'Desconhecido',
  error: 'Erro',
};

export function PrinterCard({
  printer,
  onEdit,
  onDelete,
  onTest,
  onToggleEnabled,
  onSetDefault,
  isTesting = false,
}: PrinterCardProps) {
  const ConnectionIcon = connectionIcons[printer.connection_type];

  const getConnectionInfo = () => {
    switch (printer.connection_type) {
      case 'network':
        return `${printer.ip_address}:${printer.port || 9100}`;
      case 'bluetooth':
        return printer.bluetooth_address || 'Não configurado';
      case 'usb':
        return 'Conexão direta';
      default:
        return 'N/A';
    }
  };

  return (
    <Card 
      className={cn(
        "p-4 transition-all hover:shadow-md relative",
        printer.is_default && "ring-2 ring-primary",
        !printer.is_enabled && "opacity-60"
      )}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", statusColors[printer.last_status])} />
        <span className="text-xs text-muted-foreground">
          {statusLabels[printer.last_status]}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-muted rounded-lg">
          <Printer className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{printer.name}</h3>
            {printer.is_default && (
              <Badge variant="default" className="text-xs">Padrão</Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <ConnectionIcon className="h-3.5 w-3.5" />
            <span>{connectionLabels[printer.connection_type]}</span>
            <span className="mx-1">•</span>
            <span className="font-mono text-xs">{getConnectionInfo()}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-muted-foreground">Largura</span>
          <p className="font-medium">{printer.paper_width}mm</p>
        </div>
        <div>
          <span className="text-muted-foreground">Último uso</span>
          <p className="font-medium">
            {printer.last_used_at 
              ? new Date(printer.last_used_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Nunca'
            }
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center gap-2">
          <Switch 
            checked={printer.is_enabled}
            onCheckedChange={(checked) => onToggleEnabled(printer.id, checked)}
            id={`printer-${printer.id}-enabled`}
          />
          <label 
            htmlFor={`printer-${printer.id}-enabled`}
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Ativa
          </label>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTest(printer.id)}
            disabled={!printer.is_enabled || isTesting}
            className="gap-1"
          >
            {isTesting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <TestTube className="h-3.5 w-3.5" />
            )}
            Testar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(printer)}>
                <Settings className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {!printer.is_default && (
                <DropdownMenuItem onClick={() => onSetDefault(printer.id)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Definir como padrão
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(printer.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
