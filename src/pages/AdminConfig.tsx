// ===== PÁGINA DE CONFIGURAÇÕES DO ADMIN =====

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDeliveryZones } from "@/components/AdminDeliveryZones";
import { AdminProductExtras } from "@/components/AdminProductExtras";
import { AdminProductCrusts } from "@/components/AdminProductCrusts";
import { Settings } from "lucide-react";

export default function AdminConfig() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Configurações do Sistema</h1>
            </div>
          </header>

          <div className="flex-1 p-6 bg-gray-50">
            <Tabs defaultValue="delivery" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="delivery">Áreas de Entrega</TabsTrigger>
                <TabsTrigger value="extras">Adicionais</TabsTrigger>
                <TabsTrigger value="crusts">Bordas Recheadas</TabsTrigger>
              </TabsList>

              <TabsContent value="delivery">
                <AdminDeliveryZones />
              </TabsContent>

              <TabsContent value="extras">
                <AdminProductExtras />
              </TabsContent>

              <TabsContent value="crusts">
                <AdminProductCrusts />
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
