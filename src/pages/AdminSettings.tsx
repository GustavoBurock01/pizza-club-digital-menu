import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StoreControl } from '@/components/StoreControl';
import { Settings, Store } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie as configurações do sistema
        </p>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList>
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Loja
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="mt-6">
          <StoreControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}
