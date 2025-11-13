// ===== MODAL DE DETALHES DO PEDIDO - VERSÃO COMPLETA COM CHAT E ITENS =====

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Phone, 
  MapPin, 
  Clock, 
  DollarSign, 
  User,
  CreditCard,
  Printer,
  Check,
  Package,
  MessageCircle,
  ShoppingCart,
  CheckCircle,
  X,
  ChefHat,
  Truck
} from "lucide-react";
import { useThermalPrint } from "@/hooks/useThermalPrint";
import { OrderChatPanel } from "./OrderChatPanel";
import { useOrderChat } from "@/hooks/useOrderChat";
import { useOrderItems } from "@/hooks/useOrderItems";

interface OrderDetailsProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onStartPreparation: () => void;
  onMarkReady: () => void;
  onMarkDelivered: () => void;
  onCancel: () => void;
  isUpdating: boolean;
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customizations?: any;
  products?: {
    name: string;
    image_url?: string;
  };
}

export const WABizOrderDetails = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  onStartPreparation,
  onMarkReady,
  onMarkDelivered,
  onCancel,
  isUpdating,
}: OrderDetailsProps) => {
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const { printOrder, isPrinting } = useThermalPrint();
  const { unreadCount } = useOrderChat(order?.id || '');
  
  // ✅ ERRO 5 FIX: Usar hook com retry automático + tipagem explícita
  const { items: orderItems = [], loading: loadingItems } = useOrderItems(order?.id, isOpen);

  if (!order) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "default",
      pending_payment: "secondary",
      confirmed: "default",
      preparing: "secondary",
      ready: "default",
      delivering: "secondary",
      delivered: "outline",
      cancelled: "destructive"
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendente",
      pending_payment: "Aguardando Pagamento",
      confirmed: "Confirmado", 
      preparing: "Preparando",
      ready: "Pronto para Retirada",
      in_delivery: "Em Rota de Entrega",
      delivered: "Entregue",
      completed: "Finalizado",
      cancelled: "Cancelado"
    };
    return labels[status as keyof typeof labels] || status;
  };

  const handlePrintOrder = async (copies = 1) => {
    try {
      await printOrder(order.id, { copies });
      setShowPrintOptions(false);
    } catch (error) {
      console.error('Erro ao imprimir:', error);
    }
  };

  const getActionButtons = () => {
    const isPickup = order.delivery_method === 'pickup';
    
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button 
              onClick={onConfirm} 
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
            <Button 
              variant="destructive" 
              onClick={onCancel} 
              disabled={isUpdating}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        );
      case 'confirmed':
        return (
          <Button 
            onClick={onStartPreparation} 
            disabled={isUpdating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <ChefHat className="h-4 w-4 mr-2" />
            Iniciar Preparo
          </Button>
        );
      case 'preparing':
        return (
          <Button 
            onClick={onMarkReady} 
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            <Package className="h-4 w-4 mr-2" />
            {isPickup ? 'Pronto para Retirada' : 'Enviar para Entrega'}
          </Button>
        );
      case 'ready':
        // Apenas para RETIRADA
        return isPickup ? (
          <Button 
            onClick={onMarkDelivered} 
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Finalizar Pedido
          </Button>
        ) : null;
      
      case 'in_delivery':
        // Apenas para ENTREGA
        return !isPickup ? (
          <Button 
            onClick={onMarkDelivered} 
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Marcar como Entregue
          </Button>
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Pedido #{order.id.slice(0, 8)}</span>
            <Badge variant={getStatusColor(order.status) as any}>
              {getStatusLabel(order.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Itens ({orderItems.length})
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB: DETALHES */}
          <TabsContent value="details" className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações do Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.street && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço de Entrega
                </h3>
                <div className="pl-6 space-y-1">
                  <p className="text-sm">
                    {order.street}, {order.number}
                  </p>
                  {order.complement && (
                    <p className="text-sm text-muted-foreground">{order.complement}</p>
                  )}
                  <p className="text-sm">
                    {order.neighborhood} - {order.city}
                  </p>
                  {order.reference_point && (
                    <p className="text-sm text-muted-foreground">
                      Ref: {order.reference_point}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Resumo Financeiro
              </h3>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="font-medium">
                    R$ {(Number(order.total_amount) - Number(order.delivery_fee || 0)).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                  <p className="font-medium">
                    R$ {Number(order.delivery_fee || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                  <p className="font-medium flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {order.payment_method === 'pix' && 'PIX'}
                    {order.payment_method === 'credit_card' && 'Cartão de Crédito'}
                    {order.payment_method === 'debit_card' && 'Cartão de Débito'}
                    {order.payment_method === 'cash' && 'Dinheiro'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status Pagamento</p>
                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                    {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </div>
              <Separator className="my-2" />
              <div className="pl-6">
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="font-bold text-2xl text-primary">
                  R$ {Number(order.total_amount).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico
              </h3>
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <p className="text-sm text-muted-foreground">Pedido Criado</p>
                  <p className="font-medium text-sm">
                    {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                {order.updated_at !== order.created_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Última Atualização</p>
                    <p className="font-medium text-sm">
                      {format(new Date(order.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2 text-orange-600">
                  <Package className="h-4 w-4" />
                  Observações do Cliente
                </h3>
                <div className="pl-6 text-sm bg-orange-50 dark:bg-orange-950/20 p-4 rounded-md border-l-4 border-orange-500">
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    {order.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {/* Print Button */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrintOptions(!showPrintOptions)}
                  disabled={isPrinting}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Imprimindo...' : 'Imprimir'}
                </Button>
                
                {showPrintOptions && (
                  <div className="absolute top-full mt-1 left-0 bg-popover border rounded-md shadow-lg p-2 space-y-1 z-10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        handlePrintOrder(1);
                        setShowPrintOptions(false);
                      }}
                    >
                      1 via
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        handlePrintOrder(2);
                        setShowPrintOptions(false);
                      }}
                    >
                      2 vias
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        handlePrintOrder(3);
                        setShowPrintOptions(false);
                      }}
                    >
                      3 vias
                    </Button>
                  </div>
                )}
              </div>

              {/* WhatsApp Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const phone = order.customer_phone?.replace(/\D/g, '');
                  const message = `Olá ${order.customer_name}! Seu pedido #${order.id.slice(0, 8)} está sendo preparado.`;
                  window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
                }}
              >
                <Phone className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>

              {/* Status Action Buttons */}
              <div className="flex-1" />
              {getActionButtons()}
            </div>
          </TabsContent>

          {/* TAB: ITENS DO PEDIDO */}
          <TabsContent value="items" className="flex-1 overflow-y-auto py-4">
            {loadingItems ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 text-muted-foreground animate-pulse" />
                  <p className="text-sm text-muted-foreground">Carregando itens...</p>
                </div>
              </div>
            ) : orderItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Nenhum item encontrado</p>
                <p className="text-sm mt-1">Este pedido não possui itens cadastrados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Imagem do Produto */}
                    {item.products?.image_url ? (
                      <img
                        src={item.products.image_url}
                        alt={item.products.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {/* Informações do Item */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-base">
                          {item.products?.name || 'Produto sem nome'}
                        </h4>
                        <Badge variant="secondary" className="ml-2">
                          {item.quantity}x
                        </Badge>
                      </div>

                      {/* Customizações */}
                      {item.customizations && Object.keys(item.customizations).length > 0 && (
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {Object.entries(item.customizations).map(([key, value]) => (
                            <p key={key} className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              <span className="capitalize">{key}:</span> {String(value)}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Preços */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Unit: </span>
                          <span className="font-medium">
                            R$ {Number(item.unit_price).toFixed(2)}
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="text-sm">
                          <span className="text-muted-foreground">Total: </span>
                          <span className="font-bold text-primary">
                            R$ {Number(item.total_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Resumo */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de Itens:</span>
                    <span className="font-medium">
                      {orderItems.reduce((sum, item) => sum + item.quantity, 0)} unidades
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Subtotal dos Itens:</span>
                    <span className="font-bold text-lg text-primary">
                      R$ {orderItems.reduce((sum, item) => sum + Number(item.total_price), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB: CHAT */}
          <TabsContent value="chat" className="flex-1 overflow-hidden">
            <OrderChatPanel 
              orderId={order.id} 
              customerName={order.customer_name}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
