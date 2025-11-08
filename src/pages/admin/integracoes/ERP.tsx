import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Database, RefreshCw } from 'lucide-react';

export default function ERP() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Integrações ERP
              </CardTitle>
              <CardDescription>
                Configure integrações com sistemas de gestão empresarial
              </CardDescription>
            </div>
            <Badge variant="secondary">Em Desenvolvimento</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Em breve você poderá integrar seu sistema com ERPs populares como:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
            <li>Integração com sistemas de gestão de estoque</li>
            <li>Sincronização automática de produtos e preços</li>
            <li>Exportação de pedidos e relatórios fiscais</li>
            <li>Controle financeiro integrado</li>
          </ul>
          <div className="pt-4">
            <Button variant="outline" disabled>
              <Settings className="h-4 w-4 mr-2" />
              Configurar Integração
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
