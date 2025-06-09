
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AuthLayout } from './AuthLayout';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RegisterFormProps {
  onToggleToLogin: () => void;
}

export const RegisterForm = ({ onToggleToLogin }: RegisterFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else {
      console.log('Register attempt:', formData);
      // Aqui será integrado com Supabase Auth
    }
  };

  const renderStep1 = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          placeholder="Seu nome completo"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          placeholder="(11) 99999-9999"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          placeholder="000.000.000-00"
          value={formData.cpf}
          onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
          required
        />
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="street">Rua</Label>
        <Input
          id="street"
          placeholder="Nome da rua"
          value={formData.address.street}
          onChange={(e) => setFormData({ 
            ...formData, 
            address: { ...formData.address, street: e.target.value }
          })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            placeholder="123"
            value={formData.address.number}
            onChange={(e) => setFormData({ 
              ...formData, 
              address: { ...formData.address, number: e.target.value }
            })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <Input
            id="zipCode"
            placeholder="12345-678"
            value={formData.address.zipCode}
            onChange={(e) => setFormData({ 
              ...formData, 
              address: { ...formData.address, zipCode: e.target.value }
            })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood">Bairro</Label>
        <Input
          id="neighborhood"
          placeholder="Nome do bairro"
          value={formData.address.neighborhood}
          onChange={(e) => setFormData({ 
            ...formData, 
            address: { ...formData.address, neighborhood: e.target.value }
          })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="complement">Complemento</Label>
        <Input
          id="complement"
          placeholder="Apt, casa, etc. (opcional)"
          value={formData.address.complement}
          onChange={(e) => setFormData({ 
            ...formData, 
            address: { ...formData.address, complement: e.target.value }
          })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference">Ponto de referência</Label>
        <Input
          id="reference"
          placeholder="Próximo ao mercado... (opcional)"
          value={formData.address.reference}
          onChange={(e) => setFormData({ 
            ...formData, 
            address: { ...formData.address, reference: e.target.value }
          })}
        />
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Crie uma senha segura"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Digite a senha novamente"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
      </div>

      <Card className="bg-pizza-cream border-pizza-orange/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-pizza-red">🍕 Plano de Assinatura</CardTitle>
          <CardDescription>Acesso total ao cardápio exclusivo</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Primeiro mês:</span>
              <span className="text-pizza-red font-bold">R$ 1,00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">A partir do 2º mês:</span>
              <span className="text-pizza-red font-bold">R$ 9,90/mês</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Cancele quando quiser. Sem fidelidade.
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Dados pessoais";
      case 2: return "Endereço de entrega";
      case 3: return "Senha e pagamento";
      default: return "Criar conta";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1: return "Precisamos de alguns dados básicos";
      case 2: return "Para entregas rápidas e precisas";
      case 3: return "Finalize seu cadastro";
      default: return "Preencha os dados para criar sua conta";
    }
  };

  return (
    <AuthLayout
      title={getStepTitle()}
      description={getStepDescription()}
      showToggle={currentStep === 1}
      toggleText="Já tem conta? Fazer login"
      onToggle={onToggleToLogin}
    >
      <div className="mb-4">
        <div className="flex space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full ${
                step <= currentStep ? 'gradient-pizza' : 'bg-gray-200'
              }`}
            />
          ))}
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
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1"
            >
              Voltar
            </Button>
          )}
          <Button type="submit" className="flex-1 gradient-pizza text-white border-0">
            {currentStep === 3 ? 'Criar conta e assinar' : 'Continuar'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
