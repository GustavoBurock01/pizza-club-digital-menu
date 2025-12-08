import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UserRoleSelector, type UserRole } from './UserRoleSelector';
import { Loader2, User, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
}

interface UserEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onSave: (userId: string, data: Partial<UserData>) => Promise<void>;
  onChangeRole: (userId: string, newRole: UserRole) => Promise<void>;
}

export function UserEditModal({ 
  open, 
  onOpenChange, 
  user, 
  onSave,
  onChangeRole 
}: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<UserData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRoleChanged, setHasRoleChanged] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        is_active: user.is_active
      });
      setHasRoleChanged(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Se o papel mudou, usar a edge function específica
      if (hasRoleChanged && formData.role && formData.role !== user.role) {
        await onChangeRole(user.id, formData.role);
      }

      // Salvar outros dados
      const { role, ...otherData } = formData;
      await onSave(user.id, otherData);
      
      toast.success('Usuário atualizado com sucesso');
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar usuário');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setFormData(prev => ({ ...prev, role: newRole }));
    setHasRoleChanged(newRole !== user?.role);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(99) 99999-9999"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="is_active">Status da conta</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_active ? 'Conta ativa' : 'Conta desativada'}
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Papel no sistema</Label>
              <UserRoleSelector
                value={formData.role || 'customer'}
                onChange={handleRoleChange}
              />
              {hasRoleChanged && (
                <p className="text-xs text-amber-600">
                  ⚠️ Alterar o papel requer confirmação de segurança
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
