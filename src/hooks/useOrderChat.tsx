// ✅ FASE 2: HOOK DE CHAT OTIMIZADO

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

  // ✅ FASE 2: useCallback com dependências corretas (SEM toast)
  const fetchMessages = useCallback(async (signal?: AbortSignal) => {
    try {
      const { data, error } = await supabase
        .from('order_messages')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .abortSignal(signal as any); // ✅ FASE 2: AbortController support

      if (error) throw error;
      
      if (!signal?.aborted) {
        setMessages((data || []) as OrderMessage[]);

        // Contar não lidas de clientes
        const unread = (data || []).filter(
          m => m.sender_type === 'customer' && !m.is_read
        ).length;
        setUnreadCount(unread);
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || signal?.aborted) {
        console.log('[CHAT] Fetch aborted');
        return;
      }
      // Só mostrar toast se for um erro real e não abort
      if (error.code !== 'PGRST116' && error.message !== 'signal is aborted without reason') {
        console.error('Erro ao buscar mensagens:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as mensagens.',
          variant: 'destructive',
        });
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [orderId]); // ✅ FASE 2: Apenas orderId nas dependências

  // ✅ FASE 2: Setup com AbortController
  useEffect(() => {
    if (!orderId) {
      setMessages([]);
      setLoading(false);
      setUnreadCount(0);
      return;
    }

    // ✅ FASE 2: AbortController para cancelar fetches pendentes
    const abortController = new AbortController();
    let isMounted = true;
    
    // Buscar mensagens iniciais
    if (isMounted) {
      fetchMessages(abortController.signal);
    }

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
              
              // Tentar tocar som de notificação
              const audio = new Audio('/bell.mp3');
              audio.play().catch(() => console.log('Não foi possível tocar som'));
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

    // ✅ FASE 2: Cleanup robusto com AbortController
    return () => {
      console.log(`[CHAT] Cleaning up channel for order ${orderId}`);
      isMounted = false;
      abortController.abort(); // Cancelar fetch pendente
      if (channelRef) {
        supabase.removeChannel(channelRef);
        channelRef = null;
      }
    };
  }, [orderId, fetchMessages]); // ✅ FASE 2: fetchMessages agora é estável

  // ✅ Enviar mensagem com optimistic update
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

      // Optimistic update
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

        // Substituir mensagem temporária pela real
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? (data as OrderMessage) : m))
        );
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        
        // Rollback
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
    refreshMessages: () => fetchMessages(), // ✅ FASE 2: Wrapper sem signal
  };
};
