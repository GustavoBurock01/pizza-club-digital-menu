// ===== PAINEL UNIFICADO DE ATENDENTE - PADRÃO WABIZ =====

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { WABizHeader } from "@/components/WABizHeader";
import { WABizOrdersTable } from "@/components/WABizOrdersTable";
import { WABizOrderDetails } from "@/components/WABizOrderDetails";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useAttendant } from "@/providers/AttendantProvider";
import { useThermalPrint } from "@/hooks/useThermalPrint";
import { toast } from "sonner";
import { Printer } from "lucide-react";

export default function AttendantUnified() {
  const { 
    stats, 
    orders, 
    loading, 
    isUpdating, 
    refreshData,
    confirmOrder,
    startPreparation,
    markReady,
    markDelivered,
    cancelOrder 
  } = useAttendant();

  const { printOrder, isPrinting } = useThermalPrint();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('novos');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toast.info(soundEnabled ? "Sons desabilitados" : "Sons habilitados");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  // Filtrar pedidos com base na busca
  const filteredOrders = orders?.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);
    return matchesSearch;
  }) || [];

  // Separar pedidos por categoria seguindo padrão WABiz
  const novosOrders = filteredOrders.filter(o => o.status === 'pending');
  const emAndamentoOrders = filteredOrders.filter(o => ['confirmed', 'preparing'].includes(o.status));
  const finalizadosOrders = filteredOrders.filter(o => ['ready', 'delivering', 'delivered'].includes(o.status));

  // Ações do modal
  const handleOrderAction = async (action: string, orderId: string) => {
    try {
      switch (action) {
        case 'confirm':
          await confirmOrder(orderId);
          break;
        case 'startPreparation':
          await startPreparation(orderId);
          break;
        case 'markReady':
          await markReady(orderId);
          break;
        case 'markDelivered':
          await markDelivered(orderId);
          break;
        case 'cancel':
          await cancelOrder(orderId);
          break;
        case 'print':
          await printOrder(orderId);
          toast.success('Pedido enviado para impressão');
          break;
      }
      handleCloseDetails();
    } catch (error) {
      console.error('Erro ao executar ação:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header WABiz */}
      <WABizHeader
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onRefresh={refreshData}
        onSearch={handleSearch}
        notificationCount={stats?.pendingOrders || 0}
      />

      {/* Conteúdo Principal */}
      <div className="p-6">
        {/* Navegação por Abas - Estilo WABiz */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 shadow-sm">
              <TabsTrigger 
                value="novos" 
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white font-medium"
              >
                NOVOS ({novosOrders.length})
              </TabsTrigger>
              <TabsTrigger 
                value="em-andamento"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-medium"
              >
                EM ANDAMENTO ({emAndamentoOrders.length})
              </TabsTrigger>
              <TabsTrigger 
                value="finalizados"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white font-medium"
              >
                FINALIZADOS ({finalizadosOrders.length})
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo das Abas */}
            <TabsContent value="novos" className="mt-6">
              <WABizOrdersTable
                orders={novosOrders}
                onViewDetails={handleViewDetails}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="em-andamento" className="mt-6">
              <WABizOrdersTable
                orders={emAndamentoOrders}
                onViewDetails={handleViewDetails}
                loading={loading}
              />
            </TabsContent>

            <TabsContent value="finalizados" className="mt-6">
              <WABizOrdersTable
                orders={finalizadosOrders}
                onViewDetails={handleViewDetails}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOrderAction('print', selectedOrder.id)}
            disabled={isPrinting}
            className="shadow-lg"
          >
            <Printer className="h-4 w-4 mr-2" />
            {isPrinting ? 'Imprimindo...' : 'Reimprimir'}
          </Button>
        </div>
      )}
      
      <WABizOrderDetails
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={handleCloseDetails}
        onConfirm={() => handleOrderAction('confirm', selectedOrder?.id)}
        onStartPreparation={() => handleOrderAction('startPreparation', selectedOrder?.id)}
        onMarkReady={() => handleOrderAction('markReady', selectedOrder?.id)}
        onMarkDelivered={() => handleOrderAction('markDelivered', selectedOrder?.id)}
        onCancel={() => handleOrderAction('cancel', selectedOrder?.id)}
        isUpdating={isUpdating}
      />
    </div>
  );
}