import { useState, useEffect, useCallback } from 'react';
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
    fetchMessages();

    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_messages',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const newMessage = payload.new as OrderMessage;
          setMessages((prev) => [...prev, newMessage]);

          // Aumentar contador se for mensagem do cliente
          if (newMessage.sender_type === 'customer' && !newMessage.is_read) {
            setUnreadCount((prev) => prev + 1);
          }

          // Som de notificação
          if (newMessage.sender_type === 'customer') {
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, fetchMessages]);

  // Enviar mensagem
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setSending(true);
      try {
        const { error } = await supabase.from('order_messages').insert({
          order_id: orderId,
          sender_type: 'attendant',
          message: message.trim(),
          message_type: 'text',
        });

        if (error) throw error;
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
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
