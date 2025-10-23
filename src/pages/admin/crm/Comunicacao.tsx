import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Send, Calendar, Users, TrendingUp } from 'lucide-react';

const campaigns = [
  {
    id: 1,
    name: 'Promoção Final de Semana',
    type: 'email',
    status: 'sent',
    segment: 'VIP',
    sent: 67,
    opened: 54,
    clicked: 32,
    converted: 18,
    date: '2024-01-20',
  },
  {
    id: 2,
    name: 'Cupom de Reativação',
    type: 'sms',
    status: 'sent',
    segment: 'Inativos',
    sent: 34,
    opened: 30,
    clicked: 12,
    converted: 8,
    date: '2024-01-18',
  },
  {
    id: 3,
    name: 'Novidades do Cardápio',
    type: 'email',
    status: 'scheduled',
    segment: 'Todos',
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    date: '2024-01-25',
  },
];

const templates = [
  { id: 1, name: 'Promoção Semanal', type: 'email' },
  { id: 2, name: 'Cupom de Desconto', type: 'email' },
  { id: 3, name: 'Reativação de Cliente', type: 'sms' },
  { id: 4, name: 'Novidades', type: 'email' },
];

export default function Comunicacao() {
  const [isCreating, setIsCreating] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="default">Enviada</Badge>;
      case 'scheduled':
        return <Badge variant="secondary">Agendada</Badge>;
      case 'draft':
        return <Badge variant="outline">Rascunho</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'email':
        return (
          <Badge variant="outline" className="gap-1">
            <Mail className="h-3 w-3" />
            Email
          </Badge>
        );
      case 'sms':
        return (
          <Badge variant="outline" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            SMS
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Send className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Campanhas Enviadas</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Mail className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
              <p className="text-2xl font-bold">78%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold">24%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-secondary rounded-lg">
              <Users className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alcance Total</p>
              <p className="text-2xl font-bold">1.2k</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Criar Nova Campanha */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Campanhas de Comunicação</h3>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Campanha</DialogTitle>
                <DialogDescription>
                  Configure uma nova campanha de comunicação com seus clientes
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Campanha</Label>
                    <Input placeholder="Ex: Promoção de Verão" />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select defaultValue="email">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Segmento</Label>
                    <Select defaultValue="all">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                        <SelectItem value="frequente">Frequente</SelectItem>
                        <SelectItem value="ocasional">Ocasional</SelectItem>
                        <SelectItem value="inativos">Inativos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Template</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Assunto</Label>
                  <Input placeholder="Digite o assunto do email" />
                </div>

                <div className="space-y-2">
                  <Label>Mensagem</Label>
                  <Textarea 
                    placeholder="Digite sua mensagem aqui..."
                    rows={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Agendar Envio</Label>
                  <Input type="datetime-local" />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Agora
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Campanhas */}
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{campaign.name}</h4>
                    {getTypeBadge(campaign.type)}
                    {getStatusBadge(campaign.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Segmento: {campaign.segment} • Data: {campaign.date}
                  </p>
                </div>
              </div>

              {campaign.status === 'sent' && (
                <div className="grid grid-cols-4 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Enviados</p>
                    <p className="text-xl font-bold">{campaign.sent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Abertos</p>
                    <p className="text-xl font-bold text-blue-500">
                      {campaign.opened}
                      <span className="text-sm ml-1">
                        ({((campaign.opened / campaign.sent) * 100).toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cliques</p>
                    <p className="text-xl font-bold text-purple-500">
                      {campaign.clicked}
                      <span className="text-sm ml-1">
                        ({((campaign.clicked / campaign.sent) * 100).toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Conversões</p>
                    <p className="text-xl font-bold text-green-500">
                      {campaign.converted}
                      <span className="text-sm ml-1">
                        ({((campaign.converted / campaign.sent) * 100).toFixed(0)}%)
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
