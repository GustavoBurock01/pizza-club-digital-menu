import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Clock, Printer, MessageCircle, X, Check, ChefHat, Truck, Package, CheckCircle } from 'lucide-react';
import { StripeClientInfo } from './StripeClientInfo';
import { StripeDeliveryInfo } from './StripeDeliveryInfo';
import { StripeItemsList } from './StripeItemsList';
import { StripeFinancialSummary } from './StripeFinancialSummary';
import { OrderChatPanel } from '../OrderChatPanel';
import { OrderTimeline } from '../OrderTimeline';
import { useOrderItems } from '@/hooks/useOrderItems';
import { useOrderChat } from '@/hooks/useOrderChat';
import { useThermalPrint } from '@/hooks/useThermalPrint';
import { useStoreInfo } from '@/hooks/useStoreInfo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StripeOrderModalProps {
  order: any;
  onClose: () => void;
  onConfirm?: (orderId: string) => void;
  onStartPreparation?: (orderId: string) => void;
  onMarkReady?: (orderId: string) => void;
  onMarkDelivered?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
}

export const StripeOrderModal = ({
  order,
  onClose,
  onConfirm,
  onStartPreparation,
  onMarkReady,
  onMarkDelivered,
  onCancel,
}: StripeOrderModalProps) => {
  const [showChat, setShowChat] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const { items = [] } = useOrderItems(order?.id, !!order);
  const { storeInfo } = useStoreInfo();
  const { printOrder } = useThermalPrint();
  const { messages, unreadCount } = useOrderChat(order?.id);

  if (!order) return null;

  const isPresencialPayment = ['credit_card_delivery', 'debit_card_delivery', 'cash'].includes(order.payment_method);

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const created = new Date(date);
    const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'agora mesmo';
    if (diff < 60) return `${diff} min`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)} dias`;
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
      preparing: 'bg-orange-50 text-orange-700 border-orange-200',
      ready: 'bg-green-50 text-green-700 border-green-200',
      in_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
      delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    };
    return classes[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '🆕 Recebido',
      confirmed: '✓ Confirmado',
      preparing: '👨‍🍳 Em Preparo',
      ready: '✓ Pronto',
      in_delivery: '🚚 Saiu para Entrega',
      delivered: '✓ Entregue',
      cancelled: '✗ Cancelado',
    };
    return labels[status] || status;
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      cash: 'Dinheiro',
      credit_card_delivery: 'Cartão de Crédito (Presencial)',
      debit_card_delivery: 'Cartão de Débito (Presencial)',
    };
    return labels[method] || method;
  };

  const handleConfirmPayment = async () => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', order.id);

      if (error) throw error;

      toast.success('Pagamento confirmado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast.error('Erro ao confirmar pagamento');
    }
  };

  const getPrimaryActionButton = () => {
    if (order.status === 'delivered' || order.status === 'cancelled') return null;
    
    // Confirmação de pagamento presencial tem prioridade
    if (order.payment_status === 'pending' && isPresencialPayment) {
      return (
        <Button 
          size="lg" 
          onClick={handleConfirmPayment}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="h-4 w-4 mr-2" />
          Confirmar Pagamento Recebido
        </Button>
      );
    }
    
    switch (order.status) {
      case 'pending':
      case 'confirmed':
        return (
          <Button 
            size="lg" 
            onClick={() => onStartPreparation?.(order.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Iniciar Preparo
          </Button>
        );
      
      case 'preparing':
        return (
          <Button 
            size="lg"
            onClick={() => onMarkReady?.(order.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar como Pronto
          </Button>
        );
      
      case 'ready':
        return order.delivery_method === 'delivery' ? (
          <Button 
            size="lg"
            onClick={() => onMarkDelivered?.(order.id)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Truck className="h-4 w-4 mr-2" />
            Saiu para Entrega
          </Button>
        ) : (
          <Button 
            size="lg"
            onClick={() => onMarkDelivered?.(order.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Package className="h-4 w-4 mr-2" />
            Cliente Retirou
          </Button>
        );
      
      case 'in_delivery':
        return (
          <Button 
            size="lg"
            onClick={() => onMarkDelivered?.(order.id)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar Entrega
          </Button>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={!!order} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col bg-white">
          {/* HEADER FIXO */}
          <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* ESQUERDA */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500">
                    {storeInfo?.name || 'Pizza Prime'}
                  </span>
                  <span className="text-gray-300">•</span>
                  <DialogTitle className="text-lg font-semibold text-gray-900 m-0">
                    Pedido #{order.id.slice(0, 8).toUpperCase()}
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Recebido há {getRelativeTime(order.created_at)}</span>
                  <span className="text-gray-300">•</span>
                  <span>{formatDateTime(order.created_at)}</span>
                </div>
              </div>
              
              {/* CENTRO */}
              <div className="flex-shrink-0 mx-6">
                <Badge 
                  variant="outline"
                  className={getStatusBadgeClass(order.status)}
                >
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              
              {/* DIREITA */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => printOrder(order.id)}
                  className="h-8 w-8 p-0"
                >
                  <Printer className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowChat(true)}
                  className="h-8 w-8 p-0 relative"
                >
                  <MessageCircle className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowTimeline(true)}
                  className="h-8 w-8 p-0"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* CONTEÚDO SCROLLÁVEL */}
          <ScrollArea className="flex-1 px-6 py-6">
            <div className="space-y-6">
              {/* Bloco Cliente */}
              <StripeClientInfo order={order} />
              
              <Separator className="my-6" />
              
              {/* Bloco Entrega/Retirada */}
              <StripeDeliveryInfo order={order} />
              
              <Separator className="my-6" />
              
              {/* Bloco Itens */}
              <StripeItemsList items={items} />
              
              <Separator className="my-6" />
              
              {/* Bloco Resumo Financeiro */}
              <StripeFinancialSummary order={order} />
              
              <Separator className="my-6" />
              
              {/* Bloco Pagamento */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">Pagamento</h3>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Método
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {getPaymentMethodLabel(order.payment_method)}
                    </p>
                  </div>
                  
                  <div>
                    <Badge 
                      variant={order.payment_status === 'paid' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {order.payment_status === 'paid' 
                        ? '✓ Pago' 
                        : isPresencialPayment 
                          ? '💰 A Cobrar' 
                          : '⏳ Pendente'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* FOOTER FIXO */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              {/* Botão Cancelar */}
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => onCancel?.(order.id)}
                disabled={['delivered', 'cancelled'].includes(order.status)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar Pedido
              </Button>
              
              {/* Botão Primário Dinâmico */}
              {getPrimaryActionButton()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Lateral */}
      <Sheet open={showChat} onOpenChange={setShowChat}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Chat do Pedido</SheetTitle>
          </SheetHeader>
          <OrderChatPanel orderId={order.id} customerName={order.customer_name} />
        </SheetContent>
      </Sheet>

      {/* Timeline Lateral */}
      <Sheet open={showTimeline} onOpenChange={setShowTimeline}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Histórico do Pedido</SheetTitle>
          </SheetHeader>
          <OrderTimeline order={order} />
        </SheetContent>
      </Sheet>
    </>
  );
};
