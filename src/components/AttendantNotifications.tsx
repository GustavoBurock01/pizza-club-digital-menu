import { useState, useEffect } from "react";
import { Bell, Check, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAttendantOrders } from "@/hooks/useAttendantOrders";
import { formatCurrency } from "@/utils/formatting";

interface Notification {
  id: string;
  type: 'new_order' | 'urgent' | 'ready' | 'cancelled';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: string;
}

export function AttendantNotifications() {
  const { orders } = useAttendantOrders();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Gerar notificações baseadas nos pedidos
  useEffect(() => {
    if (!orders) return;

    const newNotifications: Notification[] = [];

    // Pedidos pendentes há mais de 5 minutos
    const urgentOrders = orders.filter(order => {
      const orderTime = new Date(order.created_at);
      const minutesAgo = (Date.now() - orderTime.getTime()) / (1000 * 60);
      return order.status === 'pending' && minutesAgo > 5;
    });

    urgentOrders.forEach(order => {
      newNotifications.push({
        id: `urgent-${order.id}`,
        type: 'urgent',
        title: 'Pedido Urgente',
        message: `Pedido #${order.id.slice(-8)} aguardando há mais de 5 minutos`,
        timestamp: new Date(order.created_at),
        read: false,
        orderId: order.id
      });
    });

    // Pedidos prontos
    const readyOrders = orders.filter(order => order.status === 'ready');
    readyOrders.forEach(order => {
      newNotifications.push({
        id: `ready-${order.id}`,
        type: 'ready',
        title: 'Pedido Pronto',
        message: `Pedido #${order.id.slice(-8)} está pronto para entrega`,
        timestamp: new Date(),
        read: false,
        orderId: order.id
      });
    });

    // Novos pedidos (últimos 5 minutos)
    const recentOrders = orders.filter(order => {
      const orderTime = new Date(order.created_at);
      const minutesAgo = (Date.now() - orderTime.getTime()) / (1000 * 60);
      return order.status === 'pending' && minutesAgo <= 5;
    });

    recentOrders.forEach(order => {
      newNotifications.push({
        id: `new-${order.id}`,
        type: 'new_order',
        title: 'Novo Pedido',
        message: `${order.customer_name} - ${formatCurrency(order.total_amount)}`,
        timestamp: new Date(order.created_at),
        read: false,
        orderId: order.id
      });
    });

    setNotifications(prev => {
      // Manter notificações lidas e adicionar novas
      const existingIds = prev.map(n => n.id);
      const uniqueNew = newNotifications.filter(n => !existingIds.includes(n.id));
      return [...prev, ...uniqueNew].slice(-20); // Manter apenas as 20 mais recentes
    });
  }, [orders]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'ready':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'new_order':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'cancelled':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'ready':
        return 'border-l-green-500 bg-green-50';
      case 'new_order':
        return 'border-l-blue-500 bg-blue-50';
      case 'cancelled':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-muted bg-muted/20';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative gap-2 hover-glow"
        >
          <Bell className="h-4 w-4" />
          Notificações
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-pizza-red hover:bg-pizza-red animate-pulse-glow"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 glass" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Notificações</h4>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Marcar todas como lidas
              </Button>
            )}
          </div>

          <ScrollArea className="h-80">
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:bg-muted/50 ${
                        getNotificationColor(notification.type)
                      } ${!notification.read ? 'shadow-md' : 'opacity-75'}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-pizza-red rounded-full animate-pulse" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}