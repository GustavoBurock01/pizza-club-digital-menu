import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AuthLayout } from './AuthLayout';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { FormattedInput } from './FormattedInput';
import { PasswordInput } from './PasswordInput';
import { validateCEPWithAPI, CEPData } from '@/utils/cepValidation';
import { validateCPF, validateEmail, validatePhone } from '@/utils/validation';
import { toast } from 'sonner';
interface RegisterFormProps {
  onToggleToLogin: () => void;
}
export const RegisterForm = ({
  onToggleToLogin
}: RegisterFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCEP, setIsValidatingCEP] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
    password: '',
    confirmPassword: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      reference: '',
      zipCode: ''
    }
  });
  const {
    signUp
  } = useAuth();
  const navigate = useNavigate();
  const validateCurrentStep = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (currentStep === 1) {
      if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
      if (!validateEmail(formData.email)) errors.email = 'Email inválido';
      if (!validatePhone(formData.phone)) errors.phone = 'Telefone inválido';
      if (!validateCPF(formData.cpf)) errors.cpf = 'CPF inválido';
    } else if (currentStep === 2) {
      if (!formData.address.zipCode) errors.zipCode = 'CEP é obrigatório';
      if (!formData.address.street.trim()) errors.street = 'Rua é obrigatória';
      if (!formData.address.number.trim()) errors.number = 'Número é obrigatório';
      if (!formData.address.neighborhood.trim()) errors.neighborhood = 'Bairro é obrigatório';
    } else if (currentStep === 3) {
      if (!formData.password) errors.password = 'Senha é obrigatória';
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'As senhas não coincidem';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCEPValidation = async (cep: string) => {
    if (cep.replace(/\D/g, '').length === 8) {
      setIsValidatingCEP(true);
      const cepData = await validateCEPWithAPI(cep);
      setIsValidatingCEP(false);
      
      if (cepData) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            zipCode: cep,
            street: cepData.logradouro || prev.address.street,
            neighborhood: cepData.bairro || prev.address.neighborhood
          }
        }));
        toast.success('CEP válido! Dados preenchidos automaticamente.');
      } else {
        toast.error('CEP não encontrado. Verifique e tente novamente.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
      toast.error('Por favor, corrija os erros antes de continuar.');
      return;
    }
    
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      setIsLoading(true);
      try {
        await signUp(formData.email, formData.password, formData);
        toast.success('Conta criada com sucesso!');
        navigate('/dashboard');
      } catch (error: any) {
        console.error('Registration error:', error);
        toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  const renderStep1 = () => <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo <span className="text-destructive">*</span></Label>
        <Input 
          id="name" 
          placeholder="Seu nome completo" 
          value={formData.name} 
          onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} 
          required 
          disabled={isLoading}
          className={validationErrors.name ? 'border-destructive' : ''}
        />
        {validationErrors.name && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {validationErrors.name}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail <span className="text-destructive">*</span></Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="seu@email.com" 
          value={formData.email} 
          onChange={e => setFormData({
            ...formData,
            email: e.target.value
          })} 
          required 
          disabled={isLoading}
          className={validationErrors.email ? 'border-destructive' : ''}
        />
        {validationErrors.email && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {validationErrors.email}
          </p>
        )}
      </div>

      <FormattedInput
        id="phone"
        label="Telefone"
        type="phone"
        value={formData.phone}
        onChange={(value) => setFormData({
          ...formData,
          phone: value
        })}
        placeholder="(11) 99999-9999"
        required
        disabled={isLoading}
      />

      <FormattedInput
        id="cpf"
        label="CPF"
        type="cpf"
        value={formData.cpf}
        onChange={(value) => setFormData({
          ...formData,
          cpf: value
        })}
        placeholder="000.000.000-00"
        required
        disabled={isLoading}
      />
    </>;
  const renderStep2 = () => <>
      <div className="space-y-2">
        <Label htmlFor="street">Rua</Label>
        <Input id="street" placeholder="Nome da rua" value={formData.address.street} onChange={e => setFormData({
        ...formData,
        address: {
          ...formData.address,
          street: e.target.value
        }
      })} required disabled={isLoading} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input id="number" placeholder="123" value={formData.address.number} onChange={e => setFormData({
          ...formData,
          address: {
            ...formData.address,
            number: e.target.value
          }
        })} required disabled={isLoading} />
        </div>

        <div className="space-y-2">
          <FormattedInput
            id="zipCode"
            label="CEP"
            type="cep"
            value={formData.address.zipCode}
            onChange={(value) => {
              setFormData({
                ...formData,
                address: {
                  ...formData.address,
                  zipCode: value
                }
              });
              handleCEPValidation(value);
            }}
            placeholder="12345-678"
            required
            disabled={isLoading || isValidatingCEP}
          />
          {isValidatingCEP && (
            <p className="text-sm text-muted-foreground">Validando CEP...</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input id="neighborhood" placeholder="Nome do bairro" value={formData.address.neighborhood} onChange={e => setFormData({
        ...formData,
        address: {
          ...formData.address,
          neighborhood: e.target.value
        }
      })} required disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="complement">Complemento</Label>
        <Input id="complement" placeholder="Apt, casa, etc. (opcional)" value={formData.address.complement} onChange={e => setFormData({
        ...formData,
        address: {
          ...formData.address,
          complement: e.target.value
        }
      })} disabled={isLoading} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Ponto de referência</Label>
        <Input id="reference" placeholder="Próximo ao mercado... (opcional)" value={formData.address.reference} onChange={e => setFormData({
        ...formData,
        address: {
          ...formData.address,
          reference: e.target.value
        }
      })} disabled={isLoading} />
      </div>
    </>;
  const renderStep3 = () => <>
      <PasswordInput
        id="password"
        label="Senha"
        value={formData.password}
        onChange={(value) => setFormData({
          ...formData,
          password: value
        })}
        placeholder="Crie uma senha segura"
        required
        disabled={isLoading}
        showStrengthIndicator={true}
      />

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha <span className="text-destructive">*</span></Label>
        <Input 
          id="confirmPassword" 
          type="password" 
          placeholder="Digite a senha novamente" 
          value={formData.confirmPassword} 
          onChange={e => setFormData({
            ...formData,
            confirmPassword: e.target.value
          })} 
          required 
          disabled={isLoading}
          className={validationErrors.confirmPassword ? 'border-destructive' : ''}
        />
        {validationErrors.confirmPassword && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>
    </>;
  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Dados pessoais";
      case 2:
        return "Endereço de entrega";
      case 3:
        return "Senha e pagamento";
      default:
        return "Criar conta";
    }
  };
  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Precisamos de alguns dados básicos";
      case 2:
        return "Para entregas rápidas e precisas";
      case 3:
        return "Finalize seu cadastro";
      default:
        return "Preencha os dados para criar sua conta";
    }
  };
  return <AuthLayout title={getStepTitle()} description={getStepDescription()} showToggle={currentStep === 1} toggleText="Já tem conta? Fazer login" onToggle={onToggleToLogin}>
      <div className="mb-4">
        <div className="flex space-x-2">
          {[1, 2, 3].map(step => <div key={step} className={`h-2 flex-1 rounded-full ${step <= currentStep ? 'gradient-pizza' : 'bg-gray-200'}`} />)}
        </div>
        <p className="text-sm text-muted-foreground text-center mt-2">
          Passo {currentStep} de 3
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="flex gap-2">
          {currentStep > 1 && <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="flex-1" disabled={isLoading}>
              Voltar
            </Button>}
          <Button type="submit" className="flex-1 gradient-pizza text-white border-0" disabled={isLoading}>
            {isLoading ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </> : currentStep === 3 ? 'Criar conta' : 'Continuar'}
          </Button>
        </div>
      </form>
    </AuthLayout>;
};