import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface Props {
  open: boolean;
  onClose: () => void;
  product: any;
}

export function ModalEditarProduto({ open, onClose, product }: Props) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
          <DialogDescription>
            Atualize as informações do produto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Código */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input id="code" defaultValue={product.code} />
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center space-x-2">
                <Switch id="active" defaultChecked={product.isActive} />
                <Label htmlFor="active">Ativo</Label>
              </div>
            </div>
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input id="name" defaultValue={product.name} />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              defaultValue={product.description}
              rows={3}
            />
          </div>

          {/* Preço */}
          <div className="space-y-2">
            <Label htmlFor="price">Preço</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              defaultValue={product.price}
            />
          </div>

          {/* Imagem */}
          <div className="space-y-2">
            <Label htmlFor="image">URL da Imagem</Label>
            <Input id="image" defaultValue={product.image} />
          </div>

          {/* Preview da imagem */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={onClose}>Salvar Alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
