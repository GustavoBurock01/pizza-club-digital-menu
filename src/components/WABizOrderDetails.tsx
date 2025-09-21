// ===== MODAL DE DETALHES DO PEDIDO - PADRÃO WABIZ =====

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, Phone, MapPin, Clock, CreditCard, 
  Package, Printer, CheckCircle, X, ChefHat, Truck 
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useThermalPrint } from "@/hooks/useThermalPrint";
import { useState } from "react";

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

export const WABizOrderDetails = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  onStartPreparation,
  onMarkReady,
  onMarkDelivered,
  onCancel,
  isUpdating
}: OrderDetailsProps) => {
  const { printOrder, isPrinting } = useThermalPrint();
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  
  if (!order) return null;

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      confirmed: "bg-blue-100 text-blue-800 border-blue-300",
      preparing: "bg-purple-100 text-purple-800 border-purple-300",
      ready: "bg-green-100 text-green-800 border-green-300",
      delivering: "bg-orange-100 text-orange-800 border-orange-300",
      delivered: "bg-gray-100 text-gray-800 border-gray-300",
      cancelled: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendente",
      confirmed: "Confirmado", 
      preparing: "Preparando",
      ready: "Pronto",
      delivering: "Em entrega",
      delivered: "Entregue",
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
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <Button 
              onClick={onConfirm} 
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Pedido
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
            className="bg-purple-600 hover:bg-purple-700 text-white"
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
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Package className="h-4 w-4 mr-2" />
            Marcar como Pronto
          </Button>
        );
      case 'ready':
        return (
          <Button 
            onClick={onMarkDelivered} 
            disabled={isUpdating}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Truck className="h-4 w-4 mr-2" />
            Saiu para Entrega
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">
              Pedido #{order.id.slice(-8).toUpperCase()}
            </span>
            <Badge className={`${getStatusColor(order.status)} font-medium`}>
              {getStatusLabel(order.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Nome:</span>
                <p className="text-gray-900">{order.customer_name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Telefone:</span>
                <p className="text-gray-900 flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {order.customer_phone}
                </p>
              </div>
              {order.customer_email && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{order.customer_email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Endereço de Entrega */}
          {(order.street || order.neighborhood) && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Endereço de Entrega
              </h3>
              <div className="text-sm">
                <p className="text-gray-900">
                  {order.street && `${order.street}${order.number ? `, ${order.number}` : ''}`}
                </p>
                {order.neighborhood && (
                  <p className="text-gray-600">{order.neighborhood} - {order.city || 'Cidade'}</p>
                )}
              </div>
            </div>
          )}

          {/* Informações do Pedido */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Detalhes do Pedido
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Total de Itens:</span>
                <p className="text-gray-900 font-semibold">{order.total_items || order.items_count}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Valor Total:</span>
                <p className="text-gray-900 font-semibold">R$ {order.total_amount.toFixed(2)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Taxa Entrega:</span>
                <p className="text-gray-900">R$ {order.delivery_fee.toFixed(2)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Pagamento:</span>
                <p className="text-gray-900 flex items-center">
                  <CreditCard className="h-3 w-3 mr-1" />
                  {order.payment_method}
                </p>
              </div>
            </div>
          </div>

          {/* Horários */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Cronologia do Pedido
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-600">Recebido em:</span>
                <p className="text-gray-900">
                  {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Última atualização:</span>
                <p className="text-gray-900">
                  {format(new Date(order.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                Observações Especiais
              </h3>
              <p className="text-gray-900 text-sm italic">"{order.notes}"</p>
            </div>
          )}

          <Separator />

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPrintOptions(!showPrintOptions)}
                  disabled={isPrinting}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  {isPrinting ? 'Imprimindo...' : 'Imprimir Comanda'}
                </Button>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar Cliente
                </Button>
              </div>

              {/* Opções de Impressão */}
              {showPrintOptions && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-3">Opções de Impressão</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePrintOrder(1)}
                      disabled={isPrinting}
                    >
                      1 Via
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePrintOrder(2)}
                      disabled={isPrinting}
                    >
                      2 Vias
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handlePrintOrder(3)}
                      disabled={isPrinting}
                    >
                      3 Vias
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Comanda será enviada para impressora térmica Elgin
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              {getActionButtons()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};