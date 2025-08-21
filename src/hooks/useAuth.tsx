import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in:', session.user.email);
          // Não fazer redirecionamento automático aqui
          // Deixar os componentes de rota cuidarem disso
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
        
        if (mounted) {
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: userData.name,
            phone: userData.phone,
            cpf: userData.cpf
          }
        }
      });

      if (error) throw error;

      // If the user was created with success, create additional data
      if (data.user && !error) {
        // Create address if provided
        if (userData.address) {
          const { error: addressError } = await supabase
            .from('addresses')
            .insert({
              user_id: data.user.id,
              street: userData.address.street,
              number: userData.address.number,
              complement: userData.address.complement || null,
              neighborhood: userData.address.neighborhood,
              zip_code: userData.address.zipCode,
              reference_point: userData.address.reference || null,
              is_default: true
            });

          if (addressError) {
            console.error('Error creating address:', addressError);
          }
        }

        // Create initial subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert({
            user_id: data.user.id,
            status: 'pending',
            plan_name: 'Mensal',
            plan_price: 9.90
          });

        if (subscriptionError) {
          console.error('Error creating subscription:', subscriptionError);
        }
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      });
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verificar se é admin e redirecionar após login bem-sucedido
      if (data.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile?.role === 'admin') {
            // Admin vai para dashboard admin
            setTimeout(() => {
              window.location.href = '/admin';
            }, 100);
          } else {
            // Usuário regular vai para dashboard
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 100);
          }
        } catch (roleError) {
          console.error('Error checking role:', roleError);
          // Se não conseguir verificar o role, vai para dashboard
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 100);
        }
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      });
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Verificar se há uma sessão ativa antes de tentar fazer logout
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Se não há sessão, apenas limpar o estado local
        console.log('No active session found, clearing local state');
        setSession(null);
        setUser(null);
        
        toast({
          title: "Logout realizado com sucesso!",
          description: "Até a próxima!",
        });
        return;
      }

      // Só fazer logout se há uma sessão ativa
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        // Se o erro for de sessão não encontrada, ignorar e limpar estado local
        if (error.message.includes('session') || error.message.includes('Session')) {
          console.log('Session already invalid, clearing local state');
          setSession(null);
          setUser(null);
          
          toast({
            title: "Logout realizado com sucesso!",
            description: "Até a próxima!",
          });
          return;
        }
        throw error;
      }
      
      toast({
        title: "Logout realizado com sucesso!",
        description: "Até a próxima!",
      });
    } catch (error: any) {
      console.error('Sign out error:', error);
      
      // Mesmo com erro, limpar estado local para garantir logout
      setSession(null);
      setUser(null);
      
      toast({
        title: "Logout realizado",
        description: "Sessão encerrada.",
      });
    }
  };

  const updateProfile = async (data: any) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};