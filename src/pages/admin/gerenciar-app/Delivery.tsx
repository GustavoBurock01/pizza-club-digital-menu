import { AdminDeliveryZones } from '@/components/AdminDeliveryZones';

export default function Delivery() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestão de Delivery</h2>
        <p className="text-muted-foreground">
          Configure zonas de entrega e taxas
        </p>
      </div>

      <AdminDeliveryZones />
    </div>
  );
}
