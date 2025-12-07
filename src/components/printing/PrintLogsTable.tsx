import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Printer,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PrintLog {
  id: string;
  printer_id: string;
  printer_name?: string;
  order_id: string;
  order_number?: number;
  status: 'success' | 'failed' | 'pending';
  copies_requested: number;
  copies_printed: number;
  error_message?: string;
  created_at: string;
}

interface PrintLogsTableProps {
  logs: PrintLog[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onRetry?: (logId: string, orderId: string) => void;
}

const statusConfig = {
  success: {
    label: 'Sucesso',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  failed: {
    label: 'Falhou',
    icon: XCircle,
    color: 'bg-red-100 text-red-700 border-red-200',
  },
  pending: {
    label: 'Pendente',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
};

export function PrintLogsTable({
  logs,
  isLoading = false,
  onRefresh,
  onRetry,
}: PrintLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.printer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(log.order_number || '').includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="p-4">
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="failed">Falhou</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>

        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Pedido</TableHead>
              <TableHead>Impressora</TableHead>
              <TableHead>Cópias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FileText className="h-8 w-8" />
                    <p>Nenhum log de impressão encontrado</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const status = statusConfig[log.status];
                const StatusIcon = status.icon;

                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        #{log.order_number || log.order_id.slice(-6).toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Printer className="h-4 w-4 text-muted-foreground" />
                        <span>{log.printer_name || 'Desconhecida'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        log.copies_printed < log.copies_requested && "text-orange-600"
                      )}>
                        {log.copies_printed}/{log.copies_requested}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1", status.color)}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {log.status === 'failed' && onRetry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRetry(log.id, log.order_id)}
                          className="gap-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Tentar novamente
                        </Button>
                      )}
                      {log.error_message && (
                        <span className="text-xs text-destructive ml-2" title={log.error_message}>
                          ⚠️
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <span>
          {filteredLogs.length} de {logs.length} registros
        </span>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            {logs.filter(l => l.status === 'success').length} sucesso
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-red-500" />
            {logs.filter(l => l.status === 'failed').length} falhas
          </span>
        </div>
      </div>
    </Card>
  );
}
