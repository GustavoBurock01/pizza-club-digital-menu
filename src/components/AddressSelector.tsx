import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MapPin, Plus } from 'lucide-react';
import { useAddresses } from '@/hooks/useAddresses';

interface CustomerData {
  name: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
}

interface AddressSelectorProps {
  customerData: CustomerData;
  onCustomerDataChange: (field: keyof CustomerData, value: string) => void;
  selectedAddressId: string | null;
  onAddressSelect: (addressId: string | null) => void;
}

export const AddressSelector = ({ 
  customerData, 
  onCustomerDataChange, 
  selectedAddressId, 
  onAddressSelect 
}: AddressSelectorProps) => {
  const { addresses, loading } = useAddresses();
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  useEffect(() => {
    if (!loading && addresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [addresses.length, loading]);

  const handleAddressSelection = (value: string) => {
    if (value === 'new') {
      setShowNewAddressForm(true);
      onAddressSelect(null);
    } else {
      setShowNewAddressForm(false);
      onAddressSelect(value);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados para Entrega</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
          <div>
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={customerData.name}
              onChange={(e) => onCustomerDataChange('name', e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={customerData.phone}
              onChange={(e) => onCustomerDataChange('phone', e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        {/* Address Selection */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : addresses.length > 0 ? (
          <div className="space-y-4">
            <Label>Endereço de Entrega</Label>
            <RadioGroup 
              value={selectedAddressId || (showNewAddressForm ? 'new' : '')} 
              onValueChange={handleAddressSelection}
            >
              {addresses.map((address) => (
                <div key={address.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={address.id} id={address.id} />
                  <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <p className="font-medium">
                          {address.street}, {address.number}
                        </p>
                        {address.complement && (
                          <p className="text-sm text-muted-foreground">
                            {address.complement}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {address.neighborhood}, {address.city} - {address.state}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="flex items-center gap-2 cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Usar outro endereço
                </Label>
              </div>
            </RadioGroup>
          </div>
        ) : (
          <div>
            <Label>Endereço de Entrega</Label>
            <p className="text-sm text-muted-foreground mb-4">Você ainda não tem endereços salvos</p>
          </div>
        )}

        {/* New Address Form */}
        {(showNewAddressForm || addresses.length === 0) && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="street">Rua *</Label>
                <Input
                  id="street"
                  value={customerData.street}
                  onChange={(e) => onCustomerDataChange('street', e.target.value)}
                  placeholder="Nome da rua"
                />
              </div>
              <div>
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={customerData.number}
                  onChange={(e) => onCustomerDataChange('number', e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neighborhood">Bairro *</Label>
                <Input
                  id="neighborhood"
                  value={customerData.neighborhood}
                  onChange={(e) => onCustomerDataChange('neighborhood', e.target.value)}
                  placeholder="Nome do bairro"
                />
              </div>
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={customerData.complement}
                  onChange={(e) => onCustomerDataChange('complement', e.target.value)}
                  placeholder="Apto, casa, etc."
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};