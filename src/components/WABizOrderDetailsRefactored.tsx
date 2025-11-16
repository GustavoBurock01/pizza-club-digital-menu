import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Printer, MessageCircle, ChefHat, Check, Truck, Package, 
  CheckCircle, X, Clock 
} from 'lucide-react';
import { OrderClientInfo } from './OrderClientInfo';
import { OrderDeliveryInfo } from './OrderDeliveryInfo';
import { OrderItemsList } from './OrderItemsList';
import { OrderFinancialSummary } from './OrderFinancialSummary';
import { OrderTimeline } from './OrderTimeline';
import { OrderChatPanel } from './OrderChatPanel';
import { useOrderItems } from '@/hooks/useOrderItems';
import { useOrderChat } from '@/hooks/useOrderChat';
import { useThermalPrint } from '@/hooks/useThermalPrint';
import { toast } from 'sonner';
import { supabase } from '@/services/supabase';

interface OrderDetailsProps {
  order: any;
  onClose: () => void;
  onConfirm?: (orderId: string) => void;
  onStartPreparation?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onMarkDelivered?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
}

export const WABizOrderDetailsRefactored = ({
  order,
  onClose,
  onConfirm,
  onStartPreparation,
  onMarkReady,
  onMarkDelivered,
  onCancel,
}: OrderDetailsProps) => {
  const [activeTab, setActiveTab] = useState('dados');
  const { items: orderItems, loading: loadingItems } = useOrderItems(order?.id, true);
  const { unreadCount } = useOrderChat(order?.id);
  const { printOrder } = useThermalPrint();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      preparing: 'bg-orange-500',
      ready: 'bg-green-500',
      in_delivery: 'bg-purple-500',
      delivered: 'bg-green-600',
      cancelled: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Em Preparo',
      ready: 'Pronto',
      in_delivery: 'Em Entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado',
    };
    return labels[status] || status;
  };

  const handlePrint = async () => {
    if (!order) return;
    try {
      await printOrder(order.id);
      toast.success('Pedido enviado para impressão');
    } catch (error) {
      toast.error('Erro ao imprimir pedido');
    }
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', order.id);
      
      if (error) throw error;
      toast.success('Pagamento confirmado! Pedido será confirmado automaticamente.');
      onClose();
    } catch (error) {
      console.error('[ORDER_DETAILS] Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    }
  };

  const getActionButtons = () => {
    if (!order) return null;
    
    const buttons = [];
    const isPresencialPayment = ['cash', 'credit_card_delivery', 'debit_card_delivery'].includes(order.payment_method);

    // Botão de confirmação de pagamento presencial
    if (order.payment_status === 'pending' && isPresencialPayment) {
      buttons.push(
        <Button 
          key="confirm-payment"
          onClick={handleConfirmPayment}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Check className="h-4 w-4 mr-2" />
          Confirmar Pagamento Recebido
        </Button>
      );
    }

    // Botões sempre visíveis
    buttons.push(
      <Button key="print" variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4" />
      </Button>,
      <Button key="whatsapp" variant="outline" size="sm" asChild>
        <a 
          href={`https://wa.me/55${order.customer_phone?.replace(/\D/g, '')}?text=Olá! Sou do restaurante, sobre seu pedido...`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="h-4 w-4" />
        </a>
      </Button>
    );

    // Botões baseados no status
    switch (order.status) {
      case 'confirmed':
        buttons.push(
          <Button 
            key="start-prep"
            onClick={() => onStartPreparation?.(order.id)} 
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Iniciar Preparo
          </Button>
        );
        break;
      
      case 'preparing':
        buttons.push(
          <Button 
            key="mark-ready"
            onClick={() => onMarkReady?.(order.id)} 
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar Pronto
          </Button>
        );
        break;
      
      case 'ready':
        if (order.delivery_method === 'delivery') {
          buttons.push(
            <Button 
              key="out-delivery"
              onClick={() => onMarkDelivered?.(order.id)} 
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              <Truck className="h-4 w-4 mr-2" />
              Saiu para Entrega
            </Button>
          );
        } else {
          buttons.push(
            <Button 
              key="pickup"
              onClick={() => onMarkDelivered?.(order.id)} 
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Package className="h-4 w-4 mr-2" />
              Cliente Retirou
            </Button>
          );
        }
        break;
      
      case 'in_delivery':
        buttons.push(
          <Button 
            key="delivered"
            onClick={() => onMarkDelivered?.(order.id)} 
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar Entrega
          </Button>
        );
        break;
    }

    // Botão cancelar (exceto se já finalizado)
    if (!['delivered', 'cancelled'].includes(order.status)) {
      buttons.push(
        <Button 
          key="cancel"
          variant="destructive" 
          size="sm"
          onClick={() => onCancel?.(order.id)}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      );
    }

    return buttons;
  };

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </DialogTitle>
              <Badge className={`${getStatusColor(order.status)} text-white`}>
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getActionButtons()}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 pt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dados" className="text-sm">
                📋 Dados
              </TabsTrigger>
              <TabsTrigger value="historico" className="text-sm">
                📅 Histórico
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-sm relative">
                💬 Chat
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="ml-2 h-5 px-1.5 text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dados" className="mt-0 p-0">
            <ScrollArea className="h-[calc(90vh-180px)]">
              <div className="space-y-4 p-6">
                <OrderClientInfo order={order} />
                <Separator />
                <OrderDeliveryInfo order={order} />
                <Separator />
                <OrderItemsList items={orderItems} loading={loadingItems} />
                <Separator />
                <OrderFinancialSummary order={order} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="historico" className="mt-0 p-0">
            <ScrollArea className="h-[calc(90vh-180px)]">
              <div className="p-6">
                <OrderTimeline order={order} />
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="chat" className="mt-0 p-0 h-[calc(90vh-180px)]">
            <div className="h-full p-6">
              <OrderChatPanel 
                orderId={order.id} 
                customerName={order.customer_name} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
