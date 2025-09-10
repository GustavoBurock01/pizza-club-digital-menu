import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function DeliveryIntegrations() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">iFood</h3>
          <Badge variant="secondary">Configurar</Badge>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">Uber Eats</h3>
          <Badge variant="secondary">Configurar</Badge>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">Rappi</h3>
          <Badge variant="secondary">Configurar</Badge>
        </div>
      </div>
    </div>
  );
}