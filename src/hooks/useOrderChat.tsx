import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrderMessage {
  id: string;
  order_id: string;
  sender_id: string | null;
  sender_type: 'customer' | 'attendant' | 'system';
  message: string;
  message_type: 'text' | 'image' | 'document';
  media_url: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export const useOrderChat = (orderId: string) => {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  // Buscar mensagens iniciais
  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as OrderMessage[]);

      // Contar não lidas de clientes
      const unread = (data || []).filter(
        m => m.sender_type === 'customer' && !m.is_read
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as mensagens.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  // Inscrever em mensagens em tempo real
  useEffect(() => {
    if (!orderId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // Buscar mensagens iniciais
    fetchMessages();

    // ✅ ERRO 7 FIX: Gerenciar subscription com cleanup adequado
    let channelRef: any = null;

    const setupChannel = () => {
      console.log(`[CHAT] Setting up channel for order ${orderId}`);
      
      channelRef = supabase
        .channel(`order-messages-${orderId}`, {
          config: {
            broadcast: { self: false },
          },
        })
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`,
          },
          (payload) => {
            console.log('[CHAT] New message received:', payload.new);
            const newMessage = payload.new as OrderMessage;
            
            setMessages((prev) => {
              // Evitar duplicatas
              if (prev.find(m => m.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });

            if (newMessage.sender_type === 'customer' && !newMessage.is_read) {
              setUnreadCount((prev) => prev + 1);
              
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {});
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'order_messages',
            filter: `order_id=eq.${orderId}`,
          },
          (payload) => {
            const updatedMessage = payload.new as OrderMessage;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
            );
          }
        )
        .subscribe((status) => {
          console.log(`[CHAT] Subscription status: ${status}`);
        });
    };

    setupChannel();

    // ✅ Cleanup robusto
    return () => {
      console.log(`[CHAT] Cleaning up channel for order ${orderId}`);
      if (channelRef) {
        supabase.removeChannel(channelRef);
        channelRef = null;
      }
    };
  }, [orderId, fetchMessages]);

  // ✅ ERRO 6 FIX: Enviar mensagem com optimistic update
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: OrderMessage = {
        id: tempId,
        order_id: orderId,
        sender_id: null,
        sender_type: 'attendant',
        message: message.trim(),
        message_type: 'text',
        media_url: null,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // ✅ OPTIMISTIC UPDATE - adicionar mensagem imediatamente
      setMessages((prev) => [...prev, optimisticMessage]);
      setSending(true);

      try {
        const { data, error } = await supabase
          .from('order_messages')
          .insert({
            order_id: orderId,
            sender_type: 'attendant',
            message: message.trim(),
            message_type: 'text',
          })
          .select()
          .single();

        if (error) throw error;

        // ✅ Substituir mensagem temporária pela real
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (data as OrderMessage) : m))
        );
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        
        // ✅ ROLLBACK - remover mensagem em caso de erro
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        
        toast({
          title: 'Erro',
          description: 'Não foi possível enviar a mensagem.',
          variant: 'destructive',
        });
      } finally {
        setSending(false);
      }
    },
    [orderId, toast]
  );

  // Marcar mensagens como lidas
  const markAsRead = useCallback(async () => {
    try {
      const unreadMessages = messages.filter(
        (m) => m.sender_type === 'customer' && !m.is_read
      );

      if (unreadMessages.length === 0) return;

      const { error } = await supabase
        .from('order_messages')
        .update({ is_read: true })
        .in(
          'id',
          unreadMessages.map((m) => m.id)
        );

      if (error) throw error;
      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao marcar como lidas:', error);
    }
  }, [messages]);

  return {
    messages,
    loading,
    sending,
    unreadCount,
    sendMessage,
    markAsRead,
    refreshMessages: fetchMessages,
  };
};
