import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function Informacoes() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Informações do App</h2>
        <p className="text-muted-foreground">
          Configure as informações básicas do seu aplicativo
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Nome da loja */}
        <div className="space-y-2">
          <Label htmlFor="store-name">Nome da Loja</Label>
          <Input
            id="store-name"
            defaultValue="PizzaExpress"
            placeholder="Nome da sua loja"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Descreva sua loja..."
            defaultValue="As melhores pizzas da região com entrega rápida"
          />
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label htmlFor="logo">Logo (URL)</Label>
          <Input
            id="logo"
            placeholder="https://exemplo.com/logo.png"
          />
          <p className="text-xs text-muted-foreground">
            Recomendado: 512x512px, formato PNG ou SVG
          </p>
        </div>

        {/* Contatos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-9999"
              defaultValue="(11) 98765-4321"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="contato@loja.com"
              defaultValue="contato@pizzaexpress.com"
            />
          </div>
        </div>

        {/* Endereço */}
        <div className="space-y-2">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            placeholder="Rua, número - Bairro, Cidade - UF"
            defaultValue="Rua das Pizzas, 123 - Centro, São Paulo - SP"
          />
        </div>

        {/* Redes sociais */}
        <div className="space-y-4">
          <h3 className="font-semibold">Redes Sociais</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                placeholder="@pizzaexpress"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                placeholder="facebook.com/pizzaexpress"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button>Salvar Informações</Button>
        </div>
      </Card>
    </div>
  );
}
