import { PlaceholderFeature } from '@/components/admin/PlaceholderFeature';

export default function Integracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Integrações do App</h2>
        <p className="text-muted-foreground">
          Configure integrações com serviços externos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlaceholderFeature
          title="WhatsApp Business"
          description="Integre com WhatsApp para notificações e atendimento"
        />
        <PlaceholderFeature
          title="Notificações Push"
          description="Configure notificações em tempo real"
        />
        <PlaceholderFeature
          title="APIs de Delivery"
          description="Integre com iFood, Rappi e outros"
        />
        <PlaceholderFeature
          title="Google Maps"
          description="Rastreamento de entregas em tempo real"
        />
      </div>
    </div>
  );
}
