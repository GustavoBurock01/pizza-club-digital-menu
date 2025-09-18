
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthLayout } from './AuthLayout';
import { Eye, EyeOff, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logLoginAttempt, logAccountBlock, logPasswordReset } from '@/utils/securityLogger';

interface LoginFormProps {
  onToggleToRegister: () => void;
}

export const LoginForm = ({ onToggleToRegister }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);
  
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Rate limiting: máximo 5 tentativas em 15 minutos
  const MAX_ATTEMPTS = 5;
  const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutos em ms

  // Verificar se usuário está bloqueado ao carregar componente
  useEffect(() => {
    const checkBlockStatus = () => {
      const blockData = localStorage.getItem('login_block');
      if (blockData) {
        const { timestamp, attempts } = JSON.parse(blockData);
        const timeElapsed = Date.now() - timestamp;
        
        if (timeElapsed < BLOCK_DURATION && attempts >= MAX_ATTEMPTS) {
          setIsBlocked(true);
          setAttemptCount(attempts);
          setBlockTimeLeft(Math.ceil((BLOCK_DURATION - timeElapsed) / 1000 / 60));
        } else if (timeElapsed >= BLOCK_DURATION) {
          // Bloquei expirou, limpar dados
          localStorage.removeItem('login_block');
          setAttemptCount(0);
        } else {
          // Ainda dentro da janela, manter contador
          setAttemptCount(attempts);
        }
      }
    };
    
    checkBlockStatus();
    
    // Timer para verificar bloqueio periodicamente
    const interval = setInterval(() => {
      if (isBlocked) {
        const blockData = localStorage.getItem('login_block');
        if (blockData) {
          const { timestamp } = JSON.parse(blockData);
          const newTimeLeft = Math.ceil((BLOCK_DURATION - (Date.now() - timestamp)) / 1000 / 60);
          if (newTimeLeft <= 0) {
            setIsBlocked(false);
            setAttemptCount(0);
            setBlockTimeLeft(0);
            localStorage.removeItem('login_block');
          } else {
            setBlockTimeLeft(newTimeLeft);
          }
        }
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isBlocked, BLOCK_DURATION]);

  const logSecurityEvent = (action: string, details: any = {}) => {
    console.log(`[SECURITY] ${action}:`, {
      timestamp: new Date().toISOString(),
      email: formData.email,
      userAgent: navigator.userAgent,
      ...details
    });
  };

  const handleFailedAttempt = async (errorMessage: string) => {
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);
    
    // Log da tentativa falhada usando sistema estruturado
    await logLoginAttempt(formData.email, false, errorMessage);
    
    // Salvar no localStorage
    localStorage.setItem('login_block', JSON.stringify({
      timestamp: Date.now(),
      attempts: newAttemptCount
    }));
    
    if (newAttemptCount >= MAX_ATTEMPTS) {
      setIsBlocked(true);
      setBlockTimeLeft(15);
      setErrorMessage(`Muitas tentativas falhadas. Tente novamente em 15 minutos.`);
      
      await logAccountBlock(formData.email, newAttemptCount);
      
      toast({
        title: "Conta temporariamente bloqueada",
        description: "Muitas tentativas falhadas. Tente novamente em 15 minutos.",
        variant: "destructive",
      });
    } else {
      const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;
      setErrorMessage(`${errorMessage}. ${remainingAttempts} tentativa(s) restante(s).`);
    }
  };

  const getErrorMessage = (error: any): string => {
    const errorMsg = error?.message || '';
    
    // Mapear erros comuns para mensagens amigáveis
    if (errorMsg.includes('Invalid login credentials')) {
      return 'Email ou senha incorretos';
    }
    if (errorMsg.includes('Email not confirmed')) {
      return 'Confirme seu email antes de fazer login';
    }
    if (errorMsg.includes('Too many requests')) {
      return 'Muitas tentativas. Aguarde um momento';
    }
    if (errorMsg.includes('Network')) {
      return 'Erro de conexão. Verifique sua internet';
    }
    
    return 'Erro no login. Tente novamente';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      toast({
        title: "Acesso temporariamente bloqueado",
        description: `Aguarde ${blockTimeLeft} minuto(s) para tentar novamente.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      logSecurityEvent('LOGIN_ATTEMPT_STARTED');
      
      await signIn(formData.email, formData.password);
      
      // Login bem-sucedido - limpar histórico de tentativas
      localStorage.removeItem('login_block');
      setAttemptCount(0);
      
      logSecurityEvent('LOGIN_SUCCESS');
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const friendlyErrorMessage = getErrorMessage(error);
      handleFailedAttempt(friendlyErrorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Email necessário",
        description: "Digite seu email no campo acima para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      logSecurityEvent('PASSWORD_RESET_REQUESTED', { email: formData.email });

      toast({
        title: "Email de recuperação enviado!",
        description: "Verifique sua caixa de entrada e spam.",
      });
      
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Erro ao enviar email",
        description: "Verifique se o email está correto e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Entrar na sua conta"
      description="Digite seus dados para acessar o cardápio exclusivo"
      showToggle
      toggleText="Não tem conta? Criar nova conta"
      onToggle={onToggleToRegister}
    >
      {/* Alertas de Segurança */}
      {isBlocked && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Acesso temporariamente bloqueado</strong><br />
            Muitas tentativas falhadas. Aguarde {blockTimeLeft} minuto(s) para tentar novamente.
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && !isBlocked && (
        <Alert className="mb-4 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      {attemptCount > 0 && attemptCount < MAX_ATTEMPTS && !isBlocked && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Atenção:</strong> {attemptCount} de {MAX_ATTEMPTS} tentativas utilizadas.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full gradient-pizza text-white border-0"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>

        <Button 
          variant="link" 
          className="w-full text-sm" 
          disabled={isLoading || isBlocked}
          onClick={() => handleForgotPassword()}
          type="button"
        >
          Esqueci minha senha
        </Button>
      </form>
    </AuthLayout>
  );
};
