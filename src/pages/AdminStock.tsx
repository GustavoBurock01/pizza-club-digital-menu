import { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StockDashboard } from "@/components/StockDashboard";
import { StockAdjustments } from "@/components/StockAdjustments";
import { StockAlerts } from "@/components/StockAlerts";
import { StockHistory } from "@/components/StockHistory";
import { Package, AlertTriangle, History, Settings } from "lucide-react";

export default function AdminStock() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        
        <main className="flex-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Gestão de Estoque</h1>
              <p className="text-muted-foreground">
                Controle e monitore o estoque dos produtos em tempo real
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="adjustments" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Ajustes
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <StockDashboard />
            </TabsContent>

            <TabsContent value="adjustments" className="space-y-4">
              <StockAdjustments />
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <StockAlerts />
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <StockHistory />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}