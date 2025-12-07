import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PrintLayoutConfig } from './PrintLayoutEditor';

interface PrintPreviewLiveProps {
  layout: PrintLayoutConfig;
  paperWidth?: 58 | 80;
  className?: string;
}

// Mock data for preview
const mockOrder = {
  orderNumber: '123456',
  date: new Date().toLocaleString('pt-BR'),
  customerName: 'João Silva',
  customerPhone: '(11) 99999-9999',
  customerEmail: 'joao@email.com',
  customerCpf: '123.456.789-00',
  address: {
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
  },
  items: [
    { qty: 2, name: 'Pizza Margherita', price: 45.90, obs: 'Sem cebola' },
    { qty: 1, name: 'Coca-Cola 2L', price: 12.00 },
    { qty: 1, name: 'Sobremesa Brownie', price: 15.00 },
  ],
  subtotal: 118.80,
  deliveryFee: 8.00,
  discount: 10.00,
  total: 116.80,
  paymentMethod: 'PIX',
  notes: 'Tocar campainha 2x',
};

const storeInfo = {
  name: 'Pizzaria do João',
  phone: '(11) 3333-4444',
  address: 'Av. Principal, 500 - Centro',
};

export function PrintPreviewLive({
  layout,
  paperWidth = 58,
  className,
}: PrintPreviewLiveProps) {
  const fontSizeClass = useMemo(() => {
    switch (layout.font_size) {
      case 'small': return 'text-[10px]';
      case 'large': return 'text-[14px]';
      default: return 'text-xs';
    }
  }, [layout.font_size]);

  const lineHeightStyle = useMemo(() => ({
    lineHeight: `${1.2 + layout.line_spacing * 0.1}`,
  }), [layout.line_spacing]);

  const widthClass = paperWidth === 58 ? 'w-[200px]' : 'w-[280px]';

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <Badge variant="outline" className="mb-2">
        Papel {paperWidth}mm
      </Badge>
      
      <Card 
        className={cn(
          "bg-white p-3 font-mono shadow-lg overflow-hidden",
          widthClass,
          fontSizeClass
        )}
        style={lineHeightStyle}
      >
        {/* Header */}
        <div className="text-center space-y-0.5">
          {layout.show_logo && (
            <div className="h-8 bg-muted rounded flex items-center justify-center text-muted-foreground text-[8px] mb-1">
              [LOGO]
            </div>
          )}
          {layout.show_store_name && (
            <p className="font-bold text-sm">{storeInfo.name}</p>
          )}
          {layout.show_store_phone && (
            <p>{storeInfo.phone}</p>
          )}
          {layout.show_store_address && (
            <p className="text-muted-foreground">{storeInfo.address}</p>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Order Info */}
        <div className="text-center">
          <p className="font-bold">PEDIDO #{mockOrder.orderNumber}</p>
          <p className="text-muted-foreground">{mockOrder.date}</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Customer */}
        <div>
          <p className="font-bold">CLIENTE:</p>
          <p>{mockOrder.customerName}</p>
          <p>{mockOrder.customerPhone}</p>
          {layout.show_customer_email && (
            <p className="text-muted-foreground break-all">{mockOrder.customerEmail}</p>
          )}
          {layout.show_customer_cpf && (
            <p>CPF: {mockOrder.customerCpf}</p>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Delivery Address */}
        <div>
          <p className="font-bold">ENTREGA:</p>
          <p>{mockOrder.address.street}, {mockOrder.address.number}</p>
          <p>{mockOrder.address.neighborhood}</p>
          <p>{mockOrder.address.city}</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Items */}
        <div>
          <p className="font-bold">ITENS:</p>
          <div className="space-y-1 mt-1">
            {mockOrder.items.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between">
                  <span>{item.qty}x {item.name}</span>
                  <span>R$ {item.price.toFixed(2)}</span>
                </div>
                {item.obs && (
                  <p className="text-muted-foreground pl-3">↳ {item.obs}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Totals */}
        <div className="space-y-0.5">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>R$ {mockOrder.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxa entrega:</span>
            <span>R$ {mockOrder.deliveryFee.toFixed(2)}</span>
          </div>
          {mockOrder.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto:</span>
              <span>-R$ {mockOrder.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm pt-1">
            <span>TOTAL:</span>
            <span>R$ {mockOrder.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Payment */}
        <div className="flex justify-between">
          <span>Pagamento:</span>
          <span className="font-bold">{mockOrder.paymentMethod}</span>
        </div>

        {/* Notes */}
        {mockOrder.notes && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            <div>
              <p className="font-bold">OBS:</p>
              <p>{mockOrder.notes}</p>
            </div>
          </>
        )}

        {/* Footer */}
        {layout.footer_message && (
          <>
            <div className="border-t border-dashed border-black my-2" />
            <p className="text-center text-muted-foreground">
              {layout.footer_message}
            </p>
          </>
        )}

        {/* Cut indicator */}
        <div className="mt-4 border-t-2 border-dashed border-muted-foreground/30 pt-2">
          <p className="text-center text-muted-foreground text-[8px]">✂ CORTE</p>
        </div>
      </Card>
    </div>
  );
}
