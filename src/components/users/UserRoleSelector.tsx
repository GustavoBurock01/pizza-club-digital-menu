import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Shield, Headphones, UserCheck, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type UserRole = 'admin' | 'attendant' | 'seller' | 'customer';

interface RoleOption {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const roleOptions: RoleOption[] = [
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acesso total ao sistema, configurações e relatórios',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-red-500'
  },
  {
    value: 'attendant',
    label: 'Atendente',
    description: 'Gerencia pedidos, atende clientes e imprime comandas',
    icon: <Headphones className="h-5 w-5" />,
    color: 'text-blue-500'
  },
  {
    value: 'seller',
    label: 'Vendedor',
    description: 'Acesso ao PDV e registro de vendas presenciais',
    icon: <UserCheck className="h-5 w-5" />,
    color: 'text-green-500'
  },
  {
    value: 'customer',
    label: 'Cliente',
    description: 'Acesso apenas à área do cliente e pedidos',
    icon: <Users className="h-5 w-5" />,
    color: 'text-muted-foreground'
  }
];

interface UserRoleSelectorProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  excludeRoles?: UserRole[];
}

export function UserRoleSelector({ 
  value, 
  onChange, 
  disabled = false,
  excludeRoles = []
}: UserRoleSelectorProps) {
  const availableRoles = roleOptions.filter(role => !excludeRoles.includes(role.value));

  return (
    <RadioGroup
      value={value}
      onValueChange={(val) => onChange(val as UserRole)}
      disabled={disabled}
      className="space-y-3"
    >
      {availableRoles.map((role) => (
        <div key={role.value} className="relative">
          <RadioGroupItem
            value={role.value}
            id={role.value}
            className="peer sr-only"
          />
          <Label
            htmlFor={role.value}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
              "hover:bg-muted/50",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
              "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn("mt-0.5", role.color)}>
              {role.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium">{role.label}</div>
              <p className="text-sm text-muted-foreground">
                {role.description}
              </p>
            </div>
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

export function getRoleBadgeConfig(role: UserRole) {
  const config = {
    admin: { label: 'Admin', variant: 'default' as const, color: 'bg-red-500' },
    attendant: { label: 'Atendente', variant: 'secondary' as const, color: 'bg-blue-500' },
    seller: { label: 'Vendedor', variant: 'outline' as const, color: 'bg-green-500' },
    customer: { label: 'Cliente', variant: 'outline' as const, color: 'bg-gray-500' }
  };
  return config[role] || config.customer;
}
