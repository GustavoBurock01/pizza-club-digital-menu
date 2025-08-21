
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  complement?: string;
  reference_point?: string;
  is_default: boolean;
}

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryZones, setDeliveryZones] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchDeliveryZones();
    }
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar endereços",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryZones = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_zones')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setDeliveryZones(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar zonas de entrega:', error);
    }
  };

  const addAddress = async (addressData: Omit<Address, 'id'>) => {
    try {
      // If this is the first address or marked as default, update others
      if (addressData.is_default || addresses.length === 0) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user?.id);
      }

      const { data, error } = await supabase
        .from('addresses')
        .insert([{ ...addressData, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;
      
      setAddresses(prev => [...prev, data]);
      toast({
        title: "Endereço adicionado",
        description: "Endereço salvo com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar endereço",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateAddress = async (id: string, addressData: Partial<Address>) => {
    try {
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user?.id);
      }

      const { data, error } = await supabase
        .from('addresses')
        .update(addressData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setAddresses(prev => prev.map(addr => addr.id === id ? data : addr));
      toast({
        title: "Endereço atualizado",
        description: "Endereço salvo com sucesso!",
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar endereço",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteAddress = async (id: string) => {
    try {
      // Primeiro verificar se o endereço está sendo usado em pedidos
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('address_id', id)
        .limit(1);

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        toast({
          title: "Não é possível remover este endereço",
          description: "Este endereço está sendo usado em pedidos existentes e não pode ser removido. Você pode adicionar um novo endereço e defini-lo como padrão.",
          variant: "destructive",
        });
        return;
      }

      // Se não há pedidos associados, proceder com a exclusão
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAddresses(prev => prev.filter(addr => addr.id !== id));
      toast({
        title: "Endereço removido",
        description: "Endereço excluído com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover endereço",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculateDeliveryFee = (neighborhood: string): number => {
    const zone = deliveryZones.find(
      z => z.neighborhood.toLowerCase() === neighborhood.toLowerCase()
    );
    return zone ? Number(zone.delivery_fee) : 8.00; // Taxa padrão
  };

  const getDefaultAddress = () => {
    return addresses.find(addr => addr.is_default) || addresses[0];
  };

  return {
    addresses,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    calculateDeliveryFee,
    getDefaultAddress,
    refetch: fetchAddresses,
  };
};
