import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Activity, 
  LogIn, 
  LogOut, 
  ShoppingCart, 
  Settings, 
  UserCog,
  Shield,
  FileText
} from 'lucide-react';

interface ActivityLogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: any;
  created_at: string;
}

interface ActivityLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const getActionIcon = (action: string) => {
  const icons: Record<string, React.ReactNode> = {
    login: <LogIn className="h-4 w-4" />,
    logout: <LogOut className="h-4 w-4" />,
    order_created: <ShoppingCart className="h-4 w-4" />,
    order_updated: <ShoppingCart className="h-4 w-4" />,
    settings_changed: <Settings className="h-4 w-4" />,
    role_changed: <Shield className="h-4 w-4" />,
    user_updated: <UserCog className="h-4 w-4" />,
    default: <FileText className="h-4 w-4" />
  };
  return icons[action] || icons.default;
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    login: 'Login',
    logout: 'Logout',
    order_created: 'Criou pedido',
    order_updated: 'Atualizou pedido',
    settings_changed: 'Alterou configurações',
    role_changed: 'Papel alterado',
    user_updated: 'Perfil atualizado',
    product_paused: 'Pausou produto',
    product_pause_ended: 'Retomou produto'
  };
  return labels[action] || action;
};

const getActionColor = (action: string) => {
  if (action.includes('delete') || action.includes('removed')) return 'destructive';
  if (action.includes('create') || action.includes('added')) return 'default';
  if (action.includes('update') || action.includes('changed')) return 'secondary';
  return 'outline';
};

export function ActivityLog({ open, onOpenChange, userId, userName }: ActivityLogProps) {
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      fetchLogs();
    }
  }, [open, userId]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_action_logs')
        .select('*')
        .eq('admin_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade de {userName}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma atividade registrada
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getActionColor(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                      {log.entity_type && (
                        <span className="text-xs text-muted-foreground">
                          em {log.entity_type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(log.changes, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
