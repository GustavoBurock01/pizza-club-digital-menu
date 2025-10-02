// ===== PAINEL UNIFICADO DE ATENDENTE - PADRÃO WABIZ =====

import { useState, useEffect, useRef } from "react";
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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousPendingCount = useRef(0);

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
  
  // Tocar som quando novo pedido chega
  useEffect(() => {
    const currentPending = novosOrders.length;
    
    if (soundEnabled && currentPending > previousPendingCount.current && previousPendingCount.current > 0) {
      audioRef.current?.play().catch(err => console.log('Audio play failed:', err));
      toast.info("🔔 Novo pedido recebido!");
    }
    
    previousPendingCount.current = currentPending;
  }, [novosOrders.length, soundEnabled]);
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
    <>
      <audio 
        ref={audioRef} 
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCp+zPDTgjMGHm7A7+OZQQ4YcLvv56RXFAg8munxy3goBSl6yvDWhzYHIHK/7+CTQhEadr3w55pMEBBOouTvwmkbBDeJ0fHJdygFKHvK79qOPAYdbbvu5aFRDwg5l+LxyXUkBSl5yvHaijYGH3K97+OYPQwZcrjv6Z9PEQ5LpeTwvWskBChzyO/ajDkHIXG87eKTRBEYdbnw6Z9OEAc9mOLxxxwABSJzzO7ekT4IBSBwtO/om0sRDkqn5fC9ayMEJnXI7+KOOwUjb77u5JxJEBdIp+Tvxm8kBSlyyO7dkDwHImyw7+KUQQ0Yabnv6p5MDg1Fo+TvwmkeBSRyyO/ekj0HImyw7uOYQA4YaLfv5ptLDww8nOHwvW0hBSlxyO/ckDsHImyw7+OXPwsYaLfv5ptLDww9nOHwvm0hBShwyO/ckzsHImyw7uOYQA0XaLfv5ptLDww9nOHwvm0hBSlxyO/ckzsHImyw7uOYQA0XaLfv5ZtLDww9nOHwv20hBSlxyO/ckzsHImyw7uOYQA0XaLfv5ZtKDws9nOHwvm0hBSlxyO/dlDsHIGyw7+OYPwwYaLfv5ZpLDgw9nOHwvm0hBSlxyO/dlDsHIGyw7+OYPwwYaLfv5ZpLDgw9nOHwvm0hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZtLDww9nOHwvm0hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwvm0hBShxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDws9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLDww9nOHwv20hBSlxyO/dlDsHIGyw7uOYQA0XaLfv5ZpLD" 
        preload="auto" 
      />
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
    </>
  );
}